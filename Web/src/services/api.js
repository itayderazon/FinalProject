import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on a public page
      // and if the token is actually invalid (not just a network issue)
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/register', '/'];
      
      if (!publicPaths.includes(currentPath)) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (!error.response) {
      // Network error - don't log out user
      console.log('Network error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;