import axios from './axios';

export const getCart = () => axios.get('/store/cart');
export const updateCart = (productId, quantity) => axios.post('/store/cart', { productId, quantity });
export const verifyStoreCoupon = (couponCode, totalAmount) => axios.post('/store/coupon/verify', { couponCode, totalAmount });
export const createOrder = (shippingAddress, paymentMethod, paymentData, couponCode) => axios.post('/store/order', { shippingAddress, paymentMethod, paymentData, couponCode });
export const getUserOrders = () => axios.get('/store/orders');
export const getOrderById = (id) => axios.get(`/store/orders/${id}`);
export const createRazorpayOrder = (amount) => axios.post('/store/razorpay-order', { amount });
export const requestCancelOrder = (orderId, reason) => axios.post(`/store/orders/${orderId}/cancel`, { reason });
export const trackOrder = (orderId) => axios.get(`/store/orders/${orderId}/track`);
