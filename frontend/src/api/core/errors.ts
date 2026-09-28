import axios from 'axios';
import type { AxiosError } from 'axios';
import type { BackendErrorPayload } from './types';

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly rawError: unknown;
  readonly errors?: Array<{ field?: string; message?: string }>;

  constructor(
    message: string,
    statusCode = 500,
    rawError?: unknown,
    errors?: Array<{ field?: string; message?: string }>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.rawError = rawError;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export class UnauthorizedError extends ApiClientError {
  constructor(message = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', rawError?: unknown) {
    super(message, 401, rawError);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ApiClientError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.', rawError?: unknown) {
    super(message, 403, rawError);
    this.name = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class NotFoundError extends ApiClientError {
  constructor(message = 'Không tìm thấy dữ liệu yêu cầu.', rawError?: unknown) {
    super(message, 404, rawError);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ValidationError extends ApiClientError {
  constructor(
    message = 'Dữ liệu không hợp lệ.',
    errors?: Array<{ field?: string; message?: string }>,
    rawError?: unknown
  ) {
    super(message, 400, rawError, errors);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class ConflictError extends ApiClientError {
  constructor(message = 'Dữ liệu bị trùng lặp hoặc xung đột.', rawError?: unknown) {
    super(message, 409, rawError);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class NetworkError extends ApiClientError {
  constructor(message = 'Lỗi kết nối mạng. Vui lòng kiểm tra lại đường truyền.', rawError?: unknown) {
    super(message, 0, rawError);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class TimeoutError extends ApiClientError {
  constructor(message = 'Yêu cầu vượt quá thời gian phản hồi (Timeout).', rawError?: unknown) {
    super(message, 408, rawError);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export function parseApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<BackendErrorPayload>;

    // Network / Timeout errors
    if (axiosErr.code === 'ECONNABORTED' || (typeof axiosErr.message === 'string' && axiosErr.message.includes('timeout'))) {
      return new TimeoutError('Yêu cầu vượt quá thời gian phản hồi.', axiosErr);
    }
    if (!axiosErr.response) {
      return new NetworkError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền.', axiosErr);
    }

    const status = axiosErr.response.status;
    const rawData: unknown = axiosErr.response.data;

    let message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    let validationErrors: Array<{ field?: string; message?: string }> | undefined;

    if (typeof rawData === 'string' && rawData.trim()) {
      message = rawData;
    } else if (rawData && typeof rawData === 'object') {
      const errObj = rawData as BackendErrorPayload;
      message = errObj.error || errObj.message || message;
      validationErrors = errObj.errors;
    }

    switch (status) {
      case 401:
        return new UnauthorizedError(message, axiosErr);
      case 403:
        return new ForbiddenError(message, axiosErr);
      case 404:
        return new NotFoundError(message, axiosErr);
      case 400:
      case 422:
        return new ValidationError(message, validationErrors, axiosErr);
      case 409:
        return new ConflictError(message, axiosErr);
      default:
        return new ApiClientError(message, status, axiosErr, validationErrors);
    }
  }

  if (error instanceof Error) {
    return new ApiClientError(error.message, 500, error);
  }

  return new ApiClientError('Lỗi không xác định.', 500, error);
}
