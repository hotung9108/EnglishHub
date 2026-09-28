import { useCallback, useState } from 'react';
import type { ICrudService, PaginationParams } from '../types/api.types';
import { usePagination, type UsePaginationOptions } from './usePagination';
import { useMutation } from './useMutation';
import { ApiException } from '../api/core/errorHandler';

export interface UseCrudOptions<TParams extends PaginationParams> extends UsePaginationOptions<TParams> {
  onCreated?: () => void;
  onUpdated?: () => void;
  onDeleted?: () => void;
}

/**
 * useCrud - High-level hook unifying CRUD operations for any BaseCrudService or ICrudService.
 * Automates listing, pagination, mutations, and cache refresh.
 */
export function useCrud<
  T,
  TCreateDto = Partial<T>,
  TUpdateDto = Partial<T>,
  TParams extends PaginationParams = PaginationParams
>(
  service: ICrudService<T, TCreateDto, TUpdateDto, TParams>,
  options: UseCrudOptions<TParams> = {}
) {
  const { onCreated, onUpdated, onDeleted, ...paginationOptions } = options;
  const [selectedItem, setSelectedItem] = useState<T | null>(null);

  // 1. Pagination & List State
  const pagination = usePagination<T, TParams>(
    (params) => service.getAll(params),
    paginationOptions
  );

  // 2. Mutations
  const createMutation = useMutation<T, TCreateDto>(
    (dto) => service.create(dto),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onCreated?.();
      },
    }
  );

  const updateMutation = useMutation<T, { id: string | number; dto: TUpdateDto }>(
    ({ id, dto }) => service.update(id, dto),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onUpdated?.();
      },
    }
  );

  const patchMutation = useMutation<T, { id: string | number; dto: Partial<TUpdateDto> }>(
    ({ id, dto }) => service.patch(id, dto),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onUpdated?.();
      },
    }
  );

  const deleteMutation = useMutation<boolean | void, string | number>(
    (id) => service.delete(id),
    {
      onSuccess: async () => {
        await pagination.refetch();
        onDeleted?.();
      },
    }
  );

  const getById = useCallback(
    async (id: string | number): Promise<T> => {
      try {
        const item = await service.getById(id);
        setSelectedItem(item);
        return item;
      } catch (err) {
        if (err instanceof ApiException) throw err;
        throw err;
      }
    },
    [service]
  );

  const isMutating =
    createMutation.isLoading ||
    updateMutation.isLoading ||
    patchMutation.isLoading ||
    deleteMutation.isLoading;

  return {
    ...pagination,
    selectedItem,
    setSelectedItem,
    getById,
    createItem: createMutation.mutateAsync,
    updateItem: (id: string | number, dto: TUpdateDto) => updateMutation.mutateAsync({ id, dto }),
    patchItem: (id: string | number, dto: Partial<TUpdateDto>) => patchMutation.mutateAsync({ id, dto }),
    deleteItem: deleteMutation.mutateAsync,
    isMutating,
    mutationError:
      createMutation.error ||
      updateMutation.error ||
      patchMutation.error ||
      deleteMutation.error,
  };
}
