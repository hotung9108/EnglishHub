import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { environment } from '../../config/environment';
import { MemoryTokenStorage } from '../core/token-storage';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  NetworkError,
  TimeoutError,
  parseApiError,
} from '../core/errors';
import { BaseApiService } from '../core/base-api.service';
import { setupRequestInterceptor, TokenRefreshManager } from '../core/interceptors';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type { CustomAxiosRequestConfig } from '../core/types';

// ==========================================
// 1. CONFIGURATION TESTS (Environment Rules)
// ==========================================
test('Environment Configuration - conforms to rules', () => {
  assert.ok(environment.api.baseUrl, 'baseUrl must be defined');
  assert.strictEqual(typeof environment.api.timeout, 'number');
  assert.ok(environment.app.name, 'app.name must be defined');
  assert.ok(environment.auth.accessTokenKey, 'accessTokenKey must be defined');
  assert.ok(environment.auth.refreshTokenKey, 'refreshTokenKey must be defined');
  assert.ok(environment.auth.userKey, 'userKey must be defined');

  // Verify immutability
  assert.ok(Object.isFrozen(environment), 'environment object must be frozen');
  assert.ok(Object.isFrozen(environment.api), 'environment.api must be frozen');
  assert.ok(Object.isFrozen(environment.auth), 'environment.auth must be frozen');
});

// ==========================================
// 2. TOKEN STORAGE TESTS (Single Responsibility & LSP)
// ==========================================
test('TokenStorage - MemoryTokenStorage operations', () => {
  const storage = new MemoryTokenStorage();

  assert.strictEqual(storage.getAccessToken(), null);
  assert.strictEqual(storage.hasValidAccessToken(), false);

  storage.setAccessToken('sample-access-token');
  assert.strictEqual(storage.getAccessToken(), 'sample-access-token');
  assert.strictEqual(storage.hasValidAccessToken(), true);

  storage.setRefreshToken('sample-refresh-token');
  assert.strictEqual(storage.getRefreshToken(), 'sample-refresh-token');

  storage.clearTokens();
  assert.strictEqual(storage.getAccessToken(), null);
  assert.strictEqual(storage.getRefreshToken(), null);
  assert.strictEqual(storage.hasValidAccessToken(), false);
});

// ==========================================
// 3. ERROR PARSER & TYPED ERRORS TESTS
// ==========================================
test('Error Parsing - handles various error shapes', () => {
  // Direct ApiClientError
  const directError = new UnauthorizedError('Unauthorized session');
  assert.strictEqual(parseApiError(directError), directError);
  assert.strictEqual(directError.statusCode, 401);

  // Validation Error with fields
  const validationError = new ValidationError('Bad data', [{ field: 'email', message: 'Invalid format' }]);
  assert.strictEqual(validationError.statusCode, 400);
  assert.strictEqual(validationError.errors?.length, 1);
  assert.strictEqual(validationError.errors?.[0]?.field, 'email');

  // Forbidden, NotFound, Conflict
  assert.strictEqual(new ForbiddenError().statusCode, 403);
  assert.strictEqual(new NotFoundError().statusCode, 404);
  assert.strictEqual(new ConflictError().statusCode, 409);
  assert.strictEqual(new NetworkError().statusCode, 0);
  assert.strictEqual(new TimeoutError().statusCode, 408);

  // Simulated Axios 401 with backend message
  const axios401 = {
    isAxiosError: true,
    response: {
      status: 401,
      data: { error: 'Tài khoản chưa đăng nhập.' },
    },
  };
  const parsed401 = parseApiError(axios401);
  assert.ok(parsed401 instanceof UnauthorizedError);
  assert.strictEqual(parsed401.message, 'Tài khoản chưa đăng nhập.');
  assert.strictEqual(parsed401.statusCode, 401);

  // Simulated Axios 400 with validation errors
  const axios400 = {
    isAxiosError: true,
    response: {
      status: 400,
      data: {
        error: 'Dữ liệu không hợp lệ.',
        errors: [{ field: 'fullName', message: 'Tên không được trống.' }],
      },
    },
  };
  const parsed400 = parseApiError(axios400);
  assert.ok(parsed400 instanceof ValidationError);
  assert.strictEqual(parsed400.message, 'Dữ liệu không hợp lệ.');
  assert.strictEqual(parsed400.errors?.length, 1);

  // Timeout error code ECONNABORTED
  const timeoutAxios = {
    isAxiosError: true,
    code: 'ECONNABORTED',
    message: 'timeout of 15000ms exceeded',
  };
  const parsedTimeout = parseApiError(timeoutAxios);
  assert.ok(parsedTimeout instanceof TimeoutError);

  // Network disconnect
  const networkAxios = {
    isAxiosError: true,
    message: 'Network Error',
  };
  const parsedNetwork = parseApiError(networkAxios);
  assert.ok(parsedNetwork instanceof NetworkError);
});

// ==========================================
// 4. BASE API SERVICE TESTS (SOLID Principles)
// ==========================================
interface MockItem {
  id: number;
  name: string;
}

