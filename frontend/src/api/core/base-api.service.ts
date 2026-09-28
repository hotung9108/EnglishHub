import { httpClient } from './client';
import type { ApiRequestOptions, ICrudService, IHttpClient } from '../interfaces/http.interface';

export abstract class BaseApiService<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  ID = string | number,
  TParams = Record<string, unknown>
> implements ICrudService<T, TCreate, TUpdate, ID, TParams> {
  protected readonly endpoint: string;
  protected readonly http: IHttpClient;

  constructor(endpoint: string, http: IHttpClient = httpClient) {
    this.endpoint = endpoint.replace(/\/+$/, '');
    this.http = http;
  }

  protected buildUrl(path?: string | ID): string {
    if (path === undefined || path === null || path === '') {
      return this.endpoint;
    }
    return `${this.endpoint}/${String(path).replace(/^\/+/, '')}`;
  }

  async getAll(params?: TParams, options?: ApiRequestOptions): Promise<T[]> {
    return this.http.get<T[]>(this.endpoint, {
      ...options,
      params: { ...params, ...(options?.params as Record<string, unknown> | undefined) },
    });
  }

  async getById(id: ID, options?: ApiRequestOptions): Promise<T> {
    return this.http.get<T>(this.buildUrl(id), options);
  }

  async create(payload: TCreate, options?: ApiRequestOptions): Promise<T> {
    return this.http.post<T>(this.endpoint, payload, options);
  }

  async update(id: ID, payload: TUpdate, options?: ApiRequestOptions): Promise<T> {
    return this.http.put<T>(this.buildUrl(id), payload, options);
  }

  async patch(id: ID, payload: Partial<TUpdate>, options?: ApiRequestOptions): Promise<T> {
    return this.http.patch<T>(this.buildUrl(id), payload, options);
  }

  async delete(id: ID, options?: ApiRequestOptions): Promise<void> {
    return this.http.delete<void>(this.buildUrl(id), options);
  }

  protected async get<R>(path?: string, options?: ApiRequestOptions): Promise<R> {
    return this.http.get<R>(this.buildUrl(path), options);
  }

  protected async post<R>(path?: string, data?: unknown, options?: ApiRequestOptions): Promise<R> {
    return this.http.post<R>(this.buildUrl(path), data, options);
  }

  protected async put<R>(path?: string, data?: unknown, options?: ApiRequestOptions): Promise<R> {
    return this.http.put<R>(this.buildUrl(path), data, options);
  }

  protected async patchRequest<R>(path?: string, data?: unknown, options?: ApiRequestOptions): Promise<R> {
    return this.http.patch<R>(this.buildUrl(path), data, options);
  }

  protected async deleteRequest<R>(path?: string, options?: ApiRequestOptions): Promise<R> {
    return this.http.delete<R>(this.buildUrl(path), options);
  }
}
