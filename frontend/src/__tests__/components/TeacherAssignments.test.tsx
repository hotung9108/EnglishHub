import { act, fireEvent, screen, within } from '@testing-library/react';
import { AxiosError, CanceledError } from 'axios';
import { useState } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiCache } from '../../api/core/cache';
import { ApiClientError, NetworkError, parseApiError, TimeoutError, ValidationError } from '../../api/core/errors';
import { MockHttpClient } from '../../api/__tests__/helpers/mock-http-client';
import {
  assignmentService,
  type AssignmentListResponse,
  type AssignmentSummary,
} from '../../api/services/assignment.service';
import { classService, type ClassSummary } from '../../api/services/class.service';
import { submissionService } from '../../api/services/submission.service';
import { ToastProvider } from '../../components/common/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import TeacherAssignments from '../../pages/TeacherAssignments';
import { deferred } from '../deferred';
import { renderPage } from './renderPage';

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: { listAssignments: vi.fn(), updateAssignmentStatus: vi.fn(), deleteAssignment: vi.fn() },
}));
vi.mock('../../api/services/class.service', () => ({
  classService: { list: vi.fn(), listMembers: vi.fn() },
}));
vi.mock('../../api/services/submission.service', () => ({
  submissionService: { listSubmissions: vi.fn() },
}));

const now = new Date(2026, 10, 20, 12);
const future = new Date(2026, 10, 20, 15, 5).toISOString();
const expired = new Date(2026, 10, 19, 15, 5).toISOString();
const classA: ClassSummary = { id: 12, name: 'IELTS A', status: 'ACTIVE' };
const classB: ClassSummary = { id: 13, name: 'IELTS B', status: 'ACTIVE' };
const response = { message: 'Response from the API' };

type AssignmentFixture = Omit<AssignmentSummary, 'closeAt'> & { closeAt: string | null };
const defaultAssignment: AssignmentFixture = {
  id: 42,
  title: 'Weekly practice',
  status: 'DRAFT',
  skills: ['WRITING'],
  closeAt: future,
};

const copy = {
  vi: {
    open: 'Mở bài tập',
    close: 'Khóa bài tập',
    draft: 'Nháp',
    published: 'Đã mở',
    closed: 'Đã khóa',
    openPrompt: 'Mở bài tập này cho học viên làm bài?',
    closePrompt: 'Học viên chưa nộp bài sẽ không thể nộp sau khi khóa bài tập.',
    openSuccess: 'Đã mở bài tập.',
    closeSuccess: 'Đã khóa bài tập.',
    error: 'Không thể cập nhật trạng thái bài tập.',
    serverError: 'Lỗi máy chủ. Vui lòng thử lại.',
    networkError: 'Lỗi kết nối. Vui lòng thử lại.',
    unconfirmed: 'Chưa nhận được phản hồi nên kết quả chưa được xác nhận. Đang đồng bộ lại danh sách bài tập.',
  },
  en: {
    open: 'Open assignment',
    close: 'Close assignment',
    draft: 'Draft',
    published: 'Published',
    closed: 'Closed',
    openPrompt: 'Open this assignment for students to work on?',
    closePrompt: 'Students who have not submitted will be unable to submit after the assignment is closed.',
    openSuccess: 'Assignment opened.',
    closeSuccess: 'Assignment closed.',
    error: 'Could not update the assignment status.',
    serverError: 'Server error. Please try again.',
    networkError: 'Connection error. Please try again.',
    unconfirmed: 'No response was received, so the result is unconfirmed. The assignment list is being refreshed.',
  },
};

function classesResponse(data: ClassSummary[]) {
  return { data, pagination: { page: 1, limit: 100, total: data.length } };
}

function assignmentsResponse(data: AssignmentFixture[]): AssignmentListResponse {
  // A null deadline models malformed API data that the page must tolerate.
  return { data: data as AssignmentSummary[], pagination: { page: 1, limit: 50, total: data.length } };
}

function renderAssignments(language: 'vi' | 'en' = 'vi') {
  const path = '/teacher/assignments';
  return renderPage(
    <ToastProvider><TeacherAssignments /></ToastProvider>,
    path,
    path,
    undefined,
    language
  );
}

async function showAssignments(data: AssignmentFixture[], language: 'vi' | 'en' = 'vi') {
  mockForegroundAssignments(data);
  renderAssignments(language);
  await screen.findByRole('heading', { name: data[0].title, level: 3 });
}

function mockForegroundAssignments(data: AssignmentFixture[]) {
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockImplementation(async (_id, _params, options) =>
    options?.signal ? background.promise : assignmentsResponse(data)
  );
}

function backgroundReads() {
  return vi.mocked(assignmentService.listAssignments).mock.calls.filter(([, , options]) => options?.signal);
}

function cardById(id: number, className?: string) {
  const code = `HW-${String(id).padStart(2, '0')}`;
  const cards = screen.getAllByText(code, { selector: '.teacher-assignment-code-badge' });
  const codeElement = className
    ? cards.find(element => element.closest('.teacher-assignment-card')?.querySelector('.teacher-assignment-class-tag')?.textContent === className)
    : cards[0];
  return codeElement!.closest<HTMLElement>('.teacher-assignment-card')!;
}

function deadlineOf(card: HTMLElement) {
  return card.querySelector('.teacher-assignment-deadline-tag')?.textContent;
}

function activeCount(language: 'vi' | 'en' = 'vi') {
  return screen.getByText(language === 'vi' ? 'Đang mở' : 'Active')
    .closest('.metric-card')?.querySelector('.metric-value');
}

function openDialog(card: HTMLElement, actionLabel: string) {
  fireEvent.click(within(card).getByRole('button', { name: actionLabel }));
  return screen.getByRole('dialog', { name: actionLabel });
}

function pressConfirm(dialog: HTMLElement, actionLabel: string) {
  fireEvent.click(within(dialog).getByRole('button', { name: actionLabel }));
}

function classFilter() {
  return screen.getByRole('combobox', { name: '' });
}

function expectNoLifecycleButtons() {
  expect(screen.queryByRole('button', { name: /^(Mở|Khóa) bài tập$/ })).not.toBeInTheDocument();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
  vi.mocked(classService.list).mockReset().mockResolvedValue(classesResponse([classA]));
  vi.mocked(classService.listMembers).mockReset().mockResolvedValue([]);
  vi.mocked(assignmentService.listAssignments).mockReset().mockResolvedValue(assignmentsResponse([]));
  vi.mocked(assignmentService.updateAssignmentStatus).mockReset().mockResolvedValue(response);
  vi.mocked(assignmentService.deleteAssignment).mockReset().mockResolvedValue(response);
  vi.mocked(submissionService.listSubmissions).mockReset().mockResolvedValue({
    data: [], pagination: { page: 1, limit: 100, total: 0 },
  });
});

it('keeps one card and preserves delete confirmation alongside lifecycle actions', async () => {
  await showAssignments([defaultAssignment]);
  expect(screen.getAllByRole('heading', { name: defaultAssignment.title, level: 3 })).toHaveLength(1);
  const card = cardById(42);
  const remove = within(card).getByRole('button', { name: 'Xóa bài tập' });
  expect(within(card).getByRole('button', { name: copy.vi.open })).toBeEnabled();

  fireEvent.click(remove);
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Xóa bài tập' })).getByRole('button', { name: 'Hủy' }));
  expect(assignmentService.deleteAssignment).not.toHaveBeenCalled();

  vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse([]));
  fireEvent.click(remove);
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Xóa bài tập' })).getByRole('button', { name: 'Xác nhận' }));
  expect(await screen.findByText('Chưa có bài tập nào')).toBeVisible();
  expect(assignmentService.deleteAssignment).toHaveBeenCalledExactlyOnceWith(42);
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
});

