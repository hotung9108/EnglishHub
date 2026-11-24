import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { classService } from '../../api/services/class.service';
import { userService, type UserListItem, type UserListResponse } from '../../api/services/user.service';
import { AddClass } from '../../pages/AddClass';
import { deferred } from '../deferred';
import { renderPage } from './renderPage';

vi.mock('../../api/services/class.service', () => ({ classService: { create: vi.fn() } }));
vi.mock('../../api/services/user.service', () => ({ userService: { listUsers: vi.fn(), getUserById: vi.fn() } }));

// Class and teacher identities are from local-dev/db-snapshot.
const className = 'IELTS Foundation K1';
const teacher: UserListItem = {
  id: 4, fullName: 'Phạm Diệu Anh', email: 'pham.dieu.anh@gmail.com', role: 'TEACHER', status: 'ACTIVE',
};

beforeEach(() => {
  vi.mocked(userService.listUsers).mockResolvedValue({ data: [teacher], pagination: { page: 1, limit: 50, total: 1 } });
  vi.mocked(classService.create).mockResolvedValue({ id: 1, message: 'Created' });
});

it.each([
  ['vi', 'Tên lớp học đầy đủ', 'Ngày bắt đầu', 'Tiếp theo: Phân công giáo viên', 'Vui lòng nhập tên lớp học.'],
  ['en', 'Full Class Title', 'Start Date', 'Next: Assign Teacher', 'Please enter class name.'],
] as const)('khóa Tiếp và báo lỗi tên lớp ngay khi rời ô (%s)', async (language, nameLabel, dateLabel, nextLabel, error) => {
  renderPage(<AddClass />, '/admin/classes/add', undefined, undefined, language);
  const name = await screen.findByLabelText(new RegExp(nameLabel));
  expect(name).toBeRequired();
  expect(document.querySelector('label[for="class-name"]')).toHaveTextContent('*');
  expect(screen.getByText(new RegExp(dateLabel), { selector: 'label' })).toHaveTextContent('*');
  fireEvent.change(name, { target: { value: '   ' } });
  const next = screen.getByRole('button', { name: nextLabel });
  expect(next).toBeDisabled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.blur(name);
  expect(name).toHaveAccessibleDescription(error);
  expect(name).toHaveClass('adm-input-error');
  fireEvent.click(next);
  expect(classService.create).not.toHaveBeenCalled();
  fireEvent.change(name, { target: { value: className } });
  fireEvent.blur(name);
  expect(name).toHaveAttribute('aria-invalid', 'false');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(next).toBeEnabled();
});

it.each([
  ['vi', 'Tên lớp học đầy đủ', 'Tiếp theo: Phân công giáo viên', 'Giáo viên phụ trách chính', 'Thời khóa biểu', 'Bỏ chọn giáo viên', 'Tiếp theo: Thêm học viên', 'Vui lòng chọn giáo viên phụ trách.', /Tìm và chọn Giảng viên/, 'Tạo lớp học'],
  ['en', 'Full Class Title', 'Next: Assign Teacher', 'Primary Instructor', 'Class Schedule', 'Clear selection', 'Next: Add Students', 'Please select an instructor.', /Search & Select Instructor/, 'Create Class'],
] as const)('bắt buộc chọn giáo viên, giữ lịch tùy chọn và gửi tên đã trim (%s)', async (
  language, nameLabel, next1, instructor, schedule, clear, next2, error, select, create,
) => {
  const view = renderPage(<AddClass />, '/admin/classes/add', undefined, undefined, language);
  const name = await screen.findByLabelText(new RegExp(nameLabel));
  fireEvent.change(name, { target: { value: `  ${className}  ` } });
  fireEvent.click(screen.getByRole('button', { name: next1 }));

  const group = screen.getByRole('group', { name: new RegExp(instructor) });
  expect(within(group).getByText(new RegExp(instructor), { selector: 'label' })).toHaveTextContent('*');
  expect(screen.getByText(schedule, { selector: 'label' })).toHaveTextContent(new RegExp(`^${schedule}$`));
  expect(await within(group).findByText(teacher.fullName)).toBeVisible();
  fireEvent.click(within(group).getByTitle(clear));
  fireEvent.click(screen.getByRole('button', { name: next2 }));
  expect(within(group).getByRole('alert')).toHaveTextContent(error);
  expect(group).toHaveAccessibleDescription(error);
  expect(screen.queryByRole('button', { name: create })).not.toBeInTheDocument();
  fireEvent.submit(view.container.querySelector('form')!);
  expect(classService.create).not.toHaveBeenCalled();

  fireEvent.click(within(group).getByRole('button', { name: select }));
  fireEvent.click(within(group).getByText(teacher.fullName));
  expect(within(group).queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: next2 }));
  fireEvent.click(screen.getByRole('button', { name: create }));
  expect(classService.create).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: className, teacherId: teacher.id }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/classes'));
});

it('giữ lỗi tên lớp inline nếu form được gửi với tên chỉ có khoảng trắng', async () => {
  const view = renderPage(<AddClass />, '/admin/classes/add');
  const name = await screen.findByLabelText(/Tên lớp học đầy đủ/);
  fireEvent.change(name, { target: { value: '    ' } });
  fireEvent.submit(view.container.querySelector('form')!);
  expect(name).toHaveAccessibleDescription('Vui lòng nhập tên lớp học.');
  expect(classService.create).not.toHaveBeenCalled();
});

it('xóa lỗi thiếu giáo viên khi danh sách đến muộn và tự chọn giáo viên đầu tiên', async () => {
  const teachers = deferred<UserListResponse>();
  vi.mocked(userService.listUsers).mockReturnValueOnce(teachers.promise);
  renderPage(<AddClass />, '/admin/classes/add');
  fireEvent.change(screen.getByLabelText(/Tên lớp học đầy đủ/), { target: { value: className } });
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo: Phân công giáo viên' }));
  const group = screen.getByRole('group', { name: /Giáo viên phụ trách chính/ });
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo: Thêm học viên' }));
  expect(within(group).getByRole('alert')).toHaveTextContent('Vui lòng chọn giáo viên phụ trách.');
  await act(async () => teachers.resolve({ data: [teacher], pagination: { page: 1, limit: 50, total: 1 } }));
  expect(within(group).queryByRole('alert')).not.toBeInTheDocument();
  expect(within(group).getByText(teacher.fullName)).toBeVisible();
});
