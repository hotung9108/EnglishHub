import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AuthProvider } from '../../contexts/AuthContext';
import { useAuth } from '../../hooks/useAuth';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { createApiClient, httpClient } from '../../api/core/client';
import { AUTH_EVENTS } from '../../api/core/interceptors';
import { UnauthorizedError } from '../../api/core/errors';
import { tokenStorage } from '../../api/core/token-storage';
import { authService } from '../../api/services/auth.service';
import { environment } from '../../config/environment';

// Identity is from local-dev/db-snapshot/users.csv. Tokens are local I/O fixtures.
const profile = { id: 12, fullName: 'Ngô Thị Phương', email: 'ngo.thi.phuong@gmail.com',
  role: 'STUDENT', status: 'ACTIVE' };
const initialAccess = 'test-session-before-refresh-access';
const initialRefresh = 'test-session-before-refresh-token';
const renewedAccess = 'test-session-renewed-access';
let expired: Mock<(event: Event) => void>;

function SessionIndicator() {
  const { user } = useAuth();
  return <output aria-label="Current user">{user?.email ?? 'anonymous'}</output>;
}

function httpError(status: number, config: InternalAxiosRequestConfig) {
  return new AxiosError('Authentication rejected', AxiosError.ERR_BAD_REQUEST, config, undefined,
    { status, statusText: 'Authentication rejected', headers: {}, config,
      data: { error: 'Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại.' } });
}

beforeEach(() => {
  authService.clearSession();
  vi.spyOn(httpClient, 'get').mockResolvedValue(profile);
  expired = vi.fn<(event: Event) => void>();
  window.addEventListener(AUTH_EVENTS.EXPIRED, expired);
});
afterEach(() => {
  window.removeEventListener(AUTH_EVENTS.EXPIRED, expired);
});

async function setup(refreshStatus: 200 | 401 | 403, hasRefreshToken = true) {
  tokenStorage.setAccessToken(initialAccess);
  if (hasRefreshToken) tokenStorage.setRefreshToken(initialRefresh);
  localStorage.setItem(environment.auth.userKey, JSON.stringify(profile));
  const refreshConfig = { headers: new AxiosHeaders(), url: `${environment.api.baseUrl}/auth/refresh` };
  const refreshNetwork = vi.spyOn(axios, 'post');
  if (refreshStatus === 200) {
    refreshNetwork.mockResolvedValue({ data: { accessToken: renewedAccess }, status: 200,
      statusText: 'OK', headers: {}, config: refreshConfig });
  } else {
    refreshNetwork.mockRejectedValue(httpError(refreshStatus, refreshConfig));
  }
  let attempts = 0;
  const protectedNetwork = vi.fn<AxiosAdapter>(async (config) => {
    attempts += 1;
    if (attempts === 1) throw httpError(401, config);
    return { data: { message: 'Protected response' }, status: 200, statusText: 'OK', headers: {}, config };
  });
  const client = createApiClient({ adapter: protectedNetwork });
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/student']}>
        <SessionIndicator />
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student" element={<div>Protected content</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
  await screen.findByText('Protected content');
  return { client, protectedNetwork, refreshNetwork };
}

function expectSessionCleared() {
  expect(tokenStorage.getAccessToken()).toBeNull();
  expect(tokenStorage.getRefreshToken()).toBeNull();
  expect(localStorage.getItem(environment.auth.userKey)).toBeNull();
  expect(screen.getByLabelText('Current user')).toHaveTextContent('anonymous');
  expect(screen.getByText('Login page')).toBeVisible();
  expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  expect(expired).toHaveBeenCalledTimes(1);
}

it.each([401, 403] as const)('refresh HTTP %s clears the session and redirects without replay or another refresh', async (status) => {
  const { client, protectedNetwork, refreshNetwork } = await setup(status);
  await act(async () => {
    await expect(client.get('/classes')).rejects.toBeInstanceOf(UnauthorizedError);
  });
  expectSessionCleared();
  expect(protectedNetwork).toHaveBeenCalledTimes(1);
  expect(refreshNetwork).toHaveBeenCalledExactlyOnceWith(`${environment.api.baseUrl}/auth/refresh`,
    { refreshToken: initialRefresh }, expect.objectContaining({ timeout: environment.api.timeout }));
});

it('a protected HTTP 401 without a refresh token expires immediately without calling refresh', async () => {
  const { client, protectedNetwork, refreshNetwork } = await setup(401, false);
  await act(async () => {
    await expect(client.get('/classes')).rejects.toBeInstanceOf(UnauthorizedError);
  });
  expectSessionCleared();
  expect(protectedNetwork).toHaveBeenCalledTimes(1);
  expect(refreshNetwork).not.toHaveBeenCalled();
});

it('refresh HTTP 200 replays the protected request and retains the authenticated session', async () => {
  const { client, protectedNetwork, refreshNetwork } = await setup(200);
  const cachedUser = localStorage.getItem(environment.auth.userKey);
  await act(async () => {
    const response = await client.get<{ message: string }>('/classes');
    expect(response.data.message).toBe('Protected response');
  });
  expect(protectedNetwork).toHaveBeenCalledTimes(2);
  expect(protectedNetwork.mock.calls[1][0].headers.get('Authorization')).toBe(`Bearer ${renewedAccess}`);
  expect(refreshNetwork).toHaveBeenCalledTimes(1);
  expect(tokenStorage.getAccessToken()).toBe(renewedAccess);
  expect(tokenStorage.getRefreshToken()).toBe(initialRefresh);
  expect(localStorage.getItem(environment.auth.userKey)).toBe(cachedUser);
  expect(screen.getByLabelText('Current user')).toHaveTextContent(profile.email);
  expect(screen.getByText('Protected content')).toBeVisible();
  expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  expect(expired).not.toHaveBeenCalled();
});