it.each(['vi', 'en'] as const)('C01/P04: opens a draft without a deadline field (%s)', async language => {
  const text = copy[language];
  await showAssignments([defaultAssignment], language);
  const card = cardById(42);
  const originalDeadline = deadlineOf(card);
  const readsBefore = vi.mocked(assignmentService.listAssignments).mock.calls.length;
  expect(within(card).getByText(text.draft)).toBeVisible();
  expect(activeCount(language)).toHaveTextContent(/^0$/);

  const dialog = openDialog(card, text.open);
  expect(within(dialog).getByText(text.openPrompt)).toBeVisible();
  expect(dialog.querySelector('input')).toBeNull();
  pressConfirm(dialog, text.open);

  expect(await screen.findByText(text.openSuccess)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
  expect(within(card).getByText(text.published)).toBeVisible();
  expect(within(card).getByRole('button', { name: text.close })).toBeEnabled();
  expect(within(card).queryByRole('button', { name: text.open })).not.toBeInTheDocument();
  expect(activeCount(language)).toHaveTextContent(/^1$/);
  expect(deadlineOf(card)).toBe(originalDeadline);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(assignmentService.listAssignments).toHaveBeenCalledTimes(readsBefore + 1);
});

it.each([
  { language: 'vi', closeAt: future, initialCount: 1 },
  { language: 'vi', closeAt: expired, initialCount: 0 },
  { language: 'en', closeAt: future, initialCount: 1 },
  { language: 'en', closeAt: expired, initialCount: 0 },
] as const)('C02/P04: closes a published assignment with initial KPI $initialCount ($language)', async ({
  language, closeAt, initialCount,
}) => {
  const text = copy[language];
  await showAssignments([{ ...defaultAssignment, status: 'PUBLISHED', closeAt }], language);
  const card = cardById(42);
  const originalDeadline = deadlineOf(card);
  const readsBefore = vi.mocked(assignmentService.listAssignments).mock.calls.length;
  expect(within(card).getByText(text.published)).toBeVisible();
  expect(activeCount(language)?.textContent).toBe(String(initialCount));

  const dialog = openDialog(card, text.close);
  expect(within(dialog).getByText(text.closePrompt)).toBeVisible();
  expect(dialog.querySelector('input')).toBeNull();
  pressConfirm(dialog, text.close);

  expect(await screen.findByText(text.closeSuccess)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'CLOSED');
  expect(within(card).getByText(text.closed)).toBeVisible();
  expect(within(card).queryByRole('button', { name: /^(Chỉnh sửa|Edit)$/ })).not.toBeInTheDocument();
  expect(within(card).getByRole('button', { name: text.open })).toBeEnabled();
  expect(within(card).queryByRole('button', { name: text.close })).not.toBeInTheDocument();
  expect(deadlineOf(card)).toBe(originalDeadline);
  expect(activeCount(language)).toHaveTextContent(/^0$/);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(assignmentService.listAssignments).toHaveBeenCalledTimes(readsBefore + 1);
});

const dismissals = ['cancel', 'close icon', 'Escape', 'backdrop'] as const;
const cancelCases = [
  { status: 'DRAFT', action: copy.vi.open, badge: copy.vi.draft },
  { status: 'PUBLISHED', action: copy.vi.close, badge: copy.vi.published },
] as const;

it.each(cancelCases.flatMap(testCase => dismissals.map(dismissal => ({ ...testCase, dismissal }))))(
  'P02: dismisses $status via $dismissal without sending PATCH',
  async ({ status, action, badge, dismissal }) => {
    await showAssignments([{ ...defaultAssignment, status }]);
    const card = cardById(42);
    const originalDeadline = deadlineOf(card);
    const dialog = openDialog(card, action);

    if (dismissal === 'Escape') {
      fireEvent.keyDown(window, { key: 'Escape' });
    } else if (dismissal === 'backdrop') {
      fireEvent.click(dialog);
    } else {
      fireEvent.click(within(dialog).getByRole('button', { name: dismissal === 'cancel' ? 'Hủy bỏ' : 'Đóng' }));
    }

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
    expect(within(card).getByText(badge)).toBeVisible();
    expect(deadlineOf(card)).toBe(originalDeadline);
  }
);

it('P03: updates one matching title by id and keeps class, skill, search and page', async () => {
  const firstPage = Array.from({ length: 10 }, (_, index) => ({
    ...defaultAssignment, id: index + 1, title: `Practice ${index + 1}`,
  }));
  const rows: AssignmentFixture[] = [
    ...firstPage,
    { ...defaultAssignment, id: 111, title: 'Practice shared' },
    { ...defaultAssignment, id: 112, title: 'Practice shared' },
    { ...defaultAssignment, id: 113, title: 'Practice reading', skills: ['READING'] },
  ];
  await showAssignments(rows);
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Writing' }));
  const search = screen.getByPlaceholderText('Tìm bài tập theo tên hoặc mã HW...');
  fireEvent.change(search, { target: { value: 'Practice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
  const target = cardById(111);
  const other = cardById(112);

  pressConfirm(openDialog(target, copy.vi.open), copy.vi.open);

  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(111, 'PUBLISHED');
  expect(within(target).getByText(copy.vi.published)).toBeVisible();
  expect(within(other).getByText(copy.vi.draft)).toBeVisible();
  await act(async () => background.resolve(assignmentsResponse(rows.map(row =>
    row.id === 111 ? { ...row, status: 'PUBLISHED', title: 'Practice shared (server)' } : row
  ))));
  expect(within(cardById(111)).getByText('Practice shared (server)')).toBeVisible();
  expect(within(cardById(112)).getByText(copy.vi.draft)).toBeVisible();
  expect(classFilter()).toHaveValue('12');
  expect(search).toHaveValue('Practice');
  expect(screen.getByRole('button', { name: 'Writing' })).toHaveClass('active');
  expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByText('Practice reading')).not.toBeInTheDocument();
});

it('P03: matches both assignment id and class id in the all-classes view', async () => {
  vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
  mockForegroundAssignments([defaultAssignment]);
  renderAssignments();
  await screen.findByRole('heading', { name: defaultAssignment.title, level: 3 });
  fireEvent.change(classFilter(), { target: { value: 'all' } });
  expect(await screen.findByText('IELTS B', { selector: '.teacher-assignment-class-tag span' })).toBeVisible();
  const target = cardById(42, 'IELTS A');
  const other = cardById(42, 'IELTS B');
  const readA = deferred<AssignmentListResponse>();
  const readB = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(readA.promise).mockReturnValueOnce(readB.promise);

  pressConfirm(openDialog(target, copy.vi.open), copy.vi.open);

  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
  expect(within(target).getByText(copy.vi.published)).toBeVisible();
  expect(within(other).getByText(copy.vi.draft)).toBeVisible();
  expect(classFilter()).toHaveValue('all');
  await act(async () => {
    readA.resolve(assignmentsResponse([{ ...defaultAssignment, status: 'PUBLISHED' }]));
    readB.resolve(assignmentsResponse([defaultAssignment]));
  });
  expect(within(cardById(42, 'IELTS A')).getByText(copy.vi.published)).toBeVisible();
  expect(within(cardById(42, 'IELTS B')).getByText(copy.vi.draft)).toBeVisible();
  expect(classFilter()).toHaveValue('all');
});

it.each(['resolve', 'reject'] as const)('E02: blocks repeated clicks and releases pending after %s', async outcome => {
  const release = deferred<void>();
  vi.mocked(assignmentService.updateAssignmentStatus).mockReturnValueOnce(release.promise.then(() => {
    if (outcome === 'reject') throw new Error('Test PATCH failure');
    return response;
  }));
  await showAssignments([
    defaultAssignment,
    { ...defaultAssignment, id: 43, title: 'Second assignment', status: 'PUBLISHED' },
  ]);
  const target = cardById(42);
  const other = cardById(43);
  const dialog = openDialog(target, copy.vi.open);
  const confirmButton = within(dialog).getByRole('button', { name: copy.vi.open });

  act(() => {
    confirmButton.click();
    confirmButton.click();
  });
  expect(confirmButton).toBeDisabled();
  const cancelButton = within(dialog).getByRole('button', { name: 'Hủy bỏ' });
  const closeButton = within(dialog).getByRole('button', { name: 'Đóng' });
  expect(cancelButton).toBeDisabled();
  expect(closeButton).toBeDisabled();
  expect(within(target).getByRole('button', { name: copy.vi.open })).toBeDisabled();
  const otherAction = within(other).getByRole('button', { name: copy.vi.close });
  expect(otherAction).toBeDisabled();
  fireEvent.click(confirmButton);
  fireEvent.click(otherAction);
  fireEvent.click(cancelButton);
  fireEvent.click(closeButton);
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(dialog);

  expect(dialog).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');

  await act(async () => release.resolve());
  const expectedToast = outcome === 'resolve' ? copy.vi.openSuccess : copy.vi.serverError;
  expect(await screen.findByText(expectedToast)).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(otherAction).toBeEnabled();

  pressConfirm(openDialog(other, copy.vi.close), copy.vi.close);

  expect(await screen.findByText(copy.vi.closeSuccess)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenNthCalledWith(2, 43, 'CLOSED');
});

it.each(['changes status', 'disappears'] as const)('rejects a stale snapshot when the assignment %s', async change => {
  await showAssignments([defaultAssignment]);
  const dialog = openDialog(cardById(42), copy.vi.open);
  const next = change === 'changes status' ? [{ ...defaultAssignment, status: 'PUBLISHED' as const }] : [];
  vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse(next));
  fireEvent.change(classFilter(), { target: { value: 'all' } });

  if (change === 'changes status') {
    expect(await screen.findByText(copy.vi.published)).toBeVisible();
  } else {
    expect(await screen.findByText('Chưa có bài tập nào')).toBeVisible();
  }
  pressConfirm(dialog, copy.vi.open);

  expect(await screen.findByText('Dữ liệu bài tập đã thay đổi.')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
});

const errorCopy = {
  vi: {
    unauthorized: 'Phiên đăng nhập đã hết hạn.',
    forbidden: 'Bạn không có quyền thực hiện thao tác này.',
    missing: 'Bài tập hoặc lớp không còn truy cập được.',
    conflict: 'Bài tập đang được cập nhật, vui lòng thử lại.',
    request: 'Yêu cầu thất bại.',
    state: 'Chuyển trạng thái bài tập bị từ chối.',
    refreshFailed: 'Không thể làm mới danh sách bài tập.',
    leftList: 'Bài tập không còn trong danh sách đang xem.',
    changed: 'Trạng thái bài tập đã thay đổi.',
  },
  en: {
    unauthorized: 'Your session has expired.',
    forbidden: 'You do not have permission to perform this action.',
    missing: 'The assignment or class is no longer accessible.',
    conflict: 'The assignment is being updated. Please try again.',
    request: 'The request failed.',
    state: 'The assignment status change was rejected.',
    refreshFailed: 'Could not refresh the assignment list.',
    leftList: 'The assignment is no longer in the current list.',
    changed: 'The assignment status has changed.',
  },
};

const patchErrorCases = (['vi', 'en'] as const).flatMap(language => [
  { name: 'unmatched 400', error: new ValidationError('Backend detail'), message: copy[language].error, reads: 1 },
  { name: '401', error: new ApiClientError('Backend detail', 401), message: errorCopy[language].unauthorized, reads: 0 },
  { name: '403', error: new ApiClientError('Backend detail', 403), message: errorCopy[language].forbidden, reads: 0 },
  { name: '404', error: new ApiClientError('Backend detail', 404), message: errorCopy[language].missing, reads: 1 },
  { name: 'HTTP 408', error: new ApiClientError('Backend detail', 408), message: copy[language].error, reads: 0 },
  { name: '409', error: new ApiClientError('Backend detail', 409), message: errorCopy[language].conflict, reads: 1 },
  { name: '415', error: new ApiClientError('Backend detail', 415), message: errorCopy[language].request, reads: 0 },
  { name: '422', error: new ValidationError('Backend detail', undefined, undefined, 422), message: errorCopy[language].request, reads: 0 },
  { name: '500', error: new ApiClientError('Backend detail', 500), message: copy[language].serverError, reads: 0 },
  { name: 'HTTP 504', error: new ApiClientError('Backend detail', 504), message: copy[language].serverError, reads: 0 },
  { name: 'network', error: new NetworkError(), message: copy[language].networkError, reads: 0 },
  { name: 'page abort', error: parseApiError(new CanceledError()), message: copy[language].error, reads: 0 },
].flatMap(testCase => (['close', 'reopen'] as const).map(action => ({ ...testCase, language, action }))));

it.each(patchErrorCases)('E03/E04: handles $action PATCH $name with $reads background reads ($language)', async ({
  action, name, error, message, reads, language,
}) => {
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(error);
  const text = copy[language];
  const isReopen = action === 'reopen';
  const buttonLabel = isReopen ? text.open : text.close;
  const confirmLabel = isReopen ? reopenCopy[language].title : text.close;
  await showAssignments([isReopen ? closedAssignment : { ...defaultAssignment, status: 'PUBLISHED' }], language);
  const card = cardById(42);
  const originalDeadline = deadlineOf(card);
  fireEvent.click(within(card).getByRole('button', { name: buttonLabel }));
  const dialog = screen.getByRole('dialog', { name: confirmLabel });
  pressConfirm(dialog, confirmLabel);

  expect(await screen.findByText(message)).toBeVisible();
  expect(screen.queryByText(error.message)).not.toBeInTheDocument();
  expect(screen.queryByText(text.unconfirmed)).not.toBeInTheDocument();
  if (name === '409') {
    expect(dialog).toBeVisible();
    expect(within(dialog).getByRole('button', { name: confirmLabel })).toBeEnabled();
  } else {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, isReopen ? 'PUBLISHED' : 'CLOSED');
  expect(within(card).getByText(isReopen ? text.closed : text.published)).toBeVisible();
  expect(within(card).getByRole('button', { name: buttonLabel })).toBeEnabled();
  expect(activeCount(language)?.textContent).toBe(isReopen ? '0' : '1');
  expect(deadlineOf(card)).toBe(originalDeadline);
  expect(backgroundReads()).toHaveLength(reads);
  expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments');
});

it('E04: handles a successful service result after refresh replay as a normal mutation', async () => {
  const replay = deferred<typeof response>();
  vi.mocked(assignmentService.updateAssignmentStatus).mockReturnValueOnce(replay.promise);
  await showAssignments([defaultAssignment]);
  const card = cardById(42);
  const dialog = openDialog(card, copy.vi.open);
  pressConfirm(dialog, copy.vi.open);
  expect(within(dialog).getByRole('button', { name: copy.vi.open })).toBeDisabled();

  await act(async () => replay.resolve(response));

  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  expect(screen.queryByText(errorCopy.vi.unauthorized)).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(within(card).getByText(copy.vi.published)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
  expect(backgroundReads()).toHaveLength(1);
});

it.each([
  { name: 'published and in time', status: 'PUBLISHED', closeAt: future, count: 1 },
  { name: 'published and expired', status: 'PUBLISHED', closeAt: expired, count: 0 },
  { name: 'published and null', status: 'PUBLISHED', closeAt: null, count: 0 },
  { name: 'published and invalid', status: 'PUBLISHED', closeAt: 'not-a-date', count: 0 },
  { name: 'draft and in time', status: 'DRAFT', closeAt: future, count: 0 },
  { name: 'closed and in time', status: 'CLOSED', closeAt: future, count: 0 },
  { name: 'at the exact deadline', status: 'PUBLISHED', closeAt: now.toISOString(), count: 1 },
] as const)('E06a: counts $name as $count', async ({ status, closeAt, count }) => {
  await showAssignments([{ ...defaultAssignment, status, closeAt }]);
  expect(activeCount()?.textContent).toBe(String(count));
});

it('E06a: recalculates the KPI after time passes and a filter causes a render', async () => {
  await showAssignments([{ ...defaultAssignment, status: 'PUBLISHED', closeAt: now.toISOString() }]);
  const card = cardById(42);
  const originalDeadline = deadlineOf(card);
  expect(activeCount()).toHaveTextContent(/^1$/);

  vi.setSystemTime(new Date(now.getTime() + 1));
  fireEvent.click(screen.getByRole('button', { name: 'Writing' }));

  expect(activeCount()).toHaveTextContent(/^0$/);
  expect(deadlineOf(card)).toBe(originalDeadline);
  expect(within(card).getByRole('button', { name: copy.vi.close })).toBeEnabled();
});

it.each(['no classes', 'no assignments', 'class assignment request rejected'] as const)(
  'renders the legacy empty list without lifecycle buttons for %s',
  async scenario => {
    if (scenario === 'no classes') {
      vi.mocked(classService.list).mockResolvedValue(classesResponse([]));
    } else if (scenario === 'class assignment request rejected') {
      vi.mocked(assignmentService.listAssignments).mockRejectedValue(new Error('GET failed'));
    }
    renderAssignments();

    expect(await screen.findByText('Chưa có bài tập nào')).toBeVisible();
    expectNoLifecycleButtons();
  }
);

it('renders load errors and active retry loading without lifecycle buttons', async () => {
  const next = deferred<AssignmentListResponse>();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(assignmentService.listAssignments)
    .mockResolvedValueOnce({ ...assignmentsResponse([]), data: {} as AssignmentSummary[] })
    .mockReturnValueOnce(next.promise);
  renderAssignments();

  expect(await screen.findByText('Không thể tải danh sách bài tập. Vui lòng thử lại.')).toBeVisible();
  expectNoLifecycleButtons();

  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(screen.getByText('Đang tải danh sách bài tập...')).toBeVisible();
  expectNoLifecycleButtons();
  await act(async () => next.resolve(assignmentsResponse([])));
  expect(await screen.findByText('Chưa có bài tập nào')).toBeVisible();
  expectNoLifecycleButtons();
});

const storedDeadline = '2026-11-25T16:59:59+00:00';
const storedPrefill = '2026-11-25T23:59';
const editedDeadline = '2026-11-26T23:59';
const editedDeadlineUtc = '2026-11-26T16:59:00.000Z';
const closedAssignment: AssignmentFixture = { ...defaultAssignment, status: 'CLOSED', closeAt: storedDeadline };
const reopenCopy = {
  vi: {
    title: 'Mở lại bài tập',
    label: 'Hạn nộp mới',
    help: 'Chọn hạn nộp mới ở tương lai.',
    success: 'Đã mở lại bài tập.',
    required: 'Vui lòng nhập hạn nộp mới.',
    invalid: 'Ngày giờ không hợp lệ.',
    future: 'Hạn nộp khi mở lại phải sau thời điểm hiện tại.',
    afterOpen: 'Hạn nộp phải sau thời điểm mở bài.',
  },
  en: {
    title: 'Reopen assignment',
    label: 'New deadline',
    help: 'Choose a new deadline in the future.',
    success: 'Assignment reopened.',
    required: 'Enter a new deadline.',
    invalid: 'Enter a valid date and time.',
    future: 'The new deadline must be in the future.',
    afterOpen: 'The deadline must be after the assignment opening time.',
  },
};

function openReopenDialog(card: HTMLElement, language: 'vi' | 'en' = 'vi') {
  const text = reopenCopy[language];
  fireEvent.click(within(card).getByRole('button', { name: copy[language].open }));
  const dialog = screen.getByRole('dialog', { name: text.title });
  const input = within(dialog).getByLabelText<HTMLInputElement>(text.label);
  const confirm = within(dialog).getByRole('button', { name: text.title });
  return { dialog, input, confirm };
}

function enterRawDeadline(input: HTMLInputElement, value: string) {
  // jsdom sanitizes invalid values to empty before React can read them.
  const original = Object.getOwnPropertyDescriptor(input, 'value');
  try {
    Object.defineProperty(input, 'value', { configurable: true, get: () => value, set: original?.set });
    fireEvent.input(input);
  } finally {
    if (original) Object.defineProperty(input, 'value', original);
    else Reflect.deleteProperty(input, 'value');
  }
}

const reopenCases = [
  {
    name: 'retains a future deadline', original: storedDeadline, prefill: storedPrefill,
    inputValue: undefined, expectedCloseAt: undefined, label: '23:59, 25/11',
  },
  {
    name: 'replaces a future deadline', original: storedDeadline, prefill: storedPrefill,
    inputValue: editedDeadline, expectedCloseAt: editedDeadlineUtc, label: '23:59, 26/11',
  },
  {
    name: 'replaces an expired deadline', original: expired, prefill: '',
    inputValue: '2026-11-24T09:30', expectedCloseAt: '2026-11-24T02:30:00.000Z', label: '09:30, 24/11',
  },
];

it.each((['vi', 'en'] as const).flatMap(language => reopenCases.map(testCase => ({ ...testCase, language }))))(
  'C03: reopens and $name ($language)',
  async ({ language, original, prefill, inputValue, expectedCloseAt, label }) => {
    const text = reopenCopy[language];
    await showAssignments([{ ...closedAssignment, closeAt: original }], language);
    const card = cardById(42);
    const priorDeadline = deadlineOf(card);
    const reads = vi.mocked(assignmentService.listAssignments).mock.calls.length;
    expect(activeCount(language)).toHaveTextContent(/^0$/);
    const { dialog, input, confirm } = openReopenDialog(card, language);

    expect(input).toHaveAttribute('type', 'datetime-local');
    expect(input).toHaveValue(prefill);
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleName(text.label);
    expect(input).toHaveAccessibleDescription(expect.stringContaining(text.help));
    if (prefill === '') {
      expect(confirm).toBeDisabled();
      expect(within(dialog).getByRole('alert')).toHaveTextContent(text.required);
    }
    if (inputValue !== undefined) fireEvent.change(input, { target: { value: inputValue } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    expect(await screen.findByText(text.success)).toBeVisible();
    if (expectedCloseAt === undefined) {
      expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
      expect(deadlineOf(card)).toBe(priorDeadline);
    } else {
      expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED', {
        reopen: { closeAt: expectedCloseAt },
      });
      expect(deadlineOf(card)).not.toBe(priorDeadline);
    }
    expect(deadlineOf(card)).toContain(label);
    expect(within(card).getByText(copy[language].published)).toBeVisible();
    expect(within(card).getByRole('button', { name: copy[language].close })).toBeEnabled();
    expect(within(card).getByRole('button', { name: /^(Chỉnh sửa|Edit)$/ })).toBeVisible();
    expect(activeCount(language)).toHaveTextContent(/^1$/);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(assignmentService.listAssignments).toHaveBeenCalledTimes(reads + 1);
  }
);

it('C03: restoring the original displayed value still keeps the stored instant', async () => {
  await showAssignments([closedAssignment]);
  const { input, confirm } = openReopenDialog(cardById(42));
  fireEvent.change(input, { target: { value: editedDeadline } });
  fireEvent.change(input, { target: { value: storedPrefill } });
  fireEvent.click(confirm);

  expect(await screen.findByText(reopenCopy.vi.success)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
});

it('C03: updates the deadline only on the row with the matching assignment and class ids', async () => {
  vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
  mockForegroundAssignments([closedAssignment]);
  renderAssignments();
  await screen.findByRole('heading', { name: closedAssignment.title, level: 3 });
  fireEvent.change(classFilter(), { target: { value: 'all' } });
  expect(await screen.findByText('IELTS B', { selector: '.teacher-assignment-class-tag span' })).toBeVisible();
  const target = cardById(42, 'IELTS A');
  const other = cardById(42, 'IELTS B');
  const otherDeadline = deadlineOf(other);
  const { input, confirm } = openReopenDialog(target);
  fireEvent.change(input, { target: { value: editedDeadline } });
  fireEvent.click(confirm);

  expect(await screen.findByText(reopenCopy.vi.success)).toBeVisible();
  expect(deadlineOf(target)).toContain('23:59, 26/11');
  expect(within(target).getByText(copy.vi.published)).toBeVisible();
  expect(deadlineOf(other)).toBe(otherDeadline);
  expect(within(other).getByText(copy.vi.closed)).toBeVisible();
});

it.each([null, 'not-a-date'])('E01a: stored deadline %s requires a new value', async closeAt => {
  await showAssignments([{ ...closedAssignment, closeAt }]);
  const { dialog, input, confirm } = openReopenDialog(cardById(42));

  expect(input).toHaveValue('');
  expect(confirm).toBeDisabled();
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription(expect.stringContaining(reopenCopy.vi.required));
  expect(within(dialog).getByRole('alert')).toHaveTextContent(reopenCopy.vi.required);
  fireEvent.click(confirm);
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
});

const beforeOpenAt = '2026-11-24T02:31:00Z';
const atOpenAt = '2026-11-24T02:30:00Z';
const deadlineValidationCases = [
  { name: 'cleared input', value: '', error: 'required', openAt: undefined, raw: false },
  { name: 'unparseable input', value: 'abc', error: 'invalid', openAt: undefined, raw: true },
  { name: 'normalized calendar date', value: '2026-02-30T10:00', error: 'invalid', openAt: undefined, raw: true },
  { name: 'before now', value: '2026-11-20T11:59', error: 'future', openAt: undefined, raw: false },
  { name: 'equal to now', value: '2026-11-20T12:00', error: 'future', openAt: undefined, raw: false },
  { name: 'before openAt', value: '2026-11-24T09:30', error: 'afterOpen', openAt: beforeOpenAt, raw: false },
  { name: 'equal to openAt', value: '2026-11-24T09:30', error: 'afterOpen', openAt: atOpenAt, raw: false },
] as const;

it.each((['vi', 'en'] as const).flatMap(language => deadlineValidationCases.map(testCase => ({ ...testCase, language }))))(
  'E01a/E01c: disables confirmation for $name and describes the error ($language)',
  async ({ language, value, error, openAt, raw }) => {
    await showAssignments([{ ...closedAssignment, openAt }], language);
    const { dialog, input, confirm } = openReopenDialog(cardById(42), language);
    if (raw) enterRawDeadline(input, value);
    else fireEvent.change(input, { target: { value } });

    const inlineError = within(dialog).getByRole('alert');
    expect(inlineError).toHaveTextContent(reopenCopy[language][error]);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(inlineError.id);
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
    expect(dialog).toBeVisible();
  }
);

it('E01c: describes native badInput as an invalid date instead of just a missing value', async () => {
  await showAssignments([closedAssignment]);
  const { dialog, input, confirm } = openReopenDialog(cardById(42));
  vi.spyOn(input.validity, 'badInput', 'get').mockReturnValue(true);
  fireEvent.change(input, { target: { value: '' } });

  expect(within(dialog).getByRole('alert')).toHaveTextContent(reopenCopy.vi.invalid);
  expect(confirm).toBeDisabled();
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
});

it.each(['stored', 'changed'] as const)('E01a: rechecks a %s deadline if time advances before clicking', async source => {
  await showAssignments([{ ...closedAssignment, closeAt: new Date(2026, 10, 20, 12, 1).toISOString() }]);
  const { dialog, input, confirm } = openReopenDialog(cardById(42));
  if (source === 'changed') fireEvent.change(input, { target: { value: '2026-11-20T12:02' } });
  expect(confirm).toBeEnabled();
  vi.setSystemTime(new Date(2026, 10, 20, 12, source === 'stored' ? 1 : 2));
  fireEvent.click(confirm);

  expect(within(dialog).getByRole('alert')).toHaveTextContent(reopenCopy.vi.future);
  expect(dialog).toBeVisible();
  expect(confirm).toBeDisabled();
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
});

const deadline400Cases = (['vi', 'en'] as const).flatMap(language =>
  (['afterOpen', 'future'] as const).flatMap(error =>
    [false, true].map(changed => ({ language, error, changed }))
  )
);

it.each(deadline400Cases)(
  'E01b: preserves the dialog on $error 400 ($language, changed=$changed) and permits a corrected retry',
  async ({ language, error, changed }) => {
    const release = deferred<void>();
    const backendMessage = `  ${reopenCopy.vi[error]}  `;
    vi.mocked(assignmentService.updateAssignmentStatus).mockReturnValueOnce(release.promise.then(() => {
      throw new ValidationError(backendMessage);
    }));
    await showAssignments([closedAssignment], language);
    const card = cardById(42);
    const { dialog, input, confirm } = openReopenDialog(card, language);
    if (changed) fireEvent.change(input, { target: { value: editedDeadline } });
    vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse([closedAssignment]));
    fireEvent.click(confirm);
    expect(input).toBeDisabled();
    await act(async () => release.resolve());

    if (changed) {
      expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED', {
        reopen: { closeAt: editedDeadlineUtc },
      });
    } else {
      expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
    }
    expect(dialog).toBeVisible();
    expect(input).toBeEnabled();
    expect(input).toHaveValue(changed ? editedDeadline : storedPrefill);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialog).getByRole('alert')).toHaveTextContent(reopenCopy[language][error]);
    expect(screen.getAllByRole('alert').find(element => !dialog.contains(element)))
      .toHaveTextContent(reopenCopy[language][error]);
    expect(within(card).getByText(copy[language].closed)).toBeVisible();
    expect(backgroundReads()).toHaveLength(1);
    expect(confirm).toBeDisabled();
    fireEvent.click(confirm);
    expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: '2026-11-27T09:30' } });
    expect(within(dialog).queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    fireEvent.click(confirm);

    expect(await screen.findByText(reopenCopy[language].success)).toBeVisible();
    expect(assignmentService.updateAssignmentStatus).toHaveBeenNthCalledWith(2, 42, 'PUBLISHED', {
      reopen: { closeAt: '2026-11-27T02:30:00.000Z' },
    });
  }
);

