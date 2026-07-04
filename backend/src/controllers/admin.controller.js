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

import RevenueLog from '../models/revenueLog.model.js';
import WithdrawalRequest from '../models/withdrawalRequest.model.js';
import Rating from '../models/rating.model.js';
import axios from 'axios';

export const getAdminEarnings = async (req, res, next) => {
  try {
    const { getISTStartOfToday, getISTStartOfSevenDaysAgo, getISTStartOfMonth } = await import('../utils/dateHelper.js');
    
    const today = getISTStartOfToday();
    const thisWeek = getISTStartOfSevenDaysAgo();
    const thisMonth = getISTStartOfMonth();

    const logs = await RevenueLog.find().populate('astrologerId', 'name').sort({ date: -1 });

    const result = {
      today: 0,
      weekly: 0,
      monthly: 0,
      total: 0,
      breakdown: {
        chat: 0,
        audio: 0,
        video: 0,
        pooja: 0,
      },
      astroBreakdown: {
        chat: 0,
        audio: 0,
        video: 0,
        pooja: 0,
      },
      history: logs
    };

    logs.forEach(log => {
      const share = log.adminShare || 0;
      const astroShare = log.astrologerShare || 0;
      result.total += share;
      
      if (log.date >= today) result.today += share;
      if (log.date >= thisWeek) result.weekly += share;
      if (log.date >= thisMonth) result.monthly += share;

      if (log.sessionType === 'chat') {
        result.breakdown.chat += share;
        result.astroBreakdown.chat += astroShare;
      } else if (log.sessionType === 'audio' || log.sessionType === 'audio_call') {
        result.breakdown.audio += share;
        result.astroBreakdown.audio += astroShare;
      } else if (log.sessionType === 'video' || log.sessionType === 'video_call') {
        result.breakdown.video += share;
        result.astroBreakdown.video += astroShare;
      } else if (log.sessionType === 'pooja') {
        result.breakdown.pooja += share;
        result.astroBreakdown.pooja += astroShare;
      }
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard-stats
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    onlineAstrologers,
    totalOrders,
    pendingOrders,
    transactions,
    liveSessionsRaw,
    liveCallsRaw,
    recentOrdersRaw,
    pendingApprovalsCount,
    completedOrders,
    totalAstrologers,
    totalPoojas,
    pendingPoojas
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Astrologer.countDocuments({ onlineStatus: { $in: ['online', 'busy'] } }),
    Order.countDocuments(),
    Order.countDocuments({ orderStatus: 'pending' }),
    Transaction.find().sort({ createdAt: -1 }).limit(10).lean(),
    ChatSession.find({ status: 'ongoing', isBotSession: { $ne: true } }).populate('userId', 'name avatar').populate('astrologerId', 'name avatar').lean(),
    CallSession.find({ status: { $in: ['accepted', 'ongoing', 'ringing'] } }).populate('userId', 'name avatar').populate('astrologerId', 'name avatar').lean(),
    Order.find().populate('userId', 'name').sort({ createdAt: -1 }).limit(5).lean(),
    Astrologer.countDocuments({ approvalStatus: 'pending' }),
    Order.countDocuments({ orderStatus: { $in: ['delivered', 'completed'] } }),
    Astrologer.countDocuments({ approvalStatus: 'approved' }),
    PoojaBooking.countDocuments(),
    PoojaBooking.countDocuments({ status: { $in: ['Pending', 'Accepted', 'In Progress'] } })
  ]);

  const revenueLogs = await RevenueLog.find().lean();
  const chatRevenue = revenueLogs.reduce((acc, log) => acc + (log.adminShare || 0), 0);

  const orders = await Order.find().lean();
  let storeRevenue = 0;
  let storeCost = 0;
  orders.forEach(order => {
    // Only count orders where money is actually received
    const isPaid = order.paymentStatus === 'paid';
    const isCompletedCOD = order.paymentMethod === 'cod' && (order.orderStatus === 'delivered' || order.orderStatus === 'completed');
    
    if (isPaid || isCompletedCOD) {
      storeRevenue += (order.totalAmount || 0);
      order.items?.forEach(item => {
        storeCost += (item.costPrice || 0) * (item.quantity || 1);
      });
    }
  });
  const storeProfit = storeRevenue - storeCost;

  // Calculate Pooja Revenue
  const poojas = await PoojaBooking.find().lean();
  let poojaRevenue = 0;
  poojas.forEach(pooja => {
    // Considering released or completed pooja payments
    if (pooja.paymentStatus === 'released' || pooja.status === 'Completed') {
      poojaRevenue += (pooja.price || 0);
    }
  });

  const totalRevenue = chatRevenue + storeRevenue + poojaRevenue;

  // Format liveSessions
  const formattedChats = liveSessionsRaw.map(s => {
    let callType = 'Chat';
    if (s.isBotSession) callType = 'Chat (Bot)';
    else if (s.type === 'video_call' || s.type === 'video') callType = 'Video Call';
    else if (s.type === 'audio_call' || s.type === 'audio') callType = 'Audio Call';
    
    return {
      user: s.userId?.name || 'User',
      userAvatar: s.userId?.avatar || '',
      astrologer: s.astrologerId?.name || 'Astrologer',
      astrologerAvatar: s.astrologerId?.avatar || '',
      type: callType,
      duration: s.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(s.createdAt).getTime()) / 60000)) + 'm ongoing' : 'Ongoing',
      rate: (s.isFreeChat || s.isBotSession) ? 0 : (s.astrologerId?.pricing?.chat || s.astrologerId?.rate || 5)
    };
  });

  const formattedCalls = liveCallsRaw.map(c => ({
    user: c.userId?.name || 'User',
    userAvatar: c.userId?.avatar || '',
    astrologer: c.astrologerId?.name || 'Astrologer',
    astrologerAvatar: c.astrologerId?.avatar || '',
    type: 'Audio Call',
    duration: c.startTime ? Math.max(0, Math.floor((Date.now() - new Date(c.startTime).getTime()) / 60000)) + 'm ongoing' : 'Ringing',
    rate: c.ratePerMinute || 5
  }));

  const liveSessions = [...formattedChats, ...formattedCalls];

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
        totalOrders: totalOrders,
        pendingOrders: pendingOrders,
        completedOrders: completedOrders,
        storeRevenue: Math.round(storeRevenue),
        storeProfit: Math.round(storeProfit),
        chatRevenue: Math.round(chatRevenue),
        poojaRevenue: Math.round(poojaRevenue),
        pendingApprovals: pendingApprovalsCount,
        totalAstrologers: totalAstrologers,
        totalPoojas: totalPoojas,
        pendingPoojas: pendingPoojas,
        liveSessionsCount: liveSessionsRaw.length + liveCallsRaw.length
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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const filter = { role: 'user' };
  if (req.query.search) {
     const searchRegex = new RegExp(req.query.search, 'i');
     filter.$or = [
       { name: searchRegex },
       { email: searchRegex },
       { phone: searchRegex }
     ];
  }
  if (req.query.status && req.query.status !== 'All') {
     filter.isBlocked = req.query.status === 'Banned';
  }

  const totalUsers = await User.countDocuments(filter);
  const totalPages = Math.ceil(totalUsers / limit);
  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select('-password -otpHash -otpExpires')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const transactions = await Transaction.aggregate([
    { $match: { type: 'deduction', paymentStatus: 'success' } },
    { $group: { _id: '$userId', totalSpent: { $sum: { $abs: '$amount' } } } }
  ]);

  const chatSessions = await ChatSession.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$userId', totalSpent: { $sum: { $abs: '$amountDeducted' } } } }
  ]);

  const callSessions = await CallSession.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: '$userId', totalSpent: { $sum: { $abs: '$totalAmount' } } } }
  ]);
  
  const spentMap = {};
  transactions.forEach(t => spentMap[t._id.toString()] = (spentMap[t._id.toString()] || 0) + t.totalSpent);
  chatSessions.forEach(c => spentMap[c._id.toString()] = (spentMap[c._id.toString()] || 0) + c.totalSpent);
  callSessions.forEach(c => spentMap[c._id.toString()] = (spentMap[c._id.toString()] || 0) + c.totalSpent);

  const usersWithStats = users.map(u => ({
    ...u,
    totalSpent: spentMap[u._id.toString()] || 0
  }));

  return res.status(200).json(new ApiResponse(200, { 
    users: usersWithStats,
    totalUsers,
    totalPages,
    currentPage: page
  }, 'Users fetched'));
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

  let userFilter = { role: 'user' };
  let astroFilter = {};
  let queryUsers = true;
  let queryAstrologers = true;

  if (audience === 'All Users') {
    queryAstrologers = false;
  } else if (audience === 'All Astrologers') {
    queryUsers = false;
  } else if (audience === 'New Users') {
    // Users and astrologers created in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    userFilter.createdAt = { $gte: sevenDaysAgo };
    astroFilter.createdAt = { $gte: sevenDaysAgo };
  }
  // 'All Users & Astrologers' — no extra filter needed, query both

  const [users, astrologers] = await Promise.all([
    queryUsers ? User.find(userFilter).select('_id fcmToken fcmTokenMobile') : Promise.resolve([]),
    queryAstrologers ? Astrologer.find(astroFilter).select('_id fcmToken fcmTokenMobile') : Promise.resolve([])
  ]);

  const allTargets = [...users, ...astrologers];

  if (allTargets.length === 0) {
    return res.status(200).json(new ApiResponse(200, { sent: 0 }, 'No users or astrologers matched the criteria'));
  }

  // Note: Notification model uses userId ref to 'User'. 
  // We might need to skip inserting into Notification for astrologers if the ref is strict, 
  // or we can insert them. Astrologers don't have a notification panel fetching from Notification model in the same way, but it's safe if it allows any ObjectId.
  const notifications = allTargets.map(target => ({
    userId: target._id,
    title,
    message,
    type: 'info'
  }));

  await Notification.insertMany(notifications);

  // Send real Push Notifications via Firebase
  try {
    const { sendMulticastPushNotification } = await import('../utils/firebaseHelper.js');
    let tokens = [];
    allTargets.forEach(t => {
      if (t.fcmToken && t.fcmToken.length > 0) tokens.push(...t.fcmToken);
      if (t.fcmTokenMobile && t.fcmTokenMobile.length > 0) tokens.push(...t.fcmTokenMobile);
    });
    
    if (tokens.length > 0) {
      await sendMulticastPushNotification(tokens, title, message, { type: 'broadcast', url: '/user/notifications' });
    }
  } catch (err) {
    console.error('Error sending multicast broadcast:', err);
  }

  const io = req.app.get('io');
  if (io) {
    io.emit('new_notification', {
      title,
      message,
      type: 'info',
      audience
    });
  }

  return res.status(200).json(new ApiResponse(200, { sent: allTargets.length }, 'Broadcast sent successfully'));
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

  // Safely calculate earnings using immutable RevenueLog
  const revenueLogs = await RevenueLog.find({ astrologerId: astrologer._id }).lean();
  const totalEarnings = revenueLogs.reduce((sum, r) => sum + (r.astrologerShare || 0), 0);

  // Calculate Available Balance by deducting pending and completed withdrawals
  const withdrawals = await WithdrawalRequest.find({ astrologerId: astrologer._id, status: { $in: ['pending', 'completed'] } }).lean();
  const totalWithdrawnOrPending = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const wallet = totalEarnings - totalWithdrawnOrPending;

  astrologer.earnings = { total: parseFloat(totalEarnings.toFixed(2)) };
  astrologer.wallet = parseFloat(wallet.toFixed(2));

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
  
  const updateData = {
    approvalStatus: newStatus,
    isVerified,
    registrationStatus: astrologer.registrationStatus,
    approvedBy: astrologer.approvedBy,
    approvedAt: astrologer.approvedAt,
    rejectionReason: astrologer.rejectionReason
  };

  const updatedAstrologer = await Astrologer.findByIdAndUpdate(
    req.params.id,
    { $set: updateData },
    { new: true }
  );
  
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
  }

  let order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (status.toLowerCase() === 'cancelled' && order.paymentMethod !== 'cod') {
    updateFields.paymentStatus = 'refunded';
  }

  // Cancel on Shiprocket if status is becoming 'cancelled'
  if (status.toLowerCase() === 'cancelled' && order.orderStatus !== 'cancelled') {
    if (order.shiprocketOrderId) {
      try {
        await ShiprocketService.cancelOrder(order.shiprocketOrderId);
      } catch (err) {
        console.error("Failed to cancel Shiprocket order during status update", err);
      }
    }
    
    // Process refund if paid via wallet
    if (order.paymentMethod !== 'cod' && order.paymentStatus !== 'refunded') {
      const user = await User.findById(order.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + order.totalAmount;
        await user.save();
        
        await Transaction.create({
          userId: order.userId,
          amount: order.totalAmount,
          type: 'refund',
          desc: `Refund for cancelled order #${order._id.toString().slice(-6).toUpperCase()}`,
          status: 'success'
        });
      }
    }
  }

  order = await Order.findByIdAndUpdate(
    req.params.id,
    updateFields,
    { new: true }
  );

  // Notify user about order status
  const title = 'Order Status Updated';
  const message = `Your order #${order._id.toString().slice(-6).toUpperCase()} has been marked as ${status}.`;
  
  import('../utils/notifyHelper.js').then(({ notify }) => {
    notify({
      userId: order.userId,
      role: 'user',
      title,
      message,
      type: 'info',
      link: `/user/order/${order._id}`,
      data: { type: 'order_update', orderId: order._id.toString() }
    });
  }).catch(console.error);

  // Emit to admin via socket (user bell handled by notify internally, but keeping broadcast for UI refresh if needed)
  const io = req.app.get('io');
  if (io) {
    io.to(`room_user_${order.userId}`).emit('order_updated', { order });
    io.emit('order_updated', { order }); // Broadcast to admin too
  }

  return res.status(200).json(new ApiResponse(200, { order }, 'Order status updated'));
});

