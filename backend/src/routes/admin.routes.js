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
  bulkDeleteAdminSessions,
  deleteAdminCall,
  getAstrologerPayouts,
  processAstrologerPayout,
  getAdminAstrologerById,
  sendBroadcast,
  getAdminEarnings,
  toggleTopVerifiedAstrologer,
  getAdminRatings,
  deleteAdminRating,
  pushOrderToShiprocket,
  generateOrderAWB,
  getAdminPendingCounts,
  getShiprocketOrderDetails,
  shiprocketWebhook
} from '../controllers/admin.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { auditLogMiddleware } from '../middlewares/audit.middleware.js';
import { validate, refundUserSchema } from '../middlewares/validation.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Public webhook route for Shiprocket
router.post('/admin/shiprocket/webhook', shiprocketWebhook);

// All admin routes require admin role
router.use('/admin', verifyJWT, authorizeRoles('admin'), auditLogMiddleware);

// Admin auth
router.post('/admin/auth/change-password', adminChangePassword);
router.put('/admin/profile', updateAdminProfile);
router.delete('/admin/profile', deleteAdminProfile);

// Dashboard & Earnings
router.get('/admin/dashboard-stats', getAdminDashboard);
router.get('/admin/pending-counts', getAdminPendingCounts);
router.get('/admin/earnings', getAdminEarnings);

// User management
router.get('/admin/users', getAdminUsers);
router.put('/admin/users/:id/status', updateUserStatus);
router.delete('/admin/users/:id', deleteAdminUser);
router.post('/admin/users/:id/refund', validate(refundUserSchema), refundUserWallet);

// Astrologer management
router.get('/admin/astrologers', getAdminAstrologers);
router.get('/admin/astrologer/:id', getAdminAstrologerById);
router.put('/admin/astrologer/:id/status', updateAstrologerStatus);
router.put('/admin/astrologer/:id/toggle-top-verified', toggleTopVerifiedAstrologer);
router.delete('/admin/astrologer/:id', deleteAdminAstrologer);

// New explicit endpoints
router.put('/admin/astrologer/approve/:id', (req, res, next) => { req.body.status = 'approved'; next(); }, updateAstrologerStatus);
router.put('/admin/astrologer/reject/:id', (req, res, next) => { req.body.status = 'rejected'; next(); }, updateAstrologerStatus);
router.put('/admin/astrologer/suspend/:id', (req, res, next) => { req.body.status = 'blocked'; next(); }, updateAstrologerStatus);

router.delete('/admin/astrologers/:id', deleteAdminAstrologer);

// Astrologer payouts
router.get('/admin/astrologer-payouts', getAstrologerPayouts);
router.post('/admin/astrologer-payouts/:id/process', upload.single('receipt'), processAstrologerPayout);

// Orders
router.get('/admin/orders', getAdminOrders);
router.put('/admin/orders/:id/status', updateOrderStatus);
router.put('/admin/orders/:id/cancel', processCancelRequest);
router.post('/admin/orders/:id/shiprocket/push', pushOrderToShiprocket);
router.post('/admin/orders/:id/shiprocket/awb', generateOrderAWB);
router.get('/admin/orders/:id/shiprocket/details', getShiprocketOrderDetails);

// Products
router.get('/admin/products', getAdminProducts);
router.post('/admin/products', createAdminProduct);
router.put('/admin/products/:id', updateAdminProduct);
router.delete('/admin/products/:id', deleteAdminProduct);

// Settings
router.get('/admin/settings', getAdminSettings);
router.put('/admin/settings', updateAdminSettings);


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
router.post('/admin/sessions/bulk-delete', bulkDeleteAdminSessions);
router.delete('/admin/sessions/:id', deleteAdminSession);
router.get('/admin/poojas', getAdminPoojas);
router.get('/admin/reports', getAdminReports);
router.get('/admin/calls', getAdminCalls);
router.delete('/admin/calls/:id', deleteAdminCall);
router.get('/admin/calls/analytics', getAdminCallAnalytics);

// Ratings
router.get('/admin/ratings', getAdminRatings);
router.delete('/admin/ratings/:id', deleteAdminRating);

export default router;
