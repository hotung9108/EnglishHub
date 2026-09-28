import type { AxiosInstance, AxiosResponse } from 'axios';
import type { IHttpClient, RequestConfig, ApiResponse } from '../../types/api.types';
import { axiosClient } from './client';

/**
 * BaseHttpClient implements IHttpClient adhering to Dependency Inversion Principle (DIP).
 * Decouples services from direct Axios static calls, allowing easy mocking or multi-tenant instances.
 */
export class BaseHttpClient implements IHttpClient {
  protected readonly instance: AxiosInstance;

  constructor(clientInstance: AxiosInstance = axiosClient) {
    this.instance = clientInstance;
  }

  /**
   * Smartly unpacks data payload. If backend returns an ApiResponse<T> envelope,
   * extracts the inner .data; otherwise returns the response body directly.
   */
  protected extractData<T>(response: AxiosResponse<T | ApiResponse<T>>): T {
    const body = response.data;
    if (
      body !== null &&
      typeof body === 'object' &&
      'success' in body &&
      'data' in body
    ) {
      return (body as ApiResponse<T>).data;
    }
    return body as T;
  }

  public async get<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.instance.get<T | ApiResponse<T>>(url, config);
    return this.extractData<T>(response);
  }

  public async post<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    const response = await this.instance.post<T | ApiResponse<T>>(url, data, config);
    return this.extractData<T>(response);
  }

  public async put<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    const response = await this.instance.put<T | ApiResponse<T>>(url, data, config);
    return this.extractData<T>(response);
  }

  public async patch<T, D = unknown>(url: string, data?: D, config?: RequestConfig): Promise<T> {
    const response = await this.instance.patch<T | ApiResponse<T>>(url, data, config);
    return this.extractData<T>(response);
  }

  public async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    const response = await this.instance.delete<T | ApiResponse<T>>(url, config);
    return this.extractData<T>(response);
  }

  public async request<T>(config: RequestConfig): Promise<T> {
    const response = await this.instance.request<T | ApiResponse<T>>(config);
    return this.extractData<T>(response);
  }

  public async upload<T>(url: string, formData: FormData, config?: RequestConfig): Promise<T> {
    const uploadConfig: RequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    };
    const response = await this.instance.post<T | ApiResponse<T>>(url, formData, uploadConfig);
    return this.extractData<T>(response);
  }

  public async rawRequest<T>(config: RequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.request<T>(config);
  }
}

export const httpClient = new BaseHttpClient();