// PUT /api/admin/orders/:id/cancel — process cancel request
export const processCancelRequest = asyncHandler(async (req, res) => {
  const { action, customRefundAmount } = req.body; // action: 'approved' or 'rejected'
  
  if (!['approved', 'rejected'].includes(action)) {
    throw new ApiError(400, 'Action must be "approved" or "rejected"');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.cancelRequest?.requested) throw new ApiError(400, 'No cancel request found for this order');

  let refundAmount = 0;
  
  if (order.paymentMethod !== 'cod') {
    if (customRefundAmount !== undefined && customRefundAmount !== null) {
      refundAmount = Number(customRefundAmount);
    } else {
      const finalRefundPercent = order.cancelRequest.refundPercent || 80;
      refundAmount = Math.round((order.totalAmount * finalRefundPercent) / 100);
    }
  }

  order.cancelRequest.adminResponse = action;
  order.cancelRequest.refundAmount = refundAmount;

  if (action === 'approved') {
    order.orderStatus = 'cancelled';
    
    // Process refund to wallet if any refund is applicable
    if (refundAmount > 0) {
      const user = await User.findById(order.userId);
      if (user) {
        user.wallet = (user.wallet || 0) + refundAmount;
        await user.save();

      // Create refund transaction
      await Transaction.create({
        userId: order.userId,
        amount: refundAmount,
        type: 'refund',
        desc: `Order cancellation refund - Order #${order._id.toString().slice(-6).toUpperCase()}`,
        status: 'success'
      });
      }
    }

    // Cancel Shiprocket Order if pushed
    if (order.shiprocketOrderId) {
      try {
        await ShiprocketService.cancelOrder(order.shiprocketOrderId);
      } catch (err) {
        console.error("Failed to cancel Shiprocket order", err);
      }
    }
  }

  await order.save();

  // Notify user
  import('../utils/notifyHelper.js').then(({ notify }) => {
    notify({
      userId: order.userId.toString(),
      role: 'user',
      title: action === 'approved' ? 'Order Cancelled & Refunded' : 'Cancel Request Rejected',
      message: action === 'approved'
        ? `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled. ₹${refundAmount} refunded.`
        : `Your cancel request for order #${order._id.toString().slice(-6).toUpperCase()} has been rejected.`,
      type: action === 'approved' ? 'info' : 'warning',
      link: `/user/order/${order._id}`,
      data: { type: 'order_update', orderId: order._id.toString() }
    });
  }).catch(console.error);

  return res.status(200).json(new ApiResponse(200, { order }, `Cancel request ${action}`));
});

