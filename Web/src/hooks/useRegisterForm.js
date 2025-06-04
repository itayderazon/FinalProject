import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showNotification, validateEmail, validatePassword } from '../utils/authUtils';

export const useRegisterForm = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Password validation
  const passwordValidation = {
    length: formData.password.length >= 8,
    hasLetter: /[A-Za-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.password.length > 0
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTermsChange = (e) => {
    setAgreedToTerms(e.target.checked);
  };

  const validateForm = () => {
    // Check required fields
    const requiredFields = ['name', 'display_name', 'email', 'password', 'confirmPassword'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
    
    if (missingFields.length > 0) {
      showNotification('Please fill in all fields', 'error');
      return false;
    }

    // Validate email
    if (!validateEmail(formData.email)) {
      showNotification('Please enter a valid email address', 'error');
      return false;
    }

    // Validate password
    const passwordCheck = validatePassword(formData.password, 8);
    if (!passwordCheck.isValid) {
      showNotification(passwordCheck.message, 'error');
      return false;
    }

    // Check password requirements
    if (!isPasswordValid) {
      showNotification('Please ensure your password meets all requirements', 'error');
      return false;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
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
      const result = await register({
        name: formData.name,
        display_name: formData.display_name,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        showNotification('Account created successfully! Please sign in.', 'success');
        navigate('/login');
      } else {
        showNotification(result.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showNotification('An unexpected error occurred. Please try again.', 'error');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return {
    formData,
    showPassword,
    showConfirmPassword,
    agreedToTerms,
    passwordValidation,
    isPasswordValid,
    loading,
    handleChange,
    handleTermsChange,
    handleSubmit,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility
  };
}; 