import React from 'react';
import { formatNutritionValue } from '../../utils/nutritionCalculator';
import { formatMenuForDisplay } from '../../utils/mealGeneration';

const MenuOptionsList = ({ 
  menus, 
  onSelectMenu, 
  title = "Menu Options",
  emptyMessage = "No menus available"
}) => {
  if (!menus || menus.length === 0) {
    return (
      <div className="menu-options-list">
        <h4>{title}</h4>
        <p className="empty-message">{emptyMessage}</p>
      </div>
    );
  }

  const renderNutritionSummary = (nutrition) => {
    if (!nutrition) return null;

    return (
      <div className="nutrition-summary">
        <span className="nutrition-item">
          {formatNutritionValue(nutrition.calories)} kcal
        </span>
        <span className="nutrition-item">
          {formatNutritionValue(nutrition.protein)}g protein
        </span>
        <span className="nutrition-item">
          {formatNutritionValue(nutrition.carbs)}g carbs
        </span>
        <span className="nutrition-item">
          {formatNutritionValue(nutrition.fat)}g fat
        </span>
      </div>
    );
  };

  const renderPriceInfo = (menu) => {
    if (!menu.price_comparison) return null;

    const cheapestStore = menu.price_comparison.cheapest_store;
    if (!cheapestStore) return null;

    return (
      <div className="price-info">
        <span className="price">
          ${formatNutritionValue(cheapestStore.total, 2)}
        </span>
        <span className="store">
          at {cheapestStore.name}
        </span>
      </div>
    );
  };

  return (
    <div className="menu-options-list">
      <h4>{title} ({menus.length})</h4>
      
      <div className="menu-grid">
        {menus.map((menu, index) => {
          const formattedMenu = formatMenuForDisplay(menu);
          
          return (
            <div key={index} className="menu-option-card">
              <div className="menu-header">
                <h5 className="menu-name">
                  {menu.name || `Menu Option ${index + 1}`}
                </h5>
                {menu.description && (
                  <p className="menu-description">{menu.description}</p>
                )}
              </div>
              
              <div className="menu-items">
                <h6>Items ({formattedMenu.formattedItems.length}):</h6>
                <ul className="items-list">
                  {formattedMenu.formattedItems.slice(0, 3).map((item, itemIndex) => (
                    <li key={itemIndex} className="menu-item">
                      <span className="item-name">{item.displayName}</span>
                      <span className="item-quantity">{item.displayQuantity}</span>
                    </li>
                  ))}
                  {formattedMenu.formattedItems.length > 3 && (
                    <li className="more-items">
                      +{formattedMenu.formattedItems.length - 3} more items
                    </li>
                  )}
                </ul>
              </div>
              
              {renderNutritionSummary(formattedMenu.totalNutrition)}
              
              {renderPriceInfo(menu)}
              
              <div className="menu-actions">
                <button
                  onClick={() => onSelectMenu(menu)}
                  className="select-menu-btn"
                >
                  Select This Menu
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuOptionsList;