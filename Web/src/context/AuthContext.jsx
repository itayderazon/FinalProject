// ====================
// src/context/AuthContext.jsx - FIXED Authentication Context
// ====================
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService';

// Create the context
const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { 
        ...state, 
        user: action.payload, 
        loading: false, 
        error: null,
        isAuthenticated: true 
      };
    case 'AUTH_ERROR':
      return { 
        ...state, 
        user: null, 
        loading: false, 
        error: action.payload,
        isAuthenticated: false 
      };
    case 'LOGOUT':
      return { 
        user: null, 
        loading: false, 
        error: null,
        isAuthenticated: false 
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token is still valid
      authService.validateToken()
        .then(user => {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        })
        .catch((error) => {
          console.log('Token validation failed:', error);
          // Only remove token and logout if it's actually expired/invalid
          // Don't logout on network errors
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            dispatch({ type: 'AUTH_ERROR', payload: 'Session expired' });
          } else {
            // Keep user logged in if it's just a network issue
            // but set loading to false
            dispatch({ type: 'AUTH_ERROR', payload: null });
          }
        });
    } else {
      dispatch({ type: 'AUTH_ERROR', payload: null });
    }
  }, []);

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      const { user, token } = await authService.login(email, password);
      localStorage.setItem('token', token);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      await authService.register(userData);
      return { success: true };
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};