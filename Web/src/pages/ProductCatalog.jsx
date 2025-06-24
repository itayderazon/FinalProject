import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useProductCatalog from '../hooks/useProductCatalog';
import SearchAndFilters from '../components/ui/SearchAndFilters';
import ProductList from '../components/product/ProductList';
import Pagination from '../components/ui/Pagination';

const ProductCatalog = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Check if we're in select mode
  const selectMode = searchParams.get('selectMode') === 'true';
  const returnTo = searchParams.get('returnTo') || 'menu-generator';
  const {
    // Data
    products,
    categories,
    pagination,
    
    // State
    loading,
    error,
    searchQuery,
    selectedCategory,
    viewMode,
    currentPage,
    filters,
    showFilters,
    
    // Setters
    setSearchQuery,
    setSelectedCategory,
    setViewMode,
    setCurrentPage,
    setShowFilters,
    
    // Handlers
    handleSearch,
    handleFilterChange,
    formatPrice,
    
    // Image utilities
    fetchProductImage,
    getProductImageUrl,
    handleImageError
  } = useProductCatalog();

  const handleSelectProduct = (product) => {
    const productId = product.id || product._id;
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => (p.id || p._id) === productId);
      if (isSelected) {
        return prev.filter(p => (p.id || p._id) !== productId);
      } else {
        return [...prev, product];
      }
    });
  };

  const handleConfirmSelection = () => {
    // Navigate back to menu generator with selected products
    const productIds = selectedProducts.map(p => p.id || p._id).join(',');
    navigate(`/${returnTo}?requiredProducts=${productIds}`);
  };

  const handleCancelSelection = () => {
    navigate(`/${returnTo}`);
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '0.5rem', 
          padding: '1rem', 
          color: '#b91c1c',
          maxWidth: '28rem',
          margin: '0 auto'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: '700', color: '#111827', marginBottom: '0.5rem' }}>
            {selectMode ? 'Choose Products for Menu' : 'קטלוג מוצרים'}
          </h1>
          <p style={{ color: '#6b7280' }}>
            {selectMode 
              ? `Select products to include in your menu (${selectedProducts.length} selected)`
              : `גלה ומשווה מחירים של ${products.length} מוצרים`
            }
          </p>
        </div>

        {/* Selection Actions */}
        {selectMode && (
          <div style={{ 
            marginBottom: '2rem', 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem',
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.75rem',
            border: '1px solid #e5e7eb'
          }}>
            <button
              onClick={handleCancelSelection}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSelection}
              disabled={selectedProducts.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: selectedProducts.length > 0 ? '#16a34a' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: selectedProducts.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedProducts.length > 0) {
                  e.target.style.backgroundColor = '#15803d';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedProducts.length > 0) {
                  e.target.style.backgroundColor = '#16a34a';
                }
              }}
            >
              Confirm Selection ({selectedProducts.length})
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="search-filters">
          <SearchAndFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            handleSearch={handleSearch}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filters={filters}
            handleFilterChange={handleFilterChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        </div>

        {/* Products List */}
        <ProductList
          products={products}
          viewMode={viewMode}
          formatPrice={formatPrice}
          loading={loading}
          fetchProductImage={fetchProductImage}
          getProductImageUrl={getProductImageUrl}
          handleImageError={handleImageError}
          selectMode={selectMode}
          onSelectProduct={handleSelectProduct}
          selectedProducts={selectedProducts}
        />

        {/* Pagination */}
        {console.log('Pagination Debug:', { pagination, currentPage, totalPages: pagination.totalPages, totalProducts: products.length })}
        {(pagination.totalPages > 1 || products.length >= 20) && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <Pagination
              pagination={{
                ...pagination,
                totalPages: pagination.totalPages || Math.ceil(products.length / 20)
              }}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}
        
        {/* Debug info - remove after testing */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
          Products: {products.length} | Current Page: {currentPage} | Total Pages: {pagination.totalPages} | Has Next: {pagination.hasNext} | Has Prev: {pagination.hasPrev}
        </div>
        
        {/* Force show pagination for testing */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', padding: '1rem', backgroundColor: '#e5e7eb', borderRadius: '0.5rem' }}>
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              marginRight: '0.5rem',
              cursor: 'pointer'
            }}
          >
            ← Previous
          </button>
          <span style={{ padding: '0.5rem 1rem', backgroundColor: 'white', borderRadius: '0.25rem', marginRight: '0.5rem' }}>
            Page {currentPage}
          </span>
          <button 
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCatalog; 