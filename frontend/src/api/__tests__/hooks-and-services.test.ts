import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { MemoryTokenStorage } from '../core/token-storage';
import { TokenRefreshManager } from '../core/interceptors';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { ClassService } from '../services/class.service';
import { buildListParams, computePagination, pageAfterEmptyRefetch } from '../../hooks/useUsers.utils';
import type { ApiRequestOptions, IHttpClient } from '../interfaces/http.interface';
import type { CustomAxiosRequestConfig } from '../core/types';

class MockHttpClient implements IHttpClient {
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

// ==========================================
// 1. AUTH SERVICE TESTS (SOLID & Session Lifecycle)
// ==========================================
test('AuthService - login sets tokens and session, logout clears session', async () => {
  const mockHttp = new MockHttpClient();
  const storage = new MemoryTokenStorage();
  const auth = new AuthService(mockHttp, storage);

  assert.strictEqual(auth.isAuthenticated(), false);

  mockHttp.mockResponse = {
    message: 'Success',
    accessToken: 'access-123',
    refreshToken: 'refresh-456',
    user: { id: 10, fullName: 'Lan Nguyen', email: 'teacher@englishhub.dev', role: 'TEACHER' },
  };

  const loginRes = await auth.login({ email: 'teacher@englishhub.dev', password: 'SecretPassword' });
  assert.strictEqual(loginRes.accessToken, 'access-123');
  assert.strictEqual(loginRes.user.role, 'teacher', 'role should be normalized to lowercase');
  assert.strictEqual(storage.getAccessToken(), 'access-123');
  assert.strictEqual(storage.getRefreshToken(), 'refresh-456');
  assert.strictEqual(auth.isAuthenticated(), true);

  // Logout
  mockHttp.mockResponse = { message: 'Logged out' };
  await auth.logout();
  assert.strictEqual(storage.getAccessToken(), null);
  assert.strictEqual(storage.getRefreshToken(), null);
  assert.strictEqual(auth.isAuthenticated(), false);
});

test('AuthService - forgotPassword and resetPassword call correct public endpoints', async () => {
  const mockHttp = new MockHttpClient();
  const storage = new MemoryTokenStorage();
  const auth = new AuthService(mockHttp, storage);

  mockHttp.mockResponse = {
    message: 'OTP dispatched',
    otpPreview: '123456',
    token: 'reset-token-xyz',
    expiresInSeconds: 900,
  };

  const forgotRes = await auth.forgotPassword({ email: 'student@englishhub.dev' });
  assert.strictEqual(forgotRes.otpPreview, '123456');
  assert.strictEqual(forgotRes.token, 'reset-token-xyz');
  assert.strictEqual(mockHttp.calls[0].method, 'POST');
  assert.strictEqual(mockHttp.calls[0].url, '/auth/forgot-password');

  mockHttp.mockResponse = {
    message: 'Password reset successful',
  };

  const resetRes = await auth.resetPassword({
    email: 'student@englishhub.dev',
    token: 'reset-token-xyz',
    otp: '123456',
    newPassword: 'BrandNewPassword123!',
  });
  assert.strictEqual(resetRes.message, 'Password reset successful');
  assert.strictEqual(mockHttp.calls[1].method, 'POST');
  assert.strictEqual(mockHttp.calls[1].url, '/auth/reset-password');
});

// ==========================================
// 2. USER SERVICE TESTS
// ==========================================
test('UserService - routes user profile and admin endpoints correctly', async () => {
  const mockHttp = new MockHttpClient();
  const userSvc = new UserService(mockHttp);

  // getMyProfile -> /users/me
  await userSvc.getMyProfile();
  assert.strictEqual(mockHttp.calls[0].method, 'GET');
  assert.strictEqual(mockHttp.calls[0].url, '/users/me');

  // updateMyProfile -> /users/me
  await userSvc.updateMyProfile({ fullName: 'New Name' });
  assert.strictEqual(mockHttp.calls[1].method, 'PUT');
  assert.strictEqual(mockHttp.calls[1].url, '/users/me');

  // changePassword -> /users/me/password
  await userSvc.changePassword({ currentPassword: 'old', newPassword: 'new' });
  assert.strictEqual(mockHttp.calls[2].method, 'PATCH');
  assert.strictEqual(mockHttp.calls[2].url, '/users/me/password');

  // Admin user list -> /admin/users
  mockHttp.mockResponse = { data: [], pagination: { page: 1, limit: 20, total: 0 } };
  await userSvc.listUsers({ page: 1, limit: 20, role: 'TEACHER' });
  assert.strictEqual(mockHttp.calls[3].method, 'GET');
  assert.strictEqual(mockHttp.calls[3].url, '/admin/users');
});

test('UserService - trims list filters and maps BE pagination', async () => {
  const mockHttp = new MockHttpClient();
  const userSvc = new UserService(mockHttp);
  const expected = {
    data: [{ id: 12, fullName: 'An Nguyen', email: 'an@example.test', role: 'STUDENT', status: 'ACTIVE' }],
    pagination: { page: 2, limit: 10, total: 11 },
  };
  mockHttp.mockResponse = expected;

  assert.deepStrictEqual(await userSvc.listUsers({ page: 2, limit: 10, q: ' An ', role: 'STUDENT' }), expected);
  assert.deepStrictEqual(mockHttp.calls[0].options?.params, { page: 2, limit: 10, q: 'An', role: 'STUDENT' });
});

test('UserService - uses admin create, update, and delete routes', async () => {
  const mockHttp = new MockHttpClient();
  const userSvc = new UserService(mockHttp);
  const payload = { fullName: 'An Nguyen', email: 'an@example.test', password: 'StrongPass8', role: 'STUDENT' as const };
  mockHttp.mockResponse = { message: 'created', user: { id: 12, email: payload.email, role: payload.role } };
  assert.deepStrictEqual(await userSvc.createUser(payload), mockHttp.mockResponse);
  mockHttp.mockResponse = { message: 'updated' };
  assert.deepStrictEqual(await userSvc.updateUser(12, { fullName: 'An N.' }), mockHttp.mockResponse);
  mockHttp.mockResponse = { message: 'deleted' };
  assert.deepStrictEqual(await userSvc.deleteUser(12), mockHttp.mockResponse);
  assert.deepStrictEqual(mockHttp.calls.map(({ method, url }) => [method, url]), [
    ['POST', '/admin/users'],
    ['PUT', '/admin/users/12'],
    ['DELETE', '/admin/users/12'],
  ]);
});

test('buildListParams clamps pagination and omits blank filters', () => {
  assert.deepStrictEqual(buildListParams({ page: 0, limit: 101, q: '  ', role: undefined }), {
    page: 1,
    limit: 100,
  });
  assert.deepStrictEqual(buildListParams({ page: 2.8, limit: 0, q: ' An ', role: 'ADMIN' }), {
    page: 2,
    limit: 1,
    q: 'An',
    role: 'ADMIN',
  });
});

test('computePagination derives page navigation', () => {
  assert.deepStrictEqual(computePagination({ page: 2, limit: 20, total: 41 }), {
    page: 2,
    limit: 20,
    total: 41,
    totalPages: 3,
    hasNext: true,
    hasPrevious: true,
  });
});

test('pageAfterEmptyRefetch moves back only when a page is empty', () => {
  for (const [page, itemCount, expected] of [[3, 0, 2], [1, 0, 1], [3, 4, 3]]) {
    assert.strictEqual(pageAfterEmptyRefetch(page, itemCount), expected);
  }
});

// ==========================================
// 3. CLASS SERVICE TESTS
// ==========================================
test('ClassService - CRUD and member sub-resources', async () => {
  const mockHttp = new MockHttpClient();
  const classSvc = new ClassService(mockHttp);

  // getAll -> /classes
  await classSvc.getAll();
  assert.strictEqual(mockHttp.calls[0].method, 'GET');
  assert.strictEqual(mockHttp.calls[0].url, '/classes');

  // getMembers -> /classes/:id/members
  await classSvc.getMembers(15);
  assert.strictEqual(mockHttp.calls[1].method, 'GET');
  assert.strictEqual(mockHttp.calls[1].url, '/classes/15/members');

  // addMember -> /classes/:id/members
  await classSvc.addMember(15, 101);
  assert.strictEqual(mockHttp.calls[2].method, 'POST');
  assert.strictEqual(mockHttp.calls[2].url, '/classes/15/members');
  assert.deepStrictEqual(mockHttp.calls[2].data, { studentId: 101 });

  // removeMember -> /classes/:id/members/:memberId
  await classSvc.removeMember(15, 202);
  assert.strictEqual(mockHttp.calls[3].method, 'DELETE');
  assert.strictEqual(mockHttp.calls[3].url, '/classes/15/members/202');
});

// ==========================================
// 4. CONCURRENT 401 QUEUE & MUTEX RECOVERY TEST
// ==========================================
test('TokenRefreshManager - queues multiple concurrent 401s and resolves all once refreshed', async () => {
  const storage = new MemoryTokenStorage();
  storage.setAccessToken('old-expired-token');
  storage.setRefreshToken('valid-refresh-token');

  const manager = new TokenRefreshManager(storage);

  let refreshCallCount = 0;
  // Mock axios.post globally for the refresh endpoint
  const originalPost = axios.post;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (axios as any).post = async (url: string) => {
    if (url.includes('/auth/refresh')) {
      refreshCallCount++;
      // Simulate network delay
      await new Promise(res => setTimeout(res, 50));
      return {
        data: { accessToken: 'brand-new-refreshed-token', message: 'Token refreshed' },
      };
    }
    return originalPost(url);
  };

  try {
    const mockAxiosInstance = (async (config: CustomAxiosRequestConfig) => {
      return {
        status: 200,
        data: { retriedWith: config.headers?.Authorization },
        config,
      };
    }) as unknown as AxiosInstance;

    // Simulate 3 concurrent failed requests
    const createReqError = (id: number) => ({
      isAxiosError: true,
      config: {
        url: `/api/v1/resource/${id}`,
        headers: new axios.AxiosHeaders(),
      } as InternalAxiosRequestConfig,
      response: { status: 401, data: {} },
    });

    const [res1, res2, res3] = (await Promise.all([
      manager.handle401(createReqError(1) as unknown as import('axios').AxiosError, mockAxiosInstance),
      manager.handle401(createReqError(2) as unknown as import('axios').AxiosError, mockAxiosInstance),
      manager.handle401(createReqError(3) as unknown as import('axios').AxiosError, mockAxiosInstance),
    ])) as Array<{ data: { retriedWith: string } }>;

    // Verify: ONLY 1 refresh call was made! (Mutex pattern verified)
    assert.strictEqual(refreshCallCount, 1, 'Only 1 refresh call should be made for concurrent 401s');

    // Verify storage updated
    assert.strictEqual(storage.getAccessToken(), 'brand-new-refreshed-token');

    // Verify all 3 requests were retried with the new token
    assert.strictEqual(res1.data.retriedWith, 'Bearer brand-new-refreshed-token');
    assert.strictEqual(res2.data.retriedWith, 'Bearer brand-new-refreshed-token');
    assert.strictEqual(res3.data.retriedWith, 'Bearer brand-new-refreshed-token');
  } finally {
    axios.post = originalPost;
  }
});
