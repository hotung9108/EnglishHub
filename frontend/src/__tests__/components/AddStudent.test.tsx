import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { classService } from '../../api/services/class.service';
import AddStudent from '../../pages/AddStudent';
import { renderPage } from './renderPage';

vi.mock('../../api/services/user.service', () => ({
  userService: { createUser: vi.fn() },
}));

vi.mock('../../api/services/class.service', () => ({
  classService: { list: vi.fn(), addMember: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(classService.list).mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 100, total: 0 },
  });
});

it('Issue #340: auto-generates student code STU2026xxxx and locks input to readOnly/disabled', async () => {
  renderPage(<AddStudent />, '/admin/students/add', undefined, undefined, 'vi');

  const codeInput = await screen.findByDisplayValue(/^STU2026\d{4}$/);
  expect(codeInput).toBeInTheDocument();
  expect(codeInput).toHaveAttribute('readonly');
  expect(codeInput).toBeDisabled();
});

it('Issue #377: validates email field on blur and blocks next step when email is empty', async () => {
  renderPage(<AddStudent />, '/admin/students/add', undefined, undefined, 'vi');

  const nameInput = await screen.findByPlaceholderText('Nguyễn Văn A...');
  const emailInput = screen.getByPlaceholderText('student@center.edu.vn');

  fireEvent.change(nameInput, { target: { value: 'Lê Văn Học Viên' } });

  // Focus and blur email without entering text
  fireEvent.focus(emailInput);
  fireEvent.blur(emailInput);

  expect(screen.getByText(/Vui lòng nhập địa chỉ email của học viên/i)).toBeInTheDocument();

  // Click next button
  const nextBtn = screen.getByRole('button', { name: /Tiếp theo: Ghi danh lớp học/i });
  fireEvent.click(nextBtn);

  // Still on step 1 with error
  expect(screen.getByText(/Vui lòng nhập địa chỉ email của học viên/i)).toBeInTheDocument();
});
