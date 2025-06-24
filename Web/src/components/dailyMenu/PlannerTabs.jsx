import React from 'react';

const PlannerTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="planner-tabs">
      <button
        className={`tab-button ${activeTab === 'planner' ? 'active' : ''}`}
        onClick={() => onTabChange('planner')}
      >
        <span>📋</span>
        Weekly Planner
      </button>
      <button
        className={`tab-button ${activeTab === 'nutrition' ? 'active' : ''}`}
        onClick={() => onTabChange('nutrition')}
      >
        <span>📊</span>
        Nutrition Summary
      </button>
    </div>
  );
};

export default PlannerTabs; 