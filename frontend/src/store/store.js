import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import astrologerReducer from './slices/astrologerSlice';
import adminReducer from './slices/adminSlice';
import walletReducer from './slices/walletSlice';
import chatReducer from './slices/chatSlice';
import callReducer from './slices/callSlice';
import paymentReducer from './slices/paymentSlice';
import notificationReducer from './slices/notificationSlice';
import dashboardReducer from './slices/dashboardSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    astrologer: astrologerReducer,
    admin: adminReducer,
    wallet: walletReducer,
    chat: chatReducer,
    call: callReducer,
    payment: paymentReducer,
    notification: notificationReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
