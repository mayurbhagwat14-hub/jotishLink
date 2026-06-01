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
  astrologers: [],
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
        // ApiResponse: { data: { astrologers: [...] } }
        const astrologers = action.payload?.data?.astrologers || action.payload?.astrologers || action.payload;
        if (Array.isArray(astrologers)) {
          state.astrologers = astrologers;
        } else {
          state.astrologers = [];
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
