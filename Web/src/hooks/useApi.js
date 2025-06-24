import { useState, useEffect, useCallback } from 'react';

export const useApi = (apiCall, options = {}) => {
  const {
    immediate = false,
    dependencies = [],
    onSuccess,
    onError,
    transform = (data) => data
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiCall(...args);
      const transformedData = transform(response.data || response);
      
      setData(transformedData);
      onSuccess?.(transformedData);
      
      return { success: true, data: transformedData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      onError?.(err);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiCall, transform, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

// Specialized hook for paginated data
export const usePaginatedApi = (apiCall, options = {}) => {
  const { pageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const { data, loading, error, execute: baseExecute } = useApi(apiCall, {
    ...options,
    transform: (response) => {
      setTotalPages(response.totalPages || 0);
      setTotalItems(response.totalItems || 0);
      return response.items || response.data || response;
    }
  });

  const execute = useCallback((params = {}) => {
    return baseExecute({
      page: currentPage,
      limit: pageSize,
      ...params
    });
  }, [baseExecute, currentPage, pageSize]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  return {
    data,
    loading,
    error,
    execute,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}; 