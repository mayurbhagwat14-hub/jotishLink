import { Router } from 'express';
import {
  checkAstrologerPhone,
  astrologerRequestOtp,
  astrologerSignup,
  astrologerLogin,
  astrologerChangePassword,
  getAstrologerProfile,
  updateAstrologerProfile,
  deleteAstrologerAccount,
  getAstrologerDashboard,
  getAstrologerEarnings,
  getAstrologerPoojaRequests,
  updatePoojaStatus,
  getAstrologerChats,
  getAstrologerCalls,
  updateOnlineStatus,
  getAstrologerHistory,
} from '../controllers/astrologer.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { otpRateLimiter } from '../middlewares/rateLimiter.middleware.js';
import {
  validate,
  astrologerCheckPhoneSchema,
  astrologerSignupSchema,
  astrologerLoginSchema,
  changePasswordSchema,
} from '../middlewares/validation.middleware.js';

const router = Router();

// Public astrologer auth
router.post('/astrologer/auth/check-phone', validate(astrologerCheckPhoneSchema), checkAstrologerPhone);
router.post('/astrologer/auth/request-otp', otpRateLimiter, validate(astrologerCheckPhoneSchema), astrologerRequestOtp);
router.post('/astrologer/auth/signup', validate(astrologerSignupSchema), astrologerSignup);
router.post('/astrologer/auth/login', validate(astrologerLoginSchema), astrologerLogin);

// Protected astrologer routes
const astroAuth = [verifyJWT, authorizeRoles('astrologer', 'admin')];
router.post('/astrologer/auth/change-password', astroAuth, validate(changePasswordSchema), astrologerChangePassword);
router.get('/astrologer/profile', astroAuth, getAstrologerProfile);
router.put('/astrologer/profile/update', astroAuth, updateAstrologerProfile);
router.delete('/astrologer/profile', astroAuth, deleteAstrologerAccount);
router.delete('/astrologer/profile/delete', astroAuth, deleteAstrologerAccount);

router.get('/astrologer/dashboard', astroAuth, getAstrologerDashboard);
router.get('/astrologer/earnings', astroAuth, getAstrologerEarnings);
router.get('/astrologer/pooja-requests', astroAuth, getAstrologerPoojaRequests);
router.put('/astrologer/poojas/:id/status', astroAuth, updatePoojaStatus);
router.get('/astrologer/chats', astroAuth, getAstrologerChats);
router.get('/astrologer/calls', astroAuth, getAstrologerCalls);
router.get('/astrologer/history', astroAuth, getAstrologerHistory);
router.put('/astrologer/status', astroAuth, updateOnlineStatus);

export default router;
