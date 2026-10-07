import { useCallback, useEffect, useRef, useState } from 'react';
import { parseApiError, type ApiClientError } from '@/api/core/errors';
import { studentEvaluationService } from '@/api/services/student-evaluation.service';
import type {
  CreateStudentEvaluationRequest,
  CreatedStudentEvaluationResponse,
  StudentEvaluationDetailResponse,
  StudentEvaluationListItem,
  StudentEvaluationListParams,
  StudentEvaluationListResponse,
  UpdateStudentEvaluationRequest,
} from '@/types/student-evaluation.types';
import type { MessageResponse } from '@/api/interfaces/api-response.interface';
import { useMutation } from './core/useMutation';
import {
  clampLimit,
  clampPage,
  computePagination,
  pageAfterEmptyRefetch,
} from './useUsers.utils';
import { buildStudentEvaluationParams } from './useStudentEvaluation.utils';

export interface UseStudentEvaluationOptions {
  studentId?: number;
  initialClassId?: number;
  initialPage?: number;
  initialLimit?: number;
  /** Initial inclusive start date in yyyy-MM-dd format. */
  fromDate?: string;
  /** Initial inclusive end date in yyyy-MM-dd format. */
  toDate?: string;
  enabled?: boolean;
}

type StudentEvaluationQuery = StudentEvaluationListParams & { page: number; limit: number };

interface StudentEvaluationListState {
  studentId: number | undefined;
  evaluations: StudentEvaluationListItem[];
  pagination: ReturnType<typeof computePagination>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiClientError | null;
}

interface StudentEvaluationDetailState {
  studentId: number | undefined;
  selectedEvaluationId: number | undefined;
  evaluation: StudentEvaluationDetailResponse | null;
  isDetailLoading: boolean;
  detailError: ApiClientError | null;
}

interface CreateEvaluationVariables {
  studentId: number;
  payload: CreateStudentEvaluationRequest;
}

interface UpdateEvaluationVariables {
  evaluationId: number;
  payload: UpdateStudentEvaluationRequest;
}

export interface UseStudentEvaluationResult {
  evaluations: StudentEvaluationListItem[];
  evaluation: StudentEvaluationDetailResponse | null;
  selectedEvaluationId: number | undefined;
  pagination: ReturnType<typeof computePagination>;
  filters: {
    classId: number | undefined;
    fromDate: string | undefined;
    toDate: string | undefined;
  };

  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiClientError | null;

  isDetailLoading: boolean;
  detailError: ApiClientError | null;

  isCreating: boolean;
  createError: ApiClientError | null;
  createEvaluation: (
    studentId: number,
    payload: CreateStudentEvaluationRequest
  ) => Promise<CreatedStudentEvaluationResponse>;

  isUpdating: boolean;
  updateError: ApiClientError | null;
  updateEvaluation: (
    evaluationId: number,
    payload: UpdateStudentEvaluationRequest
  ) => Promise<MessageResponse>;

  isDeleting: boolean;
  deleteError: ApiClientError | null;
  deleteEvaluation: (evaluationId: number) => Promise<MessageResponse>;

  getEvaluation: (evaluationId?: number) => Promise<StudentEvaluationDetailResponse | null>;
  refetch: () => Promise<StudentEvaluationListResponse | null>;
  refetchEvaluation: () => Promise<StudentEvaluationDetailResponse | null>;

  setClassId: (classId?: number) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  /** Sets the inclusive start date; an empty value clears the filter. */
  setFromDate: (fromDate?: string) => void;
  /** Sets the inclusive end date; an empty value clears the filter. */
  setToDate: (toDate?: string) => void;
  /** Sets both inclusive date filters in one update; empty values clear them. */
  setDateRange: (fromDate?: string, toDate?: string) => void;
}

function isValidId(id?: number): id is number {
  return id !== undefined && Number.isInteger(id) && id > 0;
}

