import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardStats from '../components/dashboard/DashboardStats';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import '../styles/Dashboard.css';

const LoggedInHomepage = () => {
  const { user } = useAuth();
  const { nutritionHistory, todayStats, loading } = useDashboard();

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <div className="loading-container">
            <div className="loading-spinner">⏳</div>
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        {/* Welcome Header */}
        <DashboardHeader user={user} />

        {/* Quick Stats Cards */}
        <DashboardStats todayStats={todayStats} />

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Left Sidebar */}
          <div>
            <QuickActions />
          </div>

          {/* Right Content */}
          <RecentActivity nutritionHistory={nutritionHistory} />
        </div>
      </div>
    </div>
  );
};

export default LoggedInHomepage;