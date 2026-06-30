import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

// Automatically reload .env when it changes
if (fs.existsSync(envPath)) {
  fs.watch(envPath, (eventType) => {
    if (eventType === 'change') {
      dotenv.config({ override: true });
      console.log('Environment variables reloaded automatically due to .env change.');
    }
  });
}

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
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

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
import toolsRoutes from './routes/tools.routes.js';

// Models (needed for Socket.IO session persistence)
import ChatSession from './models/chatSession.model.js';
import Astrologer from './models/astrologer.model.js';
import User from './models/user.model.js';
import WalletService from './services/wallet.service.js';
import SystemSettings from './models/systemSettings.model.js';
import { initCronJobs } from './services/cron.service.js';

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
  'https://jotish-link.vercel.app',
  "https://jyotishlink.in",
  "https://www.jyotishlink.in",
  "https://jyotishlink.in/api",
  "https://www.jyotishlink.in/api",
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 5e6, // 5MB limit for image uploads
});

app.set('io', io);

// ── Track timers for billing (roomId -> { intervalId, seconds, astrologerRate, sessionId, userId, isBot })
const activeTimers = new Map();
// ── Track socket associations for strict disconnect handling (socket.id -> roomId)
const socketRoomMap = new Map();
// ── Track pending session requests (roomId -> { userSocketId, userId, astrologerId, type, timeoutId })
const pendingRequests = new Map();
const REQUEST_TIMEOUT_MS = 60 * 1000; // 60s timeout matching WaitingScreen.jsx
// ── Grace-period timers for chat disconnect auto-end (roomId -> timerId)
// When a chat user disconnects, we wait this long before auto-ending the session.
// If the user reconnects (join_room) within this window, the timer is cancelled.
const DISCONNECT_GRACE_PERIOD_MS = 90_000; // 90 seconds
const disconnectGraceTimers = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // ── Global Room Joins for App-wide Real-Time Sync
  socket.on('join_global_room', ({ userId, role }) => {
    if (role === 'admin' || role === 'superadmin') {
      socket.join('admin_room');
      console.log(`[Socket.IO] Admin ${userId} joined admin_room`);
    } else if (role === 'astrologer') {
      socket.join(`room_astro_${userId}`);
      console.log(`[Socket.IO] Astrologer ${userId} joined room_astro_${userId}`);
    } else if (role === 'user') {
      socket.join(`room_user_${userId}`);
      console.log(`[Socket.IO] User ${userId} joined room_user_${userId}`);
    }
  });

  // ── Legacy Astrologer joins their notification room (Keeping for backward compatibility)
  socket.on('join_astrologer_room', ({ astrologerId }) => {
    socket.join(`astro_${astrologerId}`);
    socket.join(`room_astro_${astrologerId}`);
    console.log(`[Socket.IO] Astrologer ${astrologerId} joined their legacy notification room`);
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
      console.error('[Socket.IO] Busy check failed:', err);
    }

    const roomId = `room_${Date.now()}_${userId}`;
    
    const timeoutId = setTimeout(() => {
      if (pendingRequests.has(roomId)) {
        pendingRequests.delete(roomId);
        io.to(`astro_${astrologerId}`).to(`room_astro_${astrologerId}`).emit('session_request_cancelled', { userId, roomId });
        io.to(socket.id).emit('request_expired', { roomId });
        console.log(`[Socket.IO] Request ${roomId} expired after ${REQUEST_TIMEOUT_MS}ms`);
      }
    }, REQUEST_TIMEOUT_MS);

    pendingRequests.set(roomId, { userSocketId: socket.id, userId, astrologerId, type, timeoutId });

    const incomingPayload = {
      roomId,
      userId,
      astrologerId,
      userName,
      type, // 'chat', 'video', 'audio'
      durationLimit,
      callId,
      userSocketId: socket.id
    };
    io.to(`astro_${astrologerId}`).to(`room_astro_${astrologerId}`).emit('incoming_session_request', incomingPayload);
    console.log(`[Socket.IO] User ${userId} requested ${type} session with Astrologer ${astrologerId}`);

    try {
      const { notify } = await import('./utils/notifyHelper.js');
      await notify({
        userId: astrologerId,
        role: 'astrologer',
        title: `Incoming ${type === 'chat' ? 'Chat' : 'Call'} Request`,
        message: `You have a new ${type} request from ${userName || 'a user'}.`,
        type: 'alert',
        link: type === 'chat' ? '/astrologer/chats' : '/astrologer/calls',
        data: { type: `incoming_${type}`, roomId }
      });
    } catch (err) {
      console.error('[Socket.IO] Notify failed:', err);
    }
  });

  // ── User cancels their session request
  socket.on('cancel_session_request', async ({ astrologerId, userId, roomId }) => {
    io.to(`astro_${astrologerId}`).to(`room_astro_${astrologerId}`).emit('session_request_cancelled', { userId, roomId });
    if (roomId && pendingRequests.has(roomId)) {
      const reqData = pendingRequests.get(roomId);
      if (reqData.timeoutId) clearTimeout(reqData.timeoutId);
      pendingRequests.delete(roomId);
    } else if (userId && astrologerId) {
      for (const [pendingRoomId, reqData] of pendingRequests.entries()) {
        if (reqData.userId === userId && reqData.astrologerId === astrologerId) {
          if (reqData.timeoutId) clearTimeout(reqData.timeoutId);
          pendingRequests.delete(pendingRoomId);
          io.to(`astro_${astrologerId}`).to(`room_astro_${astrologerId}`).emit('session_request_cancelled', { userId, roomId: pendingRoomId });
        }
      }
    }
    console.log(`[Socket.IO] User ${userId} cancelled request to Astrologer ${astrologerId}`);
  });

  // ── Astrologer accepts session
  socket.on('accept_session', async ({ roomId, userSocketId }) => {
    const reqData = pendingRequests.get(roomId);

    // Guard: if this request was already removed (e.g. user cancelled, expired, or another accept cleared it)
    if (!reqData) {
      socket.emit('accept_failed', { reason: 'This request has expired or is no longer available.' });
      return;
    }

    if (reqData.timeoutId) {
      clearTimeout(reqData.timeoutId);
    }

    if (reqData.astrologerId) {
      try {
        const Astrologer = (await import('./models/astrologer.model.js')).default;

        // Atomic conditional update: only set busy if NOT already busy.
        // This is the core race-condition guard — if two accepts fire simultaneously,
        // only the first one to reach the DB wins; the second gets null back.
        const updated = await Astrologer.findOneAndUpdate(
          { _id: reqData.astrologerId, onlineStatus: { $ne: 'busy' } },
          { onlineStatus: 'busy' },
          { new: true }
        );

        if (!updated) {
          // Astrologer was already busy (another accept won the race, or status changed).
          // Reject this accept attempt gracefully.
          console.log(`[Socket.IO] Accept race lost for room ${roomId} — astrologer ${reqData.astrologerId} already busy`);
          pendingRequests.delete(roomId);
          socket.emit('accept_failed', { reason: 'Aap pehle se ek session mein hain. You are already in an active session.' });
          io.to(userSocketId).emit('session_rejected', { reason: 'Astrologer just became unavailable. Please try another astrologer or wait.' });
          return;
        }

        io.emit('astro_status_changed', { astrologerId: reqData.astrologerId, status: 'busy' });

        // Capture name for user-facing decline messages
        var acceptedAstrologerName = updated.name || 'Astrologer';
      } catch (err) {
        console.error('Failed to set busy status:', err);
      }
    }

    pendingRequests.delete(roomId);

    // ── Auto-reject all OTHER pending requests for the same astrologer.
    // Now that this astrologer is busy, no other request can be accepted.
    // Notify those waiting users immediately instead of leaving them hanging.
    if (reqData.astrologerId) {
      const astroName = typeof acceptedAstrologerName === 'string' ? acceptedAstrologerName : 'Astrologer';
      const rejectedRequests = [];
      for (const [pendingRoomId, pendingData] of pendingRequests.entries()) {
        if (pendingData.astrologerId === reqData.astrologerId) {
          rejectedRequests.push({ roomId: pendingRoomId, ...pendingData });
        }
      }

      for (const rejectedRequest of rejectedRequests) {
        if (rejectedRequest.timeoutId) clearTimeout(rejectedRequest.timeoutId);
        pendingRequests.delete(rejectedRequest.roomId);

        // Tell astrologer frontend to remove this specific request card.
        io.to(`astro_${reqData.astrologerId}`).emit('session_request_cancelled', {
          userId: rejectedRequest.userId,
          roomId: rejectedRequest.roomId
        });
        io.to(`room_astro_${reqData.astrologerId}`).emit('session_request_cancelled', {
          userId: rejectedRequest.userId,
          roomId: rejectedRequest.roomId
        });

        // Dedicated event for WaitingScreen's busy modal. Avoid also sending
        // session_rejected here because its generic busy handler navigates away.
        io.to(rejectedRequest.userSocketId).emit('session_request_declined', {
          reason: `${astroName} just accepted another consultation and is now busy. Please try again shortly or browse other astrologers.`,
          astrologerName: astroName,
          astrologerId: reqData.astrologerId,
          roomId: rejectedRequest.roomId
        });
      }

      // Notify astrologer frontend to clear all remaining pending request cards
      if (rejectedRequests.length > 0) {
        io.to(`astro_${reqData.astrologerId}`).emit('pending_requests_cleared', {
          acceptedRoomId: roomId,
          clearedCount: rejectedRequests.length,
          clearedRoomIds: rejectedRequests.map((request) => request.roomId)
        });
        io.to(`room_astro_${reqData.astrologerId}`).emit('pending_requests_cleared', {
          acceptedRoomId: roomId,
          clearedCount: rejectedRequests.length,
          clearedRoomIds: rejectedRequests.map((request) => request.roomId)
        });
        console.log(`[Socket.IO] Auto-rejected ${rejectedRequests.length} other pending request(s) for astrologer ${reqData.astrologerId}`);
      }
    }

    // Notify user that their session was accepted
    io.to(userSocketId).emit('session_accepted', { roomId });
    
    // Notifications via notifyHelper
    if (reqData) {
      import('./utils/notifyHelper.js').then(({ notify }) => {
        // Notify user
        notify({ 
          userId: reqData.userId, 
          role: 'user', 
          title: 'Session Started', 
          message: 'Your astrologer has accepted the session.', 
          type: 'success', 
          link: reqData.type === 'chat' ? '/user/chats' : '/user/video-room' 
        });
        // Notify astrologer
        if (reqData.astrologerId) {
          notify({ 
            userId: reqData.astrologerId, 
            role: 'astrologer', 
            title: 'Session Started', 
            message: 'You accepted a session.', 
            type: 'info', 
            link: '/astrologer/history' 
          });
        }
      }).catch(err => console.error('Failed to send session accepted notify:', err));
    }

    // Notify astrologer's own socket too (confirmation)
    socket.emit('session_accept_confirmed', { roomId });
    console.log(`[Socket.IO] Session accepted. Room: ${roomId}`);
  });

  // ── Astrologer rejects session
  socket.on('reject_session', ({ roomId, userSocketId, reason }) => {
    if (roomId && pendingRequests.has(roomId)) {
      const reqData = pendingRequests.get(roomId);
      if (reqData.timeoutId) clearTimeout(reqData.timeoutId);
      pendingRequests.delete(roomId);
    }
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
    try {
      socket.join(roomId);
      socketRoomMap.set(socket.id, { roomId, type: 'chat_session', astrologerId });

      // ── Cancel any pending disconnect grace timer for this room.
      // This means the user reconnected (e.g. page refresh) before the grace
      // period expired — chat resumes normally, no auto-end.
      if (disconnectGraceTimers.has(roomId)) {
        clearTimeout(disconnectGraceTimers.get(roomId));
        disconnectGraceTimers.delete(roomId);
        console.log(`[Socket.IO] Grace timer cancelled for room ${roomId} — user reconnected`);
      }

      socket.to(roomId).emit('user_joined', { userId, message: 'A user has joined the session' });
      console.log(`[Socket.IO] ${userId} joined room ${roomId} (Type: ${sessionType || 'chat'})`);

      let session = await ChatSession.findOne({ roomId });
      let isNewSession = false;

      // If astrologerId is missing (e.g. from VideoRoom notification link), fallback to CallSession
      if ((!astrologerId || !astrologerId.match(/^[0-9a-fA-F]{24}$/)) && 
          (sessionType === 'audio_call' || sessionType === 'video_call')) {
        const { CallSession } = await import('./models/callSession.model.js');
        const existingCall = await CallSession.findOne({ channelName: roomId });
        if (existingCall && existingCall.astrologerId) {
          astrologerId = existingCall.astrologerId.toString();
        }
      }

      if (!session) {
        let astroName = 'Astrologer';
        if (astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/)) {
          const astroDoc = await Astrologer.findById(astrologerId);
          if (astroDoc && astroDoc.name) astroName = astroDoc.name;
        }

        const welcomeMessage = {
          sender: 'bot',
          text: `Namaste, welcome! I am ${astroName}. Please share your name, date of birth, time of birth, and place of birth, along with your question. I am analyzing your chart now.`,
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        };

        session = await ChatSession.create({
          roomId,
          userId,
          astrologerId: astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/) ? astrologerId : undefined,
          isBotSession: !!isBot,
          status: 'ongoing',
          type: sessionType || 'chat',
          messages: [welcomeMessage],
        });
        isNewSession = true;
        console.log(`[Socket.IO] Created ChatSession in DB with welcome message: ${session._id}`);
      } else if (!session.astrologerId && astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/)) {
        session.astrologerId = astrologerId;
        await session.save();
      }

      let pastMessages = [];
      if (userId && astrologerId && astrologerId.match(/^[0-9a-fA-F]{24}$/)) {
        const pastSessions = await ChatSession.find({
          userId,
          astrologerId,
          roomId: { $ne: roomId },
          type: 'chat'
        }).sort({ createdAt: 1 }).lean();

        pastSessions.forEach(ps => {
          if (ps.messages && ps.messages.length > 0) {
            pastMessages = pastMessages.concat(ps.messages);
          }
        });
      }

      const emitData = {
        sessionId: session._id,
        messages: [...pastMessages, ...(session.messages || [])],
        roomId,
        isBotSession: !!isBot,
        isNewSession
      };

      socket.emit('session_created', emitData);
    } catch (err) {
      console.error('[Socket.IO] Join room DB error:', err);
    }
  });

  // ── Typing indicators
  socket.on('typing', ({ roomId, sender }) => {
    socket.to(roomId).emit('user_typing', { sender });
  });

  socket.on('stop_typing', ({ roomId, sender }) => {
    socket.to(roomId).emit('user_stopped_typing', { sender });
  });

  // ── Send a message
  socket.on('send_message', async ({ roomId, sessionId, sender, text, type = 'text' }) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    let message = { sender, type, text, time };

    try {
      if (type === 'image') {
        // Validate base64 image
        if (!text || !text.startsWith('data:image/')) {
          socket.emit('message_error', { error: 'Invalid image format. Must be base64.' });
          return;
        }

        const allowedMimes = ['data:image/jpeg', 'data:image/jpg', 'data:image/png'];
        const mime = text.substring(0, text.indexOf(';'));
        if (!allowedMimes.includes(mime)) {
          socket.emit('message_error', { error: 'Only JPEG, JPG, and PNG images are allowed.' });
          return;
        }

        // Validate size (~5MB)
        const base64Length = text.length - (text.indexOf(',') + 1);
        const sizeInBytes = Math.ceil((base64Length * 3) / 4);
        if (sizeInBytes > 5 * 1024 * 1024) {
          socket.emit('message_error', { error: 'Image size exceeds 5MB limit.' });
          return;
        }

        // Upload to Cloudinary
        const { uploadMedia } = await import('./config/cloudinary.js');
        const { url } = await uploadMedia(text, 'chat_images');
        
        if (!url) {
          socket.emit('message_error', { error: 'Failed to upload image. Please try again.' });
          return;
        }

        message.imageUrl = url;
        message.text = '📷 Image'; // Optional placeholder text for legacy/push notifications
      }

      // Persist message to DB
      const session = await ChatSession.findByIdAndUpdate(sessionId, {
        $push: { messages: message },
      }, { new: true });

      io.to(roomId).emit('receive_message', message);

      // Trigger AI Bot ONLY if session is bot session, sender is user, and message is text
      if (session && session.isBotSession && sender === 'user' && message.type !== 'image') {
        const AiService = (await import('./services/ai.service.js')).default;
        
        // Indicate bot is typing right away
        io.to(roomId).emit('user_typing', { sender: 'bot' });
        
        setTimeout(async () => {
          try {
            const botReply = await AiService.getChatResponse(message.text, session.userId, session);
            
            // Simulate realistic typing for a short text
            const typingDelay = Math.min(1000 + (botReply.length * 10), 2000);
            if (typingDelay > 0) {
              await new Promise(resolve => setTimeout(resolve, typingDelay));
            }
            
            const botTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const botMsg = { sender: 'bot', text: botReply, time: botTime, type: 'text' };
            await ChatSession.findByIdAndUpdate(sessionId, { $push: { messages: botMsg } });
            
            io.to(roomId).emit('user_stopped_typing', { sender: 'bot' });
            io.to(roomId).emit('receive_message', botMsg);
          } catch (e) {
            console.error('Bot reply error:', e);
            io.to(roomId).emit('user_stopped_typing', { sender: 'bot' });
          }
        }, 1500);
      }
    } catch (err) {
      console.error('[Socket.IO] Failed to persist message:', err);
      socket.emit('message_error', { error: 'Server error processing message' });
    }
  });

  // ── Start Bot Timer (Dynamic free chat duration)
  socket.on('start_bot_timer', async ({ roomId, sessionId, userId, astrologerId }) => {
    if (activeTimers.has(roomId)) return;
    activeTimers.set(roomId, { pending: true }); // Sync lock

    let settings = await SystemSettings.findOne();
    let durationSeconds = (settings?.freeChatDuration || 1) * 60;

    // Determine the real astrologer's rate for the background check
    let rate = 5;
    if (astrologerId) {
      const astro = await Astrologer.findById(astrologerId);
      if (astro && astro.pricing?.chat) rate = astro.pricing.chat;
      else if (astro && astro.rate) rate = astro.rate;
    }

    let seconds = 0;
    activeTimers.set(roomId, { intervalId: null, seconds: 0 });
    const intervalId = setInterval(async () => {
      activeTimers.get(roomId).intervalId = intervalId;
      seconds++;
      const timerData = activeTimers.get(roomId);
      if (timerData) timerData.seconds = seconds;
      io.to(roomId).emit('timer_tick', { seconds, isBot: true });

      // T-minus 10 seconds check for handoff
      if (seconds === durationSeconds - 10) {
        try {
          const user = await User.findById(userId);
          // Check if user has enough balance for at least 5 minutes
          if (user && user.wallet >= (rate * 5) && astrologerId) {
            // Add to pending requests map so astrologer's accept_session works correctly
            const timeoutId = setTimeout(() => {
              if (pendingRequests.has(roomId)) {
                pendingRequests.delete(roomId);
                io.to(`astro_${astrologerId}`).emit('session_request_cancelled', { userId, roomId });
                io.to(socket.id).emit('request_expired', { roomId });
                console.log(`[Socket.IO] Handoff request ${roomId} expired after ${REQUEST_TIMEOUT_MS}ms`);
              }
            }, REQUEST_TIMEOUT_MS);

            pendingRequests.set(roomId, {
              roomId,
              userId,
              astrologerId,
              userName: user.name,
              type: 'chat',
              userSocketId: socket.id,
              timeoutId
            });

            // Silently request real astrologer
            io.to(`astro_${astrologerId}`).emit('incoming_session_request', {
              roomId,
              userId,
              userName: user.name,
              isHandoff: true,
              userSocketId: socket.id,
              type: 'chat'
            });
            // Let the frontend know we are attempting a handoff
            io.to(roomId).emit('handoff_initiated');
          }
        } catch (e) {
          console.error('[Socket.IO] Handoff check error:', e);
        }
      }

      if (seconds >= durationSeconds) {
        clearInterval(intervalId);
        activeTimers.delete(roomId);

        // Mark user's free chat offer as used
        await User.findByIdAndUpdate(userId, {
          freeChatUsed: true,
          freeChatUsedAt: new Date(),
          freeChatDuration: settings?.freeChatDuration || 1
        });

        // If handoff didn't happen (or balance was low), force end session
        io.to(roomId).emit('wallet_update', { freeChatUsed: true });
        io.to(roomId).emit('wallet_low_balance');
        io.to(roomId).emit('session_ended', {
          reason: 'insufficient_balance',
          durationSeconds: seconds,
        });
        handleEndSession({ roomId, sessionId, userId, endedBy: 'system', finalSeconds: seconds, sessionType: 'chat' });
      }
    }, 1000);

    activeTimers.set(roomId, { intervalId, seconds: 0, sessionId, userId, astrologerId, isBot: true });
    console.log(`[Socket.IO] Bot Timer started for room ${roomId} (${durationSeconds}s)`);
  });

  // ── Transition to Real Chat (called after 2 mins if user has balance)
  socket.on('transition_to_real_chat', async ({ roomId, sessionId, userId, astrologerRate }) => {
    const timerData = activeTimers.get(roomId);
    if (timerData && timerData.isTransitioning) return; // Prevent duplicate transition

    if (timerData) {
      clearInterval(timerData.intervalId);
      timerData.isTransitioning = true; // Sync lock
    } else {
      activeTimers.set(roomId, { isTransitioning: true });
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
      console.error('Transition DB error:', e);
    }

    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const sysMsg = { sender: 'system', text: 'Free chat ended. Astrologer has joined the session. Standard rates apply.', time };
    io.to(roomId).emit('receive_message', sysMsg);

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

    let sysComm = await SystemSettings.findOne();
    let commissionRate = sysComm?.commissionRates?.chat || 20;
    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, sessionId, userId, isBot: false, lastDeducted: 0, sessionType: 'chat', commissionRate });
    console.log(`[Socket.IO] Transitioned room ${roomId} to real chat with rate ${astrologerRate}`);
  });

  // ── Start session timer (called when chat begins)
  socket.on('start_timer', async ({ roomId, sessionId, userId, astrologerRate }) => {
    if (activeTimers.has(roomId)) return; // Already running
    activeTimers.set(roomId, { pending: true }); // Sync lock

    let seconds = 0;
    const intervalId = setInterval(async () => {
      seconds++;
      const timerData = activeTimers.get(roomId);
      if (timerData) timerData.seconds = seconds;
      io.to(roomId).emit('timer_tick', { seconds });

      const currentCost = Number(((seconds * astrologerRate) / 60).toFixed(2));
      if (!timerData) return;
      const deltaCost = Number((currentCost - (timerData.lastDeducted || 0)).toFixed(2));

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
          const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $inc: { wallet: -deltaCost } },
            { new: true }
          );
          timerData.lastDeducted = currentCost;
          if (updatedUser) {
            io.to(roomId).emit('wallet_update', { deducted: deltaCost, newBalance: updatedUser.wallet });
          }
        }
      } catch (err) {
        console.error('[Socket.IO] Billing error:', err);
      }
    }, 1000);

    let sysComm = await SystemSettings.findOne();
    let commissionRate = sysComm?.commissionRates?.chat || 30;
    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, sessionId, userId, lastDeducted: 0, sessionType: 'chat', commissionRate });
    console.log(`[Socket.IO] Timer started for room ${roomId}`);
  });

  // ── End session manually
  const handleEndSession = async ({ roomId, sessionId, userId, endedBy = 'user', finalSeconds, sessionType = 'chat' }) => {
    // Clear any pending disconnect grace timer for this room to prevent double-end
    // (e.g. user clicks "End Chat" explicitly, then disconnects — the grace timer
    // shouldn't fire a redundant second end after the session is already completed).
    if (disconnectGraceTimers.has(roomId)) {
      clearTimeout(disconnectGraceTimers.get(roomId));
      disconnectGraceTimers.delete(roomId);
    }

    const timerData = activeTimers.get(roomId);
    let finalSessionId = sessionId;
    if (timerData) {
      finalSessionId = finalSessionId || timerData.sessionId;
      clearInterval(timerData.intervalId);
      activeTimers.delete(roomId);
    }

    const duration = finalSeconds !== undefined ? finalSeconds : (timerData?.seconds || 0);
    const rate = timerData?.astrologerRate || 0;
    const currentCost = Number(((duration * rate) / 60).toFixed(2));
    const lastDeducted = timerData?.lastDeducted || 0;
    const remainingDelta = Number((currentCost - lastDeducted).toFixed(2));

    const endPayload = {
      reason: `${endedBy}_ended`,
      durationSeconds: duration,
      amountDeducted: currentCost,
      sessionId: finalSessionId,
      roomId,
    };

    io.to(roomId).emit('session_ended', endPayload);

    try {
      if (userId) {
        const { notify } = await import('./utils/notifyHelper.js');
        await notify({
          userId: userId,
          role: 'user',
          title: 'Session Ended',
          message: `Your session has ended. Duration: ${duration}s.`,
          type: 'info',
          link: '/user/history'
        });
      }
    } catch (err) {
      console.error('Notify failed on end session:', err);
    }

    let astroId = null;
    const roomInfo = socketRoomMap.get(socket.id);
    if (roomInfo && roomInfo.astrologerId) astroId = roomInfo.astrologerId;

    try {
      if (finalSessionId && !astroId) {
        let sessionForEnd = await ChatSession.findById(finalSessionId);
        if (!sessionForEnd) {
          const { CallSession } = await import('./models/callSession.model.js');
          sessionForEnd = await CallSession.findById(finalSessionId);
        }
        if (sessionForEnd?.astrologerId) astroId = sessionForEnd.astrologerId;
      }
      if (astroId) {
        io.to(`astro_${astroId}`).emit('session_ended', { ...endPayload, sessionId: finalSessionId });

        // Only send "Session Ended" if no earnings will be credited (cost == 0)
        if (currentCost <= 0) {
          const { notify } = await import('./utils/notifyHelper.js');
          await notify({
            userId: astroId,
            role: 'astrologer',
            title: 'Session Ended',
            message: `Session ended. Duration: ${duration}s.`,
            type: 'info',
            link: '/astrologer/history'
          });
        }
      }
    } catch (e) { /* ignore */ }

    // Final deduction and commission
    try {
      if (!finalSessionId) return;
      // Atomic lock: Only process if it's currently 'ongoing'
      let session = await ChatSession.findOneAndUpdate(
        { _id: finalSessionId, status: 'ongoing' },
        { status: 'completed', durationSeconds: duration, amountDeducted: currentCost },
        { new: true }
      );
      if (!session) {
        const { CallSession } = await import('./models/callSession.model.js');
        session = await CallSession.findOneAndUpdate(
          { _id: finalSessionId, status: { $in: ['accepted', 'ongoing', 'ringing'] } },
          { status: 'completed', durationSeconds: duration, amountDeducted: currentCost },
          { new: true }
        );
      }

      if (session) {
        if (currentCost > 0 && userId && remainingDelta > 0) {
          await User.updateOne(
            { _id: userId },
            { $inc: { wallet: -remainingDelta } }
          );
          const Transaction = (await import('./models/transaction.model.js')).default;
          const Astrologer = (await import('./models/astrologer.model.js')).default;

          let sessionTypeLabel = 'Chat Session';
          if (session.type === 'audio_call' || session.type === 'audio') sessionTypeLabel = 'Audio Call';
          if (session.type === 'video_call' || session.type === 'video') sessionTypeLabel = 'Video Call';

          let astroName = 'Astrologer';
          if (session.astrologerId) {
            const astro = await Astrologer.findById(session.astrologerId);
            if (astro) astroName = astro.name;
          }

          await Transaction.create({ userId, type: 'deduction', amount: -currentCost, desc: `${sessionTypeLabel} with ${astroName} (${duration}s)` });

          const comm = timerData?.commissionRate || 30;

          const creditRes = await WalletService.creditAstrologer(session.astrologerId, userId, finalSessionId, session.type || 'chat', currentCost, `${sessionTypeLabel} Earning`, comm, duration);
          if (creditRes && creditRes.netAmount) {
            io.to(`astro_${session.astrologerId}`).emit('earning_credited', { netAmount: creditRes.netAmount, sessionId: session._id });
          }
        }
      }
      if (finalSessionId) {
        let checkSession = await ChatSession.findById(finalSessionId);
        if (!checkSession) {
          const { CallSession } = await import('./models/callSession.model.js');
          checkSession = await CallSession.findById(finalSessionId);
        }
        if (checkSession && checkSession.astrologerId) {
          const updatedAstro = await Astrologer.findOneAndUpdate(
            { _id: checkSession.astrologerId, onlineStatus: 'busy' },
            { onlineStatus: 'online' },
            { new: true }
          );
          if (updatedAstro) {
            io.emit('astro_status_changed', { astrologerId: checkSession.astrologerId, status: 'online' });
          }
        }
      }
    } catch (err) {
      console.error('[Socket.IO] Session end error:', err);
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

      const currentCost = Number(((seconds * astrologerRate) / 60).toFixed(2));
      if (!timerData) return;
      const deltaCost = Number((currentCost - (timerData.lastDeducted || 0)).toFixed(2));

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
          const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $inc: { wallet: -deltaCost } },
            { new: true }
          );
          timerData.lastDeducted = currentCost;
          if (updatedUser) {
            io.to(roomId).emit('wallet_update', { deducted: deltaCost, newBalance: updatedUser.wallet });
          }
        }
      } catch (err) {
        console.error('[Socket.IO] Call Billing error:', err);
      }
    }, 1000);

    let sysComm = await SystemSettings.findOne();
    let commissionRate = type === 'video' ? (sysComm?.commissionRates?.videoCall || 30) : (sysComm?.commissionRates?.audioCall || 30);
    activeTimers.set(roomId, { intervalId, seconds: 0, astrologerRate, callId, userId, type, lastDeducted: 0, commissionRate });
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
    const currentCost = Number(((duration * rate) / 60).toFixed(2));
    const lastDeducted = timerData?.lastDeducted || 0;
    const remainingDelta = Number((currentCost - lastDeducted).toFixed(2));

    io.to(roomId).emit('call_ended', { reason: `${endedBy}_ended`, roomId });

    try {
      if (userId) {
        const { notify } = await import('./utils/notifyHelper.js');
        await notify({
          userId: userId,
          role: 'user',
          title: 'Call Ended',
          message: `Your call has ended. Duration: ${duration}s.`,
          type: 'info',
          link: '/user/history'
        });
      }
    } catch (err) {
      console.error('Notify failed on end call:', err);
    }
    try {
      if (timerData && timerData.astrologerId) {
        io.to(`astro_${timerData.astrologerId}`).emit('call_ended', { reason: `${endedBy}_ended`, roomId });
        if (currentCost <= 0) {
          const { notify } = await import('./utils/notifyHelper.js');
          await notify({
            userId: timerData.astrologerId,
            role: 'astrologer',
            title: 'Call Ended',
            message: `Call ended. Duration: ${duration}s.`,
            type: 'info',
            link: '/astrologer/history'
          });
        }
      } else {
        const { CallSession } = await import('./models/callSession.model.js');
        const sess = await CallSession.findOne({ callId });
        if (sess) {
          io.to(`astro_${sess.astrologerId}`).emit('call_ended', { reason: `${endedBy}_ended`, roomId });
          if (currentCost <= 0) {
            const { notify } = await import('./utils/notifyHelper.js');
            await notify({
              userId: sess.astrologerId,
              role: 'astrologer',
              title: 'Call Ended',
              message: `Call ended. Duration: ${duration}s.`,
              type: 'info',
              link: '/astrologer/history'
            });
          }
        }
      }
    } catch (e) { /* ignore */ }

    try {
      const { CallSession } = await import('./models/callSession.model.js');
      // Atomic lock for CallSession
      const session = await CallSession.findOneAndUpdate(
        { callId, status: { $in: ['accepted', 'ongoing', 'ringing'] } },
        { status: 'completed', duration: duration, endTime: new Date(), totalAmount: currentCost },
        { new: true }
      );

      if (session) {
        if (currentCost > 0 && userId && remainingDelta > 0) {
          await User.updateOne(
            { _id: userId },
            { $inc: { wallet: -remainingDelta } }
          );
          const Transaction = (await import('./models/transaction.model.js')).default;
          const Astrologer = (await import('./models/astrologer.model.js')).default;

          let astroName = 'Astrologer';
          if (session.astrologerId) {
            const astro = await Astrologer.findById(session.astrologerId);
            if (astro) astroName = astro.name;
          }

          const typeLabel = type === 'video' ? 'Video Call' : 'Audio Call';
          await Transaction.create({ userId, type: 'deduction', amount: -currentCost, desc: `${typeLabel} with ${astroName} (${duration}s)` });

          const comm = timerData?.commissionRate || 30;
          const creditRes = await WalletService.creditAstrologer(session.astrologerId, userId, session._id, type, currentCost, `${type} Call Earning`, comm, duration);
          if (creditRes && creditRes.netAmount) {
            io.to(`astro_${session.astrologerId}`).emit('earning_credited', { netAmount: creditRes.netAmount, sessionId: session._id });
          }
        }

        const Astrologer = (await import('./models/astrologer.model.js')).default;
        const updatedAstro = await Astrologer.findOneAndUpdate(
          { _id: session.astrologerId, onlineStatus: 'busy' },
          { onlineStatus: 'online' },
          { new: true }
        );
        if (updatedAstro) {
          io.emit('astro_status_changed', { astrologerId: session.astrologerId, status: 'online' });
        }
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

      io.emit('astro_status_changed', { astrologerId, status });
    } catch (err) {
      console.error('[Socket.IO] Status update error:', err.message);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);

    // Strict Disconnect Handling
    const roomInfo = socketRoomMap.get(socket.id);
    if (roomInfo) {
      const { roomId, astrologerId, type } = roomInfo;
      const timerData = activeTimers.get(roomId);

      if (type === 'audio_call' || type === 'video_call' || (timerData && timerData.callId)) {
        // ALWAYS End call on disconnect for Audio/Video
        io.to(roomId).emit('call_ended', { reason: 'peer_disconnected', roomId });
        const targetAstroId = (timerData && timerData.astrologerId) || astrologerId;
        if (targetAstroId) {
          io.to(`astro_${targetAstroId}`).emit('call_ended', { reason: 'peer_disconnected', roomId });
        }

        if (timerData && timerData.callId) {
          await handleEndCall({ roomId, callId: timerData.callId, userId: timerData.userId, endedBy: 'peer_disconnected', finalSeconds: timerData.seconds });
        }
      } else {
        // For CHAT sessions, DO NOT immediately end the chat on disconnect.
        // This allows users to refresh the page without losing the chat.
        // However, start a grace-period timer: if the user doesn't reconnect
        // within DISCONNECT_GRACE_PERIOD_MS, auto-end the session so billing
        // doesn't run indefinitely and the astrologer isn't stuck on 'busy'.
        io.to(roomId).emit('peer_disconnected_temp', { sender: socket.id });

        // Only start a grace timer if there's an active billing timer for this room
        // (i.e. the session is actually live and being billed).
        if (timerData && !disconnectGraceTimers.has(roomId)) {
          const graceSessionId = timerData.sessionId;
          const graceUserId = timerData.userId;

          const graceTimerId = setTimeout(async () => {
            disconnectGraceTimers.delete(roomId);

            // Double-check: is the billing timer still running for this room?
            // If it was already ended by another path (e.g. insufficient balance),
            // don't try to end it again.
            const currentTimer = activeTimers.get(roomId);
            if (!currentTimer) {
              console.log(`[Socket.IO] Grace timer expired for room ${roomId} but timer already cleared — skipping`);
              return;
            }

            console.log(`[Socket.IO] Grace period expired for room ${roomId} — auto-ending chat session`);
            try {
              await handleEndSession({
                roomId,
                sessionId: graceSessionId,
                userId: graceUserId,
                endedBy: 'system',
                finalSeconds: currentTimer.seconds,
                sessionType: 'chat'
              });

              // Also emit to the room/astrologer with a specific reason so any
              // still-open frontend tabs update their UI correctly.
              io.to(roomId).emit('session_ended', {
                reason: 'inactive_timeout',
                durationSeconds: currentTimer.seconds,
                sessionId: graceSessionId,
                roomId,
              });
            } catch (err) {
              console.error(`[Socket.IO] Grace timer auto-end failed for room ${roomId}:`, err);
            }
          }, DISCONNECT_GRACE_PERIOD_MS);

          disconnectGraceTimers.set(roomId, graceTimerId);
          console.log(`[Socket.IO] Started ${DISCONNECT_GRACE_PERIOD_MS / 1000}s grace timer for chat room ${roomId}`);
        }
      }

          socketRoomMap.delete(socket.id);
    }
  });
});

// ──────────────────────────────────────────────
//  Express Middleware
// ──────────────────────────────────────────────
app.set('trust proxy', 1); // Trust first proxy for rate limiting
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

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
app.use('/api', toolsRoutes);

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

    // Initialize background cron jobs
    initCronJobs(io);
  });
}).catch((err) => {
  console.error('Failed to connect to MongoDB:', err.message);
  process.exit(1);
});

export { app, httpServer, io };
