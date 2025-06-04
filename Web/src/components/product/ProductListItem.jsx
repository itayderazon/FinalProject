import React from 'react';
import { Eye, ShoppingCart, Heart } from 'lucide-react';
import { formatStoreCount } from '../../utils/formatters';

const ProductListItem = ({ product, formatPrice }) => {
  const bestPrice = product.priceStats ? product.priceStats.minPrice : null;

  return (
    <div style={{ 
      backgroundColor: 'white', 
      border: '1px solid #e5e7eb', 
      borderRadius: '0.5rem', 
      padding: '1.5rem', 
      marginBottom: '1rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'box-shadow 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left Side - Product Info */}
        <div style={{ flex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: '1' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                {product.name}
              </h3>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#2563eb', fontWeight: '500' }}>
                  {product.brand}
                </span>
                <span style={{ color: '#6b7280' }}>
                  {product.subcategory?.name || product.category?.name}
                </span>
              </div>
            </div>
            <Heart style={{ width: '1.25rem', height: '1.25rem', color: '#9ca3af', cursor: 'pointer' }} />
          </div>

          {/* Nutrition Info */}
          {product.nutrition && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {product.nutrition.calories && (
                <div style={{ 
                  padding: '0.25rem 0.5rem', 
                  backgroundColor: '#fef3c7', 
                  color: '#d97706', 
                  borderRadius: '0.375rem',
                  fontWeight: '500'
                }}>
                  קלוריות: {product.nutrition.calories}
                </div>
              )}
              {product.nutrition.protein && (
                <div style={{ 
                  padding: '0.25rem 0.5rem', 
                  backgroundColor: '#d1fae5', 
                  color: '#059669', 
                  borderRadius: '0.375rem',
                  fontWeight: '500'
                }}>
                  חלבון: {product.nutrition.protein}g
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Price and Actions */}
        <div style={{ textAlign: 'center', marginLeft: '1rem', minWidth: '120px' }}>
          {bestPrice && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669', direction: 'ltr' }}>
                {formatPrice(bestPrice)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {formatStoreCount(product.prices?.length || 0)}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ 
              backgroundColor: '#2563eb', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.375rem', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Eye style={{ width: '1rem', height: '1rem' }} />
              צפה במחירים
            </button>
            <button style={{ 
              border: '1px solid #d1d5db', 
              backgroundColor: 'transparent', 
              padding: '0.5rem', 
              borderRadius: '0.375rem', 
              cursor: 'pointer'
            }}>
              <ShoppingCart style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListItem; 