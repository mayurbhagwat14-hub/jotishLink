import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  transactions: [
    { id: 'TXN-902', type: 'Call Deducted', amount: -250, date: 'May 28, 2026 • 2:30 PM', desc: 'Call with Shivika' },
    { id: 'TXN-901', type: 'Wallet Recharged', amount: 500, date: 'May 27, 2026 • 11:15 AM', desc: 'UPI Payment' },
    { id: 'TXN-900', type: 'Chat Deducted', amount: -100, date: 'May 25, 2026 • 6:45 PM', desc: 'Chat with Vinay' },
  ],
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    }
  }
});

export const { addTransaction } = walletSlice.actions;
export default walletSlice.reducer;
