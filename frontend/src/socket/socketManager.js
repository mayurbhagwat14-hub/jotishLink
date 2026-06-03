import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('accessToken');
  
  if (!socket || !socket.connected) {
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socket.on('connect', () => console.log('[Socket] Connected:', socket.id));
    socket.on('connect_error', (e) => console.error('[Socket] Error:', e.message));
  }
  return socket;
};

export const resetSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
