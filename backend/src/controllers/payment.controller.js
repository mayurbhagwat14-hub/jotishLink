import Razorpay from 'razorpay';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import WalletService from '../services/wallet.service.js';
import Notification from '../models/notification.model.js';

// POST /api/payment/create-order
export const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_secret.includes('••••')) {
    console.log('Using Mock Razorpay Order because actual keys are missing.');
    return res.status(200).json(new ApiResponse(200, {
      orderId: 'order_mock_' + Date.now(),
      amount: Math.round(amount * 100),
      amountINR: amount,
      currency: 'INR',
      key: 'mock_key',
      mock: true
    }, 'Mock order created'));
  }

  if (!amount || amount < 10) {
    throw new ApiError(400, 'Amount must be at least ₹10');
  }

  const razorpay = new Razorpay({
    key_id,
    key_secret,
  });

  const options = {
    amount: Math.round(amount * 100), // paise (must be an integer)
    currency: 'INR',
    receipt: `r_${Date.now().toString().slice(-6)}_${req.user._id.toString().slice(-6)}`,
    notes: {
      userId: req.user._id.toString(),
      purpose: 'wallet_recharge'
    }
  };

  let order;
  try {
    order = await razorpay.orders.create(options);
  } catch (error) {
    console.error('Razorpay Error:', error);
    // Throw a 500 so that external 401s don't trigger frontend auth/logout
    throw new ApiError(500, 'Failed to create payment order with the provider. Please check provider keys.');
  }
  
  return res.status(200).json(new ApiResponse(200, {
    orderId: order.id,
    amount: order.amount,
    amountINR: amount,
    currency: order.currency,
    key: key_id
  }, 'Order created successfully'));
});

// POST /api/payment/verify
export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, mock } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !amount) {
    throw new ApiError(400, 'Missing payment verification parameters');
  }

  if (mock) {
    const { user, transaction } = await WalletService.credit(
      req.user._id,
      amount,
      `Wallet recharge (Mock Test) | Payment ID: ${razorpay_payment_id}`,
      razorpay_payment_id,
      'success'
    );

    import('../utils/notifyHelper.js').then(({ notify }) => {
      notify({
        userId: req.user._id,
        role: 'user',
        title: 'Wallet Recharged ✅',
        message: `₹${amount} added. New balance: ₹${user.wallet}`,
        type: 'success',
        link: '/user/wallet'
      });
    }).catch(console.error);

    return res.status(200).json(new ApiResponse(200, {
      newBalance: user.wallet,
      transaction
    }, 'Mock payment verified and wallet credited'));
  }

  if (!razorpay_signature) {
    throw new ApiError(400, 'Missing Razorpay signature');
  }

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    throw new ApiError(500, 'Razorpay credentials missing in server');
  }

  const body = razorpay_order_id + '|' + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, 'Payment signature verification failed');
  }

  // Payment is successful
  const { user, transaction } = await WalletService.credit(
    req.user._id,
    amount,
    `Wallet recharge via Razorpay | Payment ID: ${razorpay_payment_id}`,
    razorpay_payment_id,
    'success'
  );

  import('../utils/notifyHelper.js').then(({ notify }) => {
    notify({
      userId: req.user._id,
      role: 'user',
      title: 'Wallet Recharged ✅',
      message: `₹${amount} added. New balance: ₹${user.wallet}`,
      type: 'success',
      link: '/user/wallet'
    });
  }).catch(console.error);

  return res.status(200).json(new ApiResponse(200, {
    newBalance: user.wallet,
    transaction
  }, 'Payment verified and wallet credited'));
});
