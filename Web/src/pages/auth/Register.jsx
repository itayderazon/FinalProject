import React from 'react';
import { useRegisterForm } from '../../hooks/useRegisterForm';
import AuthHeader from '../../components/auth/AuthHeader';
import RegisterForm from '../../components/auth/RegisterForm';
import '../../styles/Auth.css';

const Register = () => {
  const {
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
  } = useRegisterForm();

  return (
    <div className="auth-page">
      <AuthHeader
        title="Create your account"
        subtitle="Or"
        linkText="sign in to your existing account"
        linkTo="/login"
      />

      <RegisterForm
        formData={formData}
        showPassword={showPassword}
        showConfirmPassword={showConfirmPassword}
        agreedToTerms={agreedToTerms}
        passwordValidation={passwordValidation}
        isPasswordValid={isPasswordValid}
        loading={loading}
        handleChange={handleChange}
        handleTermsChange={handleTermsChange}
        handleSubmit={handleSubmit}
        togglePasswordVisibility={togglePasswordVisibility}
        toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
      />
    </div>
  );
};

export default Register;