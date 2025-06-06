import React from 'react';
import { calculateMacroPercentages } from '../../utils/menuUtils';

const MenuForm = ({
  formData,
  handleInputChange,
  applyPreset,
  generateMenu,
  clearResults,
  loading,
  generatedMenus,
  presets
}) => {
  const macroPercentages = calculateMacroPercentages(formData);

  return (
    <div className="menu-form">
      <h3 className="form-title">Nutrition Targets</h3>
      
      {/* Quick Presets */}
      <div className="presets-section">
        <h4 className="presets-title">Quick Presets:</h4>
        <div className="presets-grid">
          <button
            className="preset-button"
            onClick={() => applyPreset('weightLoss')}
          >
            🏃‍♀️ Weight Loss
          </button>
          <button
            className="preset-button"
            onClick={() => applyPreset('maintenance')}
          >
            ⚖️ Maintenance
          </button>
          <button
            className="preset-button"
            onClick={() => applyPreset('bulking')}
          >
            💪 Bulking
          </button>
          <button
            className="preset-button"
            onClick={() => applyPreset('keto')}
          >
            🥑 Keto
          </button>
        </div>
      </div>

      {/* Macro Input */}
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
          min="500"
          max="5000"
        />
      </div>

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
            min="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>🟢</span>
            Carbs (g) - {macroPercentages.carbs}%
          </label>
          <input
            type="number"
            name="carbs"
            value={formData.carbs}
            onChange={handleInputChange}
            className="form-input"
            min="0"
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>🟣</span>
            Fat (g) - {macroPercentages.fat}%
          </label>
          <input
            type="number"
            name="fat"
            value={formData.fat}
            onChange={handleInputChange}
            className="form-input"
            min="0"
          />
        </div>
      </div>

      {/* Macro Visualization */}
      <div className="macro-chart">
        <h4 className="chart-title">Macro Distribution</h4>
        <div className="macro-bar">
          <div
            className="macro-segment protein"
            style={{ width: `${macroPercentages.protein}%` }}
          ></div>
          <div
            className="macro-segment carbs"
            style={{ width: `${macroPercentages.carbs}%` }}
          ></div>
          <div
            className="macro-segment fat"
            style={{ width: `${macroPercentages.fat}%` }}
          ></div>
        </div>
        <div className="macro-legend">
          <div className="legend-item">
            <span className="legend-color protein"></span>
            Protein {macroPercentages.protein}%
          </div>
          <div className="legend-item">
            <span className="legend-color carbs"></span>
            Carbs {macroPercentages.carbs}%
          </div>
          <div className="legend-item">
            <span className="legend-color fat"></span>
            Fat {macroPercentages.fat}%
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span>🕐</span>
          Meal Type (Optional)
        </label>
        <select
          name="meal_type"
          value={formData.meal_type}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="">Any Meal</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">
          <span>👥</span>
          Number of Items
        </label>
        <input
          type="range"
          name="num_items"
          value={formData.num_items}
          onChange={handleInputChange}
          className="form-range"
          min="1"
          max="10"
        />
        <div className="range-value">{formData.num_items} items</div>
      </div>

      <div className="form-group">
        <label className="form-label checkbox-label">
          <input
            type="checkbox"
            name="include_prices"
            checked={formData.include_prices || false}
            onChange={handleInputChange}
            className="form-checkbox"
          />
          <span className="checkbox-icon">💰</span>
          Include Price Comparison
          <span className="checkbox-description">
            Compare prices across different supermarkets
          </span>
        </label>
      </div>

      <div className="generate-actions">
        <button
          onClick={generateMenu}
          disabled={loading}
          className="generate-btn primary"
        >
          {loading ? (
            <>
              <span className="loading-spinner">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <span>🔄</span>
              Generate Menu
            </>
          )}
        </button>
        
        {generatedMenus.length > 0 && (
          <button
            onClick={clearResults}
            className="generate-btn secondary"
          >
            <span>🗑️</span>
            Clear Results
          </button>
        )}
      </div>
    </div>
  );
};

export default MenuForm; 