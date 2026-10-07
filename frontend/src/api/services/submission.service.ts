import { httpClient } from '../core/client';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type { AssignmentSkill } from './assignment.service';

export type SubmissionStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';
export type SubmissionGradingStatus = 'PENDING' | 'AI_GRADED' | 'COMPLETED' | 'FAILED';
export type SubmissionGradingMethod = 'AUTO' | 'TEACHER_MANUAL';
export type SubmissionTaskType = 'QUIZ' | 'REWRITE' | 'RECORDING' | 'ESSAY';
export type SubmissionSkill = AssignmentSkill;

export interface SubmissionStartModuleResponse {
  id: number;
  moduleId: number;
  skill: SubmissionSkill;
  status: SubmissionStatus;
}

export interface StartSubmissionResponse {
  id: number;
  assignmentId: number;
  attemptNumber: number;
  status: SubmissionStatus;
  createdAt: string;
  modules: SubmissionStartModuleResponse[];
}

export interface SubmissionGradingDetail {
  id: number;
  method: SubmissionGradingMethod;
  status: SubmissionGradingStatus;
  finalScore: number | null;
  maxScoreSnapshot: number | null;
  aiFeedback: string | null;
  finalFeedback: string | null;
}

export interface SubmissionModuleDetail {
  id: number;
  moduleId: number;
  skill: SubmissionSkill | null;
  taskType: SubmissionTaskType | null;
  status: SubmissionStatus;
  grading: SubmissionGradingDetail | null;
}

export interface SubmissionDetail {
  id: number;
  assignmentId: number;
  studentId: number;
  attemptNumber: number;
  status: SubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  modules: SubmissionModuleDetail[];
}

export interface SubmissionGradingSummary {
  finalScore: number | null;
  maxScoreSnapshot: number | null;
  status: SubmissionGradingStatus;
}

export interface SubmissionModuleSummary {
  id: number;
  moduleId: number;
  skill: SubmissionSkill | null;
  taskType: SubmissionTaskType | null;
  status: SubmissionStatus;
  grading: SubmissionGradingSummary | null;
}

export interface SubmissionListItem {
  id: number;
  studentId: number;
  attemptNumber: number;
  status: SubmissionStatus;
  submittedAt: string | null;
  modules: SubmissionModuleSummary[];
}

export interface SubmissionPagination {
  page: number;
  limit: number;
  total: number;
}

export interface SubmissionListResponse {
  data: SubmissionListItem[];
  pagination: SubmissionPagination;
}

export interface SubmitResponse {
  message: string;
  status: SubmissionStatus;
  submittedAt: string;
}

export interface SubmissionListParams {
  assignmentId?: number;
  studentId?: number;
  status?: SubmissionStatus;
  page?: number;
  limit?: number;
}

export function normalizeSubmissionListParams(params: SubmissionListParams = {}) {
  const page =
    Number.isInteger(params.page) && params.page !== undefined && params.page >= 1
      ? params.page
      : 1;
  const requestedLimit = params.limit;
  const limit =
    requestedLimit === undefined || Number.isNaN(requestedLimit)
      ? 20
      : Math.min(100, Math.max(1, Math.floor(requestedLimit)));

  return {
    ...(params.assignmentId !== undefined ? { assignmentId: params.assignmentId } : {}),
    ...(params.studentId !== undefined ? { studentId: params.studentId } : {}),
    ...(params.status !== undefined ? { status: params.status } : {}),
    page,
    limit,
  };
}

export function getRemainingAttempts(
  maxSubmissions: number | null | undefined,
  attemptsUsed: number
): number | null | undefined {
  if (maxSubmissions === undefined) {
    return undefined;
  }
  if (maxSubmissions === null) {
    return null;
  }
  return Math.max(0, maxSubmissions - attemptsUsed);
}

export function findInProgressAttempt(items: SubmissionListItem[]): SubmissionListItem | null {
  let newestAttempt: SubmissionListItem | null = null;

  for (const item of items) {
    if (
      item.status === 'IN_PROGRESS' &&
      (newestAttempt === null || item.id > newestAttempt.id)
    ) {
      newestAttempt = item;
    }
  }

  return newestAttempt;
}

export class SubmissionService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  startAttempt(
    assignmentId: number,
    options?: ApiRequestOptions
  ): Promise<StartSubmissionResponse> {
    return this.http.post<StartSubmissionResponse>(
      '/assignments/' + assignmentId + '/submissions',
      undefined,
      options
    );
  }

  getSubmission(
    submissionId: number,
    options?: ApiRequestOptions
  ): Promise<SubmissionDetail> {
    return this.http.get<SubmissionDetail>('/submissions/' + submissionId, options);
  }

  listSubmissions(
    params: SubmissionListParams = {},
    options?: ApiRequestOptions
  ): Promise<SubmissionListResponse> {
    return this.http.get<SubmissionListResponse>('/submissions', {
      ...options,
      params: normalizeSubmissionListParams(params),
    });
  }

  submitSubmission(
    submissionId: number,
    options?: ApiRequestOptions
  ): Promise<SubmitResponse> {
    return this.http.post<SubmitResponse>(
      '/submissions/' + submissionId + '/submit',
      undefined,
      options
    );
  }
}

export const submissionService = new SubmissionService();
