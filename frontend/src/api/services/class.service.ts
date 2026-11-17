import { buildListParams } from '@/hooks/useUsers.utils';
import { httpClient } from '../core/client';
import type { MessageResponse } from './user.service';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type ClassId = number;
export type ClassStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface TeacherSummary {
  id: number;
  fullName: string;
}

export interface ClassSummary {
  id: ClassId;
  name: string;
  status: ClassStatus;
  teacherId?: number;
}

export interface ClassDetail extends ClassSummary {
  level?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  teacher?: TeacherSummary;
  memberCount?: number;
}

export interface ClassPagination {
  page: number;
  limit: number;
  total: number;
}

export interface ClassListResponse {
  data: ClassSummary[];
  pagination: ClassPagination;
}

export type ClassListParams = { status?: ClassStatus; page?: number; limit?: number };

export interface CreateClassPayload {
  name: string;
  level?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  teacherId?: number;
}

export interface UpdateClassPayload {
  name?: string;
  level?: string;
  description?: string;
  endDate?: string;
  status?: ClassStatus;
  teacherId?: number;
}

export interface CreatedClassResponse extends MessageResponse {
  id: ClassId;
}

export interface ClassMember {
  memberId: number;
  studentId: number;
  fullName: string;
  studentCode?: string;
  email?: string;
}

export interface ClassMemberListResponse {
  data: ClassMember[];
}

export interface AddedClassMemberResponse extends MessageResponse {
  memberId: number;
}

export interface CandidateStudent {
  id: number;
  fullName: string;
  email: string;
  studentCode?: string;
  status: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
}

export interface CandidateStudentListResponse {
  data: CandidateStudent[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export type CandidateStudentListParams = { q?: string; page?: number; limit?: number };

const CLASSES_ENDPOINT = '/classes';

export class ClassService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
  }

  async list(params: ClassListParams = {}, options?: ApiRequestOptions): Promise<ClassListResponse> {
    const response = await this.http.get<ClassListResponse>(CLASSES_ENDPOINT, {
      ...options,
      params: buildListParams({ page: params.page, limit: params.limit }, params.status ? { status: params.status } : {}),
    });
    return { data: response.data, pagination: { ...response.pagination } };
  }

  async getDetail(id: ClassId, options?: ApiRequestOptions): Promise<ClassDetail> {
    return this.http.get<ClassDetail>(`${CLASSES_ENDPOINT}/${id}`, options);
  }

  async create(payload: CreateClassPayload): Promise<CreatedClassResponse> {
    return this.http.post<CreatedClassResponse>(CLASSES_ENDPOINT, payload);
  }

  async update(id: ClassId, payload: UpdateClassPayload): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`${CLASSES_ENDPOINT}/${id}`, payload);
  }

  async delete(id: ClassId): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`${CLASSES_ENDPOINT}/${id}`);
  }

  async listMembers(id: ClassId, options?: ApiRequestOptions): Promise<ClassMember[]> {
    const response = await this.http.get<ClassMemberListResponse>(`${CLASSES_ENDPOINT}/${id}/members`, options);
    return response.data ?? [];
  }

  async addMember(id: ClassId, studentId: number): Promise<AddedClassMemberResponse> {
    return this.http.post<AddedClassMemberResponse>(`${CLASSES_ENDPOINT}/${id}/members`, { studentId });
  }

  async removeMember(id: ClassId, memberId: number): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`${CLASSES_ENDPOINT}/${id}/members/${memberId}`);
  }

  async listCandidatesPage(
    id: ClassId,
    params: CandidateStudentListParams = {},
    options?: ApiRequestOptions
  ): Promise<CandidateStudentListResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params.q?.trim()) queryParams.q = params.q.trim();
    if (typeof params.page === 'number') queryParams.page = params.page;
    if (typeof params.limit === 'number') queryParams.limit = params.limit;

    const response = await this.http.get<CandidateStudentListResponse>(
      `${CLASSES_ENDPOINT}/${id}/candidates`,
      {
        ...options,
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      }
    );
    return {
      data: response?.data ?? [],
      pagination: response?.pagination,
    };
  }

  async listCandidates(
    id: ClassId,
    params: CandidateStudentListParams = {},
    options?: ApiRequestOptions
  ): Promise<CandidateStudent[]> {
    const res = await this.listCandidatesPage(id, params, options);
    return res.data;
  }
}

export const classService = new ClassService();
