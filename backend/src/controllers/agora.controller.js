import agoraToken from 'agora-token';
const { RtcTokenBuilder, RtcRole } = agoraToken;
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/agora/token?channelName=...&uid=...&role=...
export const generateRtcToken = asyncHandler(async (req, res) => {
  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  
  if (!appId || !appCertificate) {
    throw new ApiError(500, 'Agora App ID and Certificate are not configured');
  }

  let { channelName, uid, role } = req.query;

  if (!channelName) {
    throw new ApiError(400, 'channelName is required');
  }

  if (!uid) {
    uid = 0; // If uid is 0, Agora assigns a random UID
  } else {
    uid = parseInt(uid, 10);
    if (isNaN(uid)) {
      uid = 0;
    }
  }

  let rtcRole = RtcRole.PUBLISHER;
  if (role === 'subscriber') {
    rtcRole = RtcRole.SUBSCRIBER;
  }

  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    rtcRole,
    expirationTimeInSeconds,
    privilegeExpiredTs
  );

  return res.status(200).json(new ApiResponse(200, { token, uid, channelName, appId }, 'Token generated successfully'));
});
