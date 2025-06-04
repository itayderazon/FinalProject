import React from 'react';
import useProductCatalog from '../hooks/useProductCatalog';
import SearchAndFilters from '../components/ui/SearchAndFilters';
import ProductList from '../components/product/ProductList';
import Pagination from '../components/ui/Pagination';

const ProductCatalog = () => {
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
    formatPrice
  } = useProductCatalog();

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
            קטלוג מוצרים
          </h1>
          <p style={{ color: '#6b7280' }}>
            גלה ומשווה מחירים של {products.length} מוצרים
          </p>
        </div>

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
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
            <Pagination
              pagination={pagination}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCatalog; 