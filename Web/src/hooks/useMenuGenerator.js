import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nutritionService } from '../services/nutritionService';
import { showNotification } from '../utils/menuUtils';

export const useMenuGenerator = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [generatedMenus, setGeneratedMenus] = useState([]);
  const [savedMenus, setSavedMenus] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [formData, setFormData] = useState({
    calories: 500,
    protein: 50,
    carbs: 50,
    fat: 11,
    meal_template: '',
    subcategories: [],
    num_items: 5,
    include_prices: true,
    requiredProducts: [],
    requiredProductPortions: {}
  });

  // Parse productIds from URL parameters
  const productIdsFromUrl = useMemo(() => {
    const requiredProducts = searchParams.get('requiredProducts');
    if (requiredProducts) {
      return requiredProducts.split(',').filter(id => id.trim());
    }
    return [];
  }, [searchParams]);

  const presets = {
    weightLoss: { calories: 1500, protein: 130, carbs: 120, fat: 50 },
    maintenance: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
    bulking: { calories: 2800, protein: 200, carbs: 350, fat: 85 },
  };

  // Define setRequiredProducts before it's used in useEffect
  const setRequiredProducts = useCallback((productIds) => {
    setFormData(prev => ({
      ...prev,
      requiredProducts: productIds
    }));
  }, []);

  // Handle portion updates for required products
  const updateProductPortion = useCallback((productId, portion) => {
    setFormData(prev => ({
      ...prev,
      requiredProductPortions: {
        ...prev.requiredProductPortions,
        [productId]: portion
      }
    }));
  }, []);

  useEffect(() => {
    loadSavedMenus();
    loadSubcategories();
  }, []);

  // Handle URL parameters for required products
  useEffect(() => {
    if (productIdsFromUrl.length > 0) {
      setRequiredProducts(productIdsFromUrl);
    }
  }, [productIdsFromUrl, setRequiredProducts]);

  const loadSavedMenus = async () => {
    try {
      const response = await nutritionService.getSavedMenus();
      
      if (response.success && response.savedMenus) {
        setSavedMenus(response.savedMenus);
      } else {
        // Fall back to empty array if no saved menus
        setSavedMenus([]);
      }
    } catch (error) {
      console.error('Error loading saved menus:', error);
      // Fall back to empty array on error
      setSavedMenus([]);
      showNotification('Failed to load saved menus', 'error');
    }
  };

  const loadSubcategories = async () => {
    try {
      setSubcategoriesLoading(true);
      const response = await nutritionService.getFoodCategories();
      
      if (response.success && response.subcategories) {
        setAvailableSubcategories(response.subcategories);
      }
    } catch (error) {
      console.error('Error loading subcategories:', error);
      showNotification('Failed to load food subcategories', 'error');
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const applyPreset = (presetName) => {
    const preset = presets[presetName];
    setFormData(prev => ({
      ...prev,
      ...preset
    }));
  };

  const generateMenu = async () => {
    try {
      setLoading(true);
      
      // Transform required products into the format expected by backend
      let requiredProductsForAPI = null;
      if (formData.requiredProducts && formData.requiredProducts.length > 0) {
        requiredProductsForAPI = formData.requiredProducts.map(productId => ({
          item_id: productId,
          portion_grams: formData.requiredProductPortions[productId] || 100 // Default to 100g if no portion specified
        }));
      }
      
      const menuData = {
        calories: formData.calories,
        protein: formData.protein,
        carbs: formData.carbs, 
        fat: formData.fat,
        include_prices: formData.include_prices,
        ...(formData.meal_template && { meal_template: formData.meal_template }),
        ...(formData.subcategories && formData.subcategories.length > 0 && { subcategories: formData.subcategories }),
        ...(formData.num_items && { num_items: formData.num_items }),
        ...(requiredProductsForAPI && { requiredProducts: requiredProductsForAPI })
      };

      
      const response = await nutritionService.generateMenu(menuData);
      
      // Handle nested response structure
      const responseData = response?.data || response;
      
      // More robust validation
      if (responseData && responseData.success === true && responseData.menus && Array.isArray(responseData.menus) && responseData.menus.length > 0) {
        console.log('✅ Validation passed - Setting generated menus:', responseData.menus);
        
        // If price comparison data exists at the response level, add it to each menu
        if (responseData.price_comparison && formData.include_prices) {
          console.log('📊 Adding price comparison data to menus');
          responseData.menus = responseData.menus.map(menu => ({
            ...menu,
            price_comparison: responseData.price_comparison
          }));
        }
        
        setGeneratedMenus(responseData.menus);
        showNotification(`Successfully generated ${responseData.menus.length} menu options!`, 'success');
      } else {
        console.error('❌ Validation failed - Invalid response structure:', {
          hasResponse: !!response,
          hasResponseData: !!responseData,
          success: responseData?.success,
          successType: typeof responseData?.success,
          hasMenus: !!responseData?.menus,
          isArray: Array.isArray(responseData?.menus),
          menusLength: responseData?.menus?.length
        });
        
        // Try a more lenient approach based on your response structure
        if (responseData && responseData.success && responseData.menus) {
          console.log('🔄 Trying lenient validation...');
          setGeneratedMenus(responseData.menus);
          showNotification(`Successfully generated ${responseData.menus.length || 'multiple'} menu options!`, 'success');
        } else {
          throw new Error('No valid menus generated from API');
        }
      }
    } catch (error) {
      console.error('Error generating menu:', error);
      showNotification('Failed to generate menu. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveMenu = async (menu, customName = '') => {
    try {
      const menuName = customName || `Menu ${new Date().toLocaleDateString()}`;
      
      const menuData = {
        name: menuName,
        description: `Generated menu with ${menu.items.length} items`,
        total_nutrition: menu.total_nutrition,
        items: menu.items,
        generation_parameters: {
          calories: formData.calories,
          protein: formData.protein,
          carbs: formData.carbs,
          fat: formData.fat,
          meal_template: formData.meal_template,
          subcategories: formData.subcategories,
          num_items: formData.num_items,
          include_prices: formData.include_prices
        }
      };

      // Save to database via API
      const response = await nutritionService.saveMenu(menuData);
      
      if (response.success) {
        showNotification('Menu saved successfully!', 'success');
        // Reload saved menus to show the new one
        await loadSavedMenus();
      } else {
        throw new Error('Failed to save menu');
      }
      
      // Also log to nutrition diary
      const nutritionData = {
        date: new Date().toISOString(),
        meals: [{
          type: formData.meal_template || 'lunch',
          foods: menu.items.map(item => ({
            name: item.name,
            quantity: item.portion_grams,
            unit: 'grams',
            calories: item.nutrition.calories,
            macros: {
              protein: item.nutrition.protein,
              carbs: item.nutrition.carbs,
              fat: item.nutrition.fat
            }
          }))
        }]
      };

      await nutritionService.logNutrition(nutritionData);
    } catch (error) {
      console.error('Error saving menu:', error);
      showNotification('Failed to save menu', 'error');
    }
  };

  const deleteMenu = async (menuId) => {
    try {
      const response = await nutritionService.deleteSavedMenu(menuId);
      
      if (response.success) {
        showNotification('Menu deleted', 'info');
        // Reload saved menus to reflect the deletion
        await loadSavedMenus();
      } else {
        throw new Error('Failed to delete menu');
      }
    } catch (error) {
      console.error('Error deleting menu:', error);
      showNotification('Failed to delete menu', 'error');
    }
  };

  const clearResults = () => {
    setGeneratedMenus([]);
  };

  const toggleSubcategory = (subcategoryName) => {
    setFormData(prev => {
      const currentSubcategories = prev.subcategories || [];
      const isSelected = currentSubcategories.includes(subcategoryName);
      
      if (isSelected) {
        return {
          ...prev,
          subcategories: currentSubcategories.filter(name => name !== subcategoryName)
        };
      } else {
        return {
          ...prev,
          subcategories: [...currentSubcategories, subcategoryName]
        };
      }
    });
  };

  const removeRequiredProduct = useCallback((productId) => {
    setFormData(prev => {
      // Convert productId to string for comparison since URL params are strings
      const productIdStr = String(productId);
      const newRequiredProducts = prev.requiredProducts.filter(id => String(id) !== productIdStr);
      return {
        ...prev,
        requiredProducts: newRequiredProducts
      };
    });
  }, [formData.requiredProducts]);

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
    loadSavedMenus,
    setRequiredProducts,
    removeRequiredProduct,
    updateProductPortion
  };
}; 