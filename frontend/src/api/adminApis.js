import axios from './axios';

export const adminLogin = (data) => axios.post('/admin/auth/login', data);
export const adminChangePassword = (data) => axios.post('/admin/auth/change-password', data);
export const adminDeleteAccount = () => axios.delete('/admin/profile');
export const adminUpdateProfile = (data) => axios.put('/admin/profile', data);

export const getAdminDashboard = () => axios.get('/admin/dashboard-stats');
export const getAdminUsers = () => axios.get('/admin/users');
export const updateAdminUserStatus = (id, status) => axios.put(`/admin/users/${id}/status`, { status });
export const getAdminAstrologers = () => axios.get('/admin/astrologers');
export const updateAdminAstrologerStatus = (id, status) => axios.put(`/admin/astrologers/${id}/status`, { status });
export const getAdminOrders = () => axios.get('/admin/orders');
export const updateAdminOrderStatus = (id, status) => axios.put(`/admin/orders/${id}/status`, { status });
export const getAdminProducts = () => axios.get('/admin/products');
export const getAdminSettings = () => axios.get('/admin/settings');
export const updateAdminSettings = (settings) => axios.put('/admin/settings', settings);
