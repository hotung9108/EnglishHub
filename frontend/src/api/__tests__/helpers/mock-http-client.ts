import type { AxiosResponse } from 'axios';
import type { ApiRequestOptions, IHttpClient } from '../../interfaces/http.interface';

export class MockHttpClient implements IHttpClient {
  calls: Array<{ method: string; url: string; data?: unknown; options?: ApiRequestOptions }> = [];
  mockResponse: unknown = null;
  mockResponses?: unknown[];
  responsesByUrl?: Record<string, unknown>;
  mockError: Error | null = null;

  private resolveResponse<T>(url: string): T {
    if (this.mockError) throw this.mockError;
    if (this.responsesByUrl && url in this.responsesByUrl) {
      return this.responsesByUrl[url] as T;
    }
    if (this.mockResponses && this.mockResponses.length > 0) {
      return this.mockResponses.shift() as T;
    }
    return (this.mockResponse ?? {}) as T;
  }

  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'GET', url, options });
    return this.resolveResponse<T>(url);
  }
  async post<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'POST', url, data, options });
    return this.resolveResponse<T>(url);
  }
  async put<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'PUT', url, data, options });
    return this.resolveResponse<T>(url);
  }
  async patch<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'PATCH', url, data, options });
    return this.resolveResponse<T>(url);
  }
  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    this.calls.push({ method: 'DELETE', url, options });
    return this.resolveResponse<T>(url);
  }
  async request<T>(): Promise<T> {
    return {} as T;
  }
  async getRaw<T>(): Promise<AxiosResponse<T>> {
    return {} as AxiosResponse<T>;
  }
}
