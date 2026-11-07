import type { MouseEvent } from 'react';
import type { ButtonProps } from '../../components/common/Button';
import { ApiClientError } from '../../api/core/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeacherSubmissionDetails from '../../pages/TeacherSubmissionDetails';
import { assignmentService } from '../../api/services/assignment.service';
import { submissionService, type SubmissionDetail, type SubmissionModuleDetailResponse } from '../../api/services/submission.service';
import { gradingService, type AiGradingSuggestionResponse } from '../../api/services/grading.service';
import { classService } from '../../api/services/class.service';
import { answerAnnotationService, type GradingAnnotation } from '../../api/services/answer-annotation.service';
import { renderPage } from './renderPage';
import { deferred } from '../deferred';

const { buttonCallbacks } = vi.hoisted(() => ({ buttonCallbacks: new Map<string, () => void>() }));
vi.mock('../../components/common/Button', async original => {
  const actual = await original<typeof import('../../components/common/Button')>();
  return { ...actual, Button: (props: ButtonProps) => {
    if (props.onClick) {
      buttonCallbacks.set(props.className || String(props.children), () => props.onClick?.({} as MouseEvent<HTMLButtonElement>));
    }
    return <actual.Button {...props} />;
  } };
});

vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn(), listAssignments: vi.fn() } }));
vi.mock('../../api/services/submission.service', async original => ({ ...await original<typeof import('../../api/services/submission.service')>(), submissionService: { listSubmissions: vi.fn(), getSubmission: vi.fn(), getSubmissionModuleDetail: vi.fn() } }));
vi.mock('../../api/services/grading.service', () => ({ gradingService: { getBySubmissionModuleId: vi.fn(), getAiSuggestion: vi.fn(), submitGrade: vi.fn(), requestAiAnalysis: vi.fn(), getById: vi.fn() } }));
vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn(), listMembers: vi.fn() } }));
vi.mock('../../api/services/answer-annotation.service', () => ({ answerAnnotationService: { listAnnotations: vi.fn(), createAnnotation: vi.fn(), reviewAnnotation: vi.fn(), deleteAnnotation: vi.fn() } }));

const submission: SubmissionDetail = {
  id: 40, assignmentId: 12, studentId: 5, attemptNumber: 1, status: 'SUBMITTED', submittedAt: '2026-10-21T10:00:00Z', createdAt: '2026-10-21T09:00:00Z',
  modules: [{ id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'SUBMITTED', grading: null }],
};
const moduleDetail: SubmissionModuleDetailResponse = {
  id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'SUBMITTED', grading: null, questions: [],
  answers: [{ id: 60, questionId: 1, content: { text: 'My essay about the city.' } }],
};
const ai: AiGradingSuggestionResponse = {
  submissionModuleId: 50, gradingId: 80, skill: 'WRITING', status: 'AI_GRADED', suggestedScore: 7.5, maxScore: 10,
  aiFeedback: 'Add supporting examples.', criteriaScores: null, metrics: null, annotations: [{ id: 91, answerId: 60, source: 'AI', startOffset: 0, endOffset: 5, errorType: 'SPELLING', comment: 'Fix spelling', suggestedFix: 'The', reviewStatus: 'PENDING' }], transcript: [{ word: 'Hello' }, { word: 'city' }, 'essay'], modelUsed: 'AI Model', providerUsed: null,
  canTriggerAi: true, fallbackManualGradingAvailable: true, fallbackMessage: '',
};

beforeEach(() => {
  buttonCallbacks.clear();
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Weekly writing', status: 'PUBLISHED', modules: [] });
  vi.mocked(classService.list).mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [5, 6, 7].map((studentId, index) => ({ id: 40 + index, assignmentId: 12, studentId, attemptNumber: 1, status: 'SUBMITTED', submittedAt: null, modules: [] })), pagination: { page: 1, limit: 100, total: 3 } });
  vi.mocked(submissionService.getSubmission).mockResolvedValue(submission);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue(moduleDetail);
  vi.mocked(gradingService.getBySubmissionModuleId).mockResolvedValue({ id: 80, method: 'TEACHER_MANUAL', status: 'PENDING', finalScore: 7 });
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValue(ai);
  vi.mocked(gradingService.getById).mockRejectedValue(new Error('Optional grading detail unavailable'));
  vi.mocked(gradingService.submitGrade).mockResolvedValue({ message: 'Saved' });
  vi.mocked(gradingService.requestAiAnalysis).mockResolvedValue({ message: 'Queued' });
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [] });
});

async function setup(studentId = 5) {
  const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', `/teacher/assignments/12/submissions/${studentId}`);
  expect(screen.getByText('Đang tải bài làm học viên và phân tích AI...')).toBeVisible();
  await screen.findByRole('spinbutton');
  return { ...result, user: userEvent.setup(), score: screen.getByRole('spinbutton') };
}

