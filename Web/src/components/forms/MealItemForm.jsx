import React from 'react';
import { DEFAULT_MEAL_ITEM, QUANTITY_UNITS } from '../../constants/meals';

const MealItemForm = ({ 
  item = DEFAULT_MEAL_ITEM, 
  onChange, 
  onAdd, 
  errors = {} 
}) => {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    onChange({
      ...item,
      [name]: newValue
    });
  };

  return (
    <div className="meal-item-form">
      <h4>Add Food Item</h4>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="custom_food_name">Food Name *</label>
          <input
            type="text"
            id="custom_food_name"
            name="custom_food_name"
            value={item.custom_food_name}
            onChange={handleChange}
            placeholder="Enter food name"
            className={errors.custom_food_name ? 'error' : ''}
          />
          {errors.custom_food_name && (
            <span className="error-text">{errors.custom_food_name}</span>
          )}
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={item.quantity}
            onChange={handleChange}
            min="0"
            step="0.1"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="unit">Unit</label>
          <select
            id="unit"
            name="unit"
            value={item.unit}
            onChange={handleChange}
          >
            {Object.entries(QUANTITY_UNITS).map(([key, value]) => (
              <option key={key} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="nutrition-inputs">
        <h5>Nutrition per 100g/ml</h5>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="calories">Calories (kcal)</label>
            <input
              type="number"
              id="calories"
              name="calories"
              value={item.calories}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="protein">Protein (g)</label>
            <input
              type="number"
              id="protein"
              name="protein"
              value={item.protein}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="carbs">Carbs (g)</label>
            <input
              type="number"
              id="carbs"
              name="carbs"
              value={item.carbs}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="fat">Fat (g)</label>
            <input
              type="number"
              id="fat"
              name="fat"
              value={item.fat}
              onChange={handleChange}
              min="0"
              step="0.1"
            />
          </div>
        </div>
      </div>
      
      <button
        type="button"
        onClick={onAdd}
        className="add-item-btn"
        disabled={!item.custom_food_name.trim()}
      >
        Add Item
      </button>
    </div>
  );
};

export default MealItemForm;