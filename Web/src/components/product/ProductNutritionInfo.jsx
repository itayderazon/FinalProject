import React from 'react';
import { formatCalories, formatProtein } from '../../utils/formatters';

const ProductNutritionInfo = ({ product, showDetailed = false }) => {
  const nutrition = {
    calories: product.calories_per_100g || product.calories || 0,
    protein: product.protein_per_100g || product.protein || 0,
    carbs: product.carbs_per_100g || product.carbs || 0,
    fat: product.fat_per_100g || product.fat || 0,
    fiber: product.fiber_per_100g || product.fiber || 0,
    sugar: product.sugar_per_100g || product.sugar || 0
  };

  if (showDetailed) {
    return (
      <div className="product-nutrition detailed">
        <h4>Nutrition per 100g</h4>
        <div className="nutrition-grid">
          <div className="nutrition-item">
            <span className="label">Calories:</span>
            <span className="value">{formatCalories(nutrition.calories)}</span>
          </div>
          <div className="nutrition-item">
            <span className="label">Protein:</span>
            <span className="value">{formatProtein(nutrition.protein)}</span>
          </div>
          <div className="nutrition-item">
            <span className="label">Carbs:</span>
            <span className="value">{nutrition.carbs.toFixed(1)}g</span>
          </div>
          <div className="nutrition-item">
            <span className="label">Fat:</span>
            <span className="value">{nutrition.fat.toFixed(1)}g</span>
          </div>
          {nutrition.fiber > 0 && (
            <div className="nutrition-item">
              <span className="label">Fiber:</span>
              <span className="value">{nutrition.fiber.toFixed(1)}g</span>
            </div>
          )}
          {nutrition.sugar > 0 && (
            <div className="nutrition-item">
              <span className="label">Sugar:</span>
              <span className="value">{nutrition.sugar.toFixed(1)}g</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="product-nutrition compact">
      <div className="nutrition-summary">
        <span className="calories">
          {formatCalories(nutrition.calories)}
        </span>
        <span className="protein">
          {formatProtein(nutrition.protein)}
        </span>
        {nutrition.carbs > 0 && (
          <span className="carbs">
            {nutrition.carbs.toFixed(1)}g carbs
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductNutritionInfo;