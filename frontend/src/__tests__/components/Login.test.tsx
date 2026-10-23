import { beforeEach, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login';
import { renderPage } from './renderPage';
import { deferred } from '../deferred';
const { login } = vi.hoisted(() => ({ login: vi.fn() }));
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ login }) }));
beforeEach(() => { login.mockReset().mockResolvedValue({ role: 'teacher' }); });
function setup(state?: object, language = 'vi') {
  renderPage(<Login />, '/login', '/login', state, language);
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
  login.mockResolvedValue({ role });
  const { user, email, password } = setup();
  await user.type(email, 'person@example.com'); await user.type(password, 'secret');
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(login).toHaveBeenCalledExactlyOnceWith({ email: 'person@example.com', password: 'secret' });
  expect(screen.getByTestId('location')).toHaveTextContent(`/${role}`);
});
it.each([
  ['admin', '/admin/classes', '/admin/classes'], ['teacher', '/teacher/classes', '/teacher/classes'],
  ['student', '/student/assignments', '/student/assignments'], ['student', '/admin', '/student'],
])('validates the saved destination for %s', async (role, from, target) => {
  login.mockResolvedValue({ role });
  const { user, email, password } = setup({ from: { pathname: from } });
  await user.type(email, 'person@example.com'); await user.type(password, 'secret');
  await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(screen.getByTestId('location')).toHaveTextContent(target);
});
it.each(['vi', 'en'])('reports auth failure in %s and re-enables submit', async (language) => {
  login.mockRejectedValue(new Error('Unauthorized'));
  const { user, email, password } = setup(undefined, language);
  await user.type(email, 'person@example.com'); await user.type(password, 'wrong');
  const button = language === 'vi' ? 'Đăng nhập' : 'Sign in';
  await user.click(screen.getByRole('button', { name: button }));
  expect(await screen.findByText(language === 'vi' ? 'Tài khoản hoặc mật khẩu không chính xác.' : 'Invalid email or password credentials.')).toBeVisible();
  expect(screen.getByRole('button', { name: button })).toBeEnabled();
});
it('prevents duplicate requests while login is pending on current develop', async () => {
  const pending = deferred<{ role: string }>(); login.mockReturnValue(pending.promise);
  const { user, email, password } = setup();
  await user.type(email, 'person@example.com'); await user.type(password, 'secret');
  await user.dblClick(screen.getByRole('button', { name: 'Đăng nhập' }));
  expect(screen.getByRole('button', { name: 'Đang xác thực...' })).toBeDisabled();
  expect(login).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve({ role: 'teacher' }); await pending.promise; });
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
