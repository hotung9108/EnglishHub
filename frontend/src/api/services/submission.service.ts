import { httpClient } from '../core/client';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type { AssignmentSkill } from './assignment.service';
import {
  fetchFileBlobFromPresignedUrl,
  normalizeStorageUrl,
  uploadDirectToStorage as uploadDirectStorageHelper,
} from '../../utils/storage.utils';

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
  assignmentId: number;
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
  audioDownloadUrl?: string | null;
  docDownloadUrl?: string | null;
}

export type AnswerDetailResponse = SubmittedAnswerItem;

export interface SubmissionFileDownloadUrlResponse {
  submissionModuleId: number;
  downloadUrl: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  expiresAt: string;
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
  classId?: number;
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
    ...(params.classId !== undefined ? { classId: params.classId } : {}),
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

/**
 * Checks if a specific module in a submission has been graded.
 */
export function isModuleGraded(module?: {
  status?: string | null;
  grading?: {
    status?: string | null;
    finalScore?: number | null;
  } | null;
} | null): boolean {
  if (!module) return false;
  return (
    module.status === 'GRADED' ||
    module.grading?.status === 'COMPLETED' ||
    (module.grading?.finalScore !== null && module.grading?.finalScore !== undefined)
  );
}

/**
 * Checks if a submission is fully graded.
 * For assignments with multiple modules (e.g. Speaking, Writing, Reading),
 * a submission is ONLY considered graded when ALL submitted modules are graded.
 * If only Reading is auto-graded while Speaking/Writing are still pending teacher review,
 * the submission as a whole remains pending grading.
 */
export function isSubmissionGraded(sub?: SubmissionGradedCheckInput | null): boolean {
  if (!sub) return false;
  if (sub.status === 'GRADED') return true;
  if (!sub.modules || sub.modules.length === 0) return false;
  return sub.modules.every((m) => isModuleGraded(m));
}

/**
 * Checks if some (but not all) modules are graded in a multi-module submission.
 */
export function isSubmissionPartiallyGraded(sub?: SubmissionGradedCheckInput | null): boolean {
  if (!sub?.modules || sub.modules.length <= 1) return false;
  const gradedCount = sub.modules.filter((m) => isModuleGraded(m)).length;
  return gradedCount > 0 && gradedCount < sub.modules.length;
}

/**
 * Checks if at least one module has been graded in the submission.
 */
export function hasAnyGradedModule(sub?: SubmissionGradedCheckInput | null): boolean {
  if (!sub) return false;
  if (sub.status === 'GRADED') return true;
  if (!sub.modules || sub.modules.length === 0) return false;
  return sub.modules.some((m) => isModuleGraded(m));
}

/**
 * Calculates overall final score for a submission.
 * For multi-module submissions, returns the average score across modules only when all are graded.
 * Returns null if the submission has not been fully graded yet.
 */
export function getSubmissionFinalScore(sub?: SubmissionGradedCheckInput | null): number | null {
  if (!sub?.modules || sub.modules.length === 0) return null;

  // All modules must be graded to have a finalized overall score
  if (!isSubmissionGraded(sub)) {
    return null;
  }

  const validScores: number[] = [];
  for (const m of sub.modules) {
    if (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined) {
      validScores.push(Number(m.grading.finalScore));
    }
  }

  if (validScores.length === 0) return null;
  const avg = validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length;
  return Math.round(avg * 10) / 10;
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

  async listAllSubmissions(
    params: Omit<SubmissionListParams, 'page' | 'limit'> = {},
    options?: ApiRequestOptions
  ): Promise<SubmissionListItem[]> {
    const limit = 100;
    const errorMessage = 'Dữ liệu phân trang không nhất quán';
    const firstPage = await this.listSubmissions({ ...params, page: 1, limit }, options);
    const total = firstPage.pagination?.total;
    if (!Number.isInteger(total) || total < 0) throw new Error(errorMessage);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const submissions: SubmissionListItem[] = [];
    const submissionIds = new Set<number>();

    for (let page = 1; page <= totalPages; page++) {
      const response = page === 1
        ? firstPage
        : await this.listSubmissions({ ...params, page, limit }, options);
      const pageTotal = response.pagination?.total;
      if (!Number.isInteger(pageTotal) || pageTotal < 0 || (page < totalPages && response.data.length !== limit)) {
        throw new Error(errorMessage);
      }
      for (const submission of response.data) {
        if (submissionIds.has(submission.id)) throw new Error(errorMessage);
        submissionIds.add(submission.id);
        submissions.push(submission);
      }
    }

    return submissions;
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
   * Step 1: Requests a temporary presigned GET URL to stream or download a student speaking audio submission.
   */
  async getAudioDownloadUrl(
    submissionModuleId: number,
    options?: ApiRequestOptions
  ): Promise<SubmissionFileDownloadUrlResponse> {
    const res = await this.http.get<SubmissionFileDownloadUrlResponse>(
      `/submission-modules/${submissionModuleId}/audio-download-url`,
      options
    );
    return {
      ...res,
      downloadUrl: normalizeStorageUrl(res.downloadUrl),
    };
  }

  /**
   * Step 1: Requests a temporary presigned GET URL to stream or download a student essay document submission.
   */
  async getDocumentDownloadUrl(
    submissionModuleId: number,
    mode?: string,
    options?: ApiRequestOptions
  ): Promise<SubmissionFileDownloadUrlResponse> {
    const query = mode ? `?mode=${encodeURIComponent(mode)}` : '';
    const res = await this.http.get<SubmissionFileDownloadUrlResponse>(
      `/submission-modules/${submissionModuleId}/document-download-url${query}`,
      options
    );
    return {
      ...res,
      downloadUrl: normalizeStorageUrl(res.downloadUrl),
    };
  }

  /**
   * Consolidated 2-in-1 helper to retrieve a student speaking submission audio file as a Blob.
   * Step 1: Calls backend API to create a presigned GET URL.
   * Step 2: Uses the presigned URL to fetch file binary data (Blob).
   */
  async getAudioFileBlob(
    submissionModuleId: number,
    options?: ApiRequestOptions
  ): Promise<Blob> {
    const { downloadUrl } = await this.getAudioDownloadUrl(submissionModuleId, options);
    return fetchFileBlobFromPresignedUrl(downloadUrl);
  }

  /**
   * Consolidated 2-in-1 helper to retrieve a student essay submission document as a Blob.
   * Step 1: Calls backend API to create a presigned GET URL.
   * Step 2: Uses the presigned URL to fetch file binary data (Blob).
   */
  async getDocumentFileBlob(
    submissionModuleId: number,
    mode?: string,
    options?: ApiRequestOptions
  ): Promise<Blob> {
    const { downloadUrl } = await this.getDocumentDownloadUrl(submissionModuleId, mode, options);
    return fetchFileBlobFromPresignedUrl(downloadUrl);
  }

  /**
   * Consolidated 2-in-1 helper to upload a student speaking recording.
   * Step 1: Calls backend API to request a presigned PUT URL and storageKey.
   * Step 2: Uploads audio binary data directly to the object storage URL.
   * Returns { uploadUrl, storageKey, expiresAt } ready for submitModule.
   */
  async uploadAudio(
    submissionModuleId: number,
    fileOrBlob: Blob | File,
    mimeTypeOrOptions?: string | ApiRequestOptions,
    options?: ApiRequestOptions
  ): Promise<UploadUrlResponse> {
    let mimeType: string | undefined;
    let requestOptions: ApiRequestOptions | undefined = options;

    if (typeof mimeTypeOrOptions === 'string') {
      mimeType = mimeTypeOrOptions;
    } else if (mimeTypeOrOptions && typeof mimeTypeOrOptions === 'object') {
      requestOptions = mimeTypeOrOptions;
    }

    const resolvedMime = mimeType || fileOrBlob.type || 'audio/webm';
    const uploadRes = await this.getAudioUploadUrl(submissionModuleId, resolvedMime, requestOptions);
    await this.uploadDirectToStorage(uploadRes.uploadUrl, fileOrBlob, resolvedMime);
    return uploadRes;
  }

  /**
   * Consolidated 2-in-1 helper to upload a student essay document.
   * Step 1: Calls backend API to request a presigned PUT URL and storageKey.
   * Step 2: Uploads document binary data directly to the object storage URL.
   * Returns { uploadUrl, storageKey, expiresAt } ready for submitModule.
   */
  async uploadDocument(
    submissionModuleId: number,
    fileOrBlob: Blob | File,
    mimeTypeOrOptions?: string | ApiRequestOptions,
    options?: ApiRequestOptions
  ): Promise<UploadUrlResponse> {
    let mimeType: string | undefined;
    let requestOptions: ApiRequestOptions | undefined = options;

    if (typeof mimeTypeOrOptions === 'string') {
      mimeType = mimeTypeOrOptions;
    } else if (mimeTypeOrOptions && typeof mimeTypeOrOptions === 'object') {
      requestOptions = mimeTypeOrOptions;
    }

    const resolvedMime = mimeType || fileOrBlob.type || 'application/pdf';
    const uploadRes = await this.getDocumentUploadUrl(submissionModuleId, resolvedMime, requestOptions);
    await this.uploadDirectToStorage(uploadRes.uploadUrl, fileOrBlob, resolvedMime);
    return uploadRes;
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
    return uploadDirectStorageHelper(uploadUrl, fileOrBlob, mimeType);
  }
}

export const submissionService = new SubmissionService();
