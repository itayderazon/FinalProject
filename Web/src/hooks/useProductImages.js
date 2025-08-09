import { useState } from 'react';
import { SERVER_BASE_URL } from '../services/api';

const useProductImages = () => {
  const [imageCache, setImageCache] = useState(new Map());

  const fetchProductImage = async (product) => {
    // Use the same item code logic as the working ProductCatalog
    const itemCode = product.item_code || product.barcode || product.code;
    if (!itemCode) {
      console.warn('No item code found for product:', product.name, 'Available fields:', Object.keys(product));
      return null;
    }

    // Check cache first
    if (imageCache.has(itemCode)) {
      return imageCache.get(itemCode);
    }

    try {
      // Request image from NodeServer API

      const response = await fetch(`${SERVER_BASE_URL}/api/images/product/${itemCode}?type=small`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.exists && data.imageUrl) {
  
          setImageCache(prev => new Map(prev.set(itemCode, data.imageUrl)));
          return data.imageUrl;
        } else {
  
          setImageCache(prev => new Map(prev.set(itemCode, null)));
          return null;
        }
      } else {

        setImageCache(prev => new Map(prev.set(itemCode, null)));
        return null;
      }
    } catch (error) {
      console.error('Error fetching image for product:', product.name, 'Item code:', itemCode, error);
      setImageCache(prev => new Map(prev.set(itemCode, null)));
      return null;
    }
  };

  const getProductImageUrl = (product) => {
    // Use the same item code logic as the working ProductCatalog
    const itemCode = product.item_code || product.barcode || product.code;
    if (!itemCode) return null;
    
    // Return cached image URL if available
    return imageCache.get(itemCode) || null;
  };

  return {
    fetchProductImage,
    getProductImageUrl
  };
};

export default useProductImages; 