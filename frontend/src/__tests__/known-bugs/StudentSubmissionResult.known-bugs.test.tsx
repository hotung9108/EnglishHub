import { beforeEach, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentSubmissionResult } from '../../pages/StudentSubmissionResult';
import { assignmentService } from '../../api/services/assignment.service';
import { submissionService, type SubmissionDetail, type SubmissionModuleDetailResponse, type SubmissionSkill } from '../../api/services/submission.service';
import { gradingService, type StudentGradingResult } from '../../api/services/grading.service';
import { answerAnnotationService, type GradingAnnotation } from '../../api/services/answer-annotation.service';
import { renderPage } from '../components/renderPage';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5 } }) }));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: {
  getSubmission: vi.fn(), listSubmissions: vi.fn(), getSubmissionModuleDetail: vi.fn(),
} }));
vi.mock('../../api/services/grading.service', () => ({ gradingService: {
  getAiSuggestion: vi.fn(), getById: vi.fn(), getStudentGradingResult: vi.fn(),
} }));
vi.mock('../../api/services/answer-annotation.service', () => ({ answerAnnotationService: { listAnnotations: vi.fn() } }));
vi.mock('../../api/services/question.service', async (original) => ({
  ...(await original<typeof import('../../api/services/question.service')>()),
  questionService: { listQuestions: vi.fn().mockResolvedValue({ questions: [] }) },
}));

const publishedResult: StudentGradingResult = {
  id: 80, submissionModuleId: 50, method: 'TEACHER_MANUAL', finalScore: 8,
  maxScoreSnapshot: 10, finalFeedback: 'Published feedback', gradedAt: null,
};
const annotation: GradingAnnotation = {
  id: 101, source: 'AI', startOffset: 0, endOffset: 5,
  errorType: 'GRAMMAR', suggestedFix: 'Better wording', comment: 'Accepted annotation', reviewStatus: 'ACCEPTED',
};

beforeEach(() => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Writing and Speaking result', status: 'PUBLISHED', modules: [] });
  vi.mocked(gradingService.getAiSuggestion).mockRejectedValue(new Error('Teacher-only endpoint'));
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [annotation] });
});

function arrange(skill: SubmissionSkill, result = publishedResult) {
  const grading = {
    id: result.id, method: result.method, status: 'COMPLETED' as const,
    finalScore: result.finalScore, maxScoreSnapshot: result.maxScoreSnapshot,
    aiFeedback: null, finalFeedback: result.finalFeedback,
  };
  const submission: SubmissionDetail = {
    id: 40, studentId: 5, assignmentId: 12, attemptNumber: 1, status: 'GRADED',
    submittedAt: null, createdAt: '2026-10-22T00:00:00Z',
    modules: [{ id: 50, moduleId: 30, skill, taskType: skill === 'SPEAKING' ? 'RECORDING' : 'ESSAY', status: 'GRADED', grading }],
  };
  const detail: SubmissionModuleDetailResponse = {
    id: 50, moduleId: 30, skill, taskType: skill === 'SPEAKING' ? 'RECORDING' : 'ESSAY',
    status: 'GRADED', grading, questions: [],
    answers: [{ id: 60, questionId: null, content: skill === 'SPEAKING' ? null : 'Essay text', audioStorageKey: skill === 'SPEAKING' ? 'speaking.webm' : null }],
  };
  vi.mocked(submissionService.getSubmission).mockResolvedValue(submission);
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [submission], pagination: { page: 1, limit: 10, total: 1 } });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue(detail);
  vi.mocked(gradingService.getStudentGradingResult).mockResolvedValue(result);
  vi.mocked(gradingService.getById).mockResolvedValue({
    ...result, status: 'COMPLETED', aiFeedback: null, aiTranscript: [{ word: 'Transcript' }],
    reviewedBy: null, reviewedAt: null, aiInstructionSnapshot: null,
  });
}

async function setup() {
  const page = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
  await screen.findByText('Accepted annotation');
  return page;
}

it('FE-48: Student Result never calls ai-suggestion for Writing or Speaking', async () => {
  for (const skill of ['WRITING', 'SPEAKING'] as const) {
    vi.clearAllMocks();
    arrange(skill);
    const page = await setup();
    expect.soft(gradingService.getAiSuggestion, skill).not.toHaveBeenCalled();
    page.unmount();
  }
});

it('FE-48: Speaking does not fetch an additional grading detail for transcript', async () => {
  arrange('SPEAKING');
  await setup();
  // The published-result helper is mocked separately; any getById call here is an extra page fetch.
  expect(gradingService.getById).not.toHaveBeenCalled();
});

it('FE-48: missing score or scale stays hidden, while a published zero is visible', async () => {
  for (const result of [
    { ...publishedResult, finalScore: null },
    { ...publishedResult, maxScoreSnapshot: null },
    { ...publishedResult, finalScore: 0 },
  ]) {
    arrange('WRITING', result);
    const page = await setup();
    const score = page.container.querySelector('.result-hero-score-box');
    if (result.finalScore === null || result.maxScoreSnapshot === null) {
      expect.soft(score).not.toBeInTheDocument();
      expect.soft(page.container).not.toHaveTextContent('--/10');
    } else {
      expect.soft(score).toHaveTextContent('0/10');
    }
    page.unmount();
  }
});

it('FE-48: Student Result hides rubric and AI Diagnostics', async () => {
  arrange('WRITING');
  const page = await setup();
  expect.soft(screen.queryByText('Tóm tắt tiêu chí Writing:')).not.toBeInTheDocument();
  const rubricTab = screen.queryByRole('button', { name: 'Phân tích tiêu chí' });
  expect.soft(rubricTab).not.toBeInTheDocument();
  if (rubricTab) await userEvent.setup().click(rubricTab);
  expect.soft(page.container.querySelector('.result-rubrics-grid')).not.toBeInTheDocument();
  expect.soft(screen.queryByText('Chẩn Đoán Năng Lực & Khuyến Nghị Tự Động (AI)')).not.toBeInTheDocument();
});
