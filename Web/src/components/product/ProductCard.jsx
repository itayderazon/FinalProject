import React, { useState } from 'react';
import { ShoppingCart, Heart, Eye } from 'lucide-react';
import { formatCalories, formatProtein, formatStoreCount } from '../../utils/formatters';
import Modal from '../ui/Modal';
import PriceDisplay from '../ui/PriceDisplay';

const ProductCard = ({ product, formatPrice }) => {
  const [showPriceModal, setShowPriceModal] = useState(false);
  
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

  const handleViewPrices = () => {
    setShowPriceModal(true);
  };

  return (
    <>
      <div className="product-card grid-item">
        <div>
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

          {/* Price Information */}
          <div className="price-section">
            {bestPrice && (
              <>
                <div className="price-display">
                  {formatPrice(bestPrice)}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {formatStoreCount(storeCount)}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="actions-section" style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn-primary" 
              style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handleViewPrices}
            >
              <Eye style={{ width: '1rem', height: '1rem' }} />
              צפה במחירים
            </button>
            <button className="btn-secondary">
              <ShoppingCart style={{ width: '1rem', height: '1rem' }} />
            </button>
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