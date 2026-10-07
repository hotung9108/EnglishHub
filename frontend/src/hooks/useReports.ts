import { useCallback, useState } from 'react';
import type { ApiClientError } from '@/api/core/errors';
import { reportService } from '@/api/services/report.service';
import type {
  ReportClassListResponse,
  ReportClassProgressResponse,
  ReportDateInput,
  ReportOverviewResponse,
  ReportStudentProgressResponse,
} from '@/types/report.types';
import { useQuery } from './core/useQuery';
import { clampLimit, clampPage, computePagination } from './useUsers.utils';

export interface UseReportsOptions {
  enabled?: boolean;
  initialFrom?: ReportDateInput;
  initialTo?: ReportDateInput;
  initialClassId?: number;
  initialTeacherId?: number;
  initialThreshold?: number;
  initialPage?: number;
  initialLimit?: number;
}

interface ReportFilters {
  from: ReportDateInput | undefined;
  to: ReportDateInput | undefined;
  classId: number | undefined;
  teacherId: number | undefined;
  threshold: number | undefined;
  page: number;
  limit: number;
}

interface ReportOverviewQuery {
  from: ReportDateInput | undefined;
  to: ReportDateInput | undefined;
  classId: number | undefined;
  teacherId: number | undefined;
}

interface ReportClassListQuery {
  from: ReportDateInput | undefined;
  to: ReportDateInput | undefined;
  teacherId: number | undefined;
  page: number;
  limit: number;
}

interface ReportClassProgressQuery {
  classId: number;
  from: ReportDateInput | undefined;
  to: ReportDateInput | undefined;
  threshold: number | undefined;
}

interface ReportStudentProgressQuery {
  studentId: number;
  classId: number | undefined;
  from: ReportDateInput | undefined;
  to: ReportDateInput | undefined;
}

export interface UseReportsResult {
  overview: ReportOverviewResponse | null;
  isOverviewLoading: boolean;
  overviewError: ApiClientError | null;

  classes: ReportClassListResponse['data'];
  classPagination: ReturnType<typeof computePagination>;
  isClassesLoading: boolean;
  classesError: ApiClientError | null;

  classProgress: ReportClassProgressResponse | null;
  isClassProgressLoading: boolean;
  classProgressError: ApiClientError | null;

  studentProgress: ReportStudentProgressResponse | null;
  isStudentProgressLoading: boolean;
  studentProgressError: ApiClientError | null;

  isLoading: boolean;
  error: ApiClientError | null;

  filters: ReportFilters;

  setFrom: (from: ReportDateInput | undefined) => void;
  setTo: (to: ReportDateInput | undefined) => void;
  setClassId: (classId: number | undefined) => void;
  setTeacherId: (teacherId: number | undefined) => void;
  setThreshold: (threshold: number | undefined) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;

  fetchClassProgress: (classId: number) => Promise<ReportClassProgressResponse | null>;
  fetchStudentProgress: (studentId: number) => Promise<ReportStudentProgressResponse | null>;
  refetchOverview: () => Promise<ReportOverviewResponse | null>;
  refetchClasses: () => Promise<ReportClassListResponse | null>;
}

function isValidId(id?: number): id is number {
  return id !== undefined && Number.isInteger(id) && id > 0;
}

function buildOverviewQuery(filters: ReportFilters): ReportOverviewQuery {
  return {
    from: filters.from,
    to: filters.to,
    classId: filters.classId,
    teacherId: filters.teacherId,
  };
}

function buildClassListQuery(filters: ReportFilters): ReportClassListQuery {
  return {
    from: filters.from,
    to: filters.to,
    teacherId: filters.teacherId,
    page: filters.page,
    limit: filters.limit,
  };
}

