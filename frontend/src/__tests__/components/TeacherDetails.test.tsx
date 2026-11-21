import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherDetails } from '../../pages/TeacherDetails';
import { userService, type UserProfile } from '../../api/services/user.service';
import { classService, type ClassSummary, type ClassDetail } from '../../api/services/class.service';
import { renderPage } from './renderPage';

vi.mock('../../api/services/user.service', () => ({
  userService: {
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('../../api/services/class.service', () => ({
  classService: {
    list: vi.fn(),
    getDetail: vi.fn(),
  },
}));

const mockTeacherProfile: UserProfile = {
  id: 10,
  fullName: 'Đặng Thùy Trang',
  email: 'trang.dang@englishhub.com',
  role: 'TEACHER',
  status: 'ACTIVE',
  specialization: 'IELTS 8.0 & Reading Specialist',
};

const mockLockedTeacherProfile: UserProfile = {
  id: 11,
  fullName: 'Phạm Hữu Long',
  email: 'long.pham@englishhub.com',
  role: 'TEACHER',
  status: 'LOCKED',
  specialization: 'Speaking Coach',
};

const mockClasses: ClassSummary[] = [
  { id: 101, name: 'Lớp IELTS 01', teacherId: 10, status: 'ACTIVE' },
];

const mockDetail: ClassDetail = {
  id: 101,
  name: 'Lớp IELTS 01',
  status: 'ACTIVE',
  description: 'Thứ 2-4-6',
  memberCount: 15,
};

describe('TeacherDetails page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders teacher details with real specialization and active status', async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(mockTeacherProfile);
    vi.mocked(classService.list).mockResolvedValue({
      data: mockClasses,
      pagination: { page: 1, limit: 100, total: 1 },
    });
    vi.mocked(classService.getDetail).mockResolvedValue(mockDetail);

    renderPage(<TeacherDetails />, '/admin/teachers/:id', '/admin/teachers/10');

    expect(screen.getByText('Đang tải thông tin giảng viên...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Đặng Thùy Trang')).toBeInTheDocument();
      expect(screen.getByText('GV-010')).toBeInTheDocument();
      expect(screen.getByText('trang.dang@englishhub.com')).toBeInTheDocument();
    });

    // Specialization should match API data
    expect(screen.getAllByText('IELTS 8.0 & Reading Specialist').length).toBeGreaterThanOrEqual(1);
    // Status should be Active
    expect(screen.getByText('Đang hoạt động')).toHaveClass('badge-active');
  });

  it('renders locked status badge when teacher status is LOCKED', async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(mockLockedTeacherProfile);
    vi.mocked(classService.list).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0 },
    });

    renderPage(<TeacherDetails />, '/admin/teachers/:id', '/admin/teachers/11');

    await waitFor(() => {
      expect(screen.getByText('Phạm Hữu Long')).toBeInTheDocument();
    });

    expect(screen.getByText('Đã khóa')).toHaveClass('badge-blocked');
  });

  it('allows Admin to update teacher specialization via modal', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getUserById).mockResolvedValue({ ...mockTeacherProfile });
    vi.mocked(classService.list).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0 },
    });
    vi.mocked(userService.updateUser).mockResolvedValue({ message: 'Success' });

    renderPage(<TeacherDetails />, '/admin/teachers/:id', '/admin/teachers/10');

    await waitFor(() => {
      expect(screen.getByText('Đặng Thùy Trang')).toBeInTheDocument();
    });

    // Click Edit Specialization button in hero
    const editBtn = screen.getByRole('button', { name: /Sửa chuyên môn/i });
    await user.click(editBtn);

    // Modal dialog opens
    expect(screen.getByText('Cập Nhật Chuyên Môn Giảng Viên')).toBeInTheDocument();

    // Type new specialization
    const specInput = screen.getByPlaceholderText('VD: IELTS 8.0+, TESOL Certified, Writing Specialist...');
    await user.clear(specInput);
    await user.type(specInput, 'TESOL Certified & Senior Academic Lead');

    // Click Save Changes
    const saveBtn = screen.getByRole('button', { name: /Lưu thay đổi/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(userService.updateUser).toHaveBeenCalledWith(10, {
        specialization: 'TESOL Certified & Senior Academic Lead',
      });
      expect(screen.queryByText('Cập Nhật Chuyên Môn Giảng Viên')).not.toBeInTheDocument();
      expect(screen.getAllByText('TESOL Certified & Senior Academic Lead').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('allows Admin to toggle teacher suspend/lock status', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.getUserById).mockResolvedValue({ ...mockTeacherProfile });
    vi.mocked(classService.list).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0 },
    });
    vi.mocked(userService.updateStatus).mockResolvedValue({ ...mockTeacherProfile, status: 'LOCKED' });

    renderPage(<TeacherDetails />, '/admin/teachers/:id', '/admin/teachers/10');

    await waitFor(() => {
      expect(screen.getByText('Đặng Thùy Trang')).toBeInTheDocument();
    });

    // Click Suspend button
    const suspendBtn = screen.getByRole('button', { name: /Khóa tài khoản/i });
    await user.click(suspendBtn);

    // Confirm modal opens
    expect(screen.getByText('Xác nhận khóa tài khoản giảng viên')).toBeInTheDocument();

    // Click confirm in modal
    const confirmButtons = screen.getAllByRole('button', { name: 'Khóa tài khoản' });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(userService.updateStatus).toHaveBeenCalledWith(10, 'LOCKED');
      expect(screen.getByText('Đã khóa')).toHaveClass('badge-blocked');
    });
  });

  it('renders error banner when loading fails', async () => {
    vi.mocked(userService.getUserById).mockRejectedValue(new Error('Teacher not found'));
    vi.mocked(classService.list).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0 },
    });

    renderPage(<TeacherDetails />, '/admin/teachers/:id', '/admin/teachers/999');

    await waitFor(() => {
      expect(screen.getByText('Teacher not found')).toBeInTheDocument();
    });
  });
});
