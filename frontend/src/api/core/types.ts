import type { InternalAxiosRequestConfig } from 'axios';

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  skipErrorToast?: boolean;
  retryOn401?: boolean;
  _retry?: boolean;
}

export interface BackendErrorPayload {
  error?: string;
  message?: string;
  status?: number;
  timestamp?: string;
  path?: string;
  errors?: Array<{ field?: string; message?: string }>;
}

export interface StandardApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}
