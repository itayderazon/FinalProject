import React from 'react';

const LoadingSpinner = ({ 
  size = 'large', 
  text = 'Loading...', 
  fullScreen = false
}) => {
  const spinnerSizes = {
    small: { fontSize: '20px' },
    medium: { fontSize: '32px' },
    large: { fontSize: '48px' },
    xlarge: { fontSize: '64px' }
  };

  const containerStyles = {
    small: { minHeight: '50px' },
    medium: { minHeight: '100px' },
    large: { minHeight: '200px' },
    xlarge: { minHeight: '300px' }
  };

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          ...spinnerSizes[size],
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}>
          ⏳
        </div>
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {text}
        </p>
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#16a34a',
            borderRadius: '50%',
            animation: 'bounce 1s infinite'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#16a34a',
            borderRadius: '50%',
            animation: 'bounce 1s infinite 0.1s'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#16a34a',
            borderRadius: '50%',
            animation: 'bounce 1s infinite 0.2s'
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      ...containerStyles[size]
    }}>
      <div style={{
        ...spinnerSizes[size],
        animation: 'spin 1s linear infinite',
        marginBottom: '12px'
      }}>
        ⏳
      </div>
      
      {text && (
        <p style={{
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {text}
        </p>
      )}
      
      {size === 'large' && (
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '12px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#16a34a',
            borderRadius: '50%',
            animation: 'bounce 1s infinite'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#16a34a',
            borderRadius: '50%',
            animation: 'bounce 1s infinite 0.1s'
          }}></div>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#16a34a',
            borderRadius: '50%',
            animation: 'bounce 1s infinite 0.2s'
          }}></div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: none;
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;