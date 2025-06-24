import React, { useState, useEffect } from 'react';
import { X, ShoppingCart } from 'lucide-react';

const RequiredProductCard = ({ 
  product, 
  productId, 
  currentPortion, 
  onPortionChange, 
  onRemoveProduct, 
  fetchProductImage, 
  getProductImageUrl 
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Load image when component mounts
  useEffect(() => {
    const loadImage = async () => {
      setImageLoading(true);
      const cachedUrl = getProductImageUrl(product);
      
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setImageLoading(false);
      } else {
        const fetchedUrl = await fetchProductImage(product);
        setImageUrl(fetchedUrl);
        setImageLoading(false);
      }
    };

    loadImage();
  }, [product, fetchProductImage, getProductImageUrl]);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="required-product-card">
      <div className="product-image-container">
        {imageLoading ? (
          <div className="product-image-placeholder">
            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Loading...</div>
          </div>
        ) : (!imageError && imageUrl) ? (
          <img 
            src={imageUrl}
            alt={product.name || product.product_name || 'Product'}
            className="product-image"
            onError={handleImageError}
          />
        ) : (
          <div className="product-image-placeholder">
            <ShoppingCart size={24} />
          </div>
        )}
      </div>
      
      <div className="required-product-info">
        <div className="required-product-name">
          {product.name || product.product_name || 'Unknown Product'}
        </div>
        <div className="required-product-details">
          {product.brand && (
            <span className="required-product-brand">{product.brand}</span>
          )}
          {product.category?.name && (
            <span className="required-product-category">
              {product.category.name}
            </span>
          )}
        </div>
        
        {/* Portion Input */}
        <div className="portion-input-container">
          <label className="portion-label">
            <span>📏</span>
            Portion:
          </label>
          <div className="portion-input-wrapper">
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={currentPortion}
              onChange={(e) => onPortionChange(productId, e.target.value)}
              className="portion-input"
            />
            <span className="portion-unit">servings</span>
          </div>
        </div>
        
        {product.nutrition && (
          <div className="required-product-nutrition">
            {product.nutrition.calories && (
              <span className="nutrition-item calories">
                {Math.round(product.nutrition.calories * currentPortion)} cal
              </span>
            )}
            {product.nutrition.protein && (
              <span className="nutrition-item protein">
                {(product.nutrition.protein * currentPortion).toFixed(1)}g protein
              </span>
            )}
          </div>
        )}
      </div>
      
      <button
        className="remove-product-btn"
        onClick={() => onRemoveProduct(productId)}
        title="Remove from required products"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default RequiredProductCard; 