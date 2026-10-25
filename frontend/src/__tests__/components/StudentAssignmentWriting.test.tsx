import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router-dom';
import StudentAssignmentWriting from '../../pages/StudentAssignmentWriting';
import { assignmentService } from '../../api/services/assignment.service';
import { moduleService } from '../../api/services/module.service';
import { submissionService } from '../../api/services/submission.service';
import { renderPage } from './renderPage';
import { deferred } from '../deferred';

const { auth } = vi.hoisted(() => ({ auth: { user: { id: 5 } as { id: number } | null } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({ moduleService: { getModule: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: {
  listSubmissions: vi.fn(), getSubmission: vi.fn(), startAttempt: vi.fn(), submitModule: vi.fn(), submitSubmission: vi.fn(), getSubmissionModuleDetail: vi.fn(), getDocumentUploadUrl: vi.fn(),
} }));

beforeEach(() => {
  auth.user = { id: 5 };
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Writing practice', status: 'PUBLISHED', modules: [{ id: 30, skill: 'WRITING' }] });
  vi.mocked(moduleService.getModule).mockResolvedValue({ id: 30, skill: 'WRITING', taskType: 'ESSAY', instructions: 'Describe your city.', orderIndex: 1, maxScore: 10 });
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [{ id: 40, assignmentId: 12, studentId: 5, attemptNumber: 2, status: 'IN_PROGRESS', submittedAt: null, modules: [] }], pagination: { page: 1, limit: 1, total: 1 } });
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ id: 40, studentId: 5, assignmentId: 12, status: 'IN_PROGRESS', submittedAt: null, createdAt: '2026-10-22T00:00:00Z', modules: [{ id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'IN_PROGRESS', grading: null }], attemptNumber: 2 });
  vi.mocked(submissionService.startAttempt).mockResolvedValue({ id: 40, assignmentId: 12, attemptNumber: 1, status: 'IN_PROGRESS', createdAt: '2026-10-21T10:00:00Z', modules: [] });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'IN_PROGRESS', grading: null, answers: [], questions: [{ id: 91, content: 'Describe your city.', questionType: 'SHORT_ANSWER', score: 10, orderIndex: 1 }] });
  vi.mocked(submissionService.submitModule).mockResolvedValue({ message: 'Saved', submissionModuleId: 50, status: 'SUBMITTED', answers: [] });
  vi.mocked(submissionService.submitSubmission).mockResolvedValue({ message: 'Submitted', status: 'SUBMITTED', submittedAt: '2026-10-21T10:00:00Z' });
});

async function setup(entry = '/student/writing/12') {
  const result = renderPage(<StudentAssignmentWriting />, '/student/writing/:id', entry);
  await screen.findByText('Describe your city.');
  await waitFor(() => expect(submissionService.getSubmission).toHaveBeenCalled());
  return { ...result, user: userEvent.setup(), editor: screen.getByRole('textbox') };
}

