import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../utils/authUtils';

export const useLoginForm = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      showNotification('Please fill in all fields', 'error');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      showNotification('Please enter a valid email address', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        showNotification('Welcome back!', 'success');
        navigate('/dashboard');
      } else {
        showNotification(result.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('An unexpected error occurred. Please try again.', 'error');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    // TODO: Implement forgot password functionality
    showNotification('Forgot password feature coming soon!', 'info');
  };

  return {
    formData,
    showPassword,
    loading,
    handleChange,
    handleSubmit,
    togglePasswordVisibility,
    handleForgotPassword
  };
};

// Helper function for email validation
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}; 