import React from 'react';
import { Link } from 'react-router-dom';
import ActivityItem from './ActivityItem';

const RecentActivity = ({ nutritionHistory }) => {
  return (
    <div className="main-content">
      <div className="content-header">
        <h3 className="content-title">Recent Activity</h3>
        <Link to="/nutrition/history" className="view-all-link">
          View All
        </Link>
      </div>

      {nutritionHistory.length > 0 ? (
        <div className="activity-list">
          {nutritionHistory.slice(0, 5).map((log, index) => (
            <ActivityItem
              key={log._id || index}
              log={log}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p className="empty-title">No nutrition history yet</p>
          <p className="empty-description">Start tracking your meals to see your progress</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity; 