import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';

const SearchAndFilters = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  categories,
  selectedCategory,
  setSelectedCategory,
  showFilters,
  setShowFilters,
  filters,
  handleFilterChange,
  viewMode,
  setViewMode
}) => {
  const inputStyle = {
    width: '100%',
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '1rem',
    outline: 'none'
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  return (
    <div>
      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: '1', position: 'relative' }}>
            <Search 
              style={{ 
                position: 'absolute', 
                left: '0.75rem', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#9ca3af', 
                width: '1.25rem', 
                height: '1.25rem' 
              }} 
            />
            <input
              type="text"
              placeholder="חפש מוצרים..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '2.5rem' }}
            />
          </div>
          <button type="submit" style={primaryButtonStyle}>
            חפש
          </button>
        </div>
      </form>

      {/* Category Selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={inputStyle}
        >
          <option value="">כל הקטגוריות</option>
          {categories.map((category, index) => (
            <option key={category.id || category.name_he || index} value={category.name_he}>
              {category.name_he}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{ ...secondaryButtonStyle, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Filter style={{ width: '1rem', height: '1rem' }} />
          סינון נוסף
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{
              ...buttonStyle,
              backgroundColor: viewMode === 'grid' ? '#dbeafe' : 'transparent',
              color: viewMode === 'grid' ? '#2563eb' : '#9ca3af',
              border: 'none'
            }}
          >
            <Grid style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...buttonStyle,
              backgroundColor: viewMode === 'list' ? '#dbeafe' : 'transparent',
              color: viewMode === 'list' ? '#2563eb' : '#9ca3af',
              border: 'none'
            }}
          >
            <List style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e5e7eb' 
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              מחיר מינימלי
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              style={{ ...inputStyle, fontSize: '0.875rem' }}
              placeholder="₪"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              מחיר מקסימלי
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              style={{ ...inputStyle, fontSize: '0.875rem' }}
              placeholder="₪"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              מקס קלוריות
            </label>
            <input
              type="number"
              value={filters.maxCalories}
              onChange={(e) => handleFilterChange('maxCalories', e.target.value)}
              style={{ ...inputStyle, fontSize: '0.875rem' }}
              placeholder="לכל 100 גרם"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              מין חלבון
            </label>
            <input
              type="number"
              value={filters.minProtein}
              onChange={(e) => handleFilterChange('minProtein', e.target.value)}
              style={{ ...inputStyle, fontSize: '0.875rem' }}
              placeholder="גרם"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              מיון לפי
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              style={{ ...inputStyle, fontSize: '0.875rem' }}
            >
              <option value="name">שם</option>
              <option value="category">קטגוריה</option>
              <option value="createdAt">תאריך הוספה</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters; 