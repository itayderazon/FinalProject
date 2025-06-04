// Utility functions for menu generation

export const showNotification = (message, type = 'info') => {
  // Simple notification - in real app use react-hot-toast
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
};

export const calculateMacroPercentages = (formData) => {
  const totalCalories = formData.calories;
  const proteinCals = formData.protein * 4;
  const carbsCals = formData.carbs * 4;
  const fatCals = formData.fat * 9;
  
  return {
    protein: Math.round((proteinCals / totalCalories) * 100),
    carbs: Math.round((carbsCals / totalCalories) * 100),
    fat: Math.round((fatCals / totalCalories) * 100)
  };
};

export const formatNutritionValue = (value, decimals = 0) => {
  return value.toFixed(decimals);
};

export const validateMenuData = (menuData) => {
  const requiredFields = ['calories', 'protein', 'carbs', 'fat'];
  const missingFields = requiredFields.filter(field => !menuData[field] || menuData[field] <= 0);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing or invalid values for: ${missingFields.join(', ')}`);
  }
  
  return true;
}; 