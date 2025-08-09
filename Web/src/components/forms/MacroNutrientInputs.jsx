import React from 'react';
import { calculateMacroPercentages } from '../../utils/menuUtils';

const MacroNutrientInputs = ({ formData, onChange }) => {
  const macroPercentages = calculateMacroPercentages(formData);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    onChange(name, numValue);
  };

  return (
    <div className="macro-nutrient-inputs">
      <h3 className="form-title">Nutrition Targets</h3>

      {/* Calories Input */}
      <div className="form-group">
        <label className="form-label">
          <span>⚡</span>
          Calories
        </label>
        <input
          type="number"
          name="calories"
          value={formData.calories}
          onChange={handleInputChange}
          className="form-input"
          min="200"
          max="5000"
          step="10"
        />
      </div>

      {/* Macro Inputs */}
      <div className="macro-inputs">
        <div className="form-group">
          <label className="form-label">
            <span>🎯</span>
            Protein (g) - {macroPercentages.protein}%
          </label>
          <input
            type="number"
            name="protein"
            value={formData.protein}
            onChange={handleInputChange}
            className="form-input"
            min="10"
            max="500"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>🌾</span>
            Carbs (g) - {macroPercentages.carbs}%
          </label>
          <input
            type="number"
            name="carbs"
            value={formData.carbs}
            onChange={handleInputChange}
            className="form-input"
            min="10"
            max="800"
            step="0.5"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>🥑</span>
            Fat (g) - {macroPercentages.fat}%
          </label>
          <input
            type="number"
            name="fat"
            value={formData.fat}
            onChange={handleInputChange}
            className="form-input"
            min="5"
            max="300"
            step="0.5"
          />
        </div>
      </div>

      {/* Macro Percentages Display */}
      <div className="macro-percentages">
        <small>
          Total: {macroPercentages.protein + macroPercentages.carbs + macroPercentages.fat}% 
          (Aim for ~100%)
        </small>
      </div>
    </div>
  );
};

export default MacroNutrientInputs;