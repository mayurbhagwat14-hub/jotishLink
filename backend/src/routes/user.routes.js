import { Router } from 'express';
import {
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
  getHomepageData,
  getAstrologers,
  getAstrologerById,
  getStoreProducts,
  getStorePandits,
  getProductById,
  bookPooja,
  getUserPoojas,
  getUserSessions,
  getUserWallet,
  deleteUserHistory,
  rateAstrologer,
  updateFcmToken,
} from '../controllers/user.controller.js';
import { verifyJWT, authorizeRoles, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Routes (Optional authentication for personalized data)
router.get('/user/homepage-data', optionalAuth, getHomepageData);
router.get('/astrologers', optionalAuth, getAstrologers);
router.get('/astrologers/:id', optionalAuth, getAstrologerById);
router.get('/products', optionalAuth, getStoreProducts);
router.get('/products/:id', optionalAuth, getProductById);
router.get('/pandits', optionalAuth, getStorePandits);

// Protected Routes
// User profile
router.get('/user/profile', verifyJWT, getUserProfile);
router.put('/user/profile', verifyJWT, updateUserProfile);
router.delete('/user/profile/delete', verifyJWT, deleteUserAccount);

// Pooja booking
router.post('/pooja/book', verifyJWT, bookPooja);
router.get('/user/poojas', verifyJWT, getUserPoojas);

// Sessions & wallet history
router.get('/user/sessions', verifyJWT, getUserSessions);
router.get('/user/wallet', verifyJWT, getUserWallet);
router.post('/user/history/delete', verifyJWT, deleteUserHistory);
router.post('/user/rate-astrologer', verifyJWT, rateAstrologer);

// FCM Token
router.put('/user/fcm-token', verifyJWT, updateFcmToken);

export default router;
