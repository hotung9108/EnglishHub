import { useState, useCallback, useRef, useEffect } from 'react';
import { parseApiError } from '@/api/core/errors';
import type { ApiClientError } from '@/api/core/errors';
import type { AsyncState } from './types';

export interface UseAsyncReturn<TData, TArgs extends unknown[]> extends AsyncState<TData> {
  execute: (...args: TArgs) => Promise<TData>;
  setData: (data: TData | null | ((prev: TData | null) => TData | null)) => void;
  reset: () => void;
  cancel: () => void;
}

export function useAsync<TData, TArgs extends unknown[] = []>(
  asyncFn: (...args: TArgs) => Promise<TData>,
  initialData: TData | null = null
): UseAsyncReturn<TData, TArgs> {
  const [state, setState] = useState<AsyncState<TData>>({
    data: initialData,
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const asyncFnRef = useRef(asyncFn);

  useEffect(() => {
    asyncFnRef.current = asyncFn;
  }, [asyncFn]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const reset = useCallback(() => {
    cancel();
    if (isMountedRef.current) {
      setState({
        data: initialData,
        isLoading: false,
        isSuccess: false,
        isError: false,
        error: null,
      });
    }
  }, [cancel, initialData]);

  const setData = useCallback((updater: TData | null | ((prev: TData | null) => TData | null)) => {
    if (!isMountedRef.current) return;
    setState(prev => ({
      ...prev,
      data: typeof updater === 'function' ? (updater as (prev: TData | null) => TData | null)(prev.data) : updater,
    }));
  }, []);

  const execute = useCallback(
    async (...args: TArgs): Promise<TData> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState(prev => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }));

      try {
        const result = await asyncFnRef.current(...args);
        if (isMountedRef.current) {
          setState({
            data: result,
            isLoading: false,
            isSuccess: true,
            isError: false,
            error: null,
          });
        }
        return result;
      } catch (err) {
        const parsedError: ApiClientError = parseApiError(err);
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            isSuccess: false,
            isError: true,
            error: parsedError,
          }));
        }
        throw parsedError;
      }
    },
    []
  );

  return {
    ...state,
    execute,
    setData,
    reset,
    cancel,
  };
}
