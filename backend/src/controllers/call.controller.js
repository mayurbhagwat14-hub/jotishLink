import { CallSession } from '../models/callSession.model.js';
import ChatSession from '../models/chatSession.model.js';
import Astrologer from '../models/astrologer.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import agoraToken from 'agora-token';
const { RtcTokenBuilder, RtcRole } = agoraToken;

export const requestCall = asyncHandler(async (req, res) => {
  const { astrologerId } = req.body;
  const userId = req.user._id;

  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');
  if (astrologer.onlineStatus !== 'online') throw new ApiError(400, 'Astrologer is currently unavailable');

  const ratePerMinute = astrologer.pricing?.audioCall || astrologer.rate || 5;
  const requiredBalance = ratePerMinute * 5;

  const user = await User.findById(userId);
  if (user.wallet < requiredBalance) {
    throw new ApiError(400, `Insufficient wallet balance. Minimum ₹${requiredBalance} required.`);
  }

  const callId = `call_${Date.now()}_${userId}`;
  const channelName = `room_${Date.now()}_${userId}`;

  const callSession = await CallSession.create({
    callId,
    userId,
    astrologerId,
    channelName,
    ratePerMinute,
    status: 'pending',
  });

  try {
    const { notify } = await import('../utils/notifyHelper.js');
    await notify({
      userId: astrologerId,
      role: 'astrologer',
      title: 'Incoming Call Request',
      message: `New request from ${user.name || 'a user'}`,
      type: 'alert',
      link: '/astrologer/calls',
      data: { type: 'incoming_call', callId, channelName }
    });
  } catch (err) {
    console.error('Notify failed:', err);
  }

  return res.status(200).json(new ApiResponse(200, { callSession }, 'Call requested successfully'));
});

export const acceptCall = asyncHandler(async (req, res) => {
  const { callId } = req.body;
  const astrologerId = req.user._id;

  const callSession = await CallSession.findOne({ callId, astrologerId });
  if (!callSession) throw new ApiError(404, 'Call session not found');
  if (callSession.status !== 'pending' && callSession.status !== 'ringing') {
    throw new ApiError(400, 'Call cannot be accepted');
  }

  callSession.status = 'accepted';
  callSession.startTime = new Date();
  await callSession.save();

  // Mark astrologer as busy
  await Astrologer.findByIdAndUpdate(astrologerId, { onlineStatus: 'busy' });

  // Generate Agora Token for Astrologer
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  if (!appId || !appCertificate) throw new ApiError(500, 'Agora is not configured');

  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const uid = 0;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    callSession.channelName,
    uid,
    RtcRole.PUBLISHER,
    expirationTimeInSeconds,
    privilegeExpiredTs
  );

  try {
    const { notify } = await import('../utils/notifyHelper.js');
    await notify({
      userId: callSession.userId,
      role: 'user',
      title: 'Call Started',
      message: 'The astrologer has accepted your call.',
      type: 'success',
      link: `/user/video-room/${callSession.channelName}`,
      data: { type: 'call_accepted', callId, channelName: callSession.channelName }
    });
  } catch (err) {
    console.error('Notify failed:', err);
  }

  return res.status(200).json(new ApiResponse(200, {
    callSession,
    agora: { token, uid, channelName: callSession.channelName, appId }
  }, 'Call accepted'));
});

export const rejectCall = asyncHandler(async (req, res) => {
  const { callId, reason } = req.body;
  const astrologerId = req.user._id;

  const callSession = await CallSession.findOne({ callId, astrologerId });
  if (!callSession) throw new ApiError(404, 'Call session not found');

  callSession.status = 'rejected';
  await callSession.save();

  return res.status(200).json(new ApiResponse(200, { callSession }, 'Call rejected'));
});

export const getCallHistory = asyncHandler(async (req, res) => {
  let query = {
    type: { $in: ['video', 'audio', 'video_call', 'audio_call'] }
  };
  
  if (req.user?.role === 'astrologer') {
    query.astrologerId = req.user._id;
    query.deletedByAstrologer = { $ne: true };
  } else if (req.user) {
    query.userId = req.user._id;
    query.deletedByUser = { $ne: true };
  }

  const calls = await ChatSession.find(query)
    .populate('userId', 'name avatar')
    .populate('astrologerId', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { calls }, 'Call history fetched'));
});
