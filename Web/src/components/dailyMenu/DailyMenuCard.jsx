import React, { useState } from 'react';

const DailyMenuCard = ({ 
  menu, 
  onAddMeal, 
  onDeleteMeal, 
  showActions = true 
}) => {

  const mealTypes = [
    { type: 'breakfast', icon: '🌅', label: 'Breakfast' },
    { type: 'lunch', icon: '🌞', label: 'Lunch' },
    { type: 'dinner', icon: '🌙', label: 'Dinner' },
    { type: 'snack', icon: '🍎', label: 'Snacks' }
  ];

  const getMealsForType = (mealType) => {
    if (!menu.meals) return [];
    return menu.meals.filter(meal => meal.meal_type === mealType);
  };

  // Generate menu flow removed from daily planner

  const formatNutrition = (nutrition) => {
    const safeValue = (value) => {
      if (value === null || value === undefined || value === '' || value === 'NaN' || isNaN(value)) {
        return 0;
      }
      return parseFloat(value) || 0;
    };

    return {
      calories: Math.round(safeValue(nutrition.calories)),
      protein: Math.round(safeValue(nutrition.protein) * 10) / 10,
      carbs: Math.round(safeValue(nutrition.carbs) * 10) / 10,
      fat: Math.round(safeValue(nutrition.fat) * 10) / 10
    };
  };

  return (
    <div className="daily-menu-card">
      {/* Header */}
      <div className="menu-header">
        <div className="menu-info">
          <h3 className="menu-name">{menu.name}</h3>
          {menu.description && (
            <p className="menu-description">{menu.description}</p>
          )}
        </div>
        <div className="menu-nutrition">
          <div className="nutrition-summary">
            <span className="calories">
              {formatNutrition(menu.total_nutrition).calories} cal
            </span>
            <span className="macros">
              {formatNutrition(menu.total_nutrition).protein}p | {' '}
              {formatNutrition(menu.total_nutrition).carbs}c | {' '}
              {formatNutrition(menu.total_nutrition).fat}f
            </span>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div className="meals-container">
        {mealTypes.map(({ type, icon, label }) => {
          const meals = getMealsForType(type);
          
          return (
            <div key={type} className="meal-section">
              <div className="meal-header">
                <h4 className="meal-title">
                  <span className="meal-icon">{icon}</span>
                  {label}
                </h4>
                {showActions && (
                  <div className="meal-actions">
                    <button
                      className="add-meal-btn"
                      onClick={() => onAddMeal(type)}
                      title="Add manual meal"
                    >
                      <span>+</span>
                    </button>
                    {/* Generate menu action removed */}
                  </div>
                )}
              </div>

              <div className="meal-content">
                {meals.length > 0 ? (
                  <div className="meals-list">
                    {meals.map((meal, mealIndex) => (
                      <div key={`${meal.id}-${mealIndex}`} className="meal-item">
                        <div className="meal-info">
                          {meal.name && (
                            <h5 className="meal-name">{meal.name}</h5>
                          )}
                          {meal.description && (
                            <p className="meal-description">{meal.description}</p>
                          )}
                        </div>

                        {meal.items && meal.items.length > 0 && (
                          <div className="meal-items">
                            {meal.items.map((item, itemIndex) => (
                              <div key={`${item.id}-${itemIndex}`} className="food-item">
                                <div className="item-info">
                                  <span className="item-name">{item.name}</span>
                                  <span className="item-amount">
                                    {Math.round(item.quantity * 10) / 10}{item.unit}
                                  </span>
                                </div>
                                <div className="item-nutrition">
                                  <span className="item-calories">
                                    {formatNutrition(item.nutrition).calories} cal
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Meal nutrition summary */}
                        {meal.items && meal.items.length > 0 && (
                          <div className="meal-nutrition-summary">
                            {(() => {
                              const totalNutrition = meal.items.reduce((total, item) => ({
                                calories: total.calories + (item.nutrition.calories || 0),
                                protein: total.protein + (item.nutrition.protein || 0),
                                carbs: total.carbs + (item.nutrition.carbs || 0),
                                fat: total.fat + (item.nutrition.fat || 0)
                              }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                              return (
                                <span className="meal-totals">
                                  Total: {formatNutrition(totalNutrition).calories} cal, {' '}
                                  {formatNutrition(totalNutrition).protein}p, {' '}
                                  {formatNutrition(totalNutrition).carbs}c, {' '}
                                  {formatNutrition(totalNutrition).fat}f
                                </span>
                              );
                            })()}
                          </div>
                        )}

                        {showActions && (
                          <div className="meal-item-actions">
                            <button
                              className="delete-meal-btn"
                              onClick={() => onDeleteMeal(meal.id)}
                              title="Delete meal"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-meal">
                    <span className="empty-text">No {label.toLowerCase()} planned</span>
                    {showActions && (
                      <div className="empty-actions">
                        <button
                          className="add-meal-link"
                          onClick={() => onAddMeal(type)}
                        >
                          Add meal
                        </button>
                        <span> or </span>
                        <button
                          className="add-generated-link"
                          onClick={() => handleAddGeneratedMenu(type)}
                        >
                          add generated menu
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate menu modal removed */}
    </div>
  );
};

export default DailyMenuCard; 