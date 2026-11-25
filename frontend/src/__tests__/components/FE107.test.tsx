import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from '../../pages/Profile';
import { Accounts } from '../../pages/Accounts';
import StudentClasses from '../../pages/StudentClasses';
import TeacherClasses from '../../pages/TeacherClasses';
import { userService } from '../../api/services/user.service';
import { classService } from '../../api/services/class.service';
import { submissionService } from '../../api/services/submission.service';
import { renderPage } from './renderPage';

vi.mock('../../api/services/user.service', () => ({
  userService: {
    getMyProfile: vi.fn(),
    updateMyProfile: vi.fn(),
    changePassword: vi.fn(),
    listUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    updateStatus: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock('../../api/services/class.service', () => ({
  classService: {
    list: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: {
    listAssignments: vi.fn(),
  },
}));

vi.mock('../../api/services/submission.service', () => ({
  submissionService: {
    listSubmissions: vi.fn(),
    isSubmissionGraded: vi.fn().mockReturnValue(false),
    getSubmissionFinalScore: vi.fn().mockReturnValue(null),
  },
  isSubmissionGraded: vi.fn().mockReturnValue(false),
  getSubmissionFinalScore: vi.fn().mockReturnValue(null),
}));

const mockAuthUser = { id: 1, email: 'admin@eh.com', fullName: 'Admin User', role: 'ADMIN' };

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    updateUser: vi.fn(),
  }),
}));

describe('FE-107 Validation, EmptyStates & Password Match Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #406: Profile Password Match Guard', () => {
    it('blocks updating password and shows error if new password equals current password', async () => {
      vi.mocked(userService.getMyProfile).mockResolvedValueOnce({
        id: 1,
        fullName: 'Test User',
        email: 'test@eh.com',
        role: 'STUDENT',
        status: 'ACTIVE',
      });

      renderPage(<Profile />, '/profile', '/profile?tab=security');

      // Wait for profile loading
      await waitFor(() => {
        expect(screen.getByText(/Đổi mật khẩu định kỳ/i)).toBeInTheDocument();
      });

      const currentPwInput = screen.getByLabelText(/Mật khẩu hiện tại/i);
      const newPwInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i);
      const confirmPwInput = screen.getByLabelText(/Xác nhận mật khẩu mới/i);

      fireEvent.change(currentPwInput, { target: { value: 'OldPassword123!' } });
      fireEvent.change(newPwInput, { target: { value: 'OldPassword123!' } });
      fireEvent.change(confirmPwInput, { target: { value: 'OldPassword123!' } });

      const submitBtn = screen.getByRole('button', { name: /Cập nhật mật khẩu/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Mật khẩu mới không được trùng với mật khẩu hiện tại/i)
        ).toBeInTheDocument();
      });

      expect(userService.changePassword).not.toHaveBeenCalled();
    });
  });

  describe('Issue #377: Accounts Email Field Error on Empty Submit', () => {
    it('displays error message in red when email is left empty in create account drawer', async () => {
      vi.mocked(userService.listUsers).mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      renderPage(<Accounts />, '/admin/accounts');

      // Click add account button
      const addBtn = screen.getByRole('button', { name: /Thêm tài khoản/i });
      fireEvent.click(addBtn);

      // Fill in Name but leave Email empty
      const nameInput = screen.getByPlaceholderText(/Nguyễn Văn A/i);
      fireEvent.change(nameInput, { target: { value: 'Nguyễn Văn B' } });

      const form = nameInput.closest('form');
      expect(form).not.toBeNull();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByText(/Vui lòng nhập địa chỉ email/i)).toBeInTheDocument();
      });

      expect(userService.createUser).not.toHaveBeenCalled();
    });
  });

  describe('Issue #368: StudentClasses EmptyState Friendly Message', () => {
    it('shows contact Admin message when student is not enrolled in any classes', async () => {
      vi.mocked(classService.list).mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });
      vi.mocked(submissionService.listSubmissions).mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      renderPage(<StudentClasses />, '/student/classes');

      await waitFor(() => {
        expect(
          screen.getByText(/Vui lòng liên hệ Quản trị viên để được phân lớp/i)
        ).toBeInTheDocument();
      });
    });

    it('shows contact Admin message when teacher is not assigned to any classes', async () => {
      vi.mocked(classService.list).mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      renderPage(<TeacherClasses />, '/teacher/classes');

      await waitFor(() => {
        expect(
          screen.getByText(/Vui lòng liên hệ Quản trị viên để được xếp lớp giảng dạy/i)
        ).toBeInTheDocument();
      });
    });
  });
});
