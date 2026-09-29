import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError, type ApiClientError } from '@/api/core/errors';
import { userService } from '@/api/services/user.service';
import type {
  CreateUserPayload, CreateUserResponse, MessageResponse, UpdateUserPayload, UserId,
  UserListItem, UserListParams, UserListResponse, UserRole,
} from '@/api/services/user.service';
import { useMutation } from './core/useMutation';
import { clampLimit, clampPage, computePagination, pageAfterEmptyRefetch } from './useUsers.utils';

export interface UseUsersOptions { initialPage?: number; initialLimit?: number; initialQ?: string; initialRole?: UserRole; enabled?: boolean }

type UsersQuery = UserListParams & { page: number; limit: number; q: string };
type UserListState = {
  users: UserListItem[]; pagination: ReturnType<typeof computePagination>;
  isLoading: boolean; isSuccess: boolean; isError: boolean; error: ApiClientError | null;
};

export interface UseUsersResult {
  users: UserListItem[]; pagination: ReturnType<typeof computePagination>;
  filters: { q: string; role: UserRole | undefined };
  isLoading: boolean; isSuccess: boolean; isError: boolean; error: ApiClientError | null;
  isCreating: boolean; createError: ApiClientError | null;
  createUser: (payload: CreateUserPayload) => Promise<CreateUserResponse>;
  isUpdating: boolean; updateError: ApiClientError | null;
  updateUser: (id: UserId, payload: UpdateUserPayload) => Promise<MessageResponse>;
  isDeleting: boolean; deleteError: ApiClientError | null;
  deleteUser: (id: UserId) => Promise<MessageResponse>;
  setQuery: (q: string) => void; setRole: (role: UserRole | undefined) => void;
  setPage: (page: number) => void; setLimit: (limit: number) => void;
  refetch: () => Promise<UserListResponse | null>;
}

const queryKey = (query: UsersQuery) => JSON.stringify([query.page, query.limit, query.q, query.role]);

export function useUsers(options: UseUsersOptions = {}): UseUsersResult {
  const enabled = options.enabled ?? true;
  const [params, setParams] = useState<UsersQuery>(() => ({
    page: clampPage(options.initialPage), limit: clampLimit(options.initialLimit),
    q: options.initialQ ?? '', role: options.initialRole,
  }));
  const { page, limit, q, role } = params;
  const [list, setList] = useState<UserListState>(() => ({
    users: [], pagination: computePagination({ page: params.page, limit: params.limit, total: 0 }),
    isLoading: enabled, isSuccess: false, isError: false, error: null,
  }));
  const requestId = useRef(0), controller = useRef<AbortController | null>(null);
  const mounted = useRef(false), enabledRef = useRef(enabled);
  const query = useRef<UsersQuery>({ page, limit, q, role }), skipEffectFor = useRef<string | null>(null);
  enabledRef.current = enabled;
  query.current = params;
  const invalidate = useCallback(() => {
    requestId.current++;
    controller.current?.abort();
  }, []);
  const changeQuery = useCallback((next: UsersQuery) => {
    invalidate();
    query.current = next;
    setParams(next);
  }, [invalidate]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidate();
    };
  }, [invalidate]);

  const fetchList = useCallback(async (params: UsersQuery): Promise<UserListResponse | null> => {
    if (!enabledRef.current || !mounted.current) return null;
    // Incrementing IDs ensures only the newest filter/page request can update state.
    const id = ++requestId.current;
    controller.current?.abort();
    setList(state => ({ ...state, isLoading: true, isSuccess: false, isError: false, error: null }));

    const load = async (current: UsersQuery): Promise<UserListResponse | null> => {
      const abort = new AbortController();
      controller.current = abort;
      try {
        const result = await userService.listUsers(current, { signal: abort.signal });
        if (!mounted.current || !enabledRef.current || id !== requestId.current) return null;
        // A concurrent delete can leave this page empty, so step back and reload.
        const nextPage = pageAfterEmptyRefetch(current.page, result.data.length);
        if (nextPage !== current.page) {
          const next = { ...current, page: nextPage };
          skipEffectFor.current = queryKey(next);
          query.current = next;
          setParams(next);
          return load(next);
        }
        setList(state => ({
          ...state, users: result.data, pagination: computePagination(result.pagination),
          isLoading: false, isSuccess: true, isError: false, error: null,
        }));
        return result;
      } catch (cause) {
        if (mounted.current && enabledRef.current && id === requestId.current) {
          setList(state => ({ ...state, isLoading: false, isSuccess: false, isError: true, error: parseApiError(cause) }));
        }
        return null;
      }
    };

    return load(params);
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
  const setQuery = useCallback((q: string) => changeQuery({ ...query.current, q, page: 1 }), [changeQuery]);
  const setRole = useCallback((role: UserRole | undefined) => changeQuery({ ...query.current, role, page: 1 }), [changeQuery]);
  const setPage = useCallback((page: number) => changeQuery({ ...query.current, page: clampPage(page) }), [changeQuery]);
  const setLimit = useCallback((limit: number) => changeQuery({ ...query.current, limit: clampLimit(limit), page: 1 }), [changeQuery]);
  const refreshAfterMutation = useCallback(async () => { await refetch(); }, [refetch]);
  const create = useMutation((payload: CreateUserPayload) => userService.createUser(payload), { onSuccess: refreshAfterMutation });
  const update = useMutation((args: { id: UserId; payload: UpdateUserPayload }) =>
    userService.updateUser(args.id, args.payload), { onSuccess: refreshAfterMutation });
  const remove = useMutation((id: UserId) => userService.deleteUser(id), { onSuccess: refreshAfterMutation });

  return {
    ...list,
    filters: { q, role },
    isCreating: create.isLoading, createError: create.error, createUser: create.mutateAsync,
    isUpdating: update.isLoading, updateError: update.error,
    updateUser: (id, payload) => update.mutateAsync({ id, payload }),
    isDeleting: remove.isLoading, deleteError: remove.error, deleteUser: remove.mutateAsync,
    setQuery,
    setRole,
    setPage,
    setLimit,
    refetch,
  };
}
