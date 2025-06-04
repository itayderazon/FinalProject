import React from 'react';
import ProductCard from './ProductCard';
import ProductListItem from './ProductListItem';

const ProductList = ({ products, viewMode, formatPrice, loading }) => {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  return (
    <div style={{ width: '100%' }}>
      {viewMode === 'grid' ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard 
              key={product._id || product.id || Math.random()} 
              product={product} 
              formatPrice={formatPrice}
            />
          ))}
        </div>
      ) : (
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          {products.map((product) => (
            <ProductListItem 
              key={product._id || product.id || Math.random()} 
              product={product} 
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}
      
      {products.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>לא נמצאו מוצרים התואמים לחיפוש</p>
        </div>
      )}
    </div>
  );
};

export default ProductList; 