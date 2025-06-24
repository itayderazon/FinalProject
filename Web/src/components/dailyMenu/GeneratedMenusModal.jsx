import React, { useState, useEffect } from 'react';
import { useMenuGenerator } from '../../hooks/useMenuGenerator';
import LoadingSpinner from '../common/LoadingSpinner';

const GeneratedMenusModal = ({ mealType, onSelectMenu, onClose }) => {
  const { savedMenus, generateMenu, loading } = useMenuGenerator();
  const [activeTab, setActiveTab] = useState('saved');
  const [generationParams, setGenerationParams] = useState({
    calories: 500,
    protein: 30,
    carbs: 50,
    fat: 20,
    num_items: 3
  });
  const [generatedMenus, setGeneratedMenus] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const mealTypeInfo = {
    breakfast: { icon: '🌅', defaultCalories: 400 },
    lunch: { icon: '🌞', defaultCalories: 600 },
    dinner: { icon: '🌙', defaultCalories: 700 },
    snack: { icon: '🍎', defaultCalories: 200 }
  };

  useEffect(() => {
    // Set default calories based on meal type
    const defaultCalories = mealTypeInfo[mealType]?.defaultCalories || 500;
    setGenerationParams(prev => ({
      ...prev,
      calories: defaultCalories,
      protein: Math.round(defaultCalories * 0.15 / 4), // 15% protein
      carbs: Math.round(defaultCalories * 0.45 / 4),   // 45% carbs
      fat: Math.round(defaultCalories * 0.35 / 9)      // 35% fat
    }));
  }, [mealType]);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const result = await generateMenu();
      
      if (result && result.data && result.data.menus) {
        setGeneratedMenus(result.data.menus);
        setActiveTab('generated');
      }
    } catch (error) {
      console.error('Error generating menu:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSavedMenu = (menu) => {
    // Convert saved menu format to the format expected by daily menu
    const convertedMenu = {
      name: menu.name,
      total_nutrition: menu.total_nutrition,
      items: menu.items.map(item => ({
        name: item.name,
        portion_grams: item.portion_grams,
        nutrition: item.nutrition
      }))
    };
    onSelectMenu(convertedMenu);
  };

  const handleSelectGeneratedMenu = (menu) => {
    // Generated menus are already in the correct format
    onSelectMenu(menu);
  };

  const formatNutrition = (nutrition) => {
    const safeValue = (value) => {
      if (value === null || value === undefined || value === '' || value === 'NaN' || isNaN(value)) {
        return 0;
      }
      return parseFloat(value) || 0;
    };

    return {
      calories: Math.round(safeValue(nutrition.calories)),
      protein: Math.round(safeValue(nutrition.protein) * 10) / 10,
      carbs: Math.round(safeValue(nutrition.carbs) * 10) / 10,
      fat: Math.round(safeValue(nutrition.fat) * 10) / 10
    };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content generated-menus-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {mealTypeInfo[mealType]?.icon} Add {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            💾 Saved Menus ({savedMenus.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            🎯 Generate New
          </button>
          {generatedMenus.length > 0 && (
            <button
              className={`tab-button ${activeTab === 'generated' ? 'active' : ''}`}
              onClick={() => setActiveTab('generated')}
            >
              ✨ Generated ({generatedMenus.length})
            </button>
          )}
        </div>

        <div className="modal-body">
          {activeTab === 'saved' && (
            <div className="saved-menus-tab">
              {savedMenus.length > 0 ? (
                <div className="menus-grid">
                  {savedMenus.map((menu) => (
                    <div key={menu.id} className="menu-option">
                      <div className="menu-option-header">
                        <h4>{menu.name}</h4>
                        <div className="menu-nutrition">
                          <span className="calories">
                            {formatNutrition(menu.total_nutrition).calories} cal
                          </span>
                          <span className="macros">
                            {formatNutrition(menu.total_nutrition).protein}p | {' '}
                            {formatNutrition(menu.total_nutrition).carbs}c | {' '}
                            {formatNutrition(menu.total_nutrition).fat}f
                          </span>
                        </div>
                      </div>
                      
                      <div className="menu-items">
                        {menu.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="item-preview">
                            <span className="item-name">{item.name}</span>
                            <span className="item-portion">
                              {Math.round(item.portion_grams)}g
                            </span>
                          </div>
                        ))}
                        {menu.items.length > 3 && (
                          <div className="more-items">
                            +{menu.items.length - 3} more items
                          </div>
                        )}
                      </div>

                      <button
                        className="select-menu-btn"
                        onClick={() => handleSelectSavedMenu(menu)}
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
                  <p>Generate and save some menus first, then you can add them to your daily plan.</p>
                  <button
                    className="generate-new-btn"
                    onClick={() => setActiveTab('generate')}
                  >
                    Generate New Menu
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="generate-tab">
              <div className="generation-form">
                <h4>Generate menu for {mealType}</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Calories</label>
                    <input
                      type="number"
                      value={generationParams.calories}
                      onChange={(e) => setGenerationParams(prev => ({
                        ...prev,
                        calories: parseInt(e.target.value) || 0
                      }))}
                      min="100"
                      max="2000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Items</label>
                    <input
                      type="number"
                      value={generationParams.num_items}
                      onChange={(e) => setGenerationParams(prev => ({
                        ...prev,
                        num_items: parseInt(e.target.value) || 1
                      }))}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input
                      type="number"
                      value={generationParams.protein}
                      onChange={(e) => setGenerationParams(prev => ({
                        ...prev,
                        protein: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="200"
                    />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input
                      type="number"
                      value={generationParams.carbs}
                      onChange={(e) => setGenerationParams(prev => ({
                        ...prev,
                        carbs: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="300"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input
                      type="number"
                      value={generationParams.fat}
                      onChange={(e) => setGenerationParams(prev => ({
                        ...prev,
                        fat: parseInt(e.target.value) || 0
                      }))}
                      min="0"
                      max="150"
                    />
                  </div>
                </div>

                <button
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <LoadingSpinner size="small" />
                      Generating...
                    </>
                  ) : (
                    '🎯 Generate Menu'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'generated' && (
            <div className="generated-tab">
              {generatedMenus.length > 0 ? (
                <div className="menus-grid">
                  {generatedMenus.map((menu, index) => (
                    <div key={index} className="menu-option">
                      <div className="menu-option-header">
                        <h4>Generated Menu {index + 1}</h4>
                        <div className="menu-nutrition">
                          <span className="calories">
                            {formatNutrition(menu.total_nutrition).calories} cal
                          </span>
                          <span className="macros">
                            {formatNutrition(menu.total_nutrition).protein}p | {' '}
                            {formatNutrition(menu.total_nutrition).carbs}c | {' '}
                            {formatNutrition(menu.total_nutrition).fat}f
                          </span>
                        </div>
                      </div>
                      
                      <div className="menu-items">
                        {menu.items.slice(0, 3).map((item, itemIndex) => (
                          <div key={itemIndex} className="item-preview">
                            <span className="item-name">{item.name}</span>
                            <span className="item-portion">
                              {Math.round(item.portion_grams)}g
                            </span>
                          </div>
                        ))}
                        {menu.items.length > 3 && (
                          <div className="more-items">
                            +{menu.items.length - 3} more items
                          </div>
                        )}
                      </div>

                      <button
                        className="select-menu-btn"
                        onClick={() => handleSelectGeneratedMenu(menu)}
                      >
                        Add to {mealType}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">🎯</span>
                  <h4>No generated menus</h4>
                  <p>Generate some menus using the form above.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedMenusModal; 