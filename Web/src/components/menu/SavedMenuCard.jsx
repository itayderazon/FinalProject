import React from 'react';

const SavedMenuCard = ({ menu, onDelete }) => {
  return (
    <div className="saved-menu-card">
      <div className="saved-menu-header">
        <h4 className="saved-menu-title">{menu.name}</h4>
        <div className="saved-menu-actions">
          <button
            onClick={() => onDelete(menu.id)}
            className="delete-btn"
          >
            🗑️
          </button>
        </div>
      </div>
      
      <div className="saved-menu-date">
        Saved on {new Date(menu.date).toLocaleDateString()}
      </div>
      
      <div className="saved-nutrition-summary">
        <div className="saved-nutrition-item">
          <span className="label">Calories:</span>
          <span className="value">{menu.total_nutrition.calories.toFixed(0)}</span>
        </div>
        <div className="saved-nutrition-item">
          <span className="label">Protein:</span>
          <span className="value">{menu.total_nutrition.protein.toFixed(0)}g</span>
        </div>
        <div className="saved-nutrition-item">
          <span className="label">Carbs:</span>
          <span className="value">{menu.total_nutrition.carbs.toFixed(0)}g</span>
        </div>
        <div className="saved-nutrition-item">
          <span className="label">Fat:</span>
          <span className="value">{menu.total_nutrition.fat.toFixed(0)}g</span>
        </div>
      </div>
      
      <div className="saved-items-count">
        {menu.items.length} items
      </div>
    </div>
  );
};

export default SavedMenuCard; 