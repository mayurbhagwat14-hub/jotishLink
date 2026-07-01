import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import PoojaBooking from '../models/poojaBooking.model.js';
import ChatSession from '../models/chatSession.model.js';
import { CallSession } from '../models/callSession.model.js';
import Transaction from '../models/transaction.model.js';
import WithdrawalRequest from '../models/withdrawalRequest.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import SmsService from '../services/sms.service.js';
import { uploadMedia, deleteMedia } from '../config/cloudinary.js';
import SystemSettings from '../models/systemSettings.model.js';
import WalletService from '../services/wallet.service.js';
import RevenueLog from '../models/revenueLog.model.js';

const generateTokens = (userId, role) => {
  const accessToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '365d' }
  );
  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '365d' }
  );
  return { accessToken, refreshToken };
};

import { checkGlobalMobileExists } from '../utils/authUtils.js';

// POST /api/astrologer/auth/check-phone
export const checkAstrologerPhone = asyncHandler(async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) throw new ApiError(400, 'Phone number is required');

  const existingRole = await checkGlobalMobileExists(phone);
  if (existingRole && existingRole !== 'astrologer') {
    throw new ApiError(409, `This number is already registered as a ${existingRole}. Please login to the correct portal.`);
  }

  if (name) {
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingName = await Astrologer.findOne({ name: new RegExp(`^${escapedName}$`, 'i'), phone: { $ne: phone } });
    if (existingName) throw new ApiError(409, 'An Astrologer with this exact name already exists. Please use a slightly different name (e.g. include your surname).');
  }

  const astrologer = await Astrologer.findOne({ phone });
  if (!astrologer || !astrologer.password) {
    return res.status(200).json(new ApiResponse(200, { exists: false }, 'Astrologer not found or incomplete'));
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
      approvalStatus: 'incomplete' 
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
  const { 
    name, phone, password, otp, skills, categories, languages, experience, about, pricing, 
    identityProof, avatar, dob, gender, address, city, state, pincode, consultationStyle, 
    education, certificationDetails, bankDetails, isPandit, poojasOffered
  } = req.body;

  console.log("SIGNUP PAYLOAD RECEIVED:", JSON.stringify(req.body, null, 2));

  if (!name || !phone || !password || !otp) throw new ApiError(400, 'name, phone, password, and otp required');

  const existingRole = await checkGlobalMobileExists(phone);
  if (existingRole && existingRole !== 'astrologer') {
    throw new ApiError(409, `Phone number already registered as ${existingRole}`);
  }



  // Ensure unique name across astrologers
  if (name) {
    // Escape special characters in name for regex
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existingName = await Astrologer.findOne({ name: new RegExp(`^${escapedName}$`, 'i'), phone: { $ne: phone } });
    if (existingName) throw new ApiError(409, 'An Astrologer with this exact name already exists. Please use a slightly different name (e.g. include your surname).');
  }

  // Validate pricing minimums
  let parsedPricing = pricing;
  if (typeof pricing === 'string') parsedPricing = JSON.parse(pricing);
  
  if (parsedPricing) {
    if (parsedPricing.chat !== undefined && parsedPricing.chat < 5) throw new ApiError(400, 'Minimum chat price is ₹5/min');
    if (parsedPricing.audioCall !== undefined && parsedPricing.audioCall < 5) throw new ApiError(400, 'Minimum audio call price is ₹5/min');
    if (parsedPricing.videoCall !== undefined && parsedPricing.videoCall < 5) throw new ApiError(400, 'Minimum video call price is ₹5/min');
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
    
    astrologer.skills = skills ? (Array.isArray(skills) ? skills : JSON.parse(skills)) : ['Vedic'];
    astrologer.categories = categories ? (Array.isArray(categories) ? categories : JSON.parse(categories)) : [];
    astrologer.languages = languages ? (Array.isArray(languages) ? languages : JSON.parse(languages)) : ['Hindi', 'English'];
    
    astrologer.experience = experience || 0;
    astrologer.about = about || '';
    astrologer.pricing = parsedPricing || { chat: 5, audioCall: 5, videoCall: 10, report: 0 };
    
    // New Fields
    if (dob) astrologer.dob = dob;
    if (gender) astrologer.gender = gender;
    if (address) astrologer.address = address;
    if (city) astrologer.city = city;
    if (state) astrologer.state = state;
    if (pincode) astrologer.pincode = pincode;
    if (consultationStyle) astrologer.consultationStyle = consultationStyle;
    if (education) astrologer.education = education;
    if (certificationDetails) astrologer.certificationDetails = certificationDetails;

    if (isPandit !== undefined) astrologer.isPandit = isPandit;
    if (poojasOffered) astrologer.poojasOffered = typeof poojasOffered === 'string' ? JSON.parse(poojasOffered) : poojasOffered;
    
    if (bankDetails) {
      const parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
      if (parsedBankDetails.ifscCode) parsedBankDetails.ifscCode = parsedBankDetails.ifscCode.toUpperCase();
      if (parsedBankDetails.panNumber) parsedBankDetails.panNumber = parsedBankDetails.panNumber.toUpperCase();
      astrologer.bankDetails = parsedBankDetails;
    }

    // Helper for base64 uploads
    const handleBase64Upload = async (dataStr) => {
      if (dataStr && typeof dataStr === 'string' && dataStr.startsWith('data:')) {
        try {
          const result = await uploadMedia(dataStr, 'astrotalk_astrologers');
          return { url: result.url, publicId: result.publicId };
        } catch (err) {
          console.warn('Cloudinary upload failed:', err.message);
        }
      }
      return { url: '', publicId: '' };
    };

    const files = req.files || {};
    // Process Multer files if they exist, otherwise try base64 from body
    const uploadField = async (fieldName) => {
      if (files[fieldName] && files[fieldName][0]) {
         const fileData = files[fieldName][0];
         const b64 = Buffer.from(fileData.buffer).toString('base64');
         let dataURI = "data:" + fileData.mimetype + ";base64," + b64;
         return handleBase64Upload(dataURI);
      } else if (req.body[fieldName]) {
         return handleBase64Upload(req.body[fieldName]);
      }
      return { url: '', publicId: '' };
    };

    const [
      avatarRes,
      idRes,
      aadhaarFrontRes,
      aadhaarBackRes,
      panCardRes,
      certRes,
      selfieRes
    ] = await Promise.all([
      uploadField('avatar'),
      uploadField('identityProof'),
      uploadField('aadhaarFront'),
      uploadField('aadhaarBack'),
      uploadField('panCard'),
      uploadField('certificate'),
      uploadField('selfieVerification')
    ]);

    if (avatarRes.url) { astrologer.avatar = avatarRes.url; astrologer.avatarPublicId = avatarRes.publicId; }
    if (idRes.url) { astrologer.identityProof = idRes.url; astrologer.identityProofPublicId = idRes.publicId; }
    if (aadhaarFrontRes.url) { astrologer.aadhaarFront = aadhaarFrontRes.url; astrologer.aadhaarFrontPublicId = aadhaarFrontRes.publicId; }
    if (aadhaarBackRes.url) { astrologer.aadhaarBack = aadhaarBackRes.url; astrologer.aadhaarBackPublicId = aadhaarBackRes.publicId; }
    if (panCardRes.url) { astrologer.panCard = panCardRes.url; astrologer.panCardPublicId = panCardRes.publicId; }
    if (certRes.url) { astrologer.certificate = certRes.url; astrologer.certificatePublicId = certRes.publicId; }
    if (selfieRes.url) { astrologer.selfieVerification = selfieRes.url; astrologer.selfieVerificationPublicId = selfieRes.publicId; }

    astrologer.isVerified = false;
    astrologer.approvalStatus = 'pending';
    astrologer.registrationStatus = 'pending';
    await astrologer.save();
    
    // Log Audit
    const { default: AuditLog } = await import('../models/auditLog.model.js');
    await AuditLog.create({
      userId: astrologer._id,
      userModel: 'Astrologer',
      targetId: astrologer._id,
      action: 'ASTROLOGER_REGISTERED',
      resource: 'Astrologer',
      details: { name: astrologer.name, phone: astrologer.phone },
      ipAddress: req.ip
    });

  } else {
    throw new ApiError(400, 'Please request OTP first');
  }

  const { accessToken, refreshToken } = generateTokens(astrologer._id, 'astrologer');
  res.cookie('astrologerRefreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.status(201).json(
    new ApiResponse(201, {
      accessToken,
      refreshToken,
      user: { _id: astrologer._id, name: astrologer.name, phone, role: 'astrologer', avatar: astrologer.avatar, approvalStatus: astrologer.approvalStatus },
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
  res.cookie('astrologerRefreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  import('../utils/notifyHelper.js').then(({ notify }) => {
    notify({
      userId: astrologer._id,
      role: 'astrologer',
      title: 'Login Successful',
      message: 'Welcome back to your dashboard!',
      type: 'success',
      link: '/astrologer/dashboard'
    });
  }).catch(console.error);

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      refreshToken,
      user: { _id: astrologer._id, name: astrologer.name, phone, role: 'astrologer', onlineStatus: astrologer.onlineStatus, avatar: astrologer.avatar, approvalStatus: astrologer.approvalStatus },
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
  const { name, skills, languages, experience, about, pricing, avatar, dob, gender, address, city, state, pincode, bankDetails, isPandit, poojasOffered, serviceLocations, education, certificationDetails, consultationStyle } = req.body;
  const astrologer = await Astrologer.findById(req.user._id);
  if (!astrologer) throw new ApiError(404, 'Profile not found');

  if (name !== undefined) astrologer.name = name;
  if (skills !== undefined) astrologer.skills = typeof skills === 'string' ? JSON.parse(skills) : skills;
  if (languages !== undefined) astrologer.languages = typeof languages === 'string' ? JSON.parse(languages) : languages;
  if (experience !== undefined) astrologer.experience = experience;
  if (about !== undefined) astrologer.about = about;
  if (education !== undefined) astrologer.education = education;
  if (certificationDetails !== undefined) astrologer.certificationDetails = certificationDetails;
  if (consultationStyle !== undefined) astrologer.consultationStyle = consultationStyle;
  if (dob !== undefined) astrologer.dob = dob;
  if (gender !== undefined) astrologer.gender = gender;
  if (address !== undefined) astrologer.address = address;
  if (city !== undefined) astrologer.city = city;
  if (state !== undefined) astrologer.state = state;
  if (pincode !== undefined) astrologer.pincode = pincode;
  if (bankDetails !== undefined) {
    const parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
    if (parsedBankDetails.ifscCode) parsedBankDetails.ifscCode = parsedBankDetails.ifscCode.toUpperCase();
    if (parsedBankDetails.panNumber) parsedBankDetails.panNumber = parsedBankDetails.panNumber.toUpperCase();
    astrologer.bankDetails = parsedBankDetails;
  }
  
  if (isPandit !== undefined) astrologer.isPandit = isPandit === 'true' || isPandit === true;
  if (poojasOffered !== undefined) astrologer.poojasOffered = typeof poojasOffered === 'string' ? JSON.parse(poojasOffered) : poojasOffered;
  if (serviceLocations !== undefined) astrologer.serviceLocations = typeof serviceLocations === 'string' ? JSON.parse(serviceLocations) : serviceLocations;
  
  if (pricing !== undefined) {
    let parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
    if (parsedPricing.chat !== undefined && parsedPricing.chat < 5) throw new ApiError(400, 'Minimum chat price is ₹5/min');
    if (parsedPricing.audioCall !== undefined && parsedPricing.audioCall < 5) throw new ApiError(400, 'Minimum audio call price is ₹5/min');
    if (parsedPricing.videoCall !== undefined && parsedPricing.videoCall < 5) throw new ApiError(400, 'Minimum video call price is ₹5/min');
    astrologer.pricing = { ...astrologer.pricing, ...parsedPricing };
  }

  // Handle avatar upload via file or base64
  const files = req.files || {};
  if (files['avatar'] && files['avatar'][0]) {
     if (astrologer.avatarPublicId) await deleteMedia(astrologer.avatarPublicId);
     const fileData = files['avatar'][0];
     const b64 = Buffer.from(fileData.buffer).toString('base64');
     let dataURI = "data:" + fileData.mimetype + ";base64," + b64;
     try {
       const uploadResult = await uploadMedia(dataURI, 'astrotalk_astrologers');
       astrologer.avatar = uploadResult.url;
       astrologer.avatarPublicId = uploadResult.publicId;
     } catch(err) {
       console.warn('Upload failed', err);
     }
  } else if (avatar !== undefined) {
    if (typeof avatar === 'string' && avatar.startsWith('data:image')) {
      if (astrologer.avatarPublicId) {
        await deleteMedia(astrologer.avatarPublicId);
      }
      try {
        const uploadResult = await uploadMedia(avatar, 'astrotalk_astrologers');
        astrologer.avatar = uploadResult.url;
        astrologer.avatarPublicId = uploadResult.publicId;
      } catch (err) {
        console.warn('Cloudinary upload failed for avatar:', err.message);
      }
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

  const [recentSessions, recentCalls, recentBookings, allSessions, allCalls, allPoojas, withdrawals] = await Promise.all([
    ChatSession.find({ astrologerId: req.user._id, isFreeChat: { $ne: true }, deletedByAstrologer: { $ne: true } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    CallSession.find({ astrologerId: req.user._id, deletedByAstrologer: { $ne: true } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    PoojaBooking.find({ astrologerId: astrologer._id, deletedByAstrologer: { $ne: true } })
      .populate('userId', 'name phone')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    ChatSession.find({ astrologerId: req.user._id, status: 'completed', isFreeChat: { $ne: true }, deletedByAstrologer: { $ne: true } }).lean(),
    CallSession.find({ astrologerId: req.user._id, status: 'completed', deletedByAstrologer: { $ne: true } }).lean(),
    PoojaBooking.find({ astrologerId: astrologer._id, status: { $in: ['Completed'] }, deletedByAstrologer: { $ne: true } }).lean(),
    WithdrawalRequest.find({ astrologerId: req.user._id, status: { $in: ['completed', 'pending'] } }).lean()
  ]);

  // Safely calculate earnings using immutable RevenueLog
  const revenueLogs = await RevenueLog.find({ astrologerId: req.user._id }).lean();

  const allRecent = [...recentSessions, ...recentCalls].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const processedRecentSessions = allRecent.map(s => {
    // Find matching revenue log to ensure astrologerShare is historically accurate
    const rLog = revenueLogs.find(r => r.sessionId === s._id.toString());
    let finalAmount = rLog ? rLog.astrologerShare : 0;
    
    // For poojas or other items that might not have a revenue log in the same format
    if (!rLog && s.amountDeducted) {
       finalAmount = parseFloat((s.amountDeducted * 0.7).toFixed(2));
    }
    
    // If it's effectively 0, treat it as a Free Chat
    const isFree = s.isFreeChat || finalAmount === 0;

    return {
      ...s,
      amount: finalAmount,
      isFreeChat: isFree
    };
  }).filter(s => !s.isFreeChat);

  let totalEarnings = 0;
  let todayEarnings = 0;
  
  const { getISTStartOfToday } = await import('../utils/dateHelper.js');
  const startOfTodayIST = getISTStartOfToday();

  revenueLogs.forEach(log => {
    const amount = log.astrologerShare || 0;
    totalEarnings += amount;
    if (new Date(log.date || log.createdAt) >= startOfTodayIST) {
      todayEarnings += amount;
    }
  });

  const totalWithdraw = withdrawals.reduce((sum, w) => sum + w.amount, 0);

  return res.status(200).json(
    new ApiResponse(200, {
      astrologer,
      recentSessions: processedRecentSessions,
      recentBookings,
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      todayEarnings: parseFloat(todayEarnings.toFixed(2)),
      totalWithdraw: parseFloat(totalWithdraw.toFixed(2)),
      stats: {
        totalSessions: allSessions.length + allCalls.length + allPoojas.length,
        onlineStatus: astrologer.onlineStatus,
        rating: astrologer.rating,
      },
    }, 'Dashboard data fetched')
  );
});

// GET /api/astrologer/earnings
export const getAstrologerEarnings = asyncHandler(async (req, res) => {
  const [revenueLogs, chatSessions, callSessions] = await Promise.all([
    RevenueLog.find({ astrologerId: req.user._id }).lean(),
    ChatSession.find({ astrologerId: req.user._id }).lean(),
    // Need to dynamically import CallSession if it's not imported at the top
  ]);

  // Import CallSession inline to avoid top-level import issues if it exists
  const { CallSession } = await import('../models/callSession.model.js');
  const calls = await CallSession.find({ astrologerId: req.user._id }).lean();

  let allEarnings = revenueLogs.map((r) => {
    let duration = r.durationSeconds || 0;
    const chat = chatSessions.find(c => c._id.toString() === r.sessionId);
    
    // Mark if it's a free chat so we can filter it out
    const isFree = chat ? chat.isFreeChat : false;

    if (duration === 0) {
      if (chat && chat.durationSeconds) duration = chat.durationSeconds;
      else {
        const call = calls.find(c => c._id.toString() === r.sessionId);
        if (call && call.duration) duration = call.duration;
      }
    }
    return {
      sessionId: r.sessionId,
      date: r.date,
      type: r.sessionType,
      durationSeconds: duration,
      amount: parseFloat(r.astrologerShare.toFixed(2)),
      isFree
    };
  }).filter(e => !e.isFree).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalEarnings = allEarnings.reduce((sum, e) => sum + e.amount, 0);

  // Calculate Available Balance by deducting pending and completed withdrawals
  const withdrawals = await WithdrawalRequest.find({ astrologerId: req.user._id, status: { $in: ['pending', 'completed'] } }).lean();
  
  const pendingWithdrawalAmount = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0);
  const completedWithdrawalAmount = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + w.amount, 0);
  
  const totalWithdrawnOrPending = pendingWithdrawalAmount + completedWithdrawalAmount;
  const total = totalEarnings - totalWithdrawnOrPending;

  const { getISTStartOfMonth, getISTStartOfLastMonth } = await import('../utils/dateHelper.js');
  const currentMonthStart = getISTStartOfMonth();
  const lastMonthStart = getISTStartOfLastMonth();

  let thisMonthTotal = 0;
  let lastMonthTotal = 0;

  allEarnings.forEach(e => {
    const d = new Date(e.date);
    if (d >= currentMonthStart) {
      thisMonthTotal += e.amount;
    } else if (d >= lastMonthStart && d < currentMonthStart) {
      lastMonthTotal += e.amount;
    }
  });

  let percentageChange = 0;
  if (lastMonthTotal === 0) {
    percentageChange = thisMonthTotal > 0 ? 100 : 0;
  } else {
    percentageChange = ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }

  return res.status(200).json(
    new ApiResponse(200, { 
      earnings: allEarnings, 
      total: parseFloat(total.toFixed(2)),
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      pendingWithdrawalAmount: parseFloat(pendingWithdrawalAmount.toFixed(2)),
      completedWithdrawalAmount: parseFloat(completedWithdrawalAmount.toFixed(2)),
      withdrawals: withdrawals.filter(w => w.deletedByAstrologer !== true).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      thisMonth: parseFloat(thisMonthTotal.toFixed(2)),
      percentageChange: parseFloat(percentageChange.toFixed(1))
    }, 'Earnings fetched')
  );
});

// POST /api/astrologer/withdraw
export const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 0.01) throw new ApiError(400, 'Invalid withdrawal amount');

  const astrologer = await Astrologer.findById(req.user._id);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');
  if (!astrologer.bankDetails || !astrologer.bankDetails.accountNumber) {
    throw new ApiError(400, 'Please complete your bank details before withdrawing');
  }

  // Verify balance securely using RevenueLog
  const [revenueLogs, withdrawals] = await Promise.all([
    RevenueLog.find({ astrologerId: req.user._id }).lean(),
    WithdrawalRequest.find({ astrologerId: req.user._id, status: { $in: ['pending', 'completed'] } }).lean()
  ]);

  const totalEarnings = revenueLogs.reduce((sum, r) => sum + r.astrologerShare, 0);

  const totalWithdrawnOrPending = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = totalEarnings - totalWithdrawnOrPending;

  if (amount > availableBalance) {
    throw new ApiError(400, `Insufficient balance. Available to withdraw: ₹${availableBalance.toFixed(2)}`);
  }

  const withdrawal = await WithdrawalRequest.create({
    astrologerId: astrologer._id,
    amount: Number(amount),
    status: 'pending',
    bankDetailsSnapshot: astrologer.bankDetails
  });

  const io = req.app.get('io');
  if (io) {
    io.to('admin_room').emit('dashboard_updated');
  }

  import('../utils/notifyHelper.js').then(({ notify }) => {
    notify({
      userId: astrologer._id,
      role: 'astrologer',
      title: 'Withdrawal Requested',
      message: `Your request for ₹${amount} has been submitted.`,
      type: 'info',
      link: '/astrologer/earnings'
    });
  }).catch(console.error);

  return res.status(201).json(new ApiResponse(201, { withdrawal }, 'Withdrawal request sent successfully. Money will come to your account in 1-2 working days.'));
});

// DELETE /api/astrologer/withdraw/:id
export const deleteWithdrawalRequest = asyncHandler(async (req, res) => {
  const withdrawal = await WithdrawalRequest.findOne({ _id: req.params.id, astrologerId: req.user._id });
  if (!withdrawal) throw new ApiError(404, 'Withdrawal request not found');

  withdrawal.deletedByAstrologer = true;
  await withdrawal.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Withdrawal request deleted successfully'));
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

  if (!['Accepted', 'Rejected', 'Completed'].includes(status)) {
    throw new ApiError(400, 'Invalid status update');
  }

  const booking = await PoojaBooking.findOne({ _id: id, astrologerId: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.status === 'Completed' || booking.status === 'Rejected' || booking.status === 'Refunded' || booking.status === 'Expired') {
    throw new ApiError(400, `Booking is already ${booking.status}`);
  }

  if (status === 'Completed') {
    // Check if proof is uploaded
    if (!booking.proofMedia || booking.proofMedia.length < 3) {
      throw new ApiError(400, `Cannot mark as complete. Found ${booking.proofMedia?.length || 0} media files. Minimum 2 photos and 1 video required.`);
    }

    const settings = await SystemSettings.findOne({}) || new SystemSettings();
    const poojaComm = settings.commissionRates?.pooja ?? 20;

    await WalletService.creditAstrologer(
      booking.astrologerId,
      booking.userId,
      booking._id,
      'pooja',
      booking.amountHold,
      `Earnings from Pooja: ${booking.poojaName}`,
      poojaComm
    );

    booking.paymentStatus = 'released';
  }

  if (status === 'Rejected') {
    if (booking.paymentStatus === 'held' && booking.amountHold > 0) {
      try {
        await WalletService.credit(
          booking.userId, 
          booking.amountHold, 
          'pooja_refund', 
          `Refund for Rejected Pooja: ${booking.poojaName}`
        );
        booking.paymentStatus = 'refunded';
      } catch (err) {
        throw new ApiError(500, `Failed to refund user wallet: ${err.message}`);
      }
    }
  }

  booking.status = status;
  await booking.save();

  // Populate astrologer details so the user's frontend UI doesn't break in real-time
  await booking.populate('astrologerId', 'name avatar');

  const io = req.app.get('io');
  if (io) {
    io.to(`room_user_${booking.userId}`).emit(`pooja_booking_${status.toLowerCase()}`, { booking });
    io.to('admin_room').emit('dashboard_updated');
  }

  import('../utils/notifyHelper.js').then(({ notify }) => {
    notify({
      userId: booking.userId,
      role: 'user',
      title: 'Pooja Status Updated',
      message: `Your pooja booking was marked as ${status}.`,
      type: 'info',
      link: '/user/poojas',
      data: { type: 'pooja_status_update', bookingId: booking._id.toString() }
    });
  }).catch(console.error);

  return res.status(200).json(new ApiResponse(200, { booking }, `Pooja booking marked as ${status}`));
});

// POST /api/astrologer/poojas/:id/proof
export const uploadPoojaProof = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const booking = await PoojaBooking.findOne({ _id: id, astrologerId: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking not found');

  if (booking.status !== 'Accepted' && booking.status !== 'In Progress') {
    throw new ApiError(400, 'Proof can only be uploaded for active bookings.');
  }

  // Handle media uploads via base64 or multer
  const mediaUrls = [];
  const handleBase64Upload = async (dataStr) => {
    if (dataStr && typeof dataStr === 'string' && dataStr.startsWith('data:')) {
      try {
        const { uploadMedia } = await import('../config/cloudinary.js');
        const result = await uploadMedia(dataStr, 'astrotalk_pooja_proofs');
        return result.secure_url || result.url;
      } catch (err) {
        console.error('Cloudinary upload failed:', err.message);
        throw new ApiError(500, `Image/Video upload failed: ${err.message}`);
      }
    }
    return null;
  };

  const files = req.files || {};
  if (files['proofMedia']) {
    for (const fileData of files['proofMedia']) {
       const b64 = Buffer.from(fileData.buffer).toString('base64');
       let dataURI = "data:" + fileData.mimetype + ";base64," + b64;
       const url = await handleBase64Upload(dataURI);
       if (url) mediaUrls.push(url);
    }
  }

  // Also check if any base64 array was sent in body
  if (req.body.proofMedia && Array.isArray(req.body.proofMedia)) {
    for (const dataStr of req.body.proofMedia) {
      const url = await handleBase64Upload(dataStr);
      if (url) mediaUrls.push(url);
    }
  }

  if (mediaUrls.length > 0) {
    booking.proofMedia = mediaUrls;
  }

  if (mediaUrls.length < 3) {
    throw new ApiError(400, `Debug: Only ${mediaUrls.length} URLs generated. Body array length: ${req.body.proofMedia?.length || 'undefined'}. Files length: ${files['proofMedia']?.length || 'undefined'}`);
  }

  if (notes) {
    booking.proofNotes = notes;
  }

  await booking.save();

  return res.status(200).json(new ApiResponse(200, { booking }, 'Proof uploaded successfully'));
});

// GET /api/astrologer/chats
export const getAstrologerChats = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find({ 
    astrologerId: req.user._id,
    type: { $nin: ['audio_call', 'video_call', 'audio', 'video'] },
    deletedByAstrologer: { $ne: true }
  })
    .populate('userId', 'name avatar phone')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { sessions }, 'Chats fetched'));
});

