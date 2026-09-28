// API Core exports
export { apiClient, httpClient, createApiClient, AxiosHttpClientAdapter } from './core/client';
export { BaseApiService } from './core/base-api.service';
export { tokenStorage, LocalStorageTokenStorage, MemoryTokenStorage } from './core/token-storage';
export {
  ApiClientError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  NetworkError,
  TimeoutError,
  parseApiError,
} from './core/errors';
export { TokenRefreshManager, AUTH_EVENTS } from './core/interceptors';
export type { CustomAxiosRequestConfig, BackendErrorPayload, StandardApiResponse, PaginatedResult } from './core/types';

// Interfaces
export type {
  IHttpClient,
  IReadService,
  ICreateService,
  IUpdateService,
  IPatchService,
  IDeleteService,
  ICrudService,
  ApiRequestOptions,
} from './interfaces/http.interface';
export type { ITokenStorage } from './interfaces/token.interface';

// Domain Services
export * from './services';