describe('StudentAssignmentWriting', () => {
  it('does not overwrite the current assignment when an earlier route loads late', async () => {
    const previous = deferred<Awaited<ReturnType<typeof assignmentService.getAssignment>>>();
    vi.mocked(assignmentService.getAssignment).mockImplementation((id) => id === 12 ? previous.promise : Promise.resolve({ id: 13, title: 'Current assignment', status: 'PUBLISHED', modules: [{ id: 31, skill: 'WRITING' }] }));
    vi.mocked(moduleService.getModule).mockImplementation((id) => Promise.resolve({ id, instructions: id === 31 ? 'Current instructions' : 'Stale instructions', skill: 'WRITING', taskType: 'ESSAY', orderIndex: 1, maxScore: 10 }));
    renderPage(<><Link to="/student/writing/13">Open next assignment</Link><StudentAssignmentWriting /></>, '/student/writing/:id', '/student/writing/12');
    await userEvent.click(screen.getByRole('link', { name: 'Open next assignment' }));
    expect(await screen.findByText('Current instructions')).toBeVisible();
    await act(async () => {
      previous.resolve({ id: 12, title: 'Stale assignment', status: 'PUBLISHED', modules: [{ id: 30, skill: 'WRITING' }] });
      await previous.promise;
    });
    expect(screen.getByText('Current assignment')).toBeVisible();
    expect(screen.getByText('Current instructions')).toBeVisible();
    expect(screen.queryByText('Stale assignment')).not.toBeInTheDocument();
    expect(screen.queryByText('Stale instructions')).not.toBeInTheDocument();
  });
  it.each([['', 0], ['   \n\t ', 0], ['Hello', 1], ['  Hello   world\nfrom\tVietnam  ', 4]])('counts words for %j', async (text, count) => {
    const { editor } = await setup();
    fireEvent.change(editor, { target: { value: text } });
    expect(screen.getByText(/Đếm từ:/)).toHaveTextContent(`Đếm từ: ${count} / 150-250 từ`);
  });

  it.each(['', '  \n\t '])('warns and prevents submission for an empty essay (%j)', async (text) => {
    const { user, editor } = await setup();
    fireEvent.change(editor, { target: { value: text } });
    await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
    expect(screen.getByText('Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm trước khi nộp.')).toBeVisible();
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(screen.queryByText('Vui lòng nhập nội dung bài luận hoặc tải lên tệp bài làm trước khi nộp.')).not.toBeInTheDocument());
  });

  it('restores and saves the assignment draft, then clears the editor', async () => {
    localStorage.setItem('eh_draft_writing_12', 'Existing draft');
    const { user, editor } = await setup();
    expect(editor).toHaveValue('Existing draft');
    fireEvent.change(editor, { target: { value: 'Updated draft' } });
    await user.click(screen.getByRole('button', { name: /Lưu bản nháp/ }));
    expect(localStorage.getItem('eh_draft_writing_12')).toBe('Updated draft');
    expect(screen.getByText('Đã lưu bản nháp!')).toBeVisible();
    await user.click(screen.getByRole('button', { name: /Xóa bài viết/ }));
    expect(editor).toHaveValue('');
    expect(screen.getByText(/Đếm từ:/)).toHaveTextContent('Đếm từ: 0');
  });

  it('hides the saved-draft confirmation after three seconds without losing the draft', async () => {
    const { editor } = await setup();
    fireEvent.change(editor, { target: { value: 'Saved essay' } });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.click(screen.getByRole('button', { name: /Lưu bản nháp/ }));
    expect(screen.getByText('Đã lưu bản nháp!')).toBeVisible();
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(screen.queryByText('Đã lưu bản nháp!')).not.toBeInTheDocument();
    expect(localStorage.getItem('eh_draft_writing_12')).toBe('Saved essay');
  });

  it('renders an assignment without modules without starting an attempt for a missing user', async () => {
    auth.user = null;
    vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Writing practice', status: 'PUBLISHED', modules: [] });
    renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
    expect(await screen.findByText(/Yêu cầu: Hoàn thành bài viết/)).toBeVisible();
    expect(moduleService.getModule).not.toHaveBeenCalled();
    expect(submissionService.listSubmissions).not.toHaveBeenCalled();
    expect(submissionService.startAttempt).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('submits the essay, clears the draft and opens the submission result', async () => {
    const { editor } = await setup();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    fireEvent.change(editor, { target: { value: 'My essay text' } });
    localStorage.setItem('eh_draft_writing_12', 'Old draft');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ })); });
    expect(screen.getByText(/Nộp bài thành công!/)).toBeVisible();
    // Assert text persistence without blessing the currently hard-coded ID.
    // Actual question mapping is required by a separate red reproduction.
    expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(50, {
      answers: [expect.objectContaining({ content: { text: 'My essay text' } })],
    });
    expect(submissionService.submitSubmission).toHaveBeenCalledExactlyOnceWith(40);
    expect(vi.mocked(submissionService.submitModule).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(submissionService.submitSubmission).mock.invocationCallOrder[0]);
    expect(localStorage.getItem('eh_draft_writing_12')).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent('/student/submissions/40');
  });

  it('resolves the submission from the URL instead of starting another attempt', async () => {
    await setup('/student/writing/12?submissionId=40');
    expect(submissionService.getSubmission).toHaveBeenCalledWith(40);
    expect(submissionService.listSubmissions).not.toHaveBeenCalled();
    expect(submissionService.startAttempt).not.toHaveBeenCalled();
  });

  it('finds the current attempt when the optional submissionId query is malformed', async () => {
    await setup('/student/writing/12?submissionId=invalid');
    expect(submissionService.listSubmissions).toHaveBeenCalledExactlyOnceWith({ assignmentId: 12, studentId: 5, status: 'IN_PROGRESS', limit: 1 });
    expect(submissionService.getSubmission).toHaveBeenCalledExactlyOnceWith(40);
    expect(submissionService.startAttempt).not.toHaveBeenCalled();
  });

  it('starts an attempt if no in-progress submission exists', async () => {
    vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [], pagination: { page: 1, limit: 1, total: 0 } });
    await setup();
    expect(submissionService.startAttempt).toHaveBeenCalledWith(12);
  });

  it('shows the chosen filename and replaces it on drop', async () => {
    const { user, container } = await setup();
    const input = container.querySelector('input[type="file"]');
    if (!input) throw new Error('Upload input missing');
    const file = new File(['essay'], 'essay.pdf', { type: 'application/pdf' });
    await user.upload(input as HTMLInputElement, file);
    expect(screen.getByText('essay.pdf')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Xóa tệp đã chọn' }));
    const dropzone = container.querySelector('.writing-dropzone')!;
    fireEvent.dragOver(dropzone);
    fireEvent.dragLeave(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [new File(['new'], 'new.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })] } });
    expect(screen.getByText('new.docx')).toBeVisible();
    fireEvent.drop(dropzone, { dataTransfer: { files: [] } });
    fireEvent.change(input, { target: { files: [] } });
    expect(screen.getByText('new.docx')).toBeVisible();
  });

  it('renders fallback instructions when assignment/module endpoints are unavailable', async () => {
    vi.mocked(assignmentService.getAssignment).mockRejectedValue(new Error('Offline'));
    vi.mocked(moduleService.getModule).mockRejectedValue(new Error('Offline'));
    renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12?submissionId=40');
    expect(await screen.findByText(/Yêu cầu: Hoàn thành bài viết/)).toBeVisible();
    expect(assignmentService.getAssignment).toHaveBeenCalledWith(12);
    expect(submissionService.startAttempt).not.toHaveBeenCalled();
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });
});

it.each(['READING', 'LISTENING', 'SPEAKING'] as const)('redirects an assignment without Writing to %s', async skill => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Other skill', status: 'PUBLISHED', modules: [{ id: 30, skill }] });
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12?submissionId=40');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/student/assignments/' + skill.toLowerCase() + '/12'));
  expect(submissionService.getSubmission).not.toHaveBeenCalled();
});
it('blocks submitting a closed assignment', async () => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Closed', status: 'CLOSED', modules: [{ id: 30, skill: 'WRITING' }] });
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [], pagination: { page: 1, limit: 1, total: 0 } });
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
  await screen.findByText('Bài tập này đã được giáo viên đóng. Học viên không thể làm bài hoặc nộp bài.');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Essay' } });
  await userEvent.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  expect(screen.getByText('Bài tập này đã được giáo viên đóng. Không thể nộp bài.')).toBeVisible();
  expect(submissionService.startAttempt).not.toHaveBeenCalled();
  expect(submissionService.submitModule).not.toHaveBeenCalled();
});
it.each([
  ['invalid.txt', 'text/plain', 4, 'Định dạng tệp không được hỗ trợ.'],
  ['large.pdf', 'application/pdf', 10 * 1024 * 1024 + 1, 'Kích thước tệp vượt quá giới hạn 10MB.'],
])('rejects invalid upload %s', async (name, type, size, message) => {
  const { container } = await setup();
  const file = new File(['data'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  fireEvent.drop(container.querySelector('.writing-dropzone')!, { dataTransfer: { files: [file] } });
  expect(screen.getByText(new RegExp(message))).toBeVisible();
  expect(screen.queryByText(name)).not.toBeInTheDocument();
});
it.each(['application/pdf', ''])('waits for file upload before submitting (%s)', async type => {
  const { container, user } = await setup();
  const file = new File(['essay'], 'essay.pdf', { type });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  const pending = deferred<Awaited<ReturnType<typeof submissionService.getDocumentUploadUrl>>>();
  vi.mocked(submissionService.getDocumentUploadUrl).mockReturnValueOnce(pending.promise);
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  expect(submissionService.getDocumentUploadUrl).toHaveBeenCalledExactlyOnceWith(50, 'application/pdf');
  expect(submissionService.submitModule).not.toHaveBeenCalled();
  await act(async () => { pending.resolve({ uploadUrl: 'https://storage.example.test/upload', storageKey: 'essay.pdf', expiresAt: '2026-10-22T12:00:00Z' }); await pending.promise; });
  await waitFor(() => expect(submissionService.submitSubmission).toHaveBeenCalledWith(40));
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith('https://storage.example.test/upload', { method: 'PUT', body: file, headers: { 'Content-Type': type || 'application/octet-stream' } });
});
it.each(['IN_PROGRESS', 'SUBMITTED', 'GRADED'] as const)('handles remaining Reading module in state %s', async status => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Combined', status: 'PUBLISHED', modules: [{ id: 30, skill: 'WRITING' }, { id: 31, skill: 'READING' }] });
  const original = await submissionService.getSubmission(40);
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ ...original, modules: [...original.modules, { id: 51, moduleId: 31, skill: 'READING', taskType: 'QUIZ', status, grading: null }] });
  const { editor } = await setup();
  fireEvent.change(editor, { target: { value: 'Complete essay' } });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ })); });
  if (status === 'IN_PROGRESS') {
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(screen.getByText(/Đang chuyển tiếp sang/)).toBeVisible();
    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(screen.getByTestId('location')).toHaveTextContent('/student/assignments/reading/12');
  } else {
    expect(submissionService.submitSubmission).toHaveBeenCalledWith(40);
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(screen.getByTestId('location')).toHaveTextContent('/student/submissions/40');
  }
});
it('opens picker by mouse or keyboard and supports replacing a selected file', async () => {
  const { container, user } = await setup();
  const input = container.querySelector('input[type="file"]')!;
  const picker = vi.spyOn(input as HTMLInputElement, 'click');
  const zone = container.querySelector('.writing-dropzone')!;
  fireEvent.keyDown(zone, { key: 'Enter' }); fireEvent.keyDown(zone, { key: ' ' }); fireEvent.keyDown(zone, { key: 'Escape' });
  await user.click(zone);
  expect(picker).toHaveBeenCalledTimes(3);
  fireEvent.change(input, { target: { files: [new File(['x'], 'essay.pdf', { type: 'application/pdf' })] } });
  await user.click(screen.getByRole('button', { name: 'Đổi tệp' }));
  expect(picker).toHaveBeenCalledTimes(4);
  fireEvent.click(screen.getByText('Trang chủ'));
  expect(screen.getByTestId('location')).toHaveTextContent('/student/dashboard');
});

