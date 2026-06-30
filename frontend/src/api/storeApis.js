import axios from './axios';

export const getCart = () => axios.get('/store/cart');
export const updateCart = (productId, quantity) => axios.post('/store/cart', { productId, quantity });
export const verifyStoreCoupon = (couponCode) => axios.post('/store/coupon/verify', { couponCode });
export const createOrder = (shippingAddress, paymentMethod, paymentData, couponCode) => axios.post('/store/order', { shippingAddress, paymentMethod, paymentData, couponCode });
export const getUserOrders = () => axios.get(`/store/orders?t=${Date.now()}`);
export const getOrderById = (id) => axios.get(`/store/orders/${id}`);
export const createRazorpayOrder = (couponCode) => axios.post('/store/razorpay-order', { couponCode });
export const requestCancelOrder = (orderId, reason) => axios.post(`/store/orders/${orderId}/cancel`, { reason });
export const trackOrder = (orderId) => axios.get(`/store/orders/${orderId}/track`);
export const getUserShiprocketOrderDetails = (orderId) => axios.get(`/store/orders/${orderId}/shiprocket/details`);

export const getWishlist = () => axios.get('/store/wishlist');
export const toggleWishlist = (productId) => axios.post('/store/wishlist/toggle', { productId });
