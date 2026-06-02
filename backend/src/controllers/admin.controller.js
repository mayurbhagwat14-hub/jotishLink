import User from '../models/user.model.js';
import Astrologer from '../models/astrologer.model.js';
import Product from '../models/product.model.js';
import PoojaBooking from '../models/poojaBooking.model.js';
import Order from '../models/order.model.js';
import Transaction from '../models/transaction.model.js';
import ChatSession from '../models/chatSession.model.js';
import { CallSession } from '../models/callSession.model.js';
import SystemSettings from '../models/systemSettings.model.js';
import Notification from '../models/notification.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import WalletService from '../services/wallet.service.js';

// GET /api/admin/dashboard-stats
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    onlineAstrologers,
    totalOrders,
    pendingOrders,
    transactions,
    liveSessionsRaw,
    recentOrdersRaw,
    pendingApprovalsCount
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Astrologer.countDocuments({ onlineStatus: { $in: ['online', 'busy'] } }),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
    Transaction.find().sort({ createdAt: -1 }).limit(10).lean(),
    ChatSession.find({ status: 'ongoing' }).populate('userId', 'name').populate('astrologerId', 'name').lean(),
    Order.find().populate('userId', 'name').sort({ createdAt: -1 }).limit(5).lean(),
    Astrologer.countDocuments({ approvalStatus: 'pending' })
  ]);

  const deductionTransactions = await Transaction.find({ type: 'deduction' }).lean();
  const totalDeductions = deductionTransactions.reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
  const chatRevenue = totalDeductions * 0.10; // Admin takes 10%

  const orders = await Order.find().lean();
  const storeRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  const totalRevenue = chatRevenue + storeRevenue;

  // Format liveSessions
  const liveSessions = liveSessionsRaw.map(s => ({
    user: s.userId?.name || 'User',
    astrologer: s.astrologerId?.name || 'Astrologer',
    type: s.isBotSession ? 'Chat (Bot)' : 'Chat',
    duration: 'Ongoing',
    rate: s.isFreeChat ? 0 : (s.amountDeducted > 0 ? 'Paid' : 'Free')
  }));

  // Format recentOrders
  const recentOrders = recentOrdersRaw.map(o => {
    let color = 'orange';
    if (o.orderStatus === 'delivered') color = 'green';
    if (o.orderStatus === 'cancelled') color = 'red';
    if (o.orderStatus === 'shipped') color = 'blue';
    
    return {
      id: `#${o._id.toString().slice(-6).toUpperCase()}`,
      product: 'E-commerce Item(s)',
      user: o.userId?.name || 'User',
      amount: o.totalAmount || 0,
      status: o.orderStatus || 'Pending',
      statusColor: color
    };
  });

  // Generate recent activity from transactions
  const recentActivity = transactions.slice(0, 5).map(t => ({
    type: t.type === 'recharge' ? 'order' : (t.type === 'refund' ? 'refund' : 'user'),
    text: t.type === 'recharge' ? 'Wallet Recharge' : (t.type === 'refund' ? 'Wallet Refund' : 'Service Deduction'),
    detail: t.desc || `Amount: ₹${t.amount}`,
    time: 'Recent'
  }));

  const quickStats = [
    { label: 'Total Users', value: totalUsers, up: true, change: '+12% this week' },
    { label: 'Pending Approvals', value: pendingApprovalsCount, up: false, change: 'Requires review' }
  ];

  return res.status(200).json(
    new ApiResponse(200, {
      metrics: {
        totalRevenue: Math.round(totalRevenue),
        registeredUsers: totalUsers,
        onlineAstrologers: onlineAstrologers,
        pendingOrders: pendingOrders,
        storeRevenue: Math.round(storeRevenue),
        pendingApprovals: pendingApprovalsCount
      },
      liveSessions,
      recentOrders,
      quickStats,
      recentActivity
    }, 'Dashboard stats fetched')
  );
});

// GET /api/admin/users
export const getAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' })
    .select('-password -otpHash -otpExpires')
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { users }, 'Users fetched'));
});

// PUT /api/admin/users/:id/status
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: status === 'blocked' },
    { new: true }
  ).select('-password -otpHash');

  if (!user) throw new ApiError(404, 'User not found');
  return res.status(200).json(new ApiResponse(200, { user }, 'User status updated'));
});

// DELETE /api/admin/users/:id
export const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  return res.status(200).json(new ApiResponse(200, {}, 'User deleted successfully'));
});

