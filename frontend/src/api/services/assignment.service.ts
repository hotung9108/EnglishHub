import { httpClient } from '../core/client';
import type { MessageResponse, PaginationResponse } from '../interfaces/api-response.interface';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type { MessageResponse } from '../interfaces/api-response.interface';

export type AssignmentId = number;
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';
export type AssignmentSkill = 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';

export interface AssignmentSummary {
  id: AssignmentId;
  title: string;
  status: AssignmentStatus;
  closeAt: string;
}

export interface AssignmentModuleSummary {
  id: number;
  skill: AssignmentSkill;
}

export interface AssignmentDetail {
  id: AssignmentId;
  title: string;
  status: AssignmentStatus;
  modules: AssignmentModuleSummary[];
}

export type AssignmentPagination = PaginationResponse;

export interface AssignmentListParams {
  status?: AssignmentStatus | string;
  page?: number;
  limit?: number;
}

export interface AssignmentListResponse {
  data: AssignmentSummary[];
  pagination: AssignmentPagination;
}

export interface CreateAssignmentPayload {
  title: string;
  description?: string;
  openAt: string;
  closeAt: string;
  maxSubmissions: number;
}

export interface UpdateAssignmentPayload {
  title?: string;
  description?: string;
  openAt?: string;
  closeAt?: string;
  maxSubmissions?: number;
}

export interface CreatedAssignmentResponse extends MessageResponse {
  id: AssignmentId;
}

const clampPage = (page = 1): number => {
  return Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
};

const clampLimit = (limit = 20): number => {
  return Number.isFinite(limit) ? Math.min(100, Math.max(1, Math.floor(limit))) : 20;
};

export function buildAssignmentListParams(params: AssignmentListParams = {}) {
  const status = params.status?.toString().trim();
  return {
    page: clampPage(params.page),
    limit: clampLimit(params.limit),
    ...(status ? { status } : {}),
  };
}

export class AssignmentService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  async listAssignments(
    classId: number,
    params: AssignmentListParams = {},
    options?: ApiRequestOptions
  ): Promise<AssignmentListResponse> {
    const response = await this.http.get<AssignmentListResponse>(
      `/classes/${classId}/assignments`,
      {
        ...options,
        params: buildAssignmentListParams(params),
      }
    );

    return {
      data: response.data ?? [],
      pagination: {
        page: response.pagination?.page ?? clampPage(params.page),
        limit: response.pagination?.limit ?? clampLimit(params.limit),
        total: response.pagination?.total ?? 0,
      },
    };
  }

  async createAssignment(
    classId: number,
    payload: CreateAssignmentPayload,
    options?: ApiRequestOptions
  ): Promise<CreatedAssignmentResponse> {
    return this.http.post<CreatedAssignmentResponse>(`/classes/${classId}/assignments`, payload, options);
  }

  async getAssignment(
    assignmentId: AssignmentId,
    options?: ApiRequestOptions
  ): Promise<AssignmentDetail> {
    return this.http.get<AssignmentDetail>(`/assignments/${assignmentId}`, options);
  }

  async updateAssignment(
    assignmentId: AssignmentId,
    payload: UpdateAssignmentPayload,
    options?: ApiRequestOptions
  ): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`/assignments/${assignmentId}`, payload, options);
  }

  async deleteAssignment(
    assignmentId: AssignmentId,
    options?: ApiRequestOptions
  ): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`/assignments/${assignmentId}`, options);
  }

  async updateAssignmentStatus(
    assignmentId: AssignmentId,
    status: AssignmentStatus,
    options?: ApiRequestOptions
  ): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>(
      `/assignments/${assignmentId}/status`,
      { status },
      options
    );
  }
}

export const assignmentService = new AssignmentService();
