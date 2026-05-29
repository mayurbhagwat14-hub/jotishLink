import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeCall: null,
  callDuration: 0,
  loading: false,
  error: null,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall: (state, action) => {
      state.activeCall = action.payload;
      state.callDuration = 0;
    },
    endCall: (state) => {
      state.activeCall = null;
      state.callDuration = 0;
    },
    tickDuration: (state) => {
      state.callDuration += 1;
    }
  }
});

export const { startCall, endCall, tickDuration } = callSlice.actions;
export default callSlice.reducer;