const stateErrorCases = [
  { message: '  Không thể chuyển sang trạng thái này.  ', state: true, changed: false },
  { message: 'Không thể chuyển sang trạng thái này.', state: true, changed: true },
  { message: 'Chỉ được cập nhật hạn nộp khi mở lại bài tập.', state: true, changed: true },
  { message: 'Không thể chuyển sang trạng thái này! (updated)', state: false, changed: false },
  { message: `${reopenCopy.vi.future} (updated)`, state: false, changed: true },
  { message: 'The assignment status cannot be changed.', state: false, changed: true },
  { message: 'Dữ liệu không hợp lệ.', state: false, changed: false },
];

it.each((['vi', 'en'] as const).flatMap(language => stateErrorCases.map(testCase => ({ ...testCase, language }))))(
  'E03a: classifies $message (changed=$changed, $language) without a deadline error',
  async ({ message, state, changed, language }) => {
    vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new ValidationError(message));
    await showAssignments([closedAssignment], language);
    const card = cardById(42);
    const priorDeadline = deadlineOf(card);
    const { input, confirm } = openReopenDialog(card, language);
    if (changed) fireEvent.change(input, { target: { value: editedDeadline } });
    fireEvent.click(confirm);

    expect(await screen.findByText(state ? errorCopy[language].state : copy[language].error)).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(input).not.toBeInTheDocument();
    expect(within(card).getByText(copy[language].closed)).toBeVisible();
    expect(within(card).getByRole('button', { name: copy[language].open })).toBeEnabled();
    expect(deadlineOf(card)).toBe(priorDeadline);
    if (changed) {
      expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED', {
        reopen: { closeAt: editedDeadlineUtc },
      });
    } else {
      expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
    }
    expect(backgroundReads()).toHaveLength(1);
  }
);

