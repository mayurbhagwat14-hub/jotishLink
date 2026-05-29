import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userApis from '../../api/userApis';

export const fetchAstrologersThunk = createAsyncThunk(
  'user/fetchAstrologers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApis.getAstrologers();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  astrologers: [
    { _id: '1', name: 'Shivika', skills: ['Numerology', 'Tarot'], experience: 9, videoPrice: 50, rate: 50, pricing: { chat: 50, audioCall: 50 }, rating: 5, orders: '5k+', isVerified: true, avatar: 'https://i.pravatar.cc/150?u=shivika' },
    { _id: '2', name: 'Vinay', skills: ['Vedic', 'Vastu'], experience: 6, videoPrice: 100, rate: 100, pricing: { chat: 100, audioCall: 100 }, rating: 5, orders: '50k+', isVerified: true, avatar: 'https://i.pravatar.cc/150?u=vinay' },
    { _id: '3', name: 'Bruti', skills: ['Face Reading', 'Psychic'], experience: 5, videoPrice: 40, rate: 40, pricing: { chat: 40, audioCall: 40 }, rating: 4.8, orders: '10k+', isVerified: true, avatar: 'https://i.pravatar.cc/150?u=bruti' },
    { _id: '4', name: 'Ashirvaas', skills: ['Palmistry', 'Vedic'], experience: 12, videoPrice: 80, rate: 80, pricing: { chat: 80, audioCall: 80 }, rating: 4.9, orders: '15k+', isVerified: true, avatar: 'https://i.pravatar.cc/150?u=ashirvaas' },
  ],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAstrologersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAstrologersThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          state.astrologers = action.payload;
        }
      })
      .addCase(fetchAstrologersThunk.rejected, (state, action) => {
        state.loading = false;
        // Maintain fallback data, but log/save error if needed
        state.error = action.payload;
      });
  }
});

export default userSlice.reducer;
