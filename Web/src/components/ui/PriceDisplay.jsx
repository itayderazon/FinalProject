import React from 'react';
import { MapPin, Clock, ExternalLink } from 'lucide-react';

const PriceDisplay = ({ product, formatPrice }) => {
  // Store mapping for display names and locations
  const storeDisplayInfo = {
    'Shufersal': { displayName: 'שופרסל', location: 'רחובות' },
    'Rami Levy': { displayName: 'רמי לוי', location: 'תל אביב' },
    'Victory': { displayName: 'ויקטורי', location: 'חיפה' },
    'Tiv Taam': { displayName: 'טיב טעם', location: 'ירושלים' },
    'Carrefour': { displayName: 'קרפור', location: 'פתח תקווה' },
    'Yeinot Bitan': { displayName: 'יינות ביתן', location: 'רמת גן' },
    'Other': { displayName: 'אחר', location: 'מיקום לא ידוע' }
  };

  // Extract and format store prices from the product's prices array
  const extractStorePrices = () => {
    if (!product.prices || product.prices.length === 0) return [];
    
    return product.prices.map(priceInfo => {
      const storeInfo = storeDisplayInfo[priceInfo.supermarket] || {
        displayName: priceInfo.supermarket,
        location: 'מיקום לא ידוע'
      };
      
      return {
        store: storeInfo.displayName,
        price: priceInfo.price,
        location: storeInfo.location,
        lastUpdated: priceInfo.lastChecked ? 
          new Date(priceInfo.lastChecked).toLocaleDateString('he-IL') : 'לא ידוע',
        availability: 'במלאי', // Default since we don't have availability data yet
        isOnSale: priceInfo.isOnSale || false,
        salePercentage: priceInfo.salePercentage || null,
        originalPrice: priceInfo.originalPrice || null
      };
    }).sort((a, b) => a.price - b.price);
  };

  // Calculate price stats from available store prices
  const calculatePriceStats = (storePrices) => {
    if (storePrices.length === 0) return null;
    
    const prices = storePrices.map(item => item.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  };

  const storePrices = extractStorePrices();
  const priceStats = product.priceStats || calculatePriceStats(storePrices);

  if (!priceStats || storePrices.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#6b7280' }}>מידע על מחירים אינו זמין</p>
      </div>
    );
  }

  const { minPrice, maxPrice } = priceStats;

  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Product Info */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <span>{product.brand || 'מותג לא ידוע'}</span>
          <span>•</span>
          <span>{product.category?.name || 'קטגוריה לא ידועה'}</span>
        </div>
      </div>

      {/* Price Summary */}
      <div style={{
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              המחיר הנמוך ביותר
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669' }}>
              {formatPrice(minPrice)}
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              טווח מחירים
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
              {minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`}
            </div>
          </div>
        </div>
      </div>

      {/* Individual Store Prices */}
      <div>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '1rem'
        }}>
          מחירים בחנויות ({storePrices.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {storePrices.map((priceItem, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '1rem',
                backgroundColor: index === 0 ? '#f0fdf4' : 'white',
                borderColor: index === 0 ? '#bbf7d0' : '#e5e7eb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                      {priceItem.store}
                      {index === 0 && (
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: '#059669',
                          color: 'white',
                          fontSize: '0.75rem',
                          borderRadius: '9999px',
                          fontWeight: '500'
                        }}>
                          המחיר הטוב ביותר
                        </span>
                      )}
                      {priceItem.isOnSale && (
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.125rem 0.5rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          fontSize: '0.75rem',
                          borderRadius: '9999px',
                          fontWeight: '500'
                        }}>
                          מבצע!
                        </span>
                      )}
                    </h4>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111827' }}>
                        {formatPrice(priceItem.price)}
                      </div>
                      {priceItem.isOnSale && priceItem.originalPrice && (
                        <div style={{ 
                          fontSize: '0.875rem', 
                          color: '#6b7280', 
                          textDecoration: 'line-through' 
                        }}>
                          {formatPrice(priceItem.originalPrice)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin style={{ width: '1rem', height: '1rem' }} />
                      {priceItem.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock style={{ width: '1rem', height: '1rem' }} />
                      עודכן {priceItem.lastUpdated}
                    </div>
                    <div style={{
                      color: priceItem.availability === 'במלאי' ? '#059669' : '#dc2626',
                      fontWeight: '500'
                    }}>
                      {priceItem.availability}
                    </div>
                    {priceItem.salePercentage && (
                      <div style={{
                        color: '#dc2626',
                        fontWeight: '600'
                      }}>
                        חיסכון {priceItem.salePercentage}%
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    marginLeft: '1rem'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  title="עבור לחנות"
                >
                  <ExternalLink style={{ width: '1rem', height: '1rem', color: '#6b7280' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          המחירים מתעדכנים באופן תקופתי מחנויות שונות
        </div>
      </div>
    </div>
  );
};

export default PriceDisplay; 