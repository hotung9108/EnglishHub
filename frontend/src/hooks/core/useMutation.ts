import { useState, useCallback, useRef, useEffect } from 'react';
import { parseApiError } from '@/api/core/errors';
import type { ApiClientError } from '@/api/core/errors';
import type { UseMutationOptions, UseMutationResult } from './types';

export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TVariables>
): UseMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options || {};

  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<ApiClientError | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const mutationFnRef = useRef(mutationFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const onSettledRef = useRef(onSettled);

  useEffect(() => {
    mutationFnRef.current = mutationFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onSettledRef.current = onSettled;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData(null);
      setIsLoading(false);
      setIsSuccess(false);
      setIsError(false);
      setError(null);
    }
  }, []);

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await mutationFnRef.current(variables);

      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
        setIsSuccess(true);
        setIsError(false);
        setError(null);
      }

      if (onSuccessRef.current) {
        await onSuccessRef.current(result, variables);
      }
      if (onSettledRef.current) {
        await onSettledRef.current(result, null, variables);
      }

      return result;
    } catch (err) {
      const parsedError = parseApiError(err);

      if (isMountedRef.current) {
        setIsLoading(false);
        setIsSuccess(false);
        setIsError(true);
        setError(parsedError);
      }

      if (onErrorRef.current) {
        await onErrorRef.current(parsedError, variables);
      }
      if (onSettledRef.current) {
        await onSettledRef.current(null, parsedError, variables);
      }

      throw parsedError;
    }
  }, []);

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Handled via state and onError callback
      });
    },
    [mutateAsync]
  );

  return {
    data,
    isLoading,
    isSuccess,
    isError,
    error,
    mutate,
    mutateAsync,
    reset,
  };
}
