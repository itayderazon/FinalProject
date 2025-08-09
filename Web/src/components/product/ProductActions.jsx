import React, { useState } from 'react';
import { ShoppingCart, Heart, Eye, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProductActions = ({ 
  product, 
  selectMode = false, 
  onSelectProduct, 
  isSelected = false,
  addToCart,
  isInCart,
  getItemQuantity,
  onViewPrices
}) => {
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = async () => {
    if (addingToCart) return;

    setAddingToCart(true);
    try {
      await addToCart(product.id || product._id, 1);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToMenu = () => {
    // Navigate to menu generator with this product's ID
    navigate(`/menu-generator?requiredProducts=${product.id || product._id}`);
  };

  if (selectMode) {
    return (
      <div className="product-actions select-mode">
        <button
          onClick={() => onSelectProduct(product)}
          className={`select-btn ${isSelected ? 'selected' : ''}`}
        >
          {isSelected ? (
            <>
              <Check size={16} />
              Selected
            </>
          ) : (
            <>
              <Plus size={16} />
              Select
            </>
          )}
        </button>
      </div>
    );
  }

  const inCart = isInCart && isInCart(product.id || product._id);
  const cartQuantity = getItemQuantity && getItemQuantity(product.id || product._id);

  return (
    <div className="product-actions">
      <div className="action-buttons">
        <button
          onClick={onViewPrices}
          className="action-btn view-prices"
          title="View prices at different stores"
        >
          <Eye size={16} />
          Prices
        </button>

        <button
          onClick={handleAddToMenu}
          className="action-btn add-to-menu"
          title="Add to menu generator"
        >
          <Plus size={16} />
          Menu
        </button>

        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className={`action-btn add-to-cart ${inCart ? 'in-cart' : ''}`}
          title={inCart ? `In cart (${cartQuantity})` : 'Add to cart'}
        >
          {addingToCart ? (
            <span className="loading-spinner small"></span>
          ) : (
            <>
              <ShoppingCart size={16} />
              {inCart && cartQuantity > 0 && (
                <span className="cart-quantity">{cartQuantity}</span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductActions;