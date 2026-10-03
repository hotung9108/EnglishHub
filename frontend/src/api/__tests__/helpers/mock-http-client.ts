import type { AxiosResponse } from 'axios';
import type { ApiRequestOptions, IHttpClient } from '../../interfaces/http.interface';

export class MockHttpClient implements IHttpClient {
  calls: Array<{ method: string; url: string; data?: unknown; options?: ApiRequestOptions }> = [];
  mockResponse: unknown = null;

  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'GET', url, options });
    return (this.mockResponse ?? {}) as T;
  }
  async post<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'POST', url, data, options });
    return (this.mockResponse ?? {}) as T;
  }
  async put<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'PUT', url, data, options });
    return (this.mockResponse ?? {}) as T;
  }
  async patch<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'PATCH', url, data, options });
    return (this.mockResponse ?? {}) as T;
  }
  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'DELETE', url, options });
    return (this.mockResponse ?? {}) as T;
  }
  async request<T>(): Promise<T> {
    return {} as T;
  }
  async getRaw<T>(): Promise<AxiosResponse<T>> {
    return {} as AxiosResponse<T>;
  }
}
