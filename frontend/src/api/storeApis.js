import axios from './axios';

export const getCart = () => axios.get('/store/cart');
export const updateCart = (productId, quantity) => axios.post('/store/cart', { productId, quantity });
export const createOrder = (shippingAddress, paymentMethod, paymentData) => axios.post('/store/order', { shippingAddress, paymentMethod, paymentData });
export const getUserOrders = () => axios.get('/store/orders');
export const createRazorpayOrder = (amount) => axios.post('/store/razorpay-order', { amount });