describe('TeacherSubmissionDetails', () => {
  it('shows English grading controls and attachment placeholders (not real downloads)', async () => {
    vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, status: 'GRADED', submittedAt: null });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...moduleDetail, answers: [
      { id: 60, questionId: 1, content: 'word '.repeat(250), docStorageKey: 'essay.pdf', docMimeType: 'application/pdf' },

      { id: 62, questionId: 3, content: '' },
    ] });
    renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, 'en');
    const score = await screen.findByRole('spinbutton');


    const user = userEvent.setup();
    const downloads = screen.getAllByRole('button', { name: 'Tải xuống' });
    await user.click(downloads[0]);
    expect(screen.getByText('Preparing download...')).toBeVisible();
    const viewButtons = screen.getAllByRole('button', { name: 'Xem' });
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    await user.click(viewButtons[0]);
    expect(openSpy).toHaveBeenCalled();
    openSpy.mockRestore();

    await user.click(screen.getByRole('button', { name: 'Save feedback draft' }));
    expect(await screen.findByText('Grading draft saved!')).toBeVisible();
    fireEvent.change(score, { target: { value: '-1' } });
    await user.click(screen.getByRole('button', { name: 'Save & Send score' }));
    expect(screen.getByText('Invalid score (range 0.0 - 10.0)!')).toBeVisible();
    fireEvent.change(score, { target: { value: '10' } });
    await user.click(screen.getByRole('button', { name: 'Save & Send score' }));
    expect(await screen.findByText('Grade finalized and published to student!')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.click(screen.getByRole('button', { name: /Back to submissions list/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments/12');
  });

  it('shows English empty and error states and recovers on retry', async () => {
    vi.mocked(assignmentService.getAssignment).mockRejectedValueOnce(new Error('Offline'));
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
    vi.mocked(classService.list).mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
    renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, 'en');
    expect(await screen.findByText('Failed to load submission details. Please retry.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No submission found for this student')).toBeVisible();
    expect(screen.getByText(/Student #5/)).toBeVisible();
  });



  it('reports an English save failure', async () => {
    vi.mocked(gradingService.submitGrade).mockRejectedValue(new Error('Unavailable'));
    renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, 'en');
    await screen.findByRole('spinbutton');
    await userEvent.click(screen.getByRole('button', { name: 'Save & Send score' }));
    expect(await screen.findByText('Unavailable')).toBeVisible();
  });

  it('shows Vietnamese download placeholders and preserves the existing grade when AI has no score', async () => {
    vi.mocked(gradingService.getAiSuggestion).mockResolvedValue({ ...ai, suggestedScore: null, aiFeedback: null, modelUsed: null });
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...moduleDetail, answers: [
      { id: 60, questionId: 1, content: '', docStorageKey: 'essay.docx', docMimeType: null },

    ] });
    const { user, score } = await setup();
    expect(score).toHaveValue(7);
    const downloads = screen.getAllByRole('button', { name: 'Tải xuống' });
    await user.click(downloads[0]);
    expect(screen.getByText('Đang tạo liên kết tải tài liệu...')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Quay lại' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments/12');
  });
  it.each(['0.0', '7.5', '10.0'])('accepts typed score %s and saves the exact feedback payload', async (value) => {
    const { user, score } = await setup();
    await user.clear(score);
    await user.type(score, value);
    expect(score).toBeValid();
    fireEvent.change(screen.getByPlaceholderText('Nhập nhận xét chi tiết, lời khuyên và hướng khắc phục cho bài viết...'), { target: { value: 'Good progress' } });
    await user.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(await screen.findByText('Đã lưu điểm và trả bài cho học viên thành công!')).toBeVisible();
    expect(gradingService.submitGrade).toHaveBeenCalledExactlyOnceWith(80, { finalScore: Number(value), finalFeedback: 'Good progress' });
  });

  it.each(['-0.1', '10.1', '10.01', '', 'abc'])('rejects out-of-range or missing numeric value after typing %j', async (value) => {
    const { user, score } = await setup();
    await user.clear(score);
    if (value) await user.type(score, value);
    await user.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(screen.getByText('Điểm số không hợp lệ (thang 0.0 - 10.0)!')).toBeVisible();
    expect(gradingService.submitGrade).not.toHaveBeenCalled();
  });

  it('normalizes typed scientific notation 1e1 to score 10 in jsdom', async () => {
    const { user, score } = await setup();
    await user.clear(score);
    await user.type(score, '1e1');
    expect(score).toHaveValue(10);
    await user.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(gradingService.submitGrade).toHaveBeenCalledExactlyOnceWith(80, { finalScore: 10, finalFeedback: 'Add supporting examples.' });
  });

  it('finalizes the grade and returns to the assignment', async () => {
    const { user, score } = await setup();
    const pending = deferred<{ message: string }>();
    vi.mocked(gradingService.submitGrade).mockReturnValueOnce(pending.promise);
    await user.clear(score);
    await user.type(score, '8.5');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(gradingService.submitGrade).toHaveBeenCalledExactlyOnceWith(80, { finalScore: 8.5, finalFeedback: 'Add supporting examples.' });
    expect(screen.getByRole('button', { name: 'Đang lưu...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lưu bản nháp nhận xét' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Đang lưu...' }));
    expect(gradingService.submitGrade).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve({ message: 'Saved' }); await pending.promise; });
    expect(screen.getByText('Đã lưu điểm và trả bài cho học viên thành công!')).toBeVisible();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments/12');
  });

  it('shows a save failure and re-enables the controls', async () => {
    vi.mocked(gradingService.submitGrade).mockRejectedValue(new Error('Offline'));
    const { user } = await setup();
    await user.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(await screen.findByText('Offline')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' })).toBeEnabled();
  });





  it.each([
    [5, 'Trước', 7], [5, 'Tiếp', 6],
    [6, 'Trước', 5], [6, 'Tiếp', 7],
    [7, 'Tiếp', 5], [7, 'Trước', 6],
  ])('navigates from student %i using %s to student %i, including wraparound', async (studentId, name, expected) => {
    const { user } = await setup(studentId);
    await user.click(screen.getByRole('button', { name }));
    expect(screen.getByTestId('location')).toHaveTextContent(`/teacher/assignments/12/submissions/${expected}`);
  });

  it('shows the empty state if the student has not submitted', async () => {
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
    renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5');
    expect(await screen.findByText('Học viên này chưa nộp bài tập')).toBeVisible();
    expect(gradingService.submitGrade).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments/12');
  });

  it('shows a load error and successfully retries', async () => {
    vi.mocked(assignmentService.getAssignment).mockRejectedValueOnce(new Error('Offline'));
    renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5');
    expect(await screen.findByText('Không thể tải chi tiết bài nộp của học viên. Vui lòng thử lại.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('spinbutton')).toBeVisible();
  });

  it('uses AI score when no final grade exists', async () => {
    vi.mocked(gradingService.getBySubmissionModuleId).mockResolvedValue({ id: 80, method: 'AUTO', status: 'AI_GRADED', finalScore: null });
    const { score } = await setup();
    expect(score).toHaveValue(7.5);
  });

  it('blocks saving when the grading record lookup fails', async () => {
    vi.mocked(classService.list).mockRejectedValue(new Error('Offline'));
    vi.mocked(submissionService.getSubmissionModuleDetail).mockRejectedValue(new Error('Offline'));
    vi.mocked(gradingService.getBySubmissionModuleId).mockRejectedValue(new Error('Offline'));
    vi.mocked(gradingService.getAiSuggestion).mockRejectedValue(new Error('Offline'));
    const { user } = await setup();
    expect(screen.getByRole('heading', { name: 'Học viên #5' })).toBeVisible();
    expect(screen.getByText('Học viên đã nộp bài tập trực tuyến.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(screen.getByText('Chưa tìm thấy bản ghi chấm điểm của bài này.')).toBeVisible();
    expect(gradingService.submitGrade).not.toHaveBeenCalled();
  });

  it.each([
    { content: 'Plain essay', expected: 'Plain essay' },
    { content: { essay: 'Essay field' }, expected: 'Essay field' },
    { content: { answer: 'Answer field' }, expected: 'Answer field' },
    { content: { content: 'Content field' }, expected: 'Content field' },
    { content: { other: 'Unknown field' }, expected: '{"other":"Unknown field"}' },
    { content: 123, expected: '123' },
  ])('renders answer content $expected', async ({ content, expected }) => {
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...moduleDetail, answers: [{ id: 60, questionId: 1, content }] });
    await setup();
    expect(screen.getByText(expected)).toBeVisible();
  });

  // Annotation approval is absent in the current page. Track the missing UI
  // in the QA-32 report; do not mock a button that the user cannot access.
  it.todo('defines scoring precision (0.5 IELTS bands versus arbitrary decimals) before asserting 0.1 policy');
  it('approves, rejects, creates, filters and deletes annotations', async () => {
    const aiAnn: GradingAnnotation = {
      id: 1,
      source: 'AI',
      startOffset: 0,
      endOffset: 5,
      errorType: 'GRAMMAR',
      comment: 'Check tense',
      suggestedFix: 'went',
      reviewStatus: 'PENDING',
    };
    const teacherAnn: GradingAnnotation = {
      id: 2,
      source: 'TEACHER',
      startOffset: 10,
      endOffset: 15,
      errorType: null,
      comment: null,
      suggestedFix: null,
      reviewStatus: 'ACCEPTED',
    };
    const outOfBoundsAnn: GradingAnnotation = {
      id: 99,
      source: 'AI',
      startOffset: 9999,
      endOffset: 10000,
      errorType: 'SPELLING',
      comment: 'Out of bounds',
      suggestedFix: null,
      reviewStatus: 'PENDING',
    };
    vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [aiAnn, teacherAnn, outOfBoundsAnn] });
    vi.mocked(answerAnnotationService.reviewAnnotation).mockResolvedValue({ message: 'Updated' });
    vi.mocked(answerAnnotationService.createAnnotation).mockResolvedValue({ id: 3, message: 'Created' });
    vi.mocked(answerAnnotationService.deleteAnnotation).mockResolvedValue({ message: 'Deleted' });

    await setup();

    // 1. Test review failure error toast
    vi.mocked(answerAnnotationService.reviewAnnotation).mockRejectedValueOnce(new Error('Review failed'));
    await userEvent.click(screen.getAllByRole('button', { name: 'Duyệt' })[0]);
    expect(await screen.findByText('Review failed')).toBeVisible();

    // 2. Accept annotation
    vi.mocked(answerAnnotationService.reviewAnnotation).mockResolvedValueOnce({ message: 'Updated' });
    const acceptBtn = screen.getAllByRole('button', { name: 'Duyệt' })[0];
    await userEvent.click(acceptBtn);
    expect(answerAnnotationService.reviewAnnotation).toHaveBeenCalledWith(1, { reviewStatus: 'ACCEPTED' });

    // 3. Reject annotation
    const rejectBtn = screen.getAllByRole('button', { name: 'Từ chối' })[0];
    await userEvent.click(rejectBtn);
    expect(answerAnnotationService.reviewAnnotation).toHaveBeenCalledWith(1, { reviewStatus: 'REJECTED' });

    // 4. Filter annotations
    await userEvent.click(screen.getByRole('button', { name: /Chờ duyệt/ }));
    await userEvent.click(screen.getByRole('button', { name: /Đã duyệt/ }));
    await userEvent.click(screen.getByRole('button', { name: /Đã từ chối/ }));
    await userEvent.click(screen.getByRole('button', { name: /Tất cả/ }));

    // 5. Create annotation: validation then fill
    await userEvent.click(screen.getByRole('button', { name: 'Thêm chú thích' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hủy' }));
    await userEvent.click(screen.getByRole('button', { name: 'Thêm chú thích' }));
    await userEvent.click(screen.getByRole('button', { name: 'Lưu chú thích' }));
    expect(screen.getByText('Vui lòng nhập nhận xét cho chú thích.')).toBeVisible();

    // Test create failure
    vi.mocked(answerAnnotationService.createAnnotation).mockRejectedValueOnce(new Error('Create failed'));
    const commentInput0 = screen.getByPlaceholderText('Giải thích lỗi hoặc hướng dẫn sửa...');
    fireEvent.change(commentInput0, { target: { value: 'Temp comment' } });
    await userEvent.click(screen.getByRole('button', { name: 'Lưu chú thích' }));
    expect(await screen.findByText('Create failed')).toBeVisible();

    const typeSelect = screen.getByRole('combobox');
    fireEvent.change(typeSelect, { target: { value: 'VOCABULARY' } });
    const spinInputs = screen.getAllByRole('spinbutton');
    spinInputs.forEach((input) => fireEvent.change(input, { target: { value: '5' } }));
    const fixInput = screen.getByPlaceholderText('Nhập câu/từ gợi ý sửa...');
    fireEvent.change(fixInput, { target: { value: 'better' } });
    const commentInput = screen.getByPlaceholderText('Giải thích lỗi hoặc hướng dẫn sửa...');
    fireEvent.change(commentInput, { target: { value: 'Good word choice' } });
    await userEvent.click(screen.getByRole('button', { name: 'Lưu chú thích' }));
    expect(answerAnnotationService.createAnnotation).toHaveBeenCalled();

    // 6. Test delete failure error toast
    vi.mocked(answerAnnotationService.deleteAnnotation).mockRejectedValueOnce(new Error('Delete failed'));
    await userEvent.click(screen.getAllByRole('button', { name: 'Xóa' })[0]);
    expect(await screen.findByText('Delete failed')).toBeVisible();

    // 7. Delete annotation successfully
    vi.mocked(answerAnnotationService.deleteAnnotation).mockResolvedValueOnce({ message: 'Deleted' });
    const deleteBtns = screen.getAllByRole('button', { name: 'Xóa' });
    await userEvent.click(deleteBtns[0]);
    expect(answerAnnotationService.deleteAnnotation).toHaveBeenCalled();
  });
});


it.each([
  ['vi', 'https://storage.example.test/audio.mp3', true],
  ['en', '/recordings/audio.mp3', false],
  ['vi', null, false],
  ['en', null, true],
] as const)('shows speaking audio and AI feedback (%s, %s)', async (language, storageKey, hasFeedback) => {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, modules: [{ ...submission.modules[0], skill: 'SPEAKING', taskType: 'RECORDING' }] });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...moduleDetail, skill: 'SPEAKING', answers: storageKey ? [{ id: 60, questionId: 1, content: null, audioStorageKey: storageKey }] : [] });
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValue({ ...ai, skill: 'SPEAKING', aiFeedback: hasFeedback ? 'Speak clearly.' : null, suggestedScore: hasFeedback ? 8 : null });
  vi.mocked(gradingService.getById).mockResolvedValue({
    id: 80, submissionModuleId: 50, method: 'TEACHER_MANUAL', status: 'AI_GRADED', aiFeedback: hasFeedback ? 'Speak clearly.' : null,
    aiTranscript: null, finalScore: hasFeedback ? 8 : null, finalFeedback: hasFeedback ? 'Official feedback.' : null,
    maxScoreSnapshot: 10, reviewedBy: null, reviewedAt: null, gradedAt: null, aiInstructionSnapshot: null,
  });
  const { container } = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, language);
  const score = await screen.findByRole('spinbutton');
  if (storageKey) {
    const audioEl = container.querySelector('audio')!;
    expect(audioEl).toHaveAttribute('src', storageKey.startsWith('http') ? storageKey : '/s3-upload/englishhub-dev/recordings/audio.mp3');
    fireEvent.error(audioEl);
    expect(screen.getByText(language === 'vi' ? 'Không thể tải bản ghi âm.' : 'Failed to load audio.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: language === 'vi' ? 'Thử lại' : 'Retry' }));
  }
  else expect(screen.getByText(language === 'vi' ? 'Chưa tìm thấy bản ghi âm của học viên.' : 'No audio recording found.')).toBeVisible();
  fireEvent.change(score, { target: { value: '8.5' } });
  const feedback = container.querySelector('textarea')!;
  fireEvent.change(feedback, { target: { value: 'Teacher feedback.' } });
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: language === 'vi' ? /Chấm.*bằng AI/ : /.*[Gg]rade with AI/ }));
  expect(gradingService.requestAiAnalysis).toHaveBeenCalledExactlyOnceWith(50);
  expect(screen.getByRole('button', { name: language === 'vi' ? 'Đang chấm điểm...' : 'Grading...' })).toBeDisabled();
  expect(await screen.findByText(language === 'vi' ? 'AI đang phân tích và chấm điểm bài nói...' : 'AI is analyzing and grading the speaking submission...')).toBeVisible();
});
it.each(['vi', 'en'] as const)('reports AI request failures and allows retry (%s)', async language => {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, modules: [{ ...submission.modules[0], skill: 'SPEAKING' }] });
  vi.mocked(gradingService.requestAiAnalysis).mockRejectedValue(new Error('AI unavailable'));
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, language);
  await screen.findByRole('spinbutton');
  await userEvent.click(screen.getByRole('button', { name: language === 'vi' ? 'Chấm lại bằng AI' : 'Re-grade with AI' }));
  expect(await screen.findByText('AI unavailable')).toBeVisible();
  expect(screen.getByRole('button', { name: language === 'vi' ? 'Chấm lại bằng AI' : 'Re-grade with AI' })).toBeEnabled();
});
it('refreshes speaking grading after the AI request completes', async () => {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, modules: [{ ...submission.modules[0], skill: 'SPEAKING' }] });
  await setup();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Chấm lại bằng AI' })); });
  await act(() => vi.advanceTimersByTimeAsync(3500));
  expect(gradingService.getAiSuggestion).toHaveBeenCalledTimes(2);
  expect(screen.getByText('AI đã hoàn thành chấm điểm!')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Chấm lại bằng AI' })).toBeEnabled();
});
it.each(['assigned', 'fallback', 'error', 'route', 'route-error'] as const)('resolves student identity from %s', async mode => {
  if (mode === 'error' || mode === 'route-error') vi.mocked(classService.list).mockRejectedValue(new Error('Offline'));
  else if (mode !== 'route') {
    vi.mocked(classService.list).mockResolvedValue({ data: [{ id: 12, name: 'Class A', status: 'ACTIVE' }], pagination: { page: 1, limit: 100, total: 1 } });
    vi.mocked(assignmentService.listAssignments).mockResolvedValue({ data: mode === 'assigned' ? [{ id: 12, title: 'Weekly', status: 'PUBLISHED', closeAt: '2026-11-01T00:00:00Z', skills: ['WRITING'] }] : [], pagination: { page: 1, limit: 100, total: 1 } });
    vi.mocked(classService.listMembers).mockResolvedValue([{ memberId: 1, studentId: 5, fullName: 'Synthetic Student', email: 'student@example.test', studentCode: mode === 'assigned' ? 'QA-5' : undefined }]);
  }
  const state = mode.startsWith('route') ? { studentName: 'Route Student', studentEmail: 'route@example.test' } : undefined;
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', state);
  await screen.findByRole('spinbutton');
  expect(screen.getByRole('heading', { name: mode.startsWith('route') ? 'Route Student' : mode === 'error' ? 'Học viên #5' : 'Synthetic Student' })).toBeVisible();
});
it('honors the requested module and switches between Writing and Speaking', async () => {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, modules: [
    submission.modules[0], { ...submission.modules[0], id: 51, moduleId: 31, skill: 'SPEAKING', taskType: 'RECORDING', status: 'GRADED' },
  ] });
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  await screen.findByRole('spinbutton');
  expect(submissionService.getSubmissionModuleDetail).toHaveBeenCalledWith(50);
  await userEvent.click(screen.getByRole('button', { name: /SPEAKING/ }));
  await waitFor(() => expect(submissionService.getSubmissionModuleDetail).toHaveBeenCalledWith(51));
  await screen.findByRole('button', { name: 'Chấm lại bằng AI' });
  await userEvent.click(screen.getByRole('button', { name: 'WRITING' }));
  expect(await screen.findByText('My essay about the city.')).toBeVisible();
});
it('does not load grading or permit grading for an in-progress submission', async () => {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, status: 'IN_PROGRESS' });
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5');
  await screen.findByRole('spinbutton');
  expect(gradingService.getBySubmissionModuleId).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
  expect(screen.getByText('Chưa tìm thấy bản ghi chấm điểm của bài này.')).toBeVisible();
  expect(gradingService.submitGrade).not.toHaveBeenCalled();
});

