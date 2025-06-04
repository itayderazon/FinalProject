import { useState, useEffect } from 'react';
import productService from '../services/productService';
import { formatPrice } from '../utils/formatters';

const useProductCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    maxCalories: '',
    minProtein: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productService.getCategories();
        setCategories(response.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [currentPage, selectedCategory, filters, searchQuery]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        category: selectedCategory,
        search: searchQuery,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        maxCalories: filters.maxCalories,
        minProtein: filters.minProtein
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await productService.getProducts(params);
      setProducts(response.products || []);
      setPagination(response.pagination || {});
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  return {
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
    
    // Actions
    fetchProducts
  };
};

export default useProductCatalog;