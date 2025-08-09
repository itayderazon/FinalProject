import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { DEFAULT_NUTRITION_GOALS } from '../../constants/presets';
import toast from 'react-hot-toast';

const NutritionGoals = ({ 
  dailyGoals, 
  setDailyGoals, 
  showGoalsInput, 
  setShowGoalsInput 
}) => {
  const { user } = useAuth();
  const [tempGoals, setTempGoals] = useState(dailyGoals);
  const [loadingGoals, setLoadingGoals] = useState(false);

  // Load goals from database on component mount
  useEffect(() => {
    const loadNutritionGoals = async () => {
      if (!user?.id) return;
      
      try {
        const goals = await userService.getNutritionGoals(user.id);
        setDailyGoals(goals);
        setTempGoals(goals);
      } catch (error) {
        toast.error('Failed to load nutrition goals');
      }
    };

    loadNutritionGoals();
  }, [user?.id, setDailyGoals]);

  const saveGoals = async () => {
    if (!user?.id) return;
    
    setLoadingGoals(true);
    try {
      await userService.updateNutritionGoals(user.id, tempGoals);
      setDailyGoals(tempGoals);
      setShowGoalsInput(false);
      toast.success('Nutrition goals updated successfully!');
    } catch (error) {
      toast.error('Failed to update nutrition goals');
    } finally {
      setLoadingGoals(false);
    }
  };

  const cancelGoalsEdit = () => {
    setTempGoals(dailyGoals);
    setShowGoalsInput(false);
  };

  const handleGoalChange = (nutrient, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setTempGoals(prev => ({ ...prev, [nutrient]: numValue }));
    }
  };

  return (
    <div className="nutrition-goals">
      <div className="goals-header">
        <h3>Daily Nutrition Goals</h3>
        {!showGoalsInput && (
          <button 
            className="edit-goals-btn"
            onClick={() => setShowGoalsInput(true)}
          >
            Edit Goals
          </button>
        )}
      </div>

      <div className="goals-display">
        {Object.entries(dailyGoals).map(([nutrient, value]) => (
          <div key={nutrient} className="goal-item">
            <span className="goal-label">
              {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}:
            </span>
            <span className="goal-value">
              {value}{nutrient === 'calories' ? ' kcal' : 'g'}
            </span>
          </div>
        ))}
      </div>

      {showGoalsInput && (
        <div className="goals-edit-modal">
          <div className="goals-edit-content">
            <h4>Edit Daily Goals</h4>
            <div className="goals-inputs">
              {Object.entries(tempGoals).map(([nutrient, value]) => (
                <div key={nutrient} className="goal-input-group">
                  <label htmlFor={`goal-${nutrient}`}>
                    {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
                    {nutrient === 'calories' ? ' (kcal)' : ' (g)'}:
                  </label>
                  <input
                    id={`goal-${nutrient}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={value}
                    onChange={(e) => handleGoalChange(nutrient, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="goals-actions">
              <button 
                className="cancel-goals-btn"
                onClick={cancelGoalsEdit}
                disabled={loadingGoals}
              >
                Cancel
              </button>
              <button 
                className="save-goals-btn"
                onClick={saveGoals}
                disabled={loadingGoals}
              >
                {loadingGoals ? 'Saving...' : 'Save Goals'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NutritionGoals;