it('navigates between student siblings using pager controls', async () => {
  await setup();
  await userEvent.click(screen.getByRole('button', { name: /Trước/ }));
  expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments/12/submissions/7');
  await userEvent.click(screen.getByRole('button', { name: /Tiếp/ }));
  expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments/12/submissions/5');
});

it('warns when grading record is not found on save', async () => {
  vi.mocked(gradingService.getBySubmissionModuleId).mockRejectedValueOnce(new Error('No record'));
  await setup();
  await userEvent.click(screen.getByRole('button', { name: /Lưu bản nháp nhận xét/ }));
  expect(screen.getByText('Chưa tìm thấy bản ghi chấm điểm của bài này.')).toBeVisible();
});

it('handles error when polling fails after AI analyze trigger', async () => {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, modules: [{ ...submission.modules[0], skill: 'SPEAKING' }] });
  await setup();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementationOnce(() => Promise.reject(new Error('Module poll failed')));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Chấm lại bằng AI' })); });
  await act(() => vi.advanceTimersByTimeAsync(3500));
  expect(screen.getByRole('button', { name: 'Chấm lại bằng AI' })).toBeEnabled();
});

it('falls back to AI suggestion annotations when answer annotation service fails', async () => {
  vi.mocked(answerAnnotationService.listAnnotations).mockRejectedValueOnce(new Error('Annotation service down'));
  await setup();
  expect(screen.getByText('Fix spelling')).toBeVisible();
  expect(screen.getByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).toBeVisible();
});

