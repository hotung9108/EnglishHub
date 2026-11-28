import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderPage } from './renderPage';
import { AddClass } from '../../pages/AddClass';
import ClassDetails from '../../pages/ClassDetails';
import { Classes } from '../../pages/Classes';
import { classService, type ClassDetail, type ClassListResponse } from '../../api/services/class.service';
import { userService } from '../../api/services/user.service';
import { assignmentService, type AssignmentListResponse } from '../../api/services/assignment.service';

vi.mock('../../api/services/class.service', () => ({
  classService: {
    create: vi.fn(),
    list: vi.fn(),
    getDetail: vi.fn(),
    listMembers: vi.fn(),
    update: vi.fn(),
    removeMember: vi.fn(),
  },
}));

vi.mock('../../api/services/user.service', () => ({
  userService: {
    listUsers: vi.fn(),
    getUserById: vi.fn(),
  },
}));

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: {
    listAssignments: vi.fn(),
  },
}));

const mockTeacher = {
  id: 4,
  fullName: 'Phạm Diệu Anh',
  email: 'pham.dieu.anh@gmail.com',
  role: 'TEACHER' as const,
  status: 'ACTIVE' as const,
};

const mockAssignments: AssignmentListResponse = {
  data: [],
  pagination: { page: 1, limit: 10, total: 0 },
};

describe('FE-110 [ISSUE #441] Class Code Persistence and API/UI Synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userService.listUsers).mockResolvedValue({
      data: [mockTeacher],
      pagination: { page: 1, limit: 50, total: 1 },
    });
    vi.mocked(classService.create).mockResolvedValue({ id: 99, message: 'Class created' });
    vi.mocked(classService.listMembers).mockResolvedValue([]);
    vi.mocked(assignmentService.listAssignments).mockResolvedValue(mockAssignments);
  });

  it('submits customized class code in create payload when user provides code in AddClass', async () => {
    renderPage(<AddClass />, '/admin/classes/add', undefined, undefined, 'vi');

    const nameInput = await screen.findByLabelText(/Tên lớp học đầy đủ/i);
    fireEvent.change(nameInput, { target: { value: 'Lớp Luyện Thi IELTS 7.0' } });

    const codeInput = screen.getByPlaceholderText('ENG-2026-XXXX');
    fireEvent.change(codeInput, { target: { value: 'ENG-CUSTOM-8888' } });

    // Step 1 -> Step 2
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo: Phân công giáo viên/i }));

    // Step 2 -> Step 3
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tiếp theo: Thêm học viên/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Tiếp theo: Thêm học viên/i }));

    // Step 3 -> Submit
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tạo lớp học/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Tạo lớp học/i }));

    await waitFor(() => {
      expect(classService.create).toHaveBeenCalledTimes(1);
      expect(classService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Lớp Luyện Thi IELTS 7.0',
          code: 'ENG-CUSTOM-8888',
          teacherId: 4,
        })
      );
    });
  });

  it('displays classDetail.code in ClassDetails header badge when code is provided', async () => {
    const mockDetail: ClassDetail = {
      id: 15,
      code: 'ENG-2026-5555',
      name: 'IELTS Intensive Evening',
      status: 'ACTIVE',
      level: 'INTERMEDIATE',
      description: 'Test description',
      startDate: '2026-03-01',
      endDate: '2026-06-01',
      teacher: { id: 4, fullName: 'Phạm Diệu Anh' },
      memberCount: 18,
    };
    vi.mocked(classService.getDetail).mockResolvedValue(mockDetail);

    renderPage(<ClassDetails />, '/admin/classes/:id', '/admin/classes/15', undefined, 'vi');

    await waitFor(() => {
      expect(screen.getAllByText('ENG-2026-5555').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('heading', { name: 'IELTS Intensive Evening' })).toBeInTheDocument();
    });
  });

  it('falls back to ENG-{id} in ClassDetails when classDetail.code is undefined', async () => {
    const mockDetailWithoutCode: ClassDetail = {
      id: 20,
      name: 'Legacy English Class',
      status: 'ACTIVE',
      level: 'BASIC',
      teacher: { id: 4, fullName: 'Phạm Diệu Anh' },
      memberCount: 10,
    };
    vi.mocked(classService.getDetail).mockResolvedValue(mockDetailWithoutCode);

    renderPage(<ClassDetails />, '/admin/classes/:id', '/admin/classes/20', undefined, 'vi');

    await waitFor(() => {
      expect(screen.getAllByText('ENG-20').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('heading', { name: 'Legacy English Class' })).toBeInTheDocument();
    });
  });

  it('renders class code in Classes table list', async () => {
    const mockClassList: ClassListResponse = {
      data: [
        {
          id: 1,
          code: 'ENG-2026-1111',
          name: 'TOEIC 650+ Express',
          status: 'ACTIVE',
          teacherId: 4,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1 },
    };
    vi.mocked(classService.list).mockResolvedValue(mockClassList);

    renderPage(<Classes />, '/admin/classes', undefined, undefined, 'vi');

    await waitFor(() => {
      expect(screen.getByText('ENG-2026-1111')).toBeInTheDocument();
      expect(screen.getByText('TOEIC 650+ Express')).toBeInTheDocument();
    });
  });
});
