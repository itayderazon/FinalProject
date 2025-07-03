import React, { useState } from 'react';
import { calculateMacroPercentages } from '../../utils/menuUtils';

const MenuForm = ({ 
  formData, 
  handleInputChange, 
  applyPreset, 
  generateMenu, 
  clearResults, 
  loading, 
  generatedMenus, 
  presets,
  availableSubcategories,
  subcategoriesLoading,
  toggleSubcategory
}) => {
  const macroPercentages = calculateMacroPercentages(formData);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  return (
    <div className="menu-form">
      <h3 className="form-title">Nutrition Targets</h3>

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
          <span>🍽️</span>
          Meal Template (Optional)
        </label>
        <select
          name="meal_template"
          value={formData.meal_template}
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
          <span>🏷️</span>
          Specific Subcategories (Optional)
        </label>
        <div className="subcategories-info">
          <p className="field-description">
            Choose specific food subcategories to include in your menu
          </p>
          {formData.subcategories.length > 0 && (
            <p className="selected-count">
              {formData.subcategories.length} selected subcategories
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowCategoryModal(true)}
          className="category-selection-btn"
          disabled={subcategoriesLoading}
        >
          {subcategoriesLoading ? (
            <>
              <div className="loading-spinner"></div>
              Loading categories...
            </>
          ) : (
            <>
              <span>🏷️</span>
              {formData.subcategories.length > 0 
                ? `Selected ${formData.subcategories.length} categories` 
                : 'Select Food Categories'
              }
            </>
          )}
        </button>

        <div className="field-help">
          Select specific subcategories or leave none selected to use all available food types.
        </div>
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

      {/* Fullscreen Category Selection Modal */}
      {showCategoryModal && (
        <div className="category-modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="category-modal" onClick={(e) => e.stopPropagation()}>
            <div className="category-modal-header">
              <h2 className="category-modal-title">
                <span>🏷️</span>
                Select Food Categories
              </h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="category-modal-close"
              >
                ✕
              </button>
            </div>

            <div className="category-modal-info">
              <p>Choose specific food subcategories to include in your menu generation.</p>
              <p className="selected-count">
                {formData.subcategories.length > 0 
                  ? `${formData.subcategories.length} categories selected`
                  : 'No categories selected (all will be used)'
                }
              </p>
            </div>

            <div className="category-modal-content">
              <div className="category-modal-grid">
                {availableSubcategories.length > 0 ? (
                  availableSubcategories.map((subcategory) => (
                    <label key={subcategory} className="category-modal-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.subcategories.includes(subcategory)}
                        onChange={() => toggleSubcategory(subcategory)}
                      />
                      <span className="category-checkbox-label">{subcategory}</span>
                    </label>
                  ))
                ) : (
                  <p className="no-categories">No subcategories available</p>
                )}
              </div>
            </div>

            <div className="category-modal-actions">
              <button
                onClick={() => {
                  // Clear all selections
                  formData.subcategories.forEach(cat => toggleSubcategory(cat));
                }}
                className="category-action-btn clear"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="category-action-btn done"
              >
                Done ({formData.subcategories.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuForm; 