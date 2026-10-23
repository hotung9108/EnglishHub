import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeacherSubmissionDetails from '../../pages/TeacherSubmissionDetails';
import { assignmentService } from '../../api/services/assignment.service';
import { submissionService, type SubmissionDetail, type SubmissionModuleDetailResponse } from '../../api/services/submission.service';
import { gradingService, type AiGradingSuggestionResponse } from '../../api/services/grading.service';
import { classService } from '../../api/services/class.service';
import { renderPage } from './renderPage';
import { deferred } from '../deferred';

vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn(), listAssignments: vi.fn() } }));
vi.mock('../../api/services/submission.service', async original => ({ ...await original<typeof import('../../api/services/submission.service')>(), submissionService: { listSubmissions: vi.fn(), getSubmission: vi.fn(), getSubmissionModuleDetail: vi.fn() } }));
vi.mock('../../api/services/grading.service', () => ({ gradingService: { getBySubmissionModuleId: vi.fn(), getAiSuggestion: vi.fn(), submitGrade: vi.fn(), requestAiAnalysis: vi.fn(), getById: vi.fn() } }));
vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn(), listMembers: vi.fn() } }));

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
  aiFeedback: 'Add supporting examples.', criteriaScores: null, metrics: null, annotations: [], transcript: null, modelUsed: 'AI Model', providerUsed: null,
  canTriggerAi: true, fallbackManualGradingAvailable: true, fallbackMessage: '',
};

beforeEach(() => {
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
    fireEvent.change(score, { target: { value: '-1' } });
    await user.click(screen.getByRole('button', { name: 'Save & Send score' }));
    expect(screen.getByText('Invalid score (range 0.0 - 10.0)!')).toBeVisible();
    fireEvent.change(score, { target: { value: '10' } });
    await user.click(screen.getByRole('button', { name: 'Save & Send score' }));
    expect(await screen.findByText('Grade finalized and published to student!')).toBeVisible();
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
    await user.type(screen.getByPlaceholderText('Ghi chú thêm về học viên này...'), 'Follow up');
    await user.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(await screen.findByText('Đã lưu điểm và trả bài cho học viên thành công!')).toBeVisible();
    expect(gradingService.submitGrade).toHaveBeenCalledExactlyOnceWith(80, { finalScore: Number(value), finalFeedback: 'Good progress', note: 'Follow up' });
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
    expect(gradingService.submitGrade).toHaveBeenCalledExactlyOnceWith(80, { finalScore: 10, finalFeedback: 'Add supporting examples.', note: '' });
  });

  it('finalizes the grade and returns to the assignment', async () => {
    const { user, score } = await setup();
    const pending = deferred<{ message: string }>();
    vi.mocked(gradingService.submitGrade).mockReturnValueOnce(pending.promise);
    await user.clear(score);
    await user.type(score, '8.5');
    await user.type(screen.getByPlaceholderText('Ghi chú thêm về học viên này...'), 'Final review');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu & Gửi điểm cho học sinh' }));
    expect(gradingService.submitGrade).toHaveBeenCalledExactlyOnceWith(80, { finalScore: 8.5, finalFeedback: 'Add supporting examples.', note: 'Final review' });
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
  it.todo('approves an annotation through the review button (UI not implemented)');
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
  if (storageKey) expect(container.querySelector('audio')).toHaveAttribute('src', storageKey.startsWith('http') ? storageKey : '/s3-upload/englishhub-dev/recordings/audio.mp3');
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
