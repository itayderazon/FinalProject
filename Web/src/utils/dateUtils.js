export const formatDate = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const formatFullDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const isToday = (date) => {
  return date.toDateString() === new Date().toDateString();
};

export const isSameDate = (date1, date2) => {
  return date1.toISOString().split('T')[0] === date2;
}; 