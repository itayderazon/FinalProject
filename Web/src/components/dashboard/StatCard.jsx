import React from 'react';

const StatCard = ({ icon, iconColor, label, value, unit = '' }) => {
  return (
    <div className="stat-card">
      <div className="stat-content">
        <div className={`stat-icon ${iconColor}`}>{icon}</div>
        <div className="stat-info">
          <p className="stat-label">{label}</p>
          <p className="stat-value">
            {value}{unit}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCard; 