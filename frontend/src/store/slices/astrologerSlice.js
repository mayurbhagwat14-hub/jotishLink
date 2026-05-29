import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as astrologerApis from '../../api/astrologerApis';

export const fetchAstrologerProfileThunk = createAsyncThunk(
  'astrologer/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.getAstrologerProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateAstrologerProfileThunk = createAsyncThunk(
  'astrologer/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.updateAstrologerProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  profile: {
    _id: 'astro1',
    name: 'Sanjay Sharma',
    speciality: ['Vedic', 'Vastu', 'Kundli'],
    experience: 15,
    rating: 4.9,
    avatar: 'https://i.pravatar.cc/150?u=pandit1',
    pricing: { chat: 85, audioCall: 85, videoCall: 100 }
  },
  loading: false,
  error: null,
};

const astrologerSlice = createSlice({
  name: 'astrologer',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAstrologerProfileThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologerProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchAstrologerProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAstrologerProfileThunk.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  }
});

export default astrologerSlice.reducer;
