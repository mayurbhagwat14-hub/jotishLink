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
import { getFirebaseAdmin } from '../config/firebase.config.js';
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
    ChatSession.find({ status: 'ongoing' }).populate('userId', 'name avatar').populate('astrologerId', 'name avatar').lean(),
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
    userAvatar: s.userId?.avatar || '',
    astrologer: s.astrologerId?.name || 'Astrologer',
    astrologerAvatar: s.astrologerId?.avatar || '',
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

// POST /api/admin/broadcast
export const sendBroadcast = asyncHandler(async (req, res) => {
  const { title, message, audience } = req.body;
  if (!title || !message) throw new ApiError(400, 'Title and message are required');

  let filter = { role: 'user' };
  if (audience === 'New Users') {
    // Users created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    filter.createdAt = { $gte: sevenDaysAgo };
  }

  const users = await User.find(filter).select('_id fcmToken');
  if (users.length === 0) {
    return res.status(200).json(new ApiResponse(200, { sent: 0 }, 'No users matched the criteria'));
  }

  const notifications = users.map(user => ({
    userId: user._id,
    title,
    message,
    type: 'info'
  }));

  await Notification.insertMany(notifications);

  // Send real Push Notifications via Firebase
  const adminSDK = getFirebaseAdmin();
  if (adminSDK) {
    const tokens = users.map(u => u.fcmToken).filter(t => t);
    
    if (tokens.length > 0) {
      const payload = {
        notification: {
          title: title,
          body: message
        },
        tokens: tokens
      };

      adminSDK.messaging().sendEachForMulticast(payload)
        .then((response) => {
          console.log(`Push Notifications Sent: ${response.successCount} successful, ${response.failureCount} failed.`);
        })
        .catch((error) => {
          console.error('Error sending push notifications:', error);
        });
    }
  }

  const io = req.app.get('io');
  if (io) {
    // Notify connected users in real time
    // For "All Users" or "New Users", we can broadcast to all connections, 
    // and let frontend filter, but standard approach is iterating users or just broadcasting.
    // For simplicity, emit a global event and let active user connections pick it up if they match.
    io.emit('new_notification', {
      title,
      message,
      type: 'info',
      audience
    });
  }

  return res.status(200).json(new ApiResponse(200, { sent: users.length }, 'Broadcast sent successfully'));
});

// GET /api/admin/astrologers
export const getAdminAstrologers = asyncHandler(async (req, res) => {
  const astrologers = await Astrologer.find()
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { astrologers }, 'Astrologers fetched'));
});

// GET /api/admin/astrologer/:id
export const getAdminAstrologerById = asyncHandler(async (req, res) => {
  const astrologer = await Astrologer.findById(req.params.id)
    .populate('approvedBy', 'name email')
    .lean();
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');
  return res.status(200).json(new ApiResponse(200, { astrologer }, 'Astrologer details fetched'));
});

