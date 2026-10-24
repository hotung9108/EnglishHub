import React, { useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ChevronDown
} from 'lucide-react';
import { getPageNumbers } from './pagination.utils';

export type PaginationVariant = 'auto' | 'table' | 'standalone';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  disabled?: boolean;
  itemLabel?: string;
  isVi?: boolean;
  className?: string;
  variant?: PaginationVariant;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  disabled = false,
  itemLabel = 'mục',
  isVi = true,
  className = '',
  variant = 'auto',
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const effectiveTotalItems = totalItems !== undefined 
    ? totalItems 
    : Math.max(0, safeTotalPages * pageSize);

  const startItem = effectiveTotalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, effectiveTotalItems);

  const pageNumbers = useMemo(
    () => getPageNumbers(safeCurrentPage, safeTotalPages),
    [safeCurrentPage, safeTotalPages]
  );

  const variantClass = variant === 'table' 
    ? 'eh-pagination-table' 
    : variant === 'standalone' 
      ? 'eh-pagination-standalone' 
      : '';

  return (
    <div 
      className={`eh-pagination ${variantClass} ${className}`.trim()} 
      role="navigation" 
      aria-label="Pagination"
    >
      {/* Left side: Item range info and page size selector */}
      <div className="eh-pagination-info">
        <div className="eh-pagination-range">
          {isVi ? (
            <>
              Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trên tổng số{' '}
              <strong>{effectiveTotalItems}</strong> {itemLabel}
            </>
          ) : (
            <>
              Showing <strong>{startItem}</strong> - <strong>{endItem}</strong> of{' '}
              <strong>{effectiveTotalItems}</strong> {itemLabel}
            </>
          )}
        </div>

        {onPageSizeChange && pageSizeOptions.length > 0 && (
          <>
            <span className="eh-pagination-divider" aria-hidden="true" />
            <div className="eh-pagination-size-select">
              <span className="eh-pagination-size-label">{isVi ? 'Số dòng:' : 'Per page:'}</span>
              <div className="eh-pagination-select-wrapper">
                <select
                  className="eh-pagination-select"
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  disabled={disabled}
                  aria-label={isVi ? 'Số mục trên mỗi trang' : 'Items per page'}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="eh-pagination-select-icon" aria-hidden="true" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right side: Navigation buttons */}
      <div className="eh-pagination-controls" aria-label="Pagination Controls">
        {/* First page button */}
        <button
          type="button"
          className="eh-pagination-btn eh-pagination-nav-btn"
          onClick={() => onPageChange(1)}
          disabled={disabled || safeCurrentPage <= 1}
          aria-label={isVi ? 'Trang đầu' : 'First page'}
          title={isVi ? 'Trang đầu' : 'First page'}
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous page button */}
        <button
          type="button"
          className="eh-pagination-btn eh-pagination-nav-btn"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={disabled || safeCurrentPage <= 1}
          aria-label={isVi ? 'Trang trước' : 'Previous page'}
          title={isVi ? 'Trang trước' : 'Previous page'}
        >
          <ChevronLeft size={15} />
        </button>

        {/* Numeric page buttons with ellipsis */}
        {pageNumbers.map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span key={`ellipsis-${idx}`} className="eh-pagination-ellipsis" aria-hidden="true">
                ...
              </span>
            );
          }

          const isActive = p === safeCurrentPage;
          return (
            <button
              key={`page-${p}`}
              type="button"
              className={`eh-pagination-btn ${isActive ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              disabled={disabled}
              aria-current={isActive ? 'page' : undefined}
              aria-label={isVi ? `Trang ${p}` : `Page ${p}`}
            >
              {p}
            </button>
          );
        })}

        {/* Next page button */}
        <button
          type="button"
          className="eh-pagination-btn eh-pagination-nav-btn"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={disabled || safeCurrentPage >= safeTotalPages}
          aria-label={isVi ? 'Trang sau' : 'Next page'}
          title={isVi ? 'Trang sau' : 'Next page'}
        >
          <ChevronRight size={15} />
        </button>

        {/* Last page button */}
        <button
          type="button"
          className="eh-pagination-btn eh-pagination-nav-btn"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={disabled || safeCurrentPage >= safeTotalPages}
          aria-label={isVi ? 'Trang cuối' : 'Last page'}
          title={isVi ? 'Trang cuối' : 'Last page'}
        >
          <ChevronsRight size={15} />
        </button>
      </div>
    </div>
  );
};
