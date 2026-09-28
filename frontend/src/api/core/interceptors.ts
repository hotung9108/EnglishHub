import axios from 'axios';
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { RequestConfig } from '../../types/api.types';
import { tokenService } from './tokenService';
import { normalizeError } from './errorHandler';

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Attaches request and response interceptors to an Axios instance.
 * Features:
 * - Automatic Bearer token attachment.
 * - Accept-Language header propagation.
 * - Silent token refresh with queued concurrency on 401 Unauthorized.
 * - Error normalization into typed ApiException.
 */
export function setupInterceptors(axiosInstance: AxiosInstance): void {
  // 1. Request Interceptor
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const customConfig = config as RequestConfig;

      // Attach Bearer token unless explicitly skipped
      if (!customConfig.skipAuth) {
        const token = tokenService.getAccessToken();
        if (token) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      }

      // Attach client language preference
      try {
        const lang = localStorage.getItem('eh_language') || localStorage.getItem('language') || 'vi';
        config.headers.set('Accept-Language', lang);
      } catch {
        config.headers.set('Accept-Language', 'vi');
      }

      // Ensure JSON header if sending standard body
      if (
        config.data &&
        !(config.data instanceof FormData) &&
        !config.headers.get('Content-Type')
      ) {
        config.headers.set('Content-Type', 'application/json');
      }

      return config;
    },
    (error) => {
      return Promise.reject(normalizeError(error));
    }
  );

  // 2. Response Interceptor
  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config as (RequestConfig & { _retry?: boolean }) | undefined;

      // If no config or network-level failure before reaching endpoint
      if (!originalRequest || !error.response) {
        return Promise.reject(normalizeError(error));
      }

      const status = error.response.status;
      const requestUrl = originalRequest.url || '';

      // Skip refresh attempt for public endpoints or if already retried
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh') ||
        requestUrl.includes('/auth/register');

      if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        const refreshToken = tokenService.getRefreshToken();

        if (refreshToken) {
          if (isRefreshing) {
            // Queue request until refresh is done
            return new Promise<AxiosResponse>((resolve, reject) => {
              failedQueue.push({
                resolve: (token: string) => {
                  originalRequest.headers = originalRequest.headers || {};
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  resolve(axiosInstance(originalRequest));
                },
                reject: (err: unknown) => {
                  reject(normalizeError(err));
                },
              });
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Use a clean axios instance to avoid recursive interceptor calls
            const baseURL = axiosInstance.defaults.baseURL || '';
            const refreshEndpoint = baseURL.endsWith('/')
              ? `${baseURL}auth/refresh`
              : `${baseURL}/auth/refresh`;

            const refreshResponse = await axios.post<{
              accessToken?: string;
              token?: string;
              data?: { accessToken?: string };
            }>(
              refreshEndpoint,
              { refreshToken },
              {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000,
              }
            );

            // Extract access token from Spring Boot or custom format
            const payload = refreshResponse.data;
            const newAccessToken =
              payload.accessToken ||
              payload.token ||
              payload.data?.accessToken;

            if (!newAccessToken) {
              throw new Error('No access token returned from refresh endpoint');
            }

            // Persist new token
            tokenService.setAccessToken(newAccessToken);

            // Notify queued requests
            processQueue(null, newAccessToken);

            // Retry original failed request
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return axiosInstance(originalRequest);
          } catch (refreshErr) {
            processQueue(refreshErr, null);
            tokenService.clearTokens();
            return Promise.reject(normalizeError(refreshErr));
          } finally {
            isRefreshing = false;
          }
        } else {
          // No refresh token available, session is invalidated
          tokenService.clearTokens();
        }
      }

      return Promise.reject(normalizeError(error));
    }
  );
}
