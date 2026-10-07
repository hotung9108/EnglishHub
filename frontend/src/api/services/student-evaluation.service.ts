import { httpClient } from '../core/client';
import type { MessageResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type {
  CreateStudentEvaluationRequest,
  CreatedStudentEvaluationResponse,
  StudentEvaluationDetailResponse,
  StudentEvaluationListParams,
  StudentEvaluationListResponse,
  UpdateStudentEvaluationRequest,
} from '../../types/student-evaluation.types';

export class StudentEvaluationService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  list(
    studentId: number,
    params: StudentEvaluationListParams = {},
    options?: ApiRequestOptions
  ): Promise<StudentEvaluationListResponse> {
    const query = {
      ...(params.classId !== undefined ? { classId: params.classId } : {}),
      ...(params.page !== undefined ? { page: params.page } : {}),
      ...(params.limit !== undefined ? { limit: params.limit } : {}),
      ...(params.fromDate?.trim() ? { fromDate: params.fromDate } : {}),
      ...(params.toDate?.trim() ? { toDate: params.toDate } : {}),
    };

    return this.http.get<StudentEvaluationListResponse>(`/students/${studentId}/evaluations`, {
      ...options,
      params: query,
    });
  }

  create(
    studentId: number,
    payload: CreateStudentEvaluationRequest,
    options?: ApiRequestOptions
  ): Promise<CreatedStudentEvaluationResponse> {
    return this.http.post<CreatedStudentEvaluationResponse>(
      `/students/${studentId}/evaluations`,
      payload,
      options
    );
  }

  getById(
    evaluationId: number,
    options?: ApiRequestOptions
  ): Promise<StudentEvaluationDetailResponse> {
    return this.http.get<StudentEvaluationDetailResponse>(`/evaluations/${evaluationId}`, options);
  }

  update(
    evaluationId: number,
    payload: UpdateStudentEvaluationRequest,
    options?: ApiRequestOptions
  ): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/evaluations/${evaluationId}`, payload, options);
  }

  delete(evaluationId: number, options?: ApiRequestOptions): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/evaluations/${evaluationId}`, options);
  }
}

export const studentEvaluationService = new StudentEvaluationService();
