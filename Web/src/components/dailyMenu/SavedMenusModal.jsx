import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useMenuGenerator } from '../../hooks/useMenuGenerator';

const SavedMenusModal = ({ mealType, onSelectMenu, onClose }) => {
  const { savedMenus, loading } = useMenuGenerator();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content generated-menus-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            💾 Saved Menus · Add to {mealType}
          </h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
              <LoadingSpinner />
            </div>
          ) : savedMenus && savedMenus.length > 0 ? (
            <div className="menus-grid">
              {savedMenus.map((menu) => (
                <div key={menu.id} className="menu-option">
                  <div className="menu-option-header">
                    <h4>{menu.name}</h4>
                    {menu.total_nutrition && (
                      <div className="menu-nutrition">
                        <span className="calories">
                          {Math.round((menu.total_nutrition.calories || 0))} cal
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="menu-items">
                    {(menu.items || []).slice(0, 3).map((item, index) => (
                      <div key={index} className="item-preview">
                        <span className="item-name">{item.name}</span>
                        {item.portion_grams != null && (
                          <span className="item-portion">{Math.round(item.portion_grams)}g</span>
                        )}
                      </div>
                    ))}
                    {menu.items && menu.items.length > 3 && (
                      <div className="more-items">
                        +{menu.items.length - 3} more items
                      </div>
                    )}
                  </div>

                  <button
                    className="select-menu-btn"
                    onClick={() => onSelectMenu(menu)}
                  >
                    Add to {mealType}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📁</span>
              <h4>No saved menus</h4>
              <p>Save menus from the generator to reuse them here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedMenusModal;


