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
export const getUserProfile = () => axios.get('/user/profile');
export const updateUserProfile = (data) => axios.put('/user/profile', data);
export const getAstrologers = () => axios.get('/astrologers');
export const getStoreProducts = () => axios.get('/products');
export const getProductById = (id) => axios.get(`/products/${id}`);
export const getStorePandits = () => axios.get('/pandits');
export const bookPooja = (data) => axios.post('/pooja/book', data);
export const getUserPoojas = () => axios.get('/user/poojas');
export const getUserSessions = () => axios.get('/user/sessions');

// Tool APIs
export const getPanchang = () => axios.get('/tools/panchang');
export const getMuhurat = () => axios.get('/tools/muhurat');
export const checkMatchmaking = (data) => axios.post('/tools/matchmaking', data);
export const getHoroscope = (data) => axios.post('/tools/horoscope', data);
export const getKundli = (data) => axios.post('/tools/kundli', data);
