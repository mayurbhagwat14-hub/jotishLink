import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rooms: {},
  activeChat: null,
  messages: [],
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
    },
    sendMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    }
  }
});

export const { setActiveChat, sendMessage, setMessages } = chatSlice.actions;
export default chatSlice.reducer;
