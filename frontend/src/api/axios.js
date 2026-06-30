import axios from 'axios';
import toast from 'react-hot-toast';

let store;

export const injectStore = (_store) => {
  store = _store;
};

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    // Prevent caching for all requests
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';

    if (store) {
      const state = store.getState();
      let token = state.auth.token; // default to user token
      
      // Determine context based on the current window path
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        token = state.adminAuth?.token;
      } else if (currentPath.startsWith('/astrologer')) {
        token = state.astrologerAuth?.token;
      } else {
        token = state.auth?.token;
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token;
          return instance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 [Axios] Token expired. Attempting to refresh token...');
        
        // Determine which refresh token to use based on the current window path
        let tokenKey = 'refreshToken'; // default user
        let actionType = 'auth/login';
        
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin')) {
          tokenKey = 'adminRefreshToken';
          actionType = 'adminAuth/adminLogin';
        } else if (currentPath.startsWith('/astrologer')) {
          tokenKey = 'astrologerRefreshToken';
          actionType = 'astrologerAuth/astrologerLogin';
        }

        let roleStr = 'user';
        if (tokenKey === 'adminRefreshToken') roleStr = 'admin';
        else if (tokenKey === 'astrologerRefreshToken') roleStr = 'astrologer';

        const refreshTokenStr = localStorage.getItem(tokenKey);
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken: refreshTokenStr, role: roleStr },
          { withCredentials: true }
        );
        const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
        
        if (newRefreshToken) {
          localStorage.setItem(tokenKey, newRefreshToken);
        }
        
        if (store) {
          let userToKeep;
          if (tokenKey === 'adminRefreshToken') userToKeep = store.getState().adminAuth?.user;
          else if (tokenKey === 'astrologerRefreshToken') userToKeep = store.getState().astrologerAuth?.user;
          else userToKeep = store.getState().auth?.user;
          
          store.dispatch({ type: actionType, payload: { user: userToKeep, token: newAccessToken } });
        }
        
        console.log('✅ [Axios] Token refreshed successfully! Retrying failed requests.');
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        isRefreshing = false;
        
        return instance(originalRequest);
      } catch (refreshError) {
        console.error('❌ [Axios] Token refresh failed:', refreshError.message);
        processQueue(refreshError, null);
        isRefreshing = false;
        
        let wasAuthenticated = false;
        if (store) {
          const state = store.getState();
          const currentPath = window.location.pathname;
          
          if (currentPath.startsWith('/admin')) wasAuthenticated = state.adminAuth?.isAuthenticated;
          else if (currentPath.startsWith('/astrologer')) wasAuthenticated = state.astrologerAuth?.isAuthenticated;
          else wasAuthenticated = state.auth?.isAuthenticated;

          if (currentPath.startsWith('/admin')) store.dispatch({ type: 'adminAuth/adminLogout' });
          else if (currentPath.startsWith('/astrologer')) store.dispatch({ type: 'astrologerAuth/astrologerLogout' });
          else store.dispatch({ type: 'auth/logout' });
        }
        
        if (wasAuthenticated) {
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      // Only show 403 errors if the user is authenticated, to prevent random popups for guests
      let isAuthenticated = false;
      if (store) {
        const state = store.getState();
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/admin')) isAuthenticated = state.adminAuth?.isAuthenticated;
        else if (currentPath.startsWith('/astrologer')) isAuthenticated = state.astrologerAuth?.isAuthenticated;
        else isAuthenticated = state.auth?.isAuthenticated;
      }
      if (isAuthenticated) {
        toast.error(error.response?.data?.message || 'You are not authorized to perform this action.');
      }
    } else if (error.response?.status === 400 && error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.response?.status >= 500) {
      toast.error('Internal Server Error. Please try again later.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your internet connection.');
    }

    return Promise.reject(error);
  }
);

export default instance;

