import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDateNavigation } from './useDateNavigation';
import { useDailyMenus } from './useDailyMenus';
import { useModalState } from './useModalState';

export const useDailyMenuPlannerState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Main state with URL persistence
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'planner'
  );

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

  // Saved menus modal
  const [showSavedMenusModal, setShowSavedMenusModal] = useState(false);
  const [savedMealType, setSavedMealType] = useState('breakfast');

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

  // Open/close saved menus modal
  const openSavedMenusModal = (mealType) => {
    setSavedMealType(mealType || 'breakfast');
    setShowSavedMenusModal(true);
  };
  const closeSavedMenusModal = () => setShowSavedMenusModal(false);

  // Add menu from saved list
  const handleSelectSavedMenu = async (menu) => {
    // Convert saved menu to generated menu format
    const convertedMenu = {
      name: menu.name,
      total_nutrition: menu.total_nutrition,
      items: (menu.items || []).map(item => ({
        name: item.name,
        portion_grams: item.portion_grams,
        nutrition: item.nutrition
      }))
    };
    await addGeneratedMenu(savedMealType, convertedMenu);
    closeSavedMenusModal();
  };

  // Handle tab change with URL persistence
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams);
    if (newTab && newTab !== 'planner') {
      params.set('tab', newTab);
    } else {
      params.delete('tab');
    }
    setSearchParams(params);
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
    showSavedMenusModal,
    savedMealType,
    
    // Handlers
    onTabChange: handleTabChange,
    onDateSelect: setSelectedDate,
    onNavigateWeek: navigateWeek,
    onCreateMenu: handleCreateMenu,
    onAddMeal: handleAddMeal,
    onDeleteMeal: deleteMeal,
    onAddGeneratedMenu: openSavedMenusModal,
    
    // Modal handlers
    onOpenCreateModal: openCreateModal,
    onCloseCreateModal: closeCreateModal,
    onOpenAddMealModal: openAddMealModal,
    onCloseAddMealModal: closeAddMealModal,
    onCloseSavedMenusModal: closeSavedMenusModal,
    onSelectSavedMenu: handleSelectSavedMenu,
    
    // Utility functions
    getDayMenu
  };
}; 