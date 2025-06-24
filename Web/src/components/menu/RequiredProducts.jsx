import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useRequiredProducts from '../../hooks/useRequiredProducts';
import useProductImages from '../../hooks/useProductImages';
import RequiredProductCard from './RequiredProductCard';

const RequiredProducts = ({ productIds, onRemoveProduct, onUpdateProductPortion }) => {
  const navigate = useNavigate();
  
  // Use custom hooks for separated concerns
  const { products, loading, error, productPortions, handlePortionChange } = useRequiredProducts(
    productIds, 
    onUpdateProductPortion
  );
  
  const { fetchProductImage, getProductImageUrl } = useProductImages();

  const handleChooseItems = () => {
    // Navigate to product catalog with a flag to indicate it's for menu selection
    navigate('/products?selectMode=true&returnTo=menu-generator');
  };

  if (loading) {
    return (
      <div className="required-products-section">
        <div className="required-products-header">
          <div className="header-content">
            <div className="header-info">
              <h3>🎯 Required Products</h3>
            </div>
            <button 
              className="choose-items-btn"
              onClick={handleChooseItems}
            >
              <Plus size={16} />
              Choose Items
            </button>
          </div>
        </div>
        <div className="required-products-loading">
          <div className="loading-spinner"></div>
          <span>Loading required products...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="required-products-section">
        <div className="required-products-header">
          <div className="header-content">
            <div className="header-info">
              <h3>🎯 Required Products</h3>
            </div>
            <button 
              className="choose-items-btn"
              onClick={handleChooseItems}
            >
              <Plus size={16} />
              Choose Items
            </button>
          </div>
        </div>
        <div className="required-products-error">
          <span>⚠️ {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="required-products-section">
      <div className="required-products-header">
        <div className="header-content">
          <div className="header-info">
            <h3>🎯 Required Products</h3>
            <p className="required-products-description">
              These products will be included in your generated menu
            </p>
          </div>
          <button 
            className="choose-items-btn"
            onClick={handleChooseItems}
          >
            <Plus size={16} />
            Choose Items
          </button>
        </div>
      </div>
      
      {products.length === 0 ? (
        <div className="empty-required-products">
          <div className="empty-icon">🛒</div>
          <h4>No Required Products</h4>
          <p>Click "Choose Items" to select products that must be included in your menu</p>
        </div>
      ) : (
        <div className="required-products-grid">
          {products.map((product) => {
            const productId = product.id || product._id;
            const currentPortion = productPortions[productId] || 1;
            
            return (
              <RequiredProductCard
                key={productId}
                product={product}
                productId={productId}
                currentPortion={currentPortion}
                onPortionChange={handlePortionChange}
                onRemoveProduct={onRemoveProduct}
                fetchProductImage={fetchProductImage}
                getProductImageUrl={getProductImageUrl}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequiredProducts; 