it('shows empty state when no annotations exist', async () => {
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValueOnce({ ...ai, annotations: [] });
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValueOnce({ data: [] });
  await setup();
  expect(screen.getByText('Chưa có gợi ý sửa lỗi từ AI')).toBeVisible();
});

it('extracts transcript as plain string', async () => {
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValueOnce({
    ...ai,
    transcript: 'Plain string audio transcript.',
  });
  await setup();
});

it('extracts transcript from object format', async () => {
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValueOnce({
    ...ai,
    transcript: null,
  });
  vi.mocked(gradingService.getById).mockResolvedValueOnce({
    id: 80,
    submissionModuleId: 50,
    method: 'AUTO',
    status: 'AI_GRADED',
    aiFeedback: 'Feedback',
    aiTranscript: { transcript: 'Object transcript text' },
    finalScore: 8,
    finalFeedback: 'Final',
    maxScoreSnapshot: 10,
    reviewedBy: null,
    reviewedAt: null,
    gradedAt: null,
    aiInstructionSnapshot: null,
  });
  await setup();
});

it('clears annotations when submission module has no answers', async () => {
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValueOnce({ ...ai, annotations: [] });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValueOnce({ ...moduleDetail, answers: [] });
  await setup();
  expect(screen.getByText('Chưa có gợi ý sửa lỗi từ AI')).toBeVisible();
});

it('shows a network error when listAnnotations fails and AI suggestion has no annotations', async () => {
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValueOnce({ ...ai, annotations: [] });
  vi.mocked(answerAnnotationService.listAnnotations).mockRejectedValueOnce(new Error('Network error'));
  await setup();
  expect(screen.getByText('Không tải được nhận xét. Vui lòng thử lại.')).toBeVisible();
  expect(screen.queryByText('Chưa có gợi ý sửa lỗi từ AI')).not.toBeInTheDocument();
});

it('falls back to detail.aiFeedback when finalFeedback is absent', async () => {
  vi.mocked(gradingService.getById).mockResolvedValueOnce({
    id: 80,
    submissionModuleId: 50,
    method: 'AUTO',
    status: 'AI_GRADED',
    aiFeedback: 'Fallback AI detail feedback',
    aiTranscript: null,
    finalScore: 8,
    finalFeedback: null,
    maxScoreSnapshot: 10,
    reviewedBy: null,
    reviewedAt: null,
    gradedAt: null,
    aiInstructionSnapshot: null,
  });
  await setup();
  expect(screen.getByDisplayValue('Fallback AI detail feedback')).toBeVisible();
});

it('returns null when rawTranscript is non-string and non-array', async () => {
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValueOnce({
    ...ai,
    transcript: 12345,
  });
  await setup();
});

it('falls back to AI annotations when listAnnotations fails but AI suggestion has annotations', async () => {
  vi.mocked(answerAnnotationService.listAnnotations).mockRejectedValueOnce(new Error('Network error'));
  await setup();
  expect(screen.getByText(/Fix spelling/)).toBeVisible();
});

it('handles English annotation review (accept, reject, delete) and empty states', async () => {
  const annItem: GradingAnnotation = {
    id: 91,
    source: 'AI',
    startOffset: 0,
    endOffset: 5,
    errorType: 'SPELLING',
    comment: 'Check spelling',
    suggestedFix: 'Hello',
    reviewStatus: 'PENDING',
  };
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [annItem] });
  vi.mocked(answerAnnotationService.reviewAnnotation).mockResolvedValue({ message: 'OK' });
  vi.mocked(answerAnnotationService.deleteAnnotation).mockResolvedValue({ message: 'OK' });

  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, 'en');
  await screen.findByRole('spinbutton');

  // Accept in English -> 'AI annotation accepted.'
  await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
  expect(await screen.findByText('AI annotation accepted.')).toBeVisible();

  // Reject in English -> 'AI annotation rejected.'
  await userEvent.click(screen.getByRole('button', { name: 'Reject' }));
  expect(await screen.findByText('AI annotation rejected.')).toBeVisible();

  // Filter with no matches in English -> 'No annotations in this filter'
  await userEvent.click(screen.getByRole('button', { name: /Pending/ }));
  expect(screen.getByText('No annotations in this filter')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: /All/ }));

  // Delete in English -> 'Annotation deleted.'
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(await screen.findByText('Annotation deleted.')).toBeVisible();
  expect(screen.getByText('No AI annotations available')).toBeVisible();

  // Delete failure toast in English
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValueOnce({ data: [annItem] });
  vi.mocked(answerAnnotationService.deleteAnnotation).mockRejectedValueOnce(new Error('Delete error'));
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, 'en');
  await screen.findByRole('spinbutton');
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
  expect(await screen.findByText('Delete error')).toBeVisible();
});

it.each(['vi', 'en'] as const)('shows empty online submission message when answer text and files are empty (%s)', async (lang) => {
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValueOnce({
    ...moduleDetail,
    answers: [{ id: 60, questionId: 1, content: '' }],
  });
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, lang);
  await screen.findByRole('spinbutton');
  expect(screen.getAllByText(lang === 'vi' ? '0 từ' : '0 words')[0]).toBeVisible();
  expect(screen.getByText(lang === 'vi' ? 'Học viên đã nộp bài tập trực tuyến.' : 'Student submitted the online assignment.')).toBeVisible();
});

it.each(['vi', 'en'] as const)('shows initial Grade with AI button label when no AI feedback exists (%s)', async (lang) => {
  vi.mocked(gradingService.getAiSuggestion).mockResolvedValueOnce({
    ...ai,
    aiFeedback: null,
  });
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5', undefined, lang);
  await screen.findByRole('spinbutton');
  expect(screen.getByRole('button', { name: lang === 'vi' ? 'Chấm bài bằng AI' : 'Grade with AI' })).toBeVisible();
});

it('handles AI refresh polling error gracefully', async () => {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...submission, modules: [{ ...submission.modules[0], skill: 'SPEAKING' }] });
  await setup();
  vi.mocked(submissionService.getSubmissionModuleDetail).mockRejectedValueOnce(new Error('Refresh failed'));
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Chấm lại bằng AI' })); });
  await act(() => vi.advanceTimersByTimeAsync(3500));
  expect(screen.getByRole('button', { name: 'Chấm lại bằng AI' })).toBeEnabled();
  vi.useRealTimers();
});


it('does not warn when annotations come from GET', async () => {
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [{
    id: 92, source: 'AI', startOffset: 0, endOffset: 5, errorType: 'GRAMMAR',
    suggestedFix: null, comment: 'GET annotations result', reviewStatus: 'PENDING',
  }] });
  await setup();
  expect(screen.getByText('GET annotations result')).toBeVisible();
  expect(screen.queryByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).not.toBeInTheDocument();
});

it.each(['empty GET', 'missing answer'])('preserves the fallback trigger for %s', async trigger => {
  if (trigger === 'missing answer') {
    vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...moduleDetail, answers: [] });
  }
  await setup();
  expect(screen.getByText('Fix spelling')).toBeVisible();
  expect(screen.getByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).toBeVisible();
  if (trigger === 'missing answer') expect(answerAnnotationService.listAnnotations).not.toHaveBeenCalled();
});

