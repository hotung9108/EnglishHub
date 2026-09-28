import { useState, useCallback } from 'react';
import type { ICrudService } from '@/api/interfaces/http.interface';
import type { PaginationParams } from '@/types/api.types';
import { usePagination, type UsePaginationOptions, type UsePaginationReturn } from './usePagination';
import { useMutation } from './useMutation';
import type { ApiClientError } from '@/api/core/errors';

export interface UseCrudOptions<TParams extends PaginationParams> extends UsePaginationOptions<TParams> {
  onCreated?: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

export interface UseCrudReturn<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  ID = string | number,
  TParams extends PaginationParams = PaginationParams
> extends UsePaginationReturn<T, TParams> {
  selectedItem: T | null;
  setSelectedItem: (item: T | null) => void;
  getById: (id: ID) => Promise<T>;
  createItem: (payload: TCreate) => Promise<T>;
  updateItem: (id: ID, payload: TUpdate) => Promise<T>;
  patchItem: (id: ID, payload: Partial<TUpdate>) => Promise<T>;
  deleteItem: (id: ID) => Promise<void>;
  isMutating: boolean;
  mutationError: ApiClientError | null;
}

export function useCrud<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  ID = string | number,
  TParams extends PaginationParams = PaginationParams
>(
  service: ICrudService<T, TCreate, TUpdate, ID, TParams>,
  options: UseCrudOptions<TParams> = {}
): UseCrudReturn<T, TCreate, TUpdate, ID, TParams> {
  const { onCreated, onUpdated, onDeleted, ...paginationOptions } = options;
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  const pagination = usePagination<T, TParams>(
    params => service.getAll(params),
    paginationOptions
  );

  const createMutation = useMutation<T, TCreate>(
    payload => service.create(payload),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onCreated?.();
      },
    }
  );

  const updateMutation = useMutation<T, { id: ID; payload: TUpdate }>(
    ({ id, payload }) => service.update(id, payload),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onUpdated?.();
      },
    }
  );

  const patchMutation = useMutation<T, { id: ID; payload: Partial<TUpdate> }>(
    ({ id, payload }) => service.patch(id, payload),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onUpdated?.();
      },
    }
  );

  const deleteMutation = useMutation<void, ID>(
    id => service.delete(id),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onDeleted?.();
      },
    }
  );

  const getById = useCallback(
    async (id: ID): Promise<T> => {
      const item = await service.getById(id);
      setSelectedItem(item);
      return item;
    },
    [service]
  );

  const isMutating =
    createMutation.isLoading ||
    updateMutation.isLoading ||
    patchMutation.isLoading ||
    deleteMutation.isLoading;

  const mutationError =
    createMutation.error ||
    updateMutation.error ||
    patchMutation.error ||
    deleteMutation.error;

  return {
    ...pagination,
    selectedItem,
    setSelectedItem,
    getById,
    createItem: createMutation.mutateAsync,
    updateItem: (id: ID, payload: TUpdate) => updateMutation.mutateAsync({ id, payload }),
    patchItem: (id: ID, payload: Partial<TUpdate>) => patchMutation.mutateAsync({ id, payload }),
    deleteItem: deleteMutation.mutateAsync,
    isMutating,
    mutationError,
  };
}
