import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminUsers,
  updateUserStatus,
  deleteAdminUser,
  getAdminAstrologers,
  updateAstrologerStatus,
  deleteAdminAstrologer,
  getAdminOrders,
  updateOrderStatus,
  processCancelRequest,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getAdminSettings,
  updateAdminSettings,
  updateAdminProfile,
  deleteAdminProfile,
  adminChangePassword,
  getAdminCelebrities,
  createAdminCelebrity,
  updateAdminCelebrity,
  deleteAdminCelebrity,
  refundUserWallet,
  getAdminTransactions,
  getAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  getAdminBanners,
  createAdminBanner,
  updateAdminBanner,
  deleteAdminBanner,
  getAdminAuditLogs,
  deleteAdminAuditLog,
  getAdminSessions,
  getAdminPoojas,
  getAdminReports,
  getAdminCalls,
  getAdminCallAnalytics,
  deleteAdminSession,
  deleteAdminCall,
  getAstrologerPayouts,
  processAstrologerPayout,
  getAdminAstrologerById,
  sendBroadcast,
  getAdminEarnings,
} from '../controllers/admin.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { auditLogMiddleware } from '../middlewares/audit.middleware.js';
import { validate, refundUserSchema } from '../middlewares/validation.middleware.js';

const router = Router();

// All admin routes require admin role
router.use('/admin', verifyJWT, authorizeRoles('admin'), auditLogMiddleware);

// Admin auth
router.post('/admin/auth/change-password', adminChangePassword);
router.put('/admin/profile', updateAdminProfile);
router.delete('/admin/profile', deleteAdminProfile);

// Dashboard & Earnings
router.get('/admin/dashboard-stats', getAdminDashboard);
router.get('/admin/earnings', getAdminEarnings);

// User management
router.get('/admin/users', getAdminUsers);
router.put('/admin/users/:id/status', updateUserStatus);
router.delete('/admin/users/:id', deleteAdminUser);
router.post('/admin/users/:id/refund', validate(refundUserSchema), refundUserWallet);

// Astrologer management
router.get('/admin/astrologers', getAdminAstrologers);
router.get('/admin/astrologer/:id', getAdminAstrologerById);

// Legacy UI status update
router.put('/admin/astrologers/:id/status', updateAstrologerStatus);

// New explicit endpoints
router.put('/admin/astrologer/approve/:id', (req, res, next) => { req.body.status = 'approved'; next(); }, updateAstrologerStatus);
router.put('/admin/astrologer/reject/:id', (req, res, next) => { req.body.status = 'rejected'; next(); }, updateAstrologerStatus);
router.put('/admin/astrologer/suspend/:id', (req, res, next) => { req.body.status = 'blocked'; next(); }, updateAstrologerStatus);

router.delete('/admin/astrologers/:id', deleteAdminAstrologer);

// Astrologer payouts
router.get('/admin/astrologer-payouts', getAstrologerPayouts);
router.post('/admin/astrologer-payouts/:id/process', processAstrologerPayout);

// Orders
router.get('/admin/orders', getAdminOrders);
router.put('/admin/orders/:id/status', updateOrderStatus);
router.put('/admin/orders/:id/cancel', processCancelRequest);

// Products
router.get('/admin/products', getAdminProducts);
router.post('/admin/products', createAdminProduct);
router.put('/admin/products/:id', updateAdminProduct);
router.delete('/admin/products/:id', deleteAdminProduct);

// Settings
router.get('/admin/settings', getAdminSettings);
router.put('/admin/settings', updateAdminSettings);

// Celebrity Reviews
router.get('/admin/celebrities', getAdminCelebrities);
router.post('/admin/celebrities', createAdminCelebrity);
router.put('/admin/celebrities/:id', updateAdminCelebrity);
router.delete('/admin/celebrities/:id', deleteAdminCelebrity);

// Transactions
router.get('/admin/transactions', getAdminTransactions);

// Coupons
router.get('/admin/coupons', getAdminCoupons);
router.post('/admin/coupons', createAdminCoupon);
router.put('/admin/coupons/:id', updateAdminCoupon);
router.delete('/admin/coupons/:id', deleteAdminCoupon);

// Banners
router.get('/admin/banners', getAdminBanners);
router.post('/admin/banners', createAdminBanner);
router.put('/admin/banners/:id', updateAdminBanner);
router.delete('/admin/banners/:id', deleteAdminBanner);

// Broadcast Notifications
router.post('/admin/broadcast', sendBroadcast);

// Audit Logs
router.get('/admin/audit-logs', getAdminAuditLogs);
router.delete('/admin/audit-logs/:id', deleteAdminAuditLog);

// Sessions, Poojas, Reports, Calls
router.get('/admin/sessions', getAdminSessions);
router.delete('/admin/sessions/:id', deleteAdminSession);
router.get('/admin/poojas', getAdminPoojas);
router.get('/admin/reports', getAdminReports);
router.get('/admin/calls', getAdminCalls);
router.delete('/admin/calls/:id', deleteAdminCall);
router.get('/admin/calls/analytics', getAdminCallAnalytics);

export default router;
