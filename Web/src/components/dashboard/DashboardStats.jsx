import React from 'react';
import StatCard from './StatCard';

const DashboardStats = ({ todayStats }) => {
  const statsConfig = [
    {
      icon: '⚡',
      iconColor: 'green',
      label: "Today's Calories",
      value: todayStats?.dailyTotals?.calories?.toFixed(0) || '0'
    },
    {
      icon: '🎯',
      iconColor: 'blue',
      label: 'Protein (g)',
      value: todayStats?.dailyTotals?.protein?.toFixed(0) || '0'
    },
    {
      icon: '🍎',
      iconColor: 'yellow',
      label: 'Carbs (g)',
      value: todayStats?.dailyTotals?.carbs?.toFixed(0) || '0'
    },
    {
      icon: '📈',
      iconColor: 'purple',
      label: 'Fat (g)',
      value: todayStats?.dailyTotals?.fat?.toFixed(0) || '0'
    }
  ];

  return (
    <div className="stats-grid">
      {statsConfig.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          iconColor={stat.iconColor}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  );
};

export default DashboardStats; 