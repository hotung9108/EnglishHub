import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import { ApiClientError } from '../../api/core/errors';
import { deferred } from '../deferred';
import userEvent from '@testing-library/user-event';
import { StudentSubmissionResult } from '../../pages/StudentSubmissionResult';
import { assignmentService } from '../../api/services/assignment.service';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionModuleDetailResponse,
  type SubmissionSkill,
} from '../../api/services/submission.service';
import { gradingService, type StudentGradingResult } from '../../api/services/grading.service';
import { answerAnnotationService, type GradingAnnotation } from '../../api/services/answer-annotation.service';
import { renderPage } from './renderPage';

const { auth } = vi.hoisted(() => ({ auth: { user: { id: 5 } as { id: number } | null } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: { getAssignment: vi.fn(), listAssignments: vi.fn() },
}));

vi.mock('../../api/services/submission.service', async (original) => ({
  ...(await original<typeof import('../../api/services/submission.service')>()),
  submissionService: {
    listSubmissions: vi.fn(),
    getSubmission: vi.fn(),
    getSubmissionModuleDetail: vi.fn(),
  },
}));

vi.mock('../../api/services/grading.service', () => ({
  gradingService: {
    getStudentGradingResult: vi.fn(),
  },
}));

vi.mock('../../api/services/question.service', async (original) => ({
  ...(await original<typeof import('../../api/services/question.service')>()),
  questionService: { listQuestions: vi.fn().mockResolvedValue({ questions: [] }) },
}));

vi.mock('../../api/services/answer-annotation.service', () => ({
  answerAnnotationService: {
    listAnnotations: vi.fn(),
  },
}));

const mockSubmission: SubmissionDetail = {
  id: 40,
  assignmentId: 12,
  studentId: 5,
  attemptNumber: 1,
  status: 'GRADED',
  submittedAt: '2026-10-25T10:00:00Z',
  createdAt: '2026-10-25T09:00:00Z',
  modules: [
    {
      id: 50,
      moduleId: 30,
      skill: 'WRITING',
      taskType: 'ESSAY',
      status: 'GRADED',
      grading: {
        id: 80,
        method: 'AUTO',
        status: 'COMPLETED',
        finalScore: 8.0,
        maxScoreSnapshot: 10,
        aiFeedback: null,
        finalFeedback: null,
      },
    },
  ],
};

const essayText = 'EnglishHub provides automated grading and real-time AI annotations for students.';

const mockModuleDetail: SubmissionModuleDetailResponse = {
  id: 50,
  moduleId: 30,
  skill: 'WRITING',
  taskType: 'ESSAY',
  status: 'GRADED',
  grading: {
    id: 80,
    method: 'AUTO',
    status: 'COMPLETED',
    finalScore: 8.0,
    maxScoreSnapshot: 10,
    aiFeedback: null,
    finalFeedback: null,
  },
  questions: [],
  answers: [
    {
      id: 60,
      questionId: 1,
      content: { text: essayText },
    },
  ],
};

// 3 annotations at 3 distinct positions (DoD requirement):
// 1. Beginning of text (startOffset: 0, endOffset: 10 -> "EnglishHub")
// 2. Middle of text (startOffset: 20, endOffset: 29 -> "automated")
// 3. Out-of-bounds offset (startOffset: 9999, endOffset: 10050 -> out of bounds)
const mockAnnotations: GradingAnnotation[] = [
  {
    id: 101,
    source: 'AI',
    startOffset: 0,
    endOffset: 10,
    errorType: 'GRAMMAR',
    comment: 'Capitalize proper platform name.',
    suggestedFix: 'EnglishHub',
    reviewStatus: 'ACCEPTED',
  },
  {
    id: 102,
    source: 'TEACHER',
    startOffset: 20,
    endOffset: 29,
    errorType: 'VOCABULARY',
    comment: 'Great academic adjective selection.',
    suggestedFix: null,
    reviewStatus: 'ACCEPTED',
  },
  {
    id: 103,
    source: 'AI',
    startOffset: 9999,
    endOffset: 10050,
    errorType: 'SPELLING',
    comment: 'Far out-of-bounds annotation from AI.',
    suggestedFix: null,
    reviewStatus: 'ACCEPTED',
  },
];

const publishedResult: StudentGradingResult = {
  id: 80,
  submissionModuleId: 50,
  method: 'AUTO',
  finalScore: 8,
  maxScoreSnapshot: 10,
  finalFeedback: 'Well structured essay.',
  gradedAt: null,
};