// GET /api/admin/astrologers
export const getAdminAstrologers = asyncHandler(async (req, res) => {
  const astrologers = await Astrologer.find()
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { astrologers }, 'Astrologers fetched'));
});

// PUT /api/admin/astrologers/:id/status
export const updateAstrologerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const astrologer = await Astrologer.findByIdAndUpdate(
    req.params.id,
    { 
      approvalStatus: status === 'blocked' ? 'rejected' : status,
      isVerified: status === 'approved' 
    },
    { new: true }
  );
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');

  return res.status(200).json(new ApiResponse(200, { astrologer }, 'Status updated'));
});

// DELETE /api/admin/astrologers/:id
export const deleteAdminAstrologer = asyncHandler(async (req, res) => {
  const astrologer = await Astrologer.findByIdAndDelete(req.params.id);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');
  return res.status(200).json(new ApiResponse(200, {}, 'Astrologer deleted successfully'));
});

// GET /api/admin/orders
export const getAdminOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('userId', 'name phone email')
    .populate('items.productId', 'name image price')
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { orders }, 'Orders fetched'));
});

// PUT /api/admin/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { orderStatus: status.toLowerCase() },
    { new: true }
  );
  if (!order) throw new ApiError(404, 'Order not found');

  // Notify user about order status
  const notification = await Notification.create({
    userId: order.userId,
    title: 'Order Status Updated',
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been marked as ${status}.`,
    type: 'info',
    link: '/user/history?tab=Orders'
  });

  // Emit to user
  const io = req.app.get('io');
  if (io) {
    io.emit(`notification_${order.userId}`, notification);
  }

  return res.status(200).json(new ApiResponse(200, { order }, 'Order status updated'));
});

// PUT /api/admin/orders/:id/cancel — process cancel request
export const processCancelRequest = asyncHandler(async (req, res) => {
  const { action, refundPercent } = req.body; // action: 'approved' or 'rejected'
  
  if (!['approved', 'rejected'].includes(action)) {
    throw new ApiError(400, 'Action must be "approved" or "rejected"');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.cancelRequest?.requested) throw new ApiError(400, 'No cancel request found for this order');

  const finalRefundPercent = refundPercent || order.cancelRequest.refundPercent || 80;
  const refundAmount = Math.round((order.totalAmount * finalRefundPercent) / 100);

  order.cancelRequest.adminResponse = action;
  order.cancelRequest.refundPercent = finalRefundPercent;
  order.cancelRequest.refundAmount = refundAmount;

  if (action === 'approved') {
    order.orderStatus = 'cancelled';
    
    // Process refund to wallet
    const user = await User.findById(order.userId);
    if (user) {
      user.wallet = (user.wallet || 0) + refundAmount;
      await user.save();

      // Create refund transaction
      await Transaction.create({
        userId: order.userId,
        amount: refundAmount,
        type: 'refund',
        desc: `Order cancellation refund (${finalRefundPercent}%) - Order #${order._id.toString().slice(-6).toUpperCase()}`,
        status: 'success'
      });
    }
  }

  await order.save();

  // Notify user
  const notification = await Notification.create({
    userId: order.userId,
    title: action === 'approved' ? 'Order Cancelled & Refunded' : 'Cancel Request Rejected',
    message: action === 'approved'
      ? `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled. ₹${refundAmount} (${finalRefundPercent}%) refunded to your wallet.`
      : `Your cancel request for order #${order._id.toString().slice(-6).toUpperCase()} has been rejected by admin.`,
    type: action === 'approved' ? 'info' : 'warning',
    link: '/user/history?tab=Orders'
  });

  const io = req.app.get('io');
  if (io) {
    io.emit(`notification_${order.userId}`, notification);
  }

  return res.status(200).json(new ApiResponse(200, { order }, `Cancel request ${action}`));
});

// GET /api/admin/products
export const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, { products }, 'Products fetched'));
});

// POST /api/admin/products
export const createAdminProduct = asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, category, image, stock, minStock, sku, featuredSection } = req.body;
  if (!name || !price || !category) {
    throw new ApiError(400, 'Name, price, and category are required');
  }
  
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) + '%' : '0%';
  const inStock = stock > 0;

  const product = await Product.create({
    name, description, price, originalPrice, discount, category, image,
    stock: stock || 0,
    minStock: minStock || 10,
    sku: sku || Math.random().toString(36).substr(2, 6).toUpperCase(),
    featuredSection: featuredSection || 'none',
    inStock
  });

  return res.status(201).json(new ApiResponse(201, { product }, 'Product created successfully'));
});

