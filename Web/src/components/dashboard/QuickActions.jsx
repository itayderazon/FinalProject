import React from 'react';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  return (
    <div className="sidebar-card">
      <h3 className="sidebar-title">Quick Actions</h3>
      <div className="quick-actions">
        <Link to="/menu-generator" className="quick-action green">
          <div className="quick-action-content">
            <span className="quick-action-icon">🍳</span>
            <span className="quick-action-text">Generate Menu</span>
          </div>
          <span>→</span>
        </Link>
        
        <button className="quick-action blue">
          <div className="quick-action-content">
            <span className="quick-action-icon">➕</span>
            <span className="quick-action-text">Log Food</span>
          </div>
          <span>→</span>
        </button>
        
        <button className="quick-action purple">
          <div className="quick-action-content">
            <span className="quick-action-icon">📊</span>
            <span className="quick-action-text">View Analytics</span>
          </div>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};

export default QuickActions; 