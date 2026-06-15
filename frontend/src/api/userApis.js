import axios from './axios';

export const loginOrSignup = (data) => axios.post('/user/auth/login-signup', data);
export const requestOtp = (phoneNumber) => axios.post('/user/auth/request-otp', { phoneNumber });
export const verifyOtp = (phoneNumber, otp) => axios.post('/user/auth/verify-otp', { phoneNumber, otp });
export const register = (data) => axios.post('/user/auth/register', data).catch(err => {
    if (err.response?.status === 404) {
        return axios.put('/user/profile', data);
    }
    throw err;
});
export const login = (phoneNumber, otp) => axios.post('/user/auth/login', { phoneNumber, otp }).catch(err => {
    if (err.response?.status === 404) {
        return axios.post('/user/auth/verify-otp', { phoneNumber, otp });
    }
    throw err;
});
export const changePassword = (data) => axios.post('/user/auth/change-password', data);
export const deleteAccount = () => axios.delete('/user/profile/delete');
export const getUserHomeData = () => axios.get('/user/homepage-data');
export const updateFcmToken = (fcmToken) => axios.put('/user/fcm-token', { fcmToken });
export const getUserProfile = () => axios.get('/user/profile');
export const updateUserProfile = (data) => axios.put('/user/profile', data);
export const getUserWallet = () => axios.get('/user/wallet');
export const getAstrologers = (params) => axios.get('/astrologers', { params });
export const getAstrologerById = (id) => axios.get(`/astrologers/${id}`);
export const getAstrologerRatings = (id) => axios.get(`/astrologers/${id}/ratings`);
export const getStoreProducts = (params) => axios.get('/products', { params });
export const getProductById = (id) => axios.get(`/products/${id}`);
export const getStorePandits = () => axios.get('/pandits');
export const bookPooja = (data) => axios.post('/pooja/book', data);
export const getUserPoojas = () => axios.get('/user/poojas');
export const getUserPoojaById = (id) => axios.get(`/user/poojas/${id}`);
export const getUserSessions = () => axios.get(`/user/sessions?t=${Date.now()}`);
export const getUserCalls = () => axios.get(`/calls/history?t=${Date.now()}`);
export const deleteUserHistory = (data) => axios.post('/user/history/delete', data);

// Tool APIs
export const getPanchang = () => axios.get('/tools/panchang');
export const getMuhurat = () => axios.get('/tools/muhurat');
export const checkMatchmaking = (data) => axios.post('/tools/matchmaking', data);
export const getHoroscope = (data) => axios.post('/tools/horoscope', data);
export const getKundli = (data) => axios.post('/tools/kundli', data);
