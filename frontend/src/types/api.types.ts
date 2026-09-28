import type { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Standard API Response envelope as defined in EnglishHub convention-fe.md.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: ApiErrorDetail[];
}

/**
 * Detailed validation or field-specific error.
 */
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * Normalized API Error representation used across client, services, and hooks.
 */
export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  errors?: ApiErrorDetail[];
  timestamp?: string;
  path?: string;
  raw?: unknown;
}

/**
 * Query parameters for pagination, sorting, and search.
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  search?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  [key: string]: unknown;
}

/**
 * Standard Paginated Response container.
 */
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Extended Axios request configuration with custom metadata flags.
 */
export interface RequestConfig extends AxiosRequestConfig {
  /** If true, skip attaching the Authorization Bearer header */
  skipAuth?: boolean;
  /** If true, skip global error handling or notification */
  skipErrorHandler?: boolean;
  /** Internal flag to avoid infinite loops during 401 token refresh retry */
  _retry?: boolean;
}

/**
 * Interface Segregation Principle (ISP): Contract for Token Management.
 */
export interface ITokenService {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: { accessToken: string; refreshToken?: string }): void;
  setAccessToken(token: string): void;
  clearTokens(): void;
  hasAccessToken(): boolean;
  subscribeTokenRefresh(callback: (token: string) => void): () => void;
  subscribeAuthFailure(callback: () => void): () => void;
}

/**
 * Dependency Inversion Principle (DIP): Contract for HTTP Client.
 */
export interface IHttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T>;
  put<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T>;
  patch<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  request<T>(config: RequestConfig): Promise<T>;
  upload<T>(url: string, formData: FormData, config?: RequestConfig): Promise<T>;
  rawRequest<T>(config: RequestConfig): Promise<AxiosResponse<T>>;
}

/**
 * Interface Segregation: Contract for read-only service operations.
 */
export interface IReadService<T, TParams = PaginationParams> {
  getAll(params?: TParams, config?: RequestConfig): Promise<PageResult<T> | T[]>;
  getById(id: string | number, config?: RequestConfig): Promise<T>;
}

/**
 * Interface Segregation: Contract for write/mutation service operations.
 */
export interface IWriteService<T, TCreateDto = Partial<T>, TUpdateDto = Partial<T>> {
  create(dto: TCreateDto, config?: RequestConfig): Promise<T>;
  update(id: string | number, dto: TUpdateDto, config?: RequestConfig): Promise<T>;
  patch(id: string | number, dto: Partial<TUpdateDto>, config?: RequestConfig): Promise<T>;
  delete(id: string | number, config?: RequestConfig): Promise<boolean | void>;
}

/**
 * Unified CRUD Service contract combining Read and Write capabilities.
 */
export interface ICrudService<
  T,
  TCreateDto = Partial<T>,
  TUpdateDto = Partial<T>,
  TParams = PaginationParams
> extends IReadService<T, TParams>, IWriteService<T, TCreateDto, TUpdateDto> {
  baseEndpoint: string;
}
