import { Router } from 'express';
import {
  requestOtp,
  verifyOtp,
  loginOrSignup,
  login,
  register,
  refreshToken,
  logout,
  changePassword,
  adminLogin,
  saveUserDraft,
  fetchUserDraft,
} from '../controllers/auth.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { otpRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  validate,
  requestOtpSchema,
  verifyOtpSchema,
  registerUserSchema,
  changePasswordSchema,
  adminLoginSchema,
} from '../middlewares/validation.middleware.js';

const router = Router();

// Public auth routes
router.post('/user/auth/request-otp', otpRateLimiter, validate(requestOtpSchema), requestOtp);
router.post('/user/auth/verify-otp', validate(verifyOtpSchema), verifyOtp);
router.post('/user/auth/login-signup', otpRateLimiter, validate(requestOtpSchema), loginOrSignup);
router.post('/user/auth/login', validate(verifyOtpSchema), login);
router.post('/user/auth/register', validate(registerUserSchema), register);
router.post('/user/auth/draft/save', saveUserDraft);
router.post('/user/auth/draft/fetch', fetchUserDraft);

// Protected user routes
router.post('/user/auth/change-password', verifyJWT, validate(changePasswordSchema), changePassword);

// Token refresh (cookie-based)
router.post('/auth/refresh', refreshToken);
router.post('/auth/logout', logout);

// Admin login
router.post('/admin/auth/login', validate(adminLoginSchema), adminLogin);

export default router;
