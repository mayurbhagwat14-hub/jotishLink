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
  loading: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
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
      })
      .addCase(fetchPublicSettingsThunk.rejected, (state) => {
        state.loading = false;
      });
  }
});

export default settingsSlice.reducer;
