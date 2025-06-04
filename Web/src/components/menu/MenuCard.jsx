import React, { useState } from 'react';

const MenuCard = ({ menu, index, onSave }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleSave = () => {
    onSave(menu, customName);
    setShowSaveDialog(false);
    setCustomName('');
  };

  return (
    <div className="menu-card">
      {/* Menu Header */}
      <div className="menu-header-card">
        <div className="menu-header-content">
          <div className="menu-info">
            <h4 className="menu-title-card">
              Menu Option {index + 1}
            </h4>
            <div className="menu-score">
              <span className="score-label">Match Score:</span>
              <span className="score-value">{(menu.score * 100).toFixed(1)}%</span>
              <div className="score-bar">
                <div 
                  className="score-fill"
                  style={{ width: `${menu.score * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="menu-actions">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="action-btn save"
            >
              <span>💾</span>
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Nutrition Summary */}
      <div className="nutrition-summary">
        <div className="nutrition-grid">
          <div className="nutrition-item">
            <div className="nutrition-icon calories">⚡</div>
            <div className="nutrition-info">
              <p className="nutrition-label">Calories</p>
              <p className="nutrition-value">{menu.total_nutrition.calories.toFixed(0)}</p>
            </div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-icon protein">🎯</div>
            <div className="nutrition-info">
              <p className="nutrition-label">Protein</p>
              <p className="nutrition-value">{menu.total_nutrition.protein.toFixed(0)}g</p>
            </div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-icon carbs">🟢</div>
            <div className="nutrition-info">
              <p className="nutrition-label">Carbs</p>
              <p className="nutrition-value">{menu.total_nutrition.carbs.toFixed(0)}g</p>
            </div>
          </div>
          <div className="nutrition-item">
            <div className="nutrition-icon fat">🟣</div>
            <div className="nutrition-info">
              <p className="nutrition-label">Fat</p>
              <p className="nutrition-value">{menu.total_nutrition.fat.toFixed(0)}g</p>
            </div>
          </div>
        </div>
      </div>

      {/* Food Items */}
      <div className="food-items">
        <h5 className="items-title">Ingredients:</h5>
        <div className="items-list">
          {menu.items.map((item, itemIndex) => (
            <div key={itemIndex} className="food-item">
              <div className="food-info">
                <h6 className="food-name">{item.name}</h6>
                <p className="food-details">
                  {item.portion_grams.toFixed(0)}g • {item.category || 'Food'}
                </p>
              </div>
              <div className="food-nutrition">
                <p className="food-calories">
                  {item.nutrition.calories.toFixed(0)} cal
                </p>
                <p className="food-macros">
                  P: {item.nutrition.protein.toFixed(0)}g • 
                  C: {item.nutrition.carbs.toFixed(0)}g • 
                  F: {item.nutrition.fat.toFixed(0)}g
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="save-dialog-overlay">
          <div className="save-dialog">
            <h4 className="dialog-title">Save Menu</h4>
            <div className="dialog-field">
              <label className="dialog-label">Menu Name (Optional):</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="dialog-input"
                placeholder={`Menu ${new Date().toLocaleDateString()}`}
              />
            </div>
            <div className="dialog-actions">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="dialog-btn cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="dialog-btn save"
              >
                Save Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCard; 