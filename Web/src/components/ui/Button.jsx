import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
    textDecoration: 'none',
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const variants = {
    primary: {
      backgroundColor: '#2563eb',
      color: 'white',
      '&:hover': { backgroundColor: '#1d4ed8' }
    },
    secondary: {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      '&:hover': { backgroundColor: '#e5e7eb' }
    },
    success: {
      backgroundColor: '#16a34a',
      color: 'white',
      '&:hover': { backgroundColor: '#15803d' }
    },
    danger: {
      backgroundColor: '#dc2626',
      color: 'white',
      '&:hover': { backgroundColor: '#b91c1c' }
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#2563eb',
      border: '1px solid #2563eb',
      '&:hover': { backgroundColor: '#f0f9ff' }
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#374151',
      '&:hover': { backgroundColor: '#f3f4f6' }
    }
  };

  const sizes = {
    small: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.875rem',
      minHeight: '32px'
    },
    medium: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      minHeight: '40px'
    },
    large: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      minHeight: '48px'
    }
  };

  const buttonStyles = {
    ...baseStyles,
    ...variants[variant],
    ...sizes[size]
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      type={type}
      className={className}
      style={buttonStyles}
      onClick={handleClick}
      disabled={disabled || loading}
      onMouseEnter={(e) => {
        if (!disabled && !loading && variants[variant]['&:hover']) {
          Object.assign(e.target.style, variants[variant]['&:hover']);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.target.style, variants[variant]);
        }
      }}
      {...props}
    >
      {loading ? (
        <div style={{
          width: '1rem',
          height: '1rem',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default Button; 