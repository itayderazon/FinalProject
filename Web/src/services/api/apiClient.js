/**
 * API Client
 * Centralized HTTP client with interceptors and error handling
 */

import axios from 'axios';
import { API_ENDPOINTS, HTTP_STATUS, REQUEST_CONFIG, STORAGE_KEYS } from '../../constants/api';

// Create axios instance
const apiClient = axios.create({
  timeout: REQUEST_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
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
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 unauthorized errors
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          const response = await axios.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API responses
export const handleApiResponse = (response) => {
  return response.data;
};

// Helper function to handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        throw new Error(data.error || 'Invalid request');
      case HTTP_STATUS.UNAUTHORIZED:
        throw new Error('Authentication failed');
      case HTTP_STATUS.FORBIDDEN:
        throw new Error('Access denied');
      case HTTP_STATUS.NOT_FOUND:
        throw new Error('Resource not found');
      case HTTP_STATUS.CONFLICT:
        throw new Error(data.error || 'Conflict occurred');
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        throw new Error('Server error. Please try again later.');
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        throw new Error('Service temporarily unavailable');
      default:
        throw new Error(data.error || 'An unexpected error occurred');
    }
  } else if (error.request) {
    // Network error
    throw new Error('Network error. Please check your connection.');
  } else {
    // Other error
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

export default apiClient;