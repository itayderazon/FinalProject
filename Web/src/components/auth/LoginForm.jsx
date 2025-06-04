import React from 'react';
import AuthField from './AuthField';
import AuthOptions from './AuthOptions';
import AuthSubmitButton from './AuthSubmitButton';

const LoginForm = ({
  formData,
  showPassword,
  loading,
  handleChange,
  handleSubmit,
  togglePasswordVisibility,
  handleForgotPassword
}) => {
  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthField
          id="email"
          name="email"
          type="email"
          label="Email address"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          icon="📧"
          autoComplete="email"
          required
        />

        <AuthField
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          icon="🔒"
          autoComplete="current-password"
          required
          rightIcon={showPassword ? '🙈' : '👁️'}
          onRightIconClick={togglePasswordVisibility}
        />

        <AuthOptions 
          onForgotPasswordClick={handleForgotPassword}
        />

        <AuthSubmitButton
          loading={loading}
          loadingText="Signing in..."
        >
          Sign in
        </AuthSubmitButton>
      </form>
    </div>
  );
};

export default LoginForm; 