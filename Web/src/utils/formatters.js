export const formatPrice = (price) => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS'
  }).format(price);
};

export const formatCalories = (calories) => {
  return `${calories} קלוריות`;
};

export const formatProtein = (protein) => {
  return `${protein}g חלבון`;
};

export const formatStoreCount = (count) => {
  return `${count} חנויות`;
};