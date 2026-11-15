import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentAssignmentOverview from '../../pages/StudentAssignmentOverview';
import { assignmentService } from '../../api/services/assignment.service';
import { submissionService } from '../../api/services/submission.service';
import { renderPage } from './renderPage';

const { auth } = vi.hoisted(() => ({ auth: { user: { id: 5 } as { id: number } | null } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: {
    getAssignment: vi.fn(),
  },
}));

vi.mock('../../api/services/submission.service', async (original) => {
  const actual = await original<typeof import('../../api/services/submission.service')>();
  return {
    ...actual,
    submissionService: {
      ...actual.submissionService,
      listSubmissions: vi.fn(),
      getSubmission: vi.fn(),
      startAttempt: vi.fn(),
      submitSubmission: vi.fn(),
    },
  };
});

const mockAssignment = {
  id: 12,
  title: 'IELTS Comprehensive Test',
  status: 'PUBLISHED' as const,
  maxSubmissions: 3,
  closeAt: '2026-12-31T23:59:59Z',
  modules: [
    { id: 101, skill: 'READING' as const, orderIndex: 1 },
    { id: 102, skill: 'WRITING' as const, orderIndex: 2 },
  ],
};

const mockInProgressSub = {
  id: 201,
  assignmentId: 12,
  studentId: 5,
  attemptNumber: 1,
  status: 'IN_PROGRESS' as const,
  submittedAt: null,
  createdAt: '2026-11-15T08:00:00Z',
  modules: [
    { id: 301, moduleId: 101, skill: 'READING' as const, status: 'SUBMITTED' as const },
    { id: 302, moduleId: 102, skill: 'WRITING' as const, status: 'IN_PROGRESS' as const },
  ],
};

const mockAllCompletedSub = {
  id: 201,
  assignmentId: 12,
  studentId: 5,
  attemptNumber: 1,
  status: 'IN_PROGRESS' as const,
  submittedAt: null,
  createdAt: '2026-11-15T08:00:00Z',
  modules: [
    { id: 301, moduleId: 101, skill: 'READING' as const, status: 'SUBMITTED' as const },
    { id: 302, moduleId: 102, skill: 'WRITING' as const, status: 'SUBMITTED' as const },
  ],
};

describe('StudentAssignmentOverview - Pre-Submit Review Dashboard (UC020 & UC021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = { id: 5 };
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(mockAssignment);
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({
      data: [mockInProgressSub],
      pagination: { page: 1, limit: 20, total: 1 },
    });
    vi.mocked(submissionService.submitSubmission).mockResolvedValue({
      message: 'Submitted successfully',
      status: 'SUBMITTED',
      submittedAt: '2026-11-15T09:00:00Z',
    });
  });

  it('renders Pre-Submit Review Dashboard (UC020) when there is an active in-progress attempt', async () => {
    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    expect(await screen.findByText('Kiểm tra và xem lại bài làm trước khi nộp (UC020)')).toBeVisible();
    expect(
      screen.getByText(
        'Rà soát danh sách câu trả lời của các kỹ năng. Bạn có thể nhấn "Sửa câu trả lời" để chỉnh sửa trước khi nộp chính thức.'
      )
    ).toBeVisible();
  });

  it('displays correct status badges: "Đã làm" for SUBMITTED module and "Chưa nộp" for IN_PROGRESS module', async () => {
    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    await screen.findByText('Kiểm tra và xem lại bài làm trước khi nộp (UC020)');

    expect(screen.getByText('Đã làm')).toBeVisible();
    expect(screen.getByText('Chưa nộp')).toBeVisible();

    expect(screen.getByText('Đã hoàn thành nội dung phần thi')).toBeVisible();
    expect(screen.getByText('Đang chờ làm bài / chưa hoàn tất')).toBeVisible();
  });

  it('displays warning banner when some modules are incomplete (!isAllSubModulesCompleted)', async () => {
    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    await screen.findByText('Kiểm tra và xem lại bài làm trước khi nộp (UC020)');

    expect(screen.getByText('Còn phần thi chưa hoàn thành')).toBeVisible();
    expect(
      screen.getByText(
        'Cảnh báo: Bạn vẫn còn phần thi chưa hoàn thành hoặc câu hỏi đang bị bỏ trống. Bạn có thể bấm "Làm bài ngay" hoặc "Sửa câu trả lời" để hoàn thiện trước khi nộp.'
      )
    ).toBeVisible();
  });

  it('displays success banner when all modules are completed', async () => {
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({
      data: [mockAllCompletedSub],
      pagination: { page: 1, limit: 20, total: 1 },
    });

    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    await screen.findByText('Kiểm tra và xem lại bài làm trước khi nộp (UC020)');

    expect(screen.getByText('Đã hoàn thành các phần thi')).toBeVisible();
    expect(
      screen.getByText(
        'Bạn đã hoàn thành câu trả lời cho tất cả các phần thi. Vui lòng rà soát lại lần cuối trước khi bấm "Xác nhận nộp toàn bộ bài tập" bên dưới.'
      )
    ).toBeVisible();
  });

  it('navigates back to the module to edit answers when clicking "Sửa câu trả lời"', async () => {
    const user = userEvent.setup();
    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    await screen.findByText('Kiểm tra và xem lại bài làm trước khi nộp (UC020)');

    const editBtn = screen.getByRole('button', { name: /Sửa câu trả lời/ });
    expect(editBtn).toBeVisible();

    await user.click(editBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/student/assignments/reading/12');
    });
  });

  it('opens ConfirmModal (UC021 / AD21) when clicking "Xác nhận Nộp toàn bộ bài tập"', async () => {
    const user = userEvent.setup();
    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    await screen.findByText('Kiểm tra và xem lại bài làm trước khi nộp (UC020)');

    const submitCtaBtn = screen.getByRole('button', {
      name: /Xác nhận Nộp toàn bộ bài tập \(Lần 1\)/,
    });
    expect(submitCtaBtn).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(submitCtaBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeVisible();
    expect(screen.getByText('Xác nhận nộp bài tập')).toBeVisible();
    expect(
      screen.getByText(
        'Bạn có chắc chắn muốn nộp toàn bộ bài tập? Sau khi xác nhận nộp, bạn sẽ không thể chỉnh sửa lại các câu trả lời. Hệ thống sẽ tiến hành đóng gói câu trả lời và bắt đầu quy trình đánh giá.'
      )
    ).toBeVisible();

    const cancelBtn = screen.getByRole('button', { name: /Kiểm tra lại/ });
    await user.click(cancelBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('calls submissionService.submitSubmission and navigates to submission result upon modal confirmation', async () => {
    const user = userEvent.setup();
    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    await screen.findByText('Kiểm tra và xem lại bài làm trước khi nộp (UC020)');

    const submitCtaBtn = screen.getByRole('button', {
      name: /Xác nhận Nộp toàn bộ bài tập \(Lần 1\)/,
    });
    await user.click(submitCtaBtn);

    const confirmBtn = await screen.findByRole('button', { name: /Xác nhận nộp bài/ });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(submissionService.submitSubmission).toHaveBeenCalledWith(201);
    });

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/student/submissions/201');
    });
  });

  it('renders ExamStepper overview variant with step indicators and accessibility', async () => {
    renderPage(<StudentAssignmentOverview />, '/student/assignments/:id', '/student/assignments/12');

    await screen.findByText('Tiến trình các phần thi (2 kỹ năng)');

    expect(
      screen.getByText('Học viên hoàn thành lần lượt từng kỹ năng theo thứ tự trước khi nộp toàn bộ bài tập')
    ).toBeVisible();
  });
});
