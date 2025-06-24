import React from 'react';
import DailyMenuCard from './DailyMenuCard';
import { formatFullDate } from '../../utils/dateUtils';

const DayDetail = ({ 
  selectedDate, 
  selectedMenu, 
  onCreateMenu, 
  onAddMeal, 
  onDeleteMeal, 
  onAddGeneratedMenu 
}) => {
  return (
    <div className="selected-day-detail">
      <div className="detail-header">
        <h3>{formatFullDate(selectedDate)}</h3>
        {!selectedMenu && (
          <button
            className="create-menu-btn"
            onClick={onCreateMenu}
          >
            <span>+</span>
            Create Menu
          </button>
        )}
      </div>

      {selectedMenu ? (
        <DailyMenuCard
          menu={selectedMenu}
          onAddMeal={onAddMeal}
          onDeleteMeal={onDeleteMeal}
          onAddGeneratedMenu={onAddGeneratedMenu}
          showActions={true}
        />
      ) : (
        <div className="no-menu-selected">
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h4>No menu for this day</h4>
            <p>Create a menu to start planning your meals</p>
            <button
              className="create-first-menu-btn"
              onClick={onCreateMenu}
            >
              Create Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayDetail; 