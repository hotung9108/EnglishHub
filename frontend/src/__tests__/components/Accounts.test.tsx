import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Accounts } from '../../pages/Accounts';
import { userService } from '../../api/services/user.service';
import type { UserListItem, UserListResponse } from '../../api/services/user.service';
import { renderPage } from './renderPage';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 99, email: 'admin@center.edu.vn', role: 'ADMIN', fullName: 'Super Admin' },
    isAuthenticated: true,
  }),
}));

const mockUsers: UserListItem[] = [
  {
    id: 1,
    fullName: 'Trần Văn Nam',
    email: 'nam.tran@example.com',
    role: 'STUDENT',
    status: 'ACTIVE',
  },
  {
    id: 2,
    fullName: 'Lê Thị Hoa',
    email: 'hoa.le@example.com',
    role: 'TEACHER',
    status: 'ACTIVE',
  },
];

const mockListResponse: UserListResponse = {
  data: mockUsers,
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
  },
};

describe('Accounts (FE-92 Admin Reset Password)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(userService, 'listUsers').mockResolvedValue(mockListResponse);
  });

  it('renders accounts list and reset password buttons for each account', async () => {
    renderPage(<Accounts />, '/admin/accounts');

    expect(await screen.findByText('Trần Văn Nam')).toBeInTheDocument();
    expect(screen.getByText('Lê Thị Hoa')).toBeInTheDocument();

    const resetButtons = screen.getAllByRole('button', { name: /Đặt lại mật khẩu/i });
    expect(resetButtons).toHaveLength(2);
  });

  it('opens confirmation modal when clicking reset password button', async () => {
    const user = userEvent.setup();
    renderPage(<Accounts />, '/admin/accounts');

    await screen.findByText('Trần Văn Nam');

    const resetButtons = screen.getAllByRole('button', { name: /Đặt lại mật khẩu/i });
    await user.click(resetButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Xác nhận đặt lại mật khẩu')).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "Trần Văn Nam"/i)
    ).toBeInTheDocument();
  });

  it('calls resetPassword API and displays temporary password modal on confirm', async () => {
    const user = userEvent.setup();
    const resetSpy = vi.spyOn(userService, 'resetPassword').mockResolvedValueOnce({
      message: 'Đặt lại mật khẩu thành công.',
      newPassword: 'TempPassword!456',
    });

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: writeTextMock,
      },
      writable: true,
      configurable: true,
    });

    renderPage(<Accounts />, '/admin/accounts');

    await screen.findByText('Trần Văn Nam');

    const resetButtons = screen.getAllByRole('button', { name: /Đặt lại mật khẩu/i });
    await user.click(resetButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /^Đặt lại mật khẩu$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(resetSpy).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText('Đặt lại mật khẩu thành công')).toBeInTheDocument();
    expect(screen.getByText('TempPassword!456')).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /Sao chép/i });
    await user.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('TempPassword!456');
    expect(await screen.findByText('Đã sao chép!')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Đã hiểu/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Đặt lại mật khẩu thành công')).not.toBeInTheDocument();
    });
  });

  it('handles reset password error gracefully', async () => {
    const user = userEvent.setup();
    vi.spyOn(userService, 'resetPassword').mockRejectedValueOnce(
      new Error('Tài khoản đã bị vô hiệu hóa hoặc không tồn tại.')
    );

    renderPage(<Accounts />, '/admin/accounts');

    await screen.findByText('Trần Văn Nam');

    const resetButtons = screen.getAllByRole('button', { name: /Đặt lại mật khẩu/i });
    await user.click(resetButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: /^Đặt lại mật khẩu$/i });
    await user.click(confirmBtn);

    expect(
      await screen.findByText('Tài khoản đã bị vô hiệu hóa hoặc không tồn tại.')
    ).toBeInTheDocument();
  });
});
