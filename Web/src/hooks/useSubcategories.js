import { useState, useEffect } from 'react';
import { nutritionService } from '../services/nutritionService';

export const useSubcategories = () => {
  const [availableSubcategories, setAvailableSubcategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSubcategories = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const categories = await nutritionService.getFoodCategories();
        if (categories && categories.subcategories) {
          setAvailableSubcategories(categories.subcategories);
        }
      } catch (err) {
        setError('Failed to load food categories');
        setAvailableSubcategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubcategories();
  }, []);

  return {
    availableSubcategories,
    loading,
    error
  };
};