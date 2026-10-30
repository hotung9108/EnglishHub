import { beforeEach, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '../../pages/ForgotPassword';
import { httpClient } from '../../api/core/client';
import { ApiClientError, NotFoundError, ValidationError } from '../../api/core/errors';
import { renderPage } from './renderPage';

const email = 'ngo.thi.phuong@gmail.com'; // local-dev/db-snapshot/users.csv
const otp = '123456'; // Existing API-test challenge fixture, entered through the form.
const newPassword = 'BrandNewPassword123!';
const notFoundMessage = 'Tài khoản với email này không tồn tại trong hệ thống.';
let post: MockInstance<typeof httpClient.post>;
type FormUser = ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  post = vi.spyOn(httpClient, 'post').mockResolvedValue({ email, message: 'Mã xác thực đã được gửi.' });
});

function setup() {
  renderPage(<ForgotPassword />, '/forgot-password');
  return userEvent.setup();
}
async function requestOtp(user: FormUser) {
  await user.type(screen.getByPlaceholderText('yourname@eh.com'), email);
  await user.click(screen.getByRole('button', { name: 'Gửi mã xác nhận' }));
}
async function reachReset(user: FormUser) {
  await requestOtp(user);
  expect(screen.getByRole('heading', { name: 'Xác thực mã OTP' })).toBeVisible();
  const inputs = screen.getAllByRole('textbox');
  expect(inputs).toHaveLength(otp.length);
  for (let index = 0; index < inputs.length; index += 1) {
    await user.type(inputs[index], otp[index]);
  }
  await user.click(screen.getByRole('button', { name: 'Xác thực mã OTP' }));
  expect(screen.getByRole('heading', { name: 'Đặt lại mật khẩu' })).toBeVisible();
  expect(post).toHaveBeenCalledTimes(1); // OTP is validated by the API only during reset.
  const passwords = screen.getAllByPlaceholderText('••••••••');
  await user.type(passwords[0], newPassword);
  await user.type(passwords[1], newPassword);
}
function expectRequestStep() {
  expect(screen.getByRole('heading', { name: 'Quên mật khẩu?' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Xác thực mã OTP' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Gửi mã xác nhận' })).toBeEnabled();
}

it('request HTTP 404 displays the API error and stays on the email step', async () => {
  post.mockRejectedValue(new NotFoundError(notFoundMessage));
  const user = setup();
  await requestOtp(user);
  expect(await screen.findByText(notFoundMessage)).toBeVisible();
  expectRequestStep();
  expect(post).toHaveBeenCalledExactlyOnceWith('/auth/forgot-password', { email }, { skipAuth: true });
});

it('two requests with the same HTTP 404 response display the same message', async () => {
  post.mockRejectedValue(new NotFoundError(notFoundMessage));
  const user = setup();
  await requestOtp(user);
  const firstMessage = (await screen.findByText(notFoundMessage)).textContent;
  await user.click(screen.getByRole('button', { name: 'Gửi mã xác nhận' }));
  expect(await screen.findByText(notFoundMessage)).toHaveTextContent(firstMessage ?? '');
  expect(post).toHaveBeenCalledTimes(2);
  expectRequestStep();
});

it.each([500, 502])('request HTTP %s displays the API error without entering the OTP step', async (status) => {
  const message = 'Không thể gửi email đặt lại mật khẩu.';
  post.mockRejectedValue(new ApiClientError(message, status));
  const user = setup();
  await requestOtp(user);
  expect(await screen.findByText(message)).toBeVisible();
  expectRequestStep();
});

it('resend HTTP 404 displays the API error and retains the OTP step', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  const user = userEvent.setup();
  renderPage(<ForgotPassword />, '/forgot-password');
  await requestOtp(user);
  expect(screen.getByRole('heading', { name: 'Xác thực mã OTP' })).toBeVisible();
  for (let seconds = 0; seconds < 60; seconds += 1) {
    await act(async () => { vi.advanceTimersByTime(1000); });
  }
  post.mockRejectedValueOnce(new NotFoundError(notFoundMessage));
  await user.click(screen.getByRole('button', { name: 'Gửi lại mã OTP' }));
  expect(screen.getByText(notFoundMessage)).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Xác thực mã OTP' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Đặt lại mật khẩu thành công!' })).not.toBeInTheDocument();
  expect(post).toHaveBeenCalledTimes(2);
  expect(post).toHaveBeenNthCalledWith(2, '/auth/forgot-password', { email }, { skipAuth: true });
});

it.each([400, 404])('OTP reset HTTP %s displays the API error without showing success', async (status) => {
  const user = setup();
  await reachReset(user);
  const message = status === 400 ? 'Mã xác thực hoặc liên kết không hợp lệ, hoặc đã hết hạn.' : 'Tài khoản không tồn tại.';
  post.mockRejectedValueOnce(status === 400 ? new ValidationError(message) : new NotFoundError(message));
  await user.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));
  expect(await screen.findByText(message)).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Đặt lại mật khẩu' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Đặt lại mật khẩu thành công!' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cập nhật mật khẩu' })).toBeEnabled();
  expect(post).toHaveBeenLastCalledWith('/auth/reset-password', { email, otp, newPassword }, { skipAuth: true });
});

it('HTTP 200 request and OTP reset advance through the existing steps to success', async () => {
  const user = setup();
  await reachReset(user);
  post.mockResolvedValueOnce({ message: 'Đặt lại mật khẩu thành công.' });
  await user.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));
  expect(await screen.findByRole('heading', { name: 'Đặt lại mật khẩu thành công!' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Đặt lại mật khẩu' })).not.toBeInTheDocument();
  expect(post).toHaveBeenLastCalledWith('/auth/reset-password', { email, otp, newPassword }, { skipAuth: true });
});
