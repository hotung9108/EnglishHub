import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentAssignmentReading from '../../pages/StudentAssignmentReading';
import { assignmentService, type AssignmentDetail } from '../../api/services/assignment.service';
import { questionService, type QuestionListResponse } from '../../api/services/question.service';
import {
  submissionService,
  type SubmissionDetail,
  type SubmitModuleResponse,
} from '../../api/services/submission.service';
import { renderPage } from './renderPage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 41, email: 'student@center.edu.vn', role: 'STUDENT', fullName: 'Test Student' },
    isAuthenticated: true,
  }),
}));

const mockAssignment: Partial<AssignmentDetail> = {
  id: 10,
  title: 'Reading Test 1',
  status: 'PUBLISHED',
  modules: [
    { id: 13, skill: 'READING', taskType: 'QUIZ' },
  ],
};

const mockSubmission: Partial<SubmissionDetail> = {
  id: 100,
  assignmentId: 10,
  studentId: 41,
  attemptNumber: 1,
  status: 'IN_PROGRESS',
  createdAt: '2026-11-20T00:00:00Z',
  submittedAt: null,
  modules: [
    {
      id: 1182,
      moduleId: 13,
      skill: 'READING',
      taskType: 'QUIZ',
      status: 'IN_PROGRESS',
      grading: null,
    },
  ],
};

const mockQuestions = [
  {
    id: 53,
    content: 'What is the capital of France?',
    questionType: 'SHORT_ANSWER',
    score: 10,
    orderIndex: 1,
  },
];

describe('StudentAssignmentReading Confirmation (Issue #371 & UC021)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(assignmentService, 'getAssignment').mockResolvedValue(
      mockAssignment as unknown as AssignmentDetail
    );
    vi.spyOn(submissionService, 'getSubmission').mockResolvedValue(
      mockSubmission as unknown as SubmissionDetail
    );
    vi.spyOn(questionService, 'listQuestions').mockResolvedValue({
      questions: mockQuestions,
    } as unknown as QuestionListResponse);
    vi.spyOn(submissionService, 'submitModule').mockResolvedValue({
      id: 1182,
      submissionModuleId: 1182,
      status: 'SUBMITTED',
    } as unknown as SubmitModuleResponse);
    vi.spyOn(submissionService, 'submitSubmission').mockResolvedValue({
      id: 100,
      status: 'SUBMITTED',
      submittedAt: '2026-11-21T00:00:00Z',
    } as unknown as SubmissionDetail);
  });

  it('shows confirmation modal before final submit when all questions are answered', async () => {
    const user = userEvent.setup();
    renderPage(
      <StudentAssignmentReading />,
      '/student/assignments/reading/:id',
      '/student/assignments/reading/10?submissionId=100'
    );

    const input = await screen.findByRole('textbox');
    await user.type(input, 'Paris');

    const submitBtn = screen.getByRole('button', { name: /Hoàn thành & Nộp phần Đọc/i });
    await user.click(submitBtn);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Xác nhận nộp bài')).toBeInTheDocument();
    expect(
      screen.getByText(/Bạn có chắc chắn muốn nộp bài\? Sau khi nộp, bạn sẽ không thể chỉnh sửa câu trả lời của mình\./i)
    ).toBeInTheDocument();

    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('cancels submission and keeps answers intact when student clicks "Hủy" (DO_014)', async () => {
    const user = userEvent.setup();
    renderPage(
      <StudentAssignmentReading />,
      '/student/assignments/reading/:id',
      '/student/assignments/reading/10?submissionId=100'
    );

    const input = await screen.findByRole('textbox');
    await user.type(input, 'apple');

    const submitBtn = screen.getByRole('button', { name: /Hoàn thành & Nộp phần Đọc/i });
    await user.click(submitBtn);

    const cancelBtn = await screen.findByRole('button', { name: /^Hủy$/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    expect(input).toHaveValue('apple');
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('submits module and finalizes submission when student clicks "Xác nhận" (DO_013)', async () => {
    const user = userEvent.setup();
    renderPage(
      <StudentAssignmentReading />,
      '/student/assignments/reading/:id',
      '/student/assignments/reading/10?submissionId=100'
    );

    const input = await screen.findByRole('textbox');
    await user.type(input, 'apple');

    const submitBtn = screen.getByRole('button', { name: /Hoàn thành & Nộp phần Đọc/i });
    await user.click(submitBtn);

    const confirmBtn = await screen.findByRole('button', { name: /^Xác nhận$/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(submissionService.submitModule).toHaveBeenCalledWith(
        1182,
        { answers: [{ questionId: 53, content: { text: 'apple' } }] },
        expect.any(Object)
      );
    });
  });
});
