import React from 'react';

const NutritionPresets = ({ presets, onApplyPreset }) => {
  if (!presets || Object.keys(presets).length === 0) {
    return null;
  }

  const presetLabels = {
    weightLoss: 'Weight Loss',
    maintenance: 'Maintenance', 
    bulking: 'Bulking'
  };

  const presetIcons = {
    weightLoss: '🔥',
    maintenance: '⚖️',
    bulking: '💪'
  };

  return (
    <div className="nutrition-presets">
      <h4>Quick Presets</h4>
      <div className="preset-buttons">
        {Object.entries(presets).map(([key, preset]) => (
          <button
            key={key}
            type="button"
            onClick={() => onApplyPreset(key)}
            className="preset-btn"
            title={`${presetLabels[key] || key}: ${preset.calories} kcal, ${preset.protein}g protein, ${preset.carbs}g carbs, ${preset.fat}g fat`}
          >
            <span className="preset-icon">{presetIcons[key] || '🍽️'}</span>
            <span className="preset-label">{presetLabels[key] || key}</span>
            <span className="preset-calories">{preset.calories} kcal</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NutritionPresets;