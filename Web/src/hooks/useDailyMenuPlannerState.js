import { useState } from 'react';
import { useDateNavigation } from './useDateNavigation';
import { useDailyMenus } from './useDailyMenus';
import { useModalState } from './useModalState';

export const useDailyMenuPlannerState = () => {
  // Main state
  const [activeTab, setActiveTab] = useState('planner');

  // Custom hooks for different concerns
  const dateNavigation = useDateNavigation();
  const {
    selectedDate,
    setSelectedDate,
    currentWeekStart,
    navigateWeek,
    getWeekDays,
    getWeekRange
  } = dateNavigation;

  const menuData = useDailyMenus({
    weekRange: getWeekRange(),
    selectedDate
  });
  const {
    loading,
    dailyMenus,
    selectedMenu,
    weeklyNutrition,
    createMenu,
    addMeal,
    addGeneratedMenu,
    deleteMeal,
    getDayMenu
  } = menuData;

  const modalState = useModalState();
  const {
    showCreateModal,
    showAddMealModal,
    selectedMealType,
    openCreateModal,
    closeCreateModal,
    openAddMealModal,
    closeAddMealModal
  } = modalState;

  // Event handlers
  const handleCreateMenu = async (menuData) => {
    try {
      await createMenu(menuData);
      closeCreateModal();
    } catch (error) {
      console.error('Error creating menu:', error);
      throw error;
    }
  };

  const handleAddMeal = async (mealData) => {
    try {
      await addMeal(mealData, selectedMealType);
      closeAddMealModal();
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  };

  // Return all state and handlers needed by the presentation component
  return {
    // State
    activeTab,
    loading,
    selectedDate,
    currentWeekStart,
    dailyMenus,
    selectedMenu,
    weeklyNutrition,
    weekDays: getWeekDays(),
    
    // Modal state
    showCreateModal,
    showAddMealModal,
    selectedMealType,
    
    // Handlers
    onTabChange: setActiveTab,
    onDateSelect: setSelectedDate,
    onNavigateWeek: navigateWeek,
    onCreateMenu: handleCreateMenu,
    onAddMeal: handleAddMeal,
    onDeleteMeal: deleteMeal,
    onAddGeneratedMenu: addGeneratedMenu,
    
    // Modal handlers
    onOpenCreateModal: openCreateModal,
    onCloseCreateModal: closeCreateModal,
    onOpenAddMealModal: openAddMealModal,
    onCloseAddMealModal: closeAddMealModal,
    
    // Utility functions
    getDayMenu
  };
}; 