function arrangeSkill(skill: SubmissionSkill) {
  const detail: SubmissionModuleDetailResponse = {
    ...mockModuleDetail, skill, taskType: skill === 'SPEAKING' ? 'RECORDING' : 'ESSAY',
    answers: skill === 'SPEAKING'
      ? [{ id: 60, questionId: null, content: null, audioStorageKey: 'speaking.webm' }]
      : mockModuleDetail.answers,
  };
  vi.mocked(submissionService.getSubmission).mockResolvedValue({
    ...mockSubmission,
    modules: [{ ...mockSubmission.modules[0], skill, taskType: detail.taskType }],
  });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue(detail);
  return detail;
}

describe('StudentSubmissionResult - [FE-51] Annotation Snippet Extraction', () => {
  beforeEach(() => {
    auth.user = { id: 5 };
    vi.mocked(assignmentService.getAssignment).mockResolvedValue({
      id: 12,
      title: 'IELTS Academic Writing Task 2',
      status: 'PUBLISHED',
      modules: [],
    });
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({
      data: [mockSubmission],
      pagination: { page: 1, limit: 10, total: 1 },
    });
    vi.mocked(submissionService.getSubmission).mockResolvedValue(mockSubmission);
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue(mockModuleDetail);
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue(publishedResult);
    vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({
      data: mockAnnotations,
    });
  });

  it('correctly slices real text snippets for 3 annotations at different positions and avoids raw technical strings', async () => {
    const user = userEvent.setup();
    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    // Wait for the first annotation chip to be rendered after loadModuleData finishes
    const firstChip = await screen.findByRole('button', { name: /#101 GRAMMAR/ });
    expect(firstChip).toBeVisible();
    expect(firstChip.textContent).toContain('EnglishHub');

    // Verify DoD 1: First annotation at position 0-10 ("EnglishHub") is sliced and displayed in original box
    const originalBox = container.querySelector('.diff-box.original');
    expect(originalBox).not.toBeNull();
    expect(originalBox?.textContent).toContain('EnglishHub');

    // Verify DoD: Absolutely NO raw technical string like "Đoạn ký tự" exists in the document
    expect(screen.queryByText(/Đoạn ký tự/)).toBeNull();

    // Verify DoD 3: Click on second annotation chip (middle of text: position 20-29 -> "automated")
    const secondChip = screen.getByRole('button', { name: /#102 VOCABULARY/ });
    expect(secondChip.textContent).toContain('automated');
    await user.click(secondChip);

    // Inspector should now display "automated"
    expect(container.querySelector('.diff-box.original')?.textContent).toContain('automated');

    // Click on third annotation chip (out-of-bounds: position 9999-10050)
    const thirdChip = screen.getByRole('button', { name: /#103 SPELLING/ });
    await user.click(thirdChip);

    // Verify DoD 2: Out-of-bounds does NOT crash and displays clean user-friendly fallback
    expect(container.querySelector('.diff-box.original')?.textContent).toContain('Đoạn văn bản không khả dụng');

    // Verify again that technical string is never displayed anywhere in DOM
    expect(screen.queryByText(/Đoạn ký tự/)).toBeNull();
  });

  it('renders English user-friendly fallback when language is switched to en', async () => {
    const user = userEvent.setup();
    const { container } = renderPage(
      <StudentSubmissionResult />,
      '/student/submissions/:id',
      '/student/submissions/40',
      undefined,
      'en'
    );

    // Wait for annotations to load in English
    const thirdChip = await screen.findByRole('button', { name: /#103 SPELLING/ });
    expect(thirdChip.textContent).toContain('Text segment unavailable');
    await user.click(thirdChip);

    // Should display English fallback in inspector without crashing
    expect(container.querySelector('.diff-box.original')?.textContent).toContain('Text segment unavailable');
    expect(screen.queryByText(/Đoạn ký tự/)).toBeNull();
  });


  it('loads Writing annotations without answerId and uses only the published score and feedback', async () => {
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue({
      ...publishedResult, finalScore: 12, maxScoreSnapshot: 20, finalFeedback: 'Published Writing feedback',
    });
    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    expect(await screen.findByText('Published Writing feedback')).toBeVisible();
    expect(await screen.findByRole('button', { name: /#101 GRAMMAR/ })).toBeVisible();
    expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(60);
    expect(gradingService.getStudentGradingResult).toHaveBeenCalledWith(50);
    expect(container.querySelector('.result-hero-score-box')).toHaveTextContent('12/20');
    expect(screen.queryByText('8/10')).not.toBeInTheDocument();
  });

  it('shows accepted Speaking annotations without transcript and keeps audio from module detail', async () => {
    const audioKey = 'submissions/40/module-50/audio.webm';
    vi.mocked(submissionService.getSubmission).mockResolvedValue({
      ...mockSubmission,
      modules: [{ ...mockSubmission.modules[0], skill: 'SPEAKING', taskType: 'RECORDING' }],
    });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
      ...mockModuleDetail, skill: 'SPEAKING', taskType: 'RECORDING',
      answers: [{ id: 60, questionId: null, content: null, audioStorageKey: audioKey }],
    });
    vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [{
      ...mockAnnotations[0], errorType: 'PRONUNCIATION',
      suggestedFix: 'Improved pronunciation', comment: 'Accepted Speaking feedback',
    }] });
    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    expect(await screen.findByText('Accepted Speaking feedback')).toBeVisible();
    expect(screen.getByText('Đoạn văn bản không khả dụng', { exact: false })).toBeVisible();
    expect(screen.getByText('Improved pronunciation')).toBeVisible();
    expect(screen.getByText('PRONUNCIATION')).toBeVisible();
    expect(container.querySelector('audio')?.getAttribute('src')).toContain(audioKey);
    expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(60);
  });

  it.each(['PENDING', 'AI_GRADED', 'FAILED'] as const)(
    'hides score and unpublished feedback when grading is %s', async (status) => {
      const unpublishedGrading = {
        id: 80, method: 'AUTO' as const, status, finalScore: 7, maxScoreSnapshot: 10,
        aiFeedback: 'Unpublished AI feedback', finalFeedback: 'Unpublished teacher feedback',
      };
      vi.mocked(submissionService.getSubmission).mockResolvedValue({
        ...mockSubmission, status: 'SUBMITTED',
        modules: [{ ...mockSubmission.modules[0], status: 'SUBMITTED', grading: unpublishedGrading }],
      });
      vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
        ...mockModuleDetail, status: 'SUBMITTED', grading: unpublishedGrading,
      });
      vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue(null);
      const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

      expect(await screen.findByRole('button', { name: /#101 GRAMMAR/ })).toBeVisible();
      expect(container.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
      expect(screen.queryByText('Unpublished AI feedback')).not.toBeInTheDocument();
      expect(screen.queryByText('Unpublished teacher feedback')).not.toBeInTheDocument();
      expect(screen.queryByText(publishedResult.finalFeedback ?? '')).not.toBeInTheDocument();
    },
  );

  it.each([
    { finalScore: 0, maxScoreSnapshot: 10, expected: '0/10' },
    { finalScore: null, maxScoreSnapshot: 10, expected: null },
    { finalScore: 8, maxScoreSnapshot: null, expected: null },
    { finalScore: 8, maxScoreSnapshot: 0, expected: null },
  ])('renders published score $finalScore with scale $maxScoreSnapshot accurately', async ({ finalScore, maxScoreSnapshot, expected }) => {
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue({
      ...publishedResult, finalScore, maxScoreSnapshot,
    });
    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    await screen.findByRole('button', { name: /#101 GRAMMAR/ });
    const score = container.querySelector('.result-hero-score-box');
    if (expected === null) {
      expect(score).not.toBeInTheDocument();
      expect(container).not.toHaveTextContent('--/10');
      expect(container).not.toHaveTextContent('0/10');
    } else {
      expect(score).toHaveTextContent(expected);
    }
  });

  it.each(['WRITING', 'SPEAKING'] as const)('keeps the existing empty state in %s when annotations are empty', async skill => {
    arrangeSkill(skill);
    vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [] });
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    expect(await screen.findByText('Chưa có điểm sửa lỗi nào được ghi nhận từ AI hoặc giáo viên.')).toBeVisible();
    expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(60);
    expect(screen.queryByRole('button', { name: /#101 GRAMMAR/ })).not.toBeInTheDocument();
  });


  for (const skill of ['WRITING', 'SPEAKING'] as const) {
    it.each([
      { kind: 'loading', message: 'Đang tải nhận xét...' },
      { kind: 'missingAnswerId', message: 'Bài làm này chưa có dữ liệu nhận xét chi tiết.' },
      { kind: 'forbidden', message: 'Bạn không có quyền xem nhận xét của bài này.' },
      { kind: 'notFound', message: 'Không tìm thấy nhận xét của bài này.' },
      { kind: 'network', message: 'Không tải được nhận xét. Vui lòng thử lại.' },
    ])(`shows $kind in ${skill} without an empty-state message`, async ({ kind, message }) => {
      const detail = arrangeSkill(skill);
      if (kind === 'loading') {
        vi.mocked(answerAnnotationService.listAnnotations).mockReturnValue(deferred<{ data: GradingAnnotation[] }>().promise);
      } else if (kind === 'missingAnswerId') {
        vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...detail, answers: [] });
      } else {
        const status = kind === 'forbidden' ? 403 : kind === 'notFound' ? 404 : 500;
        vi.mocked(answerAnnotationService.listAnnotations).mockRejectedValue(new ApiClientError('Request failed', status));
      }
      renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

      if (kind === 'loading') {
        await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(60));
      }
      expect(await screen.findByText(message)).toBeVisible();
      expect(screen.queryByText('Chưa có điểm sửa lỗi nào được ghi nhận từ AI hoặc giáo viên.')).not.toBeInTheDocument();
      expect(screen.queryByText('Chưa có ghi chú')).not.toBeInTheDocument();
      if (kind === 'missingAnswerId') expect(answerAnnotationService.listAnnotations).not.toHaveBeenCalled();
    });
  }

  it('retries an annotation request without reloading the grading flow', async () => {
    vi.mocked(answerAnnotationService.listAnnotations)
      .mockRejectedValueOnce(new ApiClientError('Server error', 500))
      .mockResolvedValueOnce({ data: mockAnnotations });
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    await screen.findByText('Không tải được nhận xét. Vui lòng thử lại.');
    const gradingCalls = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;

    await userEvent.setup().click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('button', { name: /#101 GRAMMAR/ })).toBeVisible();
    expect(answerAnnotationService.listAnnotations).toHaveBeenCalledTimes(2);
    expect(gradingService.getStudentGradingResult).toHaveBeenCalledTimes(gradingCalls);
  });

  it('clears old annotations while module detail is pending and ignores a late module response', async () => {
    const speaking = deferred<SubmissionModuleDetailResponse>();
    const speakingModule = { ...mockSubmission.modules[0], id: 51, moduleId: 31, skill: 'SPEAKING' as const, taskType: 'RECORDING' as const };
    vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...mockSubmission, modules: [...mockSubmission.modules, speakingModule] });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(id => id === 50 ? Promise.resolve(mockModuleDetail) : speaking.promise);
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    await screen.findByRole('button', { name: /#101 GRAMMAR/ });
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Speaking' }));
    expect(await screen.findByText('Đang tải nhận xét...')).toBeVisible();
    expect(screen.queryByText('Capitalize proper platform name.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Writing' }));
    await screen.findByRole('button', { name: /#101 GRAMMAR/ });
    await act(async () => speaking.resolve({
      ...mockModuleDetail, id: 51, moduleId: 31, skill: 'SPEAKING', taskType: 'RECORDING',
      answers: [{ id: 61, questionId: null, content: null, audioStorageKey: 'speaking.webm' }],
    }));

    expect(screen.getByRole('button', { name: /#101 GRAMMAR/ })).toBeVisible();
    expect(answerAnnotationService.listAnnotations).not.toHaveBeenCalledWith(61);
  });

  it('keeps the new module annotations when the previous annotation response arrives late', async () => {
    const writing = deferred<{ data: GradingAnnotation[] }>();
    const speakingDetail: SubmissionModuleDetailResponse = {
      ...mockModuleDetail, id: 51, moduleId: 31, skill: 'SPEAKING', taskType: 'RECORDING',
      answers: [{ id: 61, questionId: null, content: null, audioStorageKey: 'speaking.webm' }],
    };
    vi.mocked(submissionService.getSubmission).mockResolvedValue({
      ...mockSubmission,
      modules: [...mockSubmission.modules, { ...mockSubmission.modules[0], id: 51, moduleId: 31, skill: 'SPEAKING', taskType: 'RECORDING' }],
    });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(id => Promise.resolve(id === 50 ? mockModuleDetail : speakingDetail));
    vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(id => id === 60
      ? writing.promise
      : Promise.resolve({ data: [{ ...mockAnnotations[0], id: 104, comment: 'Current Speaking annotation' }] }));
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(60));

    await userEvent.setup().click(screen.getByRole('button', { name: 'Speaking' }));
    await screen.findByText('Current Speaking annotation');
    await act(async () => writing.resolve({ data: mockAnnotations }));

    expect(screen.getByText('Current Speaking annotation')).toBeVisible();
    expect(screen.queryByText('Capitalize proper platform name.')).not.toBeInTheDocument();
  });
});
