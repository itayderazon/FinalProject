import React from 'react';
import AuthField from './AuthField';
import PasswordRequirements from './PasswordRequirements';
import TermsCheckbox from './TermsCheckbox';
import AuthSubmitButton from './AuthSubmitButton';
import AuthBenefits from './AuthBenefits';

const RegisterForm = ({
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
}) => {
  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Full Name */}
        <AuthField
          id="name"
          name="name"
          type="text"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          icon="👤"
          required
        />

        {/* Display Name */}
        <AuthField
          id="display_name"
          name="display_name"
          type="text"
          label="Display Name"
          value={formData.display_name}
          onChange={handleChange}
          placeholder="How should we call you?"
          icon="👤"
          required
        />

        {/* Email */}
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

        {/* Password */}
        <AuthField
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password"
          icon="🔒"
          required
          rightIcon={showPassword ? '🙈' : '👁️'}
          onRightIconClick={togglePasswordVisibility}
        />

        {/* Confirm Password */}
        <AuthField
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          icon="🔒"
          required
          rightIcon={showConfirmPassword ? '🙈' : '👁️'}
          onRightIconClick={toggleConfirmPasswordVisibility}
        />

        {/* Password Requirements */}
        <PasswordRequirements
          password={formData.password}
          confirmPassword={formData.confirmPassword}
          passwordValidation={passwordValidation}
        />

        {/* Terms and Privacy */}
        <TermsCheckbox
          checked={agreedToTerms}
          onChange={handleTermsChange}
        />

        <AuthSubmitButton
          loading={loading}
          loadingText="Creating account..."
          disabled={!isPasswordValid}
        >
          Create account
        </AuthSubmitButton>
      </form>

      {/* Additional Info */}
      <AuthBenefits />
    </div>
  );
};

export default RegisterForm; 