import React from 'react';
import DailyMenuCard from './DailyMenuCard';
import { formatFullDate } from '../../utils/dateUtils';

const DayDetail = ({ 
  selectedDate, 
  selectedMenu, 
  onAddMeal, 
  onDeleteMeal,
  onAddGeneratedMenu
}) => {
  return (
    <div className="selected-day-detail">
      <div className="detail-header">
        <h3>{formatFullDate(selectedDate)}</h3>
        {/* Auto-created menus mean we never show a manual create button */}
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
            <h4>Loading menu...</h4>
            <p>Please wait a moment.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DayDetail; 