import { useState, useCallback, useEffect, useRef } from 'react';
import { parseApiError } from '@/api/core/errors';
import type { ApiClientError } from '@/api/core/errors';
import type { PageResult, PaginationParams } from '@/types/api.types';

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
  error: ApiClientError | null;
  filters: Partial<TParams>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setFilters: (filters: Partial<TParams> | ((prev: Partial<TParams>) => Partial<TParams>)) => void;
  refetch: () => Promise<void>;
  reset: () => void;
}

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
  const [error, setError] = useState<ApiClientError | null>(null);

  const fetchFnRef = useRef(fetchFn);
  const isMountedRef = useRef<boolean>(true);

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
        setError(parseApiError(err));
        setIsLoading(false);
      }
    }
  }, [page, pageSize, filters]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const setFilters = useCallback(
    (newFilters: Partial<TParams> | ((prev: Partial<TParams>) => Partial<TParams>)) => {
      setFiltersState(prev => (typeof newFilters === 'function' ? newFilters(prev) : newFilters));
      setPage(1);
    },
    []
  );

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(prev => prev + 1);
    }
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrevious) {
      setPage(prev => prev - 1);
    }
  }, [hasPrevious]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setFiltersState(initialFilters);
  }, [initialPage, initialPageSize, initialFilters]);

  const serializedFilters = JSON.stringify(filters);

  useEffect(() => {
    if (!immediate) return;

    let isIgnore = false;

    queueMicrotask(async () => {
      if (isIgnore) return;
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = {
          page,
          size: pageSize,
          ...filters,
        } as TParams;

        const result = await fetchFnRef.current(queryParams);

        if (isIgnore || !isMountedRef.current) return;

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
      } catch (err) {
        if (isIgnore || !isMountedRef.current) return;
        setError(parseApiError(err));
        setIsLoading(false);
      }
    });

    return () => {
      isIgnore = true;
    };
  }, [immediate, page, pageSize, serializedFilters, filters]);

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