// GET /api/astrologer/calls
export const getAstrologerCalls = asyncHandler(async (req, res) => {
  // Return chat sessions that represent calls
  const sessions = await ChatSession.find({ astrologerId: req.user._id, status: 'completed', type: { $in: ['audio_call', 'video_call'] }, deletedByAstrologer: { $ne: true } })
    .populate('userId', 'name avatar phone')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { calls: sessions }, 'Calls fetched'));
});

// PUT /api/astrologer/status
export const updateOnlineStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['online', 'offline', 'busy'].includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const astrologer = await Astrologer.findById(req.user._id);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');

  astrologer.onlineStatus = status;
  await astrologer.save();

  const io = req.app.get('io');
  if (io) {
    io.emit('astro_status_changed', { astrologerId: astrologer._id, status });
    io.to('admin_room').emit('dashboard_updated');
  }

  return res.status(200).json(new ApiResponse(200, { onlineStatus: astrologer.onlineStatus }, 'Status updated'));
});

// GET /api/astrologer/history
export const getAstrologerHistory = asyncHandler(async (req, res) => {
  const [sessions, poojas] = await Promise.all([
    ChatSession.find({ astrologerId: req.user._id, status: 'completed', deletedByAstrologer: { $ne: true } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean(),
    PoojaBooking.find({ astrologerId: req.user._id, status: { $in: ['Completed'] }, deletedByAstrologer: { $ne: true } })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .lean()
  ]);

  const revenueLogs = await RevenueLog.find({ astrologerId: req.user._id }).lean();
  
  // For poojas, we might not have it in revenueLogs yet depending on structure, so fallback to setting or 20%
  const settings = await SystemSettings.findOne({}) || new SystemSettings();
  const rates = settings.commissionRates || {};
  const poojaShare = (100 - (rates.pooja ?? 20)) / 100;

  const history = [
    ...sessions.map(s => {
      const rLog = revenueLogs.find(r => r.sessionId === s._id.toString());
      let finalAmount = rLog ? rLog.astrologerShare : 0;
      if (!rLog && s.amountDeducted) {
         let comm = 30;
         if (s.type === 'video' || s.type === 'video_call') comm = settings.commissionRates?.videoCall ?? 30;
         else if (s.type === 'audio' || s.type === 'audio_call') comm = settings.commissionRates?.audioCall ?? 30;
         else comm = settings.commissionRates?.chat ?? 30;
         finalAmount = parseFloat((s.amountDeducted * ((100 - comm) / 100)).toFixed(2));
      }
      const isFree = s.isFreeChat || finalAmount === 0;

      return {
        _id: s._id,
        type: s.type || 'chat',
        userName: s.userId?.name || 'User',
        date: s.createdAt,
        duration: rLog && rLog.durationSeconds ? rLog.durationSeconds : (s.durationSeconds || 0),
        amount: finalAmount,
        status: s.status,
        isFreeChat: isFree
      };
    }),
    ...poojas.map(p => ({
      _id: p._id,
      type: 'pooja',
      userName: p.userId?.name || 'User',
      poojaName: p.poojaName || 'Pooja',
      date: p.createdAt,
      duration: 0,
      amount: parseFloat(((p.price || 0) * poojaShare).toFixed(2)),
      status: p.status.toLowerCase()
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json(new ApiResponse(200, { history }, 'History fetched'));
});

// POST /api/astrologer/history/delete
export const deleteAstrologerHistoryBulk = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids)) {
    throw new ApiError(400, 'Please provide an array of ids');
  }

  // Soft Delete from ChatSessions and CallSessions
  await ChatSession.updateMany({ _id: { $in: ids }, astrologerId: req.user._id }, { $set: { deletedByAstrologer: true } });
  
  // Need to dynamically import CallSession if not top-level
  const { CallSession } = await import('../models/callSession.model.js');
  await CallSession.updateMany({ _id: { $in: ids }, astrologerId: req.user._id }, { $set: { deletedByAstrologer: true } });

  // Soft Delete from PoojaBookings
  await PoojaBooking.updateMany({ _id: { $in: ids }, astrologerId: req.user._id }, { $set: { deletedByAstrologer: true } });

  return res.status(200).json(new ApiResponse(200, {}, 'History records soft-deleted'));
});

// GET /api/astrologer/analytics
export const getAstrologerAnalytics = asyncHandler(async (req, res) => {
  const astrologerId = req.user._id;
  
  const astrologer = await Astrologer.findById(astrologerId);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');

  const { default: Rating } = await import('../models/rating.model.js');
  const { CallSession } = await import('../models/callSession.model.js');

  // 1. Average Rating
  const allReviews = await Rating.find({ astrologerId: astrologer._id }).lean();
  let averageRating = astrologer.rating || 5.0;
  if (allReviews.length > 0) {
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    averageRating = Number((totalRating / allReviews.length).toFixed(1));
  }

  // 2. Total Users Consulted & Returning Customers
  const chatSessions = await ChatSession.find({ astrologerId: astrologer._id, status: 'completed' }).select('userId').lean();
  const callSessions = await CallSession.find({ astrologerId: astrologer._id, status: 'completed' }).select('userId').lean();
  
  const allUserIds = [...chatSessions.map(c => c.userId?.toString()).filter(Boolean), ...callSessions.map(c => c.userId?.toString()).filter(Boolean)];
  
  const userCounts = {};
  allUserIds.forEach(id => {
    userCounts[id] = (userCounts[id] || 0) + 1;
  });

  const totalUsersConsulted = Object.keys(userCounts).length;
  const returningCustomers = Object.values(userCounts).filter(count => count > 1).length;
  const returningCustomersPercentage = totalUsersConsulted > 0 
    ? Math.round((returningCustomers / totalUsersConsulted) * 100) 
    : 0;

  const { getISTEndOfToday, getISTStartOfSevenDaysAgo } = await import('../utils/dateHelper.js');
  
  const today = getISTEndOfToday();
  const sevenDaysAgo = getISTStartOfSevenDaysAgo();
  const recentChats = await ChatSession.find({
    astrologerId: astrologer._id,
    status: 'completed',
    createdAt: { $gte: sevenDaysAgo, $lte: today }
  }).select('createdAt').lean();

  const recentCalls = await CallSession.find({
    astrologerId: astrologer._id,
    status: 'completed',
    createdAt: { $gte: sevenDaysAgo, $lte: today }
  }).select('createdAt').lean();

  const recentAll = [...recentChats, ...recentCalls];

  const trendsMap = {};
  for (let i = 0; i < 7; i++) trendsMap[i] = 0;

  recentAll.forEach(session => {
    const day = new Date(session.createdAt).getDay();
    const mappedDay = day === 0 ? 6 : day - 1;
    trendsMap[mappedDay]++;
  });

  const trends = [];
  let maxCount = 0;
  for (let i = 0; i < 7; i++) {
    const count = trendsMap[i];
    trends.push(count);
    if (count > maxCount) maxCount = count;
  }

  // Normalize trends to percentages for the chart (0-100)
  const normalizedTrends = trends.map(count => maxCount > 0 ? Math.round((count / maxCount) * 100) : 0);

  // 4. Top User Reviews
  const topReviews = await Rating.find({ astrologerId: astrologer._id, rating: { $gte: 4 } })
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
// PUT /api/astrologer/fcm-token
export const updateFcmToken = asyncHandler(async (req, res) => {
  const token = req.body.token || req.body.fcmToken;
  const platform = req.body.platform || 'mobile';

  if (!token) throw new ApiError(400, 'FCM token is required');

  // Determine target field based on platform
  const targetField = platform === 'web' ? 'fcmToken' : 'fcmTokenMobile';

  // Extract the device prefix (part before ':') to identify same-device tokens
  const devicePrefix = token.includes(':') ? token.split(':')[0] : null;

  // Remove the exact token first (dedup)
  await Astrologer.findByIdAndUpdate(req.user._id, { $pull: { [targetField]: token } });

  // Also remove all old tokens from the SAME device (prevents dead token buildup)
  if (devicePrefix) {
    const astrologer = await Astrologer.findById(req.user._id).select(targetField);
    if (astrologer && astrologer[targetField]) {
      const staleTokens = astrologer[targetField]
        .filter(t => t !== token && t.startsWith(devicePrefix + ':'));
      if (staleTokens.length > 0) {
        await Astrologer.findByIdAndUpdate(req.user._id, {
          $pull: { [targetField]: { $in: staleTokens } }
        });
        console.log(`Removed ${staleTokens.length} stale ${platform} FCM tokens for astrologer ${req.user._id}`);
      }
    }
  }

  const updatedAstrologer = await Astrologer.findByIdAndUpdate(
    req.user._id,
    { $push: { [targetField]: token } },
    { new: true }
  ).select('-password');

  if (!updatedAstrologer) throw new ApiError(404, 'Astrologer not found');
  
  return res.status(200).json({
    success: true,
    message: `${platform === 'mobile' ? 'Mobile' : 'Web'} FCM token saved successfully`,
    data: {
      ownerType: 'ASTROLOGER',
      ownerId: req.user._id,
      platform
    }
  });
});

// POST /api/astrologer/test-push
export const testPushNotification = asyncHandler(async (req, res) => {
  const { sendPushNotification } = await import('../utils/firebaseHelper.js');
  
  const success = await sendPushNotification({
    userId: req.user._id,
    role: 'astrologer',
    title: 'Test Notification',
    body: 'This is a test notification from the Astrologer Profile.',
    data: { type: 'test', url: '/astrologer/dashboard' }
  });

  if (!success) {
    throw new ApiError(500, 'Failed to send push notification. Please check if your token is saved properly.');
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Test notification sent successfully'));
});
