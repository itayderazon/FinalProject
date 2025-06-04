import React from 'react';

const AuthOptions = ({ 
  showRememberMe = true, 
  showForgotPassword = true,
  onForgotPasswordClick
}) => {
  return (
    <div className="auth-options">
      {showRememberMe && (
        <div className="remember-me">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="remember-checkbox"
          />
          <label htmlFor="remember-me" className="auth-label">
            Remember me
          </label>
        </div>
      )}

      {showForgotPassword && (
        <div>
          <a 
            href="#" 
            className="forgot-password"
            onClick={onForgotPasswordClick}
          >
            Forgot your password?
          </a>
        </div>
      )}
    </div>
  );
};

export default AuthOptions; 