export function useReports(options: UseReportsOptions = {}): UseReportsResult {
  const enabled = options.enabled ?? true;

  const [filters, setFilters] = useState<ReportFilters>(() => ({
    from: options.initialFrom,
    to: options.initialTo,
    classId: options.initialClassId,
    teacherId: options.initialTeacherId,
    threshold: options.initialThreshold,
    page: clampPage(options.initialPage),
    limit: clampLimit(options.initialLimit),
  }));

  const overviewQuery = useQuery<ReportOverviewResponse, ReportOverviewQuery>(
    (params) => reportService.getOverview(params),
    buildOverviewQuery(filters),
    { enabled }
  );

  const classesQuery = useQuery<ReportClassListResponse, ReportClassListQuery>(
    (params) => reportService.listClasses(params),
    buildClassListQuery(filters),
    { enabled }
  );

  const classProgressQuery = useQuery<ReportClassProgressResponse, ReportClassProgressQuery>(
    (params) => reportService.getClassProgress(params?.classId ?? 0, params ?? {}),
    {
      classId: filters.classId ?? 0,
      from: filters.from,
      to: filters.to,
      threshold: filters.threshold,
    },
    { enabled: enabled && isValidId(filters.classId) }
  );

  const studentProgressQuery = useQuery<ReportStudentProgressResponse, ReportStudentProgressQuery>(
    (params) => reportService.getStudentProgress(params?.studentId ?? 0, params ?? {}),
    {
      studentId: 0,
      classId: filters.classId,
      from: filters.from,
      to: filters.to,
    },
    { enabled: false }
  );

  const { refetch: refetchOverviewQuery } = overviewQuery;
  const { refetch: refetchClassesQuery } = classesQuery;
  const { refetch: refetchClassProgressQuery } = classProgressQuery;
  const { refetch: refetchStudentProgressQuery } = studentProgressQuery;

  const updateFilters = useCallback((patch: Partial<ReportFilters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      const resetsPage =
        patch.page === undefined &&
        (patch.from !== undefined ||
          patch.to !== undefined ||
          patch.classId !== undefined ||
          patch.teacherId !== undefined ||
          patch.limit !== undefined);
      if (resetsPage) {
        next.page = 1;
      }
      return next;
    });
  }, []);

  const setFrom = useCallback((from: ReportDateInput | undefined) => updateFilters({ from }), [updateFilters]);
  const setTo = useCallback((to: ReportDateInput | undefined) => updateFilters({ to }), [updateFilters]);
  const setClassId = useCallback((classId: number | undefined) => updateFilters({ classId }), [updateFilters]);
  const setTeacherId = useCallback((teacherId: number | undefined) => updateFilters({ teacherId }), [updateFilters]);
  const setThreshold = useCallback((threshold: number | undefined) => updateFilters({ threshold }), [updateFilters]);
  const setPage = useCallback((page: number) => updateFilters({ page: clampPage(page) }), [updateFilters]);
  const setLimit = useCallback((limit: number) => updateFilters({ limit: clampLimit(limit) }), [updateFilters]);

  const fetchClassProgress = useCallback(
    (classId: number): Promise<ReportClassProgressResponse | null> => {
      if (!isValidId(classId)) {
        return Promise.resolve(null);
      }
      return refetchClassProgressQuery({
        classId,
        from: filters.from,
        to: filters.to,
        threshold: filters.threshold,
      });
    },
    [refetchClassProgressQuery, filters.from, filters.to, filters.threshold]
  );

  const fetchStudentProgress = useCallback(
    (studentId: number): Promise<ReportStudentProgressResponse | null> => {
      if (!isValidId(studentId)) {
        return Promise.resolve(null);
      }
      return refetchStudentProgressQuery({
        studentId,
        classId: filters.classId,
        from: filters.from,
        to: filters.to,
      });
    },
    [refetchStudentProgressQuery, filters.classId, filters.from, filters.to]
  );

  const classPagination = computePagination(
    classesQuery.data?.pagination ?? { page: filters.page, limit: filters.limit, total: 0 }
  );

  return {
    overview: overviewQuery.data,
    isOverviewLoading: overviewQuery.isLoading,
    overviewError: overviewQuery.error,

    classes: classesQuery.data?.data ?? [],
    classPagination,
    isClassesLoading: classesQuery.isLoading,
    classesError: classesQuery.error,

    classProgress: classProgressQuery.data,
    isClassProgressLoading: classProgressQuery.isLoading,
    classProgressError: classProgressQuery.error,

    studentProgress: studentProgressQuery.data,
    isStudentProgressLoading: studentProgressQuery.isLoading,
    studentProgressError: studentProgressQuery.error,

    isLoading:
      overviewQuery.isLoading ||
      classesQuery.isLoading ||
      classProgressQuery.isLoading ||
      studentProgressQuery.isLoading,
    error:
      overviewQuery.error ??
      classesQuery.error ??
      classProgressQuery.error ??
      studentProgressQuery.error,

    filters,

    setFrom,
    setTo,
    setClassId,
    setTeacherId,
    setThreshold,
    setPage,
    setLimit,

    fetchClassProgress,
    fetchStudentProgress,
    refetchOverview: refetchOverviewQuery,
    refetchClasses: refetchClassesQuery,
  };
}
