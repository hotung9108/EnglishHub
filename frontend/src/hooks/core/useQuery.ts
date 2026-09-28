import { useState, useCallback, useEffect, useRef } from 'react';
import { parseApiError } from '@/api/core/errors';
import type { ApiClientError } from '@/api/core/errors';
import type { UseQueryOptions, UseQueryResult } from './types';

export function useQuery<TData, TParams = void>(
  queryFn: (params?: TParams) => Promise<TData>,
  params?: TParams,
  options?: UseQueryOptions<TData>
): UseQueryResult<TData, TParams> {
  const {
    enabled = true,
    immediate = true,
    initialData = null,
    onSuccess,
    onError,
    transform,
  } = options || {};

  const [data, setDataState] = useState<TData | null>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(enabled && immediate);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  const queryFnRef = useRef(queryFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const transformRef = useRef(transform);
  const paramsRef = useRef(params);

  useEffect(() => {
    queryFnRef.current = queryFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    transformRef.current = transform;
    paramsRef.current = params;
  });

  const serializedParams = typeof params === 'object' && params !== null ? JSON.stringify(params) : String(params);

  const refetch = useCallback(
    async (overrideParams?: TParams): Promise<TData | null> => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const queryParam = overrideParams !== undefined ? overrideParams : paramsRef.current;
        const rawResult = await queryFnRef.current(queryParam);
        const finalResult = transformRef.current ? transformRef.current(rawResult) : rawResult;

        setDataState(finalResult);
        setIsLoading(false);
        setIsSuccess(true);
        setIsError(false);
        setError(null);

        if (onSuccessRef.current) {
          onSuccessRef.current(finalResult);
        }
        return finalResult;
      } catch (err) {
        const parsedError = parseApiError(err);
        setIsLoading(false);
        setIsSuccess(false);
        setIsError(true);
        setError(parsedError);

        if (onErrorRef.current) {
          onErrorRef.current(parsedError);
        }
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setDataState(initialData);
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
    setError(null);
  }, [initialData]);

  const setData = useCallback((updater: TData | null | ((prev: TData | null) => TData | null)) => {
    setDataState(prev => (typeof updater === 'function' ? (updater as (p: TData | null) => TData | null)(prev) : updater));
  }, []);

  useEffect(() => {
    if (!enabled || !immediate) {
      return;
    }

    let isIgnore = false;

    // Execute in microtask to avoid synchronous setState inside effect body
    queueMicrotask(async () => {
      if (isIgnore) return;
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const rawResult = await queryFnRef.current(paramsRef.current);
        if (isIgnore) return;
        const finalResult = transformRef.current ? transformRef.current(rawResult) : rawResult;

        setDataState(finalResult);
        setIsLoading(false);
        setIsSuccess(true);
        setIsError(false);
        setError(null);

        onSuccessRef.current?.(finalResult);
      } catch (err) {
        if (isIgnore) return;
        const parsedError = parseApiError(err);

        setIsLoading(false);
        setIsSuccess(false);
        setIsError(true);
        setError(parsedError);

        onErrorRef.current?.(parsedError);
      }
    });

    return () => {
      isIgnore = true;
    };
  }, [enabled, immediate, serializedParams]);

  return {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    refetch,
    setData,
    reset,
  };
}
