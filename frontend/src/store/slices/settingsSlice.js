import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchPublicSettingsThunk = createAsyncThunk(
  'settings/fetchPublic',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/settings/public');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  appName: 'JyotishLink',
  appLogo: '',
  tagline: 'Connect with the Stars',
  loading: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettingsFromSave: (state, action) => {
      const data = action.payload;
      if (data.appName !== undefined) state.appName = data.appName;
      if (data.appLogo !== undefined) state.appLogo = data.appLogo;
      if (data.tagline !== undefined) state.tagline = data.tagline;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSettingsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPublicSettingsThunk.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload?.data || action.payload;
        if (data.appName) state.appName = data.appName;
        if (data.appLogo) state.appLogo = data.appLogo;
        if (data.tagline) state.tagline = data.tagline;
      })
      .addCase(fetchPublicSettingsThunk.rejected, (state) => {
        state.loading = false;
      });
  }
});

export const { updateSettingsFromSave } = settingsSlice.actions;
export default settingsSlice.reducer;
