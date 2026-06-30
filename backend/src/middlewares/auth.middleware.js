import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import Admin from '../models/admin.model.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
    
  if (!token && req.cookies) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new ApiError(401, 'Unauthorized request: Token is missing');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'supersecretaccesskey1234567890');
    let user;

    if (decoded.role === 'astrologer') {
      user = await Astrologer.findById(decoded.id).select('-password -otpHash');
    } else if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id).select('-password');
      if (user) user.role = 'admin'; // ensure role exists
    } else {
      user = await User.findById(decoded.id).select('-password -otpHash');
    }

    if (!user) {
      console.error(`verifyJWT Failed: User not found in DB for id ${decoded.id} with role ${decoded.role}`);
      throw new ApiError(401, 'Unauthorized request: Invalid Access Token');
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name !== 'TokenExpiredError') {
      console.error('verifyJWT Failed: JWT verification error or other error:', error.message);
    }
    throw new ApiError(401, error.message || 'Invalid Access Token');
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
    
  if (!token && req.cookies) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.role === 'astrologer') {
      req.user = await Astrologer.findById(decoded.id).select('-password -otpHash');
    } else if (decoded.role === 'admin') {
      req.user = await Admin.findById(decoded.id).select('-password');
      if (req.user) req.user.role = 'admin';
    } else {
      req.user = await User.findById(decoded.id).select('-password');
    }

    if (!req.user) {
      throw new ApiError(401, 'User no longer exists');
    }
  } catch (error) {
    // If token is invalid/expired or user is deleted, force a 401 so frontend can logout/refresh
    throw new ApiError(401, error.message || 'Invalid Access Token');
  }
  next();
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, `Access Denied: Role '${req.user?.role || 'Guest'}' is unauthorized`);
    }
    next();
  };
};
