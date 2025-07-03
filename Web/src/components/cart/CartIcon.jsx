import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useShoppingCart from '../../hooks/useShoppingCart';

const CartIcon = () => {
  const navigate = useNavigate();
  const { cart, getTotalItems } = useShoppingCart();
  const totalItems = getTotalItems();

  const handleCartClick = () => {
    navigate('/cart');
  };

  return (
    <button
      onClick={handleCartClick}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 'none',
        padding: '0.5rem',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        color: '#374151',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#f3f4f6';
        e.target.style.color = '#1f2937';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'transparent';
        e.target.style.color = '#374151';
      }}
    >
      <ShoppingCart size={24} />
      {totalItems > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '600',
            border: '2px solid white'
          }}
        >
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
};

export default CartIcon; 