it.each([403, 404, 500])('keeps fallback annotations with a warning when GET returns %s', async status => {
  vi.mocked(answerAnnotationService.listAnnotations).mockRejectedValue(new ApiClientError('GET failed', status));
  await setup();
  expect(screen.getByText('Fix spelling')).toBeVisible();
  expect(screen.getByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).toBeVisible();
});

for (const fallback of ['empty', 'failed'] as const) {
  it.each([
    { status: 403, message: 'Bạn không có quyền xem nhận xét của bài này.' },
    { status: 404, message: 'Không tìm thấy nhận xét của bài này.' },
    { status: 500, message: 'Không tải được nhận xét. Vui lòng thử lại.' },
  ])(`shows GET $status errors when fallback is ${fallback}`, async ({ status, message }) => {
    vi.mocked(answerAnnotationService.listAnnotations).mockRejectedValue(new ApiClientError('GET failed', status));
    if (fallback === 'empty') {
      vi.mocked(gradingService.getAiSuggestion).mockResolvedValue({ ...ai, annotations: [] });
    } else {
      vi.mocked(gradingService.getAiSuggestion).mockRejectedValue(new Error('AI suggestion unavailable'));
    }
    await setup();
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.queryByText('Chưa có gợi ý sửa lỗi từ AI')).not.toBeInTheDocument();
    expect(screen.queryByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).not.toBeInTheDocument();
  });
}

type AnnotationListResult = Awaited<ReturnType<typeof answerAnnotationService.listAnnotations>>;

function controlledRequest<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function makeAnnotation(id: number, comment: string, reviewStatus: GradingAnnotation['reviewStatus'] = 'PENDING'): GradingAnnotation {
  return {
    id,
    source: 'AI',
    startOffset: 0,
    endOffset: 5,
    errorType: 'GRAMMAR',
    comment,
    suggestedFix: null,
    reviewStatus,
  };
}

function makeModuleDetail(moduleId: number, answerId: number, skill: SubmissionModuleDetailResponse['skill']): SubmissionModuleDetailResponse {
  return {
    ...moduleDetail,
    id: moduleId,
    skill,
    answers: [{ id: answerId, questionId: 1, content: `Answer ${answerId}` }],
  };
}

const twoModules: SubmissionDetail = {
  ...submission,
  modules: [
    { ...submission.modules[0], id: 50, skill: 'WRITING' },
    { ...submission.modules[0], id: 51, skill: 'SPEAKING', taskType: 'RECORDING' },
  ],
};

it('clears the previous module immediately and ignores its late annotation response', async () => {
  const previousAnnotation = makeAnnotation(101, 'Previous module annotation');
  const currentAnnotation = makeAnnotation(102, 'Current module annotation');
  const previousRequest = controlledRequest<AnnotationListResult>();
  const currentRequest = controlledRequest<AnnotationListResult>();
  let previousAnswerCalls = 0;
  vi.mocked(submissionService.getSubmission).mockResolvedValue(twoModules);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId =>
    moduleId === 50 ? makeModuleDetail(50, 60, 'WRITING') : makeModuleDetail(51, 61, 'SPEAKING'));
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(answerId => {
    if (answerId === 60) {
      previousAnswerCalls += 1;
      return previousAnswerCalls === 1
        ? Promise.resolve({ data: [previousAnnotation] })
        : previousRequest.promise;
    }
    return currentRequest.promise;
  });

  const { user } = await (async () => {
    const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
    await screen.findByRole('spinbutton');
    return { ...result, user: userEvent.setup() };
  })();
  expect(screen.getByText('Previous module annotation')).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'WRITING' }));
  await waitFor(() => expect(previousAnswerCalls).toBeGreaterThan(1));
  await user.click(screen.getByRole('button', { name: 'SPEAKING' }));
  await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(61));

  expect(screen.queryByText('Previous module annotation')).not.toBeInTheDocument();
  expect(screen.getByText('Đang tải gợi ý sửa lỗi...')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Duyệt' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Từ chối' })).not.toBeInTheDocument();

  await act(async () => {
    currentRequest.resolve({ data: [currentAnnotation] });
    await currentRequest.promise;
  });
  expect(await screen.findByText('Current module annotation')).toBeVisible();

  await act(async () => {
    previousRequest.resolve({ data: [previousAnnotation] });
    await previousRequest.promise;
  });
  expect(screen.getByText('Current module annotation')).toBeVisible();
  expect(screen.queryByText('Previous module annotation')).not.toBeInTheDocument();
});

it('ignores stale responses in a rapid A to B to A to C module sequence', async () => {
  const aAnnotation = makeAnnotation(201, 'A annotation');
  const bAnnotation = makeAnnotation(202, 'B annotation');
  const cAnnotation = makeAnnotation(203, 'C annotation');
  const secondARequest = controlledRequest<AnnotationListResult>();
  const bRequest = controlledRequest<AnnotationListResult>();
  const cRequest = controlledRequest<AnnotationListResult>();
  let aCalls = 0;
  vi.mocked(submissionService.getSubmission).mockResolvedValue({
    ...submission,
    modules: [
      ...twoModules.modules,
      { ...submission.modules[0], id: 52, skill: 'READING', taskType: 'QUIZ' },
    ],
  });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId => {
    if (moduleId === 50) return makeModuleDetail(50, 60, 'WRITING');
    if (moduleId === 51) return makeModuleDetail(51, 61, 'SPEAKING');
    return makeModuleDetail(52, 62, 'READING');
  });
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(answerId => {
    if (answerId === 60) {
      aCalls += 1;
      return aCalls === 1 ? Promise.resolve({ data: [aAnnotation] }) : secondARequest.promise;
    }
    if (answerId === 61) return bRequest.promise;
    return cRequest.promise;
  });

  const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  const user = userEvent.setup();
  await screen.findByRole('spinbutton');
  expect(screen.getByText('A annotation')).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'SPEAKING' }));
  await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(61));
  await user.click(screen.getByRole('button', { name: 'WRITING' }));
  await waitFor(() => expect(aCalls).toBeGreaterThan(1));
  expect(screen.queryByText('A annotation')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'READING' }));
  await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(62));

  await act(async () => {
    cRequest.resolve({ data: [cAnnotation] });
    await cRequest.promise;
  });
  expect(await screen.findByText('C annotation')).toBeVisible();
  await act(async () => {
    bRequest.resolve({ data: [bAnnotation] });
    secondARequest.resolve({ data: [aAnnotation] });
    await Promise.all([bRequest.promise, secondARequest.promise]);
  });

  expect(screen.getByText('C annotation')).toBeVisible();
  expect(screen.queryByText('A annotation')).not.toBeInTheDocument();
  expect(screen.queryByText('B annotation')).not.toBeInTheDocument();
  expect(aCalls).toBeGreaterThanOrEqual(2);
  result.unmount();
});

it('clears and reloads annotations when the answer changes within the same module and when returning', async () => {
  const firstAnswerAnnotation = makeAnnotation(301, 'First answer annotation');
  const nextAnswerAnnotation = makeAnnotation(302, 'Next answer annotation');
  const nextModuleDetail = controlledRequest<SubmissionModuleDetailResponse>();
  const previousModuleDetail = controlledRequest<SubmissionModuleDetailResponse>();
  let moduleDetailCalls = 0;
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(() => {
    moduleDetailCalls += 1;
    if (moduleDetailCalls === 1) return Promise.resolve(makeModuleDetail(50, 60, 'WRITING'));
    if (moduleDetailCalls === 2) return nextModuleDetail.promise;
    return previousModuleDetail.promise;
  });
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(answerId =>
    Promise.resolve({ data: [answerId === 60 ? firstAnswerAnnotation : nextAnswerAnnotation] }));

  const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  const user = userEvent.setup();
  await screen.findByRole('spinbutton');
  expect(screen.getByText('First answer annotation')).toBeVisible();

  await user.click(screen.getByRole('button', { name: /Tiếp/ }));
  await waitFor(() => expect(moduleDetailCalls).toBe(2));
  expect(screen.queryByText('First answer annotation')).not.toBeInTheDocument();
  await act(async () => {
    nextModuleDetail.resolve(makeModuleDetail(50, 61, 'WRITING'));
    await nextModuleDetail.promise;
  });
  expect(await screen.findByText('Next answer annotation')).toBeVisible();
  expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(61);

  await user.click(screen.getByRole('button', { name: /Trước/ }));
  await waitFor(() => expect(moduleDetailCalls).toBe(3));
  expect(screen.queryByText('Next answer annotation')).not.toBeInTheDocument();
  await act(async () => {
    previousModuleDetail.resolve(makeModuleDetail(50, 60, 'WRITING'));
    await previousModuleDetail.promise;
  });
  expect(await screen.findByText('First answer annotation')).toBeVisible();
  expect(vi.mocked(answerAnnotationService.listAnnotations).mock.calls.filter(([answerId]) => answerId === 60)).toHaveLength(2);
  result.unmount();
});

