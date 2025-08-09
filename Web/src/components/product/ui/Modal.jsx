import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '42rem' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={handleBackdropClick}
    >
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        maxWidth: maxWidth,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        {title && (
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#111827',
              margin: 0
            }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0.375rem',
                color: '#6b7280'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              <X style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ 
          maxHeight: title ? 'calc(80vh - 140px)' : '80vh', 
          overflowY: 'auto' 
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 