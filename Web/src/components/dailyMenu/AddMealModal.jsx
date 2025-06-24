import React, { useState } from 'react';

const AddMealModal = ({ mealType, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    items: []
  });
  const [newItem, setNewItem] = useState({
    custom_food_name: '',
    quantity: 100,
    unit: 'grams',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mealTypeInfo = {
    breakfast: { icon: '🌅', label: 'Breakfast' },
    lunch: { icon: '🌞', label: 'Lunch' },
    dinner: { icon: '🌙', label: 'Dinner' },
    snack: { icon: '🍎', label: 'Snack' }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    if (name.startsWith('target_')) {
      const nutritionKey = name.replace('target_', '');
      setFormData(prev => ({
        ...prev,
        target_nutrition: {
          ...prev.target_nutrition,
          [nutritionKey]: newValue
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: newValue
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNewItemChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    setNewItem(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const addItem = () => {
    if (!newItem.custom_food_name.trim()) {
      setErrors({ newItem: 'Food name is required' });
      return;
    }

    if (newItem.calories <= 0) {
      setErrors({ newItem: 'Calories must be greater than 0' });
      return;
    }

    const item = {
      ...newItem,
      id: Date.now() // Temporary ID for display
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));

    // Reset new item form
    setNewItem({
      custom_food_name: '',
      quantity: 100,
      unit: 'grams',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    });

    // Clear errors
    setErrors(prev => ({ ...prev, newItem: '' }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalNutrition = () => {
    return formData.items.reduce((total, item) => ({
      calories: total.calories + (item.calories || 0),
      protein: total.protein + (item.protein || 0),
      carbs: total.carbs + (item.carbs || 0),
      fat: total.fat + (item.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Meal name is required';
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one food item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Prepare meal data for submission
      const mealData = {
        ...formData,
        items: formData.items.map(({ id, ...item }) => item) // Remove temporary ID
      };

      await onSubmit(mealData);
    } catch (error) {
      console.error('Error adding meal:', error);
      setErrors({ submit: error.message || 'Failed to add meal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalNutrition = calculateTotalNutrition();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-meal-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {mealTypeInfo[mealType]?.icon} Add {mealTypeInfo[mealType]?.label}
          </h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">
                Meal Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={`e.g., Healthy ${mealTypeInfo[mealType]?.label}`}
                className={errors.name ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description..."
                rows={2}
                disabled={isSubmitting}
              />
            </div>

            {/* Add Food Items Section */}
            <div className="items-section">
              <h4>Food Items</h4>
              
              <div className="add-item-form">
                <div className="item-inputs">
                  <div className="form-group">
                    <label>Food Name</label>
                    <input
                      type="text"
                      name="custom_food_name"
                      value={newItem.custom_food_name}
                      onChange={handleNewItemChange}
                      placeholder="e.g., Greek yogurt"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      name="quantity"
                      value={newItem.quantity}
                      onChange={handleNewItemChange}
                      min="1"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit</label>
                    <select
                      name="unit"
                      value={newItem.unit}
                      onChange={handleNewItemChange}
                      disabled={isSubmitting}
                    >
                      <option value="grams">grams</option>
                      <option value="ml">ml</option>
                      <option value="pieces">pieces</option>
                      <option value="cups">cups</option>
                      <option value="tbsp">tbsp</option>
                      <option value="tsp">tsp</option>
                    </select>
                  </div>
                </div>

                <div className="nutrition-inputs">
                  <div className="form-group">
                    <label>Calories</label>
                    <input
                      type="number"
                      name="calories"
                      value={newItem.calories}
                      onChange={handleNewItemChange}
                      min="0"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input
                      type="number"
                      name="protein"
                      value={newItem.protein}
                      onChange={handleNewItemChange}
                      min="0"
                      step="0.1"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input
                      type="number"
                      name="carbs"
                      value={newItem.carbs}
                      onChange={handleNewItemChange}
                      min="0"
                      step="0.1"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input
                      type="number"
                      name="fat"
                      value={newItem.fat}
                      onChange={handleNewItemChange}
                      min="0"
                      step="0.1"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="add-item-btn"
                  onClick={addItem}
                  disabled={isSubmitting}
                >
                  Add Item
                </button>
              </div>

              {errors.newItem && <span className="error-message">{errors.newItem}</span>}

              {/* Items List */}
              {formData.items.length > 0 && (
                <div className="items-list">
                  {formData.items.map((item, index) => (
                    <div key={index} className="item-card">
                      <div className="item-info">
                        <span className="item-name">{item.custom_food_name}</span>
                        <span className="item-amount">
                          {item.quantity}{item.unit}
                        </span>
                      </div>
                      <div className="item-nutrition">
                        <span>{Math.round(item.calories)}cal</span>
                        <span>{Math.round(item.protein * 10) / 10}p</span>
                        <span>{Math.round(item.carbs * 10) / 10}c</span>
                        <span>{Math.round(item.fat * 10) / 10}f</span>
                      </div>
                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => removeItem(index)}
                        disabled={isSubmitting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.items && <span className="error-message">{errors.items}</span>}

              {/* Total Nutrition */}
              {formData.items.length > 0 && (
                <div className="total-nutrition">
                  <h5>Total Nutrition</h5>
                  <div className="nutrition-summary">
                    <span className="total-calories">
                      {Math.round(totalNutrition.calories)} calories
                    </span>
                    <span className="total-macros">
                      {Math.round(totalNutrition.protein * 10) / 10}g protein | {' '}
                      {Math.round(totalNutrition.carbs * 10) / 10}g carbs | {' '}
                      {Math.round(totalNutrition.fat * 10) / 10}g fat
                    </span>
                  </div>
                </div>
              )}
            </div>

            {errors.submit && (
              <div className="error-banner">
                {errors.submit}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Adding...
                </>
              ) : (
                'Add Meal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMealModal; 