import ChatSession from '../models/chatSession.model.js';
import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import WalletService from '../services/wallet.service.js';
import SystemSettings from '../models/systemSettings.model.js';

// POST /api/chat/start  — initiate a chat session
export const startChatSession = asyncHandler(async (req, res) => {
  const { astrologerId } = req.body;
  if (!astrologerId) throw new ApiError(400, 'astrologerId is required');

  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');
  if (astrologer.onlineStatus !== 'online') throw new ApiError(400, 'Astrologer is not available');

  const user = await User.findById(req.user._id);
  const isFreeChat = !user.freeChatUsed;

  if (!isFreeChat) {
    const chatPrice = astrologer.pricing?.chat || astrologer.rate || 5;
    const requiredBalance = chatPrice * 2; // Minimum 2 min balance required
    if (user.wallet < requiredBalance) {
      throw new ApiError(400, `Insufficient balance. Minimum ₹${requiredBalance} required.`);
    }
  }

  const roomId = `room_${req.user._id}_${astrologerId}_${Date.now()}`;

  const session = await ChatSession.create({
    roomId,
    userId: req.user._id,
    astrologerId,
    status: 'ongoing',
    isFreeChat,
    messages: [],
  });

  // Mark astrologer as busy
  await Astrologer.findByIdAndUpdate(astrologerId, { onlineStatus: 'busy' });
  const io = req.app.get('io');
  if (io) {
    io.emit('astro_status_changed', { astrologerId: astrologerId.toString(), status: 'busy' });
  }

  // Send Push Notification
  try {
    const { sendPushNotification } = await import('../utils/firebaseHelper.js');
    await sendPushNotification({
      userId: astrologerId,
      role: 'astrologer',
      title: 'Incoming Chat Request',
      body: `You have a new chat request from ${user.name || 'a user'}.`,
      data: { type: 'incoming_chat', sessionId: session._id.toString(), roomId, url: '/astrologer/chats' }
    });
  } catch (err) {
    console.error('Push notification failed:', err);
  }

  return res.status(201).json(
    new ApiResponse(201, {
      roomId,
      sessionId: session._id,
      astrologer: {
        name: astrologer.name,
        pricing: astrologer.pricing,
      },
      userWallet: user.wallet,
    }, 'Chat session started')
  );
});

// POST /api/chat/:sessionId/end  — end session and bill
export const endChatSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { durationSeconds } = req.body;

  // Use findOneAndUpdate to atomically acquire the session and prevent race conditions
  const session = await ChatSession.findOneAndUpdate(
    { _id: sessionId, status: 'ongoing', userId: req.user._id },
    { status: 'processing' }, // Lock it temporarily to prevent duplicate billing
    { new: true }
  );

  if (!session) {
    const existingSession = await ChatSession.findById(sessionId);
    if (!existingSession) throw new ApiError(404, 'Session not found');
    if (existingSession.userId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized');
    }
    // If it's already completed or processing, we reject the request
    throw new ApiError(400, 'Session already ended or is being processed');
  }

  const astrologer = await Astrologer.findById(session.astrologerId);
  const ratePerMin = astrologer?.pricing?.chat || astrologer?.rate || 5;
  const actualDuration = durationSeconds || 0;
  const durationMinutes = Math.max(1, Math.ceil(actualDuration / 60));
  
  let totalAmount = 0;
  let transactionId = null;

  if (session.isFreeChat || session.isBotSession) {
    // Free / bot chat — no deduction
    totalAmount = 0;

    const user = await User.findById(session.userId);
    if (user && !user.freeChatUsed) {
      user.freeChatUsed = true;
      user.freeChatUsedAt = new Date();
      await user.save();
    }
  } else {
    // Paid Chat - 20 seconds grace period
    if (actualDuration > 20) {
      totalAmount = durationMinutes * ratePerMin;
      // Deduct from user wallet
      const { transaction } = await WalletService.deduct(
        req.user._id,
        totalAmount,
        `Chat with ${astrologer?.name || 'Astrologer'} - ${durationMinutes} min`
      );
      transactionId = transaction._id;
    } else {
      // Chat ended within 20 seconds, no charge
      totalAmount = 0;
    }

    if (totalAmount > 0) {
      let sysComm = await SystemSettings.findOne();
      let commissionRate = sysComm?.commissionRates?.chat ?? 30;
      await WalletService.creditAstrologer(
        session.astrologerId, 
        req.user._id, 
        session._id, 
        'chat', 
        totalAmount, 
        `Chat Session Earning`, 
        commissionRate, 
        actualDuration
      );
    }
  }

  // Mark astrologer back as online instantly in frontend via socket
  const io = req.app.get('io');
  if (io && astrologer) {
    io.emit('astro_status_changed', { astrologerId: astrologer._id.toString(), status: 'online' });
  }

  session.status = 'completed';
  session.durationSeconds = actualDuration;
  session.amountDeducted = totalAmount;
  await session.save();

  if (astrologer) {
    astrologer.onlineStatus = 'online';
    await astrologer.save();
  }

  return res.status(200).json(
    new ApiResponse(200, {
      session,
      amountDeducted: totalAmount,
      durationMinutes: totalAmount > 0 ? durationMinutes : 0,
      transactionId,
    }, 'Session ended and billed')
  );
});

// GET /api/chat/:sessionId/messages  — get message history
export const getSessionMessages = asyncHandler(async (req, res) => {
  const session = await ChatSession.findById(req.params.sessionId)
    .populate('userId', 'name avatar')
    .populate('astrologerId', 'name avatar')
    .lean();

  if (!session) throw new ApiError(404, 'Session not found');

  // Authorize: only session participants
  const isParticipant =
    session.userId._id.toString() === req.user._id.toString() ||
    session.astrologerId._id.toString() === req.user._id.toString();

  if (!isParticipant) throw new ApiError(403, 'Not authorized');

  return res.status(200).json(new ApiResponse(200, { session }, 'Messages fetched'));
});
