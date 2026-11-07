import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, CreateAxiosDefaults } from 'axios';
import { environment } from '@/config/environment';
import { setupRequestInterceptor, setupResponseInterceptor, TokenRefreshManager } from './interceptors';
import { tokenStorage } from './token-storage';
import { apiCache } from './cache';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type { ITokenStorage } from '../interfaces/token.interface';

export function createApiClient(
  customDefaults?: CreateAxiosDefaults,
  storage: ITokenStorage = tokenStorage
): AxiosInstance {
  const instance = axios.create({
    baseURL: environment.api.baseUrl,
    timeout: environment.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...customDefaults,
  });

  const refreshManager = new TokenRefreshManager(storage);
  setupRequestInterceptor(instance, storage);
  setupResponseInterceptor(instance, refreshManager);

  return instance;
}

// Shared singleton Axios instance
export const apiClient: AxiosInstance = createApiClient();

export class AxiosHttpClientAdapter implements IHttpClient {
  private readonly client: AxiosInstance;

  constructor(client: AxiosInstance = apiClient) {
    this.client = client;
  }

  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const key = `${url}:${JSON.stringify(options?.params ?? {})}`;

    if (options?.useCache && !options?.skipCache) {
      const cached = apiCache.get<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    const fetcher = async () => {
      const response = await this.client.get<T>(url, options);
      if (options?.useCache && !options?.skipCache) {
        apiCache.set<T>(key, response.data, options.cacheTtlMs ?? 30000);
      }
      return response.data;
    };

    if (!options?.skipCache) {
      return apiCache.dedupe<T>(key, fetcher);
    }

    return fetcher();
  }

  async post<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const response = await this.client.post<T>(url, data, options);
    apiCache.invalidate();
    return response.data;
  }

  async put<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const response = await this.client.put<T>(url, data, options);
    apiCache.invalidate();
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    const response = await this.client.patch<T>(url, data, options);
    apiCache.invalidate();
    return response.data;
  }

  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    const response = await this.client.delete<T>(url, options);
    apiCache.invalidate();
    return response.data;
  }

  async request<T>(config: AxiosRequestConfig & ApiRequestOptions): Promise<T> {
    const response = await this.client.request<T>(config);
    if (config.method && !['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
      apiCache.invalidate();
    }
    return response.data;
  }

  async getRaw<T>(url: string, options?: ApiRequestOptions): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, options);
  }
}

// Shared singleton HTTP client adapter conforming to IHttpClient
export const httpClient: IHttpClient = new AxiosHttpClientAdapter(apiClient);
