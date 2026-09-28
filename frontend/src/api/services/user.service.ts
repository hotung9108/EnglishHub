import { buildListParams } from '@/hooks/useUsers.utils';
import { httpClient } from '../core/client';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';

export type UserId = number;
export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface UserProfile {
  id: UserId;
  fullName: string;
  email: string;
  role: UserRole;
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

type CreateUserBase = { fullName: string; email: string; password: string };

export type CreateUserPayload =
  | (CreateUserBase & { role: 'TEACHER'; specialization?: string })
  | (CreateUserBase & {
      role: 'STUDENT';
      studentCode?: string;
      dateOfBirth?: string;
      parentPhone?: string;
    });
export type CreatableRole = CreateUserPayload['role'];

export interface UpdateUserPayload {
  fullName?: string;
  phone?: string;
  specialization?: string;
  studentCode?: string;
  dateOfBirth?: string;
  parentPhone?: string;
}

export type UserListParams = { page?: number; limit?: number; q?: string; role?: UserRole };
export type UserListItem = Pick<UserProfile, 'id' | 'fullName' | 'email' | 'role' | 'status'>;
export interface UserPagination {
  page: number;
  limit: number;
  total: number;
}
export interface UserListResponse {
  data: UserListItem[];
  pagination: UserPagination;
}
export interface CreateUserResponse extends MessageResponse {
  user: Pick<UserListItem, 'id' | 'email' | 'role'>;
}

const USERS_ENDPOINT = '/admin/users';

export class UserService {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient = httpClient) {
    this.http = http;
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
    return this.http.patch<UserProfile>(`${USERS_ENDPOINT}/${id}/status`, { status });
  }

  async listUsers(params: UserListParams = {}, options?: ApiRequestOptions): Promise<UserListResponse> {
    const response = await this.http.get<UserListResponse>(USERS_ENDPOINT, {
      ...options,
      params: buildListParams(params),
    });
    return { data: response.data, pagination: { ...response.pagination } };
  }

  async createUser(payload: CreateUserPayload): Promise<CreateUserResponse> {
    return this.http.post<CreateUserResponse>(USERS_ENDPOINT, payload);
  }

  async updateUser(id: UserId, payload: UpdateUserPayload): Promise<MessageResponse> {
    return this.http.put<MessageResponse>(`${USERS_ENDPOINT}/${id}`, payload);
  }

  async deleteUser(id: UserId): Promise<MessageResponse> {
    return this.http.delete<MessageResponse>(`${USERS_ENDPOINT}/${id}`);
  }
}

export const userService = new UserService();
