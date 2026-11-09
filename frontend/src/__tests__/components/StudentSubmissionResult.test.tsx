import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { ApiClientError } from '../../api/core/errors';
import { deferred } from '../deferred';
import userEvent from '@testing-library/user-event';
import { resolveRetryModuleId, StudentSubmissionResult } from '../../pages/StudentSubmissionResult';
import { assignmentService } from '../../api/services/assignment.service';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionModuleDetailResponse,
  type SubmissionSkill,
} from '../../api/services/submission.service';
import { gradingService, type GradingDetailResponse, type StudentGradingResult } from '../../api/services/grading.service';
import { answerAnnotationService, type GradingAnnotation } from '../../api/services/answer-annotation.service';
import { renderPage } from './renderPage';
import { questionService } from '../../api/services/question.service';

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

const FALLBACK_AUDIO_URL = 'https://storage.example.test/submissions/40/audio-fallback.webm?signature=fallback';

function configureAudio(audio: HTMLAudioElement, duration: number, initialTime = 0) {
  let currentTime = initialTime;
  const currentDuration = duration;
  Object.defineProperty(audio, 'duration', {
    configurable: true,
    get: () => currentDuration,
  });
  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => currentTime,
    set: (value: number) => { currentTime = Number(value); },
  });
  return {
    getCurrentTime: () => currentTime,
  };
}

function controllableRequest<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function arrangeAttempts(submissions: SubmissionDetail[]) {
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({
    data: submissions,
    pagination: { page: 1, limit: 10, total: submissions.length },
  });
}