it('E03a: keeps a normalized 422 separate even with an exact 400 deadline message', async () => {
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(
    new ValidationError(reopenCopy.vi.future, undefined, undefined, 422)
  );
  await showAssignments([closedAssignment]);
  const { confirm } = openReopenDialog(cardById(42));
  fireEvent.click(confirm);

  expect(await screen.findByText(errorCopy.vi.request)).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(backgroundReads()).toHaveLength(0);
});

it('E03a: treats an exact deadline 400 outside reopening as a common failure', async () => {
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new ValidationError(reopenCopy.vi.future));
  await showAssignments([defaultAssignment]);
  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);

  expect(await screen.findByText(copy.vi.error)).toBeVisible();
  expect(screen.queryByText(reopenCopy.vi.future)).not.toBeInTheDocument();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(backgroundReads()).toHaveLength(1);
});

it.each(dismissals)('P02: dismisses the reopen dialog via %s without sending PATCH', async dismissal => {
  await showAssignments([closedAssignment]);
  const card = cardById(42);
  const priorDeadline = deadlineOf(card);
  const { dialog } = openReopenDialog(card);

  if (dismissal === 'Escape') fireEvent.keyDown(window, { key: 'Escape' });
  else if (dismissal === 'backdrop') fireEvent.click(dialog);
  else fireEvent.click(within(dialog).getByRole('button', { name: dismissal === 'cancel' ? 'Hủy bỏ' : 'Đóng' }));

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
  expect(within(card).getByText(copy.vi.closed)).toBeVisible();
  expect(deadlineOf(card)).toBe(priorDeadline);
});