// PUT /api/admin/astrologers/:id/status
export const updateAstrologerStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  
  const astrologer = await Astrologer.findById(req.params.id);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');
  
  let newStatus = status;
  let isVerified = astrologer.isVerified;
  
  if (status === 'approved') {
    isVerified = true;
    astrologer.registrationStatus = 'approved';
    astrologer.approvedBy = req.user._id;
    astrologer.approvedAt = new Date();
  } else if (status === 'rejected') {
    isVerified = false;
    astrologer.registrationStatus = 'rejected';
    astrologer.rejectionReason = reason;
  } else if (status === 'blocked') {
    isVerified = false;
    newStatus = 'rejected'; // Map 'blocked' to rejected approvalStatus for backward compatibility
    astrologer.registrationStatus = 'rejected';
    astrologer.rejectionReason = reason || 'Suspended by admin';
  }
  
  astrologer.approvalStatus = newStatus;
  astrologer.isVerified = isVerified;
  await astrologer.save();
  
  // Log Audit
  const { default: AuditLog } = await import('../models/auditLog.model.js');
  let action = 'ASTROLOGER_UPDATED';
  if (status === 'approved') action = 'ADMIN_APPROVED_ASTROLOGER';
  if (status === 'rejected') action = 'ADMIN_REJECTED_ASTROLOGER';
  if (status === 'blocked') action = 'ADMIN_SUSPENDED_ASTROLOGER';
  
  await AuditLog.create({
    userId: req.user._id,
    userModel: 'Admin',
    targetId: astrologer._id,
    action,
    resource: 'Astrologer',
    details: { status, reason, astrologerName: astrologer.name },
    ipAddress: req.ip
  });

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
  
  const updateFields = { orderStatus: status.toLowerCase() };
  if (status.toLowerCase() === 'delivered') {
    updateFields.paymentStatus = 'paid';
  } else if (status.toLowerCase() === 'cancelled') {
    updateFields.paymentStatus = 'refunded';
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    updateFields,
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

  let uploadedImage = image || '';
  let pubId = '';
  if (uploadedImage.startsWith('data:image')) {
    const result = await uploadMedia(uploadedImage, 'astrotalk_products');
    uploadedImage = result.url;
    pubId = result.publicId;
  }

  const product = await Product.create({
    name, description, price, originalPrice, discount, category, 
    image: uploadedImage,
    cloudinaryPublicId: pubId,
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

  const productToUpdate = await Product.findById(req.params.id);
  if (!productToUpdate) throw new ApiError(404, 'Product not found');

  if (updates.image && updates.image.startsWith('data:image')) {
    if (productToUpdate.cloudinaryPublicId) {
      await deleteMedia(productToUpdate.cloudinaryPublicId);
    }
    const result = await uploadMedia(updates.image, 'astrotalk_products');
    updates.image = result.url;
    updates.cloudinaryPublicId = result.publicId;
  }

  const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  return res.status(200).json(new ApiResponse(200, { product }, 'Product updated successfully'));
});

// DELETE /api/admin/products/:id
export const deleteAdminProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');

  if (product.cloudinaryPublicId) {
    await deleteMedia(product.cloudinaryPublicId);
  }

  await Product.findByIdAndDelete(req.params.id);

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

  let uploadedImg = img;
  let pubId = '';
  if (uploadedImg.startsWith('data:image')) {
    const result = await uploadMedia(uploadedImg, 'astrotalk_celebrities');
    uploadedImg = result.url;
    pubId = result.publicId;
  }

  const celebrity = await Celebrity.create({ name, role, img: uploadedImg, cloudinaryPublicId: pubId, isActive });
  return res.status(201).json(new ApiResponse(201, { celebrity }, 'Celebrity created'));
});

// PUT /api/admin/celebrities/:id
export const updateAdminCelebrity = asyncHandler(async (req, res) => {
  const { name, role, img, isActive } = req.body;
  const celebToUpdate = await Celebrity.findById(req.params.id);
  if (!celebToUpdate) throw new ApiError(404, 'Celebrity not found');

  let newImg = img;
  let newPubId = celebToUpdate.cloudinaryPublicId;

  if (img && img.startsWith('data:image')) {
    if (celebToUpdate.cloudinaryPublicId) {
      await deleteMedia(celebToUpdate.cloudinaryPublicId);
    }
    const result = await uploadMedia(img, 'astrotalk_celebrities');
    newImg = result.url;
    newPubId = result.publicId;
  }

  const celebrity = await Celebrity.findByIdAndUpdate(
    req.params.id,
    { name, role, img: newImg, cloudinaryPublicId: newPubId, isActive },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, { celebrity }, 'Celebrity updated'));
});

// DELETE /api/admin/celebrities/:id
export const deleteAdminCelebrity = asyncHandler(async (req, res) => {
  const celebrity = await Celebrity.findById(req.params.id);
  if (!celebrity) throw new ApiError(404, 'Celebrity not found');
  
  if (celebrity.cloudinaryPublicId) {
    await deleteMedia(celebrity.cloudinaryPublicId);
  }

  await Celebrity.findByIdAndDelete(req.params.id);

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
import { uploadMedia, deleteMedia } from '../config/cloudinary.js';

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
  const { imageUrl, isActive, pages } = req.body;
  if (!imageUrl) throw new ApiError(400, 'Image is required');

  let uploadedUrl = imageUrl;
  let publicId = '';

  // If the imageUrl is a base64 string, upload it to Cloudinary
  if (imageUrl.startsWith('data:image')) {
    const uploadResult = await uploadMedia(imageUrl, 'astrotalk_banners');
    uploadedUrl = uploadResult.url;
    publicId = uploadResult.publicId;
  }

  const banner = await Banner.create({ 
    imageUrl: uploadedUrl, 
    cloudinaryPublicId: publicId,
    isActive,
    pages: pages || ['Home']
  });
  
  const io = req.app.get('io');
  if (io) io.emit('banners_updated');
  
  return res.status(201).json(new ApiResponse(201, { banner }, 'Banner created'));
});

