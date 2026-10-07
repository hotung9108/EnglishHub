import type { MessageResponse, PaginationResponse } from '../api/interfaces/api-response.interface';

export interface StudentEvaluationListItem {
  id: number;
  classId: number;
  teacherName: string | null;
  content: string;
  createdAt: string;
}

export interface StudentEvaluationListParams {
  classId?: number;
  page?: number;
  limit?: number;
  /** Inclusive start date in yyyy-MM-dd format. */
  fromDate?: string;
  /** Inclusive end date in yyyy-MM-dd format. */
  toDate?: string;
}

export interface StudentEvaluationListResponse {
  data: StudentEvaluationListItem[];
  pagination: PaginationResponse;
}

export interface StudentEvaluationDetailResponse {
  id: number;
  content: string;
}

export interface CreateStudentEvaluationRequest {
  classId: number;
  content: string;
}

export interface CreatedStudentEvaluationResponse extends MessageResponse {
  id: number;
}

export interface UpdateStudentEvaluationRequest {
  content: string;
}