it.each([
  ['403', new ApiClientError('Old answer forbidden', 403)],
  ['404', new ApiClientError('Old answer missing', 404)],
  ['network', new Error('Old answer network failure')],
] as const)('ignores a stale annotation GET %s failure after switching modules', async (_kind, staleError) => {
  const previousRequest = controlledRequest<AnnotationListResult>();
  const currentAnnotation = makeAnnotation(401, 'Current answer survives');
  let previousAnswerCalls = 0;
  vi.mocked(submissionService.getSubmission).mockResolvedValue(twoModules);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId =>
    moduleId === 50 ? makeModuleDetail(50, 60, 'WRITING') : makeModuleDetail(51, 61, 'SPEAKING'));
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(answerId => {
    if (answerId === 60) {
      previousAnswerCalls += 1;
      return previousAnswerCalls === 1
        ? Promise.resolve({ data: [makeAnnotation(400, 'Previous answer') ] })
        : previousRequest.promise;
    }
    return Promise.resolve({ data: [currentAnnotation] });
  });

  const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  const user = userEvent.setup();
  await screen.findByRole('spinbutton');
  await user.click(screen.getByRole('button', { name: 'WRITING' }));
  await waitFor(() => expect(previousAnswerCalls).toBeGreaterThan(1));
  await user.click(screen.getByRole('button', { name: 'SPEAKING' }));
  expect(await screen.findByText('Current answer survives')).toBeVisible();

  await act(async () => {
    previousRequest.reject(staleError);
    await previousRequest.promise.catch(() => undefined);
  });
  expect(screen.getByText('Current answer survives')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).not.toBeInTheDocument();
  result.unmount();
});

it('does not apply a stale AI-suggestion fallback or warning to the selected answer', async () => {
  const staleFallback = { ...ai, annotations: [{ ...ai.annotations[0], id: 501, comment: 'Old AI fallback' }] };
  const previousGet = controlledRequest<AnnotationListResult>();
  let aiCallsForA = 0;
  vi.mocked(submissionService.getSubmission).mockResolvedValue(twoModules);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId =>
    moduleId === 50 ? makeModuleDetail(50, 60, 'WRITING') : makeModuleDetail(51, 61, 'SPEAKING'));
  vi.mocked(gradingService.getAiSuggestion).mockImplementation(async moduleId => {
    if (moduleId === 50) {
      aiCallsForA += 1;
      return aiCallsForA === 1 ? { ...ai, annotations: [] } : staleFallback;
    }
    return { ...ai, annotations: [] };
  });
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(answerId => {
    if (answerId === 60) return aiCallsForA === 1 ? Promise.resolve({ data: [] }) : previousGet.promise;
    return Promise.resolve({ data: [] });
  });

  const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  const user = userEvent.setup();
  await screen.findByRole('spinbutton');
  expect(screen.getByText('Chưa có gợi ý sửa lỗi từ AI')).toBeVisible();

  await user.click(screen.getByRole('button', { name: 'WRITING' }));
  await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledTimes(2));
  await user.click(screen.getByRole('button', { name: 'SPEAKING' }));
  await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledWith(61));
  expect(screen.getByText('Chưa có gợi ý sửa lỗi từ AI')).toBeVisible();
  expect(screen.queryByText('Old AI fallback')).not.toBeInTheDocument();
  expect(screen.queryByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).not.toBeInTheDocument();

  await act(async () => {
    previousGet.resolve({ data: [] });
    await previousGet.promise;
  });
  expect(screen.getByText('Chưa có gợi ý sửa lỗi từ AI')).toBeVisible();
  expect(screen.queryByText('Old AI fallback')).not.toBeInTheDocument();
  expect(screen.queryByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).not.toBeInTheDocument();
  result.unmount();
});

it('ignores an AI suggestion that resolves after another module is selected', async () => {
  const lateSuggestion = controlledRequest<AiGradingSuggestionResponse>();
  const currentAnnotation = makeAnnotation(551, 'Current module GET annotation');
  let suggestionCallsForA = 0;
  vi.mocked(submissionService.getSubmission).mockResolvedValue(twoModules);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId =>
    moduleId === 50 ? makeModuleDetail(50, 60, 'WRITING') : makeModuleDetail(51, 61, 'SPEAKING'));
  vi.mocked(gradingService.getAiSuggestion).mockImplementation(moduleId => {
    if (moduleId === 50) {
      suggestionCallsForA += 1;
      return suggestionCallsForA === 1
        ? Promise.resolve({ ...ai, annotations: [] })
        : lateSuggestion.promise;
    }
    return Promise.resolve({ ...ai, annotations: [] });
  });
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(async answerId => ({
    data: answerId === 61 ? [currentAnnotation] : [],
  }));

  const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  const user = userEvent.setup();
  await screen.findByRole('spinbutton');
  await user.click(screen.getByRole('button', { name: 'WRITING' }));
  await waitFor(() => expect(suggestionCallsForA).toBeGreaterThan(1));
  await user.click(screen.getByRole('button', { name: 'SPEAKING' }));
  expect(await screen.findByText('Current module GET annotation')).toBeVisible();

  await act(async () => {
    lateSuggestion.resolve({
      ...ai,
      annotations: [{ ...ai.annotations[0], id: 552, comment: 'Late AI suggestion annotation' }],
    });
    await lateSuggestion.promise;
  });
  expect(screen.getByText('Current module GET annotation')).toBeVisible();
  expect(screen.queryByText('Late AI suggestion annotation')).not.toBeInTheDocument();
  expect(screen.queryByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).not.toBeInTheDocument();
  result.unmount();
});

it.each([
  ['no answers', []],
  ['undefined answerId', [{ id: undefined, questionId: 1, content: 'Undefined id' }]],
  ['null answerId', [{ id: null, questionId: 1, content: 'Null id' }]],
  ['missing answerId', [{ questionId: 1, content: 'Missing id' }]],
] as const)('keeps fallback review controls disabled for %s', async (_case, answers) => {
  const malformedAnswers = answers as unknown as SubmissionModuleDetailResponse['answers'];
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ ...moduleDetail, answers: malformedAnswers });
  await setup();

  expect(screen.getByText('Fix spelling')).toBeVisible();
  expect(screen.getByText('Đang hiển thị dữ liệu nhận xét dự phòng từ gợi ý AI.')).toBeVisible();
  expect(answerAnnotationService.listAnnotations).not.toHaveBeenCalled();
  const accept = screen.getByRole('button', { name: 'Duyệt' });
  const reject = screen.getByRole('button', { name: 'Từ chối' });
  expect(accept).toBeDisabled();
  expect(reject).toBeDisabled();
  await act(async () => {
    buttonCallbacks.get('tsd-btn-review-accept')!();
    buttonCallbacks.get('tsd-btn-review-reject')!();
  });
  expect(answerAnnotationService.reviewAnnotation).not.toHaveBeenCalled();
});

it.each(['ACCEPTED', 'REJECTED'] as const)('ignores a late %s response after switching to another answer', async status => {
  const previousReview = controlledRequest<{ message: string }>();
  const currentAnnotation = makeAnnotation(602, 'Current pending annotation');
  vi.mocked(submissionService.getSubmission).mockResolvedValue(twoModules);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId =>
    moduleId === 50 ? makeModuleDetail(50, 60, 'WRITING') : makeModuleDetail(51, 61, 'SPEAKING'));
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(async answerId => ({
    data: [answerId === 60 ? makeAnnotation(601, 'Previous pending annotation') : currentAnnotation],
  }));
  vi.mocked(answerAnnotationService.reviewAnnotation).mockReturnValueOnce(previousReview.promise);

  const result = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  const user = userEvent.setup();
  await screen.findByRole('spinbutton');
  const reviewButton = screen.getByRole('button', { name: status === 'ACCEPTED' ? 'Duyệt' : 'Từ chối' });
  await user.click(reviewButton);
  expect(answerAnnotationService.reviewAnnotation).toHaveBeenCalledWith(601, { reviewStatus: status });

  await user.click(screen.getByRole('button', { name: 'SPEAKING' }));
  expect(await screen.findByText('Current pending annotation')).toBeVisible();
  await act(async () => {
    previousReview.resolve({ message: 'Updated' });
    await previousReview.promise;
  });

  expect(screen.getByText('Current pending annotation')).toBeVisible();
  expect(screen.getByText('Chờ duyệt')).toBeVisible();
  expect(screen.queryByText(status === 'ACCEPTED' ? 'Đã duyệt gợi ý của AI.' : 'Đã từ chối gợi ý của AI.')).not.toBeInTheDocument();
  result.unmount();
});

