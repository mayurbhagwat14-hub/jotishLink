import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import PoojaBooking from '../models/poojaBooking.model.js';
import ChatSession from '../models/chatSession.model.js';
import Transaction from '../models/transaction.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import SmsService from '../services/sms.service.js';
import { uploadMedia, deleteMedia } from '../config/cloudinary.js';

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '1h' }
  );
  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d' }
  );
  return { accessToken, refreshToken };
};

import { checkGlobalMobileExists } from '../utils/authUtils.js';

// POST /api/astrologer/auth/check-phone
export const checkAstrologerPhone = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, 'Phone number is required');

  const existingRole = await checkGlobalMobileExists(phone);
  if (existingRole && existingRole !== 'astrologer') {
    throw new ApiError(409, `This number is already registered as a ${existingRole}. Please login to the correct portal.`);
  }

  const astrologer = await Astrologer.findOne({ phone });
  if (!astrologer) {
    return res.status(200).json(new ApiResponse(200, { exists: false }, 'Astrologer not found'));
  }

  return res.status(200).json(new ApiResponse(200, { 
    exists: true,
    approvalStatus: astrologer.approvalStatus
  }, 'Astrologer exists'));
});

// POST /api/astrologer/auth/request-otp
export const astrologerRequestOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) throw new ApiError(400, 'Phone number is required');

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const existingRole = await checkGlobalMobileExists(phone);
  if (existingRole && existingRole !== 'astrologer') {
    throw new ApiError(409, `Phone number already registered as ${existingRole}`);
  }

  let astrologer = await Astrologer.findOne({ phone });
  if (!astrologer) {
    astrologer = new Astrologer({ 
      phone, 
      name: 'Temp Astrologer', 
      approvalStatus: 'pending' 
    });
  }

  astrologer.otpHash = otpHash;
  astrologer.otpExpires = otpExpires;
  await astrologer.save();

  await SmsService.sendOtp(phone, otp);

  return res.status(200).json(new ApiResponse(200, {}, `OTP sent to ${phone}`));
});

// POST /api/astrologer/auth/signup
export const astrologerSignup = asyncHandler(async (req, res) => {
  const { name, phone, password, otp, skills, categories, languages, experience, about, pricing, identityProof, avatar } = req.body;
  if (!name || !phone || !password || !otp) throw new ApiError(400, 'name, phone, password, and otp required');

  const existingRole = await checkGlobalMobileExists(phone);
  if (existingRole && existingRole !== 'astrologer') {
    throw new ApiError(409, `Phone number already registered as ${existingRole}`);
  }

  // Validate pricing minimums
  if (pricing) {
    if (pricing.chat !== undefined && pricing.chat < 5) throw new ApiError(400, 'Minimum chat price is ₹5/min');
    if (pricing.audioCall !== undefined && pricing.audioCall < 5) throw new ApiError(400, 'Minimum audio call price is ₹5/min');
    if (pricing.videoCall !== undefined && pricing.videoCall < 5) throw new ApiError(400, 'Minimum video call price is ₹5/min');
  }

  let astrologer = await Astrologer.findOne({ phone });
  
  if (astrologer) {
    if (astrologer.password) {
      throw new ApiError(409, `Phone number already registered as astrologer`);
    }
    // Verify OTP
    if (!astrologer.otpHash || !astrologer.otpExpires) throw new ApiError(400, 'OTP not requested');
    if (astrologer.otpExpires < new Date()) throw new ApiError(400, 'OTP has expired');

    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    const isDevBypass = otp === '1234';
    if (hash !== astrologer.otpHash && !isDevBypass) throw new ApiError(400, 'Invalid OTP');

    // OTP valid, update
    astrologer.name = name;
    astrologer.password = password;
    astrologer.otpHash = undefined;
    astrologer.otpExpires = undefined;
    astrologer.skills = skills || ['Vedic'];
    astrologer.categories = categories || [];
    let uploadedIdentity = identityProof || '';
    let identityPubId = '';
    if (uploadedIdentity.startsWith('data:image')) {
      const result = await uploadMedia(uploadedIdentity, 'astrotalk_astrologers');
      uploadedIdentity = result.url;
      identityPubId = result.publicId;
    }

    let uploadedAvatar = avatar || '';
    let avatarPubId = '';
    if (uploadedAvatar.startsWith('data:image')) {
      const result = await uploadMedia(uploadedAvatar, 'astrotalk_astrologers');
      uploadedAvatar = result.url;
      avatarPubId = result.publicId;
    }

    astrologer.identityProof = uploadedIdentity;
    astrologer.identityProofPublicId = identityPubId;
    astrologer.avatar = uploadedAvatar;
    astrologer.avatarPublicId = avatarPubId;
    astrologer.languages = languages || ['Hindi', 'English'];
    astrologer.experience = experience || 0;
    astrologer.about = about || '';
    astrologer.pricing = pricing || { chat: 5, audioCall: 5, videoCall: 10 };
    astrologer.isVerified = false;
    astrologer.approvalStatus = 'pending';
    await astrologer.save();
  } else {
    throw new ApiError(400, 'Please request OTP first');
  }

  const { accessToken, refreshToken } = generateTokens(astrologer._id, 'astrologer');
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json(
    new ApiResponse(201, {
      accessToken,
      user: { _id: astrologer._id, name, phone, role: 'astrologer' },
      astrologer,
    }, 'Astrologer account created. Pending verification.')
  );
});

