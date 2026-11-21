import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Teachers } from '../../pages/Teachers';
import { userService } from '../../api/services/user.service';
import { classService, type ClassSummary } from '../../api/services/class.service';
import { renderPage } from './renderPage';

vi.mock('../../api/services/user.service', () => ({
  userService: {
    listUsers: vi.fn(),
  },
}));

vi.mock('../../api/services/class.service', () => ({
  classService: {
    list: vi.fn(),
  },
}));

const mockTeachersList = [
  {
    id: 1,
    fullName: 'Hoàng Minh Tuấn',
    email: 'tuan.hoang@englishhub.com',
    role: 'TEACHER' as const,
    status: 'ACTIVE' as const,
    specialization: 'IELTS 8.5 & Writing Specialist',
  },
  {
    id: 2,
    fullName: 'Nguyễn Bích Phương',
    email: 'phuong.nguyen@englishhub.com',
    role: 'TEACHER' as const,
    status: 'LOCKED' as const,
    specialization: 'TESOL Certified & Speaking Coach',
  },
  {
    id: 3,
    fullName: 'Trần Văn Cường',
    email: 'cuong.tran@englishhub.com',
    role: 'TEACHER' as const,
    status: 'INACTIVE' as const,
    specialization: '',
  },
];

const mockClassesList: ClassSummary[] = [
  {
    id: 10,
    name: 'IELTS Intensive 01',
    teacherId: 1,
    status: 'ACTIVE',
  },
  {
    id: 11,
    name: 'Speaking Master 02',
    teacherId: 2,
    status: 'ACTIVE',
  },
];

describe('Teachers page', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders teachers list with real specialization data and correct status badges', async () => {
    vi.mocked(userService.listUsers).mockResolvedValue({
      data: mockTeachersList,
      pagination: { page: 1, limit: 100, total: 3 },
    });
    vi.mocked(classService.list).mockResolvedValue({
      data: mockClassesList,
      pagination: { page: 1, limit: 100, total: 2 },
    });

    renderPage(<Teachers />, '/admin/teachers');

    expect(screen.getByText('Đang tải danh sách giảng viên...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hoàng Minh Tuấn')).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Bích Phương')).toBeInTheDocument();
      expect(screen.getByText('Trần Văn Cường')).toBeInTheDocument();
    });

    // Verify real specializations are rendered
    expect(screen.getByText('IELTS 8.5 & Writing Specialist')).toBeInTheDocument();
    expect(screen.getByText('TESOL Certified & Speaking Coach')).toBeInTheDocument();
    expect(screen.getByText('Chưa cập nhật')).toBeInTheDocument();

    // Verify status badges
    expect(screen.getByText('Đang hoạt động')).toHaveClass('badge-active');
    expect(screen.getByText('Đã khóa')).toHaveClass('badge-blocked');
    expect(screen.getByText('Nghỉ phép')).toHaveClass('badge-onleave');
  });

  it('filters teachers by specialization when clicking expertise pill', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.listUsers).mockResolvedValue({
      data: mockTeachersList,
      pagination: { page: 1, limit: 100, total: 3 },
    });
    vi.mocked(classService.list).mockResolvedValue({
      data: mockClassesList,
      pagination: { page: 1, limit: 100, total: 2 },
    });

    renderPage(<Teachers />, '/admin/teachers');

    await waitFor(() => {
      expect(screen.getByText('Hoàng Minh Tuấn')).toBeInTheDocument();
    });

    // Click TESOL filter
    const tesolBtn = screen.getByRole('button', { name: 'TESOL' });
    await user.click(tesolBtn);

    expect(screen.getByText('Nguyễn Bích Phương')).toBeInTheDocument();
    expect(screen.queryByText('Hoàng Minh Tuấn')).not.toBeInTheDocument();
    expect(screen.queryByText('Trần Văn Cường')).not.toBeInTheDocument();
  });

  it('filters teachers by search query matching specialization or name', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.listUsers).mockResolvedValue({
      data: mockTeachersList,
      pagination: { page: 1, limit: 100, total: 3 },
    });
    vi.mocked(classService.list).mockResolvedValue({
      data: mockClassesList,
      pagination: { page: 1, limit: 100, total: 2 },
    });

    renderPage(<Teachers />, '/admin/teachers');

    await waitFor(() => {
      expect(screen.getByText('Hoàng Minh Tuấn')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Tìm tên giáo viên, mã GV, email...');
    await user.type(searchInput, 'Writing');

    expect(screen.getByText('Hoàng Minh Tuấn')).toBeInTheDocument();
    expect(screen.queryByText('Nguyễn Bích Phương')).not.toBeInTheDocument();
  });

  it('renders error state when user service fails', async () => {
    vi.mocked(userService.listUsers).mockRejectedValue(new Error('Network error'));
    vi.mocked(classService.list).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0 },
    });

    renderPage(<Teachers />, '/admin/teachers');

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('navigates to create teacher on Add button click', async () => {
    const user = userEvent.setup();
    vi.mocked(userService.listUsers).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0 },
    });
    vi.mocked(classService.list).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0 },
    });

    renderPage(<Teachers />, '/admin/teachers');

    await waitFor(() => {
      expect(screen.getByText('Chưa có giảng viên nào trong cơ sở dữ liệu.')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /Thêm giáo viên/i });
    await user.click(addButtons[0]);

    expect(screen.getByTestId('location')).toHaveTextContent('/admin/teachers/create');
  });
});
