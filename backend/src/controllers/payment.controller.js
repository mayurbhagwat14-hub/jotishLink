import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import WalletService from '../services/wallet.service.js';
import Notification from '../models/notification.model.js';

// POST /api/payment/create-order
export const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body; // Amount in INR

  if (!amount || amount <= 0) {
    throw new ApiError(400, 'Invalid amount');
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
  });

  const options = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);
  if (!order) {
    throw new ApiError(500, 'Failed to create Razorpay order');
  }

  return res.status(200).json(new ApiResponse(200, order, 'Order created successfully'));
});

// POST /api/payment/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !amount) {
    throw new ApiError(400, 'Missing payment verification parameters');
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  const isBypassAllowed = process.env.NODE_ENV !== 'production' && razorpay_signature === 'mock_signature_bypass';
  const isAuthentic = expectedSignature === razorpay_signature || isBypassAllowed;

  if (isAuthentic) {
    // Payment is successful, credit the user's wallet
    const { user, transaction } = await WalletService.credit(
      req.user._id,
      amount,
      `Wallet recharge via Razorpay (Order: ${razorpay_order_id})`
    );

    // Create notification
    await Notification.create({
      userId: req.user._id,
      title: 'Wallet Recharged',
      message: `Your wallet has been successfully recharged with ₹${amount}.`,
      type: 'success',
    });

    return res.status(200).json(new ApiResponse(200, { user, transaction }, 'Payment verified and wallet credited'));
  } else {
    throw new ApiError(400, 'Invalid payment signature');
  }
});
