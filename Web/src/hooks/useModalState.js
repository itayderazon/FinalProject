import { useState } from 'react';

export const useModalState = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);

  const openCreateModal = () => setShowCreateModal(true);
  const closeCreateModal = () => setShowCreateModal(false);

  const openAddMealModal = (mealType) => {
    setSelectedMealType(mealType);
    setShowAddMealModal(true);
  };

  const closeAddMealModal = () => {
    setShowAddMealModal(false);
    setSelectedMealType(null);
  };

  return {
    // State
    showCreateModal,
    showAddMealModal,
    selectedMealType,
    
    // Actions
    openCreateModal,
    closeCreateModal,
    openAddMealModal,
    closeAddMealModal
  };
}; 