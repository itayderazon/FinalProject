import { useState, useEffect } from 'react';
import { nutritionService } from '../services/nutritionService';

export const useAllergens = () => {
  const [availableAllergens, setAvailableAllergens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllergens = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const categories = await nutritionService.getFoodCategories();
        if (categories && categories.allergens) {
          setAvailableAllergens(categories.allergens);
        }
      } catch (err) {
        setError('Failed to load allergens');
        setAvailableAllergens([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllergens();
  }, []);

  return {
    availableAllergens,
    loading,
    error
  };
};