it('displays docx file metadata when word document is uploaded', async () => {
  const { container } = await setup();
  const file = new File(['docx content'], 'document.docx', {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  expect(screen.getByText(/Tệp Word \(DOCX\)/)).toBeVisible();
});

it('displays error when loading url submission fails', async () => {
  vi.mocked(submissionService.getSubmission).mockRejectedValue(new Error('Fetch submission error'));
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12?submissionId=99');
  expect(await screen.findByText('Fetch submission error')).toBeVisible();
});

it('redirects to submission details if submission is already submitted or graded', async () => {
  vi.mocked(submissionService.listSubmissions).mockImplementation(async (params) => {
    if (params?.status === 'IN_PROGRESS') {
      return { data: [], pagination: { page: 1, limit: 1, total: 0 } };
    }
    return {
      data: [{ id: 45, assignmentId: 12, studentId: 5, attemptNumber: 1, status: 'GRADED', submittedAt: '2026-10-21', modules: [] }],
      pagination: { page: 1, limit: 10, total: 1 },
    };
  });
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/student/submissions/45'));
});

it('warns when assignment is in DRAFT status', async () => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({
    id: 12,
    title: 'Draft Exam',
    status: 'DRAFT',
    modules: [{ id: 30, skill: 'WRITING' }],
  });
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 1, total: 0 },
  });
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
  expect(await screen.findByText(/Bài tập này hiện không mở để làm bài/)).toBeVisible();
});