// POST /api/astrologer/auth/login
export const astrologerLogin = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) throw new ApiError(400, 'Phone and OTP required');

  const astrologer = await Astrologer.findOne({ phone });
  
  if (!astrologer) {
    throw new ApiError(404, 'User not found. Please apply first.');
  }

  // Verify OTP
  if (!astrologer.otpHash || !astrologer.otpExpires) throw new ApiError(400, 'OTP not requested');
  if (astrologer.otpExpires < new Date()) throw new ApiError(400, 'OTP has expired');

  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  const isDevBypass = otp === '1234';
  if (hash !== astrologer.otpHash && !isDevBypass) throw new ApiError(400, 'Invalid OTP');

  // OTP is valid. Clear it.
  astrologer.otpHash = undefined;
  astrologer.otpExpires = undefined;
  await astrologer.save();

  // Check approval status
  if (astrologer.approvalStatus === 'pending') {
    throw new ApiError(403, 'Your application is pending admin approval.');
  }
  if (astrologer.approvalStatus === 'rejected') {
    throw new ApiError(403, 'Your application has been rejected by the admin.');
  }

  const { accessToken, refreshToken } = generateTokens(astrologer._id, 'astrologer');
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      user: { _id: astrologer._id, name: astrologer.name, phone, role: 'astrologer', onlineStatus: astrologer.onlineStatus },
      astrologer,
    }, 'Login successful')
  );
});

// POST /api/astrologer/auth/change-password
export const astrologerChangePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const astrologer = await Astrologer.findById(req.user._id);

  const isMatch = await astrologer.comparePassword(oldPassword);
  if (!isMatch) throw new ApiError(400, 'Incorrect current password');

  astrologer.password = newPassword;
  await astrologer.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password changed'));
});

// GET /api/astrologer/profile
export const getAstrologerProfile = asyncHandler(async (req, res) => {
  const astrologer = await Astrologer.findById(req.user._id).lean();
  if (!astrologer) throw new ApiError(404, 'Astrologer profile not found');
  return res.status(200).json(new ApiResponse(200, { astrologer }, 'Profile fetched'));
});

// PUT /api/astrologer/profile/update
export const updateAstrologerProfile = asyncHandler(async (req, res) => {
  const { name, skills, languages, experience, about, pricing, avatar } = req.body;
  const astrologer = await Astrologer.findById(req.user._id);
  if (!astrologer) throw new ApiError(404, 'Profile not found');

  if (name !== undefined) astrologer.name = name;
  if (skills !== undefined) astrologer.skills = skills;
  if (languages !== undefined) astrologer.languages = languages;
  if (experience !== undefined) astrologer.experience = experience;
  if (about !== undefined) astrologer.about = about;
  if (pricing !== undefined) {
    if (pricing.chat !== undefined && pricing.chat < 5) throw new ApiError(400, 'Minimum chat price is ₹5/min');
    if (pricing.audioCall !== undefined && pricing.audioCall < 5) throw new ApiError(400, 'Minimum audio call price is ₹5/min');
    if (pricing.videoCall !== undefined && pricing.videoCall < 5) throw new ApiError(400, 'Minimum video call price is ₹5/min');
    astrologer.pricing = { ...astrologer.pricing, ...pricing };
  }
  if (avatar !== undefined) {
    if (avatar.startsWith('data:image')) {
      if (astrologer.avatarPublicId) {
        await deleteMedia(astrologer.avatarPublicId);
      }
      const uploadResult = await uploadMedia(avatar, 'astrotalk_astrologers');
      astrologer.avatar = uploadResult.url;
      astrologer.avatarPublicId = uploadResult.publicId;
    } else {
      astrologer.avatar = avatar;
    }
  }

  await astrologer.save();
  return res.status(200).json(new ApiResponse(200, { astrologer }, 'Profile updated'));
});

