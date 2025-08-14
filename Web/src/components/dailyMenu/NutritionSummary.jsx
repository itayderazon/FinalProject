import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { nutritionService } from '../../services/nutritionService';
import { dailyMenuService } from '../../services/dailyMenuService';
import { formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';
import '../../styles/daily-menu-planner/components/NutritionSummary.css';

const NutritionSummary = ({ weeklyData, dailyMenus }) => {
  const { user } = useAuth();
  
  // State for user goals
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 140,
    carbs: 250,
    fat: 70
  });
  
  // State for nutrition tracking
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedMenu, setPlannedMenu] = useState(null);
  const [nutritionLog, setNutritionLog] = useState(null);
  const [diaryItems, setDiaryItems] = useState([]); // Simplified: just diary items
  const [activeTab, setActiveTab] = useState('tracking');
  
  // Loading states
  const [showGoalsInput, setShowGoalsInput] = useState(false);
  const [tempGoals, setTempGoals] = useState(dailyGoals);
  const [loading, setLoading] = useState({ goals: false, menu: false, log: false });

  // Simple ID counter for new items
  let itemIdCounter = 1;

  // Load goals from database
  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(prev => ({ ...prev, goals: true }));
        const goals = await userService.getNutritionGoals(user.id);
        setDailyGoals(goals);
        setTempGoals(goals);
      } catch (error) {
        console.error('Error loading nutrition goals:', error);
        toast.error('Failed to load nutrition goals');
      } finally {
        setLoading(prev => ({ ...prev, goals: false }));
      }
    };

    loadGoals();
  }, [user?.id]);

  // Load data when date changes
  useEffect(() => {
    if (user?.id && selectedDate) {
      loadData();
    }
  }, [user?.id, selectedDate]);

  // Load all data for selected date
  const loadData = async () => {
    await Promise.all([
      loadPlannedMenu(),
      loadNutritionLog()
    ]);
  };

  // Load planned menu
  const loadPlannedMenu = async () => {
    try {
      setLoading(prev => ({ ...prev, menu: true }));
      const menu = await dailyMenuService.getDayMenu(selectedDate);
      setPlannedMenu(menu);
    } catch (error) {
      console.error('Error loading planned menu:', error);
      setPlannedMenu(null);
    } finally {
      setLoading(prev => ({ ...prev, menu: false }));
    }
  };

  // Load nutrition log and convert to diary items
  const loadNutritionLog = async () => {
    try {
      setLoading(prev => ({ ...prev, log: true }));
      const logs = await nutritionService.getNutritionHistory({
        startDate: selectedDate,
        endDate: selectedDate,
        includeMeals: 'true'
      });
      
      if (logs.logs && logs.logs.length > 0) {
        const dayLog = logs.logs[0];
        setNutritionLog(dayLog);
        
        // Convert to simplified diary items
        const items = [];
        if (dayLog.meals) {
          dayLog.meals.forEach(meal => {
            if (meal.items) {
              meal.items.forEach(item => {
                items.push({
                  id: item.id,
                  name: item.custom_food_name || item.product_name || 'Unknown Food',
                  mealType: meal.meal_type,
                  quantity: parseFloat(item.quantity) || 0,
                  unit: item.unit || 'grams',
                  calories: parseFloat(item.calories) || 0,
                  protein: parseFloat(item.protein) || 0,
                  carbs: parseFloat(item.carbs) || 0,
                  fat: parseFloat(item.fat) || 0,
                  productId: item.product_id,
                  saved: true, // This item is saved in database
                  mealId: meal.id
                });
              });
            }
          });
        }
        setDiaryItems(items);
      } else {
        setNutritionLog(null);
        setDiaryItems([]);
      }
    } catch (error) {
      setNutritionLog(null);
      setDiaryItems([]);
    } finally {
      setLoading(prev => ({ ...prev, log: false }));
    }
  };

  // Add item from planned menu to diary (auto-save to DB)
  const addToDiary = async (plannedItem, mealType) => {
    // Check for duplicates
    const isDuplicate = diaryItems.some(item => {
      const sameProduct = plannedItem.product_id ? 
        item.productId === plannedItem.product_id :
        item.name === (plannedItem.custom_food_name || plannedItem.name);
      return sameProduct && item.mealType === mealType;
    });

    if (isDuplicate) {
      toast.error(`${plannedItem.custom_food_name || plannedItem.name} is already in your ${mealType}`);
      return;
    }

    // Sanitize and normalize nutrition values (fallback to nested nutrition object if needed)
    const coerceNumber = (value) => {
      if (value === null || value === undefined || value === '' || value === 'NaN') return 0;
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    const normalized = {
      quantity: coerceNumber(plannedItem.quantity),
      unit: plannedItem.unit || 'grams',
      calories: coerceNumber(plannedItem.calories ?? plannedItem.nutrition?.calories),
      protein: coerceNumber(plannedItem.protein ?? plannedItem.nutrition?.protein),
      carbs: coerceNumber(plannedItem.carbs ?? plannedItem.nutrition?.carbs),
      fat: coerceNumber(plannedItem.fat ?? plannedItem.nutrition?.fat)
    };

    // Persist immediately to backend and refresh log
    try {
      await nutritionService.logNutrition({
        date: selectedDate,
        meals: [
          {
            type: mealType,
            foods: [
              {
                product_id: plannedItem.product_id,
                name: plannedItem.custom_food_name || plannedItem.name,
                quantity: normalized.quantity,
                unit: normalized.unit,
                calories: normalized.calories,
                macros: {
                  protein: normalized.protein,
                  carbs: normalized.carbs,
                  fat: normalized.fat
                }
              }
            ]
          }
        ]
      });
      toast.success(`Added ${plannedItem.custom_food_name || plannedItem.name} to diary`);
      await loadNutritionLog();
    } catch (error) {
      console.error('Error logging item:', error);
      toast.error('Failed to add item to diary');
    }
  };

  // Remove item from diary
  const removeFromDiary = async (itemId) => {
    const item = diaryItems.find(i => i.id === itemId);
    if (!item) return;

    // If saved item, delete from database
    if (item.saved) {
      try {
        await nutritionService.deleteNutritionItem(itemId, selectedDate);
        await loadNutritionLog(); // Reload to sync
        toast.success('Item removed from database');
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Failed to remove item');
      }
    } else {
      // Just remove from local state
      setDiaryItems(prev => prev.filter(i => i.id !== itemId));
      toast.success('Item removed');
    }
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    setDiaryItems(prev => prev.map(item => {
      if (item.id === itemId && item.quantity > 0) {
        const ratio = newQuantity / item.quantity;
        return {
          ...item,
          quantity: newQuantity,
          calories: Math.round(item.calories * ratio * 100) / 100,
          protein: Math.round(item.protein * ratio * 100) / 100,
          carbs: Math.round(item.carbs * ratio * 100) / 100,
          fat: Math.round(item.fat * ratio * 100) / 100
        };
      }
      return item;
    }));
  };

  // Add custom food (auto-save)
  const addCustomFood = async () => {
    const name = prompt('Food name:');
    if (!name) return;
    
    const quantity = parseFloat(prompt('Quantity (grams):', '100')) || 100;
    const calories = parseFloat(prompt('Calories:', '0')) || 0;
    const protein = parseFloat(prompt('Protein (g):', '0')) || 0;
    const carbs = parseFloat(prompt('Carbs (g):', '0')) || 0;
    const fat = parseFloat(prompt('Fat (g):', '0')) || 0;
    
    try {
      await nutritionService.logNutrition({
        date: selectedDate,
        meals: [
          {
            type: 'snack',
            foods: [
              {
                product_id: null,
                name,
                quantity,
                unit: 'grams',
                calories,
                macros: { protein, carbs, fat }
              }
            ]
          }
        ]
      });
      toast.success(`Added ${name} to diary`);
      await loadNutritionLog();
    } catch (error) {
      console.error('Error adding custom food:', error);
      toast.error('Failed to add custom food');
    }
  };

  // Removed manual save; auto-saved on add

  // Calculate totals
  const calculateTotals = () => {
    return diaryItems.reduce((totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      protein: totals.protein + (item.protein || 0),
      carbs: totals.carbs + (item.carbs || 0),
      fat: totals.fat + (item.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Calculate progress
  const calculateProgress = () => {
    const totals = calculateTotals();
    
    return {
      calories: {
        consumed: Math.round(totals.calories),
        goal: dailyGoals.calories,
        percentage: Math.min(100, (totals.calories / dailyGoals.calories) * 100)
      },
      protein: {
        consumed: Math.round(totals.protein * 100) / 100,
        goal: dailyGoals.protein,
        percentage: Math.min(100, (totals.protein / dailyGoals.protein) * 100)
      },
      carbs: {
        consumed: Math.round(totals.carbs * 100) / 100,
        goal: dailyGoals.carbs,
        percentage: Math.min(100, (totals.carbs / dailyGoals.carbs) * 100)
      },
      fat: {
        consumed: Math.round(totals.fat * 100) / 100,
        goal: dailyGoals.fat,
        percentage: Math.min(100, (totals.fat / dailyGoals.fat) * 100)
      }
    };
  };

  // Save goals
  const saveGoals = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save goals');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, goals: true }));
      await userService.updateNutritionGoals(user.id, tempGoals);
      setDailyGoals(tempGoals);
      setShowGoalsInput(false);
      toast.success('Goals saved successfully!');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Failed to save goals');
    } finally {
      setLoading(prev => ({ ...prev, goals: false }));
    }
  };

  const handleGoalChange = (nutrient, value) => {
    setTempGoals(prev => ({
      ...prev,
      [nutrient]: Math.max(0, parseFloat(value) || 0)
    }));
  };

  const progress = calculateProgress();
  const totals = calculateTotals();
  // No unsaved concept when auto-saving

  return (
    <div className="nutrition-summary">
      {/* Header */}
      <div className="page-header nutrition-page-header">
        <h1 className="page-title nutrition-page-title" style={{ color: '#ffffff' }}>Nutrition Tracking</h1>
        <p className="page-subtitle nutrition-page-subtitle" style={{ color: '#ffffff' }}>
          Track your daily nutrition and monitor progress toward your goals
        </p>
      </div>

      {/* Tabs */}
      <div className="nutrition-tabs">
        <button 
          className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracking')}
        >
          📊 Daily Tracking
        </button>
        <button 
          className={`tab-button ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          🎯 Goals & Settings
        </button>
      </div>

      {/* Daily Tracking Tab */}
      {activeTab === 'tracking' && (
        <div className="tracking-content">
          {/* Date Selector */}
          <div className="date-selector">
            <label htmlFor="tracking-date">Select Date:</label>
            <input
              id="tracking-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Progress Overview */}
          <div className="progress-overview">
            <h3>Daily Progress - {formatDate(selectedDate)}</h3>
            
            <div className="progress-grid">
              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-icon">⚡</span>
                  <span className="progress-label">Calories</span>
                  <span className="progress-values">
                    {progress.calories.consumed} / {progress.calories.goal}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill calories"
                    style={{ width: `${progress.calories.percentage}%` }}
                  ></div>
                </div>
                <span className="progress-percentage">{Math.round(progress.calories.percentage)}%</span>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-icon">🥩</span>
                  <span className="progress-label">Protein</span>
                  <span className="progress-values">
                    {progress.protein.consumed}g / {progress.protein.goal}g
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill protein"
                    style={{ width: `${progress.protein.percentage}%` }}
                  ></div>
                </div>
                <span className="progress-percentage">{Math.round(progress.protein.percentage)}%</span>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-icon">🌾</span>
                  <span className="progress-label">Carbs</span>
                  <span className="progress-values">
                    {progress.carbs.consumed}g / {progress.carbs.goal}g
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill carbs"
                    style={{ width: `${progress.carbs.percentage}%` }}
                  ></div>
                </div>
                <span className="progress-percentage">{Math.round(progress.carbs.percentage)}%</span>
              </div>

              <div className="progress-item">
                <div className="progress-header">
                  <span className="progress-icon">🥑</span>
                  <span className="progress-label">Fat</span>
                  <span className="progress-values">
                    {progress.fat.consumed}g / {progress.fat.goal}g
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill fat"
                    style={{ width: `${progress.fat.percentage}%` }}
                  ></div>
                </div>
                <span className="progress-percentage">{Math.round(progress.fat.percentage)}%</span>
              </div>
            </div>
          </div>

          {/* Side by Side Layout */}
          <div className="side-by-side-container">
            {/* Food Diary Section */}
            <div className="food-diary-section">
              <div className="diary-header">
                <h3>🍽️ Food Diary</h3>
                <div className="diary-actions">
                  <button className="ns-btn ns-btn--secondary ns-btn--sm" onClick={addCustomFood}>
                    ➕ Add Custom Food
                  </button>
                </div>
              </div>
              
              {diaryItems.length > 0 ? (
                <div className="consumed-items-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Food Item</th>
                        <th>Meal</th>
                        <th>Quantity</th>
                        <th>Calories</th>
                        <th>Protein</th>
                        <th>Carbs</th>
                        <th>Fat</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {diaryItems.map((item) => (
                        <tr key={item.id} className={item.saved ? 'saved' : 'unsaved'}>
                          <td className="food-name">
                            {item.name}
                            {!item.saved && <span className="unsaved-indicator">*</span>}
                          </td>
                          <td className="meal-type">{item.mealType}</td>
                          <td className="quantity">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.1"
                            />
                            <span>{item.unit}</span>
                          </td>
                          <td className="calories">{Math.round(item.calories * 100) / 100}</td>
                          <td className="protein">{Math.round(item.protein * 100) / 100}g</td>
                          <td className="carbs">{Math.round(item.carbs * 100) / 100}g</td>
                          <td className="fat">{Math.round(item.fat * 100) / 100}g</td>
                          <td className="actions">
                            <button 
                              className="ns-btn ns-btn--danger ns-btn--sm"
                              onClick={() => removeFromDiary(item.id)}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Totals */}
                  <div className="diary-totals">
                    <strong>
                      Totals: {Math.round(totals.calories)} cal • 
                      P: {Math.round(totals.protein * 100) / 100}g • 
                      C: {Math.round(totals.carbs * 100) / 100}g • 
                      F: {Math.round(totals.fat * 100) / 100}g
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="empty-diary">
                  <span>🍽️</span>
                  <p>Your food diary is empty</p>
                  <p>Add items from your planned menu or add custom foods</p>
                </div>
              )}
            </div>

            {/* Planned Menu Section */}
            <div className="planned-menu-section">
              <h3>📋 Planned Menu</h3>
              
              {loading.menu ? (
                <div className="loading-state">
                  <span>⏳</span>
                  <span>Loading planned menu...</span>
                </div>
              ) : plannedMenu && plannedMenu.daily_menu && plannedMenu.daily_menu.meals && plannedMenu.daily_menu.meals.length > 0 ? (
                <div className="planned-meals">
                  {plannedMenu.daily_menu.meals.map((meal, mealIndex) => (
                    <div key={mealIndex} className="meal-section">
                      <h4 className="meal-title">
                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                        {meal.name && ` - ${meal.name}`}
                      </h4>
                      
                      {meal.items && meal.items.length > 0 ? (
                        <div className="meal-items">
                          {meal.items.map((item, itemIndex) => {
                            const coerceNumber = (value) => {
                              if (value === null || value === undefined || value === '' || value === 'NaN') return 0;
                              const parsed = parseFloat(value);
                              return Number.isNaN(parsed) ? 0 : parsed;
                            };
                            const quantity = coerceNumber(item.quantity);
                            const unit = item.unit || 'grams';
                            const calories = coerceNumber(item.calories ?? item.nutrition?.calories);
                            const protein = coerceNumber(item.protein ?? item.nutrition?.protein);
                            const carbs = coerceNumber(item.carbs ?? item.nutrition?.carbs);
                            const fat = coerceNumber(item.fat ?? item.nutrition?.fat);
                            // Check if already in diary
                            const isDuplicate = diaryItems.some(diaryItem => {
                              const sameProduct = item.product_id ? 
                                diaryItem.productId === item.product_id :
                                diaryItem.name === (item.custom_food_name || item.name);
                              return sameProduct && diaryItem.mealType === meal.meal_type;
                            });
                            
                            return (
                              <div key={itemIndex} className={`planned-food-item ${isDuplicate ? 'already-added' : ''}`}>
                                <div className="item-details">
                                  <div className="item-name">
                                    {item.custom_food_name || item.name}
                                  </div>
                                  <div className="item-nutrition">
                                      <span className="nutrition-chunk">{Math.round(quantity * 100) / 100} {unit}</span>
                                      <span className="nutrition-chunk">{Math.round(calories * 100) / 100} cal</span>
                                      <span className="nutrition-chunk">P: {Math.round(protein * 100) / 100}g</span>
                                      <span className="nutrition-chunk">C: {Math.round(carbs * 100) / 100}g</span>
                                      <span className="nutrition-chunk">F: {Math.round(fat * 100) / 100}g</span>
                                  </div>
                                </div>
                                
                                <button 
                                  className={`ns-btn ns-btn--success ns-btn--sm ${isDuplicate ? 'is-disabled' : ''}`}
                                  onClick={() => addToDiary(item, meal.meal_type)}
                                  disabled={isDuplicate}
                                >
                                  {isDuplicate ? '✓ Added' : 'Add'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="no-items">No items in this meal</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-menu">
                  <span>📝</span>
                  <p>No planned menu for {formatDate(selectedDate)}</p>
                  <p>Create a menu in the Daily Menu Planner to start tracking.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="goals-content">
          <div className="current-goals">
            <h3>Daily Nutrition Goals</h3>
            {loading.goals && !showGoalsInput ? (
              <div className="goals-loading">
                <span>⏳</span>
                <span>Loading nutrition goals...</span>
              </div>
            ) : (
              <div className="goals-display">
                <div className="goal-display-item">
                  <span className="goal-icon">⚡</span>
                  <span className="goal-value">{dailyGoals.calories}</span>
                  <span className="goal-label">calories</span>
                </div>
                <div className="goal-display-item">
                  <span className="goal-icon">🥩</span>
                  <span className="goal-value">{dailyGoals.protein}g</span>
                  <span className="goal-label">protein</span>
                </div>
                <div className="goal-display-item">
                  <span className="goal-icon">🌾</span>
                  <span className="goal-value">{dailyGoals.carbs}g</span>
                  <span className="goal-label">carbs</span>
                </div>
                <div className="goal-display-item">
                  <span className="goal-icon">🥑</span>
                  <span className="goal-value">{dailyGoals.fat}g</span>
                  <span className="goal-label">fat</span>
                </div>
              </div>
            )}
          </div>

          <div className="goals-control-section">
            <button 
              className="ns-btn ns-btn--secondary"
              onClick={() => setShowGoalsInput(!showGoalsInput)}
            >
              <span>🎯</span>
              {showGoalsInput ? 'Close Goals' : 'Edit Goals'}
            </button>
          </div>

          {showGoalsInput && (
            <div className="goals-input-section">
              <div className="goals-card">
                <h3 className="goals-title">Set Daily Nutrition Goals</h3>
                <div className="goals-grid">
                  <div className="goal-input-group">
                    <label>Calories</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        value={tempGoals.calories}
                        onChange={(e) => handleGoalChange('calories', e.target.value)}
                        min="0"
                        step="50"
                      />
                      <span className="input-unit">cal</span>
                    </div>
                  </div>
                  <div className="goal-input-group">
                    <label>Protein</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        value={tempGoals.protein}
                        onChange={(e) => handleGoalChange('protein', e.target.value)}
                        min="0"
                        step="5"
                      />
                      <span className="input-unit">g</span>
                    </div>
                  </div>
                  <div className="goal-input-group">
                    <label>Carbs</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        value={tempGoals.carbs}
                        onChange={(e) => handleGoalChange('carbs', e.target.value)}
                        min="0"
                        step="5"
                      />
                      <span className="input-unit">g</span>
                    </div>
                  </div>
                  <div className="goal-input-group">
                    <label>Fat</label>
                    <div className="input-wrapper">
                      <input
                        type="number"
                        value={tempGoals.fat}
                        onChange={(e) => handleGoalChange('fat', e.target.value)}
                        min="0"
                        step="5"
                      />
                      <span className="input-unit">g</span>
                    </div>
                  </div>
                </div>
                <div className="goals-actions">
                  <button 
                    className="ns-btn ns-btn--secondary"
                    onClick={() => {
                      setTempGoals(dailyGoals);
                      setShowGoalsInput(false);
                    }}
                    disabled={loading.goals}
                  >
                    Cancel
                  </button>
                  <button 
                    className="ns-btn ns-btn--primary"
                    onClick={saveGoals}
                    disabled={loading.goals}
                  >
                    {loading.goals ? 'Saving...' : 'Save Goals'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NutritionSummary;