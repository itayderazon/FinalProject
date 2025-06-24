import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDateNavigation } from '../hooks/useDateNavigation';
import { useDailyMenus } from '../hooks/useDailyMenus';
import { useModalState } from '../hooks/useModalState';
import CreateMenuModal from '../components/dailyMenu/CreateMenuModal';
import AddMealModal from '../components/dailyMenu/AddMealModal';
import NutritionSummary from '../components/dailyMenu/NutritionSummary';
import WeekNavigation from '../components/dailyMenu/WeekNavigation';
import WeeklyCalendar from '../components/dailyMenu/WeeklyCalendar';
import DayDetail from '../components/dailyMenu/DayDetail';
import PlannerTabs from '../components/dailyMenu/PlannerTabs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/DailyMenuPlanner.css';

const DailyMenuPlanner = () => {
  const { user } = useAuth();
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

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading your meal plans..." />;
  }

  return (
    <div className="daily-menu-planner">
      <div className="planner-container">
        {/* Header */}
        <div className="planner-header">
          <h1 className="planner-title">
            <span>📅</span>
            Daily Menu Planner
          </h1>
          <p className="planner-description">
            Plan your meals for the week and add generated menus to specific days
          </p>
        </div>

        {/* Tabs */}
        <PlannerTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />

        {/* Content */}
        {activeTab === 'planner' && (
          <div className="planner-content">
            <WeekNavigation 
              currentWeekStart={currentWeekStart}
              onNavigateWeek={navigateWeek}
            />

            <WeeklyCalendar 
              weekDays={getWeekDays()}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              getDayMenu={getDayMenu}
            />

            <DayDetail 
              selectedDate={selectedDate}
              selectedMenu={selectedMenu}
              onCreateMenu={openCreateModal}
              onAddMeal={openAddMealModal}
              onDeleteMeal={deleteMeal}
              onAddGeneratedMenu={addGeneratedMenu}
            />
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div className="nutrition-content">
            <NutritionSummary 
              weeklyData={weeklyNutrition}
              dailyMenus={dailyMenus}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateMenuModal
          selectedDate={selectedDate}
          onSubmit={handleCreateMenu}
          onClose={closeCreateModal}
        />
      )}

      {showAddMealModal && (
        <AddMealModal
          mealType={selectedMealType}
          onSubmit={handleAddMeal}
          onClose={closeAddMealModal}
        />
      )}
    </div>
  );
};

export default DailyMenuPlanner; 