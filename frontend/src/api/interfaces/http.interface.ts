import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiRequestOptions extends Omit<AxiosRequestConfig, 'url' | 'method'> {
  skipAuth?: boolean;
  skipErrorToast?: boolean;
  retryOn401?: boolean;
}

export interface IHttpClient {
  get<T>(url: string, options?: ApiRequestOptions): Promise<T>;
  post<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T>;
  put<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T>;
  patch<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T>;
  delete<T>(url: string, options?: ApiRequestOptions): Promise<T>;
  request<T>(config: AxiosRequestConfig & ApiRequestOptions): Promise<T>;
  getRaw<T>(url: string, options?: ApiRequestOptions): Promise<AxiosResponse<T>>;
}

export interface IReadService<T, ID = string | number, TParams = Record<string, unknown>> {
  getById(id: ID, options?: ApiRequestOptions): Promise<T>;
  getAll(params?: TParams, options?: ApiRequestOptions): Promise<T[]>;
}

export interface ICreateService<T, TCreate = Partial<T>> {
  create(payload: TCreate, options?: ApiRequestOptions): Promise<T>;
}

export interface IUpdateService<T, TUpdate = Partial<T>, ID = string | number> {
  update(id: ID, payload: TUpdate, options?: ApiRequestOptions): Promise<T>;
}

export interface IPatchService<T, TPatch = Partial<T>, ID = string | number> {
  patch(id: ID, payload: TPatch, options?: ApiRequestOptions): Promise<T>;
}

export interface IDeleteService<ID = string | number, TResult = void> {
  delete(id: ID, options?: ApiRequestOptions): Promise<TResult>;
}

export interface ICrudService<
  T,
  TCreate = Partial<T>,
  TUpdate = Partial<T>,
  ID = string | number,
  TParams = Record<string, unknown>
> extends IReadService<T, ID, TParams>,
    ICreateService<T, TCreate>,
    IUpdateService<T, TUpdate, ID>,
    IPatchService<T, Partial<TUpdate>, ID>,
    IDeleteService<ID> {}
