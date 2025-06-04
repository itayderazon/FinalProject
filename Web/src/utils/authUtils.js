// Utility functions for authentication

export const showNotification = (message, type = 'info') => {
  // Simple notification - in real app use react-hot-toast or similar
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password, minLength = 6) => {
  if (!password || password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }
  return { isValid: true };
};

export const validateForm = (fields) => {
  const errors = {};
  
  Object.entries(fields).forEach(([key, value]) => {
    if (!value || value.trim() === '') {
      errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatAuthError = (error) => {
  // Common auth error messages
  const errorMessages = {
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password',
    'auth/invalid-email': 'Invalid email address',
    'auth/user-disabled': 'This account has been disabled',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/email-already-in-use': 'An account with this email already exists'
  };
  
  return errorMessages[error.code] || error.message || 'An unexpected error occurred';
}; 