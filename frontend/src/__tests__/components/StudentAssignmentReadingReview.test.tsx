import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import StudentAssignmentReading from '../../pages/StudentAssignmentReading';
import {
  splitParagraphIntoSegments,
  loadHighlights,
  saveHighlights,
  clearHighlights,
  renderHighlightedParagraph,
  type HighlightItem,
} from '../../utils/readingHighlight.utils';
import { assignmentService, type AssignmentDetail } from '../../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../../api/services/module.service';
import { questionService, type QuestionListResponse } from '../../api/services/question.service';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionListResponse,
  type SubmissionModuleDetailResponse,
} from '../../api/services/submission.service';

const { auth } = vi.hoisted(() => ({ auth: { user: { id: 41, name: 'Student 41' } } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));

vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'vi',
    t: (key: string) => key,
    toggleLanguage: vi.fn(),
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: {
    getAssignment: vi.fn(),
  },
}));

vi.mock('../../api/services/module.service', () => ({
  moduleService: {
    getModule: vi.fn(),
  },
}));

vi.mock('../../api/services/question.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/services/question.service')>();
  return {
    ...actual,
    questionService: {
      listQuestions: vi.fn(),
    },
  };
});

vi.mock('../../api/services/submission.service', () => ({
  submissionService: {
    getSubmission: vi.fn(),
    listSubmissions: vi.fn(),
    startAttempt: vi.fn(),
    submitModule: vi.fn(),
    submitSubmission: vi.fn(),
    getSubmissionModuleDetail: vi.fn(),
  },
}));