it('does not update annotation state after unmount while a GET is pending', async () => {
  const pendingGet = controlledRequest<AnnotationListResult>();
  let answerCalls = 0;
  vi.mocked(submissionService.getSubmission).mockResolvedValue(twoModules);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async moduleId =>
    moduleId === 50 ? makeModuleDetail(50, 60, 'WRITING') : makeModuleDetail(51, 61, 'SPEAKING'));
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(() => {
    answerCalls += 1;
    return answerCalls === 1
      ? Promise.resolve({ data: [makeAnnotation(701, 'Loaded before unmount')] })
      : pendingGet.promise;
  });
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const { container, unmount, user } = await setup();
  const reviewAfterUnmount = buttonCallbacks.get('tsd-btn-review-accept')!;
  await user.click(screen.getByRole('button', { name: 'WRITING' }));
  await waitFor(() => expect(answerCalls).toBeGreaterThan(1));
  const getCalls = vi.mocked(gradingService.getAiSuggestion).mock.calls.length;
  unmount();

  await act(async () => {
    pendingGet.resolve({ data: [makeAnnotation(702, 'Arrived after unmount')] });
    await pendingGet.promise;
  });
  await act(async () => { reviewAfterUnmount(); });
  expect(answerAnnotationService.reviewAnnotation).not.toHaveBeenCalled();
  expect(gradingService.getAiSuggestion).toHaveBeenCalledTimes(getCalls);
  expect(container).toBeEmptyDOMElement();
  expect(screen.queryByText('Arrived after unmount')).not.toBeInTheDocument();
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

it('keeps all four annotation filters and valid Accept/Reject flows working', async () => {
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [
    makeAnnotation(801, 'Pending annotation', 'PENDING'),
    makeAnnotation(802, 'Accepted annotation', 'ACCEPTED'),
    makeAnnotation(803, 'Rejected annotation', 'REJECTED'),
  ] });
  vi.mocked(answerAnnotationService.reviewAnnotation).mockResolvedValue({ message: 'Updated' });
  const { user } = await setup();

  await user.click(screen.getByRole('button', { name: /Chờ duyệt/ }));
  expect(screen.getByText('Pending annotation')).toBeVisible();
  expect(screen.queryByText('Accepted annotation')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Đã duyệt/ }));
  expect(screen.getByText('Accepted annotation')).toBeVisible();
  expect(screen.queryByText('Pending annotation')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Đã từ chối/ }));
  expect(screen.getByText('Rejected annotation')).toBeVisible();
  expect(screen.queryByText('Accepted annotation')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /Tất cả/ }));
  expect(screen.getByText('Pending annotation')).toBeVisible();
  expect(screen.getByText('Accepted annotation')).toBeVisible();
  expect(screen.getByText('Rejected annotation')).toBeVisible();

  await user.click(screen.getAllByRole('button', { name: 'Duyệt' })[0]);
  expect(answerAnnotationService.reviewAnnotation).toHaveBeenCalledWith(801, { reviewStatus: 'ACCEPTED' });
  await user.click(screen.getAllByRole('button', { name: 'Từ chối' })[0]);
  expect(answerAnnotationService.reviewAnnotation).toHaveBeenCalledWith(801, { reviewStatus: 'REJECTED' });
});

async function remediationSetup() {
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...twoModules, modules: [
    ...twoModules.modules, { ...submission.modules[0], id: 52, skill: 'READING', taskType: 'QUIZ' },
  ] });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(async id =>
    ({ ...makeModuleDetail(id, id + 10, id === 50 ? 'WRITING' : id === 51 ? 'SPEAKING' : 'READING'),
      ...(id === 51 ? { answers: [{ id: 61, questionId: null, content: null, audioStorageKey: 'module-b.webm' }] } : {}) }));
  vi.mocked(gradingService.getBySubmissionModuleId).mockImplementation(async id => ({ id: id + 30, method: 'AUTO', status: 'COMPLETED', finalScore: id === 50 ? 7 : 9 }));
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(async id => ({ data: [makeAnnotation(id, `Answer note ${id}`)] }));
  const view = renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5?moduleId=50');
  await screen.findByText('Answer note 60');
  return { ...view, user: userEvent.setup() };
}

async function selectRemediationModule(name: string, answerId: number) {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name })); });
  expect(screen.getByText(`Answer note ${answerId}`)).toBeVisible();
}

async function prepareCreate(comment: string) {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Thêm chú thích' })); });
  fireEvent.change(screen.getByPlaceholderText('Giải thích lỗi hoặc hướng dẫn sửa...'), { target: { value: comment } });
  return buttonCallbacks.get('Lưu chú thích')!;
}

it.each(['switch', 'return', 'unmount'] as const)('R3 timer cancellation on %s', async mode => {
  const view = await remediationSetup();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => { buttonCallbacks.get('Chấm lại bằng AI')!(); });
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  if (mode === 'unmount') view.unmount();
  else {
    await selectRemediationModule('SPEAKING', 61);
    if (mode === 'return') await selectRemediationModule('WRITING', 60);
  }
  const calls = vi.mocked(submissionService.getSubmissionModuleDetail).mock.calls.length;
  expect(vi.getTimerCount()).toBe(0);
  await act(() => vi.advanceTimersByTimeAsync(3500));
  expect(submissionService.getSubmissionModuleDetail).toHaveBeenCalledTimes(calls);
  if (mode === 'switch') {
    expect(screen.getByText('Answer note 61')).toBeVisible();
    expect(screen.getByRole('spinbutton')).toHaveValue(9);
    expect(view.container.querySelector('audio')).toHaveAttribute('src', expect.stringContaining('module-b.webm'));
  }
  if (mode === 'unmount') expect(view.container).toBeEmptyDOMElement();
});

it('R3 AI repeated callback sends one request and one poll', async () => {
  await remediationSetup();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const callback = buttonCallbacks.get('Chấm lại bằng AI')!;
  await act(async () => { callback(); callback(); });
  expect(gradingService.requestAiAnalysis).toHaveBeenCalledTimes(1);
  const calls = vi.mocked(submissionService.getSubmissionModuleDetail).mock.calls.length;
  await act(() => vi.advanceTimersByTimeAsync(3500));
  expect(submissionService.getSubmissionModuleDetail).toHaveBeenCalledTimes(calls + 1);
  expect(screen.getByText('AI đã hoàn thành chấm điểm!')).toBeVisible();
});

it.each(['success', 'error', 'unmount'] as const)('R3 pending AI %s cannot schedule work in another context', async outcome => {
  const view = await remediationSetup();
  const pending = controlledRequest<{ message: string }>();
  vi.mocked(gradingService.requestAiAnalysis).mockReturnValue(pending.promise);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => { buttonCallbacks.get('Chấm lại bằng AI')!(); });
  if (outcome === 'unmount') view.unmount();
  else await selectRemediationModule('SPEAKING', 61);
  await act(async () => {
    if (outcome !== 'error') pending.resolve({ message: 'Queued' });
    else pending.reject(new Error('Old AI error'));
  });
  expect(vi.getTimerCount()).toBe(0);
  if (outcome === 'unmount') expect(view.container).toBeEmptyDOMElement();
  else expect(screen.getByText('Answer note 61')).toBeVisible();
  expect(screen.queryByText('Old AI error')).not.toBeInTheDocument();
});

it.each(['response', 'navigation timer', 'unmount timer', 'stale callback'] as const)('R3 grade %s cannot apply after switching context', async mode => {
  const view = await remediationSetup();
  const pending = controlledRequest<{ message: string }>();
  vi.mocked(gradingService.submitGrade).mockReturnValue(pending.promise);
  const callback = buttonCallbacks.get('Lưu & Gửi điểm cho học sinh')!;
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  if (mode !== 'stale callback') await act(async () => { callback(); });
  if (mode === 'navigation timer' || mode === 'unmount timer') await act(async () => pending.resolve({ message: 'Saved' }));
  if (mode === 'unmount timer') view.unmount();
  else await selectRemediationModule('SPEAKING', 61);
  if (mode === 'stale callback') {
    await act(async () => { callback(); });
    expect(gradingService.submitGrade).not.toHaveBeenCalled();
  } else if (mode === 'response') await act(async () => pending.resolve({ message: 'Saved' }));
  expect(vi.getTimerCount()).toBe(0);
  await act(() => vi.advanceTimersByTimeAsync(1000));
  if (mode === 'unmount timer') expect(view.container).toBeEmptyDOMElement();
  else expect(screen.getByTestId('location')).toHaveTextContent('/submissions/5');
  expect(screen.queryByText('Đã lưu điểm và trả bài cho học viên thành công!')).not.toBeInTheDocument();
});

