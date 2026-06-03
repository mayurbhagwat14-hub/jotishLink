import Razorpay from 'razorpay';
import crypto from 'crypto';
import Cart from '../models/cart.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// GET /api/store/cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  }
  return res.status(200).json(new ApiResponse(200, { cart }, 'Cart fetched'));
});

// POST /api/store/cart
export const updateCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body; // quantity can be absolute value or delta

  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = new Cart({ userId: req.user._id, items: [] });
  }

  const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId);

  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
  } else {
    if (quantity > 0) {
      cart.items.push({ productId, quantity });
    }
  }

  await cart.save();
  const populatedCart = await Cart.findById(cart._id).populate('items.productId');
  
  return res.status(200).json(new ApiResponse(200, { cart: populatedCart }, 'Cart updated'));
});

// POST /api/store/order
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;
  
  if (!['wallet', 'online', 'cod'].includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method');
  }

  const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // Calculate total
  let totalAmount = 0;
  const orderItems = cart.items.map((item) => {
    const price = item.productId.price;
    totalAmount += price * item.quantity;
    return {
      productId: item.productId._id,
      quantity: item.quantity,
      price: price
    };
  });

  const user = await User.findById(req.user._id);

  let paymentStatus = 'pending';

  if (paymentMethod === 'wallet') {
    if (user.wallet < totalAmount) {
      throw new ApiError(400, 'Insufficient wallet balance');
    }
    // Deduct wallet
    user.wallet -= totalAmount;
    await user.save();
    
    // Create transaction record
    await Transaction.create({
      userId: user._id,
      amount: totalAmount,
      type: 'deduction',
      desc: 'E-commerce Order Payment',
      status: 'success'
    });
    
    paymentStatus = 'paid';
  } else if (paymentMethod === 'online') {
    const { paymentData } = req.body;
    if (!paymentData || !paymentData.razorpay_payment_id || !paymentData.razorpay_signature) {
      throw new ApiError(400, 'Invalid payment details');
    }
    
    const body = paymentData.razorpay_order_id + "|" + paymentData.razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
                                    .update(body.toString())
                                    .digest('hex');

    if (expectedSignature !== paymentData.razorpay_signature) {
      throw new ApiError(400, 'Invalid payment signature');
    }

    // Create transaction record
    await Transaction.create({
      userId: user._id,
      amount: totalAmount,
      type: 'deduction',
      desc: 'Online Order Payment',
      status: 'success'
    });

    paymentStatus = 'paid';
  }

  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    shippingAddress,
    totalAmount,
    paymentMethod,
    paymentStatus,
  });

  // Increment sold count in Products
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { sold: item.quantity, stock: -item.quantity }
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Emit event to admins
  const io = req.app.get('io');
  if (io) {
    io.emit('admin_new_order', {
      orderId: order._id,
      amount: totalAmount,
      customerName: user.name || 'User'
    });
  }

  return res.status(201).json(new ApiResponse(201, { order }, 'Order placed successfully'));
});

// GET /api/store/orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ userId: req.user._id, deletedByUser: { $ne: true } })
    .populate('items.productId')
    .sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, { orders }, 'Orders fetched'));
});

// GET /api/store/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id })
    .populate('items.productId');
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  return res.status(200).json(new ApiResponse(200, { order }, 'Order details fetched'));
});

// POST /api/store/orders/:id/cancel
export const requestCancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
  
  if (!order) throw new ApiError(404, 'Order not found');
  if (['delivered', 'cancelled'].includes(order.orderStatus)) {
    throw new ApiError(400, 'Cannot cancel a delivered or already cancelled order');
  }
  if (order.cancelRequest?.requested) {
    throw new ApiError(400, 'Cancel request already submitted');
  }

  const refundPercent = 80;
  const refundAmount = Math.round((order.totalAmount * refundPercent) / 100);

  order.cancelRequest = {
    requested: true,
    reason: reason || 'No reason provided',
    requestedAt: new Date(),
    adminResponse: 'pending',
    refundPercent,
    refundAmount,
  };
  await order.save();

  // Notify admin via socket
  const io = req.app.get('io');
  if (io) {
    io.emit('admin_cancel_request', {
      orderId: order._id,
      customerName: req.user.name || 'User',
      reason: order.cancelRequest.reason,
      amount: order.totalAmount,
    });
  }

  return res.status(200).json(new ApiResponse(200, { order }, 'Cancel request submitted'));
});

// POST /api/store/razorpay-order
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  
  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Invalid amount');
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
  });

  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency: 'INR',
    receipt: 'order_rcptid_' + Date.now()
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(new ApiResponse(200, order, 'Razorpay order created'));
  } catch (error) {
    throw new ApiError(500, error.message || 'Failed to create Razorpay order');
  }
});
