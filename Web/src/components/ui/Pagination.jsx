import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ pagination, currentPage, setCurrentPage }) => {
  const { totalPages } = pagination;

  const buttonStyle = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'background-color 0.2s ease'
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

  if (totalPages <= 1) return null;

  return (
    <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        {/* Previous button */}
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={currentPage === 1 ? disabledButtonStyle : buttonStyle}
        >
          <ChevronRight style={{ width: '1rem', height: '1rem' }} />
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

        {/* Next button */}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={currentPage === totalPages ? disabledButtonStyle : buttonStyle}
        >
          <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>
    </nav>
  );
};

export default Pagination; 