for (const operation of ['create', 'delete'] as const) {
  it.each(['success', 'error', 'unmount', 'rapid'] as const)(`R3 ${operation} ignores old %s`, async outcome => {
    const view = await remediationSetup();
    const pending = controlledRequest<{ id: number; message: string }>();
    vi.mocked(answerAnnotationService.createAnnotation).mockReturnValue(pending.promise);
    vi.mocked(answerAnnotationService.deleteAnnotation).mockReturnValue(pending.promise);
    const callback = operation === 'create' ? await prepareCreate('Old created item') : buttonCallbacks.get('tsd-btn-delete-ann')!;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await act(async () => { callback(); });
    if (outcome === 'unmount') view.unmount();
    else {
      await selectRemediationModule('SPEAKING', 61);
      if (outcome === 'rapid') {
        await selectRemediationModule('WRITING', 60);
        await selectRemediationModule('READING', 62);
      }
    }
    const apiCalls = vi.mocked(answerAnnotationService.createAnnotation).mock.calls.length + vi.mocked(answerAnnotationService.deleteAnnotation).mock.calls.length;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => {
      if (outcome === 'error') pending.reject(new Error('Old mutation error'));
      else pending.resolve({ id: 999, message: 'Updated' });
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(consoleError).not.toHaveBeenCalled();
    expect(screen.queryByText('Old created item')).not.toBeInTheDocument();
    expect(screen.queryByText('Old mutation error')).not.toBeInTheDocument();
    if (outcome === 'unmount') {
      expect(view.container).toBeEmptyDOMElement();
      await act(async () => { callback(); });
      expect(vi.mocked(answerAnnotationService.createAnnotation).mock.calls.length + vi.mocked(answerAnnotationService.deleteAnnotation).mock.calls.length).toBe(apiCalls);
    } else expect(screen.getByText(`Answer note ${outcome === 'rapid' ? 62 : 61}`)).toBeVisible();
    consoleError.mockRestore();
  });

  it(`R3 ${operation} old finally cannot unlock a new operation on the same answer`, async () => {
    await remediationSetup();
    const oldRequest = controlledRequest<{ id: number; message: string }>();
    const newRequest = controlledRequest<{ id: number; message: string }>();
    if (operation === 'create') vi.mocked(answerAnnotationService.createAnnotation).mockReturnValueOnce(oldRequest.promise).mockReturnValue(newRequest.promise);
    else vi.mocked(answerAnnotationService.deleteAnnotation).mockReturnValueOnce(oldRequest.promise).mockReturnValue(newRequest.promise);
    const first = operation === 'create' ? await prepareCreate('First item') : buttonCallbacks.get('tsd-btn-delete-ann')!;
    await act(async () => { first(); });
    await selectRemediationModule('SPEAKING', 61);
    await selectRemediationModule('WRITING', 60);
    const second = operation === 'create' ? await prepareCreate('Second item') : buttonCallbacks.get('tsd-btn-delete-ann')!;
    await act(async () => { second(); });
    await act(async () => oldRequest.resolve({ id: 998, message: 'Old done' }));
    expect(screen.getByRole('button', { name: operation === 'create' ? 'Lưu chú thích' : 'Xóa' })).toBeDisabled();
    await act(async () => newRequest.resolve({ id: 999, message: 'New done' }));
    if (operation === 'create') expect(screen.getByText('Second item')).toBeVisible();
    else expect(screen.queryByText('Answer note 60')).not.toBeInTheDocument();
  });

  it(`R3 ${operation} double callback sends one valid request`, async () => {
    await remediationSetup();
    const pending = controlledRequest<{ id: number; message: string }>();
    vi.mocked(answerAnnotationService.createAnnotation).mockReturnValue(pending.promise);
    vi.mocked(answerAnnotationService.deleteAnnotation).mockReturnValue(pending.promise);
    const callback = operation === 'create' ? await prepareCreate('Valid item') : buttonCallbacks.get('tsd-btn-delete-ann')!;
    await act(async () => { callback(); callback(); });
    const service = operation === 'create' ? answerAnnotationService.createAnnotation : answerAnnotationService.deleteAnnotation;
    expect(service).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ id: 999, message: 'Updated' }));
    if (operation === 'create') expect(screen.getByText('Valid item')).toBeVisible();
    else expect(screen.queryByText('Answer note 60')).not.toBeInTheDocument();
  });
}

it.each(['loading', 'mismatch', 'unmount'] as const)('R3 real callbacks reject %s context', async mode => {
  const view = await remediationSetup();
  const create = await prepareCreate('Do not send');
  const review = buttonCallbacks.get('tsd-btn-review-accept')!;
  const remove = buttonCallbacks.get('tsd-btn-delete-ann')!;
  if (mode === 'unmount') view.unmount();
  else if (mode === 'loading') {
    vi.mocked(submissionService.getSubmissionModuleDetail).mockReturnValue(controlledRequest<SubmissionModuleDetailResponse>().promise);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'WRITING' })); });
  } else await selectRemediationModule('SPEAKING', 61);
  await act(async () => { create(); review(); remove(); });
  expect(answerAnnotationService.createAnnotation).not.toHaveBeenCalled();
  expect(answerAnnotationService.reviewAnnotation).not.toHaveBeenCalled();
  expect(answerAnnotationService.deleteAnnotation).not.toHaveBeenCalled();
});

it.each([null, {}])('R3 invalid Create response %j does not add an item and releases loading', async response => {
  await remediationSetup();
  vi.mocked(answerAnnotationService.createAnnotation).mockResolvedValue(response as unknown as Awaited<ReturnType<typeof answerAnnotationService.createAnnotation>>);
  const create = await prepareCreate('Invalid item');
  await act(async () => { create(); });
  expect(screen.queryByText('Invalid item', { selector: '.tsd-ann-comment-val' })).not.toBeInTheDocument();
  expect(screen.getByText('Không thể thêm chú thích.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Lưu chú thích' })).toBeEnabled();
});

it('R3 Delete refuses an id no longer in the current list', async () => {
  await remediationSetup();
  vi.mocked(answerAnnotationService.deleteAnnotation).mockResolvedValue({ message: 'Deleted' });
  const remove = buttonCallbacks.get('tsd-btn-delete-ann')!;
  await act(async () => { remove(); });
  expect(screen.queryByText('Answer note 60')).not.toBeInTheDocument();
  await act(async () => { remove(); });
  expect(answerAnnotationService.deleteAnnotation).toHaveBeenCalledTimes(1);
});

it('R3 polling response cannot toast after switching during the refresh', async () => {
  await remediationSetup();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => { buttonCallbacks.get('Chấm lại bằng AI')!(); });
  const pending = controlledRequest<SubmissionModuleDetailResponse>();
  vi.mocked(submissionService.getSubmissionModuleDetail).mockImplementation(id => id === 50 ? pending.promise : Promise.resolve({
    ...makeModuleDetail(51, 61, 'SPEAKING'), answers: [{ id: 61, questionId: null, content: null, audioStorageKey: 'module-b.webm' }],
  }));
  await act(() => vi.advanceTimersByTimeAsync(3500));
  await selectRemediationModule('SPEAKING', 61);
  await act(async () => pending.resolve(makeModuleDetail(50, 60, 'WRITING')));
  expect(screen.getByText('Answer note 61')).toBeVisible();
  expect(screen.queryByText('AI đã hoàn thành chấm điểm!')).not.toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0);
});

it.each([undefined, null])('R3 Create callback rejects missing answerId %s', async answerId => {
  await remediationSetup();
  const create = await prepareCreate('Old draft');
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
    ...moduleDetail, answers: [{ id: answerId, questionId: 1, content: 'Missing id' } as unknown as SubmissionModuleDetailResponse['answers'][number]],
  });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'WRITING' })); });
  await act(async () => { create(); });
  expect(answerAnnotationService.createAnnotation).not.toHaveBeenCalled();
});