vi.mock('../../components/common/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

describe('readingHighlight.utils', () => {
  const paragraph = 'Artificial intelligence is transforming modern education and language learning across the world.';

  it('splits plain paragraph into a single segment when no highlights exist', () => {
    const segments = splitParagraphIntoSegments(paragraph, 0, []);
    expect(segments).toHaveLength(1);
    expect(segments[0].text).toBe(paragraph);
    expect(segments[0].highlight).toBeUndefined();
  });

  it('correctly splits paragraph into segments with one highlight', () => {
    const highlights: HighlightItem[] = [
      {
        id: 'hl-1',
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 23, // 'Artificial intelligence'
        color: 'yellow',
        text: 'Artificial intelligence',
      },
    ];
    const segments = splitParagraphIntoSegments(paragraph, 0, highlights);
    expect(segments).toHaveLength(2);
    expect(segments[0].text).toBe('Artificial intelligence');
    expect(segments[0].highlight?.color).toBe('yellow');
    expect(segments[1].text).toBe(' is transforming modern education and language learning across the world.');
  });

  it('correctly splits paragraph with multiple highlights and intermediate text', () => {
    const highlights: HighlightItem[] = [
      {
        id: 'hl-1',
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 23,
        color: 'yellow',
        text: 'Artificial intelligence',
      },
      {
        id: 'hl-2',
        paragraphIndex: 0,
        startOffset: 40,
        endOffset: 56,
        color: 'green',
        text: 'modern education',
      },
    ];
    const segments = splitParagraphIntoSegments(paragraph, 0, highlights);
    expect(segments.length).toBeGreaterThanOrEqual(3);
    expect(segments[0].text).toBe('Artificial intelligence');
    expect(segments[0].highlight?.id).toBe('hl-1');
  });

  it('saves, loads, and clears highlights in localStorage', () => {
    localStorage.clear();
    const assignmentId = 10;
    const moduleId = 20;
    const items: HighlightItem[] = [
      { id: '1', paragraphIndex: 0, startOffset: 5, endOffset: 10, color: 'pink', text: 'hello' },
    ];

    saveHighlights(assignmentId, moduleId, items);
    const loaded = loadHighlights(assignmentId, moduleId);
    expect(loaded).toEqual(items);

    clearHighlights(assignmentId, moduleId);
    expect(loadHighlights(assignmentId, moduleId)).toEqual([]);
  });

  it('renders mark element with highlight color class and supports remove callback', () => {
    const onRemove = vi.fn();
    const items: HighlightItem[] = [
      { id: 'hl-test', paragraphIndex: 0, startOffset: 0, endOffset: 10, color: 'pink', text: 'Artificial' },
    ];
    const { getByTestId } = render(
      <div>{renderHighlightedParagraph('Artificial intelligence', 0, items, onRemove)}</div>
    );
    const mark = getByTestId('highlight-hl-test');
    expect(mark.className).toContain('exam-highlight-pink');
    fireEvent.click(mark);
    expect(onRemove).toHaveBeenCalledWith('hl-test');
  });
});

describe('StudentAssignmentReading - Review Mode and Highlighter Integration', () => {
  const mockAssignment = {
    id: 100,
    title: 'IELTS Reading Practice: Technology in Education',
    status: 'PUBLISHED',
    modules: [
      { id: 201, skill: 'READING', title: 'Reading Module' },
      { id: 202, skill: 'WRITING', title: 'Writing Module' },
    ],
  };

  const mockModuleDetail = {
    id: 201,
    instructions: 'Paragraph 1: AI has transformed modern universities.\n\nParagraph 2: Students use digital tools to practice reading comprehension.',
  };

  const mockQuestions = [
    {
      id: 501,
      content: 'What has AI transformed in modern education?',
      questionType: 'MULTIPLE_CHOICE',
      score: 1,
      orderIndex: 1,
      options: [
        { id: 1, content: 'Modern universities' },
        { id: 2, content: 'Traditional printing presses' },
        { id: 3, content: 'Postal delivery systems' },
        { id: 4, content: 'Manual typewriter production' },
      ],
      correctAnswer: {
        options: [
          { id: 1, content: 'Modern universities', isCorrect: true },
          { id: 2, content: 'Traditional printing presses', isCorrect: false },
          { id: 3, content: 'Postal delivery systems', isCorrect: false },
          { id: 4, content: 'Manual typewriter production', isCorrect: false },
        ],
        explanation: 'According to Paragraph 1, AI has transformed modern universities.',
        evidence: 'AI has transformed modern universities.',
      },
    },
    {
      id: 502,
      content: 'Students use digital tools to practice reading _______.',
      questionType: 'SHORT_ANSWER',
      score: 1,
      orderIndex: 2,
      correctAnswer: {
        correctAnswer: 'comprehension',
        explanation: 'Paragraph 2 mentions reading comprehension directly.',
        evidence: 'practice reading comprehension',
      },
    },
  ];

  const mockSubmission = {
    id: 301,
    assignmentId: 100,
    studentId: 41,
    status: 'SUBMITTED',
    modules: [
      {
        id: 401,
        moduleId: 201,
        skill: 'READING',
        status: 'SUBMITTED',
        grading: {
          id: 601,
          method: 'AUTO',
          status: 'COMPLETED',
          finalScore: 10,
          maxScoreSnapshot: 10,
          aiFeedback: 'Good job!',
          finalFeedback: 'Well done.',
        },
      },
      {
        id: 402,
        moduleId: 202,
        skill: 'WRITING',
        status: 'SUBMITTED',
        grading: null,
      },
    ],
  };

  const mockSubModuleDetail = {
    id: 401,
    moduleId: 201,
    skill: 'READING',
    status: 'SUBMITTED',
    grading: {
      id: 601,
      method: 'AUTO',
      status: 'COMPLETED',
      finalScore: 10,
      maxScoreSnapshot: 10,
      aiFeedback: 'Good job!',
      finalFeedback: 'Well done.',
    },
    questions: mockQuestions,
    answers: [
      {
        id: 701,
        questionId: 501,
        content: { selectedOptionId: 1, isCorrect: true },
      },
      {
        id: 702,
        questionId: 502,
        content: { text: 'comprehension', isCorrect: true },
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    vi.mocked(assignmentService.getAssignment).mockResolvedValue(mockAssignment as unknown as AssignmentDetail);
    vi.mocked(moduleService.getModule).mockResolvedValue(mockModuleDetail as unknown as ModuleDetailResponse);
    vi.mocked(questionService.listQuestions).mockResolvedValue({
      questions: mockQuestions,
      data: mockQuestions,
    } as unknown as QuestionListResponse);
    vi.mocked(submissionService.getSubmission).mockResolvedValue(mockSubmission as unknown as SubmissionDetail);
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({
      data: [mockSubmission],
      pagination: { page: 1, limit: 10, total: 1 },
    } as unknown as SubmissionListResponse);
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue(mockSubModuleDetail as unknown as SubmissionModuleDetailResponse);
  });

  function renderComponent(url: string) {
    return render(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/student/assignments/:id/reading" element={<StudentAssignmentReading />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders Reading Passage and questions with highlight toolbar', async () => {
    const inProgressSub = {
      ...mockSubmission,
      status: 'IN_PROGRESS',
      modules: [
        { ...mockSubmission.modules[0], status: 'IN_PROGRESS', grading: null },
        { ...mockSubmission.modules[1], status: 'IN_PROGRESS', grading: null },
      ],
    };
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({
      data: [inProgressSub],
      pagination: { page: 1, limit: 10, total: 1 },
    } as unknown as SubmissionListResponse);
    vi.mocked(submissionService.getSubmission).mockResolvedValue(inProgressSub as unknown as SubmissionDetail);

    renderComponent('/student/assignments/100/reading?moduleId=201');

    await waitFor(() => {
      expect(screen.getByText('READING PASSAGE')).toBeInTheDocument();
      expect(screen.getAllByText('IELTS Reading Practice: Technology in Education').length).toBeGreaterThan(0);
      expect(screen.getByText(/Paragraph 1: AI has transformed modern universities/)).toBeInTheDocument();
    });

    // Check highlight toolbar
    expect(screen.getByRole('button', { name: /Highlight/i })).toBeInTheDocument();
  });

  it('renders review mode banner, stats pills, and filter tabs when mode=review', async () => {
    renderComponent('/student/assignments/100/reading?moduleId=201&submissionId=301&mode=review');

    await waitFor(() => {
      expect(screen.getByRole('region', { name: /Review Mode/i })).toBeInTheDocument();
      expect(screen.getByText(/Chế độ xem lại bài làm & Đối chiếu đáp án/i)).toBeInTheDocument();
      expect(screen.getByText(/✓ Đúng: 2 \/ 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Điểm: 100%/i)).toBeInTheDocument();
    });

    // Check review filter tabs
    expect(screen.getByRole('tab', { name: /Tất cả \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Đúng \(2\)/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sai \(0\)/i })).toBeInTheDocument();
  });

  it('displays correct answer status badges and explanation card in review mode', async () => {
    renderComponent('/student/assignments/100/reading?moduleId=201&submissionId=301&mode=review');

    await waitFor(() => {
      expect(screen.getByText('What has AI transformed in modern education?')).toBeInTheDocument();
      expect(screen.getByText('Đáp án đúng')).toBeInTheDocument();
      expect(screen.getByText('(Lựa chọn của bạn)')).toBeInTheDocument();
    });

    // Explanation card
    expect(screen.getByText('Giải thích chi tiết & Dẫn chứng')).toBeInTheDocument();
    expect(
      screen.getByText(/According to Paragraph 1, AI has transformed modern universities\./)
    ).toBeInTheDocument();
    expect(screen.getByText(/Dẫn chứng bài đọc:/)).toBeInTheDocument();

    // Review footer: back to overview button instead of submit
    expect(screen.getByRole('button', { name: 'Quay lại tổng quan bài thi' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hoàn thành & Nộp phần Đọc' })).not.toBeInTheDocument();
  });

  it('renders wrong answer badge when student answered incorrectly', async () => {
    const wrongSubModDetail = {
      ...mockSubModuleDetail,
      answers: [
        {
          id: 701,
          questionId: 501,
          content: { selectedOptionId: 2, isCorrect: false }, // Chose option 2 instead of 1
        },
      ],
    };
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue(
      wrongSubModDetail as unknown as SubmissionModuleDetailResponse
    );

    renderComponent('/student/assignments/100/reading?moduleId=201&submissionId=301&mode=review');

    await waitFor(() => {
      expect(screen.getByText('What has AI transformed in modern education?')).toBeInTheDocument();
      expect(screen.getByText('Đáp án đúng')).toBeInTheDocument();
      expect(screen.getByText('Bạn đã chọn')).toBeInTheDocument();
    });
  });
});
