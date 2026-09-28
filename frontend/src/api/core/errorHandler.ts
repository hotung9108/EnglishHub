import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiErrorDetail, ApiErrorResponse } from '../../types/api.types';

/**
 * Custom application-level exception for all API failures.
 * Normalizes HTTP errors, network disconnects, timeouts, and backend validation errors.
 */
export class ApiException extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly errors?: ApiErrorDetail[];
  public readonly rawError?: unknown;

  constructor(payload: {
    message: string;
    status?: number;
    code?: string;
    errors?: ApiErrorDetail[];
    rawError?: unknown;
  }) {
    super(payload.message);
    this.name = 'ApiException';
    this.status = payload.status ?? 0;
    this.code = payload.code ?? 'UNKNOWN_ERROR';
    this.errors = payload.errors;
    this.rawError = payload.rawError;

    // Restore prototype chain
    Object.setPrototypeOf(this, ApiException.prototype);
  }

  public get isNetworkError(): boolean {
    return this.status === 0 || this.code === 'NETWORK_ERROR';
  }

  public get isAuthError(): boolean {
    return this.status === 401;
  }

  public get isForbidden(): boolean {
    return this.status === 403;
  }

  public get isNotFound(): boolean {
    return this.status === 404;
  }

  public get isValidationError(): boolean {
    return this.status === 400 || this.status === 422 || (this.errors && this.errors.length > 0) || false;
  }

  public get isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Retrieves the first validation error message for a specific form field.
   */
  public getFieldError(fieldName: string): string | undefined {
    return this.errors?.find(
      (e) => e.field?.toLowerCase() === fieldName.toLowerCase()
    )?.message;
  }

  public toResponse(): ApiErrorResponse {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
      errors: this.errors,
      raw: this.rawError,
    };
  }
}

/**
 * Normalizes unknown errors into a typed ApiException instance.
 * Supports Spring Boot ApiError `{ error: string }`, `{ message: string }`,
 * RFC7807 problem details, and network errors.
 */
export function normalizeError(error: unknown): ApiException {
  if (error instanceof ApiException) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<Record<string, unknown>>;
    const status = axiosError.response?.status ?? 0;
    const responseData = axiosError.response?.data;

    let message = 'Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.';
    let code = `HTTP_${status}`;
    let errors: ApiErrorDetail[] | undefined;

    // Detect timeout
    if (axiosError.code === 'ECONNABORTED' || (typeof axiosError.message === 'string' && axiosError.message.includes('timeout'))) {
      return new ApiException({
        message: 'Kết nối mạng bị quá hạn (timeout). Vui lòng kiểm tra lại đường truyền.',
        status: 408,
        code: 'TIMEOUT',
        rawError: error,
      });
    }

    // Detect network offline or unreachable server
    if (!axiosError.response) {
      return new ApiException({
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.',
        status: 0,
        code: 'NETWORK_ERROR',
        rawError: error,
      });
    }

    // Parse backend response data
    if (responseData && typeof responseData === 'object') {
      // Case 1: Backend record ApiError(error: string)
      if (typeof responseData.error === 'string' && responseData.error.trim().length > 0) {
        message = responseData.error;
      }
      // Case 2: Standard { message: string }
      else if (typeof responseData.message === 'string' && responseData.message.trim().length > 0) {
        message = responseData.message;
      }

      // Extract field validation errors
      if (Array.isArray(responseData.errors)) {
        errors = responseData.errors.map((item: unknown) => {
          if (typeof item === 'string') {
            return { message: item };
          }
          if (typeof item === 'object' && item !== null) {
            const errObj = item as Record<string, unknown>;
            return {
              field: typeof errObj.field === 'string' ? errObj.field : undefined,
              message: typeof errObj.message === 'string' ? errObj.message : String(item),
              code: typeof errObj.code === 'string' ? errObj.code : undefined,
            };
          }
          return { message: String(item) };
        });
      }

      if (typeof responseData.code === 'string') {
        code = responseData.code;
      }
    }

    // Fallbacks by HTTP status code if backend didn't supply specific message
    if (!responseData || (!responseData.error && !responseData.message)) {
      switch (status) {
        case 400:
          message = 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
          code = 'BAD_REQUEST';
          break;
        case 401:
          message = 'Phiên làm việc đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.';
          code = 'UNAUTHORIZED';
          break;
        case 403:
          message = 'Bạn không có quyền thực hiện thao tác này.';
          code = 'FORBIDDEN';
          break;
        case 404:
          message = 'Tài nguyên yêu cầu không tồn tại.';
          code = 'NOT_FOUND';
          break;
        case 409:
          message = 'Dữ liệu bị trùng lặp hoặc xung đột trên hệ thống.';
          code = 'CONFLICT';
          break;
        case 422:
          message = 'Dữ liệu không thể xử lý hoặc vi phạm quy tắc nghiệp vụ.';
          code = 'UNPROCESSABLE_ENTITY';
          break;
        case 500:
        case 502:
        case 503:
          message = 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.';
          code = 'SERVER_ERROR';
          break;
        default:
          message = `Lỗi hệ thống (${status}). Vui lòng thử lại sau.`;
      }
    }

    return new ApiException({
      message,
      status,
      code,
      errors,
      rawError: error,
    });
  }

  if (error instanceof Error) {
    return new ApiException({
      message: error.message,
      status: 0,
      code: 'GENERIC_ERROR',
      rawError: error,
    });
  }

  return new ApiException({
    message: String(error) || 'Lỗi không xác định.',
    status: 0,
    code: 'UNKNOWN_ERROR',
    rawError: error,
  });
}
