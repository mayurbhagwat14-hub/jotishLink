import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminApis from '../../api/adminApis';

export const adminLoginThunk = createAsyncThunk(
  'adminAuth/adminLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await adminApis.adminLogin(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const adminChangePasswordThunk = createAsyncThunk(
  'adminAuth/adminChangePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await adminApis.adminChangePassword(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const adminDeleteAccountThunk = createAsyncThunk(
  'adminAuth/adminDeleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApis.adminDeleteAccount();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    adminLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      if (action.payload.refreshToken) {
        localStorage.setItem('adminRefreshToken', action.payload.refreshToken);
      }
    },
    adminLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('adminRefreshToken');
    },
    updateAdmin: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLoginThunk.fulfilled, (state, action) => {
        const data = action.payload?.data || action.payload;
        state.user = data.user;
        state.token = data.accessToken;
        if (data.refreshToken) localStorage.setItem('adminRefreshToken', data.refreshToken);
        state.isAuthenticated = true;
      })
      .addCase(adminDeleteAccountThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('adminRefreshToken');
      });
  }
});

export const { adminLogin, adminLogout, updateAdmin } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;
