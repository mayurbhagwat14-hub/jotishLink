import Razorpay from 'razorpay';
import crypto from 'crypto';
import Cart from '../models/cart.model.js';
import Coupon from '../models/coupon.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Transaction from '../models/transaction.model.js';
import Wishlist from '../models/wishlist.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { createShiprocketOrder } from '../utils/shiprocketHelper.js';
import { notify } from '../utils/notifyHelper.js';

// GET /api/store/cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [] });
  } else {
    const originalLength = cart.items.length;
    cart.items = cart.items.filter(item => item.productId != null);
    if (cart.items.length !== originalLength) {
      await cart.save();
    }
  }
  return res.status(200).json(new ApiResponse(200, { cart }, 'Cart fetched'));
});

// POST /api/store/cart
export const updateCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body; // quantity can be absolute value or delta
  
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || isNaN(quantity)) {
    throw new ApiError(400, 'Quantity must be a valid integer');
  }

  let cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    cart = new Cart({ userId: req.user._id, items: [] });
  }

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  if (quantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} units of ${product.name} are available in stock.`);
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

// POST /api/store/coupon/verify
export const verifyCoupon = asyncHandler(async (req, res) => {
  const { couponCode, totalAmount } = req.body;
  if (!couponCode || !totalAmount) throw new ApiError(400, 'Coupon code and total amount are required');

  const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
  if (!coupon) throw new ApiError(400, 'Invalid or inactive coupon');
  if (new Date(coupon.expiryDate) < new Date()) throw new ApiError(400, 'Coupon has expired');
  if (coupon.usageLimit > 0 && coupon.currentUsage >= coupon.usageLimit) throw new ApiError(400, 'Coupon usage limit reached');

  const calculatedDiscount = (totalAmount * coupon.discountPercent) / 100;
  let discountAmount = coupon.maxDiscount > 0 ? Math.min(calculatedDiscount, coupon.maxDiscount) : calculatedDiscount;
  discountAmount = Math.round(discountAmount);

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  return res.status(200).json(new ApiResponse(200, {
    discountAmount,
    finalAmount,
    couponCode: coupon.code,
  }, 'Coupon applied successfully'));
});

// POST /api/store/order
export const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, couponCode } = req.body;
  
  if (!['wallet', 'online', 'cod'].includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method');
  }

  const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // Calculate total and validate stock
  let totalAmount = 0;
  for (const item of cart.items) {
    if (!item.productId) continue;
    if (item.quantity > item.productId.stock) {
      throw new ApiError(400, `Product ${item.productId.name} is out of stock or requested quantity is not available. Available stock: ${item.productId.stock}`);
    }
  }

  const orderItems = [];
  for (const item of cart.items) {
    if (!item.productId) continue;
    const price = item.productId.price;
    const costPrice = item.productId.costPrice || 0;
    totalAmount += price * item.quantity;
    orderItems.push({
      productId: item.productId._id,
      quantity: item.quantity,
      price: price,
      costPrice: costPrice
    });
  }

  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    appliedCoupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!appliedCoupon) {
      throw new ApiError(400, 'Invalid or inactive coupon');
    }
    if (new Date(appliedCoupon.expiryDate) < new Date()) {
      throw new ApiError(400, 'Coupon has expired');
    }
    if (appliedCoupon.usageLimit > 0 && appliedCoupon.currentUsage >= appliedCoupon.usageLimit) {
      throw new ApiError(400, 'Coupon usage limit reached');
    }

    const calculatedDiscount = (totalAmount * appliedCoupon.discountPercent) / 100;
    discountAmount = appliedCoupon.maxDiscount > 0 ? Math.min(calculatedDiscount, appliedCoupon.maxDiscount) : calculatedDiscount;
    discountAmount = Math.round(discountAmount);

    totalAmount -= discountAmount;
    if (totalAmount < 0) totalAmount = 0;
  }

  const user = await User.findById(req.user._id);

  let paymentStatus = 'pending';
  const paymentData = req.body.paymentData;

  // 1. Pre-check Payment Constraints (Fail fast without rollback)
  if (paymentMethod === 'wallet') {
    if (user.wallet < totalAmount) {
      throw new ApiError(400, 'Insufficient wallet balance');
    }
  } else if (paymentMethod === 'online') {
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
  }

  // 2. Atomic Stock Reservation (Read & Write Lock)
  const reservedProducts = [];
  try {
    for (const item of orderItems) {
      const updatedProduct = await Product.findOneAndUpdate(
        { 
          _id: item.productId, 
          stock: { $gte: item.quantity } 
        },
        { 
          $inc: { stock: -item.quantity, sold: item.quantity } 
        },
        { new: true }
      );

      if (!updatedProduct) {
        const prod = await Product.findById(item.productId);
        throw new Error(`Product ${prod ? prod.name : 'Unknown'} is out of stock or requested quantity is not available.`);
      }

      reservedProducts.push({
        productId: item.productId,
        quantity: item.quantity
      });
      
      if (updatedProduct.stock <= 0) {
        await Product.findByIdAndUpdate(updatedProduct._id, { inStock: false });
      }
    }
  } catch (error) {
    // Rollback reserved stock safely
    for (const resItem of reservedProducts) {
      await Product.findByIdAndUpdate(resItem.productId, {
        $inc: { stock: resItem.quantity, sold: -resItem.quantity },
        $set: { inStock: true }
      });
    }
    throw new ApiError(400, error.message);
  }

  // 3. Execute Payment & Transactions
  if (paymentMethod === 'wallet') {
    user.wallet -= totalAmount;
    await user.save();
    
    await Transaction.create({
      userId: user._id,
      amount: totalAmount,
      type: 'deduction',
      desc: 'E-commerce Order Payment',
      status: 'success'
    });
    
    paymentStatus = 'paid';
  } else if (paymentMethod === 'online') {
    await Transaction.create({
      userId: user._id,
      amount: totalAmount,
      type: 'deduction',
      desc: 'Online Order Payment',
      status: 'success',
      razorpayReference: paymentData.razorpay_payment_id
    });

    paymentStatus = 'paid';
  }

  // 4. Create Order
  const order = await Order.create({
    userId: req.user._id,
    items: orderItems,
    shippingAddress,
    totalAmount,
    paymentMethod,
    paymentStatus,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
    discountAmount,
  });

  // 5. Send Notification
  notify({
    userId: user._id.toString(),
    role: 'user',
    title: 'Order Confirmed! 🎉',
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been placed successfully. ${paymentStatus === 'paid' ? '₹' + totalAmount + ' deducted.' : 'Payment pending (COD).'}`,
    type: 'success',
    link: `/user/order/${order._id}`,
    data: { type: 'order_confirmed', orderId: order._id.toString() }
  }).catch(err => console.error('Notify error:', err));

  // 6. Update Coupon
  if (appliedCoupon) {
    appliedCoupon.currentUsage += 1;
    await appliedCoupon.save();
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  // Automatic Shiprocket Integration
  try {
    let totalWeight = 0;
    let maxLength = 10;
    let maxBreadth = 10;
    let maxHeight = 10;

    const shiprocketItems = cart.items.map(item => {
      if (!item.productId) return null;
      const qty = item.quantity || 1;
      const pWeight = item.productId.weight || 0.5;
      totalWeight += (pWeight * qty);

      if ((item.productId.length || 10) > maxLength) maxLength = item.productId.length;
      if ((item.productId.breadth || 10) > maxBreadth) maxBreadth = item.productId.breadth;
      if ((item.productId.height || 10) > maxHeight) maxHeight = item.productId.height;

      return {
        name: item.productId.name || 'Unknown Product',
        sku: item.productId.sku || item.productId._id.toString() || item._id.toString(),
        units: item.quantity,
        selling_price: item.productId.price,
        discount: 0,
        tax: 0,
        hsn: ''
      };
    }).filter(Boolean);

    if (totalWeight < 0.05) totalWeight = 0.05;

    const cleanPhone = (shippingAddress?.phone || user?.phone || "9999999999").replace(/\D/g, '').slice(-10);
    const finalPhone = cleanPhone.length === 10 ? cleanPhone : '9999999999';
    const cleanAddress = (shippingAddress?.addressLine || 'No address provided').padEnd(10, ' ');
    const cleanCity = shippingAddress?.city || 'Delhi';
    const cleanState = shippingAddress?.state || 'Delhi';
    let cleanPincode = (shippingAddress?.pincode || '110001').toString().replace(/\D/g, '').substring(0, 6);
    if (cleanPincode.length !== 6) cleanPincode = '110001';

    const orderData = {
      order_id: order._id.toString(),
      order_date: order.createdAt.toISOString(),
      pickup_location: "warehouse",
      billing_customer_name: shippingAddress?.fullName || user?.name || 'Customer',
      billing_last_name: " ",
      billing_address: cleanAddress,
      billing_address_2: "",
      billing_city: cleanCity,
      billing_pincode: cleanPincode,
      billing_state: cleanState,
      billing_country: "India",
      billing_email: shippingAddress?.email || user?.email || "customer@jyotishlink.com",
      billing_phone: finalPhone,
      shipping_is_billing: true,
      order_items: shiprocketItems,
      payment_method: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.totalAmount,
      length: maxLength,
      breadth: maxBreadth,
      height: maxHeight,
      weight: totalWeight
    };

    const shiprocketResponse = await createShiprocketOrder(orderData);
    if (shiprocketResponse && shiprocketResponse.order_id) {
      order.shiprocketOrderId = shiprocketResponse.order_id;
      order.shipmentId = shiprocketResponse.shipment_id;
      await order.save();
    }
  } catch (err) {
    console.error('Shiprocket auto-creation failed during checkout:', err);
  }

  // Emit event to admins
  const io = req.app.get('io');
  if (io) {
    io.to('admin_room').emit('dashboard_updated');
    io.to(`room_user_${user._id}`).emit('order_updated', { order });
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
    io.to('admin_room').emit('dashboard_updated');
    io.to(`room_user_${req.user._id}`).emit('order_updated', { order });
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

import ShiprocketService from '../services/shiprocket.service.js';

// GET /api/store/orders/:id/track
export const trackOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
  
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!order.awbCode) {
    return res.status(200).json(new ApiResponse(200, { tracking: null, message: 'Tracking not available yet. AWB not generated.' }, 'Tracking info'));
  }

  try {
    const trackingData = await ShiprocketService.trackOrder(order.awbCode);
    return res.status(200).json(new ApiResponse(200, { tracking: trackingData }, 'Tracking details fetched successfully'));
  } catch (error) {
    throw new ApiError(500, 'Failed to fetch tracking details from Shiprocket');
  }
});

