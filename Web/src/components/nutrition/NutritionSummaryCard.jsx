import React from 'react';
import { formatNutritionValue } from '../../utils/nutritionCalculator';
import { NUTRITION_UNITS } from '../../constants/meals';

const NutritionSummaryCard = ({ 
  title, 
  nutrition, 
  showComparison = false, 
  targetNutrition = null 
}) => {
  const renderNutritionItem = (label, value, unit, target = null) => (
    <div className="nutrition-item" key={label}>
      <span className="nutrition-label">{label}:</span>
      <span className="nutrition-value">
        {formatNutritionValue(value)} {unit}
        {target !== null && showComparison && (
          <span className={`comparison ${value > target ? 'over' : 'under'}`}>
            ({value > target ? '+' : ''}{formatNutritionValue(value - target)})
          </span>
        )}
      </span>
    </div>
  );

  return (
    <div className="nutrition-summary-card">
      <h4>{title}</h4>
      
      <div className="nutrition-grid">
        {renderNutritionItem(
          'Calories', 
          nutrition.calories, 
          NUTRITION_UNITS.CALORIES,
          targetNutrition?.calories
        )}
        {renderNutritionItem(
          'Protein', 
          nutrition.protein, 
          NUTRITION_UNITS.PROTEIN,
          targetNutrition?.protein
        )}
        {renderNutritionItem(
          'Carbs', 
          nutrition.carbs, 
          NUTRITION_UNITS.CARBS,
          targetNutrition?.carbs
        )}
        {renderNutritionItem(
          'Fat', 
          nutrition.fat, 
          NUTRITION_UNITS.FAT,
          targetNutrition?.fat
        )}
      </div>
      
      {showComparison && targetNutrition && (
        <div className="comparison-summary">
          <small>
            Difference from target shown in parentheses
          </small>
        </div>
      )}
    </div>
  );
};

export default NutritionSummaryCard;