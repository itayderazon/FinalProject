import React, { useState } from 'react';

const MenuCard = ({ menu, index, onSave }) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customName, setCustomName] = useState('');

  const handleSave = () => {
    onSave(menu, customName);
    setShowSaveDialog(false);
    setCustomName('');
  };

  // Helper function to format currency
  const formatPrice = (price, currency = '₪') => {
    if (!price && price !== 0) return 'N/A';
    return `${price.toFixed(2)} ${currency}`;
  };

  // Helper function to get the cheapest supermarket
  const getCheapestOption = () => {
    if (!menu.price_comparison || !menu.price_comparison.supermarket_totals) {
      console.log('No price comparison data available for menu');
      return null;
    }
    
    console.log('Price comparison data:', menu.price_comparison);
    
    const totals = menu.price_comparison.supermarket_totals;
    let cheapest = null;
    let minPrice = Infinity;
    
    Object.entries(totals).forEach(([name, data]) => {
      const totalCost = typeof data === 'object' ? data.total_cost : data;
      if (totalCost < minPrice) {
        minPrice = totalCost;
        cheapest = { 
          name, 
          total_cost: totalCost,
          items_found: typeof data === 'object' ? data.items_found : 0,
          total_items: typeof data === 'object' ? data.total_items : 0,
          savings: 0 // Will be calculated if needed
        };
      }
    });
    
    // Calculate savings compared to most expensive option
    if (cheapest) {
      let maxPrice = 0;
      Object.entries(totals).forEach(([name, data]) => {
        const totalCost = typeof data === 'object' ? data.total_cost : data;
        if (totalCost > maxPrice) {
          maxPrice = totalCost;
        }
      });
      cheapest.savings = maxPrice - cheapest.total_cost;
    }
    
    return cheapest;
  };

  const cheapestOption = getCheapestOption();

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

      {/* Price Comparison Section */}
      {menu.price_comparison && (
        <div className="price-comparison-section">
          <h5 className="price-title">💰 Price Comparison</h5>
          
          {/* Cheapest Option Highlight */}
          {cheapestOption && (
            <div className="cheapest-option">
              <div className="cheapest-header">
                <span className="cheapest-icon">🏆</span>
                <span className="cheapest-label">Best Deal:</span>
                <span className="cheapest-supermarket">{cheapestOption.name}</span>
                <span className="cheapest-price">{formatPrice(cheapestOption.total_cost)}</span>
              </div>
              <div className="cheapest-details">
                {cheapestOption.items_found}/{cheapestOption.total_items} items available
                {cheapestOption.savings > 0 && (
                  <span className="savings">
                    💚 Save {formatPrice(cheapestOption.savings)}!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Supermarket Comparison */}
          {menu.price_comparison.supermarket_totals && (
            <div className="supermarket-grid">
              {Object.entries(menu.price_comparison.supermarket_totals).map(([supermarket, data]) => {
                const totalCost = typeof data === 'object' ? data.total_cost : data;
                const itemsFound = typeof data === 'object' ? data.items_found : 0;
                const totalItems = typeof data === 'object' ? data.total_items : menu.items.length;
                
                return (
                  <div 
                    key={supermarket} 
                    className={`supermarket-card ${supermarket === cheapestOption?.name ? 'cheapest' : ''}`}
                  >
                    <div className="supermarket-header">
                      <h6 className="supermarket-name">{supermarket}</h6>
                      <p className="supermarket-price">{formatPrice(totalCost)}</p>
                    </div>
                    <div className="supermarket-details">
                      <p className="availability">
                        {itemsFound}/{totalItems} items available
                      </p>
                      {itemsFound < totalItems && (
                        <p className="missing-items">
                          {totalItems - itemsFound} items missing
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Detailed Price Breakdown */}
          {menu.price_comparison.item_breakdown && (
            <div className="price-breakdown">
              <details className="breakdown-details">
                <summary className="breakdown-summary">
                  📊 View Detailed Price Breakdown
                </summary>
                <div className="breakdown-content">
                  {menu.price_comparison.item_breakdown.map((item, idx) => (
                    <div key={idx} className="item-price-row">
                      <h6 className="item-name">{item.name}</h6>
                      <div className="item-prices">
                        {item.prices_per_supermarket && Object.entries(item.prices_per_supermarket).map(([supermarket, price]) => (
                          <div key={supermarket} className="supermarket-price-item">
                            <span className="supermarket-name-small">{supermarket}:</span>
                            <span className="price-value">
                              {price ? formatPrice(price) : 'N/A'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

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