async function selectAttemptAndFlush(attemptId: number) {
  await act(async () => {
    fireEvent.change(screen.getByRole('combobox'), { target: { value: String(attemptId) } });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

function arrangeSkill(skill: SubmissionSkill) {
  const detail: SubmissionModuleDetailResponse = {
    ...mockModuleDetail, skill, taskType: skill === 'SPEAKING' ? 'RECORDING' : 'ESSAY',
    answers: skill === 'SPEAKING'
      ? [{ id: 60, questionId: null, content: null, audioStorageKey: 'speaking.webm', audioDownloadUrl: 'https://storage.example.test/speaking.webm?signature=answer' }]
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
    vi.mocked(gradingService.getById).mockResolvedValue({ id: 80, aiTranscript: null } as unknown as GradingDetailResponse);
    vi.mocked(submissionService.getAudioDownloadUrl).mockResolvedValue({
      submissionModuleId: 50,
      downloadUrl: FALLBACK_AUDIO_URL,
      storageKey: 'submissions/40/audio.webm',
      fileName: 'audio.webm',
      mimeType: 'audio/webm',
      expiresAt: '2026-11-09T12:00:00Z',
    });
    vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({
      data: mockAnnotations,
    });
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
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
    const audioUrl = 'https://storage.example.test/submissions/40/module-50/audio.webm?signature=answer';
    vi.mocked(submissionService.getSubmission).mockResolvedValue({
      ...mockSubmission,
      modules: [{ ...mockSubmission.modules[0], skill: 'SPEAKING', taskType: 'RECORDING' }],
    });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
      ...mockModuleDetail, skill: 'SPEAKING', taskType: 'RECORDING',
      answers: [{ id: 60, questionId: null, content: null, audioStorageKey: 'submissions/40/module-50/audio.webm', audioDownloadUrl: audioUrl }],
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
    expect(container.querySelector('audio')).toHaveAttribute('src', audioUrl);
    expect(submissionService.getAudioDownloadUrl).not.toHaveBeenCalled();
    expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(60);
  });

  it('selects a Speaking answer that has a presigned URL without a storage key', async () => {
    const detail = arrangeSkill('SPEAKING');
    const audioUrl = 'https://storage.example.test/speaking-only-url.webm?signature=answer';
    detail.answers = [{ id: 62, questionId: null, content: null, audioDownloadUrl: audioUrl }];

    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', audioUrl));
    expect(submissionService.getAudioDownloadUrl).not.toHaveBeenCalled();
  });

  it.each([null, ''] as const)('requests a presigned URL when the answer URL is %s', async audioDownloadUrl => {
    const detail = arrangeSkill('SPEAKING');
    detail.answers = [{
      id: 60,
      questionId: null,
      content: null,
      audioStorageKey: 'submissions/40/audio.webm',
      audioDownloadUrl,
    }];

    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    await waitFor(() => expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledWith(50));
    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', FALLBACK_AUDIO_URL));
    expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledTimes(1);
    expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledWith(50);
  });

  it('refreshes an expired URL once and restores playback position after metadata loads', async () => {
    arrangeSkill('SPEAKING');
    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', 'https://storage.example.test/speaking.webm?signature=answer'));
    const initialAudio = container.querySelector('audio')!;
    configureAudio(initialAudio!, 90, 37);

    fireEvent.error(initialAudio!);

    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', FALLBACK_AUDIO_URL));
    const refreshedAudio = container.querySelector('audio')!;
    const media = configureAudio(refreshedAudio, 90);
    fireEvent.loadedMetadata(refreshedAudio);
    expect(media.getCurrentTime()).toBe(37);

    fireEvent.error(refreshedAudio);
    expect(await screen.findByText('Không thể tải audio bài nộp. Vui lòng thử lại.')).toBeVisible();
    expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledTimes(1);
  });

  it('shows an error when fallback fails and lets the student start a new retry cycle', async () => {
    const detail = arrangeSkill('SPEAKING');
    detail.answers = [{ ...detail.answers[0], audioDownloadUrl: null }];
    vi.mocked(submissionService.getAudioDownloadUrl).mockRejectedValueOnce(new Error('Unavailable'));
    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    expect(await screen.findByText('Không thể tải audio bài nộp. Vui lòng thử lại.')).toBeVisible();
    expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledTimes(1);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', FALLBACK_AUDIO_URL));
    fireEvent.error(container.querySelector('audio')!);

    expect(await screen.findByText('Không thể tải audio bài nộp. Vui lòng thử lại.')).toBeVisible();
    expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledTimes(2);
  });

  it('resets the one-refresh limit when the attempt changes its module and answer', async () => {
    const firstAttempt: SubmissionDetail = {
      ...mockSubmission,
      modules: [{ ...mockSubmission.modules[0], skill: 'SPEAKING', taskType: 'RECORDING' }],
    };
    const secondAttempt: SubmissionDetail = {
      ...firstAttempt,
      id: 41,
      attemptNumber: 2,
      modules: [{ ...firstAttempt.modules[0], id: 51 }],
    };
    arrangeAttempts([firstAttempt, secondAttempt]);
    vi.mocked(submissionService.getSubmission).mockImplementation(async submissionId =>
      submissionId === 41 ? secondAttempt : firstAttempt
    );
    vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId => ({
      ...mockModuleDetail,
      id: moduleId,
      skill: 'SPEAKING',
      taskType: 'RECORDING',
      answers: [{
        id: moduleId === 50 ? 60 : 61,
        questionId: null,
        content: null,
        audioStorageKey: `submissions/${moduleId}/audio.webm`,
        audioDownloadUrl: `https://storage.example.test/${moduleId}/audio.webm?signature=answer`,
      }],
    }));
    const { container } = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', 'https://storage.example.test/50/audio.webm?signature=answer'));
    let audio = container.querySelector('audio')!;
    configureAudio(audio!, 90);
    fireEvent.error(audio!);
    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', FALLBACK_AUDIO_URL));
    fireEvent.error(container.querySelector('audio')!);
    expect(await screen.findByText('Không thể tải audio bài nộp. Vui lòng thử lại.')).toBeVisible();
    expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledWith(50);

    await selectAttemptAndFlush(41);
    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', 'https://storage.example.test/51/audio.webm?signature=answer'));
    audio = container.querySelector('audio')!;
    expect(audio).toHaveAttribute('src', 'https://storage.example.test/51/audio.webm?signature=answer');
    configureAudio(audio!, 90);
    fireEvent.error(audio!);

    await waitFor(() => expect(container.querySelector('audio')).toHaveAttribute('src', FALLBACK_AUDIO_URL));
    expect(submissionService.getAudioDownloadUrl).toHaveBeenNthCalledWith(2, 51);
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

  function arrangeGradingModules() {
    vi.mocked(submissionService.getSubmission).mockResolvedValue({
      ...mockSubmission,
      modules: [
        mockSubmission.modules[0],
        { ...mockSubmission.modules[0], id: 51, skill: 'SPEAKING', taskType: 'RECORDING' },
        { ...mockSubmission.modules[0], id: 52, skill: 'READING', taskType: 'QUIZ' },
      ],
    });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async id => ({
      ...mockModuleDetail, id, moduleId: id + 100, skill: id === 51 ? 'SPEAKING' : id === 52 ? 'READING' : 'WRITING',
      questions: [{ id: 1, content: 'Question', questionType: 'SHORT_ANSWER', score: 1, orderIndex: 1 }],
      answers: [{
        id: id + 10,
        questionId: 1,
        content: { text: essayText },
        ...(id === 51 ? {
          audioStorageKey: 'current-speaking.webm',
          audioDownloadUrl: 'https://storage.example.test/current-speaking.webm?signature=answer',
        } : {}),
      }],
    }));
    return renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
  }

  it.each(['success', '403', '404', 'network', 'empty'] as const)(
    'grading guard ignores late A %s after B, including its finally', async outcome => {
      const view = arrangeGradingModules();
      await screen.findByText('Well structured essay.');
      const oldA = deferred<StudentGradingResult | null>();
      const newB = deferred<StudentGradingResult | null>();
      vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 50
        ? oldA.promise.then(value => {
          if (outcome === 'network') throw new Error('Old network failure');
          if (outcome === '403' || outcome === '404') throw new ApiClientError('Old failure', Number(outcome));
          return outcome === 'empty' ? null : value;
        })
        : newB.promise);
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Writing' }));
      expect(screen.queryByText('Well structured essay.')).not.toBeInTheDocument();
      expect(view.container.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Speaking' }));
      const currentResult = { ...publishedResult, submissionModuleId: 51, finalScore: 0, finalFeedback: 'Current B feedback', aiTranscript: 'Private transcript', reviewedBy: 'Private reviewer', reviewedAt: 'Private review time', aiInstructionSnapshot: 'Private instruction' };
      await act(async () => newB.resolve(currentResult));
      expect(await screen.findByText('Current B feedback')).toBeVisible();
      await act(async () => oldA.resolve({ ...publishedResult, finalScore: 19, finalFeedback: 'Late A feedback' }));
      expect(screen.getByText('Current B feedback')).toBeVisible();
      expect(view.container.querySelector('.result-hero-score-box')).toHaveTextContent('0/10');
      expect(screen.queryByText('Late A feedback')).not.toBeInTheDocument();
      for (const privateValue of ['Private reviewer', 'Private review time', 'Private instruction']) {
        expect(screen.queryByText(privateValue)).not.toBeInTheDocument();
      }
      expect(screen.getByText('Private transcript')).toBeVisible();
      expect(screen.queryByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.')).not.toBeInTheDocument();
      expect(view.container.querySelector('audio')).toHaveAttribute('src', 'https://storage.example.test/current-speaking.webm?signature=answer');
    },
  );

  it('grading guard keeps C during rapid A to B to A to C and does not reuse A', async () => {
    const view = arrangeGradingModules();
    await screen.findByText('Well structured essay.');
    const a = deferred<StudentGradingResult | null>();
    const b = deferred<StudentGradingResult | null>();
    const c = deferred<StudentGradingResult | null>();
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 50 ? a.promise : id === 51 ? b.promise : c.promise);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Speaking' }));
    await user.click(screen.getByRole('button', { name: 'Writing' }));
    expect(screen.queryByText('Well structured essay.')).not.toBeInTheDocument();
    expect(view.container.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reading' }));
    await act(async () => c.resolve({ ...publishedResult, finalScore: 6, finalFeedback: 'Current C feedback' }));
    await screen.findByText('Current C feedback');
    await act(async () => {
      b.resolve({ ...publishedResult, finalFeedback: 'Late B' });
      a.resolve({ ...publishedResult, finalFeedback: 'Late A' });
    });
    expect(screen.getByText('Current C feedback')).toBeVisible();
    expect(screen.queryByText('Late A')).not.toBeInTheDocument();
    expect(screen.queryByText('Late B')).not.toBeInTheDocument();
    expect(view.container.querySelector('.result-hero-score-box')).toHaveTextContent('6/10');
  });

  it.each(['PENDING', 'AI_GRADED', 'FAILED', 'missing', 'empty'] as const)(
    'clears a completed result when the next module grading is %s', async status => {
      const view = arrangeGradingModules();
      await screen.findByText('Well structured essay.');
      const pendingGrading = deferred<StudentGradingResult | null>();
      vi.mocked(gradingService.getStudentGradingResult).mockReturnValue(pendingGrading.promise);
      vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
        ...mockModuleDetail, id: 51, skill: 'SPEAKING',
        grading: status === 'missing' ? null : status === 'empty' ? {} as NonNullable<SubmissionModuleDetailResponse['grading']> : { ...mockModuleDetail.grading!, status },
      });
      await userEvent.setup().click(screen.getByRole('button', { name: 'Speaking' }));
      await waitFor(() => expect(gradingService.getStudentGradingResult).toHaveBeenCalledWith(51));
      expect(screen.queryByText('Well structured essay.')).not.toBeInTheDocument();
      expect(view.container.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
      expect(view.container).not.toHaveTextContent('0/10');
      await act(async () => pendingGrading.resolve(null));
      expect(view.container.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
    },
  );

  it('grading guard protects retry from an older module response', async () => {
    arrangeGradingModules();
    await screen.findByText('Well structured essay.');
    const oldA = deferred<StudentGradingResult | null>();
    const retry = deferred<StudentGradingResult | null>();
    let retryEnabled = false;
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 50
      ? oldA.promise
      : id === 51
        ? retryEnabled ? retry.promise : Promise.reject(new Error('Current grading unavailable'))
        : Promise.reject(new Error('Unexpected module')));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Writing' }));
    await user.click(screen.getByRole('button', { name: 'Speaking' }));
    await screen.findByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.');
    expect(screen.queryByText('Well structured essay.')).not.toBeInTheDocument();
    expect(document.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
    const callsBeforeRetry = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    retryEnabled = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(callsBeforeRetry)).toEqual([[51]]);
    await act(async () => retry.resolve({ ...publishedResult, submissionModuleId: 51, finalFeedback: 'Retry result' }));
    await screen.findByText('Retry result');
    await act(async () => oldA.resolve({ ...publishedResult, finalFeedback: 'Obsolete retry competitor' }));
    expect(screen.getByText('Retry result')).toBeVisible();
    expect(screen.queryByText('Obsolete retry competitor')).not.toBeInTheDocument();
    expect(screen.queryByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.')).not.toBeInTheDocument();
  });

  it('resolves the selected submission-module ID when two modules share a skill', () => {
    const sameSkillModules = [
      { ...mockSubmission.modules[0], id: 70, skill: 'WRITING' as const },
      { ...mockSubmission.modules[0], id: 71, skill: 'WRITING' as const },
    ];
    expect(sameSkillModules[0].skill).toBe(sameSkillModules[1].skill);

    const retryModuleId = resolveRetryModuleId(sameSkillModules, 71, undefined);
    expect(retryModuleId).toBe(71);
  });

  it('sends one request per retry click and keeps the first module retryable after failure', async () => {
    arrangeGradingModules();
    await screen.findByText('Well structured essay.');
    vi.mocked(gradingService.getStudentGradingResult).mockRejectedValue(new Error('Retry failed'));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Writing' }));
    expect(await screen.findByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.')).toBeVisible();

    const callsBeforeRetry = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    const retryButton = screen.getByRole('button', { name: 'Thử lại' });
    await act(async () => {
      fireEvent.click(retryButton);
      fireEvent.click(retryButton);
    });

    expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(callsBeforeRetry)).toEqual([[50]]);
    expect(screen.getByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Writing' })).toHaveClass('active');

    const callsBeforeNextRetry = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Thử lại' })));
    expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(callsBeforeNextRetry)).toEqual([[50]]);
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  });

  it('ignores a pending retry after selecting another module', async () => {
    arrangeGradingModules();
    await screen.findByText('Well structured essay.');
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 51
      ? Promise.reject(new Error('B grading failed'))
      : Promise.resolve({ ...publishedResult, submissionModuleId: id, finalFeedback: 'Current module result' }));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Speaking' }));
    expect(await screen.findByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.')).toBeVisible();

    const lateRetry = controllableRequest<StudentGradingResult | null>();
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 51
      ? lateRetry.promise
      : Promise.resolve({ ...publishedResult, submissionModuleId: id, finalFeedback: 'Current C feedback' }));
    const callsBeforeRetry = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(callsBeforeRetry)).toEqual([[51]]);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reading' }));
    expect(await screen.findByText('Current C feedback')).toBeVisible();

    await act(async () => lateRetry.resolve({ ...publishedResult, submissionModuleId: 51, finalFeedback: 'Late retry B feedback' }));
    expect(screen.getByText('Current C feedback')).toBeVisible();
    expect(screen.queryByText('Late retry B feedback')).not.toBeInTheDocument();
    expect(screen.queryByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.')).not.toBeInTheDocument();
  });

  it('does not continue a pending retry after unmount', async () => {
    const view = arrangeGradingModules();
    await screen.findByText('Well structured essay.');
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
      ...mockModuleDetail, id: 51, moduleId: 999, skill: 'SPEAKING', questions: [],
    });
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 51
      ? Promise.reject(new Error('B grading failed'))
      : Promise.resolve(publishedResult));
    await userEvent.setup().click(screen.getByRole('button', { name: 'Speaking' }));
    expect(await screen.findByText('Không thể tải kết quả chấm bài. Vui lòng thử lại.')).toBeVisible();

    const retryGrading = controllableRequest<StudentGradingResult | null>();
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 51
      ? retryGrading.promise
      : Promise.resolve(publishedResult));
    const questionCalls = vi.mocked(questionService.listQuestions).mock.calls.length;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Thử lại' }));
    const moduleCalls = vi.mocked(submissionService.getSubmissionModuleDetail).mock.calls.length;
    const gradingCalls = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    view.unmount();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => retryGrading.resolve({ ...publishedResult, finalFeedback: 'After retry unmount' }));

    expect(questionService.listQuestions).toHaveBeenCalledTimes(questionCalls);
    expect(submissionService.getSubmissionModuleDetail).toHaveBeenCalledTimes(moduleCalls);
    expect(gradingService.getStudentGradingResult).toHaveBeenCalledTimes(gradingCalls);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it.each([
    { kind: '403', requestError: new ApiClientError('Forbidden', 403) },
    { kind: '404', requestError: new ApiClientError('Not found', 404) },
    { kind: 'network', requestError: new Error('Network unavailable') },
  ])('ends canceled module loading and reports a $kind attempt-switch error', async ({ requestError }) => {
    const secondAttempt = { ...mockSubmission, id: 41, attemptNumber: 2 };
    arrangeAttempts([mockSubmission, secondAttempt]);
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    expect(await screen.findByText('Well structured essay.')).toBeVisible();

    const oldGrading = controllableRequest<StudentGradingResult | null>();
    vi.mocked(gradingService.getStudentGradingResult).mockReturnValue(oldGrading.promise);
    vi.mocked(submissionService.getSubmission).mockImplementation(id => id === 41
      ? Promise.reject(requestError)
      : Promise.resolve(mockSubmission));
    const callsBeforeReload = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Writing' }));
    await waitFor(() => expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(callsBeforeReload)).toEqual([[50]]));
    expect(screen.queryByText('Well structured essay.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /#101 GRAMMAR/ })).not.toBeInTheDocument();

    await selectAttemptAndFlush(41);
    expect(screen.getByText('Không thể tải lần nộp đã chọn. Vui lòng thử lại.')).toBeVisible();
    await act(async () => oldGrading.resolve({ ...publishedResult, finalFeedback: 'Late old attempt feedback' }));

    expect(screen.queryByText('Đang tải nhận xét...')).not.toBeInTheDocument();
    expect(screen.queryByText('Late old attempt feedback')).not.toBeInTheDocument();
    expect(screen.queryByText('Well structured essay.')).not.toBeInTheDocument();
    expect(document.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /#101 GRAMMAR/ })).not.toBeInTheDocument();
  });

  it.each([
    { kind: 'empty array', modules: [] },
    { kind: 'null modules', modules: null },
    { kind: 'undefined modules', modules: undefined },
  ])('clears the old result and shows empty state for a submission with $kind', async ({ modules }) => {
    const emptyAttempt = { ...mockSubmission, id: 41, attemptNumber: 2, modules } as unknown as SubmissionDetail;
    arrangeAttempts([mockSubmission, emptyAttempt]);
    vi.mocked(submissionService.getSubmission).mockImplementation(id => Promise.resolve(id === 41 ? emptyAttempt : mockSubmission));
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    expect(await screen.findByText('Well structured essay.')).toBeVisible();
    expect(await screen.findByRole('button', { name: /#101 GRAMMAR/ })).toBeVisible();
    const gradingCallsBeforeSwitch = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;

    await selectAttemptAndFlush(41);

    expect(screen.getByText('Chưa có dữ liệu mô-đun')).toBeVisible();
    expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(gradingCallsBeforeSwitch)).toEqual([]);
    expect(screen.queryByText('Well structured essay.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /#101 GRAMMAR/ })).not.toBeInTheDocument();
    expect(document.querySelector('.result-hero-score-box')).not.toBeInTheDocument();
    expect(screen.queryByText('Đang tải nhận xét...')).not.toBeInTheDocument();
  });

  it('ignores stale attempt responses in a rapid A to B to A to C switch with B failing', async () => {
    const firstOption = { ...mockSubmission, id: 39, attemptNumber: 1 };
    const secondAttempt = { ...mockSubmission, id: 41, attemptNumber: 2 };
    const thirdAttempt: SubmissionDetail = {
      ...mockSubmission,
      id: 43,
      attemptNumber: 3,
      modules: [{ ...mockSubmission.modules[0], id: 70, skill: 'READING', taskType: 'QUIZ' }],
    };
    const failedB = controllableRequest<SubmissionDetail>();
    const lateA = controllableRequest<SubmissionDetail>();
    const currentC = controllableRequest<SubmissionDetail>();
    arrangeAttempts([firstOption, mockSubmission, secondAttempt, thirdAttempt]);
    let submissionACalls = 0;
    vi.mocked(submissionService.getSubmission).mockImplementation(id => {
      if (id === 41) return failedB.promise;
      if (id === 43) return currentC.promise;
      if (id === 40 && submissionACalls++ > 0) return lateA.promise;
      return Promise.resolve(id === 39 ? firstOption : mockSubmission);
    });
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    expect(await screen.findByText('Well structured essay.')).toBeVisible();

    await selectAttemptAndFlush(41);
    await selectAttemptAndFlush(40);
    await selectAttemptAndFlush(43);
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
      ...mockModuleDetail, id: 70, skill: 'READING', questions: [],
    });
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(async id => ({
      ...publishedResult, submissionModuleId: id, finalFeedback: id === 70 ? 'Current attempt C feedback' : 'Late attempt A feedback',
    }));
    await act(async () => currentC.resolve(thirdAttempt));
    expect(await screen.findByText('Current attempt C feedback')).toBeVisible();

    await act(async () => {
      failedB.reject(new ApiClientError('Old attempt failed', 404));
      lateA.resolve(mockSubmission);
    });

    expect(screen.getByText('Current attempt C feedback')).toBeVisible();
    expect(screen.queryByText('Không thể tải lần nộp đã chọn. Vui lòng thử lại.')).not.toBeInTheDocument();
    expect(screen.queryByText('Late attempt A feedback')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reading' })).toHaveClass('active');
  });

  it('does not load a pending selected attempt after unmount', async () => {
    const firstOption = { ...mockSubmission, id: 39, attemptNumber: 1 };
    const secondAttempt = { ...mockSubmission, id: 41, attemptNumber: 2 };
    const pendingSubmission = controllableRequest<SubmissionDetail>();
    arrangeAttempts([firstOption, mockSubmission, secondAttempt]);
    vi.mocked(submissionService.getSubmission).mockImplementation(id => id === 41
      ? pendingSubmission.promise
      : Promise.resolve(id === 39 ? firstOption : mockSubmission));
    const view = renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    expect(await screen.findByText('Well structured essay.')).toBeVisible();

    const moduleCalls = vi.mocked(submissionService.getSubmissionModuleDetail).mock.calls.length;
    const gradingCalls = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    const annotationCalls = vi.mocked(answerAnnotationService.listAnnotations).mock.calls.length;
    await selectAttemptAndFlush(41);
    expect(submissionService.getSubmission).toHaveBeenCalledWith(41);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    view.unmount();
    await act(async () => pendingSubmission.resolve(secondAttempt));

    expect(submissionService.getSubmissionModuleDetail).toHaveBeenCalledTimes(moduleCalls);
    expect(gradingService.getStudentGradingResult).toHaveBeenCalledTimes(gradingCalls);
    expect(answerAnnotationService.listAnnotations).toHaveBeenCalledTimes(annotationCalls);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('recovers after a failed attempt switch by loading a valid attempt normally', async () => {
    const failedAttempt = { ...mockSubmission, id: 41, attemptNumber: 2 };
    const recoveredAttempt: SubmissionDetail = {
      ...mockSubmission,
      id: 42,
      attemptNumber: 3,
      modules: [{ ...mockSubmission.modules[0], id: 70, skill: 'WRITING' }],
    };
    arrangeAttempts([mockSubmission, failedAttempt, recoveredAttempt]);
    vi.mocked(submissionService.getSubmission).mockImplementation(id => id === 41
      ? Promise.reject(new ApiClientError('Not found', 404))
      : Promise.resolve(id === 42 ? recoveredAttempt : mockSubmission));
    vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async id => id === 70
      ? { ...mockModuleDetail, id: 70, answers: [{ id: 80, questionId: 1, content: { text: essayText } }] }
      : mockModuleDetail);
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(async id => ({
      ...publishedResult, submissionModuleId: id, finalFeedback: id === 70 ? 'Recovered attempt feedback' : 'Well structured essay.',
    }));
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');
    expect(await screen.findByText('Well structured essay.')).toBeVisible();
    await selectAttemptAndFlush(41);
    expect(screen.getByText('Không thể tải lần nộp đã chọn. Vui lòng thử lại.')).toBeVisible();
    const callsBeforeRecovery = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;

    await selectAttemptAndFlush(42);

    expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(callsBeforeRecovery)).toEqual([[70]]);
    expect(await screen.findByText('Recovered attempt feedback')).toBeVisible();
    expect(await screen.findByRole('button', { name: /#101 GRAMMAR/ })).toBeVisible();
    expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(80);
    expect(screen.queryByText('Không thể tải lần nộp đã chọn. Vui lòng thử lại.')).not.toBeInTheDocument();
  });

  it('continues to select the first module when switching to another attempt', async () => {
    const secondAttempt: SubmissionDetail = {
      ...mockSubmission,
      id: 41,
      attemptNumber: 2,
      modules: [
        { ...mockSubmission.modules[0], id: 70, skill: 'READING', taskType: 'QUIZ' },
        { ...mockSubmission.modules[0], id: 71, skill: 'SPEAKING', taskType: 'RECORDING' },
      ],
    };
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({
      data: [mockSubmission, secondAttempt],
      pagination: { page: 1, limit: 10, total: 2 },
    });
    vi.mocked(submissionService.getSubmission).mockImplementation(id => Promise.resolve(id === 41 ? secondAttempt : mockSubmission));
    vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async id => ({
      ...mockModuleDetail, id, skill: id === 70 ? 'READING' : id === 71 ? 'SPEAKING' : 'WRITING',
    }));
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(async id => ({
      ...publishedResult,
      submissionModuleId: id,
      finalFeedback: id === 50 ? 'Well structured essay.' : id === 70 ? 'First module of second attempt' : 'Unexpected module result',
    }));
    renderPage(<StudentSubmissionResult />, '/student/submissions/:id', '/student/submissions/40');

    expect(await screen.findByText('Well structured essay.')).toBeVisible();
    const callsBeforeAttemptSwitch = vi.mocked(gradingService.getStudentGradingResult).mock.calls.length;
    await userEvent.setup().selectOptions(screen.getByRole('combobox'), '41');

    expect(await screen.findByText('First module of second attempt')).toBeVisible();
    expect(vi.mocked(gradingService.getStudentGradingResult).mock.calls.slice(callsBeforeAttemptSwitch)).toEqual([[70]]);
    expect(screen.getByRole('button', { name: 'Reading' })).toHaveClass('active');
  });

  it('grading guard stops continuation and warnings after unmount', async () => {
    const view = arrangeGradingModules();
    await screen.findByText('Well structured essay.');
    const grading = deferred<StudentGradingResult | null>();
    vi.mocked(gradingService.getStudentGradingResult).mockReturnValue(grading.promise);
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...mockModuleDetail, questions: [], moduleId: 999 });
    const questionCalls = vi.mocked(questionService.listQuestions).mock.calls.length;
    await userEvent.setup().click(screen.getByRole('button', { name: 'Speaking' }));
    view.unmount();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => grading.resolve({ ...publishedResult, finalFeedback: 'After unmount' }));
    expect(questionService.listQuestions).toHaveBeenCalledTimes(questionCalls);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });


  it('grading finally guard keeps the current module loading when an old response finishes', async () => {
    arrangeGradingModules();
    await screen.findByText('Well structured essay.');
    const oldA = deferred<StudentGradingResult | null>();
    const currentB = deferred<StudentGradingResult | null>();
    vi.mocked(gradingService.getStudentGradingResult).mockImplementation(id => id === 50 ? oldA.promise : currentB.promise);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Writing' }));
    await user.click(screen.getByRole('button', { name: 'Speaking' }));
    await act(async () => oldA.resolve(null));
    expect(screen.getByText('Đang tải nhận xét...')).toBeVisible();
    await act(async () => currentB.resolve({ ...publishedResult, finalFeedback: 'B finished' }));
    expect(await screen.findByText('B finished')).toBeVisible();
    expect(screen.queryByText('Đang tải nhận xét...')).not.toBeInTheDocument();
  });

});
