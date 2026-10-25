import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentSubmissionResult } from '../../pages/StudentSubmissionResult';
import { assignmentService } from '../../api/services/assignment.service';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionModuleDetailResponse,
} from '../../api/services/submission.service';
import { gradingService, type AiGradingAnnotation, type AiGradingSuggestionResponse } from '../../api/services/grading.service';
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
    getBySubmissionModuleId: vi.fn(),
    getAiSuggestion: vi.fn(),
    getById: vi.fn(),
  },
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

const mockAiAnnotations: AiGradingAnnotation[] = mockAnnotations.map((ann) => ({
  ...ann,
  answerId: 60,
}));

const mockAiSuggestion: AiGradingSuggestionResponse = {
  submissionModuleId: 50,
  gradingId: 80,
  skill: 'WRITING',
  status: 'AI_GRADED',
  suggestedScore: 8.0,
  maxScore: 10,
  aiFeedback: 'Well structured essay with appropriate academic tone.',
  criteriaScores: null,
  metrics: null,
  annotations: mockAiAnnotations,
  transcript: null,
  modelUsed: 'gemini-1.5-flash',
  providerUsed: 'GOOGLE',
  canTriggerAi: false,
  fallbackManualGradingAvailable: true,
  fallbackMessage: '',
};

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
    vi.mocked(gradingService.getAiSuggestion).mockResolvedValue(mockAiSuggestion);
    vi.mocked(gradingService.getById).mockResolvedValue({
      id: 80,
      submissionModuleId: 50,
      method: 'AUTO',
      status: 'COMPLETED',
      finalScore: 8.0,
      finalFeedback: 'Well structured essay.',
      aiFeedback: null,
      aiTranscript: null,
      maxScoreSnapshot: 10,
      reviewedBy: null,
      reviewedAt: null,
      gradedAt: null,
      aiInstructionSnapshot: null,
    });
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
});
