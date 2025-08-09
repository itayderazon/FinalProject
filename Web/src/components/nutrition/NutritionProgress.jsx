import React from 'react';

const NutritionProgress = ({ consumedTotals, dailyGoals }) => {
  const calculateProgress = () => {
    return Object.keys(dailyGoals).reduce((progress, nutrient) => {
      const consumed = consumedTotals[nutrient] || 0;
      const goal = dailyGoals[nutrient] || 1;
      const percentage = Math.min((consumed / goal) * 100, 100);
      
      progress[nutrient] = {
        consumed: Math.round(consumed * 100) / 100,
        goal,
        percentage: Math.round(percentage),
        remaining: Math.max(goal - consumed, 0),
        unit: nutrient === 'calories' ? 'kcal' : 'g'
      };
      
      return progress;
    }, {});
  };

  const progressData = calculateProgress();

  const getProgressBarColor = (percentage) => {
    if (percentage <= 50) return '#ff6b6b';
    if (percentage <= 80) return '#feca57';
    return '#48cab2';
  };

  return (
    <div className="nutrition-progress">
      <h4>Daily Progress</h4>
      <div className="progress-grid">
        {Object.entries(progressData).map(([nutrient, data]) => (
          <div key={nutrient} className="progress-item">
            <div className="progress-header">
              <span className="nutrient-name">
                {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
              </span>
              <span className="progress-text">
                {data.consumed} / {data.goal} {data.unit}
              </span>
            </div>
            
            <div className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: `${data.percentage}%`,
                  backgroundColor: getProgressBarColor(data.percentage)
                }}
              />
            </div>
            
            <div className="progress-stats">
              <span className="percentage">{data.percentage}%</span>
              <span className="remaining">
                {data.remaining > 0 ? `${Math.round(data.remaining * 100) / 100} ${data.unit} left` : 'Goal reached!'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NutritionProgress;