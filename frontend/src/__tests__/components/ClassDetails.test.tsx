import { beforeEach, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router-dom';
import ClassDetails from '../../pages/ClassDetails';
import { classService, type ClassDetail } from '../../api/services/class.service';
import { assignmentService, type AssignmentListResponse } from '../../api/services/assignment.service';
import { ApiClientError, ForbiddenError, NetworkError, NotFoundError, TimeoutError } from '../../api/core/errors';
import { deferred } from '../deferred';
import { renderPage } from './renderPage';

vi.mock('../../api/services/class.service', () => ({
  classService: {
    getDetail: vi.fn(),
    listMembers: vi.fn(),
    update: vi.fn(),
    removeMember: vi.fn(),
  },
}));
vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: { listAssignments: vi.fn() },
}));

// Class, member and assignment identities come from local-dev/db-snapshot/.
const classDetail: ClassDetail = {
  id: 1,
  name: 'IELTS Foundation K1',
  level: 'IELTS 4.0-5.0',
  status: 'ACTIVE',
  teacher: { id: 9, fullName: 'Nguyễn Đức Tuấn' },
};
const assignments: AssignmentListResponse = {
  data: [{
    id: 1,
    title: 'Assignment 1 - Daily Routine Vocabulary',
    status: 'DRAFT',
    closeAt: '2026-09-26T06:00:00Z',
    skills: [],
  }],
  pagination: { page: 1, limit: 50, total: 1 },
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(classService.getDetail).mockResolvedValue(classDetail);
  vi.mocked(classService.listMembers).mockResolvedValue([
    { memberId: 1, studentId: 80, fullName: 'Đinh Thị Anh' },
  ]);
  vi.mocked(assignmentService.listAssignments).mockResolvedValue(assignments);
});

function renderClass(id = '1', language: 'vi' | 'en' = 'vi') {
  return renderPage(<ClassDetails />, '/admin/classes/:id', `/admin/classes/${encodeURIComponent(id)}`, undefined, language);
}

async function openAssignments() {
  await screen.findByRole('heading', { name: classDetail.name });
  await userEvent.click(screen.getByRole('button', { name: /Bài tập & Điểm số/ }));
}

function expectNoClassRequests() {
  expect(classService.getDetail).not.toHaveBeenCalled();
  expect(classService.listMembers).not.toHaveBeenCalled();
  expect(assignmentService.listAssignments).not.toHaveBeenCalled();
  expect(classService.update).not.toHaveBeenCalled();
  expect(classService.removeMember).not.toHaveBeenCalled();
}

function expectNoEmptyAssignments() {
  expect(screen.queryByText('Chưa có bài tập nào')).not.toBeInTheDocument();
  expect(screen.queryByText('Chưa có bài tập nào được giao cho lớp này')).not.toBeInTheDocument();
}

it.each(['1', '001'])('loads the exact numeric class and assignment table for ID %s', async id => {
  renderClass(id);
  await openAssignments();

  expect(classService.getDetail).toHaveBeenCalledExactlyOnceWith(1);
  expect(classService.listMembers).toHaveBeenCalledExactlyOnceWith(1);
  expect(assignmentService.listAssignments).toHaveBeenCalledExactlyOnceWith(1, { limit: 50 });
  expect(within(screen.getByRole('table')).getByText(assignments.data[0].title)).toBeVisible();
  expectNoEmptyAssignments();
});

it.each([
  'not-a-number', '-1', '0', '1.5', '1e3', '+1', ' 1', '1 ', 'abc1', '1abc', '9007199254740993',
])('rejects invalid URL ID %j without any class request', async id => {
  renderClass(id);

  expect(await screen.findByRole('alert')).toHaveTextContent('ID lớp không hợp lệ');
  expect(screen.queryByText(classDetail.name)).not.toBeInTheDocument();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expectNoClassRequests();
});

it('rejects a missing ID without class requests', () => {
  renderPage(<ClassDetails />, '/admin/classes');

  expect(screen.getByRole('alert')).toHaveTextContent('ID lớp không hợp lệ');
  expectNoClassRequests();
});

it('shows the invalid ID message in English', async () => {
  renderClass('not-a-number', 'en');

  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid class ID');
  expectNoClassRequests();
});

it('shows genuine empty assignments without a permission error', async () => {
  vi.mocked(assignmentService.listAssignments).mockResolvedValue({
    data: [], pagination: { page: 1, limit: 50, total: 0 },
  });
  renderClass();
  await openAssignments();

  expect(screen.getByText('Chưa có bài tập nào')).toBeVisible();
  expect(screen.queryByText('Giới hạn quyền truy cập')).not.toBeInTheDocument();
});

