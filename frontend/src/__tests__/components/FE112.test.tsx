import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import StudentSubmissionResult from '../../pages/StudentSubmissionResult';
import { renderPage } from './renderPage';
import { assignmentService, type AssignmentDetail } from '../../api/services/assignment.service';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionModuleDetailResponse,
} from '../../api/services/submission.service';
import { gradingService } from '../../api/services/grading.service';

const auth = {
  user: { id: 5, role: 'STUDENT', fullName: 'Lê Văn Học Viên' },
  isAuthenticated: true,
};

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
    getDocumentDownloadUrl: vi.fn(),
    getAudioDownloadUrl: vi.fn(),
  },
}));

vi.mock('../../api/services/grading.service', () => ({
  gradingService: {
    getStudentGradingResult: vi.fn(),
    getById: vi.fn().mockResolvedValue({ id: 1, aiTranscript: null }),
  },
}));

vi.mock('../../api/services/question.service', async (original) => ({
  ...(await original<typeof import('../../api/services/question.service')>()),
  questionService: { listQuestions: vi.fn().mockResolvedValue({ questions: [] }) },
}));

vi.mock('../../api/services/answer-annotation.service', () => ({
  answerAnnotationService: {
    listAnnotations: vi.fn().mockResolvedValue([]),
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
      moduleId: 201,
      skill: 'READING',
      taskType: 'QUIZ',
      status: 'GRADED',
      grading: {
        id: 80,
        method: 'AUTO',
        status: 'COMPLETED',
        finalScore: 10,
        maxScoreSnapshot: 20,
        aiFeedback: null,
        finalFeedback: 'Tốt',
      },
    },
  ],
};

const mockModuleDetail: SubmissionModuleDetailResponse = {
  id: 50,
  moduleId: 201,
  skill: 'READING',
  taskType: 'QUIZ',
  status: 'GRADED',
  grading: {
    id: 80,
    method: 'AUTO',
    status: 'COMPLETED',
    finalScore: 10,
    maxScoreSnapshot: 20,
    aiFeedback: null,
    finalFeedback: 'Tốt',
  },
  questions: [],
  answers: [],
};

const mockAssignment = {
  id: 12,
  title: 'IELTS Academic Reading Test 1',
  description: 'Practice exam',
  classId: 1,
  status: 'PUBLISHED',
  dueDate: '2026-12-31T23:59:59Z',
  modules: [],
} as unknown as AssignmentDetail;

describe('FE-112 [ISSUE #438] Submission Result Normalized Score (Scale 10) & Raw Score Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignmentService.getAssignment).mockResolvedValue(mockAssignment);
    vi.mocked(submissionService.getSubmission).mockResolvedValue(mockSubmission);
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({
      data: [mockSubmission],
      pagination: { page: 1, limit: 10, total: 1 },
    });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue(mockModuleDetail);
  });

  it('displays normalized score 5.0 / 10.0 and raw score (Điểm thô: 10/20) in Vietnamese when score is 10/20', async () => {
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue({
      id: 80,
      submissionModuleId: 50,
      method: 'AUTO',
      finalScore: 10,
      maxScoreSnapshot: 20,
      finalFeedback: 'Tốt',
      gradedAt: '2026-10-25T10:05:00Z',
    });

    const { container } = renderPage(
      <StudentSubmissionResult />,
      '/student/submissions/:id',
      '/student/submissions/40',
      undefined,
      'vi'
    );

    await waitFor(() => {
      const scoreBox = container.querySelector('.result-hero-score-box');
      expect(scoreBox).toBeInTheDocument();
      expect(scoreBox).toHaveTextContent('5.0');
      expect(scoreBox).toHaveTextContent('/ 10.0');
      expect(scoreBox).toHaveTextContent('Điểm thô: 10/20');
    });
  });

  it('displays normalized score 5.0 / 10.0 and raw score (Raw score: 10/20) in English when language is en', async () => {
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue({
      id: 80,
      submissionModuleId: 50,
      method: 'AUTO',
      finalScore: 10,
      maxScoreSnapshot: 20,
      finalFeedback: 'Good',
      gradedAt: '2026-10-25T10:05:00Z',
    });

    const { container } = renderPage(
      <StudentSubmissionResult />,
      '/student/submissions/:id',
      '/student/submissions/40',
      undefined,
      'en'
    );

    await waitFor(() => {
      const scoreBox = container.querySelector('.result-hero-score-box');
      expect(scoreBox).toBeInTheDocument();
      expect(scoreBox).toHaveTextContent('5.0');
      expect(scoreBox).toHaveTextContent('/ 10.0');
      expect(scoreBox).toHaveTextContent('Raw score: 10/20');
    });
  });

  it('accurately normalizes score when maxScore is already 10 (e.g. 8.5/10 -> 8.5 / 10.0)', async () => {
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue({
      id: 80,
      submissionModuleId: 50,
      method: 'AUTO',
      finalScore: 8.5,
      maxScoreSnapshot: 10,
      finalFeedback: 'Great',
      gradedAt: '2026-10-25T10:05:00Z',
    });

    const { container } = renderPage(
      <StudentSubmissionResult />,
      '/student/submissions/:id',
      '/student/submissions/40',
      undefined,
      'vi'
    );

    await waitFor(() => {
      const scoreBox = container.querySelector('.result-hero-score-box');
      expect(scoreBox).toBeInTheDocument();
      expect(scoreBox).toHaveTextContent('8.5');
      expect(scoreBox).toHaveTextContent('/ 10.0');
      expect(scoreBox).toHaveTextContent('Điểm thô: 8.5/10');
    });
  });

  it('accurately displays 0.0 / 10.0 when student scores 0 (0/10)', async () => {
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue({
      id: 80,
      submissionModuleId: 50,
      method: 'AUTO',
      finalScore: 0,
      maxScoreSnapshot: 10,
      finalFeedback: 'Cần cố gắng',
      gradedAt: '2026-10-25T10:05:00Z',
    });

    const { container } = renderPage(
      <StudentSubmissionResult />,
      '/student/submissions/:id',
      '/student/submissions/40',
      undefined,
      'vi'
    );

    await waitFor(() => {
      const scoreBox = container.querySelector('.result-hero-score-box');
      expect(scoreBox).toBeInTheDocument();
      expect(scoreBox).toHaveTextContent('0.0');
      expect(scoreBox).toHaveTextContent('/ 10.0');
      expect(scoreBox).toHaveTextContent('Điểm thô: 0/10');
    });
  });

  it('hides score box when finalScore is null or maxScore is 0', async () => {
    vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue({
      id: 80,
      submissionModuleId: 50,
      method: 'AUTO',
      finalScore: null,
      maxScoreSnapshot: 10,
      finalFeedback: null,
      gradedAt: null,
    });

    const { container } = renderPage(
      <StudentSubmissionResult />,
      '/student/submissions/:id',
      '/student/submissions/40',
      undefined,
      'vi'
    );

    await waitFor(() => {
      expect(container.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
    });
  });
});
