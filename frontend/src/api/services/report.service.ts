import { httpClient } from '../core/client';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type {
  ReportClassListParams,
  ReportClassListResponse,
  ReportClassProgressParams,
  ReportClassProgressResponse,
  ReportOverviewParams,
  ReportOverviewResponse,
  ReportStudentProgressParams,
  ReportStudentProgressResponse,
} from '../../types/report.types';

function omitUndefined(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined));
}

export class ReportService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  getOverview(
    params: ReportOverviewParams = {},
    options?: ApiRequestOptions
  ): Promise<ReportOverviewResponse> {
    const query = omitUndefined({
      from: params.from,
      to: params.to,
      classId: params.classId,
      teacherId: params.teacherId,
    });

    return this.http.get<ReportOverviewResponse>('/reports/overview', { ...options, params: query });
  }

  listClasses(
    params: ReportClassListParams = {},
    options?: ApiRequestOptions
  ): Promise<ReportClassListResponse> {
    const query = omitUndefined({
      from: params.from,
      to: params.to,
      teacherId: params.teacherId,
      page: params.page,
      limit: params.limit,
    });

    return this.http.get<ReportClassListResponse>('/reports/classes', { ...options, params: query });
  }

  getClassProgress(
    classId: number,
    params: ReportClassProgressParams = {},
    options?: ApiRequestOptions
  ): Promise<ReportClassProgressResponse> {
    const query = omitUndefined({
      from: params.from,
      to: params.to,
      threshold: params.threshold,
    });

    return this.http.get<ReportClassProgressResponse>(`/reports/classes/${classId}/progress`, {
      ...options,
      params: query,
    });
  }

  getStudentProgress(
    studentId: number,
    params: ReportStudentProgressParams = {},
    options?: ApiRequestOptions
  ): Promise<ReportStudentProgressResponse> {
    const query = omitUndefined({
      classId: params.classId,
      from: params.from,
      to: params.to,
    });

    return this.http.get<ReportStudentProgressResponse>(`/reports/students/${studentId}/progress`, {
      ...options,
      params: query,
    });
  }
}

export const reportService = new ReportService();
