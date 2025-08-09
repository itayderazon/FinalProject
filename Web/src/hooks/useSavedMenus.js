import { useState, useEffect, useCallback } from 'react';
import { nutritionService } from '../services/nutritionService';
import { showNotification } from '../utils/menuUtils';

export const useSavedMenus = () => {
  const [savedMenus, setSavedMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSavedMenus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const menus = await nutritionService.getSavedMenus();
      setSavedMenus(menus.savedMenus || []);
    } catch (err) {
      setError('Failed to load saved menus');
      setSavedMenus([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveMenu = useCallback(async (menuData) => {
    try {
      await nutritionService.saveMenu(menuData);
      showNotification('Menu saved successfully!', 'success');
      await loadSavedMenus(); // Reload the list
      return true;
    } catch (err) {
      showNotification('Failed to save menu', 'error');
      return false;
    }
  }, [loadSavedMenus]);

  const deleteMenu = useCallback(async (menuId) => {
    try {
      await nutritionService.deleteSavedMenu(menuId);
      showNotification('Menu deleted successfully!', 'success');
      await loadSavedMenus(); // Reload the list
      return true;
    } catch (err) {
      showNotification('Failed to delete menu', 'error');
      return false;
    }
  }, [loadSavedMenus]);

  useEffect(() => {
    loadSavedMenus();
  }, [loadSavedMenus]);

  return {
    savedMenus,
    loading,
    error,
    saveMenu,
    deleteMenu,
    loadSavedMenus
  };
};