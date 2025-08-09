import React from 'react';
import { validateGenerationParams } from '../../utils/mealGeneration';

const MenuGenerationForm = ({ 
  params, 
  onChange, 
  onGenerate, 
  isGenerating = false,
  errors = {} 
}) => {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? parseFloat(value) || 0 : value;
    
    onChange({
      ...params,
      [name]: newValue
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validation = validateGenerationParams(params);
    if (validation.isValid) {
      onGenerate(params);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="menu-generation-form">
      <h4>Generate New Menu</h4>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="calories">Target Calories</label>
          <input
            type="number"
            id="calories"
            name="calories"
            value={params.calories}
            onChange={handleChange}
            min="50"
            max="2000"
            step="10"
            className={errors.calories ? 'error' : ''}
          />
          {errors.calories && (
            <span className="error-text">{errors.calories}</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="num_items">Number of Items</label>
          <input
            type="number"
            id="num_items"
            name="num_items"
            value={params.num_items}
            onChange={handleChange}
            min="1"
            max="10"
            step="1"
            className={errors.num_items ? 'error' : ''}
          />
          {errors.num_items && (
            <span className="error-text">{errors.num_items}</span>
          )}
        </div>
      </div>
      
      <div className="macros-section">
        <h5>Target Macronutrients</h5>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="protein">Protein (g)</label>
            <input
              type="number"
              id="protein"
              name="protein"
              value={params.protein}
              onChange={handleChange}
              min="1"
              step="0.5"
              className={errors.protein ? 'error' : ''}
            />
            {errors.protein && (
              <span className="error-text">{errors.protein}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="carbs">Carbs (g)</label>
            <input
              type="number"
              id="carbs"
              name="carbs"
              value={params.carbs}
              onChange={handleChange}
              min="1"
              step="0.5"
              className={errors.carbs ? 'error' : ''}
            />
            {errors.carbs && (
              <span className="error-text">{errors.carbs}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="fat">Fat (g)</label>
            <input
              type="number"
              id="fat"
              name="fat"
              value={params.fat}
              onChange={handleChange}
              min="1"
              step="0.5"
              className={errors.fat ? 'error' : ''}
            />
            {errors.fat && (
              <span className="error-text">{errors.fat}</span>
            )}
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        className="generate-btn"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <span className="loading-spinner"></span>
            Generating...
          </>
        ) : (
          'Generate Menu'
        )}
      </button>
    </form>
  );
};

export default MenuGenerationForm;