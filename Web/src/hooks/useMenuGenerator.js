import { useState, useEffect } from 'react';
import { nutritionService } from '../services/nutritionService';
import { showNotification } from '../utils/menuUtils';

export const useMenuGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [generatedMenus, setGeneratedMenus] = useState([]);
  const [savedMenus, setSavedMenus] = useState([]);
  const [activeTab, setActiveTab] = useState('generate');
  const [formData, setFormData] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
    meal_type: '',
    num_items: 5,
    include_prices: true
  });

  const presets = {
    weightLoss: { calories: 1500, protein: 130, carbs: 120, fat: 50 },
    maintenance: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
    bulking: { calories: 2800, protein: 200, carbs: 350, fat: 85 },
    keto: { calories: 1800, protein: 120, carbs: 30, fat: 140 }
  };

  useEffect(() => {
    loadSavedMenus();
  }, []);

  const loadSavedMenus = () => {
    // Mock saved menus - in real app, fetch from API
    const mockSavedMenus = [
      {
        id: 1,
        name: 'My Healthy Breakfast',
        date: '2025-05-30',
        total_nutrition: { calories: 450, protein: 25, carbs: 45, fat: 18 },
        items: [
          { name: 'Oatmeal', portion_grams: 80, nutrition: { calories: 150, protein: 5, carbs: 30, fat: 3 } },
          { name: 'Banana', portion_grams: 120, nutrition: { calories: 100, protein: 1, carbs: 25, fat: 0 } },
          { name: 'Greek Yogurt', portion_grams: 100, nutrition: { calories: 100, protein: 10, carbs: 6, fat: 6 } }
        ]
      }
    ];
    setSavedMenus(mockSavedMenus);
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
      
      const menuData = {
        calories: formData.calories,
        protein: formData.protein,
        carbs: formData.carbs, 
        fat: formData.fat,
        include_prices: formData.include_prices,
        ...(formData.meal_type && { meal_type: formData.meal_type }),
        ...(formData.num_items && { num_items: formData.num_items })
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
      
      const savedMenu = {
        id: Date.now(),
        name: menuName,
        date: new Date().toISOString(),
        total_nutrition: menu.total_nutrition,
        items: menu.items
      };

      // In real app, save to API
      setSavedMenus(prev => [savedMenu, ...prev]);
      showNotification('Menu saved successfully!', 'success');
      
      // Also log to nutrition diary
      const nutritionData = {
        date: new Date().toISOString(),
        meals: [{
          type: formData.meal_type || 'lunch',
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

  const deleteMenu = (menuId) => {
    setSavedMenus(prev => prev.filter(menu => menu.id !== menuId));
    showNotification('Menu deleted', 'info');
  };

  const clearResults = () => {
    setGeneratedMenus([]);
  };

  return {
    // State
    loading,
    generatedMenus,
    savedMenus,
    activeTab,
    formData,
    presets,
    
    // Actions
    setActiveTab,
    handleInputChange,
    applyPreset,
    generateMenu,
    saveMenu,
    deleteMenu,
    clearResults
  };
}; 