import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiClientError, ConflictError } from '../../api/core/errors';
import { classService } from '../../api/services/class.service';
import { userService } from '../../api/services/user.service';
import { AddTeacher } from '../../pages/AddTeacher';
import { renderPage } from './renderPage';

vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn() } }));
vi.mock('../../api/services/user.service', () => ({ userService: { createUser: vi.fn() } }));

// Teacher and class identities are from local-dev/db-snapshot.
const teacher = { id: 4, fullName: 'Phạm Diệu Anh', email: 'pham.dieu.anh@gmail.com', role: 'TEACHER' } as const;
const assignedClass = { id: 1, name: 'IELTS Foundation K1', status: 'ACTIVE' } as const;
const labels = {
  vi: {
    next: 'Tiếp theo: Năng lực chuyên môn', toClass: 'Tiếp theo: Phân công lớp học', submit: 'Thêm giáo viên',
    invalid: 'Email không đúng định dạng.', duplicate: 'Email này đã tồn tại.', name: 'Họ và tên giảng viên',
  },
  en: {
    next: 'Next: Expertise', toClass: 'Next: Class Assignment', submit: 'Complete Registration',
    invalid: 'Enter a valid email address.', duplicate: 'This email address already exists.', name: 'Full Name',
  },
};

beforeEach(() => {
  vi.mocked(classService.list).mockResolvedValue({ data: [assignedClass], pagination: { page: 1, limit: 50, total: 1 } });
  vi.mocked(userService.createUser).mockResolvedValue({ message: 'Created', user: teacher });
});

async function fillFirstStep(language: 'vi' | 'en', email: string) {
  const page = renderPage(<AddTeacher />, '/admin/teachers/add', undefined, undefined, language);
  const nameInput = await screen.findByPlaceholderText('Nguyễn Văn A...');
  const emailInput = screen.getByLabelText(/Email/);
  fireEvent.change(nameInput, { target: { value: teacher.fullName } });
  fireEvent.change(emailInput, { target: { value: email } });
  return { ...page, nameInput, emailInput, copy: labels[language] };
}

function goToLastStep({ next, toClass }: typeof labels.vi) {
  fireEvent.click(screen.getByRole('button', { name: next }));
  fireEvent.click(screen.getByRole('button', { name: toClass }));
}

it.each(['vi', 'en'] as const)('báo sai định dạng tại ô Email khi bấm Tiếp và xóa lỗi khi sửa (%s)', async language => {
  const { emailInput, copy } = await fillFirstStep(language, 'missing-at-sign');
  expect(screen.getByText(new RegExp(copy.name), { selector: 'label' })).toHaveTextContent('*');
  expect(screen.getByText('Email *', { selector: 'label' })).toBeVisible();
  expect(emailInput).toBeRequired();
  const next = screen.getByRole('button', { name: copy.next });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(next);
  expect(emailInput).toHaveAccessibleDescription(copy.invalid);
  expect(emailInput).toHaveClass('adm-input-error');
  expect(emailInput).toHaveAttribute('aria-invalid', 'true');
  expect(next).toBeVisible();
  expect(userService.createUser).not.toHaveBeenCalled();
  fireEvent.change(emailInput, { target: { value: teacher.email } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  fireEvent.click(next);
  expect(screen.getByRole('button', { name: copy.toClass })).toBeVisible();
});

it.each(['vi', 'en'] as const)('quay về bước 1 khi API trả 409, giữ dữ liệu và cho sửa email (%s)', async language => {
  vi.mocked(userService.createUser).mockRejectedValueOnce(new ConflictError('Existing email'));
  const { copy } = await fillFirstStep(language, teacher.email);
  goToLastStep(copy);
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: copy.submit }));

  const email = await screen.findByLabelText(/Email/);
  expect(email).toHaveValue(teacher.email);
  expect(email).toHaveAccessibleDescription(copy.duplicate);
  expect(screen.getByPlaceholderText('Nguyễn Văn A...')).toHaveValue(teacher.fullName);
  expect(userService.createUser).toHaveBeenCalledOnce();
  expect(userService.createUser).toHaveBeenLastCalledWith(expect.objectContaining({ email: teacher.email, role: 'TEACHER' }));
  expect(userService.createUser).not.toHaveBeenCalledWith(expect.objectContaining({ assignedClassId: '1' }));
  expect(document.querySelector('.adm-alert-banner')).not.toBeInTheDocument();

  const replacement = 'teacher-sample@example.invalid';
  fireEvent.change(email, { target: { value: replacement } });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  goToLastStep(copy);
  expect(screen.getByRole('combobox')).toHaveValue('1');
  fireEvent.click(screen.getByRole('button', { name: copy.submit }));
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/admin/teachers'));
  expect(userService.createUser).toHaveBeenLastCalledWith(expect.objectContaining({ email: replacement }));
});

it.each([
  ['vi', new ApiClientError('Máy chủ đang bận', 503), 'Máy chủ đang bận'],
  ['vi', undefined, 'Không thể tạo tài khoản giảng viên.'],
  ['en', undefined, 'Failed to create teacher.'],
] as const)('giữ lỗi API khác trên banner ở bước hiện tại (%s, %s)', async (language, failure, message) => {
  vi.mocked(userService.createUser).mockRejectedValueOnce(failure);
  const { copy } = await fillFirstStep(language, teacher.email);
  goToLastStep(copy);
  fireEvent.click(screen.getByRole('button', { name: copy.submit }));
  expect(await screen.findByText(message)).toBeVisible();
  expect(document.querySelector('.adm-alert-banner')).toHaveTextContent(message);
  expect(screen.getByRole('button', { name: copy.submit })).toBeVisible();
  expect(screen.queryByLabelText(/Email/)).not.toBeInTheDocument();
});