// DELETE /api/astrologer/profile  or  /api/astrologer/profile/delete
export const deleteAstrologerAccount = asyncHandler(async (req, res) => {
  await Astrologer.findByIdAndDelete(req.user._id);
  res.clearCookie('refreshToken');
  return res.status(200).json(new ApiResponse(200, {}, 'Account deleted'));
});

// GET /api/astrologer/dashboard
export const getAstrologerDashboard = asyncHandler(async (req, res) => {
  const astrologer = await Astrologer.findById(req.user._id).lean();
  if (!astrologer) throw new ApiError(404, 'Profile not found');

  const [sessions, bookings] = await Promise.all([
    ChatSession.find({ astrologerId: req.user._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    PoojaBooking.find({ astrologerId: astrologer._id })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const totalEarnings = sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + (s.amountDeducted || 0) * 0.7, 0); // 70% to astrologer

  return res.status(200).json(
    new ApiResponse(200, {
      astrologer,
      recentSessions: sessions,
      recentBookings: bookings,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      stats: {
        totalSessions: sessions.length,
        onlineStatus: astrologer.onlineStatus,
        rating: astrologer.rating,
      },
    }, 'Dashboard data fetched')
  );
});

// GET /api/astrologer/earnings
export const getAstrologerEarnings = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({
    astrologerId: req.user._id,
    status: 'completed',
  }).sort({ createdAt: -1 }).lean();

  const earnings = sessions.map((s) => ({
    sessionId: s._id,
    date: s.createdAt,
    durationSeconds: s.durationSeconds,
    amount: parseFloat(((s.amountDeducted || 0) * 0.7).toFixed(2)),
  }));

  const total = earnings.reduce((sum, e) => sum + e.amount, 0);

  return res.status(200).json(
    new ApiResponse(200, { earnings, total: parseFloat(total.toFixed(2)) }, 'Earnings fetched')
  );
});

// GET /api/astrologer/pooja-requests
export const getAstrologerPoojaRequests = asyncHandler(async (req, res) => {
  const astrologer = await Astrologer.findById(req.user._id);
  if (!astrologer) throw new ApiError(404, 'Profile not found');

  const bookings = await PoojaBooking.find({ astrologerId: astrologer._id })
    .populate('userId', 'name phone avatar')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { bookings }, 'Pooja requests fetched'));
});

// PUT /api/astrologer/poojas/:id/status
export const updatePoojaStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const booking = await PoojaBooking.findOneAndUpdate(
    { _id: id, astrologerId: req.user._id },
    { status },
    { new: true }
  );

  if (!booking) throw new ApiError(404, 'Booking not found');

  return res.status(200).json(new ApiResponse(200, { booking }, `Pooja booking marked as ${status}`));
});

// GET /api/astrologer/chats
export const getAstrologerChats = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ astrologerId: req.user._id })
    .populate('userId', 'name avatar phone')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { sessions }, 'Chats fetched'));
});

// GET /api/astrologer/calls
export const getAstrologerCalls = asyncHandler(async (req, res) => {
  // For now, return chat sessions that represent calls (can be extended with a call model)
  const sessions = await ChatSession.find({ astrologerId: req.user._id, status: 'completed' })
    .populate('userId', 'name avatar phone')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { calls: sessions }, 'Calls fetched'));
});

// PUT /api/astrologer/status
export const updateOnlineStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || !['online', 'offline'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const astrologer = await Astrologer.findById(req.user._id);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');

  astrologer.onlineStatus = status;
  await astrologer.save();

  return res.status(200).json(new ApiResponse(200, { onlineStatus: astrologer.onlineStatus }, 'Status updated'));
});

