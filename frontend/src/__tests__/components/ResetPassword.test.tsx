import { beforeEach, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPassword from '../../pages/ResetPassword';
import { httpClient } from '../../api/core/client';
import { NotFoundError, ValidationError } from '../../api/core/errors';
import { renderPage } from './renderPage';

const email = 'ngo.thi.phuong@gmail.com'; // local-dev/db-snapshot/users.csv
const linkToken = 'reset-token-xyz'; // Existing API-test link fixture.
const newPassword = 'BrandNewPassword123!';
const successHeading = 'Mật khẩu đã được thay đổi!';
let post: MockInstance<typeof httpClient.post>;
beforeEach(() => {
  post = vi.spyOn(httpClient, 'post').mockResolvedValue({ message: 'Đặt lại mật khẩu thành công.' });
});

async function submit(query = `email=${encodeURIComponent(email)}&token=${linkToken}`) {
  renderPage(<ResetPassword />, '/reset-password', `/reset-password?${query}`);
  const user = userEvent.setup();
  const passwords = screen.getAllByPlaceholderText('••••••••');
  await user.type(passwords[0], newPassword);
  await user.type(passwords[1], newPassword);
  await user.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu mới' }));
}
function expectRejected(message: string) {
  expect(screen.getByText(message)).toBeVisible();
  expect(screen.queryByRole('heading', { name: successHeading })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cập nhật mật khẩu mới' })).toBeEnabled();
  expect(screen.getByTestId('location')).toHaveTextContent('/reset-password');
}

it.each([400, 404])('link reset HTTP %s displays the API error without showing success', async (status) => {
  const message = status === 400 ? 'Mã xác thực hoặc liên kết không hợp lệ, hoặc đã hết hạn.' : 'Tài khoản không tồn tại.';
  post.mockRejectedValueOnce(status === 400 ? new ValidationError(message) : new NotFoundError(message));
  await submit();
  await screen.findByText(message);
  expectRejected(message);
  expect(post).toHaveBeenCalledExactlyOnceWith('/auth/reset-password',
    { email, token: linkToken, newPassword }, { skipAuth: true });
});

it('link reset HTTP 200 displays the existing success screen', async () => {
  await submit();
  expect(await screen.findByRole('heading', { name: successHeading })).toBeVisible();
  expect(screen.queryByPlaceholderText('••••••••')).not.toBeInTheDocument();
  expect(post).toHaveBeenCalledExactlyOnceWith('/auth/reset-password',
    { email, token: linkToken, newPassword }, { skipAuth: true });
});

it.each([
  { name: 'missing token parameter', suffix: '' },
  { name: 'empty token parameter', suffix: '&token=' },
])('$name sends the current empty-token payload and displays HTTP 400', async ({ suffix }) => {
  const message = 'Vui lòng cung cấp mã OTP hoặc liên kết đặt lại mật khẩu.';
  post.mockRejectedValueOnce(new ValidationError(message));
  await submit(`email=${encodeURIComponent(email)}${suffix}`);
  await screen.findByText(message);
  expectRejected(message);
  expect(post).toHaveBeenCalledExactlyOnceWith('/auth/reset-password',
    { email, token: '', newPassword }, { skipAuth: true });
});