// PUT /api/admin/banners/:id
export const updateAdminBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) throw new ApiError(404, 'Banner not found');
  
  const io = req.app.get('io');
  if (io) io.emit('banners_updated');
  
  return res.status(200).json(new ApiResponse(200, { banner }, 'Banner updated'));
});

// DELETE /api/admin/banners/:id
export const deleteAdminBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) throw new ApiError(404, 'Banner not found');

  if (banner.cloudinaryPublicId) {
    await deleteMedia(banner.cloudinaryPublicId);
  }

  await Banner.findByIdAndDelete(req.params.id);
  
  const io = req.app.get('io');
  if (io) io.emit('banners_updated');

  return res.status(200).json(new ApiResponse(200, {}, 'Banner deleted'));
});

// GET /api/admin/audit-logs
export const getAdminAuditLogs = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(parseInt(limit)).populate('adminId', 'name email').lean();
  return res.status(200).json(new ApiResponse(200, { logs }, 'Audit logs fetched successfully'));
});

// DELETE /api/admin/audit-logs/:id
export const deleteAdminAuditLog = asyncHandler(async (req, res) => {
  const log = await AuditLog.findByIdAndDelete(req.params.id);
  if (!log) throw new ApiError(404, 'Audit log not found');
  return res.status(200).json(new ApiResponse(200, null, 'Audit log deleted successfully'));
});

// GET /api/admin/sessions
export const getAdminSessions = asyncHandler(async (req, res) => {
  const sessions = await ChatSession.find()
    .populate('userId', 'name avatar')
    .populate('astrologerId', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, { sessions }, 'Sessions fetched successfully'));
});

// DELETE /api/admin/sessions/:id
export const deleteAdminSession = asyncHandler(async (req, res) => {
  const session = await ChatSession.findByIdAndDelete(req.params.id);
  if (!session) throw new ApiError(404, 'Session not found');
  return res.status(200).json(new ApiResponse(200, null, 'Session deleted successfully'));
});

// GET /api/admin/poojas
export const getAdminPoojas = asyncHandler(async (req, res) => {
  const poojas = await PoojaBooking.find()
    .populate('userId', 'name avatar')
    .populate('astrologerId', 'name avatar')
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
    .populate('userId', 'name email phone avatar')
    .populate('astrologerId', 'name email phone avatar')
    .sort({ createdAt: -1 })
    .lean();
    
  return res.status(200).json(new ApiResponse(200, { calls }, 'Calls fetched successfully'));
});

// DELETE /api/admin/calls/:id
export const deleteAdminCall = asyncHandler(async (req, res) => {
  const call = await CallSession.findByIdAndDelete(req.params.id);
  if (!call) throw new ApiError(404, 'Call not found');
  return res.status(200).json(new ApiResponse(200, null, 'Call deleted successfully'));
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

// GET /api/admin/astrologer-payouts
export const getAstrologerPayouts = asyncHandler(async (req, res) => {
  const astrologers = await Astrologer.find().lean();
  const payouts = await Promise.all(astrologers.map(async (astro) => {
    const transactions = await Transaction.find({ userId: astro._id, type: 'recharge' }).lean();
    const totalEarned = transactions.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      _id: astro._id,
      name: astro.name,
      phone: astro.phone,
      wallet: astro.wallet || 0,
      totalEarned
    };
  }));

  payouts.sort((a, b) => b.wallet - a.wallet);

  return res.status(200).json(new ApiResponse(200, { payouts }, 'Astrologer payouts fetched successfully'));
});

// POST /api/admin/astrologer-payouts/:id/process
export const processAstrologerPayout = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Invalid payout amount');
  }

  const astrologer = await Astrologer.findById(req.params.id);
  if (!astrologer) {
    throw new ApiError(404, 'Astrologer not found');
  }

  if ((astrologer.wallet || 0) < amount) {
    throw new ApiError(400, 'Insufficient astrologer wallet balance');
  }

  astrologer.wallet -= amount;
  await astrologer.save();

  await Transaction.create({
    userId: astrologer._id,
    type: 'deduction',
    amount: -amount,
    desc: 'Admin payout processed by admin'
  });

  return res.status(200).json(new ApiResponse(200, { wallet: astrologer.wallet }, 'Payout processed successfully'));
});
