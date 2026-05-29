import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as userApis from '../../api/userApis';
import * as astrologerApis from '../../api/astrologerApis';
import * as adminApis from '../../api/adminApis';

// User Auth Thunks
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

// Astrologer Auth Thunks
export const astrologerLoginThunk = createAsyncThunk(
  'auth/astrologerLogin',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.astrologerLogin(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const astrologerSignupThunk = createAsyncThunk(
  'auth/astrologerSignup',
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
  'auth/astrologerChangePassword',
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
  'auth/astrologerDeleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.astrologerDeleteAccount();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Admin Auth Thunks
export const adminLoginThunk = createAsyncThunk(
  'auth/adminLogin',
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
  'auth/adminChangePassword',
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
  'auth/adminDeleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApis.adminDeleteAccount();
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

const initialState = {
  user: {
    name: 'Guest User',
    role: 'user',
    wallet: 150,
    avatar: '',
    phone: '+91 9876543210',
    email: 'guest@jyotishlink.com'
  },
  token: 'guest-token',
  isAuthenticated: true,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = { name: 'Guest User', role: 'user', wallet: 150 };
      state.token = 'guest-token';
      state.isAuthenticated = true;
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    addWalletCash: (state, action) => {
      state.user.wallet = (state.user.wallet || 0) + action.payload;
    },
    deductWalletCash: (state, action) => {
      state.user.wallet = Math.max(0, (state.user.wallet || 0) - action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(userLoginOrSignupThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(astrologerLoginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(adminLoginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(userDeleteAccountThunk.fulfilled, (state) => {
        state.user = { name: 'Guest User', role: 'user', wallet: 150 };
        state.token = 'guest-token';
        state.isAuthenticated = true;
      })
      .addCase(astrologerDeleteAccountThunk.fulfilled, (state) => {
        state.user = { name: 'Guest User', role: 'user', wallet: 150 };
        state.token = 'guest-token';
        state.isAuthenticated = true;
      })
      .addCase(adminDeleteAccountThunk.fulfilled, (state) => {
        state.user = { name: 'Guest User', role: 'user', wallet: 150 };
        state.token = 'guest-token';
        state.isAuthenticated = true;
      });
  }
});

export const { login, logout, updateUser, addWalletCash, deductWalletCash } = authSlice.actions;
export default authSlice.reducer;