// PUT /api/admin/products/:id
export const updateAdminProduct = asyncHandler(async (req, res) => {
  const updates = req.body;
  
  if (updates.price && updates.originalPrice) {
    updates.discount = Math.round(((updates.originalPrice - updates.price) / updates.originalPrice) * 100) + '%';
  }
  if (updates.stock !== undefined) {
    updates.inStock = updates.stock > 0;
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');

  return res.status(200).json(new ApiResponse(200, { product }, 'Product updated successfully'));
});

// DELETE /api/admin/products/:id
export const deleteAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  return res.status(200).json(new ApiResponse(200, {}, 'Product deleted successfully'));
});

// GET /api/admin/settings
export const getAdminSettings = asyncHandler(async (req, res) => {
  let settings = await SystemSettings.findOne({});
  if (!settings) {
    settings = await SystemSettings.create({});
  }
  return res.status(200).json(new ApiResponse(200, { settings }, 'Settings fetched'));
});

// PUT /api/admin/settings
export const updateAdminSettings = asyncHandler(async (req, res) => {
  const update = req.body;
  let settings = await SystemSettings.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
    runValidators: true,
  });
  return res.status(200).json(new ApiResponse(200, { settings }, 'Settings updated'));
});

// PUT /api/admin/profile
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    { new: true }
  ).select('-password -otpHash');
  return res.status(200).json(new ApiResponse(200, { user }, 'Profile updated'));
});

// DELETE /api/admin/profile
export const deleteAdminProfile = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.user._id);
  res.clearCookie('refreshToken');
  return res.status(200).json(new ApiResponse(200, {}, 'Admin account deleted'));
});

// POST /api/admin/auth/change-password
export const adminChangePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) throw new ApiError(400, 'Incorrect current password');

  user.password = newPassword;
  await user.save();
  return res.status(200).json(new ApiResponse(200, {}, 'Password changed'));
});

import Celebrity from '../models/celebrity.model.js';

// GET /api/admin/celebrities
export const getAdminCelebrities = asyncHandler(async (req, res) => {
  const celebrities = await Celebrity.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, { celebrities }, 'Celebrities fetched'));
});

// POST /api/admin/celebrities
export const createAdminCelebrity = asyncHandler(async (req, res) => {
  const { name, role, img, isActive } = req.body;
  if (!name || !role || !img) throw new ApiError(400, 'Name, role, and image are required');
  const celebrity = await Celebrity.create({ name, role, img, isActive });
  return res.status(201).json(new ApiResponse(201, { celebrity }, 'Celebrity created'));
});

// PUT /api/admin/celebrities/:id
export const updateAdminCelebrity = asyncHandler(async (req, res) => {
  const { name, role, img, isActive } = req.body;
  const celebrity = await Celebrity.findByIdAndUpdate(
    req.params.id,
    { name, role, img, isActive },
    { new: true, runValidators: true }
  );
  if (!celebrity) throw new ApiError(404, 'Celebrity not found');
  return res.status(200).json(new ApiResponse(200, { celebrity }, 'Celebrity updated'));
});

// DELETE /api/admin/celebrities/:id
export const deleteAdminCelebrity = asyncHandler(async (req, res) => {
  const celebrity = await Celebrity.findByIdAndDelete(req.params.id);
  if (!celebrity) throw new ApiError(404, 'Celebrity not found');
  return res.status(200).json(new ApiResponse(200, {}, 'Celebrity deleted'));
});

// GET /api/admin/transactions
export const getAdminTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find()
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { transactions }, 'Transactions fetched'));
});

// POST /api/admin/users/:id/refund
export const refundUserWallet = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || !reason) throw new ApiError(400, 'Amount and reason are required');

  const { user, transaction } = await WalletService.credit(req.params.id, amount, `Refund: ${reason}`);
  
  transaction.type = 'refund';
  await transaction.save();

  return res.status(200).json(new ApiResponse(200, { user, transaction }, 'User wallet refunded successfully'));
});

import Coupon from '../models/coupon.model.js';
import Banner from '../models/banner.model.js';
import AuditLog from '../models/auditLog.model.js';

// GET /api/admin/coupons
export const getAdminCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, { coupons }, 'Coupons fetched'));
});

// POST /api/admin/coupons
export const createAdminCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return res.status(201).json(new ApiResponse(201, { coupon }, 'Coupon created'));
});

