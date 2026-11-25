import { screen } from '@testing-library/react';
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
