import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError } from '@/api/core/errors';
import { classService } from '@/api/services/class.service';
import type {
  AddedClassMemberResponse,
  ClassDetail,
  ClassId,
  ClassMember,
  ClassPagination,
  ClassStatus,
  ClassSummary,
  CreatedClassResponse,
  CreateClassPayload,
} from '@/api/services/class.service';
import type { MessageResponse } from '@/api/services/user.service';
import type {
  AddClassMemberCallbacks,
  AddClassMemberVariables,
  ClassesQuery,
  ClassListState,
  CreateClassCallbacks,
  DeleteClassCallbacks,
  RemoveClassMemberCallbacks,
  RemoveClassMemberVariables,
  UpdateClassCallbacks,
  UpdateClassVariables,
  UseClassesOptions,
  UseClassesResult,
  UseClassQueryOptions,
} from '@/types/classes.types';
import { useQuery } from './core/useQuery';
import { useMutation } from './core/useMutation';
import type { UseMutationResult, UseQueryResult } from './core/types';
import { clampLimit, clampPage, computePagination, pageAfterEmptyRefetch } from './useUsers.utils';

const queryKey = (query: ClassesQuery) => JSON.stringify([query.page, query.limit, query.status]);

export function useClasses(options: UseClassesOptions = {}): UseClassesResult {
  const enabled = options.enabled ?? true;
  const [params, setParams] = useState<ClassesQuery>(() => ({
    page: clampPage(options.initialPage),
    limit: clampLimit(options.initialLimit),
    status: options.initialStatus,
  }));
  const { page, limit, status } = params;
  const [list, setList] = useState<ClassListState>(() => ({
    classes: [],
    pagination: computePagination({ page: params.page, limit: params.limit, total: 0 } as ClassPagination),
    isLoading: enabled,
    isSuccess: false,
    isError: false,
    error: null,
  }));
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const enabledRef = useRef(enabled);
  const query = useRef<ClassesQuery>({ page, limit, status });
  const skipEffectFor = useRef<string | null>(null);
  enabledRef.current = enabled;
  query.current = params;

  const invalidate = useCallback(() => {
    requestId.current++;
    controller.current?.abort();
  }, []);

  const changeQuery = useCallback(
    (next: ClassesQuery) => {
      invalidate();
      query.current = next;
      setParams(next);
    },
    [invalidate]
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);

  const fetchList = useCallback(async (current: ClassesQuery): Promise<ClassSummary[] | null> => {
    if (!enabledRef.current || !mounted.current) return null;
    // Incrementing IDs ensures only the newest filter/page request can update state.
    const id = ++requestId.current;
    controller.current?.abort();
    setList(state => ({ ...state, isLoading: true, isSuccess: false, isError: false, error: null }));

    const load = async (active: ClassesQuery): Promise<ClassSummary[] | null> => {
      const abort = new AbortController();
      controller.current = abort;
      try {
        const result = await classService.list(active, { signal: abort.signal });
        if (!mounted.current || !enabledRef.current || id !== requestId.current) return null;
        // A concurrent delete can leave this page empty, so step back and reload.
        const nextPage = pageAfterEmptyRefetch(active.page, result.data.length);
        if (nextPage !== active.page) {
          const next = { ...active, page: nextPage };
          skipEffectFor.current = queryKey(next);
          query.current = next;
          setParams(next);
          return load(next);
        }
        setList(state => ({
          ...state,
          classes: result.data,
          pagination: computePagination(result.pagination),
          isLoading: false,
          isSuccess: true,
          isError: false,
          error: null,
        }));
        return result.data;
      } catch (cause) {
        if (mounted.current && enabledRef.current && id === requestId.current) {
          setList(state => ({
            ...state,
            isLoading: false,
            isSuccess: false,
            isError: true,
            error: parseApiError(cause),
          }));
        }
        return null;
      }
    };

    return load(current);
  }, []);

  useEffect(() => {
    if (!enabled) {
      invalidate();
      setList(state => ({ ...state, isLoading: false }));
      return;
    }
    const key = queryKey(params);
    if (skipEffectFor.current === key) {
      skipEffectFor.current = null;
      return;
    }
    skipEffectFor.current = null;
    void fetchList(params);
  }, [enabled, params, fetchList, invalidate]);

  const refetch = useCallback(() => fetchList(query.current), [fetchList]);
  const setStatus = useCallback(
    (next: ClassStatus | undefined) => changeQuery({ ...query.current, status: next, page: 1 }),
    [changeQuery]
  );
  const setPage = useCallback(
    (next: number) => changeQuery({ ...query.current, page: clampPage(next) }),
    [changeQuery]
  );
  const setLimit = useCallback(
    (next: number) => changeQuery({ ...query.current, limit: clampLimit(next), page: 1 }),
    [changeQuery]
  );

  return {
    ...list,
    filters: { status },
    isEmpty: !list.isLoading && !list.isError && list.classes.length === 0,
    setStatus,
    setPage,
    setLimit,
    refetch,
  };
}

export function useClass(
  id: ClassId | undefined,
  options: UseClassQueryOptions = {}
): UseQueryResult<ClassDetail, void> {
  const { enabled = true } = options;
  return useQuery<ClassDetail, void>(async () => {
    if (id === undefined) {
      throw new Error('Class id is required');
    }
    return classService.getDetail(id);
  }, undefined, { enabled: enabled && id !== undefined });
}

export function useClassMembers(
  id: ClassId | undefined,
  options: UseClassQueryOptions = {}
): UseQueryResult<ClassMember[], void> {
  const { enabled = true } = options;
  return useQuery<ClassMember[], void>(async () => {
    if (id === undefined) {
      throw new Error('Class id is required');
    }
    return classService.listMembers(id);
  }, undefined, { enabled: enabled && id !== undefined });
}

export function useCreateClass(
  options?: CreateClassCallbacks
): UseMutationResult<CreatedClassResponse, CreateClassPayload> {
  return useMutation<CreatedClassResponse, CreateClassPayload>(
    (payload: CreateClassPayload) => classService.create(payload),
    {
      onSuccess: result => {
        options?.onSuccess?.(result);
      },
    }
  );
}

export function useUpdateClass(
  options?: UpdateClassCallbacks
): UseMutationResult<MessageResponse, UpdateClassVariables> {
  return useMutation<MessageResponse, UpdateClassVariables>(
    ({ id, payload }) => classService.update(id, payload),
    {
      onSuccess: result => {
        options?.onSuccess?.(result);
      },
    }
  );
}

export function useDeleteClass(
  options?: DeleteClassCallbacks
): UseMutationResult<MessageResponse, ClassId> {
  return useMutation<MessageResponse, ClassId>((id: ClassId) => classService.delete(id), {
    onSuccess: result => {
      options?.onSuccess?.(result);
    },
  });
}

export function useAddClassMember(
  options?: AddClassMemberCallbacks
): UseMutationResult<AddedClassMemberResponse, AddClassMemberVariables> {
  return useMutation<AddedClassMemberResponse, AddClassMemberVariables>(
    ({ classId, studentId }) => classService.addMember(classId, studentId),
    {
      onSuccess: result => {
        options?.onSuccess?.(result);
      },
    }
  );
}

export function useRemoveClassMember(
  options?: RemoveClassMemberCallbacks
): UseMutationResult<MessageResponse, RemoveClassMemberVariables> {
  return useMutation<MessageResponse, RemoveClassMemberVariables>(
    ({ classId, memberId }) => classService.removeMember(classId, memberId),
    {
      onSuccess: result => {
        options?.onSuccess?.(result);
      },
    }
  );
}
