import axios from './axios';

export const adminLogin = (data) => axios.post('/admin/auth/login', data);
export const adminChangePassword = (data) => axios.post('/admin/auth/change-password', data);
export const adminDeleteAccount = () => axios.delete('/admin/profile');
export const adminUpdateProfile = (data) => axios.put('/admin/profile', data);

export const getAdminDashboard = () => axios.get('/admin/dashboard-stats');
export const getAdminUsers = () => axios.get('/admin/users');
export const updateAdminUserStatus = (id, status) => axios.put(`/admin/users/${id}/status`, { status });
export const deleteAdminUser = (id) => axios.delete(`/admin/users/${id}`);
export const getAdminAstrologers = () => axios.get('/admin/astrologers');
export const updateAdminAstrologerStatus = (id, status) => axios.put(`/admin/astrologers/${id}/status`, { status });
export const deleteAdminAstrologer = (id) => axios.delete(`/admin/astrologers/${id}`);
export const refundUser = (id, data) => axios.post(`/admin/users/${id}/refund`, data);
export const getAdminOrders = () => axios.get('/admin/orders');
export const updateAdminOrderStatus = (id, status) => axios.put(`/admin/orders/${id}/status`, { status });
export const processCancelRequest = (id, action, refundPercent) => axios.put(`/admin/orders/${id}/cancel`, { action, refundPercent });
export const getAdminProducts = () => axios.get('/admin/products');
export const createAdminProduct = (data) => axios.post('/admin/products', data);
export const updateAdminProduct = (id, data) => axios.put(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id) => axios.delete(`/admin/products/${id}`);
export const getAdminSettings = () => axios.get('/admin/settings');
export const updateAdminSettings = (settings) => axios.put('/admin/settings', settings);

export const getAdminCelebrities = () => axios.get('/admin/celebrities');
export const createAdminCelebrity = (data) => axios.post('/admin/celebrities', data);
export const updateAdminCelebrity = (id, data) => axios.put(`/admin/celebrities/${id}`, data);
export const deleteAdminCelebrity = (id) => axios.delete(`/admin/celebrities/${id}`);

export const getAdminTransactions = () => axios.get('/admin/transactions');

// Coupons
export const getAdminCoupons = () => axios.get('/admin/coupons');
export const createAdminCoupon = (data) => axios.post('/admin/coupons', data);
export const updateAdminCoupon = (id, data) => axios.put(`/admin/coupons/${id}`, data);
export const deleteAdminCoupon = (id) => axios.delete(`/admin/coupons/${id}`);

// Banners
export const getAdminBanners = () => axios.get('/admin/banners');
export const createAdminBanner = (data) => axios.post('/admin/banners', data);
export const updateAdminBanner = (id, data) => axios.put(`/admin/banners/${id}`, data);
export const deleteAdminBanner = (id) => axios.delete(`/admin/banners/${id}`);

// Audit Logs
export const getAdminAuditLogs = (limit = 50) => axios.get(`/admin/audit-logs?limit=${limit}`);

// Sessions, Poojas, Reports, Calls
export const getAdminSessions = () => axios.get('/admin/sessions');
export const getAdminPoojas = () => axios.get('/admin/poojas');
export const getAdminReports = () => axios.get('/admin/reports');
export const getAdminCalls = () => axios.get('/admin/calls');
export const getAdminCallAnalytics = () => axios.get('/admin/calls/analytics');
export const getAstrologerPayouts = () => axios.get('/admin/astrologer-payouts');
export const processAstrologerPayout = (id, data) => axios.post(`/admin/astrologer-payouts/${id}/process`, data);
