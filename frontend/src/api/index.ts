// Core HTTP & Client
export { axiosClient, createApiClient, getDefaultBaseUrl } from './core/client';
export { BaseHttpClient, httpClient } from './core/BaseHttpClient';
export { BaseService, BaseCrudService } from './core/BaseService';
export { TokenService, tokenService } from './core/tokenService';
export { ApiException, normalizeError } from './core/errorHandler';
export { setupInterceptors } from './core/interceptors';

// Domain Services
export { authService, AuthService } from './services/authService';
export type { LoginDto, LoginResponse, RefreshResponse, LogoutResponse } from './services/authService';
export { userService, UserService } from './services/userService';
export type { UserQueryParams, ChangePasswordDto } from './services/userService';

// Types
export type {
  ApiResponse,
  ApiErrorDetail,
  ApiErrorResponse,
  PaginationParams,
  PageResult,
  RequestConfig,
  IHttpClient,
  ITokenService,
  IReadService,
  IWriteService,
  ICrudService,
} from '../types/api.types';
