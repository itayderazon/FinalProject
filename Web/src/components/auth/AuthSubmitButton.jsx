import React from 'react';

const AuthSubmitButton = ({ 
  loading, 
  loadingText, 
  children, 
  disabled,
  ...props 
}) => {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="auth-submit"
      {...props}
    >
      {loading ? (
        <>
          <span>⏳</span>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default AuthSubmitButton; 