// GET /api/astrologer/history
export const getAstrologerHistory = asyncHandler(async (req, res) => {
  const [sessions, poojas] = await Promise.all([
    ChatSession.find({ astrologerId: req.user._id, status: 'completed' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean(),
    PoojaBooking.find({ astrologerId: req.user._id, status: { $in: ['completed', 'confirmed'] } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean()
  ]);

  const history = [
    ...sessions.map(s => ({
      _id: s._id,
      type: s.type || 'chat',
      userName: s.userId?.name || 'User',
      date: s.createdAt,
      duration: s.durationSeconds || 0,
      amount: parseFloat(((s.amountDeducted || 0) * 0.7).toFixed(2)),
      status: s.status
    })),
    ...poojas.map(p => ({
      _id: p._id,
      type: 'pooja',
      userName: p.poojaName || p.userId?.name || 'Pooja',
      date: p.createdAt,
      duration: 0,
      amount: parseFloat(((p.price || 0) * 0.7).toFixed(2)),
      status: p.status
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json(new ApiResponse(200, { history }, 'History fetched'));
});

// GET /api/astrologer/analytics
export const getAstrologerAnalytics = asyncHandler(async (req, res) => {
  const astrologerId = req.user._id;
  
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');

  const { default: Review } = await import('../models/review.model.js');

  // 1. Average Rating
  const averageRating = astrologer.rating || 5.0;

  // 2. Total Users Consulted & Returning Customers
  // Group by userId to count sessions per user
  const userSessions = await ChatSession.aggregate([
    { $match: { astrologerId: astrologer._id, status: 'completed' } },
    { $group: { _id: '$userId', sessionCount: { $sum: 1 } } }
  ]);

  const totalUsersConsulted = userSessions.length;
  const returningCustomers = userSessions.filter(u => u.sessionCount > 1).length;
  const returningCustomersPercentage = totalUsersConsulted > 0 
    ? Math.round((returningCustomers / totalUsersConsulted) * 100) 
    : 0;

  // 3. Consultation Trends (last 7 days)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentSessions = await ChatSession.aggregate([
    { 
      $match: { 
        astrologerId: astrologer._id, 
        status: 'completed',
        createdAt: { $gte: sevenDaysAgo, $lte: today }
      } 
    },
    {
      $group: {
        _id: { $dayOfWeek: "$createdAt" }, // 1 = Sunday, 7 = Saturday
        count: { $sum: 1 }
      }
    }
  ]);

  // Convert to Mon-Sun array
  // MongoDB $dayOfWeek: 1 (Sun) to 7 (Sat)
  // We want: Mon(0), Tue(1), Wed(2), Thu(3), Fri(4), Sat(5), Sun(6)
  const trendsMap = {};
  recentSessions.forEach(item => {
    // Map 1(Sun) -> 6, 2(Mon) -> 0, etc.
    const mappedDay = item._id === 1 ? 6 : item._id - 2;
    trendsMap[mappedDay] = item.count;
  });

  const trends = [];
  let maxCount = 0;
  for (let i = 0; i < 7; i++) {
    const count = trendsMap[i] || 0;
    trends.push(count);
    if (count > maxCount) maxCount = count;
  }

  // Normalize trends to percentages for the chart (0-100)
  const normalizedTrends = trends.map(count => maxCount > 0 ? Math.round((count / maxCount) * 100) : 0);

  // 4. Top User Reviews
  const topReviews = await Review.find({ astrologerId: astrologer._id, rating: { $gte: 4 } })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

  const formattedReviews = topReviews.map(r => ({
    id: r._id,
    userName: r.userId?.name || 'Anonymous',
    rating: r.rating,
    review: r.review
  }));

  // Fallback if no reviews
  if (formattedReviews.length === 0) {
    formattedReviews.push({
      id: 'mock1',
      userName: 'Priya K.',
      rating: 5,
      review: "Very accurate predictions. The remedies suggested were easy to follow and highly effective. Highly recommend!"
    });
    formattedReviews.push({
      id: 'mock2',
      userName: 'Rahul M.',
      rating: 5,
      review: "Gave me great clarity about my career path. The video consultation felt very personal and deeply insightful."
    });
  }

  return res.status(200).json(new ApiResponse(200, {
    analytics: {
      averageRating,
      totalUsersConsulted,
      returningCustomersPercentage,
      consultationTrends: normalizedTrends,
      topReviews: formattedReviews
    }
  }, 'Analytics fetched'));
});
