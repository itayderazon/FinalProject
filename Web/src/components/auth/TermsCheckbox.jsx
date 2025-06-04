import React from 'react';

const TermsCheckbox = ({ 
  checked, 
  onChange, 
  termsUrl = "#", 
  privacyUrl = "#" 
}) => {
  return (
    <div className="remember-me">
      <input
        id="terms"
        name="terms"
        type="checkbox"
        required
        checked={checked}
        onChange={onChange}
        className="remember-checkbox"
      />
      <label htmlFor="terms" className="auth-label">
        I agree to the{' '}
        <a href={termsUrl} className="auth-link">Terms of Service</a>
        {' '}and{' '}
        <a href={privacyUrl} className="auth-link">Privacy Policy</a>
      </label>
    </div>
  );
};

export default TermsCheckbox; 