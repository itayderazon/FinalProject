import React from 'react';
import { isToday, isSameDate } from '../../utils/dateUtils';

const WeeklyCalendar = ({ 
  weekDays, 
  selectedDate, 
  onDateSelect, 
  getDayMenu 
}) => {
  return (
    <div className="weekly-calendar">
      {weekDays.map((day) => {
        const dayMenu = getDayMenu(day);
        const isSelected = isSameDate(day, selectedDate);
        const dayIsToday = isToday(day);

        return (
          <div
            key={day.toISOString()}
            className={`day-card ${isSelected ? 'selected' : ''} ${dayIsToday ? 'today' : ''}`}
            onClick={() => onDateSelect(day.toISOString().split('T')[0])}
          >
            <div className="day-header">
              <span className="day-name">
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <span className="day-date">
                {day.getDate()}
              </span>
            </div>
            <div className="day-content">
              {dayMenu ? (
                <div className="day-summary">
                  <span className="menu-name">{dayMenu.name}</span>
                  <span className="calorie-count">
                    {dayMenu.total_nutrition.calories} cal
                  </span>
                </div>
              ) : (
                <div className="no-menu">
                  <span></span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyCalendar; 