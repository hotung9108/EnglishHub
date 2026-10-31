import { beforeEach, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import { renderPage } from './renderPage';
import { deferred } from '../deferred';
import { AuthProvider } from '../../contexts/AuthContext';
import { authService } from '../../api/services/auth.service';
import type { AuthResponse } from '../../api/services/auth.service';
import { userService } from '../../api/services/user.service';
import type { UserProfile } from '../../api/services/user.service';
import type { Role } from '../../types/auth';
import { httpClient } from '../../api/core/client';
import { NotFoundError, UnauthorizedError } from '../../api/core/errors';
import { environment } from '../../config/environment';

// Identity comes from local-dev/db-snapshot/users.csv; transport stays mocked.
const identity = { id: 4, fullName: 'Phạm Diệu Anh', email: 'pham.dieu.anh@gmail.com' };
const roleCodes: Record<Role, UserProfile['role']> = { admin: 'ADMIN', teacher: 'TEACHER', student: 'STUDENT' };
let login: MockInstance<typeof httpClient.post>;
let profile: MockInstance<typeof userService.getMyProfile>;
function loginResponse(role: Role): AuthResponse {
  return { accessToken: 'test-login-access', refreshToken: 'test-login-refresh',
    user: { ...identity, role: roleCodes[role] } };
}
function acceptRole(role: Role) {
  login.mockResolvedValue(loginResponse(role));
  profile.mockResolvedValue({ ...identity, role: roleCodes[role], status: 'ACTIVE' });
}
beforeEach(() => {
  authService.clearSession();
  login = vi.spyOn(httpClient, 'post');
  profile = vi.spyOn(userService, 'getMyProfile');
  acceptRole('teacher');
});
function setup(state?: object, language = 'vi') {
  renderPage(<AuthProvider><Login /></AuthProvider>, '/login', '/login', state, language);
  return { user: userEvent.setup(), email: screen.getByLabelText('Email'), password: screen.getByPlaceholderText('••••••••') };
}
it('blocks empty credentials and malformed email', async () => {
  const { user, email, password } = setup();
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(email).toBeInvalid(); expect(password).toBeInvalid();
  await user.type(email, 'invalid'); await user.type(password, 'secret');
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(email).toBeInvalid(); expect(login).not.toHaveBeenCalled();
});
it.each(['admin', 'teacher', 'student'])('submits credentials and redirects authenticated %s', async (role) => {
  acceptRole(role as Role);
  const { user, email, password } = setup();
  await user.type(email, identity.email); await user.type(password, 'secret');
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(login).toHaveBeenCalledExactlyOnceWith('/auth/login', { email: identity.email, password: 'secret' }, { skipAuth: true });
  expect(screen.getByTestId('location')).toHaveTextContent(`/${role}`);
});
it.each([
  ['admin', '/admin/classes', '/admin/classes'], ['teacher', '/teacher/classes', '/teacher/classes'],
  ['student', '/student/assignments', '/student/assignments'], ['student', '/admin', '/student'],
])('validates the saved destination for %s', async (role, from, target) => {
  acceptRole(role as Role);
  const { user, email, password } = setup({ from: { pathname: from } });
  await user.type(email, identity.email); await user.type(password, 'secret');
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(screen.getByTestId('location')).toHaveTextContent(target);
});
it.each([
  { language: 'vi', status: 401 }, { language: 'en', status: 401 },
  { language: 'vi', status: 404 }, { language: 'en', status: 404 },
])('reports HTTP $status in $language without persisting a session or redirecting', async ({ language, status }) => {
  const error = status === 404 ? new NotFoundError('Tài khoản không tồn tại.') : new UnauthorizedError('Unauthorized');
  login.mockRejectedValue(error);
  const { user, email, password } = setup(undefined, language);
  await user.type(email, identity.email); await user.type(password, 'wrong');
  const button = language === 'vi' ? 'Đăng nhập' : 'Sign in';
  await user.click(screen.getByRole('button', { name: button }));
  expect(await screen.findByText(language === 'vi' ? 'Tài khoản hoặc mật khẩu không chính xác.' : 'Invalid email or password credentials.')).toBeVisible();
  expect(screen.getByRole('button', { name: button })).toBeEnabled();
  expect(screen.getByTestId('location').textContent).toBe('/login');
  expect(localStorage.getItem(environment.auth.accessTokenKey)).toBeNull();
  expect(localStorage.getItem(environment.auth.refreshTokenKey)).toBeNull();
  expect(localStorage.getItem(environment.auth.userKey)).toBeNull();
  expect(profile).not.toHaveBeenCalled();
});
it('prevents duplicate requests while login is pending on current develop', async () => {
  const pending = deferred<AuthResponse>(); login.mockReturnValue(pending.promise);
  const { user, email, password } = setup();
  await user.type(email, identity.email); await user.type(password, 'secret');
  await user.dblClick(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(screen.getByRole('button', { name: 'Đang xác thực...' })).toBeDisabled();
  expect(login).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve(loginResponse('teacher')); await pending.promise; });
  expect(screen.getByTestId('location')).toHaveTextContent('/teacher');
});
it('toggles password visibility, remember-me and language', async () => {
  const { user, password } = setup();
  await user.click(screen.getByRole('button', { name: 'Show password' })); expect(password).toHaveAttribute('type', 'text');
  await user.click(screen.getByRole('button', { name: 'Hide password' })); expect(password).toHaveAttribute('type', 'password');
  await user.click(screen.getByRole('checkbox')); expect(screen.getByRole('checkbox')).not.toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Tiếng Việt' }));
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
