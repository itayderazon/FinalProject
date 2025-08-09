import React, { useState, useEffect } from 'react';

const ProductImage = ({ 
  product, 
  fetchProductImage, 
  getProductImageUrl, 
  onImageError,
  className = "product-image",
  size = "medium" 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      if (!product) return;

      setImageLoading(true);
      setImageError(false);

      try {
        // First try to get image URL if it's already available
        if (product.image_url) {
          setImageUrl(product.image_url);
          setImageLoading(false);
          return;
        }

        // Try to fetch image using the provided function
        if (fetchProductImage) {
          const url = await fetchProductImage(product);
          if (url) {
            setImageUrl(url);
          } else {
            setImageError(true);
          }
        } else if (getProductImageUrl) {
          const url = getProductImageUrl(product);
          setImageUrl(url);
        } else {
          setImageError(true);
        }
      } catch (error) {
        setImageError(true);
        if (onImageError) {
          onImageError(product, setImageError);
        }
      } finally {
        setImageLoading(false);
      }
    };

    loadImage();
  }, [product, fetchProductImage, getProductImageUrl, onImageError]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
    if (onImageError) {
      onImageError(product, setImageError);
    }
  };

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-20 h-20', 
    large: 'w-32 h-32'
  };

  if (imageLoading) {
    return (
      <div className={`${className} ${sizeClasses[size]} loading`}>
        <div className="image-placeholder loading">
          <span className="loading-spinner"></span>
        </div>
      </div>
    );
  }

  if (imageError || !imageUrl) {
    return (
      <div className={`${className} ${sizeClasses[size]} error`}>
        <div className="image-placeholder error">
          <span className="placeholder-icon">🍽️</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} ${sizeClasses[size]}`}>
      <img
        src={imageUrl}
        alt={product.name || 'Product'}
        onError={handleImageError}
        className="product-img"
      />
    </div>
  );
};

export default ProductImage;