it.each(['resolve', 'reject'] as const)('E02: blocks duplicate reopen requests and releases controls after %s', async outcome => {
  const release = deferred<void>();
  vi.mocked(assignmentService.updateAssignmentStatus).mockReturnValueOnce(release.promise.then(() => {
    if (outcome === 'reject') throw new NetworkError();
    return response;
  }));
  await showAssignments([closedAssignment, { ...defaultAssignment, id: 43, title: 'Another draft' }]);
  const card = cardById(42);
  const otherCard = cardById(43);
  const { dialog, input, confirm } = openReopenDialog(card);

  act(() => {
    confirm.click();
    confirm.click();
  });
  expect(input).toBeDisabled();
  expect(confirm).toBeDisabled();
  expect(within(card).getByRole('button', { name: copy.vi.open })).toBeDisabled();
  expect(within(otherCard).getByRole('button', { name: copy.vi.open })).toBeDisabled();
  fireEvent.click(confirm);
  fireEvent.keyDown(window, { key: 'Escape' });
  fireEvent.click(dialog);
  expect(dialog).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');

  await act(async () => release.resolve());
  expect(await screen.findByText(outcome === 'resolve' ? reopenCopy.vi.success : copy.vi.networkError)).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(within(otherCard).getByRole('button', { name: copy.vi.open })).toBeEnabled();
  pressConfirm(openDialog(otherCard, copy.vi.open), copy.vi.open);
  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenNthCalledWith(2, 43, 'PUBLISHED');
});

it.each(['changes status', 'disappears'] as const)('rejects a stale CLOSED snapshot when the assignment %s', async change => {
  await showAssignments([closedAssignment]);
  const { confirm } = openReopenDialog(cardById(42));
  const next = change === 'changes status' ? [{ ...closedAssignment, status: 'PUBLISHED' as const }] : [];
  vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse(next));
  fireEvent.change(classFilter(), { target: { value: 'all' } });

  expect(await screen.findByText(change === 'changes status' ? copy.vi.published : 'Chưa có bài tập nào')).toBeVisible();
  fireEvent.click(confirm);

  expect(await screen.findByText('Dữ liệu bài tập đã thay đổi.')).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
});

const publishedAssignment: AssignmentFixture = { ...defaultAssignment, status: 'PUBLISHED' };
const secondPublished: AssignmentFixture = { ...publishedAssignment, id: 43, title: 'Second published assignment' };
const otherClassAssignment: AssignmentFixture = { ...defaultAssignment, title: 'Other class assignment' };

const unconfirmedCases = (['vi', 'en'] as const).flatMap(language => [
  { action: 'open', assignment: defaultAssignment, nextStatus: 'PUBLISHED' },
  { action: 'close', assignment: publishedAssignment, nextStatus: 'CLOSED' },
  { action: 'reopen', assignment: closedAssignment, nextStatus: 'PUBLISHED' },
].map(testCase => ({ ...testCase, language })));

it.each(unconfirmedCases)(
  'L4: closes and refreshes once after an unconfirmed $action PATCH ($language)',
  async ({ action, assignment, nextStatus, language }) => {
    const patch = deferred<void>();
    vi.mocked(assignmentService.updateAssignmentStatus).mockReturnValueOnce(patch.promise.then(() => {
      throw new TimeoutError();
    }));
    await showAssignments([assignment], language);
    vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse([assignment]));

    const text = copy[language];
    const actionLabel = action === 'close' ? text.close : text.open;
    const title = action === 'reopen' ? reopenCopy[language].title : actionLabel;
    const actionButton = within(cardById(42)).getByRole('button', { name: actionLabel });
    fireEvent.click(actionButton);
    const dialog = screen.getByRole('dialog', { name: title });
    const confirmButton = within(dialog).getByRole('button', { name: title });
    const deadline = dialog.querySelector('input');
    if (action === 'reopen') {
      const input = within(dialog).getByLabelText(reopenCopy[language].label);
      expect(input).toHaveValue(storedPrefill);
      fireEvent.change(input, { target: { value: editedDeadline } });
    } else {
      expect(deadline).toBeNull();
    }

    act(() => {
      confirmButton.click();
      confirmButton.click();
    });
    expect(confirmButton).toBeDisabled();
    expect(actionButton).toBeDisabled();
    if (deadline) expect(deadline).toBeDisabled();
    expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledTimes(1);
    expect(backgroundReads()).toHaveLength(0);

    await act(async () => patch.resolve());
    expect(screen.getAllByText(text.unconfirmed)).toHaveLength(1);
    expect(screen.queryByText(text.error)).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /kiểm tra lại|check again/i })).not.toBeInTheDocument();
    expect(backgroundReads()).toEqual([[classA.id, { limit: 50 }, { skipCache: true, signal: expect.any(AbortSignal) }]]);

    fireEvent.click(confirmButton);
    expect(actionButton).toBeEnabled();
    fireEvent.click(actionButton);
    const newDialog = screen.getByRole('dialog', { name: title });
    expect(within(newDialog).getByRole('button', { name: title })).toBeEnabled();
    if (deadline) expect(newDialog.querySelector('input')).toHaveValue(storedPrefill);
    const request = action === 'reopen' ? [42, nextStatus, { reopen: { closeAt: editedDeadlineUtc } }] : [42, nextStatus];
    expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(...request);
    expect(backgroundReads()).toHaveLength(1);
  }
);

it.each([
  { status: 'PUBLISHED', badge: copy.vi.published, axiosMessage: 'timeout of 15000ms exceeded' },
  { status: 'DRAFT', badge: copy.vi.draft, axiosMessage: 'Request aborted' },
] as const)('L4: applies server status $status after a normalized Axios error ($axiosMessage)', async ({ status, badge, axiosMessage }) => {
  await showAssignments([defaultAssignment]);
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  const { AssignmentService } = await vi.importActual<typeof import('../../api/services/assignment.service')>(
    '../../api/services/assignment.service'
  );
  const http = new MockHttpClient();
  http.mockError = parseApiError(new AxiosError(axiosMessage, AxiosError.ECONNABORTED));
  const service = new AssignmentService(http);
  vi.mocked(assignmentService.updateAssignmentStatus).mockImplementationOnce(service.updateAssignmentStatus.bind(service));

  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);

  expect(await screen.findByText(copy.vi.unconfirmed)).toBeVisible();
  expect(within(cardById(42)).getByText(copy.vi.draft)).toBeVisible();
  await act(async () => background.resolve(assignmentsResponse([{ ...defaultAssignment, status, title: 'Server snapshot' }])));

  const card = cardById(42);
  expect(within(card).getByText('Server snapshot')).toBeVisible();
  expect(within(card).getByText(badge)).toBeVisible();
  expect(activeCount()).toHaveTextContent(status === 'PUBLISHED' ? /^1$/ : /^0$/);
  expect(screen.queryByText(copy.vi.openSuccess)).not.toBeInTheDocument();
  expect(backgroundReads()).toHaveLength(1);
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
});

