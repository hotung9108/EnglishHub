import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiException, normalizeError } from '../api/core/errorHandler';

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: ApiException, variables: TVariables) => void | Promise<void>;
  onSettled?: (
    data: TData | undefined,
    error: ApiException | null,
    variables: TVariables
  ) => void | Promise<void>;
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | undefined>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: ApiException | null;
  reset: () => void;
}

/**
 * useMutation - Reusable hook for executing state-modifying requests (POST, PUT, PATCH, DELETE).
 * Adheres to Single Responsibility Principle and reactive async state management.
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationReturn<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<ApiException | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const mutationFnRef = useRef(mutationFn);
  const optionsRef = useRef(options);

  useEffect(() => {
    mutationFnRef.current = mutationFn;
    optionsRef.current = options;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await mutationFnRef.current(variables);

        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          setIsSuccess(true);
        }

        await optionsRef.current.onSuccess?.(result, variables);
        await optionsRef.current.onSettled?.(result, null, variables);

        return result;
      } catch (err) {
        const normalized = normalizeError(err);

        if (isMountedRef.current) {
          setError(normalized);
          setIsLoading(false);
          setIsSuccess(false);
        }

        await optionsRef.current.onError?.(normalized, variables);
        await optionsRef.current.onSettled?.(undefined, normalized, variables);

        throw normalized;
      }
    },
    []
  );

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | undefined> => {
      try {
        return await mutateAsync(variables);
      } catch {
        // Handled through state and onError callback
        return undefined;
      }
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    data,
    isLoading,
    isError: error !== null,
    isSuccess,
    error,
    reset,
  };
}