// GET /api/store/orders/:id/shiprocket/details
export const getUserShiprocketOrderDetails = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!order.shiprocketOrderId) throw new ApiError(400, 'Order not pushed to Shiprocket yet');

  const details = await ShiprocketService.getOrderDetails(order.shiprocketOrderId);
  return res.status(200).json(new ApiResponse(200, { shiprocketDetails: details }, 'Shiprocket order details fetched successfully'));
});

// GET /api/store/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products');
  if (!wishlist) {
    wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
  }
  return res.status(200).json(new ApiResponse(200, { wishlist }, 'Wishlist fetched successfully'));
});

// POST /api/store/wishlist/toggle
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new ApiError(400, 'Product ID is required');

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found');

  let wishlist = await Wishlist.findOne({ userId: req.user._id });
  if (!wishlist) {
    wishlist = new Wishlist({ userId: req.user._id, products: [] });
  }

  const index = wishlist.products.findIndex(id => id.toString() === productId);
  let isAdded = false;

  if (index > -1) {
    wishlist.products.splice(index, 1);
  } else {
    wishlist.products.push(productId);
    isAdded = true;
  }

  await wishlist.save();
  await wishlist.populate('products');

  return res.status(200).json(new ApiResponse(200, { wishlist, isAdded }, `Product ${isAdded ? 'added to' : 'removed from'} wishlist`));
});
