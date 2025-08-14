import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nutritionService } from '../services/nutritionService';
import productService from '../services/productService';
import { showNotification } from '../utils/menuUtils';
import { NUTRITION_PRESETS, DEFAULT_FORM_DATA } from '../constants/presets';

export const useMenuGenerator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [generatedMenus, setGeneratedMenus] = useState([]);
  const [savedMenus, setSavedMenus] = useState([]);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') || 'generate'
  );
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [availableAllergens, setAvailableAllergens] = useState([]);
  const [allergensLoading, setAllergensLoading] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Parse productIds from URL parameters
  const productIdsFromUrl = useMemo(() => {
    const requiredProducts = searchParams.get('requiredProducts');
    if (requiredProducts) {
      return requiredProducts.split(',').filter(id => id.trim());
    }
    return [];
  }, [searchParams]);

  const presets = NUTRITION_PRESETS;

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
    loadAllergens();
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

  const loadAllergens = async () => {
    try {
      setAllergensLoading(true);
      const response = await nutritionService.getAllergens();
      
      if (response.success && response.allergens) {
        setAvailableAllergens(response.allergens);
      }
    } catch (error) {
      console.error('Error loading allergens:', error);
      showNotification('Failed to load allergens', 'error');
    } finally {
      setAllergensLoading(false);
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
        // Fetch item codes for each product id
        const idToCodeEntries = await Promise.all(
          formData.requiredProducts.map(async (productId) => {
            try {
              const response = await productService.getProductById(productId);
              const product = response?.success ? response.product : response;
              const itemCode = product?.item_code || product?.itemCode || String(productId);
              return [productId, itemCode];
            } catch (e) {
              return [productId, String(productId)];
            }
          })
        );
        const idToCode = Object.fromEntries(idToCodeEntries);

        requiredProductsForAPI = formData.requiredProducts.map(productId => ({
          item_id: idToCode[productId],
          portion_grams: formData.requiredProductPortions[productId] || 100 // Default to 100g if no portion specified
        }));
      }
      
      const menuData = {
        calories: formData.calories,
        protein: formData.protein,
        carbs: formData.carbs, 
        fat: formData.fat,
        include_prices: formData.include_prices,
        ...(formData.min_price > 0 && { min_price: formData.min_price }),
        ...(formData.max_price > 0 && { max_price: formData.max_price }),
        ...(formData.meal_template && { meal_template: formData.meal_template }),
        ...(formData.subcategories && formData.subcategories.length > 0 && { subcategories: formData.subcategories }),
        ...(formData.num_items && { num_items: formData.num_items }),
        ...(requiredProductsForAPI && { requiredProducts: requiredProductsForAPI }),
        ...(formData.excluded_allergens && formData.excluded_allergens.length > 0 && { excluded_allergens: formData.excluded_allergens })
      };

      
      const response = await nutritionService.generateMenu(menuData);
      
      // Handle nested response structure
      const responseData = response?.data || response;
      
      // More robust validation
      if (responseData && responseData.success === true && responseData.menus && Array.isArray(responseData.menus) && responseData.menus.length > 0) {
        // If price comparison data exists at the response level, add it to each menu
        if (responseData.price_comparison && formData.include_prices) {
          responseData.menus = responseData.menus.map(menu => ({
            ...menu,
            price_comparison: responseData.price_comparison
          }));
        }
        
        setGeneratedMenus(responseData.menus);
        showNotification(`Successfully generated ${responseData.menus.length} menu options!`, 'success');
      } else {
        // Try a more lenient approach based on your response structure
        if (responseData && responseData.success && responseData.menus) {
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

  const toggleAllergen = (allergenName) => {
    setFormData(prev => {
      const currentExcludedAllergens = prev.excluded_allergens || [];
      const isSelected = currentExcludedAllergens.includes(allergenName);
      
      if (isSelected) {
        return {
          ...prev,
          excluded_allergens: currentExcludedAllergens.filter(name => name !== allergenName)
        };
      } else {
        return {
          ...prev,
          excluded_allergens: [...currentExcludedAllergens, allergenName]
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

  // Handle tab change with URL persistence
  const handleTabChange = useCallback((newTab) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams);
    if (newTab && newTab !== 'generate') {
      params.set('tab', newTab);
    } else {
      params.delete('tab');
    }
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

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
    setActiveTab: handleTabChange,
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