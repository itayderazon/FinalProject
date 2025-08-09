import React from 'react';
import { formatNutritionValue } from '../../utils/nutritionCalculator';

const MealItemsList = ({ items, onRemove }) => {
  if (!items || items.length === 0) {
    return (
      <div className="meal-items-list">
        <h4>Meal Items</h4>
        <p className="no-items">No items added yet. Add items above to build your meal.</p>
      </div>
    );
  }

  const formatItemNutrition = (item) => {
    const multiplier = item.quantity / 100;
    return {
      calories: formatNutritionValue(item.calories * multiplier),
      protein: formatNutritionValue(item.protein * multiplier),
      carbs: formatNutritionValue(item.carbs * multiplier),
      fat: formatNutritionValue(item.fat * multiplier)
    };
  };

  return (
    <div className="meal-items-list">
      <h4>Meal Items ({items.length})</h4>
      
      <div className="items-container">
        {items.map((item, index) => {
          const nutrition = formatItemNutrition(item);
          
          return (
            <div key={index} className="meal-item">
              <div className="item-header">
                <span className="item-name">{item.custom_food_name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="remove-btn"
                  title="Remove item"
                >
                  ×
                </button>
              </div>
              
              <div className="item-details">
                <span className="quantity">
                  {formatNutritionValue(item.quantity)} {item.unit}
                </span>
                
                <div className="nutrition-summary">
                  <span className="nutrition-item">
                    {nutrition.calories} kcal
                  </span>
                  <span className="nutrition-item">
                    {nutrition.protein}g protein
                  </span>
                  <span className="nutrition-item">
                    {nutrition.carbs}g carbs
                  </span>
                  <span className="nutrition-item">
                    {nutrition.fat}g fat
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MealItemsList;