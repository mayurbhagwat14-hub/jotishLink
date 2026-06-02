import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminApis from '../../api/adminApis';

export const fetchAdminUsersThunk = createAsyncThunk(
  'admin/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApis.getAdminUsers();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateAdminUserStatusThunk = createAsyncThunk(
  'admin/updateUserStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await adminApis.updateAdminUserStatus(id, status);
      return { id, status, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deleteAdminUserThunk = createAsyncThunk(
  'admin/deleteUser',
  async (id, { rejectWithValue }) => {
    try {
      await adminApis.deleteAdminUser(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const refundAdminUserThunk = createAsyncThunk(
  'admin/refundUser',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await adminApis.refundUser(id, data);
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);
export const fetchAdminAstrologersThunk = createAsyncThunk(
  'admin/fetchAstrologers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminApis.getAdminAstrologers();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateAdminAstrologerStatusThunk = createAsyncThunk(
  'admin/updateAstrologerStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await adminApis.updateAdminAstrologerStatus(id, status);
      return { id, status, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  users: [],
  astrologers: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    // Local mutations for fast fallback state updates
    localBanUser: (state, action) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) user.status = 'Banned';
    },
    localUnbanUser: (state, action) => {
      const user = state.users.find(u => u.id === action.payload);
      if (user) user.status = 'Active';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        // ApiResponse: { data: { users: [...] } }
        const users = action.payload?.data?.users || action.payload?.users || action.payload;
        if (Array.isArray(users) && users.length > 0) {
          state.users = users;
        }
      })
      .addCase(fetchAdminUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminUserStatusThunk.fulfilled, (state, action) => {
        const user = state.users.find(u => u.id === action.payload.id || u._id === action.payload.id);
        if (user) {
          user.status = action.payload.status;
        }
      })
      .addCase(deleteAdminUserThunk.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u.id !== action.payload && u._id !== action.payload);
      })
      .addCase(refundAdminUserThunk.fulfilled, (state, action) => {
        const user = state.users.find(u => u.id === action.payload.id || u._id === action.payload.id);
        if (user && action.payload.data?.data?.user?.wallet !== undefined) {
          user.wallet = action.payload.data.data.user.wallet;
        }
      })
      .addCase(fetchAdminAstrologersThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminAstrologersThunk.fulfilled, (state, action) => {
        state.loading = false;
        const astrologers = action.payload?.data?.astrologers || action.payload?.astrologers || action.payload;
        if (Array.isArray(astrologers)) {
          state.astrologers = astrologers;
        }
      })
      .addCase(fetchAdminAstrologersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminAstrologerStatusThunk.fulfilled, (state, action) => {
        const astro = state.astrologers.find(a => a.id === action.payload.id || a._id === action.payload.id);
        if (astro) {
          astro.status = action.payload.status;
          if (action.payload.status === 'Approved') astro.isVerified = true;
        }
      });
  }
});

export const { localBanUser, localUnbanUser } = adminSlice.actions;
export default adminSlice.reducer;
