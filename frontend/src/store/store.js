import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
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
import cartReducer from './slices/cartSlice';

// Custom localStorage adapter — avoids Vite ESM compatibility issues with redux-persist's storage module
const storage = {
  getItem: (key) => Promise.resolve(localStorage.getItem(key)),
  setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
};

// Persist only auth slice (token + user + isAuthenticated) across page reloads
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['user', 'token', 'isAuthenticated'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: userReducer,
    astrologer: astrologerReducer,
    admin: adminReducer,
    wallet: walletReducer,
    chat: chatReducer,
    call: callReducer,
    payment: paymentReducer,
    notification: notificationReducer,
    dashboard: dashboardReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Suppress redux-persist internal action warnings
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
