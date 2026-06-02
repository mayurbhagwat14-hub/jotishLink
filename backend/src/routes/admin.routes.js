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
  getAdminSessions,
  getAdminPoojas,
  getAdminReports,
  getAdminCalls,
  getAdminCallAnalytics,
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

// Dashboard
router.get('/admin/dashboard-stats', getAdminDashboard);

// User management
router.get('/admin/users', getAdminUsers);
router.put('/admin/users/:id/status', updateUserStatus);
router.delete('/admin/users/:id', deleteAdminUser);
router.post('/admin/users/:id/refund', validate(refundUserSchema), refundUserWallet);

// Astrologer management
router.get('/admin/astrologers', getAdminAstrologers);
router.put('/admin/astrologers/:id/status', updateAstrologerStatus);
router.delete('/admin/astrologers/:id', deleteAdminAstrologer);

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

// Audit Logs
router.get('/admin/audit-logs', getAdminAuditLogs);

// Sessions, Poojas, Reports, Calls
router.get('/admin/sessions', getAdminSessions);
router.get('/admin/poojas', getAdminPoojas);
router.get('/admin/reports', getAdminReports);
router.get('/admin/calls', getAdminCalls);
router.get('/admin/calls/analytics', getAdminCallAnalytics);

export default router;
