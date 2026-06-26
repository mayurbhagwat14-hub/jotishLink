import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [
    { id: '1', title: 'Welcome to the App', message: 'Get 5 minutes free chat with our top astrologers!', time: '1 hour ago', read: false },
    { id: '2', title: 'Wallet Balance Low', message: 'Please recharge your wallet to avoid call interruptions.', time: '2 hours ago', read: true },
  ],
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    markAsRead: (state, action) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) notif.read = true;
    },
    clearNotifications: (state) => {
      state.notifications = [];
    }
  }
});

export const { markAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
