import React, { useState } from 'react';
import MacroNutrientInputs from '../forms/MacroNutrientInputs';
import NutritionPresets from '../forms/NutritionPresets';
import MenuOptionsForm from '../forms/MenuOptionsForm';
import AllergenSelector from './AllergenSelector';

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
  toggleSubcategory,
  availableAllergens,
  allergensLoading,
  toggleAllergen
}) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleMacroChange = (name, value) => {
    const event = {
      target: { name, value, type: 'number' }
    };
    handleInputChange(event);
  };

  const handleOptionsChange = (name, value) => {
    const event = {
      target: { name, value, type: typeof value === 'boolean' ? 'checkbox' : 'text', checked: value }
    };
    handleInputChange(event);
  };

  return (
    <div className="menu-form">
      {/* Nutrition Presets */}
      <NutritionPresets 
        presets={presets}
        onApplyPreset={applyPreset}
      />

      {/* Macro Nutrient Inputs */}
      <MacroNutrientInputs
        formData={formData}
        onChange={handleMacroChange}
      />

      {/* Menu Options */}
      <MenuOptionsForm
        formData={formData}
        onChange={handleOptionsChange}
        onCategoryModalOpen={() => setShowCategoryModal(true)}
        selectedSubcategoriesCount={formData.subcategories?.length || 0}
        selectedAllergensCount={formData.excluded_allergens?.length || 0}
      />

      {/* Allergen Selector */}
      <AllergenSelector
        availableAllergens={availableAllergens}
        allergensLoading={allergensLoading}
        selectedAllergens={formData.excluded_allergens || []}
        onToggleAllergen={toggleAllergen}
      />

      {/* Generate Button */}
      <div className="form-actions">
        <button
          onClick={generateMenu}
          disabled={loading}
          className="generate-btn primary"
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Generating...
            </>
          ) : (
            <>
              <span>🎲</span>
              Generate Menu
            </>
          )}
        </button>

        {generatedMenus && generatedMenus.length > 0 && (
          <button
            onClick={clearResults}
            className="clear-btn secondary"
          >
            <span>🗑️</span>
            Clear Results
          </button>
        )}
      </div>

      {/* Food Categories Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content category-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Food Categories</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="categories-container">
                {subcategoriesLoading ? (
                  <div className="loading-state">
                    <span className="loading-spinner"></span>
                    Loading categories...
                  </div>
                ) : availableSubcategories && availableSubcategories.length > 0 ? (
                  <div className="categories-grid">
                    {availableSubcategories.map((category) => (
                      <label key={category} className="category-item">
                        <input
                          type="checkbox"
                          checked={formData.subcategories.includes(category)}
                          onChange={() => toggleSubcategory(category)}
                          className="category-checkbox"
                        />
                        <span className="category-label">{category}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="no-categories">No subcategories available</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  // Clear all selections
                  formData.subcategories.forEach(cat => toggleSubcategory(cat));
                }}
                className="clear-all-btn"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="done-btn"
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