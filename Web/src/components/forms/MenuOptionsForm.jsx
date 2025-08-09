import React from 'react';

const MenuOptionsForm = ({ 
  formData, 
  onChange, 
  onCategoryModalOpen,
  selectedSubcategoriesCount = 0,
  selectedAllergensCount = 0
}) => {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue;
    
    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'number') {
      newValue = parseInt(value) || 0;
    } else {
      newValue = value;
    }
    
    onChange(name, newValue);
  };

  return (
    <div className="menu-options-form">
      <h4>Menu Options</h4>
      
      {/* Meal Template */}
      <div className="form-group">
        <label className="form-label">
          <span>🍽️</span>
          Meal Template
        </label>
        <select
          name="meal_template"
          value={formData.meal_template}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="">Any meal type</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      {/* Number of Items */}
      <div className="form-group">
        <label className="form-label">
          <span>📝</span>
          Number of Items
        </label>
        <input
          type="number"
          name="num_items"
          value={formData.num_items}
          onChange={handleInputChange}
          className="form-input"
          min="1"
          max="20"
        />
      </div>

      {/* Include Prices */}
      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="include_prices"
            checked={formData.include_prices}
            onChange={handleInputChange}
            className="form-checkbox"
          />
          <span className="checkbox-icon">💰</span>
          Include price comparison
        </label>
      </div>

      {/* Food Categories Button */}
      <div className="form-group">
        <button
          type="button"
          onClick={onCategoryModalOpen}
          className="category-btn"
        >
          <span>🏷️</span>
          Food Categories
          {selectedSubcategoriesCount > 0 && (
            <span className="selected-count">({selectedSubcategoriesCount} selected)</span>
          )}
        </button>
      </div>

      {/* Allergens Section */}
      {selectedAllergensCount > 0 && (
        <div className="selected-allergens">
          <span className="allergen-label">
            🚫 Excluding {selectedAllergensCount} allergen{selectedAllergensCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default MenuOptionsForm;