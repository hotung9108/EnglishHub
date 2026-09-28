import assert from 'node:assert';
import axios from 'axios';
import { TokenService } from '../src/api/core/tokenService';
import { ApiException, normalizeError } from '../src/api/core/errorHandler';
import { BaseHttpClient } from '../src/api/core/BaseHttpClient';
import { BaseCrudService } from '../src/api/core/BaseService';
import { setupInterceptors } from '../src/api/core/interceptors';

// Mock localStorage for Node test environment
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// Attach mock localStorage to global if running in Node
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as unknown as { localStorage: MockLocalStorage }).localStorage = new MockLocalStorage();
}

async function runTests() {
  console.log('--- STARTING AXIOS & BASE ARCHITECTURE TEST SUITE ---');

  // Test 1: TokenService singleton & operations
  console.log('\n[Test 1] Testing TokenService...');
  const tokenService = TokenService.getInstance();
  tokenService.clearTokens();
  assert.strictEqual(tokenService.hasAccessToken(), false);
  assert.strictEqual(tokenService.getAccessToken(), null);
  assert.strictEqual(tokenService.getRefreshToken(), null);

  let refreshedTokenReceived = '';
  const unsubRefresh = tokenService.subscribeTokenRefresh((token) => {
    refreshedTokenReceived = token;
  });

  tokenService.setTokens({ accessToken: 'access_123', refreshToken: 'refresh_456' });
  assert.strictEqual(tokenService.getAccessToken(), 'access_123');
  assert.strictEqual(tokenService.getRefreshToken(), 'refresh_456');
  assert.strictEqual(tokenService.hasAccessToken(), true);
  assert.strictEqual(refreshedTokenReceived, 'access_123');

  let authFailedFired = false;
  const unsubAuth = tokenService.subscribeAuthFailure(() => {
    authFailedFired = true;
  });

  tokenService.clearTokens();
  assert.strictEqual(tokenService.hasAccessToken(), false);
  assert.strictEqual(authFailedFired, true);

  unsubRefresh();
  unsubAuth();
  console.log('✓ TokenService passed all assertions');

  // Test 2: ApiException & normalizeError
  console.log('\n[Test 2] Testing ApiException & Error Normalization...');
  // 2a. Generic JS Error
  const err1 = normalizeError(new Error('Sample error'));
  assert.strictEqual(err1 instanceof ApiException, true);
  assert.strictEqual(err1.message, 'Sample error');

  // 2b. Spring Boot ApiError shape { error: "Email hoặc mật khẩu không chính xác." }
  const mockAxiosErr401 = {
    isAxiosError: true,
    response: {
      status: 401,
      data: { error: 'Email hoặc mật khẩu không chính xác.' },
    },
  };
  const norm401 = normalizeError(mockAxiosErr401);
  assert.strictEqual(norm401.status, 401);
  assert.strictEqual(norm401.isAuthError, true);
  assert.strictEqual(norm401.message, 'Email hoặc mật khẩu không chính xác.');

  // 2c. Spring Boot validation errors shape { errors: [{ field: 'email', message: 'Email không hợp lệ' }] }
  const mockAxiosErr400 = {
    isAxiosError: true,
    response: {
      status: 400,
      data: {
        message: 'Dữ liệu không hợp lệ.',
        errors: [{ field: 'email', message: 'Email không đúng định dạng.' }],
      },
    },
  };
  const norm400 = normalizeError(mockAxiosErr400);
  assert.strictEqual(norm400.status, 400);
  assert.strictEqual(norm400.isValidationError, true);
  assert.strictEqual(norm400.getFieldError('email'), 'Email không đúng định dạng.');

  // 2d. Network disconnect
  const mockAxiosNetworkErr = {
    isAxiosError: true,
    response: undefined,
  };
  const normNetwork = normalizeError(mockAxiosNetworkErr);
  assert.strictEqual(normNetwork.isNetworkError, true);
  assert.strictEqual(normNetwork.status, 0);

  // 2e. Timeout error
  const mockAxiosTimeout = {
    isAxiosError: true,
    code: 'ECONNABORTED',
    message: 'timeout of 20000ms exceeded',
  };
  const normTimeout = normalizeError(mockAxiosTimeout);
  assert.strictEqual(normTimeout.code, 'TIMEOUT');
  assert.strictEqual(normTimeout.status, 408);
  console.log('✓ ApiException and error normalization passed all assertions');

  // Test 3: BaseHttpClient & ApiResponse envelope unwrapping (DIP)
  console.log('\n[Test 3] Testing BaseHttpClient & Envelope Unwrapping...');
  // Mock Axios instance
  const mockAxiosInstance = {
    get: async (url: string) => {
      if (url === '/enveloped') {
        return { data: { success: true, data: { id: 10, name: 'Enveloped Class' } } };
      }
      return { data: { id: 20, name: 'Direct Class' } };
    },
    post: async (_url: string, data: unknown) => {
      return { data: { success: true, data: { ...(data as object), id: 99 } } };
    },
    put: async (_url: string, data: unknown) => {
      return { data: { ...(data as object), updated: true } };
    },
    patch: async (_url: string, data: unknown) => {
      return { data: { ...(data as object), patched: true } };
    },
    delete: async () => {
      return { data: { success: true } };
    },
    request: async (config: { url: string }) => {
      return { data: { configUrl: config.url } };
    },
  } as unknown as ReturnType<typeof axios.create>;

  const testHttpClient = new BaseHttpClient(mockAxiosInstance);

  const unwrappedRes = await testHttpClient.get<{ id: number; name: string }>('/enveloped');
  assert.strictEqual(unwrappedRes.id, 10);
  assert.strictEqual(unwrappedRes.name, 'Enveloped Class');

  const directRes = await testHttpClient.get<{ id: number; name: string }>('/direct');
  assert.strictEqual(directRes.id, 20);
  assert.strictEqual(directRes.name, 'Direct Class');

  const postRes = await testHttpClient.post<{ id: number; title: string }>('/items', { title: 'New Item' });
  assert.strictEqual(postRes.id, 99);
  assert.strictEqual(postRes.title, 'New Item');
  console.log('✓ BaseHttpClient passed all assertions');

  // Test 4: BaseCrudService URL building and CRUD calls (OCP & LSP & ISP)
  console.log('\n[Test 4] Testing BaseCrudService...');
  interface DummyItem {
    id: number;
    title: string;
  }

  let capturedUrl = '';
  let capturedConfig: unknown = null;

  const mockCrudAxios = {
    get: async (url: string, config: unknown) => {
      capturedUrl = url;
      capturedConfig = config;
      return { data: [{ id: 1, title: 'Item 1' }] };
    },
    post: async (url: string, data: unknown) => {
      capturedUrl = url;
      return { data };
    },
    put: async (url: string, data: unknown) => {
      capturedUrl = url;
      return { data };
    },
    patch: async (url: string, data: unknown) => {
      capturedUrl = url;
      return { data };
    },
    delete: async (url: string) => {
      capturedUrl = url;
      return { data: null };
    },
  } as unknown as ReturnType<typeof axios.create>;

  const crudClient = new BaseHttpClient(mockCrudAxios);

  class DummyService extends BaseCrudService<DummyItem> {
    constructor() {
      super('/dummy-resource', crudClient);
    }
  }

  const dummyService = new DummyService();
  assert.strictEqual(dummyService.baseEndpoint, '/dummy-resource');

  await dummyService.getAll({ page: 2, size: 20, search: 'test', emptyField: undefined });
  assert.strictEqual(capturedUrl, '/dummy-resource');
  const params = (capturedConfig as { params: Record<string, unknown> }).params;
  assert.strictEqual(params.page, 2);
  assert.strictEqual(params.size, 20);
  assert.strictEqual(params.search, 'test');
  assert.strictEqual(params.emptyField, undefined);

  await dummyService.getById(42);
  assert.strictEqual(capturedUrl, '/dummy-resource/42');

  await dummyService.create({ title: 'Created' });
  assert.strictEqual(capturedUrl, '/dummy-resource');

  await dummyService.update(42, { title: 'Updated' });
  assert.strictEqual(capturedUrl, '/dummy-resource/42');

  await dummyService.patch(42, { title: 'Patched' });
  assert.strictEqual(capturedUrl, '/dummy-resource/42');

  const deleteResult = await dummyService.delete(42);
  assert.strictEqual(capturedUrl, '/dummy-resource/42');
  assert.strictEqual(deleteResult, true);
  console.log('✓ BaseCrudService passed all assertions');

  // Test 5: Interceptor Bearer Token and Header Injection
  console.log('\n[Test 5] Testing Interceptors...');
  const testAxiosInstance = axios.create({ baseURL: 'https://api.englishhub.local/v1' });
  setupInterceptors(testAxiosInstance);

  tokenService.setTokens({ accessToken: 'valid_access_token', refreshToken: 'valid_refresh_token' });

  // Test request interceptor directly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reqInterceptor: any = (testAxiosInstance.interceptors.request as any).handlers[0];
  const initialConfig = {
    headers: new axios.AxiosHeaders(),
    url: '/users/me',
  };

  const processedConfig = await reqInterceptor.fulfilled(initialConfig);
  assert.strictEqual(processedConfig.headers.get('Authorization'), 'Bearer valid_access_token');
  assert.strictEqual(processedConfig.headers.get('Accept-Language'), 'vi');

  // Test skipAuth flag
  const skipAuthConfig = {
    headers: new axios.AxiosHeaders(),
    url: '/auth/login',
    skipAuth: true,
  };
  const processedSkipAuth = await reqInterceptor.fulfilled(skipAuthConfig);
  assert.strictEqual(processedSkipAuth.headers.get('Authorization'), undefined);
  console.log('✓ Request interceptor bearer attachment & skipAuth passed');

  // Test 6: Response Interceptor 401 and Token Cleanup
  console.log('\n[Test 6] Testing Response Interceptor 401 handling...');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resInterceptor: any = (testAxiosInstance.interceptors.response as any).handlers[0];

  // 6a. 401 without refresh token -> clears tokens and rejects with ApiException
  tokenService.clearTokens();
  tokenService.setAccessToken('old_access'); // no refresh token
  assert.strictEqual(tokenService.hasAccessToken(), true);
  assert.strictEqual(tokenService.getRefreshToken(), null);

  const mock401Error = {
    isAxiosError: true,
    config: { url: '/protected-resource' },
    response: { status: 401, data: { error: 'Phiên làm việc đã hết hạn' } },
  };

  try {
    await resInterceptor.rejected(mock401Error);
    assert.fail('Should have rejected with ApiException');
  } catch (err) {
    const apiErr = err as ApiException;
    assert.strictEqual(apiErr.name, 'ApiException');
    assert.strictEqual(apiErr.status, 401);
    assert.strictEqual(apiErr.isAuthError, true);
    assert.strictEqual(tokenService.hasAccessToken(), false); // Cleared!
  }
  console.log('✓ 401 without refresh token correctly invalidates token and rejects');

  // Test 7: Verify Hook Exports & Contracts
  console.log('\n[Test 7] Testing Reusable Hooks Interface & Exports...');
  const hooksModule = await import('../src/hooks/index');
  assert.strictEqual(typeof hooksModule.useApi, 'function');
  assert.strictEqual(typeof hooksModule.useMutation, 'function');
  assert.strictEqual(typeof hooksModule.usePagination, 'function');
  assert.strictEqual(typeof hooksModule.useCrud, 'function');
  assert.strictEqual(typeof hooksModule.useAuth, 'function');
  console.log('✓ Hooks interface and barrel exports verified');

  // Test 8: Verify Environment Configuration & Externalized API Endpoints
  console.log('\n[Test 8] Testing EnvConfig & Externalized Endpoints...');
  const { envConfig } = await import('../src/config/env');
  assert.ok(envConfig.API_BASE_URL.length > 0, 'API_BASE_URL must not be empty');
  assert.strictEqual(typeof envConfig.API_TIMEOUT, 'number');
  assert.strictEqual(typeof envConfig.AUTH_REFRESH_TIMEOUT, 'number');
  assert.strictEqual(typeof envConfig.ENDPOINTS.AUTH.LOGIN, 'string');
  assert.strictEqual(typeof envConfig.ENDPOINTS.AUTH.REFRESH, 'string');
  assert.strictEqual(typeof envConfig.ENDPOINTS.AUTH.LOGOUT, 'string');
  assert.strictEqual(typeof envConfig.ENDPOINTS.USERS.ME, 'string');
  assert.strictEqual(typeof envConfig.ENDPOINTS.USERS.PROFILE, 'string');
  assert.strictEqual(typeof envConfig.ENDPOINTS.USERS.CHANGE_PASSWORD, 'string');
  console.log(`✓ EnvConfig verified (Base URL: ${envConfig.API_BASE_URL}, Timeout: ${envConfig.API_TIMEOUT}ms)`);

  console.log('\n=========================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (100% OK)');
  console.log('=========================================');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
