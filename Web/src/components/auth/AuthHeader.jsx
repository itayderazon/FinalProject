import React from 'react';
import { Link } from 'react-router-dom';

const AuthHeader = ({ 
  title, 
  subtitle, 
  linkText, 
  linkTo, 
  linkLabel 
}) => {
  return (
    <div className="auth-header">
      <div className="auth-logo">
        <div className="auth-logo-icon">🍳</div>
      </div>
      <h2 className="auth-title">{title}</h2>
      <p className="auth-subtitle">
        {subtitle}{' '}
        <Link to={linkTo} className="auth-link">
          {linkText}
        </Link>
      </p>
    </div>
  );
};

export default AuthHeader; 