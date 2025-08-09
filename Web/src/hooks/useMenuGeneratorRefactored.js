import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nutritionService } from '../services/nutritionService';
import { showNotification } from '../utils/menuUtils';
import { NUTRITION_PRESETS, DEFAULT_FORM_DATA } from '../constants/presets';
import { useSubcategories } from './useSubcategories';
import { useAllergens } from './useAllergens';
import { useSavedMenus } from './useSavedMenus';

export const useMenuGenerator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [generatedMenus, setGeneratedMenus] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'generate');
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Use specialized hooks
  const { 
    availableSubcategories, 
    loading: subcategoriesLoading 
  } = useSubcategories();
  
  const { 
    availableAllergens, 
    loading: allergensLoading 
  } = useAllergens();
  
  const { 
    savedMenus, 
    saveMenu, 
    deleteMenu, 
    loadSavedMenus 
  } = useSavedMenus();

  // Parse productIds from URL parameters
  const productIdsFromUrl = useMemo(() => {
    const requiredProducts = searchParams.get('requiredProducts');
    if (requiredProducts) {
      return requiredProducts.split(',').filter(id => id.trim());
    }
    return [];
  }, [searchParams]);

  const presets = NUTRITION_PRESETS;

  const setRequiredProducts = useCallback((productIds) => {
    setFormData(prev => ({
      ...prev,
      requiredProducts: productIds,
      requiredProductPortions: productIds.reduce((acc, id) => {
        acc[id] = prev.requiredProductPortions[id] || 100;
        return acc;
      }, {})
    }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    let newValue;
    
    if (type === 'checkbox') {
      newValue = checked;
    } else if (type === 'number') {
      newValue = parseFloat(value) || 0;
    } else {
      newValue = value;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  }, []);

  const applyPreset = useCallback((presetName) => {
    const preset = presets[presetName];
    if (preset) {
      setFormData(prev => ({
        ...prev,
        calories: preset.calories,
        protein: preset.protein,
        carbs: preset.carbs,
        fat: preset.fat
      }));
      showNotification(`Applied ${preset.name || presetName} preset`, 'success');
    }
  }, [presets]);

  const generateMenu = useCallback(async (customParams = null) => {
    const menuData = customParams || formData;
    
    setLoading(true);
    try {
      const response = await nutritionService.generateMenu(menuData);
      const responseData = response?.data || response;
      
      if (responseData && responseData.success === true && responseData.menus && Array.isArray(responseData.menus) && responseData.menus.length > 0) {
        // Add price comparison data if available
        if (responseData.price_comparison && menuData.include_prices) {
          responseData.menus = responseData.menus.map(menu => ({
            ...menu,
            price_comparison: responseData.price_comparison
          }));
        }
        
        setGeneratedMenus(responseData.menus);
        showNotification(`Successfully generated ${responseData.menus.length} menu options!`, 'success');
        return { data: responseData };
      } else {
        // Try lenient validation
        if (responseData && responseData.success && responseData.menus) {
          setGeneratedMenus(responseData.menus);
          showNotification(`Successfully generated ${responseData.menus.length || 'multiple'} menu options!`, 'success');
          return { data: responseData };
        } else {
          throw new Error('No valid menus generated from API');
        }
      }
    } catch (error) {
      showNotification('Failed to generate menu. Please try again.', 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const clearResults = useCallback(() => {
    setGeneratedMenus([]);
    showNotification('Results cleared', 'info');
  }, []);

  const toggleSubcategory = useCallback((category) => {
    setFormData(prev => ({
      ...prev,
      subcategories: prev.subcategories.includes(category)
        ? prev.subcategories.filter(cat => cat !== category)
        : [...prev.subcategories, category]
    }));
  }, []);

  const toggleAllergen = useCallback((allergen) => {
    setFormData(prev => ({
      ...prev,
      excluded_allergens: prev.excluded_allergens.includes(allergen)
        ? prev.excluded_allergens.filter(all => all !== allergen)
        : [...prev.excluded_allergens, allergen]
    }));
  }, []);

  const removeRequiredProduct = useCallback((productId) => {
    setFormData(prev => {
      const newRequiredProducts = prev.requiredProducts.filter(id => id !== productId);
      const newPortions = { ...prev.requiredProductPortions };
      delete newPortions[productId];
      
      return {
        ...prev,
        requiredProducts: newRequiredProducts,
        requiredProductPortions: newPortions
      };
    });
  }, []);

  const updateProductPortion = useCallback((productId, portion) => {
    setFormData(prev => ({
      ...prev,
      requiredProductPortions: {
        ...prev.requiredProductPortions,
        [productId]: portion
      }
    }));
  }, []);

  return {
    // State
    loading,
    generatedMenus,
    savedMenus,
    activeTab,
    formData,
    presets,
    availableSubcategories,
    subcategoriesLoading,
    availableAllergens,
    allergensLoading,
    productIdsFromUrl,
    
    // Actions
    setActiveTab,
    handleInputChange,
    applyPreset,
    generateMenu,
    saveMenu,
    deleteMenu,
    clearResults,
    toggleSubcategory,
    toggleAllergen,
    loadSavedMenus,
    setRequiredProducts,
    removeRequiredProduct,
    updateProductPortion
  };
};