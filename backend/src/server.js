import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { apiLimiter as apiRateLimiter } from './middlewares/rateLimiter.middleware.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import astrologerRoutes from './routes/astrologer.routes.js';
import adminRoutes from './routes/admin.routes.js';
import agoraRoutes from './routes/agora.routes.js';
import chatRoutes from './routes/chat.routes.js';
import storeRoutes from './routes/store.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import notificationRoutes from './routes/notification.routes.js';

// Models (needed for Socket.IO session persistence)
import ChatSession from './models/chatSession.model.js';
import Astrologer from './models/astrologer.model.js';
import User from './models/user.model.js';
import WalletService from './services/wallet.service.js';

// ──────────────────────────────────────────────
//  App & HTTP Server Setup
// ──────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ──────────────────────────────────────────────
//  Socket.IO — Real-Time Chat + Timers
// ──────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Track active session timers: { roomId -> { intervalId, seconds, astrologerRate, sessionId, userId } }
const activeTimers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // ── Astrologer joins their notification room
  socket.on('join_astrologer_room', ({ astrologerId }) => {
    socket.join(`astro_${astrologerId}`);
    console.log(`[Socket.IO] Astrologer ${astrologerId} joined their notification room`);
  });

  // ── User requests a session
  socket.on('request_session', ({ astrologerId, userId, userName, type, durationLimit }) => {
    const roomId = `room_${Date.now()}_${userId}`;
    io.to(`astro_${astrologerId}`).emit('incoming_session_request', {
      roomId,
      userId,
      userName,
      type, // 'chat', 'video', 'audio'
      durationLimit,
      userSocketId: socket.id
    });
    console.log(`[Socket.IO] User ${userId} requested ${type} session with Astrologer ${astrologerId}`);
  });

  // ── User cancels their session request
  socket.on('cancel_session_request', ({ astrologerId, userId }) => {
    io.to(`astro_${astrologerId}`).emit('session_request_cancelled', { userId });
    console.log(`[Socket.IO] User ${userId} cancelled session request with Astrologer ${astrologerId}`);
  });

  // ── Astrologer accepts session
  socket.on('accept_session', ({ roomId, userSocketId }) => {
    io.to(userSocketId).emit('session_accepted', { roomId });
    console.log(`[Socket.IO] Astrologer accepted session. Room: ${roomId}`);
  });

  // ── Astrologer rejects session
  socket.on('reject_session', ({ userSocketId, reason }) => {
    io.to(userSocketId).emit('session_rejected', { reason: reason || 'Astrologer is busy right now.' });
    console.log(`[Socket.IO] Astrologer rejected session. Reason: ${reason}`);
  });

  // ── Join a chat room
  socket.on('join_room', async ({ roomId, userId, astrologerId, isBot }) => {
    socket.join(roomId);
    socket.to(roomId).emit('user_joined', { userId, message: 'A user has joined the session' });
    console.log(`[Socket.IO] ${userId} joined room ${roomId}`);

    try {
      // Find or create the real Mongoose ChatSession
      let session = await ChatSession.findOne({ roomId });
      if (!session) {
        // Fetch astrologer name to personalize the welcome message
        let astroName = 'Astrologer';
        if (astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/)) {
          const astroDoc = await Astrologer.findOne({ userId: astrologerId });
          if (astroDoc) {
            astroName = astroDoc.name || 'Astrologer';
          }
        }

        const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const welcomeText = `Namaste, welcome! I am ${astroName}. Please share your name, date of birth, time of birth, and place of birth, along with your question. I am analyzing your chart now.`;
        const welcomeMessage = { sender: 'bot', text: welcomeText, time };

        session = await ChatSession.create({
          roomId,
          userId,
          astrologerId: astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/) ? astrologerId : undefined,
          isBotSession: !!isBot,
          status: 'ongoing',
          messages: [welcomeMessage],
        });
        console.log(`[Socket.IO] Created ChatSession in DB with welcome message: ${session._id}`);

        if (isBot) {
          await User.findByIdAndUpdate(userId, { hasUsedFreeChat: true });
          console.log(`[Socket.IO] Marked user ${userId} as having used free chat.`);
        }
      }
      socket.emit('session_created', { sessionId: session._id, messages: session.messages });
    } catch (err) {
      console.error('[Socket.IO] Join room DB error:', err.message);
    }
  });

  // ── Send a message
  socket.on('send_message', async ({ roomId, sessionId, sender, text }) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const message = { sender, text, time };

    // Persist message to DB
    try {
      const session = await ChatSession.findByIdAndUpdate(sessionId, {
        $push: { messages: message },
      });

      io.to(roomId).emit('receive_message', message);

      // Trigger AI Bot if this session exists in DB and sender is user (keep demo responsive)
      if (session && session.isBotSession && sender === 'user') {
        const AiService = (await import('./services/ai.service.js')).default;
        setTimeout(async () => {
          try {
            const botReply = await AiService.getChatResponse(text);
            const botTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const botMsg = { sender: 'bot', text: botReply, time: botTime };
            await ChatSession.findByIdAndUpdate(sessionId, { $push: { messages: botMsg } });
            io.to(roomId).emit('receive_message', botMsg);
          } catch (e) {
            console.error('Bot reply error:', e.message);
          }
        }, 1500);
      }
    } catch (err) {
      console.error('[Socket.IO] Failed to persist message:', err.message);
    }
  });

  // ── Start Bot Timer (20 seconds free chat)
  socket.on('start_bot_timer', async ({ roomId, sessionId, userId }) => {
    if (activeTimers.has(roomId)) return;

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      io.to(roomId).emit('timer_tick', { seconds, isBot: true });

      // Exactly 20 seconds
      if (seconds >= 20) {
        io.to(roomId).emit('bot_time_up', { roomId, sessionId });
        clearInterval(intervalId);
        activeTimers.delete(roomId);
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, sessionId, userId, isBot: true });
    console.log(`[Socket.IO] Bot Timer started for room ${roomId}`);
  });

  // ── Transition to Real Chat (called after 2 mins if user has balance)
  socket.on('transition_to_real_chat', async ({ roomId, sessionId, userId, astrologerRate }) => {
    const timerData = activeTimers.get(roomId);
    if (timerData) {
      clearInterval(timerData.intervalId);
      activeTimers.delete(roomId);
    }

    try {
      // Mark session as real (no longer bot session) in the DB
      await ChatSession.findByIdAndUpdate(sessionId, { isBotSession: false });
      
      // Mark user's free chat offer as used in backend
      await User.findByIdAndUpdate(userId, { hasUsedFreeChat: true });
    } catch (e) {
      console.error('Transition DB error:', e.message);
    }

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      io.to(roomId).emit('timer_tick', { seconds, isBot: false });

      // Deduct every 60 seconds (per minute billing)
      if (seconds % 60 === 0) {
        try {
          const user = await User.findById(userId);
          if (!user || user.wallet < astrologerRate) {
            // Insufficient balance — end session
            io.to(roomId).emit('session_ended', {
              reason: 'insufficient_balance',
              durationSeconds: seconds,
            });
            clearInterval(intervalId);
            activeTimers.delete(roomId);

            await ChatSession.findByIdAndUpdate(sessionId, {
              status: 'completed',
              durationSeconds: seconds,
              amountDeducted: Math.floor(seconds / 60) * astrologerRate,
            });
          } else {
            await WalletService.deduct(userId, astrologerRate, `Chat session - 1 min`);
            io.to(roomId).emit('wallet_update', { deducted: astrologerRate, newBalance: user.wallet - astrologerRate });
          }
        } catch (err) {
          console.error('[Socket.IO] Billing error:', err.message);
        }
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, sessionId, userId, isBot: false });
    console.log(`[Socket.IO] Transitioned room ${roomId} to real chat with rate ${astrologerRate}`);
  });

  // ── Start session timer (called when chat begins)
  socket.on('start_timer', async ({ roomId, sessionId, userId, astrologerRate }) => {
    if (activeTimers.has(roomId)) return; // Already running

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      io.to(roomId).emit('timer_tick', { seconds });

      // Deduct every 60 seconds (per minute billing)
      if (seconds % 60 === 0) {
        try {
          const user = await User.findById(userId);
          if (!user || user.wallet < astrologerRate) {
            // Insufficient balance — end session
            io.to(roomId).emit('session_ended', {
              reason: 'insufficient_balance',
              durationSeconds: seconds,
            });
            clearInterval(intervalId);
            activeTimers.delete(roomId);

            // Update session status
            await ChatSession.findByIdAndUpdate(sessionId, {
              status: 'completed',
              durationSeconds: seconds,
              amountDeducted: Math.floor(seconds / 60) * astrologerRate,
            });

            // Mark astrologer online
            const session = await ChatSession.findById(sessionId);
            if (session) {
              await Astrologer.findOneAndUpdate(
                { userId: session.astrologerId },
                { onlineStatus: 'online' }
              );
            }
          } else {
            await WalletService.deduct(userId, astrologerRate, `Chat session - 1 min`);
            io.to(roomId).emit('wallet_update', { deducted: astrologerRate });
          }
        } catch (err) {
          console.error('[Socket.IO] Billing error:', err.message);
        }
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, sessionId, userId });
    console.log(`[Socket.IO] Timer started for room ${roomId}`);
  });

  // ── End session manually
  socket.on('end_session', async ({ roomId, sessionId, userId, endedBy = 'user' }) => {
    const timerData = activeTimers.get(roomId);
    let finalSessionId = sessionId;
    if (timerData) {
      finalSessionId = finalSessionId || timerData.sessionId;
      clearInterval(timerData.intervalId);
      activeTimers.delete(roomId);
    }

    io.to(roomId).emit('session_ended', {
      reason: `${endedBy}_ended`,
      durationSeconds: timerData?.seconds || 0,
    });

    // Mark session complete
    try {
      const session = await ChatSession.findById(finalSessionId);
      if (session && session.status === 'ongoing') {
        session.status = 'completed';
        session.durationSeconds = timerData?.seconds || 0;
        await session.save();
      }
      if (session) {
        await Astrologer.findOneAndUpdate(
          { userId: session.astrologerId },
          { onlineStatus: 'online' }
        );
      }
    } catch (err) {
      console.error('[Socket.IO] Session end error:', err.message);
    }
    console.log(`[Socket.IO] Session ended for room ${roomId}`);
  });

  // ── Astrologer status update
  socket.on('update_status', async ({ astrologerId, status }) => {
    try {
      await Astrologer.findOneAndUpdate({ userId: astrologerId }, { onlineStatus: status });
      io.emit('astrologer_status_changed', { astrologerId, status });
    } catch (err) {
      console.error('[Socket.IO] Status update error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ──────────────────────────────────────────────
//  Express Middleware
// ──────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(apiRateLimiter);

// ──────────────────────────────────────────────
//  API Routes
// ──────────────────────────────────────────────
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', astrologerRoutes);
app.use('/api', adminRoutes);
app.use('/api', agoraRoutes);
app.use('/api', chatRoutes);
app.use('/api', storeRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Centralized error handler
app.use(errorHandler);

// ──────────────────────────────────────────────
//  Start Server
// ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`\n🚀 JyotishLink backend running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready for real-time chat`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

export { app, httpServer, io };
