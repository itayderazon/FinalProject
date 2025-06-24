import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { nutritionService } from '../../services/nutritionService';
import { dailyMenuService } from '../../services/dailyMenuService';
import { formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

const NutritionSummary = ({ weeklyData, dailyMenus }) => {
  const { user } = useAuth();
  
  // State for user goals (daily values)
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
  const [consumedItems, setConsumedItems] = useState([]); // Array of consumed food items
  const [activeTab, setActiveTab] = useState('tracking'); // 'tracking' or 'goals'
  
  // Loading states
  const [showGoalsInput, setShowGoalsInput] = useState(false);
  const [tempGoals, setTempGoals] = useState(dailyGoals);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);

  // Load goals from database on component mount
  useEffect(() => {
    const loadNutritionGoals = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingGoals(true);
        const goals = await userService.getNutritionGoals(user.id);
        setDailyGoals(goals);
        setTempGoals(goals);
      } catch (error) {
        console.error('Error loading nutrition goals:', error);
        toast.error('Failed to load nutrition goals');
      } finally {
        setLoadingGoals(false);
      }
    };

    loadNutritionGoals();
  }, [user?.id]);

  // Load planned menu and nutrition log when date changes
  useEffect(() => {
    if (user?.id && selectedDate) {
      loadPlannedMenu();
      loadNutritionLog();
    }
  }, [user?.id, selectedDate]);

  // Load planned menu for selected date
  const loadPlannedMenu = async () => {
    try {
      setLoadingMenu(true);
      const menu = await dailyMenuService.getDayMenu(selectedDate);
      setPlannedMenu(menu);
    } catch (error) {
      console.error('Error loading planned menu:', error);
      setPlannedMenu(null);
    } finally {
      setLoadingMenu(false);
    }
  };

  // Load nutrition log for selected date
  const loadNutritionLog = async () => {
    try {
      setLoadingLog(true);
      const logs = await nutritionService.getNutritionHistory({
        startDate: selectedDate,
        endDate: selectedDate
      });
      
      if (logs.logs && logs.logs.length > 0) {
        const dayLog = logs.logs[0];
        setNutritionLog(dayLog);
        
        // Convert nutrition log to consumed items format
        const consumed = [];
        if (dayLog.meals) {
          dayLog.meals.forEach(meal => {
            meal.items.forEach(item => {
              consumed.push({
                id: `consumed_${Date.now()}_${Math.random()}`,
                meal_type: meal.meal_type,
                name: item.custom_food_name || item.product_name || 'Unknown Food',
                quantity: item.quantity,
                unit: item.unit || 'grams',
                calories: item.calories || 0,
                protein: item.protein || 0,
                carbs: item.carbs || 0,
                fat: item.fat || 0,
                product_id: item.product_id,
                source: 'logged'
              });
            });
          });
        }
        setConsumedItems(consumed);
      } else {
        setNutritionLog(null);
        setConsumedItems([]);
      }
    } catch (error) {
      console.error('Error loading nutrition log:', error);
      setNutritionLog(null);
      setConsumedItems([]);
    } finally {
      setLoadingLog(false);
    }
  };

  // Add item from planned menu to consumed items
  const addToConsumed = (plannedItem, mealType) => {
    const newItem = {
      id: `consumed_${Date.now()}_${Math.random()}`,
      meal_type: mealType,
      name: plannedItem.custom_food_name || plannedItem.name,
      quantity: plannedItem.quantity,
      unit: plannedItem.unit || 'grams',
      calories: plannedItem.nutrition?.calories || plannedItem.calories || 0,
      protein: plannedItem.nutrition?.protein || plannedItem.protein || 0,
      carbs: plannedItem.nutrition?.carbs || plannedItem.carbs || 0,
      fat: plannedItem.nutrition?.fat || plannedItem.fat || 0,
      product_id: plannedItem.product_id,
      source: 'transferred'
    };
    
    setConsumedItems(prev => [...prev, newItem]);
    toast.success(`Added ${newItem.name} to your food diary`);
  };

  // Remove item from consumed items
  const removeFromConsumed = (itemId) => {
    setConsumedItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Removed item from food diary');
  };

  // Update consumed item quantity
  const updateConsumedQuantity = (itemId, newQuantity) => {
    setConsumedItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const scaleFactor = newQuantity / item.quantity;
        return {
          ...item,
          quantity: newQuantity,
          calories: Math.round((item.calories / item.quantity) * newQuantity),
          protein: Math.round(((item.protein / item.quantity) * newQuantity) * 100) / 100,
          carbs: Math.round(((item.carbs / item.quantity) * newQuantity) * 100) / 100,
          fat: Math.round(((item.fat / item.quantity) * newQuantity) * 100) / 100
        };
      }
      return item;
    }));
  };

  // Add custom food item
  const addCustomFood = () => {
    const name = prompt('Enter food name:');
    if (!name) return;
    
    const quantity = parseFloat(prompt('Enter quantity (grams):') || '100');
    const calories = parseFloat(prompt('Enter calories:') || '0');
    const protein = parseFloat(prompt('Enter protein (g):') || '0');
    const carbs = parseFloat(prompt('Enter carbs (g):') || '0');
    const fat = parseFloat(prompt('Enter fat (g):') || '0');
    
    const newItem = {
      id: `custom_${Date.now()}_${Math.random()}`,
      meal_type: 'snack',
      name: name,
      quantity: quantity,
      unit: 'grams',
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      product_id: null,
      source: 'custom'
    };
    
    setConsumedItems(prev => [...prev, newItem]);
    toast.success(`Added ${name} to your food diary`);
  };

  // Save consumed items to nutrition log
  const saveToNutritionLog = async () => {
    if (consumedItems.length === 0) {
      toast.error('No items to log');
      return;
    }

    try {
      // Group items by meal type
      const mealGroups = {};
      consumedItems.forEach(item => {
        if (!mealGroups[item.meal_type]) {
          mealGroups[item.meal_type] = [];
        }
        mealGroups[item.meal_type].push({
          product_id: item.product_id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          calories: item.calories,
          macros: {
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat
          }
        });
      });

      // Convert to nutrition service format
      const meals = Object.keys(mealGroups).map(mealType => ({
        type: mealType,
        foods: mealGroups[mealType]
      }));

      const nutritionData = {
        date: selectedDate,
        meals: meals
      };

      await nutritionService.logNutrition(nutritionData);
      toast.success('Food diary saved successfully!');
      
      // Reload to get updated totals
      await loadNutritionLog();
    } catch (error) {
      console.error('Error saving nutrition log:', error);
      toast.error('Failed to save food diary');
    }
  };

  // Calculate totals from consumed items
  const calculateConsumedTotals = () => {
    return consumedItems.reduce((totals, item) => ({
      calories: totals.calories + (item.calories || 0),
      protein: totals.protein + (item.protein || 0),
      carbs: totals.carbs + (item.carbs || 0),
      fat: totals.fat + (item.fat || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Calculate daily progress
  const calculateProgress = () => {
    const consumed = calculateConsumedTotals();
    
    return {
      calories: {
        consumed: Math.round(consumed.calories),
        goal: dailyGoals.calories,
        percentage: Math.min(100, (consumed.calories / dailyGoals.calories) * 100)
      },
      protein: {
        consumed: Math.round(consumed.protein * 100) / 100,
        goal: dailyGoals.protein,
        percentage: Math.min(100, (consumed.protein / dailyGoals.protein) * 100)
      },
      carbs: {
        consumed: Math.round(consumed.carbs * 100) / 100,
        goal: dailyGoals.carbs,
        percentage: Math.min(100, (consumed.carbs / dailyGoals.carbs) * 100)
      },
      fat: {
        consumed: Math.round(consumed.fat * 100) / 100,
        goal: dailyGoals.fat,
        percentage: Math.min(100, (consumed.fat / dailyGoals.fat) * 100)
      }
    };
  };

  // Save goals to database
  const saveGoals = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to save goals');
      return;
    }

    try {
      setLoadingGoals(true);
      await userService.updateNutritionGoals(user.id, tempGoals);
      setDailyGoals(tempGoals);
      setShowGoalsInput(false);
      toast.success('Nutrition goals saved successfully!');
    } catch (error) {
      console.error('Error saving nutrition goals:', error);
      toast.error('Failed to save nutrition goals');
    } finally {
      setLoadingGoals(false);
    }
  };

  const cancelGoalsEdit = () => {
    setTempGoals(dailyGoals);
    setShowGoalsInput(false);
  };

  const handleGoalChange = (nutrient, value) => {
    setTempGoals(prev => ({
      ...prev,
      [nutrient]: Math.max(0, parseFloat(value) || 0)
    }));
  };

  const progress = calculateProgress();

  return (
    <div className="nutrition-summary">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Nutrition Tracking</h1>
        <p className="page-subtitle">
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
                    {Math.round(progress.calories.consumed)} / {progress.calories.goal}
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
                    {Math.round(progress.protein.consumed)}g / {progress.protein.goal}g
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
                    {Math.round(progress.carbs.consumed)}g / {progress.carbs.goal}g
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
                    {Math.round(progress.fat.consumed)}g / {progress.fat.goal}g
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

          {/* Food Diary Section */}
          <div className="food-diary-section">
            <div className="diary-header">
              <h3>🍽️ What I Ate Today</h3>
              <div className="diary-actions">
                <button className="add-custom-btn" onClick={addCustomFood}>
                  ➕ Add Custom Food
                </button>
                <button 
                  className="save-diary-btn" 
                  onClick={saveToNutritionLog}
                  disabled={consumedItems.length === 0}
                >
                  💾 Save Food Diary
                </button>
              </div>
            </div>
            
            {consumedItems.length > 0 ? (
              <div className="consumed-items-table">
                <table>
                  <thead>
                    <tr>
                      <th>Food Item</th>
                      <th>Meal Type</th>
                      <th>Quantity</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fat</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="food-name">{item.name}</td>
                        <td className="meal-type">{item.meal_type}</td>
                        <td className="quantity">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateConsumedQuantity(item.id, parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.1"
                          />
                          <span>{item.unit}</span>
                        </td>
                        <td className="calories">{Math.round(item.calories)}</td>
                        <td className="protein">{Math.round(item.protein * 100) / 100}g</td>
                        <td className="carbs">{Math.round(item.carbs * 100) / 100}g</td>
                        <td className="fat">{Math.round(item.fat * 100) / 100}g</td>
                        <td className="actions">
                          <button 
                            className="remove-btn"
                            onClick={() => removeFromConsumed(item.id)}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Totals Row */}
                <div className="diary-totals">
                  <strong>
                    Totals: {Math.round(calculateConsumedTotals().calories)} cal • 
                    P: {Math.round(calculateConsumedTotals().protein * 100) / 100}g • 
                    C: {Math.round(calculateConsumedTotals().carbs * 100) / 100}g • 
                    F: {Math.round(calculateConsumedTotals().fat * 100) / 100}g
                  </strong>
                </div>
              </div>
            ) : (
              <div className="empty-diary">
                <span>🍽️</span>
                <p>Your food diary is empty</p>
                <p>Add items from your planned menu below or add custom foods</p>
              </div>
            )}
          </div>

          {/* Planned Menu Section */}
          <div className="planned-menu-section">
            <h3>📋 Planned Menu</h3>
            
            {loadingMenu ? (
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
                        {meal.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="planned-food-item">
                            <div className="item-details">
                              <div className="item-name">
                                {item.custom_food_name || item.name}
                              </div>
                              <div className="item-nutrition">
                                {item.quantity} {item.unit} • 
                                {Math.round(item.nutrition?.calories || item.calories || 0)} cal • 
                                P: {Math.round(item.nutrition?.protein || item.protein || 0)}g • 
                                C: {Math.round(item.nutrition?.carbs || item.carbs || 0)}g • 
                                F: {Math.round(item.nutrition?.fat || item.fat || 0)}g
                              </div>
                            </div>
                            
                            <button 
                              className="transfer-btn"
                              onClick={() => addToConsumed(item, meal.meal_type)}
                            >
                              ➡️ Add to Diary
                            </button>
                          </div>
                        ))}
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
                <p>Create a menu in the Daily Menu Planner to start tracking your nutrition.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals & Settings Tab */}
      {activeTab === 'goals' && (
        <div className="goals-content">
          {/* Current Goals Display */}
          <div className="current-goals">
            <h3>Daily Nutrition Goals</h3>
            {loadingGoals && !showGoalsInput ? (
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

          {/* Goals Control Section */}
          <div className="goals-control-section">
            <button 
              className="goals-settings-btn"
              onClick={() => setShowGoalsInput(!showGoalsInput)}
              title="Set nutrition goals"
            >
              <span>🎯</span>
              {showGoalsInput ? 'Close Goals' : 'Edit Goals'}
            </button>
          </div>

          {/* Goals Input Section */}
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
      )}
    </div>
  );
};

export default NutritionSummary; 