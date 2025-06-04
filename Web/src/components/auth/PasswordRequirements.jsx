import React from 'react';

const PasswordRequirements = ({ password, confirmPassword, passwordValidation }) => {
  if (!password) {
    return null;
  }

  return (
    <div className="password-requirements">
      <p className="requirements-title">Password requirements:</p>
      <div className="requirements-list">
        <div className="requirement-item">
          <span className={`requirement-icon ${passwordValidation.length ? 'requirement-valid' : 'requirement-invalid'}`}>
            {passwordValidation.length ? '✅' : '❌'}
          </span>
          <span className={passwordValidation.length ? 'requirement-valid' : 'requirement-invalid'}>
            At least 8 characters
          </span>
        </div>
        <div className="requirement-item">
          <span className={`requirement-icon ${passwordValidation.hasLetter ? 'requirement-valid' : 'requirement-invalid'}`}>
            {passwordValidation.hasLetter ? '✅' : '❌'}
          </span>
          <span className={passwordValidation.hasLetter ? 'requirement-valid' : 'requirement-invalid'}>
            Contains letters
          </span>
        </div>
        <div className="requirement-item">
          <span className={`requirement-icon ${passwordValidation.hasNumber ? 'requirement-valid' : 'requirement-invalid'}`}>
            {passwordValidation.hasNumber ? '✅' : '❌'}
          </span>
          <span className={passwordValidation.hasNumber ? 'requirement-valid' : 'requirement-invalid'}>
            Contains numbers
          </span>
        </div>
        {confirmPassword && (
          <div className="requirement-item">
            <span className={`requirement-icon ${passwordValidation.match ? 'requirement-valid' : 'requirement-invalid'}`}>
              {passwordValidation.match ? '✅' : '❌'}
            </span>
            <span className={passwordValidation.match ? 'requirement-valid' : 'requirement-invalid'}>
              Passwords match
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordRequirements; 