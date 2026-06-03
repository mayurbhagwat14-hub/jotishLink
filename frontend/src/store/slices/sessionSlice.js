import { createSlice } from '@reduxjs/toolkit';

const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    pendingRequest: null,     // { astrologer, type, roomId } — user waiting
    activeSession: null,      // { roomId, sessionId, type, astrologer }
    sessionEnded: false,
    endReason: null,
  },
  reducers: {
    setPendingRequest: (state, action) => { state.pendingRequest = action.payload },
    clearPendingRequest: (state) => { state.pendingRequest = null },
    setActiveSession: (state, action) => { state.activeSession = action.payload },
    clearActiveSession: (state) => { state.activeSession = null; state.sessionEnded = false },
    markSessionEnded: (state, action) => { state.sessionEnded = true; state.endReason = action.payload },
  }
});

export const { 
  setPendingRequest, 
  clearPendingRequest, 
  setActiveSession, 
  clearActiveSession, 
  markSessionEnded 
} = sessionSlice.actions;

export default sessionSlice.reducer;
