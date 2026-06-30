import { Router } from 'express';
import {
  getCart,
  updateCart,
  createOrder,
  verifyCoupon,
  getUserOrders,
  getOrderById,
  createRazorpayOrder,
  requestCancelOrder,
  trackOrder,
  getUserShiprocketOrderDetails,
  getWishlist,
  toggleWishlist,
  downloadInvoice
} from '../controllers/store.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/store/cart', verifyJWT, getCart);
router.post('/store/cart', verifyJWT, updateCart);
router.post('/store/coupon/verify', verifyJWT, verifyCoupon);
router.post('/store/order', verifyJWT, createOrder);
router.post('/store/razorpay-order', verifyJWT, createRazorpayOrder);
router.get('/store/orders', verifyJWT, getUserOrders);
router.get('/store/orders/:id', verifyJWT, getOrderById);
router.get('/store/orders/:id/invoice', verifyJWT, downloadInvoice);
router.post('/store/orders/:id/cancel', verifyJWT, requestCancelOrder);
router.get('/store/orders/:id/track', verifyJWT, trackOrder);
router.get('/store/orders/:id/shiprocket/details', verifyJWT, getUserShiprocketOrderDetails);

// Wishlist
router.get('/store/wishlist', verifyJWT, getWishlist);
router.post('/store/wishlist/toggle', verifyJWT, toggleWishlist);

export default router;
