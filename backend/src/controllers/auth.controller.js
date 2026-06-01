import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import Admin from '../models/admin.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import SmsService from '../services/sms.service.js';
import { checkGlobalMobileExists } from '../utils/authUtils.js';

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

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// POST /api/user/auth/request-otp
export const requestOtp = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) throw new ApiError(400, 'Phone number is required');

  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const existingRole = await checkGlobalMobileExists(phoneNumber);
  if (existingRole && existingRole !== 'user') {
    throw new ApiError(409, `Mobile number already registered as ${existingRole}. Please use another number.`);
  }

  let user = await User.findOne({ phone: phoneNumber });
  if (!user) {
    user = new User({ phone: phoneNumber });
  }

  user.otpHash = otpHash;
  user.otpExpires = otpExpires;
  await user.save();

  await SmsService.sendOtp(phoneNumber, otp);

  return res.status(200).json(new ApiResponse(200, {}, `OTP sent to ${phoneNumber}`));
});

// POST /api/user/auth/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) throw new ApiError(400, 'Phone and OTP are required');

  const user = await User.findOne({ phone: phoneNumber });
  if (!user) throw new ApiError(404, 'User not found');

  if (!user.otpHash || !user.otpExpires) throw new ApiError(400, 'OTP not requested');
  if (user.otpExpires < new Date()) throw new ApiError(400, 'OTP has expired');

  const hash = crypto.createHash('sha256').update(otp).digest('hex');
  const isDevBypass = otp === '1234'; // Development bypass for local testing
  if (hash !== user.otpHash && !isDevBypass) throw new ApiError(400, 'Invalid OTP');

  user.otpHash = undefined;
  user.otpExpires = undefined;
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);
  setRefreshCookie(res, refreshToken);

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.otpHash;
  delete userObj.otpExpires;

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      user: userObj,
    }, 'OTP verified successfully')
  );
});

// POST /api/user/auth/login-signup  (combined flow)
export const loginOrSignup = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) throw new ApiError(400, 'Phone number is required');

  // Just trigger OTP for simplicity; frontend will call verify-otp next
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const existingRole = await checkGlobalMobileExists(phoneNumber);
  if (existingRole && existingRole !== 'user') {
    throw new ApiError(409, `Mobile number already registered as ${existingRole}. Please use another number.`);
  }

  let user = await User.findOne({ phone: phoneNumber });
  if (!user) user = new User({ phone: phoneNumber });

  user.otpHash = otpHash;
  user.otpExpires = otpExpires;
  await user.save();

  await SmsService.sendOtp(phoneNumber, otp);

  return res.status(200).json(new ApiResponse(200, { isNewUser: user.isNewUser }, 'OTP sent'));
});

// POST /api/user/auth/login  (verify + login)
export const login = asyncHandler(async (req, res) => {
  const { phoneNumber, otp } = req.body;
  return verifyOtp(req, res); // reuse verify-otp logic
});

// POST /api/user/auth/register  (complete profile after OTP)
export const register = asyncHandler(async (req, res) => {
  const { name, email, gender, dob, timeOfBirth, placeOfBirth, address, city, pincode } = req.body;
  const user = req.user;

  user.name = name || user.name;
  user.email = email || user.email;
  user.gender = gender || user.gender;
  user.dob = dob || user.dob;
  user.timeOfBirth = timeOfBirth || user.timeOfBirth;
  user.placeOfBirth = placeOfBirth || user.placeOfBirth;
  if (address !== undefined) user.address = address;
  if (city !== undefined) user.city = city;
  if (pincode !== undefined) user.pincode = pincode;
  user.isNewUser = false;

  await user.save();

  return res.status(200).json(new ApiResponse(200, { user }, 'Profile completed'));
});

// POST /api/auth/refresh
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token');

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.id).select('-password -otpHash');
  if (!user) throw new ApiError(401, 'User not found');

  const { accessToken, refreshToken: newRefresh } = generateTokens(user._id, user.role);
  setRefreshCookie(res, newRefresh);

  return res.status(200).json(new ApiResponse(200, { accessToken }, 'Token refreshed'));
});

// POST /api/user/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (user.password) {
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) throw new ApiError(400, 'Incorrect current password');
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, 'Password updated'));
});

// POST /api/admin/auth/login
export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password required');

  const user = await Admin.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  const { accessToken, refreshToken } = generateTokens(user._id, 'admin');
  setRefreshCookie(res, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken,
      user: { _id: user._id, name: user.name, email: user.email, role: 'admin' },
    }, 'Admin login successful')
  );
});