// PUT /api/admin/coupons/:id
export const updateAdminCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return res.status(200).json(new ApiResponse(200, { coupon }, 'Coupon updated'));
});

// DELETE /api/admin/coupons/:id
export const deleteAdminCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return res.status(200).json(new ApiResponse(200, {}, 'Coupon deleted'));
});

// GET /api/admin/banners
export const getAdminBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find().sort({ position: 1, createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, { banners }, 'Banners fetched'));
});

// POST /api/admin/banners
export const createAdminBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  return res.status(201).json(new ApiResponse(201, { banner }, 'Banner created'));
});

// PUT /api/admin/banners/:id
export const updateAdminBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) throw new ApiError(404, 'Banner not found');
  return res.status(200).json(new ApiResponse(200, { banner }, 'Banner updated'));
});

// DELETE /api/admin/banners/:id
export const deleteAdminBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');
  return res.status(200).json(new ApiResponse(200, {}, 'Banner deleted'));
});

// GET /api/admin/audit-logs
export const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(parseInt(limit)).populate('adminId', 'name email').lean();
  return res.status(200).json(new ApiResponse(200, { logs }, 'Audit logs fetched successfully'));
});

// GET /api/admin/sessions
export const getAdminSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find()
    .populate('userId', 'name')
    .populate('astrologerId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { sessions }, 'Sessions fetched successfully'));
});

// GET /api/admin/poojas
export const getAdminPoojas = asyncHandler(async (req, res) => {
  const poojas = await PoojaBooking.find()
    .populate('userId', 'name')
    .populate('astrologerId', 'name')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { poojas }, 'Pooja bookings fetched successfully'));
});

// GET /api/admin/reports
export const getAdminReports = asyncHandler(async (req, res) => {
  // Mocking real analytics logic for simplicity right now
  const transactions = await Transaction.find().lean();
  const orders = await Order.find().lean();
  const chatSessions = await ChatSession.find().lean();
  const poojas = await PoojaBooking.find().lean();

  const totalDeductions = transactions.filter(t => t.type === 'deduction').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
  const platformCommission = totalDeductions * 0.10; // 10%

  const storeRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalRevenue = (totalDeductions + storeRevenue) || 0;

  const validSessions = chatSessions.filter(s => s.amountDeducted > 0);
  const avgSessionValue = validSessions.length > 0 
    ? validSessions.reduce((acc, curr) => acc + curr.amountDeducted, 0) / validSessions.length 
    : 0;

  // Simple daily revenue simulation for the last 7 days (mocking from totals)
  const dailyRevenue = [];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().getDay();
  for (let i = 6; i >= 0; i--) {
    const dayName = days[(today - i + 7) % 7];
    dailyRevenue.push({ day: dayName, amount: (totalRevenue / 30) * (Math.random() * 0.5 + 0.8) });
  }

  return res.status(200).json(new ApiResponse(200, {
    totalRevenue,
    platformCommission,
    avgSessionValue,
    totalSessions: chatSessions.length,
    storeRevenue,
    dailyRevenue
  }, 'Reports fetched successfully'));
});

// GET /api/admin/calls
export const getAdminCalls = asyncHandler(async (req, res) => {
  const filter = req.query.filter || 'All';
  let query = {};
  
  const now = new Date();
  if (filter === 'Today') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    query.createdAt = { $gte: today };
  } else if (filter === 'This Week') {
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    query.createdAt = { $gte: weekAgo };
  } else if (filter === 'This Month') {
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    query.createdAt = { $gte: monthAgo };
  }

  const calls = await CallSession.find(query)
    .populate('userId', 'name email phone')
    .populate('astrologerId', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
    
  return res.status(200).json(new ApiResponse(200, { calls }, 'Calls fetched successfully'));
});

// GET /api/admin/calls/analytics
export const getAdminCallAnalytics = asyncHandler(async (req, res) => {
  const calls = await CallSession.find().lean();
  
  const totalCalls = calls.length;
  const activeCalls = calls.filter(c => c.status === 'accepted' || c.status === 'ongoing' || c.status === 'ringing').length;
  const completedCalls = calls.filter(c => c.status === 'completed').length;
  const missedCalls = calls.filter(c => c.status === 'missed').length;
  
  const revenueGenerated = calls.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  
  return res.status(200).json(new ApiResponse(200, { 
    totalCalls, 
    activeCalls, 
    completedCalls, 
    missedCalls, 
    revenueGenerated 
  }, 'Call analytics fetched'));
});
