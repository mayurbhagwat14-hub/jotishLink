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
    services: [
      { name: 'Bracelets', img: '/store_bracelet.png' },
      { name: 'Rudraksha', img: '/store_rudraksha.png' },
      { name: 'Gemstones', img: '/store_gemstone.png' },
    ],
    celebrities: [
      { name: 'Maniesh Bahl', role: 'Bollywood', img: 'https://i.pravatar.cc/150?u=celeb1' },
      { name: 'Sonal Chauhan', role: 'Celebrity', img: 'https://i.pravatar.cc/150?u=celeb2' },
    ],
    blogs: [
      { title: "Top 5 Zodiac Signs Having Ability to Rise...", img: '/blog_ai.png' },
      { title: "Top 5 Zodiac Signs Having Ability to Rise...", img: '/blog_mars.png' },
    ],
    liveAstrologers: [
      { name: 'Ravi Pandit', img: 'https://i.pravatar.cc/150?u=ravi', speciality: 'Vedic' },
      { name: 'Priya Sharma', img: 'https://i.pravatar.cc/150?u=priya', speciality: 'Tarot' },
      { name: 'Arjun Mishra', img: 'https://i.pravatar.cc/150?u=arjun', speciality: 'Numerology' },
    ],
    activeSession: {
      name: 'Ranvit',
      date: '04 Apr 2024',
      avatar: 'https://i.pravatar.cc/150?u=ranvit',
    }
  },

  // Astrologer Panel Dashboard
  astrologerDashboard: {
    todayEarnings: 4250,
    pendingActionCount: 3,
    chatRequest: { name: 'Karan D.', message: 'Karan D. is waiting...' },
    callRequest: { name: 'Priya K.', message: 'Priya K. wants to connect.' },
    upcomingPooja: { name: 'Grah Shanti Pooja', time: 'Tomorrow, 9:00 AM' },
    recentSessions: [
      { user: 'Simran K.', type: 'Audio Call', duration: '10m 45s', earning: 215 },
      { user: 'Neha G.', type: 'Chat', duration: '25m 10s', earning: 375 },
    ]
  },

  // Admin Panel Dashboard
  adminDashboard: {
    metrics: {
      totalRevenue: '₹42.5L',
      registeredUsers: '1,24,500',
      onlineAstrologers: '42 / 150',
      pendingOrders: 5,
      storeRevenue: '₹3.9L'
    },
    liveSessions: [
      { user: 'Rahul K.', astrologer: 'Sanjay Sharma', type: 'Video Call', duration: '05:23', rate: 85 },
      { user: 'Simran D.', astrologer: 'Neeta Joshi', type: 'Chat', duration: '12:45', rate: 25 },
      { user: 'Amit P.', astrologer: 'Ramesh Gupta', type: 'Audio Call', duration: '08:10', rate: 40 },
    ],
    recentOrders: [
      { id: 'ORD-558', user: 'Amit K.', product: 'Rudraksha Mala', amount: 399, status: 'Pending', statusColor: 'orange' },
      { id: 'ORD-557', user: 'Sneha R.', product: 'Yellow Sapphire Ring', amount: 1299, status: 'Shipped', statusColor: 'blue' },
      { id: 'ORD-556', user: 'Vikram S.', product: 'Raw Pyrite Bracelet', amount: 499, status: 'Delivered', statusColor: 'green' },
      { id: 'ORD-555', user: 'Priya M.', product: 'Tiger Eye Bracelet', amount: 349, status: 'Processing', statusColor: 'orange' },
    ],
    quickStats: [
      { label: 'Chats Today', value: '342', change: '+18%', up: true },
      { label: 'Calls Today', value: '89', change: '+5%', up: true },
      { label: 'Pooja Bookings', value: '14', change: '-2', up: false },
      { label: 'Store Orders', value: '27', change: '+8', up: true },
    ],
    recentActivity: [
      { text: 'New user registration', detail: 'Priya Mehta joined the platform', time: '2 min ago', type: 'user' },
      { text: 'New store order received', detail: 'ORD-558 — Rudraksha Mala by Amit K.', time: '5 min ago', type: 'order' },
      { text: 'Astrologer application received', detail: 'Meera Devi applied as Tarot reader', time: '15 min ago', type: 'astro' },
      { text: 'Order delivered successfully', detail: 'ORD-552 — Raw Pyrite Bracelet to Priya M.', time: '1 hour ago', type: 'delivery' },
      { text: 'Refund requested', detail: 'Session refund by Arjun M. — ₹1,950', time: '2 hours ago', type: 'refund' },
    ]
  },

  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // User Home Data
      .addCase(fetchUserHomeDataThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserHomeDataThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.userHome = action.payload;
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
        if (action.payload) {
          state.astrologerDashboard = action.payload;
        }
      })
      .addCase(fetchAstrologerDashboardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Admin Dashboard Data
      .addCase(fetchAdminDashboardThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminDashboardThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.adminDashboard = action.payload;
        }
      })
      .addCase(fetchAdminDashboardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default dashboardSlice.reducer;
