import { useState, useCallback, useEffect, useRef } from 'react';
import type { PageResult, PaginationParams } from '../types/api.types';
import { ApiException, normalizeError } from '../api/core/errorHandler';

export interface UsePaginationOptions<TParams extends PaginationParams> {
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: Partial<TParams>;
  immediate?: boolean;
}

export interface UsePaginationReturn<T, TParams extends PaginationParams> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error: ApiException | null;
  filters: Partial<TParams>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setFilters: (filters: Partial<TParams> | ((prev: Partial<TParams>) => Partial<TParams>)) => void;
  refetch: () => Promise<void>;
  reset: () => void;
}

/**
 * usePagination - Reusable pagination and filter state management hook.
 * Handles page sizing, offsets, filtering, and standard UI loading/empty states.
 */
export function usePagination<T, TParams extends PaginationParams = PaginationParams>(
  fetchFn: (params: TParams) => Promise<PageResult<T> | T[]>,
  options: UsePaginationOptions<TParams> = {}
): UsePaginationReturn<T, TParams> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialFilters = {} as Partial<TParams>,
    immediate = true,
  } = options;

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [filters, setFiltersState] = useState<Partial<TParams>>(initialFilters);

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiException | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const fetchFnRef = useRef(fetchFn);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / (pageSize || 1)));
  const hasNext = page < totalPages;
  const hasPrevious = page > 1;

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = {
        page,
        size: pageSize,
        ...filters,
      } as TParams;

      const result = await fetchFnRef.current(queryParams);

      if (isMountedRef.current) {
        if (Array.isArray(result)) {
          setItems(result);
          setTotal(result.length);
        } else if (result && typeof result === 'object' && 'items' in result) {
          setItems(result.items || []);
          setTotal(result.total ?? result.items?.length ?? 0);
        } else {
          setItems([]);
          setTotal(0);
        }
        setIsLoading(false);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(normalizeError(err));
        setIsLoading(false);
      }
    }
  }, [page, pageSize, filters]);

  const handlePageChange = useCallback((newPage: number) => {
    setIsLoading(true);
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setIsLoading(true);
    setPageSize(newSize);
    setPage(1); // Reset to first page on size change
  }, []);

  const setFilters = useCallback(
    (newFilters: Partial<TParams> | ((prev: Partial<TParams>) => Partial<TParams>)) => {
      setIsLoading(true);
      setFiltersState((prev) => {
        const updated = typeof newFilters === 'function' ? newFilters(prev) : newFilters;
        return updated;
      });
      setPage(1); // Reset to first page when filtering
    },
    []
  );

  const nextPage = useCallback(() => {
    if (hasNext) {
      setIsLoading(true);
      setPage((prev) => prev + 1);
    }
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrevious) {
      setIsLoading(true);
      setPage((prev) => prev - 1);
    }
  }, [hasPrevious]);

  const reset = useCallback(() => {
    setIsLoading(true);
    setPage(initialPage);
    setPageSize(initialPageSize);
    setFiltersState(initialFilters);
  }, [initialPage, initialPageSize, initialFilters]);

  // Synchronize data fetching with page, pageSize, and filters
  useEffect(() => {
    let isSubscribed = true;

    void (async () => {
      try {
        const queryParams = {
          page,
          size: pageSize,
          ...filters,
        } as TParams;

        const result = await fetchFnRef.current(queryParams);

        if (isSubscribed && isMountedRef.current) {
          if (Array.isArray(result)) {
            setItems(result);
            setTotal(result.length);
          } else if (result && typeof result === 'object' && 'items' in result) {
            setItems(result.items || []);
            setTotal(result.total ?? result.items?.length ?? 0);
          } else {
            setItems([]);
            setTotal(0);
          }
          setIsLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isSubscribed && isMountedRef.current) {
          setError(normalizeError(err));
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [page, pageSize, filters]);

  const isError = error !== null;
  const isEmpty = !isLoading && !isError && items.length === 0;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasNext,
    hasPrevious,
    isLoading,
    isError,
    isEmpty,
    error,
    filters,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    nextPage,
    prevPage,
    setFilters,
    refetch,
    reset,
  };
}
