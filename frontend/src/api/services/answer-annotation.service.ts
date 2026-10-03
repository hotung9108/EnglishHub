import { httpClient } from '../core/client';
import type { MessageResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type GradingAnnotationSource = 'AI' | 'TEACHER';
export type AnnotationReviewStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

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

export interface CreatedGradingAnnotationResponse extends MessageResponse {
  id: number;
}

export interface ReviewGradingAnnotationRequest {
  reviewStatus: Exclude<AnnotationReviewStatus, 'PENDING'>;
}

export class AnswerAnnotationService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
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
  ): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(`/annotations/${id}/review`, payload, options);
  }

  deleteAnnotation(id: number, options?: ApiRequestOptions): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/annotations/${id}`, options);
  }
}

export const answerAnnotationService = new AnswerAnnotationService();