it('handles storage upload failures and MinIO rewrites', async () => {
  const { container, user } = await setup();
  const file = new File(['essay'], 'essay.pdf', { type: 'application/pdf' });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  vi.mocked(submissionService.getDocumentUploadUrl).mockResolvedValueOnce({
    uploadUrl: 'http://minio:9000/test/essay.pdf',
    storageKey: 'essay.pdf',
    expiresAt: '2026-10-22T12:00:00Z',
  });
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 500 }));
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  expect(await screen.findByText(/Lỗi tải tệp đính kèm/)).toBeVisible();
});

it('reports failure when submitModule fails', async () => {
  const { editor, user } = await setup();
  fireEvent.change(editor, { target: { value: 'My good essay' } });
  vi.mocked(submissionService.submitModule).mockRejectedValueOnce(new Error('Network error on submit'));
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  expect(await screen.findByText('Network error on submit')).toBeVisible();
});

it('handles assignment with missing title and fallback instructions', async () => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: '', status: 'PUBLISHED', modules: [{ id: 30, skill: 'WRITING' }] });
  vi.mocked(moduleService.getModule).mockResolvedValue({ id: 30, skill: 'WRITING', taskType: 'ESSAY', instructions: '', orderIndex: 1, maxScore: null as unknown as number });
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
  expect(await screen.findByText(/Writing #12/)).toBeVisible();
  expect(screen.getByText(/Yêu cầu: Hoàn thành bài viết/)).toBeVisible();
});

