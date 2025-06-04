import React from 'react';

const AuthField = ({
  id,
  name,
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  icon,
  autoComplete,
  required = false,
  rightIcon,
  onRightIconClick
}) => {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="auth-input-wrapper">
        {icon && <div className="auth-input-icon">{icon}</div>}
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          value={value}
          onChange={onChange}
          className="auth-input"
          placeholder={placeholder}
        />
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="auth-input-icon-right"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthField; 