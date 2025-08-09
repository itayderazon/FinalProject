import React from 'react';
import '../../styles/menu-generator/components/AllergenSelector.css';

const AllergenSelector = ({ 
  availableAllergens, 
  selectedAllergens, 
  onToggleAllergen, 
  loading 
}) => {
  if (loading) {
    return (
      <div className="allergen-selector">
        <h4>🚫 Exclude Allergens</h4>
        <div className="allergen-loading">Loading allergens...</div>
      </div>
    );
  }

  if (!availableAllergens || availableAllergens.length === 0) {
    return (
      <div className="allergen-selector">
        <h4>🚫 Exclude Allergens</h4>
        <div className="allergen-empty">No allergens available</div>
      </div>
    );
  }

  return (
    <div className="allergen-selector">
      <h4>🚫 Exclude Allergens</h4>
      <p className="allergen-description">
        Select allergens to exclude from your menu
      </p>
      
      <div className="allergen-grid">
        {availableAllergens.map((allergen) => (
          <button
            key={allergen.id}
            className={`allergen-button ${
              selectedAllergens.includes(allergen.id) ? 'selected' : ''
            }`}
            onClick={() => onToggleAllergen(allergen.id)}
            type="button"
          >
            <span className="allergen-name">
              {allergen.name_he || allergen.name}
            </span>
            <span className="allergen-count">
              ({allergen.product_count || 0})
            </span>
          </button>
        ))}
      </div>

      {selectedAllergens.length > 0 && (
        <div className="selected-allergens-summary">
          <small>
            Excluding {selectedAllergens.length} allergen{selectedAllergens.length > 1 ? 's' : ''}
          </small>
        </div>
      )}
    </div>
  );
};

export default AllergenSelector; 