import { httpClient } from '../core/client';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type GradingMethod = 'AUTO' | 'TEACHER_MANUAL';
export type GradingStatus = 'PENDING' | 'AI_GRADED' | 'COMPLETED' | 'FAILED';
export type GradingAnnotationSource = 'AI' | 'TEACHER';
export type AnnotationReviewStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface SubmissionModuleGradingResponse {
  id: number;
  method: GradingMethod;
  status: GradingStatus;
  finalScore: number | null;
}

export interface GradingDetailResponse {
  id: number;
  submissionModuleId: number;
  method: GradingMethod;
  status: GradingStatus;
  aiFeedback: string | null;
  aiTranscript: unknown | null;
  finalScore: number | null;
  finalFeedback: string | null;
  maxScoreSnapshot: number | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  gradedAt: string | null;
  aiInstructionSnapshot: string | null;
}

export interface GradingMessageResponse {
  message: string;
}

export interface UpdateFinalGradeRequest {
  finalScore: number;
  finalFeedback?: string | null;
  note?: string | null;
}

export interface GradingListParams {
  classId?: number;
  studentId?: number;
  status?: GradingStatus;
  page?: number;
  limit?: number;
}

export interface GradingSummaryResponse {
  id: number;
  status: GradingStatus;
  finalScore: number | null;
}

export interface GradingPagination {
  page: number;
  limit: number;
  total: number;
}

export interface GradingListResponse {
  data: GradingSummaryResponse[];
  pagination: GradingPagination;
}

export interface GradingAnnotation {
  id: number;
  source: GradingAnnotationSource;
  startOffset: number;
  endOffset: number;
  errorType: string | null;
  comment: string | null;
  suggestedFix: string | null;
  reviewStatus: AnnotationReviewStatus;
}

export interface GradingAnnotationListResponse {
  data: GradingAnnotation[];
}

export interface CreateGradingAnnotationRequest {
  startOffset: number;
  endOffset: number;
  errorType?: string | null;
  comment?: string | null;
  suggestedFix?: string | null;
}

export interface CreatedGradingAnnotationResponse {
  message: string;
  id: number;
}

export interface ReviewGradingAnnotationRequest {
  reviewStatus: Exclude<AnnotationReviewStatus, 'PENDING'>;
}

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

export interface StudentGradingResult {
  id: number;
  submissionModuleId: number;
  method: GradingMethod;
  finalScore: number | null;
  maxScoreSnapshot: number | null;
  finalFeedback: string | null;
  gradedAt: string | null;
}

export class GradingService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  getBySubmissionModuleId(
    id: number,
    options?: ApiRequestOptions
  ): Promise<SubmissionModuleGradingResponse> {
    return this.http.get<SubmissionModuleGradingResponse>(`/submission-modules/${id}/grading`, options);
  }

  requestAiAnalysis(id: number, options?: ApiRequestOptions): Promise<GradingMessageResponse> {
    return this.http.post<GradingMessageResponse>(
      `/submission-modules/${id}/grading/ai-analyze`,
      undefined,
      options
    );
  }

  submitGrade(
    id: number,
    payload: UpdateFinalGradeRequest,
    options?: ApiRequestOptions
  ): Promise<GradingMessageResponse> {
    return this.http.put<GradingMessageResponse>(`/gradings/${id}`, payload, options);
  }

  getById(id: number, options?: ApiRequestOptions): Promise<GradingDetailResponse> {
    return this.http.get<GradingDetailResponse>(`/gradings/${id}`, options);
  }

  listGradings(
    params: GradingListParams = {},
    options?: ApiRequestOptions
  ): Promise<GradingListResponse> {
    return this.http.get<GradingListResponse>('/gradings', { ...options, params });
  }

  listAnnotations(
    answerId: number,
    options?: ApiRequestOptions
  ): Promise<GradingAnnotationListResponse> {
    return this.http.get<GradingAnnotationListResponse>(`/answers/${answerId}/annotations`, options);
  }

  createAnnotation(
    answerId: number,
    payload: CreateGradingAnnotationRequest,
    options?: ApiRequestOptions
  ): Promise<CreatedGradingAnnotationResponse> {
    return this.http.post<CreatedGradingAnnotationResponse>(
      `/answers/${answerId}/annotations`,
      payload,
      options
    );
  }

  reviewAnnotation(
    id: number,
    payload: ReviewGradingAnnotationRequest,
    options?: ApiRequestOptions
  ): Promise<GradingMessageResponse> {
    return this.http.patch<GradingMessageResponse>(`/annotations/${id}/review`, payload, options);
  }

  deleteAnnotation(id: number, options?: ApiRequestOptions): Promise<GradingMessageResponse> {
    return this.http.delete<GradingMessageResponse>(`/annotations/${id}`, options);
  }

  getChangeLogs(id: number, options?: ApiRequestOptions): Promise<GradingChangeLogListResponse> {
    return this.http.get<GradingChangeLogListResponse>(`/gradings/${id}/change-logs`, options);
  }

  async getStudentGradingResult(
    submissionModuleId: number,
    options?: ApiRequestOptions
  ): Promise<StudentGradingResult | null> {
    const summary = await this.getBySubmissionModuleId(submissionModuleId, options);
    if (summary.status !== 'COMPLETED') {
      return null;
    }

    const detail = await this.getById(summary.id, options);
    if (detail.status !== 'COMPLETED') {
      return null;
    }

    return {
      id: detail.id,
      submissionModuleId: detail.submissionModuleId,
      method: detail.method,
      finalScore: detail.finalScore,
      maxScoreSnapshot: detail.maxScoreSnapshot,
      finalFeedback: detail.finalFeedback,
      gradedAt: detail.gradedAt,
    };
  }
}

export const gradingService = new GradingService();
