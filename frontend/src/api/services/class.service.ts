import { BaseApiService } from '../core/base-api.service';
import { httpClient } from '../core/client';
import type { IHttpClient } from '../interfaces/http.interface';

export interface ClassDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  teacherId?: number;
  status: 'ACTIVE' | 'ARCHIVED';
  studentCount?: number;
  createdAt?: string;
}

export interface CreateClassPayload {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateClassPayload {
  name?: string;
  code?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export interface ClassMember {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  joinedAt: string;
}

export class ClassService extends BaseApiService<
  ClassDto,
  CreateClassPayload,
  UpdateClassPayload,
  number
> {
  constructor(http: IHttpClient = httpClient) {
    super('/classes', http);
  }

  async getMembers(classId: number): Promise<ClassMember[]> {
    return this.get<ClassMember[]>(`${classId}/members`);
  }

  async addMember(classId: number, studentId: number): Promise<void> {
    return this.post<void>(`${classId}/members`, { studentId });
  }

  async removeMember(classId: number, memberId: number): Promise<void> {
    return this.deleteRequest<void>(`${classId}/members/${memberId}`);
  }
}

export const classService = new ClassService();
