import React from 'react';

const ActivityItem = ({ log, index }) => {
  return (
    <div className="activity-item">
      <div className="activity-content">
        <div className="activity-icon">📅</div>
        <div className="activity-info">
          <p className="activity-title">
            {new Date(log.date).toLocaleDateString()}
          </p>
          <p className="activity-subtitle">
            {log.dailyTotals.calories.toFixed(0)} calories logged
          </p>
        </div>
      </div>
      <div className="activity-meta">
        <p className="activity-meals">
          {log.meals?.length || 0} meals
        </p>
      </div>
    </div>
  );
};

export default ActivityItem; 