it('allows submitting with uploaded file even when editor text is empty', async () => {
  const { container, user } = await setup();
  const file = new File(['essay'], 'essay.pdf', { type: 'application/pdf' });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  vi.mocked(submissionService.getDocumentUploadUrl).mockResolvedValueOnce({
    uploadUrl: 'https://storage.example.test/upload',
    storageKey: 'essay.pdf',
    expiresAt: '2026-10-22T12:00:00Z',
  });
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status: 200 }));
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  expect(submissionService.submitModule).toHaveBeenCalled();
});

it('navigates to assignment result when submission id is missing on final submit', async () => {
  const original = await submissionService.getSubmission(40);
  vi.mocked(submissionService.getSubmission).mockResolvedValue({
    ...original,
    id: undefined as unknown as number,
  });
  const { editor } = await setup();
  fireEvent.change(editor, { target: { value: 'Valid essay content' } });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  });
  await act(() => vi.advanceTimersByTimeAsync(1200));
  expect(screen.getByTestId('location')).toHaveTextContent('/student/assignments/12/result');
});

it('redirects to the earlier incomplete module via route guard on mount', async () => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({
    id: 12,
    title: 'Reading and Writing',
    status: 'PUBLISHED',
    modules: [{ id: 29, skill: 'READING' }, { id: 30, skill: 'WRITING' }],
  });
  const original = await submissionService.getSubmission(40);
  vi.mocked(submissionService.getSubmission).mockResolvedValue({
    ...original,
    modules: [
      { id: 49, moduleId: 29, skill: 'READING', taskType: 'QUIZ', status: 'IN_PROGRESS', grading: null },
      { id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'IN_PROGRESS', grading: null },
    ],
  });
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
  await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/student/assignments/reading/12'));
});



it('navigates to assignments list when clicking breadcrumb', async () => {
  await setup();
  fireEvent.click(screen.getByText('Danh sách bài tập'));
  expect(screen.getByTestId('location')).toHaveTextContent('/student/assignments');
});

it('warns with status label when assignment is ARCHIVED', async () => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({
    id: 12,
    title: 'Archived Exam',
    status: 'ARCHIVED' as unknown as import('../../api/services/assignment.service').AssignmentStatus,
    modules: [{ id: 30, skill: 'WRITING' }],
  });
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 1, total: 0 },
  });
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
  expect(await screen.findByText(/Trạng thái: ARCHIVED/)).toBeVisible();
});

it('displays error when startAttempt fails for published assignment', async () => {
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 1, total: 0 },
  });
  vi.mocked(submissionService.startAttempt).mockRejectedValueOnce(new Error('Cannot start attempt'));
  renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12');
  expect(await screen.findByText('Cannot start attempt')).toBeVisible();
});

it('warns when subModuleId is missing in submission', async () => {
  const original = await submissionService.getSubmission(40);
  vi.mocked(submissionService.getSubmission).mockResolvedValue({
    ...original,
    modules: [],
  });
  const { editor } = await setup();
  fireEvent.change(editor, { target: { value: 'Essay text' } });
  await userEvent.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  expect(screen.getByText('Không tìm thấy thông tin phần làm bài viết trong bài nộp.')).toBeVisible();
});
