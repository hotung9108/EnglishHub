import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderPage } from './renderPage';
import { StudentDetails } from '../../pages/StudentDetails';
import { TeacherDetails } from '../../pages/TeacherDetails';
import { Teachers } from '../../pages/Teachers';
import { AdminUserProfileDrawer } from '../../components/admin/AdminUserProfileDrawer';
import { userService } from '../../api/services/user.service';
import { reportService } from '../../api/services/report.service';

vi.mock('../../api/services/user.service', () => ({
  userService: {
    getAdminUserDetail: vi.fn(),
    listUsers: vi.fn(),
    updateUserStatus: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

vi.mock('../../api/services/report.service', () => ({
  reportService: {
    getStudentProgress: vi.fn(),
  },
}));

describe('FE-111 [ISSUE #440] Admin Locked User Status Badge Standardization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Bị khóa" badge on StudentDetails when student status is LOCKED (Vietnamese)', async () => {
    vi.mocked(userService.getAdminUserDetail).mockResolvedValue({
      id: 101,
      fullName: 'Nguyễn Văn Học Viên',
      email: 'student.locked@test.com',
      role: 'STUDENT',
      status: 'LOCKED',
    });
    vi.mocked(reportService.getStudentProgress).mockResolvedValue({
      studentId: 101,
      studentName: 'Nguyễn Văn Học Viên',
      classId: 1,
      scoreTimeline: [],
      skillAverages: [],
    });

    renderPage(<StudentDetails />, '/admin/students/:id?', '/admin/students/101', undefined, 'vi');

    await waitFor(() => {
      const lockedBadges = screen.getAllByText('Bị khóa');
      expect(lockedBadges.length).toBeGreaterThanOrEqual(1);
      expect(lockedBadges[0]).toHaveClass('badge-blocked');
    });
    expect(screen.queryByText('Đã khóa')).not.toBeInTheDocument();
  });

  it('renders "Locked" badge on StudentDetails when student status is LOCKED (English)', async () => {
    vi.mocked(userService.getAdminUserDetail).mockResolvedValue({
      id: 102,
      fullName: 'Student Locked EN',
      email: 'student.locked.en@test.com',
      role: 'STUDENT',
      status: 'LOCKED',
    });
    vi.mocked(reportService.getStudentProgress).mockResolvedValue({
      studentId: 102,
      studentName: 'Student Locked EN',
      classId: 1,
      scoreTimeline: [],
      skillAverages: [],
    });

    renderPage(<StudentDetails />, '/admin/students/:id?', '/admin/students/102', undefined, 'en');

    await waitFor(() => {
      const lockedBadges = screen.getAllByText('Locked');
      expect(lockedBadges.length).toBeGreaterThanOrEqual(1);
      expect(lockedBadges[0]).toHaveClass('badge-blocked');
    });
  });

  it('renders "Bị khóa" badge on TeacherDetails when teacher status is LOCKED (Vietnamese)', async () => {
    vi.mocked(userService.getAdminUserDetail).mockResolvedValue({
      id: 201,
      fullName: 'Trần Thị Giảng Viên',
      email: 'teacher.locked@test.com',
      role: 'TEACHER',
      status: 'LOCKED',
      specialization: 'IELTS 8.0',
    });

    renderPage(<TeacherDetails />, '/admin/teachers/:id?', '/admin/teachers/201', undefined, 'vi');

    await waitFor(() => {
      const lockedBadges = screen.getAllByText('Bị khóa');
      expect(lockedBadges.length).toBeGreaterThanOrEqual(1);
      expect(lockedBadges[0]).toHaveClass('badge-blocked');
    });
    expect(screen.queryByText('Đã khóa')).not.toBeInTheDocument();
  });

  it('renders "Bị khóa" badge on Teachers list card when teacher status is LOCKED (Vietnamese)', async () => {
    vi.mocked(userService.listUsers).mockResolvedValue({
      data: [
        {
          id: 301,
          fullName: 'Lê Văn Khóa',
          email: 'locked.teacher@test.com',
          role: 'TEACHER',
          status: 'LOCKED',
        },
      ],
      pagination: { page: 1, limit: 10, total: 1 },
    });

    renderPage(<Teachers />, '/admin/teachers', undefined, undefined, 'vi');

    await waitFor(() => {
      const lockedBadges = screen.getAllByText('Bị khóa');
      expect(lockedBadges.length).toBeGreaterThanOrEqual(1);
      expect(lockedBadges[0]).toHaveClass('badge-blocked');
    });
    expect(screen.queryByText('Đã khóa')).not.toBeInTheDocument();
  });

  it('renders "Bị khóa" in AdminUserProfileDrawer when user snapshot status is LOCKED', () => {
    renderPage(
      <AdminUserProfileDrawer
        profile={{
          id: 401,
          fullName: 'Phạm Thị Khóa',
          email: 'drawer.locked@test.com',
          role: 'STUDENT',
          status: 'LOCKED',
        }}
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
      '/admin/students',
      undefined,
      undefined,
      'vi'
    );

    expect(screen.getByText('Bị khóa')).toBeInTheDocument();
    expect(screen.queryByText('Đã khóa')).not.toBeInTheDocument();
  });
});
