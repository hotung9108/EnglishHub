import { httpClient } from '../core/client';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export interface GradingChangeLog {
  changedBy: string;
  oldScore: number | null;
  newScore: number | null;
  note: string | null;
  changedAt: string;
}

export interface GradingChangeLogListResponse {
  data: GradingChangeLog[];
}

export class GradingChangeLogService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  getChangeLogs(id: number, options?: ApiRequestOptions): Promise<GradingChangeLogListResponse> {
    return this.http.get<GradingChangeLogListResponse>(`/gradings/${id}/change-logs`, options);
  }
}

export const gradingChangeLogService = new GradingChangeLogService();
