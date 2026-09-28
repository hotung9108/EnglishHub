import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiException, normalizeError } from '../api/core/errorHandler';
import type { PageResult } from '../types/api.types';

export interface UseApiOptions<T, P extends unknown[]> {
  /** If true, executes the API function immediately on mount. Default: false */
  immediate?: boolean;
  /** Initial arguments to pass to the API function when immediate is true */
  initialParams?: P;
  /** Initial data value */
  initialData?: T | null;
  /** Callback fired upon successful completion */
  onSuccess?: (data: T) => void;
  /** Callback fired upon failure */
  onError?: (error: ApiException) => void;
  /** Custom predicate function to determine if data is considered empty */
  checkIsEmpty?: (data: T | null) => boolean;
}

export interface UseApiReturn<T, P extends unknown[]> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error: ApiException | null;
  execute: (...args: P) => Promise<T>;
  refetch: () => Promise<T>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  reset: () => void;
}

/**
 * Checks whether the given data represents an empty dataset.
 */
function defaultCheckIsEmpty<T>(data: T | null): boolean {
  if (data === null || data === undefined) {
    return true;
  }
  if (Array.isArray(data)) {
    return data.length === 0;
  }
  if (typeof data === 'object' && 'items' in (data as object)) {
    const pageResult = data as unknown as PageResult<unknown>;
    return Array.isArray(pageResult.items) && pageResult.items.length === 0;
  }
  return false;
}

/**
 * useApi - Core reusable data fetching hook adhering to convention-fe.md rule 4.2.
 * Strictly guarantees all 3 UI states: isLoading, isError, and isEmpty.
 */
export function useApi<T, P extends unknown[] = []>(
  apiFn: (...args: P) => Promise<T>,
  options: UseApiOptions<T, P> = {}
): UseApiReturn<T, P> {
  const {
    immediate = false,
    initialParams = [] as unknown as P,
    initialData = null,
    onSuccess,
    onError,
    checkIsEmpty = defaultCheckIsEmpty,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiException | null>(null);

  // Keep references to prevent state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  const lastParamsRef = useRef<P>(initialParams);
  const apiFnRef = useRef(apiFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    apiFnRef.current = apiFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: P): Promise<T> => {
      lastParamsRef.current = args;
      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFnRef.current(...args);
        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          onSuccessRef.current?.(result);
        }
        return result;
      } catch (err) {
        const normalized = normalizeError(err);
        if (isMountedRef.current) {
          setError(normalized);
          setIsLoading(false);
          onErrorRef.current?.(normalized);
        }
        throw normalized;
      }
    },
    []
  );

  const refetch = useCallback((): Promise<T> => {
    return execute(...lastParamsRef.current);
  }, [execute]);

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  // Execute immediately if requested without synchronous setState in effect
  useEffect(() => {
    if (!immediate) return;

    let isSubscribed = true;

    void (async () => {
      try {
        const result = await apiFnRef.current(...initialParams);
        if (isSubscribed && isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          onSuccessRef.current?.(result);
        }
      } catch (err) {
        const normalized = normalizeError(err);
        if (isSubscribed && isMountedRef.current) {
          setError(normalized);
          setIsLoading(false);
          onErrorRef.current?.(normalized);
        }
      }
    })();

    return () => {
      isSubscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isError = error !== null;
  const isEmpty = !isLoading && !isError && checkIsEmpty(data);

  return {
    data,
    isLoading,
    isError,
    isEmpty,
    error,
    execute,
    refetch,
    setData,
    reset,
  };
}
