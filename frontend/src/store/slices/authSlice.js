import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userApis from '../../api/userApis';
import axios from '../../api/axios';

// User Auth Thunks
export const verifyOtpThunk = createAsyncThunk(
  'auth/verifyOtp',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await userApis.verifyOtp(credentials.phoneNumber, credentials.otp);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const refreshAccessTokenThunk = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshTokenStr = localStorage.getItem('refreshToken');
      const response = await axios.post('/auth/refresh', { refreshToken: refreshTokenStr });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logoutUserThunk = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Optional: Hit a backend logout if it exists. 
      // For now we just resolve to clear frontend state.
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
export const userLoginOrSignupThunk = createAsyncThunk(
  'auth/userLoginOrSignup',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await userApis.loginOrSignup(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const userChangePasswordThunk = createAsyncThunk(
  'auth/userChangePassword',
  async (data, { rejectWithValue }) => {
    try {
      const response = await userApis.changePassword(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const userDeleteAccountThunk = createAsyncThunk(
  'auth/userDeleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApis.deleteAccount();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



export const fetchProfileThunk = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApis.getUserProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userApis.updateUserProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const registerUserThunk = createAsyncThunk(
  'auth/registerUser',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await userApis.register(profileData);
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
  settings: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      if (action.payload.refreshToken) {
        localStorage.setItem('refreshToken', action.payload.refreshToken);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('persist:auth_user');
      localStorage.removeItem('userDetailsApplyData');
      localStorage.removeItem('astrologerApplyData');
      sessionStorage.removeItem('loginPhone');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    addWalletCash: (state, action) => {
      if (state.user) state.user.wallet = (state.user.wallet || 0) + action.payload;
    },
    deductWalletCash: (state, action) => {
      if (state.user) state.user.wallet = Math.max(0, (state.user.wallet || 0) - action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        // API response wrapped in { data: { user } }
        const u = action.payload?.data?.user || action.payload?.user || action.payload;
        const settings = action.payload?.data?.settings || action.payload?.settings;
        state.user = { ...state.user, ...u };
        if (settings) state.settings = settings;
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        const u = action.payload?.data?.user || action.payload?.user || action.payload;
        state.user = { ...state.user, ...u };
      })
      .addCase(registerUserThunk.fulfilled, (state, action) => {
        const data = action.payload?.data || action.payload;
        state.user = data.user || state.user;
        state.token = data.accessToken || state.token;
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) state.isAuthenticated = true;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        const data = action.payload?.data || action.payload;
        state.user = data.user || state.user;
        state.token = data.accessToken || state.token;
        if (data.settings) state.settings = data.settings;
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) state.isAuthenticated = true;
      })
      .addCase(refreshAccessTokenThunk.fulfilled, (state, action) => {
        const data = action.payload?.data || action.payload;
        state.token = data.accessToken || state.token;
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (state.user) state.isAuthenticated = true;
      })
      .addCase(logoutUserThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('persist:auth_user');
        sessionStorage.removeItem('loginPhone');
      })
      .addCase(userDeleteAccountThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('loginPhone');
      });  }
});

export const { login, logout, updateUser, addWalletCash, deductWalletCash } = authSlice.actions;
export default authSlice.reducer;
