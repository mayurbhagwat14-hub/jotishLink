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

const initialState = {
  users: [
    { id: 1, name: 'Ankita Verma', phone: '+91 98765 43210', email: 'ankita@gmail.com', wallet: 450, sessions: 12, status: 'Active', joined: 'Jan 15, 2026', avatar: 'A', lastActive: '2 hours ago', totalSpent: 3450 },
    { id: 2, name: 'Rahul Khanna', phone: '+91 91234 56789', email: 'rahul.k@gmail.com', wallet: 1200, sessions: 34, status: 'Active', joined: 'Feb 02, 2026', avatar: 'R', lastActive: '5 min ago', totalSpent: 12800 },
    { id: 3, name: 'Simran Kaur', phone: '+91 99887 76655', email: 'simran.k@gmail.com', wallet: 50, sessions: 3, status: 'Banned', joined: 'Mar 10, 2026', avatar: 'S', lastActive: '30 days ago', totalSpent: 500 },
    { id: 4, name: 'Vikram Singh', phone: '+91 88776 55443', email: 'vikram.s@gmail.com', wallet: 3200, sessions: 78, status: 'Active', joined: 'Dec 05, 2025', avatar: 'V', lastActive: '1 hour ago', totalSpent: 45200 },
    { id: 5, name: 'Priya Mehta', phone: '+91 77665 54432', email: 'priya.m@gmail.com', wallet: 0, sessions: 1, status: 'Active', joined: 'May 20, 2026', avatar: 'P', lastActive: 'Just now', totalSpent: 100 },
    { id: 6, name: 'Karan Desai', phone: '+91 66554 43321', email: 'karan.d@gmail.com', wallet: 800, sessions: 22, status: 'Active', joined: 'Apr 15, 2026', avatar: 'K', lastActive: '3 hours ago', totalSpent: 8900 },
    { id: 7, name: 'Neha Gupta', phone: '+91 55443 32210', email: 'neha.g@gmail.com', wallet: 150, sessions: 8, status: 'Active', joined: 'Jan 28, 2026', avatar: 'N', lastActive: '1 day ago', totalSpent: 2300 },
    { id: 8, name: 'Arjun Mishra', phone: '+91 44332 21109', email: 'arjun.m@gmail.com', wallet: 2500, sessions: 45, status: 'Active', joined: 'Nov 10, 2025', avatar: 'A', lastActive: '30 min ago', totalSpent: 28500 },
    { id: 9, name: 'Divya Sharma', phone: '+91 33221 10098', email: 'divya.s@gmail.com', wallet: 0, sessions: 0, status: 'Banned', joined: 'May 25, 2026', avatar: 'D', lastActive: '45 days ago', totalSpent: 0 },
    { id: 10, name: 'Rohit Patel', phone: '+91 22110 99887', email: 'rohit.p@gmail.com', wallet: 600, sessions: 15, status: 'Active', joined: 'Mar 05, 2026', avatar: 'R', lastActive: '6 hours ago', totalSpent: 5600 },
  ],
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
        if (action.payload && action.payload.length > 0) {
          state.users = action.payload;
        }
      })
      .addCase(fetchAdminUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAdminUserStatusThunk.fulfilled, (state, action) => {
        const user = state.users.find(u => u.id === action.payload.id);
        if (user) {
          user.status = action.payload.status;
        }
      });
  }
});

export const { localBanUser, localUnbanUser } = adminSlice.actions;
export default adminSlice.reducer;
