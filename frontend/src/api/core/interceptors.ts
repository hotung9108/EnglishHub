import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { environment } from '@/config/environment';
import { tokenStorage as defaultTokenStorage } from './token-storage';
import { parseApiError, UnauthorizedError } from './errors';
import type { CustomAxiosRequestConfig } from './types';
import type { ITokenStorage } from '../interfaces/token.interface';

interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}

export const AUTH_EVENTS = {
  EXPIRED: 'auth:expired',
} as const;

export class TokenRefreshManager {
  private isRefreshing = false;
  private failedQueue: QueueItem[] = [];
  private readonly storage: ITokenStorage;

  constructor(storage: ITokenStorage = defaultTokenStorage) {
    this.storage = storage;
  }

  private processQueue(error: Error | null): void {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });
    this.failedQueue = [];
  }

  async handle401(
    error: AxiosError,
    client: AxiosInstance
  ): Promise<AxiosResponse | unknown> {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(parseApiError(error));
    }

    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');

    // Do not attempt refresh on auth endpoints or already-retried requests
    if (isAuthEndpoint || originalRequest._retry || originalRequest.skipAuth) {
      return Promise.reject(parseApiError(error));
    }

    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.storage.clearTokens();
      this.notifySessionExpired();
      return Promise.reject(
        new UnauthorizedError('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.', error)
      );
    }

    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      })
        .then(() => {
          const newToken = this.storage.getAccessToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return client(originalRequest);
        })
        .catch(err => Promise.reject(parseApiError(err)));
    }

    originalRequest._retry = true;
    this.isRefreshing = true;

    try {
      // Call backend refresh endpoint directly via isolated Axios request
      const refreshUrl = `${environment.api.baseUrl}/auth/refresh`;
      const response = await axios.post<{ accessToken: string; message?: string }>(
        refreshUrl,
        { refreshToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: environment.api.timeout,
        }
      );

      const newAccessToken = response.data?.accessToken;
      if (!newAccessToken) {
        throw new Error('Refresh response did not contain an access token.');
      }

      this.storage.setAccessToken(newAccessToken);
      this.processQueue(null);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return client(originalRequest);
    } catch (refreshErr) {
      this.storage.clearTokens();
      const rejectionError = new UnauthorizedError(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
        refreshErr
      );
      this.processQueue(rejectionError);
      this.notifySessionExpired();
      return Promise.reject(rejectionError);
    } finally {
      this.isRefreshing = false;
    }
  }

  private notifySessionExpired(): void {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(AUTH_EVENTS.EXPIRED));
    }
  }
}

export function setupRequestInterceptor(
  client: AxiosInstance,
  storage: ITokenStorage = defaultTokenStorage
): void {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const customConfig = config as CustomAxiosRequestConfig;

      // Apply default JSON headers if not already specified and not FormData
      if (!customConfig.headers.Accept) {
        customConfig.headers.Accept = 'application/json';
      }
      if (!customConfig.headers['Content-Type'] && !(customConfig.data instanceof FormData)) {
        customConfig.headers['Content-Type'] = 'application/json';
      }

      // Attach Bearer token if not skipped
      if (!customConfig.skipAuth) {
        const token = storage.getAccessToken();
        if (token && !customConfig.headers.Authorization) {
          customConfig.headers.Authorization = `Bearer ${token}`;
        }
      }

      return customConfig;
    },
    (error: unknown) => {
      return Promise.reject(parseApiError(error));
    }
  );
}

export function setupResponseInterceptor(
  client: AxiosInstance,
  refreshManager: TokenRefreshManager = new TokenRefreshManager()
): void {
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        return refreshManager.handle401(error, client);
      }

      return Promise.reject(parseApiError(error));
    }
  );
}
