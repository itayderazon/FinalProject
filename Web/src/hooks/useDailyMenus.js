import { useState, useEffect } from 'react';
import { dailyMenuService } from '../services/dailyMenuService';

export const useDailyMenus = ({ weekRange, selectedDate }) => {
  const [loading, setLoading] = useState(false);
  const [dailyMenus, setDailyMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [weeklyNutrition, setWeeklyNutrition] = useState(null);

  const loadWeeklyMenus = async () => {
    try {
      setLoading(true);
      const response = await dailyMenuService.getUserDailyMenus({
        ...weekRange,
        includeTemplates: false
      });
      setDailyMenus(response.daily_menus || []);
    } catch (error) {
      console.error('Error loading weekly menus:', error);
      setDailyMenus([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuForDate = async (date) => {
    try {
      const response = await dailyMenuService.getDailyMenuByDate(date);
      setSelectedMenu(response.daily_menu);
    } catch (error) {
      if (error.message.includes('No menu found')) {
        setSelectedMenu(null);
      } else {
        console.error('Error loading menu for date:', error);
      }
    }
  };

  const loadWeeklyNutrition = async () => {
    try {
      const response = await dailyMenuService.getNutritionSummary(weekRange);
      setWeeklyNutrition(response.summary);
    } catch (error) {
      console.error('Error loading weekly nutrition:', error);
    }
  };

  const createMenu = async (menuData) => {
    await dailyMenuService.createDailyMenu({
      ...menuData,
      menu_date: selectedDate
    });
    await refreshData();
  };

  const addMeal = async (mealData, mealType) => {
    if (!selectedMenu) {
      throw new Error('No menu selected');
    }

    await dailyMenuService.addMealToDailyMenu(selectedMenu.id, {
      ...mealData,
      meal_type: mealType
    });
    await refreshData();
  };

  const addGeneratedMenu = async (mealType, generatedMenu) => {
    let menuToUse = selectedMenu;
    
    if (!menuToUse) {
      // Create a new daily menu first
      const newMenuData = {
        name: `Daily Menu - ${new Date(selectedDate).toLocaleDateString()}`,
        menu_date: selectedDate,
        description: 'Auto-created for generated meal'
      };
      
      await dailyMenuService.createDailyMenu(newMenuData);
      await loadMenuForDate(selectedDate);
      menuToUse = selectedMenu;
    }

    await dailyMenuService.addGeneratedMenuToDaily(menuToUse.id, {
      meal_type: mealType,
      generated_menu: generatedMenu
    });
    await refreshData();
  };

  const deleteMeal = async (mealId) => {
    if (!selectedMenu) return;

    await dailyMenuService.removeMealFromDailyMenu(selectedMenu.id, mealId);
    await refreshData();
  };

  const refreshData = async () => {
    await Promise.all([
      loadMenuForDate(selectedDate),
      loadWeeklyMenus(),
      loadWeeklyNutrition()
    ]);
  };

  const getDayMenu = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return dailyMenus.find(menu => menu.menu_date === dateStr);
  };

  // Effects
  useEffect(() => {
    if (weekRange.startDate && weekRange.endDate) {
      loadWeeklyMenus();
      loadWeeklyNutrition();
    }
  }, [weekRange.startDate, weekRange.endDate]);

  useEffect(() => {
    if (selectedDate) {
      loadMenuForDate(selectedDate);
    }
  }, [selectedDate]);

  return {
    loading,
    dailyMenus,
    selectedMenu,
    weeklyNutrition,
    createMenu,
    addMeal,
    addGeneratedMenu,
    deleteMeal,
    getDayMenu,
    refreshData
  };
}; 