import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, currentPage, setCurrentPage }) => {
  const normalized = pagination || {};
  const totalPages = Number(
    normalized.totalPages ??
    normalized.total_pages ??
    normalized.pages ??
    1
  );
  const pageFromApi = Number(normalized.page ?? normalized.currentPage ?? currentPage ?? 1);
  const hasNext = Boolean(
    normalized.hasNext ??
    normalized.has_next ??
    normalized.hasNextPage ??
    normalized.has_next_page ??
    (pageFromApi < totalPages)
  );
  const hasPrev = Boolean(
    normalized.hasPrev ??
    normalized.has_prev ??
    normalized.hasPrevPage ??
    normalized.has_prev_page ??
    (pageFromApi > 1)
  );

  const canGoPrev = hasPrev || currentPage > 1;
  const canGoNext = hasNext || currentPage < totalPages;

  const buttonStyle = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#2563eb',
    color: 'white',
    border: '1px solid #2563eb'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    cursor: 'not-allowed'
  };

  // Generate array of page numbers to display
  const getVisiblePages = () => {
    const maxVisiblePages = 5;
    const pages = [];
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // Debug: Force show pagination for testing
  // if (totalPages <= 1) return null;

  return (
    <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {/* Previous button */}
        <button
          onClick={() => canGoPrev && setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={!canGoPrev}
          style={!canGoPrev ? disabledButtonStyle : buttonStyle}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
          <span>Previous</span>
        </button>

        {/* Page numbers */}
        {getVisiblePages().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span style={{ padding: '0.5rem', color: '#6b7280' }}>...</span>
            ) : (
              <button
                onClick={() => setCurrentPage(page)}
                style={currentPage === page ? activeButtonStyle : buttonStyle}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* Page indicator */}
        <span style={{ padding: '0.5rem', color: '#6b7280' }}>
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        {/* Next button */}
        <button
          onClick={() => canGoNext && setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={!canGoNext}
          style={!canGoNext ? disabledButtonStyle : activeButtonStyle}
          title="Next"
          aria-label="Next"
        >
          <span>Next</span>
          <ChevronRight style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination; 