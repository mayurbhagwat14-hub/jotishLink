import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userApis from '../../api/userApis';

export const fetchAstrologersThunk = createAsyncThunk(
  'user/fetchAstrologers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await userApis.getAstrologers(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  astrologers: [],
  bannerMessage: 'Will I have love or arranged marriage?',
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateAstrologerStatus: (state, action) => {
      const { astrologerId, status } = action.payload;
      const index = state.astrologers.findIndex(a => a._id === astrologerId);
      if (index !== -1) {
        state.astrologers[index].onlineStatus = status;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAstrologersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAstrologersThunk.fulfilled, (state, action) => {
        state.loading = false;
        // ApiResponse: { data: { astrologers: [...] } }
        const astrologers = action.payload?.data?.astrologers || action.payload?.astrologers || action.payload;
        const settings = action.payload?.data?.settings || action.payload?.settings;
        
        if (Array.isArray(astrologers)) {
          state.astrologers = astrologers;
        } else {
          state.astrologers = [];
        }
        
        if (settings && settings.astrologerBannerMessage) {
          state.bannerMessage = settings.astrologerBannerMessage;
        }
      })
      .addCase(fetchAstrologersThunk.rejected, (state, action) => {
        state.loading = false;
        // Maintain fallback data, but log/save error if needed
        state.error = action.payload;
      });
  }
});

export const { updateAstrologerStatus } = userSlice.actions;
export default userSlice.reducer;