it('L4: keeps the snapshot and warns once when the only refresh fails, with no separate GET deadline', async () => {
  await showAssignments([defaultAssignment]);
  const background = deferred<void>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise.then(() => {
    throw new Error('Background read failure');
  }));
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new TimeoutError());
  vi.useRealTimers();
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(now);
  const card = cardById(42);
  const originalDeadline = deadlineOf(card);
  const dialog = openDialog(card, copy.vi.open);

  await act(async () => pressConfirm(dialog, copy.vi.open));
  expect(screen.getAllByText(copy.vi.unconfirmed)).toHaveLength(1);
  const signal = backgroundReads()[0][2]?.signal;

  await act(async () => vi.advanceTimersByTimeAsync(60_000));
  expect(signal?.aborted).toBe(false);
  expect(screen.queryByText(errorCopy.vi.refreshFailed)).not.toBeInTheDocument();

  await act(async () => background.resolve());
  expect(screen.getAllByText(errorCopy.vi.refreshFailed)).toHaveLength(1);
  expect(within(cardById(42)).getByText(copy.vi.draft)).toBeVisible();
  expect(deadlineOf(cardById(42))).toBe(originalDeadline);
  expect(backgroundReads()).toHaveLength(1);
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
});

it('L4: applies only the newest refresh after a second, explicit status change', async () => {
  await showAssignments([defaultAssignment, secondPublished]);
  const firstRead = deferred<AssignmentListResponse>();
  const nextRead = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(firstRead.promise).mockReturnValueOnce(nextRead.promise);
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new TimeoutError());

  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);
  expect(await screen.findByText(copy.vi.unconfirmed)).toBeVisible();
  const firstSignal = backgroundReads()[0][2]?.signal;
  expect(firstSignal?.aborted).toBe(false);
  pressConfirm(openDialog(cardById(43), copy.vi.close), copy.vi.close);
  expect(await screen.findByText(copy.vi.closeSuccess)).toBeVisible();
  expect(firstSignal?.aborted).toBe(true);

  await act(async () => nextRead.resolve(assignmentsResponse([
    { ...publishedAssignment, title: 'Current server snapshot' },
    { ...secondPublished, status: 'CLOSED' },
  ])));
  await act(async () => firstRead.resolve(assignmentsResponse([
    { ...defaultAssignment, title: 'Old server snapshot' }, secondPublished,
  ])));

  expect(screen.getByText('Current server snapshot')).toBeVisible();
  expect(screen.queryByText('Old server snapshot')).not.toBeInTheDocument();
  expect(screen.queryByText(errorCopy.vi.refreshFailed)).not.toBeInTheDocument();
  expect(within(cardById(43)).getByText(copy.vi.closed)).toBeVisible();
  expect(backgroundReads()).toHaveLength(2);
  expect(vi.mocked(assignmentService.updateAssignmentStatus).mock.calls).toEqual([[42, 'PUBLISHED'], [43, 'CLOSED']]);
});

it('L4: keeps filters and page while refreshing rows with the same id in different classes', async () => {
  const rows = Array.from({ length: 10 }, (_, index) => ({ ...defaultAssignment, id: 100 + index, title: `Practice ${index}` }));
  const target = { ...defaultAssignment, title: 'Practice in class A' };
  const duplicate = { ...defaultAssignment, title: 'Practice in class B' };
  vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
  vi.mocked(assignmentService.listAssignments).mockImplementation(async (id, _params, options) => (
    id === classA.id
      ? assignmentsResponse([...rows, { ...target, status: options?.signal ? 'PUBLISHED' : 'DRAFT' }])
      : assignmentsResponse([duplicate, { ...defaultAssignment, id: 200, title: 'Practice reading', skills: ['READING'] }])
  ));
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new TimeoutError());
  renderAssignments();
  await screen.findByRole('heading', { name: rows[0].title });
  fireEvent.change(classFilter(), { target: { value: 'all' } });
  expect(await screen.findByRole('button', { name: 'Trang 2' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Writing' }));
  const search = screen.getByPlaceholderText('Tìm bài tập theo tên hoặc mã HW...');
  fireEvent.change(search, { target: { value: 'Practice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));

  pressConfirm(openDialog(cardById(42, classA.name), copy.vi.open), copy.vi.open);

  expect(await screen.findByText(copy.vi.unconfirmed)).toBeVisible();
  expect(await within(cardById(42, classA.name)).findByText(copy.vi.published)).toBeVisible();
  expect(within(cardById(42, classB.name)).getByText(copy.vi.draft)).toBeVisible();
  expect(classFilter()).toHaveValue('all');
  expect(search).toHaveValue('Practice');
  expect(screen.getByRole('button', { name: 'Writing' })).toHaveClass('active');
  expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByText('Practice reading')).not.toBeInTheDocument();
  const reads = backgroundReads();
  expect(reads.map(([id]) => id)).toEqual([classA.id, classB.id]);
  expect(reads[0][2]?.signal).toBe(reads[1][2]?.signal);
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
});

it.each(['stale rows', 'stale error'] as const)(
  'E07/E07a: discards a foreground GET with $result after PATCH and sends fresh scoped options',
  async result => {
    vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
    const patch = deferred<typeof response>();
    const oldRead = deferred<AssignmentListResponse>();
    const newRead = deferred<AssignmentListResponse>();
    vi.mocked(assignmentService.updateAssignmentStatus).mockReturnValueOnce(patch.promise);
    await showAssignments([defaultAssignment]);
    const dialog = openDialog(cardById(42), copy.vi.open);
    pressConfirm(dialog, copy.vi.open);
    vi.mocked(assignmentService.listAssignments).mockImplementation((id, _params, options) =>
      id === classA.id
        ? (options?.signal ? newRead.promise : oldRead.promise)
        : Promise.resolve(assignmentsResponse([]))
    );
    fireEvent.change(classFilter(), { target: { value: 'all' } });
    expect(vi.mocked(assignmentService.listAssignments).mock.calls.filter(([id]) => id === classA.id)).toHaveLength(2);

    await act(async () => patch.resolve(response));
    expect(within(cardById(42)).getByText(copy.vi.published)).toBeVisible();
    expect(backgroundReads().map(([id]) => id)).toEqual([classA.id, classB.id]);
    const options = backgroundReads()[0][2];
    expect(options).toEqual({ skipCache: true, signal: expect.any(AbortSignal) });
    expect(backgroundReads()[1][2]?.signal).toBe(options?.signal);
    expect(classService.listMembers).toHaveBeenCalledWith(classA.id, options);
    expect(classService.listMembers).toHaveBeenCalledWith(classB.id, options);
    expect(classService.list).toHaveBeenCalledTimes(1);

    await act(async () => oldRead.resolve(result === 'stale rows'
      ? assignmentsResponse([{ ...defaultAssignment, title: 'Stale foreground' }])
      : { ...assignmentsResponse([]), data: {} as AssignmentSummary[] }));
    expect(screen.queryByText('Stale foreground')).not.toBeInTheDocument();
    expect(screen.queryByText('Không thể tải danh sách bài tập. Vui lòng thử lại.')).not.toBeInTheDocument();
    expect(within(cardById(42)).getByText(copy.vi.published)).toBeVisible();

    await act(async () => newRead.resolve(assignmentsResponse([{ ...publishedAssignment, title: 'Fresh server result' }])));
    expect(screen.getByText('Fresh server result')).toBeVisible();
    expect(submissionService.listSubmissions).toHaveBeenCalledWith({ assignmentId: 42, limit: 100 }, options);
  }
);

it.each(['resolves', 'rejects'] as const)('E07a: two consecutive PATCHes apply only the last refresh when the old GET %s', async outcome => {
  await showAssignments([defaultAssignment, secondPublished]);
  const oldRead = deferred<void>();
  const newRead = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments)
    .mockReturnValueOnce(oldRead.promise.then(() => {
      if (outcome === 'rejects') throw new Error('Old background failure');
      return assignmentsResponse([{ ...publishedAssignment, title: 'Old background data' }, secondPublished]);
    }))
    .mockReturnValueOnce(newRead.promise);

  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);
  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  const firstSignal = backgroundReads()[0][2]?.signal;
  expect(firstSignal?.aborted).toBe(false);
  pressConfirm(openDialog(cardById(43), copy.vi.close), copy.vi.close);
  expect(await screen.findByText(copy.vi.closeSuccess)).toBeVisible();
  expect(firstSignal?.aborted).toBe(true);
  expect(backgroundReads()[1][2]?.signal).not.toBe(firstSignal);
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledTimes(2);

  await act(async () => newRead.resolve(assignmentsResponse([
    { ...publishedAssignment, title: 'Newest background data' },
    { ...secondPublished, status: 'CLOSED' },
  ])));
  await act(async () => oldRead.resolve());

  expect(screen.getByText('Newest background data')).toBeVisible();
  expect(screen.queryByText('Old background data')).not.toBeInTheDocument();
  expect(screen.queryByText(errorCopy.vi.refreshFailed)).not.toBeInTheDocument();
  expect(within(cardById(43)).getByText(copy.vi.closed)).toBeVisible();
});

it.each(['before', 'after'] as const)('E07: a PATCH that finishes %s the new class GET only reports success', async timing => {
  vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
  const patch = deferred<typeof response>();
  const nextClass = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.updateAssignmentStatus).mockReturnValueOnce(patch.promise);
  await showAssignments([defaultAssignment]);
  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(nextClass.promise);
  fireEvent.change(classFilter(), { target: { value: String(classB.id) } });

  if (timing === 'after') {
    await act(async () => nextClass.resolve(assignmentsResponse([otherClassAssignment])));
  }
  await act(async () => patch.resolve(response));
  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  if (timing === 'before') {
    expect(within(cardById(42)).getByText(copy.vi.draft)).toBeVisible();
    await act(async () => nextClass.resolve(assignmentsResponse([otherClassAssignment])));
  }

  expect(screen.getByText(otherClassAssignment.title)).toBeVisible();
  expect(within(cardById(42, 'IELTS B')).getByText(copy.vi.draft)).toBeVisible();
  expect(backgroundReads()).toHaveLength(0);
  expect(classFilter()).toHaveValue(String(classB.id));
});

it.each(['card', 'dialog'] as const)('CAO-01: blocks the old class %s while the selected class is loading', async source => {
  vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
  await showAssignments([defaultAssignment]);
  const nextClass = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(nextClass.promise);
  const action = within(cardById(42)).getByRole('button', { name: copy.vi.open });
  const confirm = source === 'dialog'
    ? within(openDialog(cardById(42), copy.vi.open)).getByRole('button', { name: copy.vi.open })
    : null;

  fireEvent.change(classFilter(), { target: { value: String(classB.id) } });
  expect(action).toBeDisabled();
  fireEvent.click(confirm ?? action);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();

  await act(async () => nextClass.resolve(assignmentsResponse([otherClassAssignment])));
  const nextCard = cardById(42, classB.name);
  expect(within(nextCard).getByRole('button', { name: copy.vi.open })).toBeEnabled();
  expect(screen.queryByText(defaultAssignment.title)).not.toBeInTheDocument();
});

it('CAO-02: loads fresh foreground data instead of joining an in-flight pre-PATCH GET', async () => {
  vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
  await showAssignments([defaultAssignment]);
  const cache = new ApiCache();
  const oldRead = deferred<AssignmentListResponse>();
  const oldRequest = cache.dedupe(String(classA.id), () => oldRead.promise);
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockImplementation((classId, _params, options) => {
    if (options?.signal) return background.promise;
    const read = async () => assignmentsResponse(classId === classA.id
      ? [{ ...publishedAssignment, title: 'Server after PATCH' }]
      : [otherClassAssignment]);
    return options?.skipCache ? read() : cache.dedupe(String(classId), read);
  });

  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);
  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  cache.invalidate();
  const signal = backgroundReads()[0][2]?.signal;
  fireEvent.change(classFilter(), { target: { value: 'all' } });
  expect(signal?.aborted).toBe(true);

  await act(async () => {
    oldRead.resolve(assignmentsResponse([defaultAssignment]));
    await oldRequest;
    background.resolve(assignmentsResponse([defaultAssignment]));
  });

  expect(await screen.findByText('Server after PATCH')).toBeVisible();
  expect(within(cardById(42, classA.name)).getByText(copy.vi.published)).toBeVisible();
  expect(within(cardById(42, classB.name)).getByText(copy.vi.draft)).toBeVisible();
  expect(assignmentService.listAssignments).toHaveBeenLastCalledWith(classB.id, { limit: 50 }, { skipCache: true });
  expect(classService.listMembers).toHaveBeenCalledWith(classA.id, { skipCache: true });
  expect(submissionService.listSubmissions).toHaveBeenCalledWith({ assignmentId: 42, limit: 100 }, { skipCache: true });
});