// GET /api/admin/products
export const getAdminProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, { products }, 'Products fetched'));
});

// POST /api/admin/products
export const createAdminProduct = asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, costPrice, discount, category, image, stock, minStock, sku, featuredSection, weight, length, breadth, height } = req.body;
  if (!name || !price || !category) {
    throw new ApiError(400, 'Name, price, and category are required');
  }
  
  const inStock = stock > 0;

  let uploadedImage = image || '';
  let pubId = '';
  if (uploadedImage.startsWith('data:image')) {
    const result = await uploadMedia(uploadedImage, 'astrotalk_products');
    uploadedImage = result.url;
    pubId = result.publicId;
  }

  const product = await Product.create({
    name, description, price, originalPrice, costPrice: costPrice || 0, discount, category, 
    image: uploadedImage,
    cloudinaryPublicId: pubId,
    stock: stock || 0,
    minStock: minStock || 10,
    sku: sku || Math.random().toString(36).substr(2, 6).toUpperCase(),
    featuredSection: featuredSection || 'none',
    weight: weight || 0.5,
    length: length || 10,
    breadth: breadth || 10,
    height: height || 10,
    inStock
  });

  return res.status(201).json(new ApiResponse(201, { product }, 'Product created successfully'));
});

// PUT /api/admin/products/:id
export const updateAdminProduct = asyncHandler(async (req, res) => {
  const updates = req.body;
  
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
  
  if (update.appLogo && update.appLogo.startsWith('data:image')) {
    const { uploadMedia, deleteMedia } = await import('../config/cloudinary.js');
    const existingSettings = await SystemSettings.findOne({});
    if (existingSettings && existingSettings.appLogoPublicId) {
      await deleteMedia(existingSettings.appLogoPublicId);
    }
    const uploadResult = await uploadMedia(update.appLogo, 'astrotalk_branding');
    update.appLogo = uploadResult.url;
    update.appLogoPublicId = uploadResult.publicId;
  }

  let settings = await SystemSettings.findOneAndUpdate({}, update, {
    new: true,
    upsert: true,
    runValidators: true,
  });

  const io = req.app.get('io');
  if (io) {
    io.emit('settings_updated');
  }

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


// GET /api/admin/transactions
export const getAdminTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find()
    .sort({ createdAt: -1 })
    .lean();
    
  // Populate Users and Astrologers manually because ref is strictly 'User'
  const { default: User } = await import('../models/user.model.js');
  const { default: Astrologer } = await import('../models/astrologer.model.js');

  for (let t of transactions) {
    if (t.userId) {
      let user = await User.findById(t.userId).select('name role');
      if (user) {
        t.userId = { name: `User: ${user.name}` };
      } else {
        let astro = await Astrologer.findById(t.userId).select('name role');
        if (astro) {
          t.userId = { name: `Astro: ${astro.name}` };
        } else {
          t.userId = { name: 'Unknown' };
        }
      }
    } else {
      t.userId = { name: 'Unknown' };
    }
  }
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
  const sessions = await ChatSession.find({ isBotSession: { $ne: true } })
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

// POST /api/admin/sessions/bulk-delete
export const bulkDeleteAdminSessions = asyncHandler(async (req, res) => {
  const { sessionIds = [], callIds = [] } = req.body;
  
  if (sessionIds.length > 0) {
    await ChatSession.deleteMany({ _id: { $in: sessionIds } });
  }
  
  if (callIds.length > 0) {
    await CallSession.deleteMany({ _id: { $in: callIds } });
  }
  
  return res.status(200).json(new ApiResponse(200, null, 'Sessions bulk deleted successfully'));
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

  const revenueLogs = await RevenueLog.find().lean();
  const basePlatformCommission = revenueLogs.reduce((acc, log) => acc + (log.adminShare || 0), 0);
  
  const totalDeductions = revenueLogs.reduce((acc, log) => acc + (log.totalCost || 0), 0);

  const storeRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalRevenue = (totalDeductions + storeRevenue) || 0;
  
  // Admin gets 100% of store sales
  const platformCommission = basePlatformCommission + storeRevenue;

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
  
  const { getISTStartOfToday, getISTStartOfSevenDaysAgo, getISTStartOfMonth, getISTStartOfLastMonth } = await import('../utils/dateHelper.js');

  if (filter === 'Today') {
    query.createdAt = { $gte: getISTStartOfToday() };
  } else if (filter === 'This Week') {
    query.createdAt = { $gte: getISTStartOfSevenDaysAgo() };
  } else if (filter === 'This Month') {
    // Usually 'This Month' means from 1st of the month
    query.createdAt = { $gte: getISTStartOfMonth() };
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
  return res.status(200).json(new ApiResponse(200, {}, 'Call session deleted successfully'));
});

// GET /api/admin/astrologer-payouts
export const getAstrologerPayouts = asyncHandler(async (req, res) => {
  const payouts = await WithdrawalRequest.find()
    .populate('astrologerId', 'name phone')
    .sort({ createdAt: -1 })
    .lean();
    
  const formattedPayouts = payouts.map(p => ({
    _id: p._id,
    astrologerId: p.astrologerId?._id || 'deleted',
    name: p.astrologerId?.name || 'Deleted Astrologer',
    phone: p.astrologerId?.phone || 'N/A',
    wallet: p.amount,
    status: p.status,
    bankDetails: p.bankDetailsSnapshot,
    date: p.createdAt
  }));

  return res.status(200).json(new ApiResponse(200, { payouts: formattedPayouts }, 'Payouts fetched'));
});

// POST /api/admin/astrologer-payouts/:id/process
export const processAstrologerPayout = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const withdrawal = await WithdrawalRequest.findById(id).populate('astrologerId');
  
  if (!withdrawal) throw new ApiError(404, 'Withdrawal request not found');
  if (withdrawal.status !== 'pending') throw new ApiError(400, `Withdrawal is already ${withdrawal.status}`);

  const astrologer = withdrawal.astrologerId;
  const bankDetails = withdrawal.bankDetailsSnapshot;

  if (!bankDetails || !bankDetails.accountNumber) {
    throw new ApiError(400, 'Astrologer bank details are missing.');
  }

  let paymentProofUrl = null;

  try {
    if (!req.file) {
      throw new ApiError(400, 'Payment receipt screenshot is required');
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;
    
    const result = await uploadMedia(dataURI, 'payouts');
    
    if (!result || !result.url) {
      throw new Error('Cloudinary failed to return a valid URL.');
    }
    paymentProofUrl = result.url;
  } catch (error) {
    console.error('Payout Receipt Upload Error:', error.message);
    throw new ApiError(500, 'Failed to upload payment receipt');
  }

  // Finalize processing
  withdrawal.status = 'completed';
  withdrawal.processedAt = new Date();
  withdrawal.paymentProof = paymentProofUrl;
  await withdrawal.save();

  // Log the transaction for admin audit
  await Transaction.create({
    userId: astrologer._id,
    type: 'refund', // We use refund/payout type for money leaving platform
    amount: withdrawal.amount,
    status: 'completed',
    paymentMethod: 'bank_transfer',
    razorpayReference: paymentProofUrl,
    desc: 'Astrologer Payout via Manual Bank Transfer'
  });

  // Deduct from astrologer earnings
  astrologer.earnings.withdrawn = (astrologer.earnings.withdrawn || 0) + withdrawal.amount;
  astrologer.earnings.available = Math.max(0, (astrologer.earnings.available || 0) - withdrawal.amount);
  await astrologer.save();

  const io = req.app.get('io');
  if (io) {
    io.to(`astro_${astrologer._id}`).emit('withdrawal_processed', { withdrawal });
    io.to(`room_astro_${astrologer._id}`).emit('withdrawal_processed', { withdrawal });
  }

  import('../utils/notifyHelper.js').then(({ notify }) => {
    notify({
      userId: astrologer._id,
      role: 'astrologer',
      title: 'Withdrawal Approved ✅',
      message: `Your withdrawal of ₹${withdrawal.amount} has been processed.`,
      type: 'success',
      link: '/astrologer/earnings'
    });
  }).catch(console.error);

  return res.status(200).json(new ApiResponse(200, { withdrawal }, 'Payout processed successfully'));
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

export const toggleTopVerifiedAstrologer = asyncHandler(async (req, res) => {
  const astrologer = await Astrologer.findById(req.params.id);
  if (!astrologer) throw new ApiError(404, 'Astrologer not found');
  astrologer.isTopVerified = !astrologer.isTopVerified;
  await astrologer.save();
  const io = req.app.get('io');
  if (io) {
    io.emit('topAstrologersUpdated');
  }
  return res.status(200).json(new ApiResponse(200, { astrologer }, `Astrologer ${astrologer.isTopVerified ? 'added to' : 'removed from'} Top Verified`));
});

// GET /api/admin/ratings
export const getAdminRatings = asyncHandler(async (req, res) => {
  const ratings = await Rating.find()
    .populate('userId', 'name')
    .populate('astrologerId', 'name')
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json(new ApiResponse(200, { ratings }, 'Ratings fetched'));
});

// DELETE /api/admin/ratings/:id
export const deleteAdminRating = asyncHandler(async (req, res) => {
  const rating = await Rating.findByIdAndDelete(req.params.id);
  if (!rating) throw new ApiError(404, 'Rating not found');
  return res.status(200).json(new ApiResponse(200, { rating }, 'Rating deleted successfully'));
});

// GET /api/admin/pending-counts
export const getAdminPendingCounts = asyncHandler(async (req, res) => {
  const [
    pendingAstrologers,
    pendingOrders,
    pendingCancelRequests,
    pendingWithdrawals,
    lowStockProducts
  ] = await Promise.all([
    Astrologer.countDocuments({ status: 'pending' }),
    Order.countDocuments({ orderStatus: 'pending' }),
    Order.countDocuments({ 'cancelRequest.requested': true, 'cancelRequest.adminResponse': 'pending' }),
    WithdrawalRequest.countDocuments({ status: 'pending' }),
    Product.countDocuments({ stock: { $lte: 10 } })
  ]);

  return res.status(200).json(new ApiResponse(200, {
    astrologers: pendingAstrologers,
    orders: pendingOrders,
    cancelRequests: pendingCancelRequests,
    withdrawals: pendingWithdrawals,
    lowStock: lowStockProducts
  }, 'Pending counts fetched'));
});

import ShiprocketService from '../services/shiprocket.service.js';
import { sendPushNotification } from '../utils/firebaseHelper.js';

// POST /api/admin/orders/:id/shiprocket/push
export const pushOrderToShiprocket = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('userId', 'name phone email')
    .populate('items.productId', 'name sku price weight length breadth height');

  if (!order) throw new ApiError(404, 'Order not found');
  if (order.shiprocketOrderId) throw new ApiError(400, 'Order already pushed to Shiprocket');

  // Prepare Shiprocket Order Payload
  const orderItems = order.items.map(item => ({
    name: item.productId?.name || 'Unknown Product',
    sku: item.productId?.sku || item.productId?._id?.toString() || item._id.toString(),
    units: item.quantity,
    selling_price: item.price,
    discount: 0,
    tax: 0,
    hsn: ''
  }));

  let totalWeight = 0;
  let maxLength = 10;
  let maxBreadth = 10;
  let maxHeight = 10;

  order.items.forEach(item => {
    const qty = item.quantity || 1;
    const pWeight = item.productId?.weight || 0.5;
    totalWeight += (pWeight * qty);

    if ((item.productId?.length || 10) > maxLength) maxLength = item.productId.length;
    if ((item.productId?.breadth || 10) > maxBreadth) maxBreadth = item.productId.breadth;
    if ((item.productId?.height || 10) > maxHeight) maxHeight = item.productId.height;
  });

  if (totalWeight < 0.05) totalWeight = 0.05; // Minimum weight for Shiprocket

  const cleanPhone = (order.shippingAddress?.phone || order.userId?.phone || "9999999999").replace(/\D/g, '').slice(-10);
  const finalPhone = cleanPhone.length === 10 ? cleanPhone : '9999999999';
  const cleanAddress = (order.shippingAddress?.addressLine || 'No address provided').padEnd(10, ' ');
  const cleanCity = order.shippingAddress?.city || 'Delhi';
  const cleanState = order.shippingAddress?.state || 'Delhi';
  let cleanPincode = (order.shippingAddress?.pincode || '110001').toString().replace(/\D/g, '').substring(0, 6);
  if (cleanPincode.length !== 6) cleanPincode = '110001';

  const orderData = {
    order_id: order._id.toString(),
    order_date: order.createdAt.toISOString(),
    pickup_location: "warehouse", // Must match the pickup location added in Shiprocket dashboard
    billing_customer_name: order.shippingAddress?.fullName || order.userId?.name || 'Customer',
    billing_last_name: " ",
    billing_address: cleanAddress,
    billing_address_2: "",
    billing_city: cleanCity,
    billing_pincode: cleanPincode,
    billing_state: cleanState,
    billing_country: "India",
    billing_email: order.shippingAddress?.email || order.userId?.email || "customer@jyotishlink.com",
    billing_phone: finalPhone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    sub_total: order.totalAmount,
    length: maxLength,
    breadth: maxBreadth,
    height: maxHeight,
    weight: totalWeight
  };

  const shiprocketResponse = await ShiprocketService.createOrder(orderData);

  if (!shiprocketResponse || !shiprocketResponse.order_id) {
    throw new ApiError(400, shiprocketResponse?.message || 'Shiprocket API rejected the order data');
  }

  order.shiprocketOrderId = shiprocketResponse.order_id;
  order.shipmentId = shiprocketResponse.shipment_id;
  await order.save();

  return res.status(200).json(new ApiResponse(200, { order, shiprocketResponse }, 'Order pushed to Shiprocket successfully'));
});

// POST /api/admin/orders/:id/shiprocket/awb
export const generateOrderAWB = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.shipmentId) throw new ApiError(400, 'Order not pushed to Shiprocket yet');
  if (order.awbCode) throw new ApiError(400, 'AWB already generated');

  const { courierId } = req.body;
  const awbResponse = await ShiprocketService.generateAWB(order.shipmentId, courierId);

  if (awbResponse.awb_assign_status === 1) {
    order.awbCode = awbResponse.response.data.awb_code;
    order.courierCompanyId = awbResponse.response.data.courier_company_id;
    order.courierPartner = awbResponse.response.data.courier_name;
    order.trackingId = awbResponse.response.data.awb_code; // Map to existing trackingId field
    order.orderStatus = 'shipped';
    await order.save();

    // Notify user
    const io = req.app.get('io');
    if (io) {
      io.to(`room_user_${order.userId}`).emit('order_updated', { order });
    }

    import('../utils/notifyHelper.js').then(({ notify }) => {
      notify({
        userId: order.userId.toString(),
        role: 'user',
        title: 'Order Shipped 🚚',
        message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been shipped. AWB: ${order.awbCode}`,
        type: 'info',
        link: `/user/order/${order._id}`,
        data: { type: 'order_shipped', orderId: order._id.toString() }
      });
    }).catch(console.error);
  } else {
     throw new ApiError(500, 'Failed to generate AWB: ' + JSON.stringify(awbResponse));
  }

  return res.status(200).json(new ApiResponse(200, { order, awbResponse }, 'AWB generated successfully'));
});

// GET /api/admin/orders/:id/shiprocket/details
export const getShiprocketOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.shiprocketOrderId) throw new ApiError(400, 'Order not pushed to Shiprocket yet');

  const details = await ShiprocketService.getOrderDetails(order.shiprocketOrderId);
  return res.status(200).json(new ApiResponse(200, { order, shiprocketDetails: details }, 'Shiprocket details fetched successfully'));
});

// POST /api/admin/shiprocket/webhook
export const shiprocketWebhook = asyncHandler(async (req, res) => {
  try {
    const payload = req.body;
    console.log('Shiprocket Webhook Payload Received:', JSON.stringify(payload, null, 2));
    
    // Shiprocket sends awb and current_status
    if (payload) {
      const awbCode = payload.awb || '';
      const status = payload.current_status || '';
      
      // If status is DELIVERED
      if (status.toUpperCase() === 'DELIVERED' && awbCode) {
        const order = await Order.findOne({ awbCode: awbCode });
        if (order && order.orderStatus !== 'delivered') {
          order.orderStatus = 'delivered';
          order.paymentStatus = 'paid'; // Assuming delivered means paid even for COD
          await order.save();
          
          // Notify user
          const io = req.app.get('io');
          if (io) {
            io.to(`room_user_${order.userId}`).emit('order_updated', { order });
            io.emit('order_updated', { order }); // Broadcast to admin too
          }
          
          import('../utils/notifyHelper.js').then(({ notify }) => {
            notify({
              userId: order.userId.toString(),
              role: 'user',
              title: 'Order Delivered 🎉',
              message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been successfully delivered.`,
              type: 'success',
              link: `/user/order/${order._id}`,
              data: { type: 'order_delivered', orderId: order._id.toString() }
            });
          }).catch(console.error);
          
          console.log(`Webhook: Order ${order._id} marked as DELIVERED via AWB ${awbCode}`);
        }
      }
      
      // If status is CANCELED
      if (status.toUpperCase() === 'CANCELED' || status.toUpperCase() === 'CANCELLED') {
        let orderQuery = {};
        if (awbCode) {
          orderQuery = { awbCode: awbCode };
        } else if (payload.order_id) {
          orderQuery = { shiprocketOrderId: payload.order_id.toString() };
        } else {
          return res.status(200).send('No AWB or Order ID to match');
        }

        const order = await Order.findOne(orderQuery);
        if (order && order.orderStatus !== 'cancelled') {
          order.orderStatus = 'cancelled';
          
          // Process full refund if not COD and not already refunded
          if (order.paymentMethod !== 'cod' && order.paymentStatus !== 'refunded') {
            order.paymentStatus = 'refunded';
            const user = await User.findById(order.userId);
            if (user) {
              user.wallet = (user.wallet || 0) + order.totalAmount;
              await user.save();

              await Transaction.create({
                userId: order.userId,
                amount: order.totalAmount,
                type: 'refund',
                desc: `Refund for cancelled order #${order._id.toString().slice(-6).toUpperCase()}`,
                status: 'success'
              });
            }
          }
          
          await order.save();

          // Notify user
          const io = req.app.get('io');
          if (io) {
            io.to(`room_user_${order.userId}`).emit('order_updated', { order });
            io.emit('order_updated', { order }); // Broadcast to admin too
          }
          
          import('../utils/notifyHelper.js').then(({ notify }) => {
            notify({
              userId: order.userId.toString(),
              role: 'user',
              title: 'Order Cancelled',
              message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been cancelled by the courier.`,
              type: 'warning',
              link: `/user/order/${order._id}`,
              data: { type: 'order_cancelled', orderId: order._id.toString() }
            });
          }).catch(console.error);
          
          console.log(`Webhook: Order ${order._id} marked as CANCELED via AWB ${awbCode}`);
        }
      }
    }
    
    // Always respond with 200 OK so Shiprocket knows we received it
    res.status(200).send('Webhook received');
  } catch (err) {
    import('fs').then(fs => fs.writeFileSync('webhook_error.log', err.stack || err.toString())).catch(() => {});
    console.error('Webhook processing error:', err);
    res.status(200).send('Webhook received but error occurred'); // Keep sending 200 to prevent retries
  }
});
