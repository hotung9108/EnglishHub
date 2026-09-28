import type { ApiClientError } from '@/api/core/errors';

export interface AsyncState<TData> {
  data: TData | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiClientError | null;
}

export interface UseQueryOptions<TData> {
  enabled?: boolean;
  immediate?: boolean;
  initialData?: TData | null;
  onSuccess?: (data: TData) => void;
  onError?: (error: ApiClientError) => void;
  transform?: (data: unknown) => TData;
}

export interface UseQueryResult<TData, TParams = void> extends AsyncState<TData> {
  refetch: (params?: TParams) => Promise<TData | null>;
  setData: (data: TData | null | ((prev: TData | null) => TData | null)) => void;
  reset: () => void;
}

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: ApiClientError, variables: TVariables) => void | Promise<void>;
  onSettled?: (data: TData | null, error: ApiClientError | null, variables: TVariables) => void | Promise<void>;
}

export interface UseMutationResult<TData, TVariables> extends AsyncState<TData> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}
