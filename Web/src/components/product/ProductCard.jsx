import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Eye, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCalories, formatProtein, formatStoreCount } from '../../utils/formatters';
import Modal from '../ui/Modal';
import PriceDisplay from '../ui/PriceDisplay';
import useShoppingCart from '../../hooks/useShoppingCart';

const ProductCard = ({ product, formatPrice, fetchProductImage, getProductImageUrl, handleImageError, selectMode = false, onSelectProduct, isSelected = false }) => {
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();
  const { addToCart, isInCart, getItemQuantity } = useShoppingCart();
  
  // Use priceStats from API or calculate from prices array
  const priceStats = product.priceStats || (() => {
    if (!product.prices || product.prices.length === 0) return null;
    
    const prices = product.prices.map(p => p.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      storeCount: prices.length
    };
  })();
  
  const bestPrice = priceStats ? priceStats.minPrice : null;
  const storeCount = priceStats ? priceStats.storeCount : 0;
  const bestPriceEntry = (product.prices && product.prices.length > 0 && bestPrice != null)
    ? product.prices.reduce((min, p) => (p.price < min.price ? p : min), product.prices[0])
    : null;
  const bestStoreName = bestPriceEntry ? (bestPriceEntry.supermarket || bestPriceEntry.store || '') : '';

  const handleViewPrices = () => {
    setShowPriceModal(true);
  };

  const handleAddToMenu = () => {
    // Navigate to menu generator with this product's ID
    navigate(`/menu-generator?requiredProducts=${product.id || product._id}`);
  };

  const handleSelectProduct = () => {
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    const productId = product.id || product._id;
    await addToCart(productId, 1);
    setAddingToCart(false);
  };

  const productInCart = isInCart(product.id || product._id);
  const cartQuantity = getItemQuantity(product.id || product._id);

  // Fetch image when component mounts
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

  const onImageError = () => {
    handleImageError(product, setImageError);
  };

  return (
    <>
      <div className="product-card grid-item">
        <div>
          {/* Product Image */}
          <div className="product-image-container" style={{ 
            width: '100%', 
            height: '160px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '0.5rem', 
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {imageLoading ? (
              <div style={{ 
                color: '#9ca3af', 
                fontSize: '0.875rem', 
                textAlign: 'center',
                padding: '1rem'
              }}>
                טוען תמונה...
              </div>
            ) : (!imageError && imageUrl) ? (
              <img 
                src={imageUrl} 
                alt={product.name || product.product_name || 'Product Image'}
                onError={onImageError}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '0.5rem'
                }}
              />
            ) : (
              <div style={{ 
                color: '#9ca3af', 
                fontSize: '0.875rem', 
                textAlign: 'center',
                padding: '1rem'
              }}>
                תמונה לא זמינה
              </div>
            )}
          </div>

          {/* Product Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <h3 className="product-title" style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', flex: '1', paddingRight: '0.5rem' }}>
              {product.name || product.product_name || 'מוצר ללא שם'}
            </h3>
            <Heart 
              style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af', cursor: 'pointer', flexShrink: '0' }} 
              onMouseEnter={(e) => e.target.style.color = '#ef4444'}
              onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
            />
          </div>

          {/* Brand and Category */}
          <div className="brand-category-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: '#2563eb', fontWeight: '500' }}>
              {product.brand || 'מותג לא ידוע'}
            </span>
            <span style={{ 
              padding: '0.25rem 0.5rem', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '0.375rem', 
              color: '#4b5563', 
              fontSize: '0.75rem',
              marginLeft: '0.5rem'
            }}>
              {product.subcategory?.name || product.category?.name || 'קטגוריה'}
            </span>
          </div>

          {/* Nutrition Info */}
          <div className="nutrition-grid" style={{ marginBottom: '0.75rem' }}>
            {product.nutrition?.calories && (
              <div className="nutrition-item" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                {product.nutrition.calories} cal
              </div>
            )}
            {product.nutrition?.protein && (
              <div className="nutrition-item" style={{ backgroundColor: '#d1fae5', color: '#059669' }}>
                {product.nutrition.protein}g
              </div>
            )}
          </div>

          {/* Price Information */
          }
          <div className="price-section">
            {bestPrice && (
              <>
                <div className="price-display">
                  {formatPrice(bestPrice)}
                </div>
                {bestStoreName && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {bestStoreName}
                  </div>
                )}
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {formatStoreCount(storeCount)}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="actions-section" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {selectMode ? (
              // Selection mode - show select button
              <button 
                className="btn-primary" 
                style={{ 
                  width: '100%',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  backgroundColor: isSelected ? '#dc2626' : '#16a34a',
                  color: 'white',
                  border: 'none',
                  fontSize: '0.875rem'
                }}
                onClick={handleSelectProduct}
                title={isSelected ? "Remove from selection" : "Select for menu"}
              >
                <Plus style={{ width: '1rem', height: '1rem' }} />
                {isSelected ? "Remove" : "Select"}
              </button>
            ) : (
              // Normal mode - show all buttons
              <>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-primary" 
                    style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                    onClick={handleViewPrices}
                  >
                    <Eye style={{ width: '0.875rem', height: '0.875rem' }} />
                    צפה במחירים
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    style={{
                      backgroundColor: productInCart ? '#16a34a' : 'transparent',
                      color: productInCart ? 'white' : '#6b7280',
                      border: `1px solid ${productInCart ? '#16a34a' : '#d1d5db'}`,
                      position: 'relative'
                    }}
                    title={productInCart ? `בעגלה (${cartQuantity})` : 'הוסף לעגלה'}
                  >
                    {addingToCart ? (
                      <div style={{ width: '1rem', height: '1rem', border: '2px solid #f3f3f3', borderTop: '2px solid currentColor', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    ) : productInCart ? (
                      <Check style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      <ShoppingCart style={{ width: '1rem', height: '1rem' }} />
                    )}
                    {productInCart && cartQuantity > 1 && (
                      <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        borderRadius: '50%',
                        width: '16px',
                        height: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        fontWeight: '600',
                        border: '1px solid white'
                      }}>
                        {cartQuantity}
                      </span>
                    )}
                  </button>
                </div>
                <button 
                  className="btn-primary" 
                  style={{ 
                    width: '100%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '0.5rem',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.875rem'
                  }}
                  onClick={handleAddToMenu}
                  title="Add to meal"
                >
                  <Plus style={{ width: '1rem', height: '1rem' }} />
                  Add to meal
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Price Modal */}
      <Modal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        title={product.name || product.product_name || 'מוצר'}
      >
        <PriceDisplay product={product} formatPrice={formatPrice} />
      </Modal>
    </>
  );
};

export default ProductCard;