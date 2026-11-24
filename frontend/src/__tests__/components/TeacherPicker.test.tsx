import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeacherPicker } from '../../components/classes/TeacherPicker';
import { userService, type UserListItem } from '../../api/services/user.service';

vi.mock('../../api/services/user.service', () => ({
  userService: {
    listUsers: vi.fn(),
    getUserById: vi.fn(),
  },
}));

const mockTeachers: UserListItem[] = [
  { id: 101, fullName: 'Nguyễn Văn A', email: 'nva@example.com', role: 'TEACHER', status: 'ACTIVE' },
  { id: 102, fullName: 'Trần Thị B', email: 'ttb@example.com', role: 'TEACHER', status: 'ACTIVE' },
];

describe('TeacherPicker component', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders selected teacher display card when selectedTeacherId is provided', () => {
    const onSelect = vi.fn();
    render(
      <TeacherPicker
        teachers={mockTeachers}
        selectedTeacherId={101}
        onSelectTeacher={onSelect}
      />
    );

    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('GV-101')).toBeInTheDocument();
    expect(screen.getByText('nva@example.com')).toBeInTheDocument();
  });

  it('allows clearing the selected teacher via clear button', async () => {
    const onSelect = vi.fn();
    render(
      <TeacherPicker
        teachers={mockTeachers}
        selectedTeacherId={101}
        onSelectTeacher={onSelect}
      />
    );

    const clearBtn = screen.getByTitle('Bỏ chọn giáo viên');
    await userEvent.click(clearBtn);

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('renders dropdown trigger when no teacher is selected and opens dropdown on click', async () => {
    const onSelect = vi.fn();
    render(
      <TeacherPicker
        teachers={mockTeachers}
        selectedTeacherId=""
        onSelectTeacher={onSelect}
      />
    );

    const trigger = screen.getByText('-- Tìm và chọn Giảng viên phụ trách --');
    expect(trigger).toBeInTheDocument();

    await userEvent.click(trigger);

    expect(screen.getByPlaceholderText('Tìm theo tên, email hoặc mã GV...')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
  });

  it('selects a teacher when clicked in dropdown', async () => {
    const onSelect = vi.fn();
    render(
      <TeacherPicker
        teachers={mockTeachers}
        selectedTeacherId=""
        onSelectTeacher={onSelect}
      />
    );

    await userEvent.click(screen.getByText('-- Tìm và chọn Giảng viên phụ trách --'));
    await userEvent.click(screen.getByText('Trần Thị B'));

    expect(onSelect).toHaveBeenCalledWith(mockTeachers[1]);
  });

  it('fetches teachers from userService in self-managed mode when opened', async () => {
    vi.mocked(userService.listUsers).mockResolvedValue({
      data: mockTeachers,
      pagination: { page: 1, limit: 20, total: 2 },
    });

    const onSelect = vi.fn();
    render(
      <TeacherPicker
        selectedTeacherId=""
        onSelectTeacher={onSelect}
      />
    );

    await userEvent.click(screen.getByText('-- Tìm và chọn Giảng viên phụ trách --'));

    await waitFor(() => {
      expect(userService.listUsers).toHaveBeenCalledWith({
        role: 'TEACHER',
        q: undefined,
        page: 1,
        limit: 20,
      });
    });

    expect(await screen.findByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Hiển thị 2/2 giảng viên')).toBeInTheDocument();
  });

  it('supports pagination / load more when hasMore is true', async () => {
    vi.mocked(userService.listUsers)
      .mockResolvedValueOnce({
        data: [mockTeachers[0]],
        pagination: { page: 1, limit: 1, total: 2 },
      })
      .mockResolvedValueOnce({
        data: [mockTeachers[1]],
        pagination: { page: 2, limit: 1, total: 2 },
      });

    const onSelect = vi.fn();
    render(
      <TeacherPicker
        selectedTeacherId=""
        pageSize={1}
        onSelectTeacher={onSelect}
      />
    );

    await userEvent.click(screen.getByText('-- Tìm và chọn Giảng viên phụ trách --'));

    const loadMoreBtn = await screen.findByRole('button', { name: /Tải thêm giảng viên.../ });
    expect(loadMoreBtn).toBeInTheDocument();

    await userEvent.click(loadMoreBtn);

    await waitFor(() => {
      expect(userService.listUsers).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText('Trần Thị B')).toBeInTheDocument();
  });

  it('resolves selected teacher via getUserById if not in initial list', async () => {
    vi.mocked(userService.getUserById).mockResolvedValue(mockTeachers[0]);

    render(
      <TeacherPicker
        selectedTeacherId={101}
        onSelectTeacher={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(userService.getUserById).toHaveBeenCalledWith(101);
    });

    expect(await screen.findByText('Nguyễn Văn A')).toBeInTheDocument();
  });
});
