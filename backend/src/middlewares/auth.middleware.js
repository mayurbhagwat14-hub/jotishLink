import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import Admin from '../models/admin.model.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

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
      throw new ApiError(401, 'Unauthorized request: Invalid Access Token');
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || 'Invalid Access Token');
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
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
  } catch (error) {
    // ignore token errors for optional auth
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
