import React, { useState } from 'react';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import useShoppingCart from '../../hooks/useShoppingCart';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useShoppingCart();
  const [updating, setUpdating] = useState(false);
  const { product, quantity } = item;

  const handleQuantityChange = async (newQuantity) => {
    setUpdating(true);
    await updateQuantity(product.id, newQuantity);
    setUpdating(false);
  };

  const handleRemove = async () => {
    setUpdating(true);
    await removeFromCart(product.id);
    setUpdating(false);
  };

  if (!product) {
    return null;
  }

  const bestPrice = product.priceStats?.minPrice || 0;
  const itemTotal = bestPrice * quantity;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        transition: 'all 0.2s ease',
        opacity: updating ? 0.6 : 1
      }}
    >
      {/* Product Image */}
      <div
        style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <Package style={{ width: '2rem', height: '2rem', color: '#9ca3af' }} />
      </div>

      {/* Product Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '0.25rem',
            lineHeight: '1.4'
          }}
        >
          {product.name}
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <span>{product.brand || 'מותג לא ידוע'}</span>
          <span>{product.category?.name || 'קטגוריה'}</span>
        </div>

        {/* Price per unit */}
        <div style={{ marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#059669' }}>
            {formatPrice(bestPrice)} לכל יחידה
          </span>
        </div>
      </div>

      {/* Quantity Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}
      >
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          disabled={updating || quantity <= 1}
          style={{
            background: quantity <= 1 ? '#f3f4f6' : '#3b82f6',
            color: quantity <= 1 ? '#9ca3af' : 'white',
            border: 'none',
            borderRadius: '0.25rem',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Minus size={14} />
        </button>

        <span
          style={{
            minWidth: '2rem',
            textAlign: 'center',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#111827'
          }}
        >
          {quantity}
        </span>

        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          disabled={updating}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.25rem',
            width: '2rem',
            height: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => !updating && (e.target.style.backgroundColor = '#2563eb')}
          onMouseLeave={(e) => !updating && (e.target.style.backgroundColor = '#3b82f6')}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Total Price */}
      <div
        style={{
          textAlign: 'right',
          minWidth: '80px'
        }}
      >
        <div
          style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#059669',
            direction: 'ltr'
          }}
        >
          {formatPrice(itemTotal)}
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        disabled={updating}
        style={{
          background: 'transparent',
          color: '#ef4444',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#fef2f2';
          e.target.style.borderColor = '#fca5a5';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.borderColor = '#fecaca';
        }}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default CartItem; 