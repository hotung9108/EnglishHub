import { BaseApiService } from '../core/base-api.service';
import { httpClient } from '../core/client';
import type { IHttpClient } from '../interfaces/http.interface';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  status: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
  phone?: string;
  avatarUrl?: string;
  specialization?: string;
  studentCode?: string;
  dateOfBirth?: string;
  parentPhone?: string;
}

export interface UpdateOwnProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
}

export interface MessageResponse {
  message: string;
}

export interface CreateAdminUserPayload {
  fullName: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  phone?: string;
  specialization?: string;
  studentCode?: string;
  dateOfBirth?: string;
  parentPhone?: string;
}

export class UserService extends BaseApiService<
  UserProfile,
  CreateAdminUserPayload,
  Partial<UserProfile>,
  number
> {
  constructor(http: IHttpClient = httpClient) {
    super('/admin/users', http);
  }

  async getMyProfile(): Promise<UserProfile> {
    return this.http.get<UserProfile>('/users/me');
  }

  async updateMyProfile(payload: UpdateOwnProfilePayload): Promise<MessageResponse> {
    return this.http.put<MessageResponse>('/users/me', payload);
  }

  async changePassword(payload: ChangePasswordPayload): Promise<MessageResponse> {
    return this.http.patch<MessageResponse>('/users/me/password', payload);
  }

  async updateStatus(id: number, status: 'ACTIVE' | 'LOCKED'): Promise<UserProfile> {
    return this.http.patch<UserProfile>(`${this.endpoint}/${id}/status`, { status });
  }
}

export const userService = new UserService();
