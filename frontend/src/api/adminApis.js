import axios from './axios';

export const adminLogin = (data) => axios.post('/admin/auth/login', data);
export const adminChangePassword = (data) => axios.post('/admin/auth/change-password', data);
export const adminDeleteAccount = () => axios.delete('/admin/profile');
export const adminUpdateProfile = (data) => axios.put('/admin/profile', data);

export const getAdminDashboard = () => axios.get('/admin/dashboard-stats');
export const getAdminUsers = (params) => axios.get('/admin/users', { params });
export const updateAdminUserStatus = (id, status) => axios.put(`/admin/users/${id}/status`, { status });
export const deleteAdminUser = (id) => axios.delete(`/admin/users/${id}`);
export const getAdminAstrologers = () => axios.get('/admin/astrologers');
export const getAdminAstrologerById = (id) => axios.get(`/admin/astrologer/${id}`);
export const updateAdminAstrologerStatus = (id, status) => axios.put(`/admin/astrologer/${id}/status`, { status });
export const approveAstrologer = (id) => axios.put(`/admin/astrologer/approve/${id}`);
export const rejectAstrologer = (id, reason) => axios.put(`/admin/astrologer/reject/${id}`, { reason });
export const suspendAstrologer = (id, reason) => axios.put(`/admin/astrologer/suspend/${id}`, { reason });
export const toggleAdminAstrologerTopVerified = (id) => axios.put(`/admin/astrologer/${id}/toggle-top-verified`);
export const deleteAdminAstrologer = (id) => axios.delete(`/admin/astrologers/${id}`);
export const refundUser = (id, data) => axios.post(`/admin/users/${id}/refund`, data);
export const getAdminOrders = () => axios.get('/admin/orders');
export const updateAdminOrderStatus = (id, status) => axios.put(`/admin/orders/${id}/status`, { status });
export const processCancelRequest = (id, action, customRefundAmount) => axios.put(`/admin/orders/${id}/cancel`, { action, customRefundAmount });
export const pushOrderToShiprocket = (id) => axios.post(`/admin/orders/${id}/shiprocket/push`);
export const generateOrderAWB = (id, courierId) => axios.post(`/admin/orders/${id}/shiprocket/awb`, { courierId });
export const downloadAdminOrderInvoice = (id) => axios.get(`/store/orders/${id}/invoice`, { responseType: 'blob' });
export const getShiprocketOrderDetails = (id) => axios.get(`/admin/orders/${id}/shiprocket/details`);
export const getPendingCounts = () => axios.get('/admin/pending-counts');
export const getAdminProducts = () => axios.get('/admin/products');
export const createAdminProduct = (data) => axios.post('/admin/products', data);
export const updateAdminProduct = (id, data) => axios.put(`/admin/products/${id}`, data);
export const deleteAdminProduct = (id) => axios.delete(`/admin/products/${id}`);
export const getAdminSettings = () => axios.get('/admin/settings');
export const updateAdminSettings = (settings) => axios.put('/admin/settings', settings);


export const getAdminTransactions = () => axios.get('/admin/transactions');

// Coupons
export const getAdminCoupons = () => axios.get('/admin/coupons');
export const createAdminCoupon = (data) => axios.post('/admin/coupons', data);
export const updateAdminCoupon = (id, data) => axios.put(`/admin/coupons/${id}`, data);
export const deleteAdminCoupon = (id) => axios.delete(`/admin/coupons/${id}`);

export const sendBroadcast = (data) => axios.post('/admin/broadcast', data);

// Banners
export const getAdminBanners = () => axios.get('/admin/banners');
export const createAdminBanner = (data) => axios.post('/admin/banners', data);
export const updateAdminBanner = (id, data) => axios.put(`/admin/banners/${id}`, data);
export const deleteAdminBanner = (id) => axios.delete(`/admin/banners/${id}`);

// Audit Logs
export const getAdminAuditLogs = (limit = 50) => axios.get(`/admin/audit-logs?limit=${limit}`);
export const deleteAdminAuditLog = (id) => axios.delete(`/admin/audit-logs/${id}`);

// Sessions, Poojas, Reports, Calls
export const getAdminSessions = () => axios.get('/admin/sessions');
export const deleteAdminSession = (id) => axios.delete(`/admin/sessions/${id}`);
export const bulkDeleteAdminSessions = (data) => axios.post('/admin/sessions/bulk-delete', data);
export const getAdminPoojas = () => axios.get('/admin/poojas');
export const getAdminReports = () => axios.get('/admin/reports');
export const getAdminCalls = () => axios.get('/admin/calls');
export const deleteAdminCall = (id) => axios.delete(`/admin/calls/${id}`);
export const getAdminCallAnalytics = () => axios.get('/admin/calls/analytics');
export const getAstrologerPayouts = () => axios.get('/admin/astrologer-payouts');
export const processAstrologerPayout = (id, data) => axios.post(`/admin/astrologer-payouts/${id}/process`, data);
