import React from 'react';
import MenuCard from './MenuCard';

const MenuResults = ({ loading, generatedMenus, generateMenu, saveMenu }) => {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-animation">
          <div className="cooking-pot">🍳</div>
          <div className="steam">💨</div>
        </div>
        <h3 className="loading-title">Cooking up your perfect menu...</h3>
        <p className="loading-description">
          Our AI chef is carefully selecting the best ingredients for your goals
        </p>
        <div className="loading-progress">
          <div className="progress-bar"></div>
        </div>
      </div>
    );
  }

  if (generatedMenus.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-animation">
          <div className="chef-hat">👨‍🍳</div>
          <div className="sparkles">✨</div>
        </div>
        <h3 className="empty-title">Ready to Create Magic?</h3>
        <p className="empty-description">
          Set your nutrition targets and let our AI chef create the perfect menu for you!
        </p>
        <div className="empty-tips">
          <div className="tip">💡 Try the quick presets for common goals</div>
          <div className="tip">🎯 Adjust macros to match your diet</div>
          <div className="tip">🍽️ Choose a specific meal type for better results</div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-section">
      <div className="results-header">
        <h3 className="results-title">
          🎉 Generated {generatedMenus.length} Menu{generatedMenus.length > 1 ? 's' : ''}
        </h3>
        <div className="results-actions">
          <button
            onClick={generateMenu}
            className="action-btn refresh"
            disabled={loading}
          >
            🔄 Regenerate
          </button>
        </div>
      </div>

      <div className="menus-grid">
        {generatedMenus.map((menu, index) => (
          <MenuCard
            key={index}
            menu={menu}
            index={index}
            onSave={saveMenu}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuResults; 