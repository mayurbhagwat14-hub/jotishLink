import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userApis from '../../api/userApis';
import * as astrologerApis from '../../api/astrologerApis';
import * as adminApis from '../../api/adminApis';

export const fetchUserHomeDataThunk = createAsyncThunk(
  'dashboard/fetchUserHome',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApis.getUserHomeData();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAstrologerDashboardThunk = createAsyncThunk(
  'dashboard/fetchAstrologer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.getAstrologerDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAstrologerAnalyticsThunk = createAsyncThunk(
  'dashboard/fetchAstrologerAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.getAstrologerAnalytics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAdminDashboardThunk = createAsyncThunk(
  'dashboard/fetchAdmin',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApis.getAdminDashboard();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  // User Panel Dashboard
  userHome: {
    services: [],
    celebrities: [],
    blogs: [],
    liveAstrologers: [],
    activeSession: null,
  },

  // Astrologer Panel Dashboard
  astrologerDashboard: {},
  astrologerAnalytics: {},

  // Admin Panel Dashboard
  adminDashboard: {},

  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearAdminDashboard: (state) => {
      state.adminDashboard = {};
    },
    clearAstrologerDashboard: (state) => {
      state.astrologerDashboard = {};
      state.astrologerAnalytics = {};
    }
  },
  extraReducers: (builder) => {
    builder
      // User Home Data
      .addCase(fetchUserHomeDataThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserHomeDataThunk.fulfilled, (state, action) => {
        state.loading = false;
        // ApiResponse shape: { statusCode, data: { user, featuredAstrologers, ... }, message }
        const payload = action.payload?.data || action.payload;
        if (payload) {
          state.userHome = { ...state.userHome, ...payload };
        }
      })
      .addCase(fetchUserHomeDataThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Astrologer Dashboard Data
      .addCase(fetchAstrologerDashboardThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologerDashboardThunk.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload;
        if (payload) {
          state.astrologerDashboard = { ...state.astrologerDashboard, ...payload };
        }
      })
      .addCase(fetchAstrologerDashboardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Astrologer Analytics Data
      .addCase(fetchAstrologerAnalyticsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologerAnalyticsThunk.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload;
        if (payload && payload.analytics) {
          state.astrologerAnalytics = payload.analytics;
        }
      })
      .addCase(fetchAstrologerAnalyticsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin Dashboard Data
      .addCase(fetchAdminDashboardThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminDashboardThunk.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload;
        if (payload) {
          state.adminDashboard = { ...state.adminDashboard, ...payload };
        }
      })
      .addCase(fetchAdminDashboardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearAdminDashboard, clearAstrologerDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
