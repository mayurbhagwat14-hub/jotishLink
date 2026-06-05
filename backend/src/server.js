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
import { initFirebase } from './config/firebase.config.js';

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
import callRoutes from './routes/call.routes.js';

// Models (needed for Socket.IO session persistence)
import ChatSession from './models/chatSession.model.js';
import Astrologer from './models/astrologer.model.js';
import User from './models/user.model.js';
import WalletService from './services/wallet.service.js';
import SystemSettings from './models/systemSettings.model.js';

// ──────────────────────────────────────────────
//  App & HTTP Server Setup
// ──────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// Connect to DB
connectDB();

// Initialize Firebase Admin SDK
initFirebase();

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

// ── Track timers for billing (roomId -> { intervalId, seconds, astrologerRate, sessionId, userId, isBot })
const activeTimers = new Map();
// ── Track socket associations for strict disconnect handling (socket.id -> roomId)
const socketRoomMap = new Map();
// ── Track pending session requests (roomId -> { userSocketId, userId, astrologerId, type })
const pendingRequests = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // ── Astrologer joins their notification room
  socket.on('join_astrologer_room', ({ astrologerId }) => {
    socket.join(`astro_${astrologerId}`);
    console.log(`[Socket.IO] Astrologer ${astrologerId} joined their notification room`);
  });

  // ── User requests a session
  socket.on('request_session', async ({ astrologerId, userId, userName, type, durationLimit, callId }) => {
    try {
      const Astrologer = (await import('./models/astrologer.model.js')).default;
      const astrologer = await Astrologer.findById(astrologerId);
      
      if (!astrologer || astrologer.onlineStatus === 'offline') {
        io.to(socket.id).emit('session_rejected', { reason: 'Astrologer is currently offline.' });
        return;
      }
      
      if (astrologer.onlineStatus === 'busy') {
        io.to(socket.id).emit('session_rejected', { reason: 'Astrologer is currently busy.' });
        return;
      }
    } catch (err) {
      console.error('[Socket.IO] Busy check failed:', err.message);
    }

    const roomId = `room_${Date.now()}_${userId}`;
    pendingRequests.set(roomId, { userSocketId: socket.id, userId, astrologerId, type });

    io.to(`astro_${astrologerId}`).emit('incoming_session_request', {
      roomId,
      userId,
      astrologerId,
      userName,
      type, // 'chat', 'video', 'audio'
      durationLimit,
      callId,
      userSocketId: socket.id
    });
    console.log(`[Socket.IO] User ${userId} requested ${type} session with Astrologer ${astrologerId}`);
  });

  // ── User cancels their session request
  socket.on('cancel_session_request', async ({ astrologerId, userId, roomId }) => {
    io.to(`astro_${astrologerId}`).emit('session_request_cancelled', { userId, roomId });
    if (roomId) pendingRequests.delete(roomId);
    console.log(`[Socket.IO] User ${userId} cancelled request to Astrologer ${astrologerId}`);
  });

  // ── Astrologer accepts session
  socket.on('accept_session', ({ roomId, userSocketId, astrologerId }) => {
    pendingRequests.delete(roomId);
    // Notify user
    io.to(userSocketId).emit('session_accepted', { roomId });
    // Notify astrologer's own socket too (confirmation)
    socket.emit('session_accept_confirmed', { roomId });
    console.log(`[Socket.IO] Session accepted. Room: ${roomId}`);
  });

  // ── Astrologer rejects session
  socket.on('reject_session', ({ roomId, userSocketId, reason }) => {
    if (roomId) pendingRequests.delete(roomId);
    io.to(userSocketId).emit('session_rejected', { reason: reason || 'Astrologer is busy right now.' });
    console.log(`[Socket.IO] Astrologer rejected session. Reason: ${reason}`);
  });

  // ── Join a call room for audio/video (no DB session creation)
  socket.on('join_call_room', ({ roomId }) => {
    socket.join(roomId);
    socketRoomMap.set(socket.id, { roomId, type: 'audio_call' });
    console.log(`[Socket.IO] Socket ${socket.id} joined call room ${roomId}`);
  });

  // ── Join a chat room
  socket.on('join_room', async ({ roomId, userId, astrologerId, isBot, sessionType }) => {
    socket.join(roomId);
    socketRoomMap.set(socket.id, { roomId, type: 'chat_session', astrologerId });
    socket.to(roomId).emit('user_joined', { userId, message: 'A user has joined the session' });
    console.log(`[Socket.IO] ${userId} joined room ${roomId} (Type: ${sessionType || 'chat'})`);

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
          type: sessionType || 'chat',
          messages: [welcomeMessage],
        });
        console.log(`[Socket.IO] Created ChatSession in DB with welcome message: ${session._id}`);

        if (isBot) {
          // Free chat will be marked as used on completion or transition
        }
      } else if (!session.astrologerId && astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/)) {
        session.astrologerId = astrologerId;
        await session.save();
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

  // ── Start Bot Timer (Dynamic free chat duration)
  socket.on('start_bot_timer', async ({ roomId, sessionId, userId }) => {
    if (activeTimers.has(roomId)) return;

    let settings = await SystemSettings.findOne();
    let durationSeconds = (settings?.freeChatDuration || 1) * 60;

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      const timerData = activeTimers.get(roomId);
      if (timerData) timerData.seconds = seconds;
      io.to(roomId).emit('timer_tick', { seconds, isBot: true });

      if (seconds >= durationSeconds) {
        io.to(roomId).emit('bot_time_up', { roomId, sessionId });
        clearInterval(intervalId);
        activeTimers.delete(roomId);
        
        await User.findByIdAndUpdate(userId, { 
          freeChatUsed: true, 
          freeChatUsedAt: new Date(), 
          freeChatDuration: settings?.freeChatDuration || 1 
        });
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, sessionId, userId, isBot: true });
    console.log(`[Socket.IO] Bot Timer started for room ${roomId} (${durationSeconds}s)`);
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
      
      let settings = await SystemSettings.findOne();
      // Mark user's free chat offer as used in backend
      await User.findByIdAndUpdate(userId, { 
        freeChatUsed: true, 
        freeChatUsedAt: new Date(), 
        freeChatDuration: settings?.freeChatDuration || 1 
      });
    } catch (e) {
      console.error('Transition DB error:', e.message);
    }

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      const timerData = activeTimers.get(roomId);
      if (timerData) timerData.seconds = seconds;
      io.to(roomId).emit('timer_tick', { seconds, isBot: false });

      const currentCost = (seconds * astrologerRate) / 60;
      if (!timerData) return;
      const deltaCost = currentCost - (timerData.lastDeducted || 0);

      try {
        const user = await User.findById(userId);
        if (!user || user.wallet < deltaCost) {
          // Insufficient balance — end session
          io.to(roomId).emit('wallet_low_balance');
          io.to(roomId).emit('session_ended', {
            reason: 'insufficient_balance',
            durationSeconds: seconds - 1,
          });
          handleEndSession({ roomId, sessionId, userId, endedBy: 'system', finalSeconds: seconds - 1, sessionType: 'chat' });
          return;
        }

        if (seconds % 5 === 0) {
          user.wallet -= deltaCost;
          await user.save();
          timerData.lastDeducted = currentCost;
          io.to(roomId).emit('wallet_update', { deducted: deltaCost, newBalance: user.wallet });
        }
      } catch (err) {
        console.error('[Socket.IO] Billing error:', err.message);
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, sessionId, userId, isBot: false, lastDeducted: 0, sessionType: 'chat' });
    console.log(`[Socket.IO] Transitioned room ${roomId} to real chat with rate ${astrologerRate}`);
  });

  // ── Start session timer (called when chat begins)
  socket.on('start_timer', async ({ roomId, sessionId, userId, astrologerRate }) => {
    if (activeTimers.has(roomId)) return; // Already running

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      const timerData = activeTimers.get(roomId);
      if (timerData) timerData.seconds = seconds;
      io.to(roomId).emit('timer_tick', { seconds });

      const currentCost = (seconds * astrologerRate) / 60;
      if (!timerData) return;
      const deltaCost = currentCost - (timerData.lastDeducted || 0);

      try {
        const user = await User.findById(userId);
        if (!user || user.wallet < deltaCost) {
          // Insufficient balance — end session
          io.to(roomId).emit('wallet_low_balance');
          io.to(roomId).emit('session_ended', {
            reason: 'insufficient_balance',
            durationSeconds: seconds - 1,
          });
          handleEndSession({ roomId, sessionId, userId, endedBy: 'system', finalSeconds: seconds - 1, sessionType: 'chat' });
          return;
        }

        if (seconds % 5 === 0) {
          user.wallet -= deltaCost;
          await user.save();
          timerData.lastDeducted = currentCost;
          io.to(roomId).emit('wallet_update', { deducted: deltaCost, newBalance: user.wallet });
        }
      } catch (err) {
        console.error('[Socket.IO] Billing error:', err.message);
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, sessionId, userId, lastDeducted: 0, sessionType: 'chat' });
    console.log(`[Socket.IO] Timer started for room ${roomId}`);
  });

  // ── End session manually
  const handleEndSession = async ({ roomId, sessionId, userId, endedBy = 'user', finalSeconds, sessionType = 'chat' }) => {
    const timerData = activeTimers.get(roomId);
    let finalSessionId = sessionId;
    if (timerData) {
      finalSessionId = finalSessionId || timerData.sessionId;
      clearInterval(timerData.intervalId);
      activeTimers.delete(roomId);
    }

    const duration = finalSeconds !== undefined ? finalSeconds : (timerData?.seconds || 0);
    const rate = timerData?.astrologerRate || 0;
    const currentCost = (duration * rate) / 60;
    const lastDeducted = timerData?.lastDeducted || 0;
    const remainingDelta = currentCost - lastDeducted;

    const endPayload = {
      reason: `${endedBy}_ended`,
      durationSeconds: duration,
      amountDeducted: currentCost,
      sessionId: finalSessionId,
      roomId,
    };

    io.to(roomId).emit('session_ended', endPayload);

    let astroId = null;
    const roomInfo = socketRoomMap.get(socket.id);
    if (roomInfo && roomInfo.astrologerId) astroId = roomInfo.astrologerId;

    try {
      if (finalSessionId && !astroId) {
        const sessionForEnd = await ChatSession.findById(finalSessionId);
        if (sessionForEnd?.astrologerId) astroId = sessionForEnd.astrologerId;
      }
      if (astroId) {
         io.to(`astro_${astroId}`).emit('session_ended', { ...endPayload, sessionId: finalSessionId });
      }
    } catch (e) { /* ignore */ }

    // Final deduction and commission
    try {
      if (!finalSessionId) return;
      const session = await ChatSession.findById(finalSessionId);
      if (session && session.status === 'ongoing') {
        session.status = 'completed';
        session.durationSeconds = duration;
        session.amountDeducted = currentCost;
        await session.save();

        if (currentCost > 0 && userId) {
           const user = await User.findById(userId);
           if (user && remainingDelta > 0) {
             user.wallet = Math.max(0, user.wallet - remainingDelta);
             await user.save();
           }
           const Transaction = (await import('./models/transaction.model.js')).default;
           
           let sessionTypeLabel = 'Chat Session';
           if (session.type === 'audio_call' || session.type === 'audio') sessionTypeLabel = 'Audio Call';
           if (session.type === 'video_call' || session.type === 'video') sessionTypeLabel = 'Video Call';

           await Transaction.create({ userId, type: 'deduction', amount: -currentCost, desc: `${sessionTypeLabel} Cost (${duration}s)` });

           const sys = await SystemSettings.findOne();
           const comm = (session.type === 'audio_call' || session.type === 'audio') ? (sys?.commissionRates?.audioCall || sys?.commissionRates?.chat || 20) :
                        (session.type === 'video_call' || session.type === 'video') ? (sys?.commissionRates?.videoCall || sys?.commissionRates?.chat || 20) :
                        (sys?.commissionRates?.chat || 20);

           const creditRes = await WalletService.creditAstrologer(session.astrologerId, userId, finalSessionId, session.type || 'chat', currentCost, `${sessionTypeLabel} Earning`, comm);
           if (creditRes && creditRes.netAmount) {
             io.to(`astro_${session.astrologerId}`).emit('earning_credited', { netAmount: creditRes.netAmount, sessionId: session._id });
           }
        }
      }
      if (session) {
        await Astrologer.findOneAndUpdate({ _id: session.astrologerId }, { onlineStatus: 'online' });
      }
    } catch (err) {
      console.error('[Socket.IO] Session end error:', err.message);
    }
    console.log(`[Socket.IO] Session ended for room ${roomId}`);
  };

  socket.on('end_session', handleEndSession);

  // ── Call Wallet & Auto Disconnect Loop ──
  socket.on('start_call', async ({ roomId, callId, userId, astrologerRate, type = 'audio' }) => {
    if (activeTimers.has(roomId)) return;

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      const timerData = activeTimers.get(roomId);
      if (timerData) timerData.seconds = seconds;
      io.to(roomId).emit('call_time_update', { seconds });

      const currentCost = (seconds * astrologerRate) / 60;
      if (!timerData) return;
      const deltaCost = currentCost - (timerData.lastDeducted || 0);

      try {
        const user = await User.findById(userId);
        if (!user || user.wallet < deltaCost) {
          // Insufficient balance, auto disconnect
          io.to(roomId).emit('wallet_low_balance');
          io.to(roomId).emit('call_ended', { reason: 'insufficient_balance' });
          handleEndCall({ roomId, callId, userId, endedBy: 'system', finalSeconds: seconds - 1 });
          return;
        }

        if (seconds % 5 === 0) {
          user.wallet -= deltaCost;
          await user.save();
          timerData.lastDeducted = currentCost;
          io.to(roomId).emit('wallet_update', { deducted: deltaCost, newBalance: user.wallet });
        }
      } catch (err) {
        console.error('[Socket.IO] Call Billing error:', err.message);
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, callId, userId, type, lastDeducted: 0 });
    console.log(`[Socket.IO] ${type} Call Timer started for room ${roomId}`);
  });

  const handleEndCall = async ({ roomId, callId, userId, endedBy = 'user', finalSeconds }) => {
    const timerData = activeTimers.get(roomId);
    if (timerData) {
      clearInterval(timerData.intervalId);
      activeTimers.delete(roomId);
    }

    const duration = finalSeconds !== undefined ? finalSeconds : (timerData?.seconds || 0);
    const rate = timerData?.astrologerRate || 0;
    const type = timerData?.type || 'audio';
    const currentCost = (duration * rate) / 60;
    const lastDeducted = timerData?.lastDeducted || 0;
    const remainingDelta = currentCost - lastDeducted;

    io.to(roomId).emit('call_ended', { reason: `${endedBy}_ended`, roomId });
    try {
      if (timerData && timerData.astrologerId) {
        io.to(`astro_${timerData.astrologerId}`).emit('call_ended', { reason: `${endedBy}_ended`, roomId });
      } else {
        const { CallSession } = await import('./models/callSession.model.js');
        const sess = await CallSession.findOne({ callId });
        if (sess) io.to(`astro_${sess.astrologerId}`).emit('call_ended', { reason: `${endedBy}_ended`, roomId });
      }
    } catch (e) { /* ignore */ }

    try {
      const { CallSession } = await import('./models/callSession.model.js');
      const session = await CallSession.findOne({ callId });
      if (session && (session.status === 'accepted' || session.status === 'ongoing' || session.status === 'ringing')) {
        session.status = 'completed';
        session.duration = duration;
        session.endTime = new Date();
        session.totalAmount = currentCost;
        await session.save();

        if (currentCost > 0 && userId) {
           const user = await User.findById(userId);
           if (user && remainingDelta > 0) {
             user.wallet = Math.max(0, user.wallet - remainingDelta);
             await user.save();
           }
           const Transaction = (await import('./models/transaction.model.js')).default;
           await Transaction.create({ userId, type: 'deduction', amount: -currentCost, desc: `${type} Call Cost (${duration}s)` });

           const sys = await SystemSettings.findOne();
           const comm = type === 'video' ? (sys?.commissionRates?.videoCall || 25) : (sys?.commissionRates?.audioCall || 15);
           const creditRes = await WalletService.creditAstrologer(session.astrologerId, userId, session._id, type, currentCost, `${type} Call Earning`, comm);
           if (creditRes && creditRes.netAmount) {
             io.to(`astro_${session.astrologerId}`).emit('earning_credited', { netAmount: creditRes.netAmount, sessionId: session._id });
           }
        }
        await Astrologer.findByIdAndUpdate(session.astrologerId, { onlineStatus: 'online' });
      }
    } catch (err) {
      console.error('[Socket.IO] Call end error:', err.message);
    }
    console.log(`[Socket.IO] Call ended for room ${roomId}`);
  };

  socket.on('end_call', handleEndCall);

  // ── Astrologer status update
  socket.on('update_status', async ({ astrologerId, status }) => {
    try {
      await Astrologer.findOneAndUpdate({ _id: astrologerId }, { onlineStatus: status });
      
      if (status === 'online') {
        // Self-healing: clear any stuck ongoing sessions in DB
        const { CallSession } = await import('./models/callSession.model.js');
        await CallSession.updateMany(
          { astrologerId, status: { $in: ['accepted', 'ongoing', 'ringing'] } },
          { $set: { status: 'completed', endTime: new Date() } }
        );
        const ChatSession = (await import('./models/chatSession.model.js')).default;
        await ChatSession.updateMany(
          { astrologerId, status: 'ongoing' },
          { $set: { status: 'completed' } }
        );
      }

      io.emit('astrologer_status_changed', { astrologerId, status });
    } catch (err) {
      console.error('[Socket.IO] Status update error:', err.message);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    
    // Strict Disconnect Handling
    const roomInfo = socketRoomMap.get(socket.id);
    if (roomInfo) {
      const { roomId, astrologerId } = roomInfo;
      const timerData = activeTimers.get(roomId);
      
      // Always emit to room and astrologer so UI can clear ghost active sessions
      io.to(roomId).emit('call_ended', { reason: 'peer_disconnected', roomId });
      io.to(roomId).emit('session_ended', { reason: 'peer_disconnected', roomId });
      const targetAstroId = (timerData && timerData.astrologerId) || astrologerId;
      if (targetAstroId) {
         io.to(`astro_${targetAstroId}`).emit('call_ended', { reason: 'peer_disconnected', roomId });
         io.to(`astro_${targetAstroId}`).emit('session_ended', { reason: 'peer_disconnected', roomId });
      }

      if (timerData) {
        if (timerData.callId) {
          await handleEndCall({ roomId, callId: timerData.callId, userId: timerData.userId, endedBy: 'peer_disconnected', finalSeconds: timerData.seconds });
        } else if (timerData.sessionId) {
          await handleEndSession({ roomId, sessionId: timerData.sessionId, userId: timerData.userId, endedBy: 'peer_disconnected', finalSeconds: timerData.seconds, sessionType: timerData.sessionType });
        }
      }
      
      socketRoomMap.delete(socket.id);
    }
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
app.use('/api', callRoutes);

// Health check & Root
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
  res.json({ success: true, message: 'JyotishLink Backend API is running perfectly!', status: 'ok' });
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