class MockHttpClient implements IHttpClient {
  lastCall: { method: string; url: string; data?: unknown; options?: ApiRequestOptions } | null = null;

  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    this.lastCall = { method: 'GET', url, options };
    return [{ id: 1, name: 'Item 1' }] as T;
  }
  async post<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.lastCall = { method: 'POST', url, data, options };
    return { id: 2, ...(data as object) } as T;
  }
  async put<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.lastCall = { method: 'PUT', url, data, options };
    return { id: 1, ...(data as object) } as T;
  }
  async patch<T>(url: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
    this.lastCall = { method: 'PATCH', url, data, options };
    return { id: 1, ...(data as object) } as T;
  }
  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    this.lastCall = { method: 'DELETE', url, options };
    return undefined as T;
  }
  async request<T>(): Promise<T> {
    return {} as T;
  }
  async getRaw<T>(): Promise<AxiosResponse<T>> {
    return {} as AxiosResponse<T>;
  }
}

class ItemService extends BaseApiService<MockItem, { name: string }, { name?: string }, number> {
  constructor(http: IHttpClient) {
    super('/items', http);
  }

  // Domain specific sub-resource method
  async getSubItems(itemId: number): Promise<MockItem[]> {
    return this.get<MockItem[]>(`${itemId}/sub-items`);
  }
}

test('BaseApiService - CRUD and subresources via Dependency Inversion', async () => {
  const mockHttp = new MockHttpClient();
  const service = new ItemService(mockHttp);

  // 1. getAll
  await service.getAll({ page: 1 });
  assert.strictEqual(mockHttp.lastCall?.method, 'GET');
  assert.strictEqual(mockHttp.lastCall?.url, '/items');
  assert.deepStrictEqual(mockHttp.lastCall?.options?.params, { page: 1 });

  // 2. getById
  await service.getById(42);
  assert.strictEqual(mockHttp.lastCall?.method, 'GET');
  assert.strictEqual(mockHttp.lastCall?.url, '/items/42');

  // 3. create
  await service.create({ name: 'New Item' });
  assert.strictEqual(mockHttp.lastCall?.method, 'POST');
  assert.strictEqual(mockHttp.lastCall?.url, '/items');
  assert.deepStrictEqual(mockHttp.lastCall?.data, { name: 'New Item' });

  // 4. update
  await service.update(42, { name: 'Updated' });
  assert.strictEqual(mockHttp.lastCall?.method, 'PUT');
  assert.strictEqual(mockHttp.lastCall?.url, '/items/42');

  // 5. patch
  await service.patch(42, { name: 'Patched' });
  assert.strictEqual(mockHttp.lastCall?.method, 'PATCH');
  assert.strictEqual(mockHttp.lastCall?.url, '/items/42');

  // 6. delete
  await service.delete(42);
  assert.strictEqual(mockHttp.lastCall?.method, 'DELETE');
  assert.strictEqual(mockHttp.lastCall?.url, '/items/42');

  // 7. Sub-resource custom method
  await service.getSubItems(42);
  assert.strictEqual(mockHttp.lastCall?.method, 'GET');
  assert.strictEqual(mockHttp.lastCall?.url, '/items/42/sub-items');
});

// ==========================================
// 5. INTERCEPTORS & REFRESH TOKEN MUTEX TESTS
// ==========================================
test('Request Interceptor - attaches bearer token and respects skipAuth', async () => {
  const storage = new MemoryTokenStorage();
  storage.setAccessToken('my-jwt-token');

  const instance = axios.create();
  setupRequestInterceptor(instance, storage);

  // Standard request
  const regularConfig = (await (instance.interceptors.request as unknown as {
    handlers: Array<{ fulfilled: (cfg: CustomAxiosRequestConfig) => CustomAxiosRequestConfig }>;
  }).handlers[0].fulfilled({
    headers: new axios.AxiosHeaders(),
  } as CustomAxiosRequestConfig)) as CustomAxiosRequestConfig;

  assert.strictEqual(regularConfig.headers?.Authorization, 'Bearer my-jwt-token');

  // SkipAuth request
  const skipAuthConfig = (await (instance.interceptors.request as unknown as {
    handlers: Array<{ fulfilled: (cfg: CustomAxiosRequestConfig) => CustomAxiosRequestConfig }>;
  }).handlers[0].fulfilled({
    headers: new axios.AxiosHeaders(),
    skipAuth: true,
  } as CustomAxiosRequestConfig)) as CustomAxiosRequestConfig;

  assert.strictEqual(skipAuthConfig.headers?.Authorization, undefined);
});

test('TokenRefreshManager - handles 401 with refresh queue and prevents infinite loop', async () => {
  const storage = new MemoryTokenStorage();
  storage.setAccessToken('expired-access-token');
  storage.setRefreshToken('valid-refresh-token');

  const manager = new TokenRefreshManager(storage);

  // 1. Auth endpoint should reject immediately without refreshing
  const authErr = {
    isAxiosError: true,
    config: { url: '/api/v1/auth/login' } as InternalAxiosRequestConfig,
    response: { status: 401, data: { error: 'Wrong password' } },
  };

  await assert.rejects(
    async () => {
      await manager.handle401(authErr as unknown as import('axios').AxiosError, axios.create());
    },
    (err: unknown) => {
      assert.ok(err instanceof UnauthorizedError);
      assert.strictEqual((err as UnauthorizedError).message, 'Wrong password');
      return true;
    }
  );

  // 2. Request without refresh token should clear tokens and reject
  storage.clearTokens();
  const noTokenErr = {
    isAxiosError: true,
    config: { url: '/api/v1/classes' } as InternalAxiosRequestConfig,
    response: { status: 401, data: {} },
  };

  await assert.rejects(
    async () => {
      await manager.handle401(noTokenErr as unknown as import('axios').AxiosError, axios.create());
    },
    (err: unknown) => {
      assert.ok(err instanceof UnauthorizedError);
      return true;
    }
  );
});
