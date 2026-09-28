import type { ApiClientError } from '@/api/core/errors';
import type { ApiRequestOptions } from '@/api/interfaces/http.interface';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field?: string; message: string; code?: string }>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export type RequestConfig = ApiRequestOptions;
export type ApiException = ApiClientError;

export type {
  IHttpClient,
  IReadService,
  ICreateService,
  IUpdateService,
  IPatchService,
  IDeleteService,
  ICrudService,
} from '@/api/interfaces/http.interface';
export type { ITokenStorage } from '@/api/interfaces/token.interface';
