import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as astrologerApis from '../../api/astrologerApis';

export const astrologerLoginThunk = createAsyncThunk(
  'astrologerAuth/astrologerLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.astrologerLogin(credentials);
      return response.data;
    } catch (error) {
      const payload = typeof error.response?.data === 'object' ? error.response.data : { message: error.response?.data || error.message };
      return rejectWithValue({ ...payload, status: error.response?.status });
    }
  }
);

export const astrologerSignupThunk = createAsyncThunk(
  'astrologerAuth/astrologerSignup',
  async (data, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.astrologerSignup(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const astrologerChangePasswordThunk = createAsyncThunk(
  'astrologerAuth/astrologerChangePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.astrologerChangePassword(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const astrologerDeleteAccountThunk = createAsyncThunk(
  'astrologerAuth/astrologerDeleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.astrologerDeleteAccount();
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

const astrologerAuthSlice = createSlice({
  name: 'astrologerAuth',
  initialState,
  reducers: {
    astrologerLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      if (action.payload.refreshToken) {
        localStorage.setItem('astrologerRefreshToken', action.payload.refreshToken);
      }
    },
    astrologerLogout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('astrologerRefreshToken');
    },
    updateAstrologer: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(astrologerLoginThunk.fulfilled, (state, action) => {
        const data = action.payload?.data || action.payload;
        state.user = data.user;
        state.token = data.accessToken;
        if (data.refreshToken) localStorage.setItem('astrologerRefreshToken', data.refreshToken);
        state.isAuthenticated = true;
      })
      .addCase(astrologerDeleteAccountThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('astrologerRefreshToken');
      });
  }
});

export const { astrologerLogin, astrologerLogout, updateAstrologer } = astrologerAuthSlice.actions;
export default astrologerAuthSlice.reducer;
