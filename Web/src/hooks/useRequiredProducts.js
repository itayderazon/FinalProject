import { useState, useEffect, useMemo } from 'react';
import productService from '../services/productService';

const useRequiredProducts = (productIds, onUpdateProductPortion) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productPortions, setProductPortions] = useState({});

  // Memoize the productIds string to prevent unnecessary re-fetches
  const productIdsString = useMemo(() => {
    return productIds ? productIds.sort().join(',') : '';
  }, [productIds]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!productIds || productIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        const productPromises = productIds.map(id => 
          productService.getProductById(id).catch(err => {
            console.error(`Failed to fetch product ${id}:`, err);
            return null;
          })
        );
        
        const productResults = await Promise.all(productPromises);
        
        // Extract the actual product from the API response structure
        const validProducts = productResults
          .filter(response => response !== null)
          .map(response => {
            // The API returns { success: true, product: {...} }
            return response.success ? response.product : response;
          })
          .filter(product => product !== null);
          
        setProducts(validProducts);
        
        // Initialize portions for products that don't have them yet
        const initialPortions = {};
        validProducts.forEach(product => {
          const productId = product.id || product._id;
          if (!productPortions[productId]) {
            initialPortions[productId] = 1; // Default portion is 1
          }
        });
        
        if (Object.keys(initialPortions).length > 0) {
          setProductPortions(prev => ({ ...prev, ...initialPortions }));
        }
      } catch (err) {
        console.error('Error fetching required products:', err);
        setError('Failed to load required products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productIdsString]); // Use the memoized string instead of the array

  const handlePortionChange = (productId, newPortion) => {
    const updatedPortions = {
      ...productPortions,
      [productId]: Math.max(0.1, parseFloat(newPortion) || 1)
    };
    setProductPortions(updatedPortions);
    
    // Notify parent component about portion change
    if (onUpdateProductPortion) {
      onUpdateProductPortion(productId, updatedPortions[productId]);
    }
  };

  return {
    products,
    loading,
    error,
    productPortions,
    handlePortionChange
  };
};

export default useRequiredProducts; 