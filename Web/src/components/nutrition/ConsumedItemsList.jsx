import React from 'react';

const ConsumedItemsList = ({ 
  consumedItems, 
  updateConsumedQuantity, 
  removeFromConsumed,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  dragOverIndex 
}) => {
  
  const formatMacros = (item) => {
    const macros = [];
    if (item.calories) macros.push(`${Math.round(item.calories)} kcal`);
    if (item.protein) macros.push(`${Math.round(item.protein)}g protein`);
    if (item.carbs) macros.push(`${Math.round(item.carbs)}g carbs`);
    if (item.fat) macros.push(`${Math.round(item.fat)}g fat`);
    return macros.join(' • ');
  };

  return (
    <div className="consumed-items">
      <h4>Consumed Today</h4>
      {consumedItems.length === 0 ? (
        <p className="no-consumed-items">
          No items consumed yet. Add items from your planned menu or create custom foods.
        </p>
      ) : (
        <div className="consumed-list">
          {consumedItems.map((item, index) => (
            <div
              key={item.id}
              className={`consumed-item ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="item-info">
                <div className="item-header">
                  <span className="item-name">{item.name}</span>
                  <span className="meal-type-badge">{item.mealType}</span>
                </div>
                <div className="item-macros">
                  {formatMacros(item)}
                </div>
              </div>
              
              <div className="item-controls">
                <div className="quantity-control">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => updateConsumedQuantity(item.id, parseFloat(e.target.value) || 0)}
                    className="quantity-input"
                  />
                  <span className="quantity-unit">g</span>
                </div>
                
                <button
                  onClick={() => removeFromConsumed(item.id)}
                  className="remove-item-btn"
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConsumedItemsList;