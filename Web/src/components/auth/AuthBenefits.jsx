import React from 'react';

const AuthBenefits = ({ benefits }) => {
  const defaultBenefits = [
    'Personalized AI nutrition plans',
    'Track your daily nutrition goals',
    'Get smart recommendations'
  ];

  const benefitsToShow = benefits || defaultBenefits;

  return (
    <div className="auth-benefits">
      <div className="benefits-title">Why join us?</div>
      <div className="benefits-list">
        {benefitsToShow.map((benefit, index) => (
          <div key={index} className="benefit-item">
            ✓ {benefit}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthBenefits; 