it('shows permission restrictions and an unknown KPI for 403 rather than empty data', async () => {
  vi.mocked(assignmentService.listAssignments).mockRejectedValue(new ForbiddenError());
  const { container } = renderClass();
  await openAssignments();

  expect(screen.getByText('Giới hạn quyền truy cập')).toBeVisible();
  const assignmentKpi = container.querySelectorAll('.adm-kpi-value')[2];
  expect(assignmentKpi).toHaveTextContent('—');
  expect(assignmentKpi).not.toHaveTextContent('0');
  expectNoEmptyAssignments();
});

it('does not show empty assignments or a false zero while loading', async () => {
  const pending = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValue(pending.promise);
  const { container } = renderClass();

  expect(classService.getDetail).toHaveBeenCalledWith(1);
  expectNoEmptyAssignments();
  expect(container.querySelector('.adm-kpi-value')).not.toBeInTheDocument();
  expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();

  await act(async () => { pending.resolve(assignments); });
  await openAssignments();
  expect(screen.getByText(assignments.data[0].title)).toBeVisible();
});

it('keeps the requested valid ID when the class APIs return 404 and does not show empty assignments', async () => {
  vi.mocked(classService.getDetail).mockRejectedValue(new NotFoundError());
  vi.mocked(classService.listMembers).mockRejectedValue(new NotFoundError());
  vi.mocked(assignmentService.listAssignments).mockRejectedValue(new NotFoundError());
  renderClass('999999');

  expect(await screen.findByText('Không thể tải thông tin chi tiết lớp học.')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: /Bài tập & Điểm số/ }));
  expect(screen.getByText('Không thể tải danh sách bài tập')).toBeVisible();
  expect(classService.getDetail).toHaveBeenCalledExactlyOnceWith(999999);
  expect(classService.listMembers).toHaveBeenCalledExactlyOnceWith(999999);
  expect(assignmentService.listAssignments).toHaveBeenCalledExactlyOnceWith(999999, { limit: 50 });
  expect(screen.queryByText(classDetail.name)).not.toBeInTheDocument();
  expectNoEmptyAssignments();
});

it.each([
  ['server', new ApiClientError('Server unavailable', 503)],
  ['network', new NetworkError()],
  ['timeout', new TimeoutError()],
])('shows an assignment error and recovers after retry (%s)', async (_kind, error) => {
  vi.mocked(assignmentService.listAssignments).mockRejectedValueOnce(error);
  renderClass();
  await openAssignments();

  expect(screen.getByText('Không thể tải danh sách bài tập')).toBeVisible();
  expect(screen.queryByText('Giới hạn quyền truy cập')).not.toBeInTheDocument();
  expectNoEmptyAssignments();
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

  expect(await screen.findByText(assignments.data[0].title)).toBeVisible();
  expect(assignmentService.listAssignments).toHaveBeenCalledTimes(2);
  expect(assignmentService.listAssignments).toHaveBeenLastCalledWith(1, { limit: 50 });
  expect(screen.queryByText('Không thể tải danh sách bài tập')).not.toBeInTheDocument();
});

it('hides the old class and sends no new requests when the URL changes to an invalid ID', async () => {
  renderPage(
    <><ClassDetails /><Link to="/admin/classes/not-a-number">Invalid class URL</Link></>,
    '/admin/classes/:id', '/admin/classes/1',
  );
  await screen.findByRole('heading', { name: classDetail.name });
  await userEvent.click(screen.getByRole('link', { name: 'Invalid class URL' }));

  expect(screen.getByRole('alert')).toHaveTextContent('ID lớp không hợp lệ');
  expect(screen.queryByText(classDetail.name)).not.toBeInTheDocument();
  expect(classService.getDetail).toHaveBeenCalledTimes(1);
  expect(classService.listMembers).toHaveBeenCalledTimes(1);
  expect(assignmentService.listAssignments).toHaveBeenCalledTimes(1);
  expect(classService.update).not.toHaveBeenCalled();
  expect(classService.removeMember).not.toHaveBeenCalled();
});

it('does not log errors or warnings when an initial request settles after unmount', async () => {
  const errorSpy = vi.spyOn(console, 'error');
  const warningSpy = vi.spyOn(console, 'warn');
  const pending = deferred<AssignmentListResponse>();
  vi.mocked(assignmentService.listAssignments).mockReturnValue(pending.promise);
  const { unmount } = renderClass();
  await waitFor(() => expect(assignmentService.listAssignments).toHaveBeenCalledTimes(1));
  unmount();

  await act(async () => { pending.resolve(assignments); });

  expect(errorSpy).not.toHaveBeenCalled();
  expect(warningSpy).not.toHaveBeenCalled();
});
