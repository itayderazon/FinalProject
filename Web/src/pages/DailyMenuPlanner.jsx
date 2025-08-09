import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useDailyMenuPlannerState } from '../hooks/useDailyMenuPlannerState';
import CreateMenuModal from '../components/dailyMenu/CreateMenuModal';
import AddMealModal from '../components/dailyMenu/AddMealModal';
import NutritionSummary from '../components/dailyMenu/NutritionSummary';
import WeekNavigation from '../components/dailyMenu/WeekNavigation';
import WeeklyCalendar from '../components/dailyMenu/WeeklyCalendar';
import DayDetail from '../components/dailyMenu/DayDetail';
import PlannerTabs from '../components/dailyMenu/PlannerTabs';
import LoadingSpinner from '../components/common/LoadingSpinner';
import '../styles/daily-menu-planner/DailyMenuPlanner.css';

const DailyMenuPlanner = () => {
  const { user } = useAuth();
  const {
    // State
    activeTab,
    loading,
    selectedDate,
    currentWeekStart,
    dailyMenus,
    selectedMenu,
    weeklyNutrition,
    weekDays,
    
    // Modal state
    showCreateModal,
    showAddMealModal,
    selectedMealType,
    
    // Handlers
    onTabChange,
    onDateSelect,
    onNavigateWeek,
    onCreateMenu,
    onAddMeal,
    onDeleteMeal,
    onAddGeneratedMenu,
    
    // Modal handlers
    onOpenCreateModal,
    onCloseCreateModal,
    onOpenAddMealModal,
    onCloseAddMealModal,
    
    // Utility functions
    getDayMenu
  } = useDailyMenuPlannerState();

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
          onTabChange={onTabChange} 
        />

        {/* Content */}
        {activeTab === 'planner' && (
          <div className="planner-content">
            <WeekNavigation 
              currentWeekStart={currentWeekStart}
              onNavigateWeek={onNavigateWeek}
            />

            <WeeklyCalendar 
              weekDays={weekDays}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              getDayMenu={getDayMenu}
            />

            <DayDetail 
              selectedDate={selectedDate}
              selectedMenu={selectedMenu}
              onCreateMenu={onOpenCreateModal}
              onAddMeal={onOpenAddMealModal}
              onDeleteMeal={onDeleteMeal}
              onAddGeneratedMenu={onAddGeneratedMenu}
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
          onSubmit={onCreateMenu}
          onClose={onCloseCreateModal}
        />
      )}

      {showAddMealModal && (
        <AddMealModal
          mealType={selectedMealType}
          onSubmit={onAddMeal}
          onClose={onCloseAddMealModal}
        />
      )}
    </div>
  );
};

export default DailyMenuPlanner; 