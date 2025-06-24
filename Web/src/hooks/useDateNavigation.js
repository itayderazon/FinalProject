import { useState } from 'react';

export const useDateNavigation = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    return startOfWeek.toISOString().split('T')[0];
  });

  const navigateWeek = (direction) => {
    const current = new Date(currentWeekStart);
    current.setDate(current.getDate() + (direction * 7));
    setCurrentWeekStart(current.toISOString().split('T')[0]);
  };

  const getWeekDays = () => {
    const start = new Date(currentWeekStart);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getWeekRange = () => {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return {
      startDate: weekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0]
    };
  };

  return {
    selectedDate,
    setSelectedDate,
    currentWeekStart,
    navigateWeek,
    getWeekDays,
    getWeekRange
  };
}; 