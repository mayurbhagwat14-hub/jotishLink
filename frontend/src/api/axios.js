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
    if (store) {
      const token = store.getState().auth.token;
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
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = res.data.accessToken;
        
        if (store) {
          store.dispatch({ type: 'auth/login', payload: { user: store.getState().auth.user, token: newAccessToken } });
        }
        
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        isRefreshing = false;
        
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        if (store) {
          store.dispatch({ type: 'auth/logout' });
        }
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      toast.error('You are not authorized to perform this action.');
    } else if (error.response?.status >= 500) {
      toast.error('Internal Server Error. Please try again later.');
    } else if (error.message === 'Network Error') {
      toast.error('Network error. Please check your internet connection.');
    }

    return Promise.reject(error);
  }
);

export default instance;

