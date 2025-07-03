import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import useShoppingCart from '../hooks/useShoppingCart';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';

const ShoppingCart = () => {
  const navigate = useNavigate();
  const {
    cart,
    loading,
    priceComparison,
    comparingPrices,
    clearCart,
    comparePrices,
    getTotalItems
  } = useShoppingCart();

  const totalItems = getTotalItems();

  // Auto-compare prices when cart has items
  useEffect(() => {
    if (cart.items.length > 0 && !priceComparison) {
      comparePrices();
    }
  }, [cart.items.length, priceComparison, comparePrices]);

  const handleClearCart = async () => {
    if (window.confirm('האם אתה בטוח שברצונך לרוקן את העגלה?')) {
      await clearCart();
    }
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#6b7280' }}>טוען עגלת קניות...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb',
      padding: '2rem 1rem'
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#374151'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}
          >
            <ArrowLeft size={16} />
            חזור
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ 
                fontSize: '2.25rem', 
                fontWeight: '700', 
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                עגלת קניות
              </h1>
              <p style={{ color: '#6b7280' }}>
                {totalItems > 0 ? `${totalItems} פריטים בעגלה` : 'העגלה ריקה'}
              </p>
            </div>

            {cart.items.length > 0 && (
              <button
                onClick={handleClearCart}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #fecaca',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
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
                רוקן עגלה
              </button>
            )}
          </div>
        </div>

        {/* Empty Cart State */}
        {cart.items.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb'
          }}>
            <ShoppingBag 
              size={64} 
              style={{ 
                color: '#d1d5db', 
                margin: '0 auto 1.5rem',
                display: 'block'
              }} 
            />
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '1rem'
            }}>
              העגלה שלך ריקה
            </h2>
            <p style={{ 
              color: '#6b7280', 
              marginBottom: '2rem',
              fontSize: '1rem'
            }}>
              הוסף מוצרים מהקטלוג כדי להתחיל
            </p>
            <button
              onClick={handleContinueShopping}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              עבור לקטלוג
            </button>
          </div>
        ) : (
          /* Cart with Items */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 400px',
            gap: '2rem'
          }}>
            {/* Cart Items */}
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h2 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#111827'
                }}>
                  פריטים בעגלה ({cart.items.length})
                </h2>
                
                <button
                  onClick={handleContinueShopping}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    color: '#3b82f6',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#eff6ff';
                    e.target.style.borderColor = '#93c5fd';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#bfdbfe';
                  }}
                >
                  הוסף עוד מוצרים
                </button>
              </div>

              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1rem'
              }}>
                {cart.items.map((item) => (
                  <CartItem 
                    key={item.productId} 
                    item={item}
                  />
                ))}
              </div>
            </div>

            {/* Price Comparison Sidebar */}
            <div>
              <CartSummary
                priceComparison={priceComparison}
                comparingPrices={comparingPrices}
                onComparePrices={comparePrices}
              />
            </div>
          </div>
        )}

        {/* Mobile Layout Adjustments */}
        <style jsx>{`
          @media (max-width: 768px) {
            .cart-grid {
              grid-template-columns: 1fr !important;
              gap: 1rem !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ShoppingCart; 