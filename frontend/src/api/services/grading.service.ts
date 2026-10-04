import { httpClient } from '../core/client';
import type { MessageResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type GradingMethod = 'AUTO' | 'TEACHER_MANUAL';
export type GradingStatus = 'PENDING' | 'AI_GRADED' | 'COMPLETED' | 'FAILED';

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

export type GradingMessageResponse = MessageResponse;

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
