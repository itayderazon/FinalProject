import React from 'react';
import { useLoginForm } from '../../hooks/useLoginForm';
import AuthHeader from '../../components/auth/AuthHeader';
import LoginForm from '../../components/auth/LoginForm';
import '../../styles/Auth.css';

const Login = () => {
  const {
    formData,
    showPassword,
    loading,
    handleChange,
    handleSubmit,
    togglePasswordVisibility,
    handleForgotPassword
  } = useLoginForm();

  return (
    <div className="auth-page">
      <AuthHeader
        title="Sign in to your account"
        subtitle="Or"
        linkText="create a new account"
        linkTo="/register"
      />

      <LoginForm
        formData={formData}
        showPassword={showPassword}
        loading={loading}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        togglePasswordVisibility={togglePasswordVisibility}
        handleForgotPassword={handleForgotPassword}
      />
    </div>
  );
};

export default Login;
