import React from 'react';

const DashboardHeader = ({ user }) => {
  return (
    <div className="dashboard-header">
      <h1 className="dashboard-title">
        Welcome back, {user?.display_name || user?.name}! 👋
      </h1>
      <p className="dashboard-subtitle">
        Here's your nutrition overview for today
      </p>
    </div>
  );
};

export default DashboardHeader; 