import { useQuery } from './useQuery';
import { useMutation } from './useMutation';
import { useAsync } from './useAsync';
import type { UseQueryOptions, UseQueryResult, UseMutationOptions, UseMutationResult } from './types';

export function useApiQuery<TData, TParams = void>(
  fetcher: (params?: TParams) => Promise<TData>,
  params?: TParams,
  options?: UseQueryOptions<TData>
): UseQueryResult<TData, TParams> {
  return useQuery<TData, TParams>(fetcher, params, options);
}

export function useApiMutation<TData, TVariables = void>(
  mutator: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TVariables>
): UseMutationResult<TData, TVariables> {
  return useMutation<TData, TVariables>(mutator, options);
}

export { useAsync, useQuery, useMutation };
