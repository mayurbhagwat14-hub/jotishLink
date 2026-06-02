import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userApis from '../../api/userApis';

const initialState = {
  transactions: [],
  loading: false,
  error: null,
};

export const fetchWalletThunk = createAsyncThunk(
  'wallet/fetchWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApis.getUserWallet();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWalletThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWalletThunk.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data || action.payload;
        if (data.transactions) {
          state.transactions = data.transactions;
        }
      })
      .addCase(fetchWalletThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { addTransaction } = walletSlice.actions;

export default walletSlice.reducer;