it.each(['members', 'assignments', 'submissions'] as const)(
  'E07b: a background failure in %s preserves the post-PATCH snapshot and warns once',
  async failingRequest => {
    await showAssignments([defaultAssignment]);
    const card = cardById(42);
    const backgroundFailure = deferred<void>();
    const fail = <T,>() => backgroundFailure.promise.then<T>(() => { throw new Error('GET failed'); });
    if (failingRequest === 'members') {
      vi.mocked(classService.listMembers).mockReturnValueOnce(fail());
    } else if (failingRequest === 'assignments') {
      vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(fail());
    } else {
      vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse([publishedAssignment]));
      vi.mocked(submissionService.listSubmissions).mockReturnValueOnce(fail());
    }
    pressConfirm(openDialog(card, copy.vi.open), copy.vi.open);
    expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
    expect(within(card).getByText(copy.vi.published)).toBeVisible();
    await act(async () => backgroundFailure.resolve());

    expect(screen.getAllByText(errorCopy.vi.refreshFailed)).toHaveLength(1);
    expect(within(card).getByText(copy.vi.published)).toBeVisible();
    expect(activeCount()).toHaveTextContent(/^1$/);
    expect(screen.queryByText('Chưa có bài tập nào')).not.toBeInTheDocument();
  }
);

it('E07b: one failing class discards the whole all-classes refresh', async () => {
  vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
  vi.mocked(assignmentService.listAssignments).mockImplementation((id, _params, options) => {
    if (!options?.signal) {
      return Promise.resolve(assignmentsResponse([id === classA.id ? defaultAssignment : otherClassAssignment]));
    }
    if (id === classB.id) return Promise.reject(new Error('Could not refresh class B'));
    return Promise.resolve(assignmentsResponse([{ ...publishedAssignment, title: 'Unapplied class A' }]));
  });
  renderAssignments('en');
  await screen.findByRole('heading', { name: defaultAssignment.title });
  fireEvent.change(classFilter(), { target: { value: 'all' } });
  expect(await screen.findByText(otherClassAssignment.title)).toBeVisible();
  const target = cardById(42, 'IELTS A');
  pressConfirm(openDialog(target, copy.en.open), copy.en.open);

  expect(await screen.findByText(errorCopy.en.refreshFailed)).toBeVisible();
  expect(screen.getAllByText(errorCopy.en.refreshFailed)).toHaveLength(1);
  expect(screen.queryByText('Unapplied class A')).not.toBeInTheDocument();
  expect(within(target).getByText(copy.en.published)).toBeVisible();
  expect(within(cardById(42, 'IELTS B')).getByText(copy.en.draft)).toBeVisible();
  expect(classFilter()).toHaveValue('all');
});

it('E07b: foreground member and submission failures keep the existing empty-count fallbacks', async () => {
  vi.mocked(classService.listMembers).mockRejectedValue(new Error('Members GET failed'));
  vi.mocked(submissionService.listSubmissions).mockRejectedValue(new Error('Submissions GET failed'));
  await showAssignments([defaultAssignment]);

  const card = cardById(42);
  expect(within(card).getByText('0/0')).toBeVisible();
  expect(within(card).getByText('Chưa có bài nộp')).toBeVisible();
  expect(screen.queryByText(errorCopy.vi.refreshFailed)).not.toBeInTheDocument();
  expect(backgroundReads()).toHaveLength(0);
});

function RemovableAssignments() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setVisible(false)}>Unmount assignments</button>
      {visible && <TeacherAssignments />}
    </>
  );
}

it('E07b: aborts on unmount and suppresses a late background error with the toast provider still mounted', async () => {
  const release = deferred<void>();
  mockForegroundAssignments([defaultAssignment]);
  renderPage(<ToastProvider><RemovableAssignments /></ToastProvider>, '/teacher/assignments');
  await screen.findByRole('heading', { name: defaultAssignment.title });
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(release.promise.then(() => {
    throw new Error('Late GET failure');
  }));
  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);
  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  const signal = backgroundReads()[0][2]?.signal;

  fireEvent.click(screen.getByRole('button', { name: 'Unmount assignments' }));
  expect(signal?.aborted).toBe(true);
  await act(async () => release.resolve());
  expect(screen.queryByText(errorCopy.vi.refreshFailed)).not.toBeInTheDocument();
  expect(screen.queryByText(defaultAssignment.title)).not.toBeInTheDocument();
});

function AssignmentsWithLanguageSwitch() {
  const { toggleLanguage } = useLanguage();
  return (
    <>
      <button type="button" onClick={toggleLanguage}>Switch language</button>
      <TeacherAssignments />
    </>
  );
}

