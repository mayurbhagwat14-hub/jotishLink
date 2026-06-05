import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as astrologerApis from '../../api/astrologerApis';

export const fetchAstrologerProfileThunk = createAsyncThunk(
  'astrologer/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.getAstrologerProfile();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateAstrologerProfileThunk = createAsyncThunk(
  'astrologer/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.updateAstrologerProfile(profileData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAstrologerEarningsThunk = createAsyncThunk(
  'astrologer/fetchEarnings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.getAstrologerEarnings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const requestWithdrawalThunk = createAsyncThunk(
  'astrologer/requestWithdrawal',
  async (amount, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.requestWithdrawal(amount);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateAstrologerOnlineStatusThunk = createAsyncThunk(
  'astrologer/updateStatus',
  async (status, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.updateAstrologerOnlineStatus(status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAstrologerPoojaRequestsThunk = createAsyncThunk(
  'astrologer/fetchPoojaRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.getAstrologerPoojaRequests();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updatePoojaStatusThunk = createAsyncThunk(
  'astrologer/updatePoojaStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.updatePoojaStatus(id, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchAstrologerHistoryThunk = createAsyncThunk(
  'astrologer/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await astrologerApis.getAstrologerHistory();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  profile: null,
  earnings: { earnings: [], total: 0 },
  poojaRequests: [],
  history: [], // For the history page
  incomingRequests: [], // Chat/Call requests from Socket
  activeSessions: [],   // Currently active chats/calls
  loading: false,
  error: null,
};

const astrologerSlice = createSlice({
  name: 'astrologer',
  initialState,
  reducers: {
    addIncomingRequest: (state, action) => {
      // Avoid duplicates
      const exists = state.incomingRequests.find(r => r.roomId === action.payload.roomId);
      if (!exists) {
        state.incomingRequests.push(action.payload);
      }
    },
    removeIncomingRequest: (state, action) => {
      state.incomingRequests = state.incomingRequests.filter(r => r.roomId !== action.payload);
    },
    removeIncomingRequestByUserId: (state, action) => {
      state.incomingRequests = state.incomingRequests.filter(r => r.userId !== action.payload);
    },
    addActiveSession: (state, action) => {
      // Add or update active session
      const index = state.activeSessions.findIndex(s => s.roomId === action.payload.roomId);
      if (index >= 0) {
        state.activeSessions[index] = { ...state.activeSessions[index], ...action.payload };
      } else {
        state.activeSessions.push(action.payload);
      }
    },
    removeActiveSession: (state, action) => {
      state.activeSessions = state.activeSessions.filter(s => s.roomId !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAstrologerProfileThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologerProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload?.data || action.payload;
      })
      .addCase(fetchAstrologerProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAstrologerProfileThunk.fulfilled, (state, action) => {
        state.profile = action.payload?.data || action.payload;
      })
      .addCase(fetchAstrologerEarningsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologerEarningsThunk.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload?.data || action.payload;
        state.earnings = payload;
      })
      .addCase(fetchAstrologerEarningsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAstrologerOnlineStatusThunk.fulfilled, (state, action) => {
        if (state.profile && state.profile.astrologer) {
          state.profile.astrologer.onlineStatus = action.payload?.data?.onlineStatus || action.payload?.onlineStatus;
        }
      })
      .addCase(fetchAstrologerPoojaRequestsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologerPoojaRequestsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.poojaRequests = action.payload?.data?.bookings || [];
      })
      .addCase(fetchAstrologerPoojaRequestsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePoojaStatusThunk.fulfilled, (state, action) => {
        const updatedBooking = action.payload?.data?.booking;
        if (updatedBooking) {
          state.poojaRequests = state.poojaRequests.map((req) => 
            req._id === updatedBooking._id ? updatedBooking : req
          );
        }
      })
      .addCase(fetchAstrologerHistoryThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAstrologerHistoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload?.data?.history || [];
      })
      .addCase(fetchAstrologerHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { addIncomingRequest, removeIncomingRequest, removeIncomingRequestByUserId, addActiveSession, removeActiveSession } = astrologerSlice.actions;

export default astrologerSlice.reducer;
