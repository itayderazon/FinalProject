import React from 'react';
import { TrendingDown, Store, CheckCircle, AlertCircle } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';

const CartSummary = ({ priceComparison, comparingPrices, onComparePrices }) => {
  if (!priceComparison || !priceComparison.stores) {
    return (
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '0.75rem',
          padding: '1.5rem'
        }}
      >
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <TrendingDown size={20} />
          השוואת מחירים
        </h3>
        
        <button
          onClick={onComparePrices}
          disabled={comparingPrices}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: comparingPrices ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: comparingPrices ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {comparingPrices ? 'משווה מחירים...' : 'השווה מחירים'}
        </button>
      </div>
    );
  }

  const { stores, cheapest_store, cheapest_total } = priceComparison;
  const sortedStores = stores.sort((a, b) => a.total - b.total);

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        padding: '1.5rem'
      }}
    >
      <h3
        style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <TrendingDown size={20} />
        השוואת מחירים
      </h3>

      {/* Cheapest Store Highlight */}
      {cheapest_store && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}
          >
            <CheckCircle style={{ color: '#16a34a', width: '1.25rem', height: '1.25rem' }} />
            <span style={{ fontWeight: '600', color: '#15803d' }}>
              החנות הזולה ביותר
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              {cheapest_store}
            </span>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#16a34a',
                direction: 'ltr'
              }}
            >
              {formatPrice(cheapest_total)}
            </span>
          </div>
        </div>
      )}

      {/* All Stores List */}
      <div style={{ marginBottom: '1rem' }}>
        <h4
          style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '0.75rem'
          }}
        >
          השוואה לפי חנויות:
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedStores.map((store, index) => {
            const isComplete = store.missing_items === 0;
            const isCheapest = store.name === cheapest_store;
            
            return (
              <div
                key={store.name}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: isCheapest ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${isCheapest ? '#bbf7d0' : '#e5e7eb'}`,
                  borderRadius: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Store
                    size={16}
                    style={{ color: isCheapest ? '#16a34a' : '#6b7280' }}
                  />
                  <span
                    style={{
                      fontWeight: '500',
                      color: isCheapest ? '#15803d' : '#374151'
                    }}
                  >
                    {store.name}
                  </span>
                  
                  {!isComplete && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.75rem',
                        color: '#f59e0b'
                      }}
                    >
                      <AlertCircle size={12} />
                      <span>{store.missing_items} מוצרים חסרים</span>
                    </div>
                  )}
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: isCheapest ? '#16a34a' : '#111827',
                      direction: 'ltr'
                    }}
                  >
                    {formatPrice(store.total)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#6b7280'
                    }}
                  >
                    {store.available_items}/{store.available_items + store.missing_items} מוצרים
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Savings Information */}
      {sortedStores.length > 1 && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}
        >
          <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
            <strong>
              חיסכון אפשרי: {formatPrice(sortedStores[sortedStores.length - 1].total - sortedStores[0].total)}
            </strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
            בקנייה ב{sortedStores[0].name} במקום ב{sortedStores[sortedStores.length - 1].name}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={onComparePrices}
        disabled={comparingPrices}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          backgroundColor: comparingPrices ? '#9ca3af' : '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: comparingPrices ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          marginTop: '1rem'
        }}
      >
        {comparingPrices ? 'מעדכן...' : 'עדכן מחירים'}
      </button>
    </div>
  );
};

export default CartSummary; 