function createEmptyListState(
  studentId: number | undefined,
  page: number,
  limit: number,
  isLoading = false
): StudentEvaluationListState {
  return {
    studentId,
    evaluations: [],
    pagination: computePagination({ page, limit, total: 0 }),
    isLoading,
    isSuccess: false,
    isError: false,
    error: null,
  };
}

function createEmptyDetailState(studentId: number | undefined): StudentEvaluationDetailState {
  return {
    studentId,
    selectedEvaluationId: undefined,
    evaluation: null,
    isDetailLoading: false,
    detailError: null,
  };
}

function queryKey(studentId: number, params: StudentEvaluationQuery): string {
  return JSON.stringify([
    studentId,
    params.classId,
    params.page,
    params.limit,
    params.fromDate,
    params.toDate,
  ]);
}

export function useStudentEvaluation(
  options: UseStudentEvaluationOptions = {}
): UseStudentEvaluationResult {
  const studentId = options.studentId;
  const enabled = options.enabled ?? true;
  const [params, setParams] = useState<StudentEvaluationQuery>(() =>
    buildStudentEvaluationParams({
      classId: options.initialClassId,
      page: options.initialPage,
      limit: options.initialLimit,
      fromDate: options.fromDate,
      toDate: options.toDate,
    })
  );
  const [list, setList] = useState<StudentEvaluationListState>(() =>
    createEmptyListState(studentId, params.page, params.limit, enabled && isValidId(studentId))
  );
  const [detail, setDetail] = useState<StudentEvaluationDetailState>(() =>
    createEmptyDetailState(studentId)
  );

  const listRequestId = useRef(0);
  const detailRequestId = useRef(0);
  const listController = useRef<AbortController | null>(null);
  const detailController = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const currentStudentId = useRef(studentId);
  const currentEnabled = useRef(enabled);
  const query = useRef(params);
  const selectedEvaluationId = useRef<number | undefined>(undefined);
  const skipEffectFor = useRef<string | null>(null);

  currentStudentId.current = studentId;
  currentEnabled.current = enabled;
  query.current = params;

  const invalidateList = useCallback(() => {
    listRequestId.current++;
    listController.current?.abort();
    listController.current = null;
  }, []);

  const invalidateDetail = useCallback(() => {
    detailRequestId.current++;
    detailController.current?.abort();
    detailController.current = null;
  }, []);

  const clearDetail = useCallback(() => {
    invalidateDetail();
    selectedEvaluationId.current = undefined;
    setDetail(createEmptyDetailState(currentStudentId.current));
  }, [invalidateDetail]);

  const updateParams = useCallback((next: StudentEvaluationQuery) => {
    invalidateList();
    skipEffectFor.current = null;
    query.current = next;
    setParams(next);
  }, [invalidateList]);

  const loadList: (
    id: number,
    currentParams: StudentEvaluationQuery
  ) => Promise<StudentEvaluationListResponse | null> = useCallback(async (id, currentParams) => {
    if (
      !mounted.current ||
      !currentEnabled.current ||
      !isValidId(id) ||
      currentStudentId.current !== id
    ) {
      return null;
    }

    const requestId = ++listRequestId.current;
    listController.current?.abort();

    const loadPage = async (
      pageParams: StudentEvaluationQuery
    ): Promise<StudentEvaluationListResponse | null> => {
      const controller = new AbortController();
      listController.current = controller;
      setList(current => current.studentId === id
        ? { ...current, isLoading: true, isSuccess: false, isError: false, error: null }
        : createEmptyListState(id, pageParams.page, pageParams.limit, true));

      try {
        const response = await studentEvaluationService.list(
          id,
          buildStudentEvaluationParams(pageParams),
          { signal: controller.signal }
        );
        if (
          !mounted.current ||
          !currentEnabled.current ||
          currentStudentId.current !== id ||
          requestId !== listRequestId.current
        ) {
          return null;
        }

        const nextPage = pageAfterEmptyRefetch(pageParams.page, response.data.length);
        if (nextPage !== pageParams.page) {
          const nextParams = { ...pageParams, page: nextPage };
          skipEffectFor.current = queryKey(id, nextParams);
          query.current = nextParams;
          setParams(nextParams);
          return loadPage(nextParams);
        }

        setList({
          studentId: id,
          evaluations: response.data,
          pagination: computePagination(response.pagination),
          isLoading: false,
          isSuccess: true,
          isError: false,
          error: null,
        });
        return response;
      } catch (cause) {
        if (
          mounted.current &&
          currentEnabled.current &&
          currentStudentId.current === id &&
          requestId === listRequestId.current
        ) {
          setList(current => ({
            ...current,
            studentId: id,
            isLoading: false,
            isSuccess: false,
            isError: true,
            error: parseApiError(cause),
          }));
        }
        return null;
      } finally {
        if (listController.current === controller) {
          listController.current = null;
        }
      }
    };

    return loadPage(currentParams);
  }, []);

  const loadDetail = useCallback(async (
    id: number
  ): Promise<StudentEvaluationDetailResponse | null> => {
    if (!mounted.current || !isValidId(id)) {
      return null;
    }

    const requestId = ++detailRequestId.current;
    const studentScope = currentStudentId.current;
    detailController.current?.abort();
    const controller = new AbortController();
    detailController.current = controller;
    selectedEvaluationId.current = id;
    setDetail(current => ({
      ...current,
      studentId: studentScope,
      selectedEvaluationId: id,
      isDetailLoading: true,
      detailError: null,
    }));

    try {
      const response = await studentEvaluationService.getById(id, { signal: controller.signal });
      if (
        !mounted.current ||
        currentStudentId.current !== studentScope ||
        selectedEvaluationId.current !== id ||
        requestId !== detailRequestId.current
      ) {
        return null;
      }

      setDetail({
        studentId: studentScope,
        selectedEvaluationId: id,
        evaluation: response,
        isDetailLoading: false,
        detailError: null,
      });
      return response;
    } catch (cause) {
      if (
        mounted.current &&
        currentStudentId.current === studentScope &&
        selectedEvaluationId.current === id &&
        requestId === detailRequestId.current
      ) {
        setDetail(current => ({
          ...current,
          studentId: studentScope,
          selectedEvaluationId: id,
          isDetailLoading: false,
          detailError: parseApiError(cause),
        }));
      }
      return null;
    } finally {
      if (detailController.current === controller) {
        detailController.current = null;
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      invalidateList();
      invalidateDetail();
    };
  }, [invalidateDetail, invalidateList]);

  const previousStudentId = useRef(studentId);
  useEffect(() => {
    if (previousStudentId.current !== studentId) {
      previousStudentId.current = studentId;
      clearDetail();
    }

    if (!isValidId(studentId)) {
      invalidateList();
      skipEffectFor.current = null;
      setList(createEmptyListState(studentId, params.page, params.limit));
      clearDetail();
      return;
    }

    if (!enabled) {
      invalidateList();
      setList(current => ({ ...current, isLoading: false }));
      return;
    }

    const key = queryKey(studentId, params);
    if (skipEffectFor.current === key) {
      skipEffectFor.current = null;
      return;
    }

    skipEffectFor.current = null;
    void loadList(studentId, params);
  }, [studentId, enabled, params, clearDetail, invalidateList, loadList]);

  const refetch = useCallback(() => {
    const id = currentStudentId.current;
    if (!isValidId(id)) {
      invalidateList();
      setList(createEmptyListState(id, query.current.page, query.current.limit));
      clearDetail();
      return Promise.resolve(null);
    }
    if (!currentEnabled.current) {
      return Promise.resolve(null);
    }
    return loadList(id, query.current);
  }, [clearDetail, invalidateList, loadList]);

  const getEvaluation = useCallback((evaluationId?: number) => {
    if (!isValidId(evaluationId)) {
      clearDetail();
      return Promise.resolve(null);
    }
    return loadDetail(evaluationId);
  }, [clearDetail, loadDetail]);

  const refetchEvaluation = useCallback(() => {
    const id = selectedEvaluationId.current;
    if (!isValidId(id)) {
      clearDetail();
      return Promise.resolve(null);
    }
    return loadDetail(id);
  }, [clearDetail, loadDetail]);

  const setClassId = useCallback((classId?: number) => {
    updateParams(buildStudentEvaluationParams({ ...query.current, classId, page: 1 }));
  }, [updateParams]);

  const setPage = useCallback((page: number) => {
    updateParams(buildStudentEvaluationParams({ ...query.current, page: clampPage(page) }));
  }, [updateParams]);

  const setLimit = useCallback((limit: number) => {
    updateParams(buildStudentEvaluationParams({ ...query.current, limit: clampLimit(limit), page: 1 }));
  }, [updateParams]);

  const setFromDate = useCallback((fromDate?: string) => {
    const next = buildStudentEvaluationParams({ ...query.current, fromDate, page: 1 });
    if (next.fromDate === query.current.fromDate) {
      return;
    }
    updateParams(next);
  }, [updateParams]);

  const setToDate = useCallback((toDate?: string) => {
    const next = buildStudentEvaluationParams({ ...query.current, toDate, page: 1 });
    if (next.toDate === query.current.toDate) {
      return;
    }
    updateParams(next);
  }, [updateParams]);

  const setDateRange = useCallback((fromDate?: string, toDate?: string) => {
    const next = buildStudentEvaluationParams({ ...query.current, fromDate, toDate, page: 1 });
    if (
      next.fromDate === query.current.fromDate &&
      next.toDate === query.current.toDate
    ) {
      return;
    }
    updateParams(next);
  }, [updateParams]);

  const createMutation = useMutation(
    ({ studentId: targetStudentId, payload }: CreateEvaluationVariables) =>
      studentEvaluationService.create(targetStudentId, payload),
    {
      onSuccess: (_response, variables) => {
        if (currentStudentId.current === variables.studentId) {
          void refetch();
        }
      },
    }
  );

  const updateMutation = useMutation(
    ({ evaluationId, payload }: UpdateEvaluationVariables) =>
      studentEvaluationService.update(evaluationId, payload),
    {
      onSuccess: (_response, variables) => {
        void refetch();
        if (selectedEvaluationId.current === variables.evaluationId) {
          void refetchEvaluation();
        }
      },
    }
  );

  const deleteMutation = useMutation(
    (evaluationId: number) => studentEvaluationService.delete(evaluationId),
    {
      onSuccess: (_response, evaluationId) => {
        if (selectedEvaluationId.current === evaluationId) {
          clearDetail();
        }
        void refetch();
      },
    }
  );

  const visibleList = list.studentId === studentId
    ? list
    : createEmptyListState(studentId, params.page, params.limit, enabled && isValidId(studentId));
  const visibleDetail = detail.studentId === studentId
    ? detail
    : createEmptyDetailState(studentId);

  return {
    evaluations: visibleList.evaluations,
    evaluation: visibleDetail.evaluation,
    selectedEvaluationId: visibleDetail.selectedEvaluationId,
    pagination: visibleList.pagination,
    filters: {
      classId: params.classId,
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
    isLoading: visibleList.isLoading,
    isSuccess: visibleList.isSuccess,
    isError: visibleList.isError,
    error: visibleList.error,
    isDetailLoading: visibleDetail.isDetailLoading,
    detailError: visibleDetail.detailError,
    isCreating: createMutation.isLoading,
    createError: createMutation.error,
    createEvaluation: (targetStudentId, payload) =>
      createMutation.mutateAsync({ studentId: targetStudentId, payload }),
    isUpdating: updateMutation.isLoading,
    updateError: updateMutation.error,
    updateEvaluation: (evaluationId, payload) =>
      updateMutation.mutateAsync({ evaluationId, payload }),
    isDeleting: deleteMutation.isLoading,
    deleteError: deleteMutation.error,
    deleteEvaluation: deleteMutation.mutateAsync,
    getEvaluation,
    refetch,
    refetchEvaluation,
    setClassId,
    setPage,
    setLimit,
    setFromDate,
    setToDate,
    setDateRange,
  };
}
