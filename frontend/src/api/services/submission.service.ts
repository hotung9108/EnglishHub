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
  assignmentId?: number;
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

export interface SubmittedAnswerItem {
  id: number;
  questionId: number | null;
  content: unknown;
  docStorageKey?: string | null;
  docMimeType?: string | null;
  docUploadStatus?: string | null;
  audioStorageKey?: string | null;
  audioMimeType?: string | null;
  audioUploadStatus?: string | null;
}

export interface SubmitModuleAnswerPayload {
  questionId: number;
  content: Record<string, unknown>;
}

export interface SubmitModulePayload {
  answers?: SubmitModuleAnswerPayload[];
  audioStorageKey?: string;
  storageKey?: string;
}

export interface SubmitModuleResponse {
  message: string;
  submissionModuleId: number;
  status: SubmissionStatus;
  answers: SubmittedAnswerItem[];
}

export interface UploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
}

export interface SubmissionModuleQuestionDetail {
  id: number;
  content: string;
  questionType: string;
  score: number;
  orderIndex: number;
  correctAnswer?: unknown;
}

export interface SubmissionModuleDetailResponse {
  id: number;
  moduleId: number;
  skill: SubmissionSkill | null;
  taskType: SubmissionTaskType | null;
  status: SubmissionStatus;
  grading: SubmissionGradingDetail | null;
  questions: SubmissionModuleQuestionDetail[];
  answers: SubmittedAnswerItem[];
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

export interface SubmissionGradedCheckInput {
  status?: string | null;
  modules?: Array<{
    status?: string | null;
    grading?: {
      status?: string | null;
      finalScore?: number | null;
    } | null;
  }> | null;
}

export function isSubmissionGraded(sub?: SubmissionGradedCheckInput | null): boolean {
  if (!sub) return false;
  if (sub.status === 'GRADED') return true;
  if (!sub.modules || sub.modules.length === 0) return false;
  return sub.modules.some(
    (m) =>
      m.status === 'GRADED' ||
      m.grading?.status === 'COMPLETED' ||
      (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined)
  );
}

export function getSubmissionFinalScore(sub?: SubmissionGradedCheckInput | null): number | null {
  if (!sub?.modules || sub.modules.length === 0) return null;
  for (const m of sub.modules) {
    if (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined) {
      return m.grading.finalScore;
    }
  }
  return null;
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

  submitModule(
    submissionModuleId: number,
    payload?: SubmitModulePayload,
    options?: ApiRequestOptions
  ): Promise<SubmitModuleResponse> {
    return this.http.post<SubmitModuleResponse>(
      `/submission-modules/${submissionModuleId}/submit`,
      payload ?? {},
      options
    );
  }

  getSubmissionModuleDetail(
    submissionModuleId: number,
    options?: ApiRequestOptions
  ): Promise<SubmissionModuleDetailResponse> {
    return this.http.get<SubmissionModuleDetailResponse>(
      `/submission-modules/${submissionModuleId}`,
      options
    );
  }

  getAudioUploadUrl(
    submissionModuleId: number,
    mimeType?: string,
    options?: ApiRequestOptions
  ): Promise<UploadUrlResponse> {
    return this.http.post<UploadUrlResponse>(
      `/submission-modules/${submissionModuleId}/audio-upload-url`,
      mimeType ? { mimeType } : {},
      options
    );
  }

  getDocumentUploadUrl(
    submissionModuleId: number,
    mimeType?: string,
    options?: ApiRequestOptions
  ): Promise<UploadUrlResponse> {
    return this.http.post<UploadUrlResponse>(
      `/submission-modules/${submissionModuleId}/document-upload-url`,
      mimeType ? { mimeType } : {},
      options
    );
  }

  /**
   * Uploads raw binary data (Blob or File) directly to a presigned S3/MinIO upload URL.
   * Direct PUT to object storage does not send backend auth headers so as not to break S3 presigned URL signature.
   */
  async uploadDirectToStorage(
    uploadUrl: string,
    fileOrBlob: Blob | File,
    mimeType: string
  ): Promise<void> {
    let targetUrl = uploadUrl;
    // When running in dev environments where backend returns internal Docker hostname (http://minio:9000),
    // route through Vite dev proxy (/s3-upload) so browser can resolve and keep Host signature intact.
    if (uploadUrl.includes('//minio:9000/')) {
      targetUrl = uploadUrl.replace(/^https?:\/\/minio:9000/, '/s3-upload');
    }

    const response = await fetch(targetUrl, {
      method: 'PUT',
      body: fileOrBlob,
      headers: {
        'Content-Type': mimeType,
      },
    });
    if (!response.ok) {
      throw new Error(`Tải tệp lên kho lưu trữ thất bại (HTTP ${response.status}).`);
    }
  }
}

export const submissionService = new SubmissionService();