it.each(['class change', 'language change', 'unmount'] as const)(
  'L4: aborts the refresh on %s and ignores its late result',
  async scope => {
    vi.mocked(classService.list).mockResolvedValue(classesResponse([classA, classB]));
    mockForegroundAssignments([defaultAssignment]);
    const page = scope === 'class change' ? <TeacherAssignments />
      : scope === 'language change' ? <AssignmentsWithLanguageSwitch />
        : <RemovableAssignments />;
    renderPage(<ToastProvider>{page}</ToastProvider>, '/teacher/assignments');
    await screen.findByRole('heading', { name: defaultAssignment.title });

    const background = deferred<AssignmentListResponse>();
    vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(scope === 'unmount'
      ? background.promise.then(() => { throw parseApiError(new CanceledError()); })
      : background.promise);
    vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new TimeoutError());
    pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);
    expect(await screen.findByText(copy.vi.unconfirmed)).toBeVisible();
    const signal = backgroundReads()[0][2]?.signal;
    expect(signal?.aborted).toBe(false);

    if (scope === 'unmount') {
      fireEvent.click(screen.getByRole('button', { name: 'Unmount assignments' }));
    } else {
      vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse([
        { ...publishedAssignment, title: 'Current foreground snapshot' },
      ]));
      if (scope === 'class change') {
        fireEvent.change(classFilter(), { target: { value: String(classB.id) } });
      } else {
        fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
      }
      expect(await screen.findByText('Current foreground snapshot')).toBeVisible();
    }

    expect(signal?.aborted).toBe(true);
    await act(async () => background.resolve(assignmentsResponse([{ ...defaultAssignment, title: 'Old background snapshot' }])));
    expect(screen.queryByText('Old background snapshot')).not.toBeInTheDocument();
    expect(screen.queryByText(defaultAssignment.title)).not.toBeInTheDocument();
    expect(screen.queryByText(errorCopy.vi.refreshFailed)).not.toBeInTheDocument();
    expect(screen.queryByText(errorCopy.en.refreshFailed)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.en.unconfirmed)).not.toBeInTheDocument();
    expect(screen.getAllByText(copy.vi.unconfirmed)).toHaveLength(1);
    if (scope !== 'unmount') expect(screen.getByText('Current foreground snapshot')).toBeVisible();
    expect(backgroundReads()).toHaveLength(1);
    expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
  }
);

it('E07b: a language-triggered foreground read invalidates an older pending background scope', async () => {
  const background = deferred<AssignmentListResponse>();
  mockForegroundAssignments([defaultAssignment]);
  renderPage(<ToastProvider><AssignmentsWithLanguageSwitch /></ToastProvider>, '/teacher/assignments');
  await screen.findByRole('heading', { name: defaultAssignment.title });
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  pressConfirm(openDialog(cardById(42), copy.vi.open), copy.vi.open);
  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  const signal = backgroundReads()[0][2]?.signal;
  vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce(assignmentsResponse([
    { ...publishedAssignment, title: 'Current locale read' },
  ]));
  fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));

  expect(await screen.findByText('Current locale read')).toBeVisible();
  expect(signal?.aborted).toBe(true);
  await act(async () => background.resolve(assignmentsResponse([{ ...defaultAssignment, title: 'Old locale read' }])));
  expect(screen.queryByText('Old locale read')).not.toBeInTheDocument();
  expect(within(cardById(42)).getByText(copy.en.published)).toBeVisible();
});

it.each([
  { language: 'vi', update: 'missing', error: new ApiClientError('Conflict', 409), expected: errorCopy.vi.leftList },
  { language: 'en', update: 'changed', error: new ApiClientError('Conflict', 409), expected: errorCopy.en.changed },
  { language: 'vi', update: 'changed', error: new ValidationError(reopenCopy.vi.future), expected: errorCopy.vi.changed },
] as const)('E07c: closes the retained dialog when the server reports $update ($language)', async ({
  language, update, error, expected,
}) => {
  const background = deferred<AssignmentListResponse>();
  await showAssignments([closedAssignment], language);
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(error);
  const { dialog, confirm } = openReopenDialog(cardById(42), language);
  fireEvent.click(confirm);
  expect(await screen.findByText(error.statusCode === 409 ? errorCopy[language].conflict : reopenCopy[language].future, {
    selector: '.eh-toast-container [role="alert"] div',
  })).toBeVisible();
  expect(dialog).toBeVisible();

  await act(async () => background.resolve(assignmentsResponse(update === 'missing' ? [] : [publishedAssignment])));
  expect(await screen.findByText(expected)).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  if (update === 'missing') {
    expect(screen.queryByText(closedAssignment.title)).not.toBeInTheDocument();
  } else {
    expect(within(cardById(42)).getByText(copy[language].published)).toBeVisible();
  }
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledTimes(1);
});

it.each(['search', 'skill filter', 'page'] as const)('E07c: keeps the dialog when its row is hidden only by %s', async hiddenBy => {
  const others: AssignmentFixture[] = Array.from({ length: 11 }, (_, index) => ({
    ...publishedAssignment, id: 100 + index, title: `Other practice ${index}`, skills: ['READING'],
  }));
  const rows = [closedAssignment, ...others];
  await showAssignments(rows);
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new ApiClientError('Conflict', 409));
  const { dialog, confirm } = openReopenDialog(cardById(42));
  fireEvent.click(confirm);
  expect(await screen.findByText(errorCopy.vi.conflict)).toBeVisible();

  if (hiddenBy === 'search') {
    fireEvent.change(screen.getByPlaceholderText('Tìm bài tập theo tên hoặc mã HW...'), { target: { value: 'Other' } });
  } else if (hiddenBy === 'skill filter') {
    fireEvent.click(screen.getByRole('button', { name: 'Reading' }));
  } else {
    fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
  }
  expect(screen.queryByText(closedAssignment.title)).not.toBeInTheDocument();
  await act(async () => background.resolve(assignmentsResponse(rows)));

  expect(dialog).toBeVisible();
  expect(confirm).toBeEnabled();
  expect(screen.queryByText(errorCopy.vi.leftList)).not.toBeInTheDocument();
  expect(screen.queryByText(errorCopy.vi.changed)).not.toBeInTheDocument();
});

it('E07c/P03: refresh clamps a shortened list while keeping the current class, skill and search', async () => {
  const rows: AssignmentFixture[] = Array.from({ length: 11 }, (_, index) => ({
    ...defaultAssignment, id: 100 + index, title: `Practice ${index}`,
  }));
  await showAssignments(rows);
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  fireEvent.click(screen.getByRole('button', { name: 'Writing' }));
  const search = screen.getByPlaceholderText('Tìm bài tập theo tên hoặc mã HW...');
  fireEvent.change(search, { target: { value: 'Practice' } });
  fireEvent.click(screen.getByRole('button', { name: 'Trang 2' }));
  const target = cardById(110);
  pressConfirm(openDialog(target, copy.vi.open), copy.vi.open);
  expect(await screen.findByText(copy.vi.openSuccess)).toBeVisible();
  expect(screen.getByRole('button', { name: 'Trang 2' })).toHaveAttribute('aria-current', 'page');

  await act(async () => background.resolve(assignmentsResponse([
    { ...rows[0], title: 'Practice refreshed' },
    { ...rows[10], status: 'PUBLISHED' },
    { ...rows[1], title: 'Another reading', skills: ['READING'] },
  ])));

  expect(screen.getByRole('button', { name: 'Trang 1' })).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('button', { name: 'Trang 2' })).not.toBeInTheDocument();
  expect(classFilter()).toHaveValue(String(classA.id));
  expect(search).toHaveValue('Practice');
  expect(screen.getByRole('button', { name: 'Writing' })).toHaveClass('active');
  expect(screen.getByText('Practice refreshed')).toBeVisible();
  expect(screen.queryByText('Another reading')).not.toBeInTheDocument();
  expect(within(cardById(110)).getByText(copy.vi.published)).toBeVisible();
  expect(within(cardById(100)).getByText(copy.vi.draft)).toBeVisible();
});

const refreshDeadlineCases = [
  { name: 'untouched and future', edited: false, closeAt: editedDeadlineUtc, expectedValue: editedDeadline, expectedDisabled: false },
  { name: 'untouched and expired', edited: false, closeAt: expired, expectedValue: '', expectedDisabled: true },
  { name: 'edited and expired', edited: true, closeAt: expired, expectedValue: editedDeadline, expectedDisabled: true },
];

it.each(refreshDeadlineCases)('P05: refreshes a CLOSED deadline for $name', async ({
  edited, closeAt, expectedValue, expectedDisabled,
}) => {
  await showAssignments([closedAssignment]);
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(
    edited ? new ValidationError(reopenCopy.vi.afterOpen) : new ApiClientError('Conflict', 409)
  );
  const { dialog, input, confirm } = openReopenDialog(cardById(42));
  if (edited) fireEvent.change(input, { target: { value: editedDeadline } });
  fireEvent.click(confirm);
  expect(await screen.findByText(edited ? reopenCopy.vi.afterOpen : errorCopy.vi.conflict, {
    selector: '.eh-toast-container [role="alert"] div',
  })).toBeVisible();
  await act(async () => background.resolve(assignmentsResponse([{ ...closedAssignment, closeAt }])));

  expect(dialog).toBeVisible();
  expect(input).toHaveValue(expectedValue);
  if (expectedDisabled) expect(confirm).toBeDisabled();
  else expect(confirm).toBeEnabled();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledTimes(1);
  if (edited) {
    fireEvent.change(input, { target: { value: storedPrefill } });
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByRole('alert')).toHaveTextContent(reopenCopy.vi.future);
  }
});

it('409: keeps an eligible CLOSED dialog after refresh and sends exactly one manual retry', async () => {
  await showAssignments([closedAssignment]);
  const background = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValueOnce(background.promise);
  vi.mocked(assignmentService.updateAssignmentStatus).mockRejectedValueOnce(new ApiClientError('Conflict', 409));
  const { dialog, confirm } = openReopenDialog(cardById(42));
  fireEvent.click(confirm);
  expect(await screen.findByText(errorCopy.vi.conflict)).toBeVisible();
  await act(async () => background.resolve(assignmentsResponse([closedAssignment])));

  expect(dialog).toBeVisible();
  expect(confirm).toBeEnabled();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED');
  fireEvent.click(confirm);
  expect(await screen.findByText(reopenCopy.vi.success)).toBeVisible();
  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledTimes(2);
  expect(assignmentService.updateAssignmentStatus).toHaveBeenNthCalledWith(2, 42, 'PUBLISHED');
  expect(backgroundReads()).toHaveLength(2);
});
