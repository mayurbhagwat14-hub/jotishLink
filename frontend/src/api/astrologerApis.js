import axios from './axios';

export const astrologerLogin = (data) => axios.post('/astrologer/auth/login', data);
export const astrologerSignup = (data) => axios.post('/astrologer/auth/signup', data);
export const astrologerChangePassword = (data) => axios.post('/astrologer/auth/change-password', data);
export const astrologerDeleteAccount = () => axios.delete('/astrologer/profile');
export const getAstrologerDashboard = () => axios.get('/astrologer/dashboard');
export const getAstrologerProfile = () => axios.get('/astrologer/profile');
export const updateAstrologerProfile = (data) => axios.put('/astrologer/profile', data);
export const getAstrologerEarnings = () => axios.get('/astrologer/earnings');
export const getAstrologerPoojaRequests = () => axios.get('/astrologer/pooja-requests');
export const getAstrologerChats = () => axios.get('/astrologer/chats');
export const getAstrologerCalls = () => axios.get('/astrologer/calls');
