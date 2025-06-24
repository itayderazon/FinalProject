import React from 'react';
import { formatDate } from '../../utils/dateUtils';

const WeekNavigation = ({ currentWeekStart, onNavigateWeek }) => {
  return (
    <div className="week-navigation">
      <button 
        className="nav-button"
        onClick={() => onNavigateWeek(-1)}
      >
        ← Previous Week
      </button>
      <h2 className="week-title">
        Week of {formatDate(new Date(currentWeekStart))}
      </h2>
      <button 
        className="nav-button"
        onClick={() => onNavigateWeek(1)}
      >
        Next Week →
      </button>
    </div>
  );
};

export default WeekNavigation; 