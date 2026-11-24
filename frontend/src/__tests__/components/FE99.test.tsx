import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosAdapter } from 'axios';
import { useState, type ComponentProps, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, expect, it, onTestFinished, vi } from 'vitest';
import App from '../../App';
import { apiClient } from '../../api/core/client';
import { ApiClientError, ForbiddenError, NetworkError, NotFoundError, TimeoutError, ValidationError } from '../../api/core/errors';
import { MockHttpClient } from '../../api/__tests__/helpers/mock-http-client';
import { classService } from '../../api/services/class.service';
import { authService } from '../../api/services/auth.service';
import { reportService } from '../../api/services/report.service';
import { studentEvaluationService } from '../../api/services/student-evaluation.service';
import { UserService, userService, type UserProfile } from '../../api/services/user.service';
import { AdminUserProfileDrawer } from '../../components/admin/AdminUserProfileDrawer';
import { AuthContext } from '../../contexts/AuthContext';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
import { Profile } from '../../pages/Profile';
import { StudentDetails } from '../../pages/StudentDetails';
import { TeacherDetails } from '../../pages/TeacherDetails';
import { Teachers } from '../../pages/Teachers';
import { deferred } from '../deferred';
import { renderPage } from './renderPage';

const pagination = vi.hoisted(() => ({ useSmallPages: false }));

vi.mock(import('../../components/common/Pagination'), async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    Pagination: (props: Parameters<typeof original.Pagination>[0]) => {
      const options = props.pageSizeOptions ?? [];
      const pageSizeOptions = pagination.useSmallPages ? [3, ...options] : options;
      return <original.Pagination {...props} pageSizeOptions={pageSizeOptions} />;
    },
  };
});

// Identities and class membership come from local-dev/db-snapshot/users.csv and class_members.csv.
const teacher: UserProfile = {
  id: 4, fullName: 'Phạm Diệu Anh', email: 'pham.dieu.anh@gmail.com', role: 'TEACHER', status: 'ACTIVE',
};
const otherTeacher: UserProfile = {
  id: 9, fullName: 'Nguyễn Đức Tuấn', email: 'nguyen.duc.tuan@gmail.com', role: 'TEACHER', status: 'ACTIVE',
};
const student: UserProfile = {
  id: 12, fullName: 'Ngô Thị Phương', email: 'ngo.thi.phuong@gmail.com', role: 'STUDENT', status: 'ACTIVE',
};
const otherStudent: UserProfile = {
  id: 27, fullName: 'Phan Quốc Tùng', email: 'phan.quoc.tung@gmail.com', role: 'STUDENT', status: 'LOCKED',
};

interface DetailsPage {
  name: string;
  path: string;
  Component: ComponentType;
  primary: UserProfile;
  secondary: UserProfile;
  wrongRole: UserProfile;
  activeVi: string;
  loading: string;
  unavailable: string;
  invalidId: string;
  back: string;
  badges: number;
}

const pages: DetailsPage[] = [
  {
    name: 'TeacherDetails', path: '/admin/teachers', Component: TeacherDetails,
    primary: teacher, secondary: otherTeacher, wrongRole: student, activeVi: 'Đang hoạt động',
    loading: 'Loading teacher details...', unavailable: 'Teacher profile unavailable',
    invalidId: 'Invalid teacher ID.', back: 'Back to Teachers', badges: 1,
  },
  {
    name: 'StudentDetails', path: '/admin/students', Component: StudentDetails,
    primary: student, secondary: otherStudent, wrongRole: teacher, activeVi: 'Hoạt động',
    loading: 'Loading student details...', unavailable: 'Student profile unavailable',
    invalidId: 'Invalid student ID.', back: 'Back to Students', badges: 2,
  },
];

const statusAction = /^(Suspend|Reactivate|Lock Account|Unlock|Khóa tài khoản|Mở khóa tài khoản|Mở khóa)$/i;

beforeEach(() => {
  pagination.useSmallPages = false;
  vi.spyOn(userService, 'getAdminUserDetail').mockRejectedValue(new NotFoundError());
  vi.spyOn(userService, 'getUserById').mockResolvedValue(null);
  vi.spyOn(userService, 'listUsers').mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
  vi.spyOn(userService, 'updateStatus').mockResolvedValue(student);
  vi.spyOn(userService, 'updateUser').mockResolvedValue({ message: 'Updated' });
  vi.spyOn(classService, 'list').mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
  vi.spyOn(reportService, 'getStudentProgress').mockImplementation(async id => ({
    studentId: id,
    studentName: id === student.id ? student.fullName : otherStudent.fullName,
    classId: id === student.id ? 3 : 5,
    skillAverages: [],
    scoreTimeline: [],
  }));
  vi.spyOn(studentEvaluationService, 'list').mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
});

function mountDetail(page: DetailsPage, id: string | number, language = 'en') {
  const { Component, path } = page;
  const entry = id === '' ? path : `${path}/${id}`;
  return renderPage(<Component />, `${path}/:id?`, entry, undefined, language);
}

function expectNoProfile(container: HTMLElement, name: string) {
  expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument();
  expect(container.querySelector('.badge')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /security/i })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /^(Edit|Sửa)$/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: statusAction })).not.toBeInTheDocument();
  expect(userService.updateUser).not.toHaveBeenCalled();
  expect(userService.updateStatus).not.toHaveBeenCalled();
}

const invalidIds = ['', '0', '-4', 'GV-004', '9007199254740992'];

it.each(pages.flatMap(page => invalidIds.map(id => ({ name: page.name, page, id }))))(
  'I1 $name rejects route ID "$id" before requesting any data',
  async ({ page, id }) => {
    const { container } = mountDetail(page, id);

    expect(await screen.findByRole('alert')).toHaveTextContent(page.invalidId);
    expect(screen.getByRole('button', { name: page.back })).toBeEnabled();
    expectNoProfile(container, page.primary.fullName);
    expect(userService.getAdminUserDetail).not.toHaveBeenCalled();
    expect(userService.getUserById).not.toHaveBeenCalled();
    expect(classService.list).not.toHaveBeenCalled();
    expect(reportService.getStudentProgress).not.toHaveBeenCalled();
    expect(studentEvaluationService.list).not.toHaveBeenCalled();
  },
);

const loadErrors = [
  { label: '400', error: new ApiClientError('Invalid request', 400) },
  { label: '403', error: new ForbiddenError('Forbidden') },
  { label: '404 (absent or soft-deleted)', error: new NotFoundError('Not found') },
  { label: '500', error: new ApiClientError('Server error', 500) },
  { label: 'network', error: new NetworkError('Network unavailable') },
  { label: 'timeout', error: new TimeoutError('Request timed out') },
];

it.each(pages.flatMap(page => loadErrors.map(error => ({ name: page.name, page, ...error }))))(
  'I2 $name shows an in-page error and no profile on $label',
  async ({ page, error }) => {
    vi.mocked(userService.getAdminUserDetail).mockRejectedValue(error);
    const { container } = mountDetail(page, page.primary.id);

    expect(await screen.findByRole('alert')).toHaveTextContent(error.message);
    expectNoProfile(container, page.primary.fullName);
    expect(userService.getUserById).not.toHaveBeenCalled();
    expect(userService.listUsers).not.toHaveBeenCalled();
  },
);

const mismatchedProfiles = pages.flatMap(page => [
  { name: page.name, page, variant: 'ID', id: page.primary.id, response: page.secondary },
  { name: page.name, page, variant: 'role', id: page.wrongRole.id, response: page.wrongRole },
]);

it.each(mismatchedProfiles)('I2 $name rejects a mismatched response $variant', async ({ page, id, response }) => {
  vi.mocked(userService.getAdminUserDetail).mockResolvedValue(response);
  const { container } = mountDetail(page, id);

  expect(await screen.findByRole('alert')).toHaveTextContent(page.unavailable);
  expect(userService.getAdminUserDetail).toHaveBeenCalledExactlyOnceWith(id, { signal: expect.any(AbortSignal) });
  expectNoProfile(container, response.fullName);
});

function NextProfile({ to }: { to: string }) {
  const navigate = useNavigate();
  return <button type="button" onClick={() => navigate(to)}>Next profile</button>;
}

it.each(pages)('I3 $name aborts the old ID and ignores its late response', async page => {
  const oldRequest = deferred<UserProfile>();
  const newRequest = deferred<UserProfile>();
  vi.mocked(userService.getAdminUserDetail)
    .mockReturnValueOnce(oldRequest.promise)
    .mockReturnValueOnce(newRequest.promise);
  const { Component, path, primary, secondary } = page;
  const view = renderPage(
    <><NextProfile to={`${path}/${secondary.id}`} /><Component /></>,
    `${path}/:id`, `${path}/${primary.id}`, undefined, 'en',
  );

  expect(screen.getByText(page.loading)).toBeVisible();
  expectNoProfile(view.container, primary.fullName);
  await userEvent.click(screen.getByRole('button', { name: 'Next profile' }));
  expect(screen.getByText(page.loading)).toBeVisible();
  expectNoProfile(view.container, primary.fullName);

  const [firstCall, secondCall] = vi.mocked(userService.getAdminUserDetail).mock.calls;
  expect(firstCall[0]).toBe(primary.id);
  expect(firstCall[1]?.signal?.aborted).toBe(true);
  expect(secondCall[0]).toBe(secondary.id);
  expect(secondCall[1]?.signal?.aborted).toBe(false);

  await act(async () => newRequest.resolve(secondary));
  await act(async () => oldRequest.resolve(primary));
  expect(screen.getByRole('heading', { name: secondary.fullName })).toBeVisible();
  expect(screen.queryByRole('heading', { name: primary.fullName })).not.toBeInTheDocument();
  view.unmount();
  expect(secondCall[1]?.signal?.aborted).toBe(true);
});

const knownStatuses = pages.flatMap(page => [
  { name: page.name, page, language: 'en', activeLabel: 'Active', lockedLabel: 'Locked' },
  { name: page.name, page, language: 'vi', activeLabel: page.activeVi, lockedLabel: 'Đã khóa' },
]);

it.each(knownStatuses)('S1 $name shows the real ACTIVE and LOCKED badge in $language', async ({ page, language, activeLabel, lockedLabel }) => {
  vi.mocked(userService.getAdminUserDetail).mockResolvedValue(page.primary);
  const { unmount } = mountDetail(page, page.primary.id, language);
  const activeBadges = await screen.findAllByText(activeLabel);
  expect(activeBadges).toHaveLength(page.badges);
  activeBadges.forEach(badge => expect(badge).toHaveClass('badge-active'));
  expect(screen.getByRole('button', { name: statusAction })).toBeEnabled();
  expect(screen.getByRole('button', { name: /^(Edit|Sửa)$/ })).toBeEnabled();
  unmount();

  vi.mocked(userService.getAdminUserDetail).mockResolvedValue({ ...page.primary, status: 'LOCKED' });
  mountDetail(page, page.primary.id, language);
  const lockedBadges = await screen.findAllByText(lockedLabel);
  expect(lockedBadges).toHaveLength(page.badges);
  lockedBadges.forEach(badge => expect(badge).toHaveClass('badge-blocked'));
  expect(screen.getByRole('button', { name: statusAction })).toBeEnabled();
  expect(screen.getByRole('button', { name: /^(Edit|Sửa)$/ })).toBeEnabled();
});

const unknownStatuses = [
  { variant: 'INACTIVE', fields: { status: 'INACTIVE' } },
  { variant: 'unknown', fields: { status: 'UNKNOWN' } },
  { variant: 'null', fields: { status: null } },
  { variant: 'missing', fields: {} },
];

it.each(knownStatuses.flatMap(locale => unknownStatuses.map(status => ({ ...locale, ...status }))))(
  'S2 $name exposes a neutral status and no status action for $variant in $language',
  async ({ page, language, fields }) => {
    const { id, fullName, email, role } = page.primary;
    vi.mocked(userService.getAdminUserDetail).mockResolvedValue({ id, fullName, email, role, ...fields } as UserProfile);
    mountDetail(page, id, language);

    const labels = await screen.findAllByText(language === 'vi' ? 'Chưa xác định' : 'Unknown');
    expect(labels).toHaveLength(page.badges);
    labels.forEach(label => {
      expect(label).toHaveClass('sr-only');
      const badge = label.closest('.badge-neutral');
      expect(badge?.querySelector('[aria-hidden="true"]')).toHaveTextContent('—');
    });
    expect(screen.queryByRole('button', { name: statusAction })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^(Edit|Sửa)$/ })).toBeEnabled();
  },
);

it.each(knownStatuses)('S3 $name displays loading without profile actions or badge in $language until GET completes', async ({ page, language, activeLabel }) => {
  const request = deferred<UserProfile>();
  vi.mocked(userService.getAdminUserDetail).mockReturnValue(request.promise);
  const { container } = mountDetail(page, page.primary.id, language);

  const loading = page.name === 'TeacherDetails' ? 'Đang tải thông tin giảng viên...' : 'Đang tải thông tin học viên...';
  expect(screen.getByText(language === 'vi' ? loading : page.loading)).toBeVisible();
  expect(screen.queryByText(activeLabel)).not.toBeInTheDocument();
  expectNoProfile(container, page.primary.fullName);
  await act(async () => request.resolve(page.primary));
  expect(screen.getByRole('heading', { name: page.primary.fullName })).toBeVisible();
});

it.each(['report', 'evaluations', 'both'])('keeps a verified student profile when %s fail', async failedSource => {
  vi.mocked(userService.getAdminUserDetail).mockResolvedValue(student);
  if (failedSource !== 'evaluations') {
    vi.mocked(reportService.getStudentProgress).mockRejectedValue(new NetworkError());
  }
  if (failedSource !== 'report') {
    vi.mocked(studentEvaluationService.list).mockRejectedValue(new NetworkError());
  }
  mountDetail(pages[1], student.id);

  expect(await screen.findByRole('heading', { name: student.fullName })).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(reportService.getStudentProgress).toHaveBeenCalledExactlyOnceWith(student.id);
  expect(studentEvaluationService.list).toHaveBeenCalledExactlyOnceWith(student.id);
});

it('retries only the student profile without reloading reports or evaluations', async () => {
  vi.mocked(userService.getAdminUserDetail)
    .mockRejectedValueOnce(new NetworkError())
    .mockResolvedValueOnce(student);
  mountDetail(pages[1], student.id);

  expect(await screen.findByRole('alert')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByRole('heading', { name: student.fullName })).toBeVisible();
  expect(userService.getAdminUserDetail).toHaveBeenCalledTimes(2);
  expect(reportService.getStudentProgress).toHaveBeenCalledExactlyOnceWith(student.id);
  expect(studentEvaluationService.list).toHaveBeenCalledExactlyOnceWith(student.id);
});

it('passes the AbortSignal to the strict detail GET and preserves the HTTP error without falling back', async () => {
  const http = new MockHttpClient();
  const httpError = new NotFoundError();
  http.mockError = httpError;
  const service = new UserService(http);
  const { signal } = new AbortController();

  await expect(service.getAdminUserDetail(teacher.id, { signal })).rejects.toBe(httpError);
  expect(http.calls).toEqual([{ method: 'GET', url: `/admin/users/${teacher.id}`, options: { signal } }]);
});

const teacherRows: UserProfile[] = [
  teacher,
  { ...teacher, id: 5, fullName: 'Cao Ngọc Thảo', email: 'cao.ngoc.thao@gmail.com' },
  { ...teacher, id: 6, fullName: 'Huỳnh Bảo Thảo', email: 'huynh.bao.thao@gmail.com' },
  { ...teacher, id: 7, fullName: 'Hoàng Đức Tuấn', email: 'hoang.duc.tuan@gmail.com' },
  { ...teacher, id: 8, fullName: 'Dương Quỳnh Hân', email: 'duong.quynh.han@gmail.com' },
  otherTeacher,
  { ...teacher, id: 10, fullName: 'Tạ Văn Tuấn', email: 'ta.van.tuan@gmail.com' },
  { ...teacher, id: 11, fullName: 'Trần Anh Thắng', email: 'tran.anh.thang@gmail.com' },
];

// The user snapshot contains identities, and the issue supplies the test specialization.
const specialization = 'Business English X';
const longSpecialization = specialization.replaceAll(' ', '').repeat(12);
const absentSpecializations = [
  { variant: 'missing', fields: {} },
  { variant: 'null', fields: { specialization: null } },
  { variant: 'empty', fields: { specialization: '' } },
  { variant: 'whitespace', fields: { specialization: '   ' } },
];
const teacherLocales = [
  {
    language: 'en', active: 'Active', locked: 'Locked', unknown: 'Unknown', missing: 'Not specified',
    search: 'Search teachers...', save: 'Save Changes',
  },
  {
    language: 'vi', active: 'Đang hoạt động', locked: 'Đã khóa', unknown: 'Chưa xác định', missing: 'Chưa cập nhật',
    search: 'Tìm tên giáo viên, mã GV, email...', save: 'Lưu thay đổi',
  },
] as const;

function mountTeachers(rows: UserProfile[], language = 'en') {
  vi.mocked(userService.listUsers).mockResolvedValue({
    data: rows, pagination: { page: 1, limit: 100, total: rows.length },
  });
  return renderPage(<Teachers />, '/admin/teachers', undefined, undefined, language);
}

async function findTeacherCard(profile: UserProfile) {
  const heading = await screen.findByRole('heading', { name: profile.fullName });
  const card = heading.closest<HTMLElement>('.eh-card');
  if (!card) throw new Error('Teacher card not found');
  return within(card);
}

function detailRequests() {
  return vi.mocked(userService.getAdminUserDetail).mock.calls.map(([id]) => id);
}

it.each(teacherLocales)('S1 Teachers uses the summary status and shows real specialization in $language', async locale => {
  vi.mocked(userService.getAdminUserDetail)
    .mockResolvedValueOnce({ ...teacher, status: 'LOCKED', specialization })
    .mockResolvedValueOnce(otherTeacher);
  mountTeachers([teacher, { ...otherTeacher, status: 'LOCKED' }], locale.language);

  const activeCard = await findTeacherCard(teacher);
  const lockedCard = await findTeacherCard(otherTeacher);
  expect(activeCard.getByText(locale.active)).toHaveClass('badge-active');
  expect(lockedCard.getByText(locale.locked)).toHaveClass('badge-blocked');
  expect(activeCard.getByText(specialization)).toBeVisible();
  expect(lockedCard.getByText(locale.missing)).toBeVisible();
  expect(userService.getAdminUserDetail).toHaveBeenCalledTimes(2);
  expect(userService.getAdminUserDetail).toHaveBeenCalledWith(teacher.id, { signal: expect.any(AbortSignal) });
  expect(userService.getUserById).not.toHaveBeenCalled();
  expect(userService.listUsers).toHaveBeenCalledExactlyOnceWith({ role: 'TEACHER', limit: 100 });
});

it.each(teacherLocales.flatMap(locale => unknownStatuses.map(status => ({ ...locale, ...status }))))(
  'S2 Teachers renders a neutral badge for $variant in $language',
  async ({ language, unknown, fields }) => {
    const { id, fullName, email, role } = teacher;
    mountTeachers([{ id, fullName, email, role, ...fields } as UserProfile], language);

    const card = await findTeacherCard(teacher);
    const label = card.getByText(unknown);
    expect(label).toHaveClass('sr-only');
    expect(label.closest('.badge-neutral')?.querySelector('[aria-hidden="true"]')).toHaveTextContent('—');
    expect(card.queryByRole('button', { name: statusAction })).not.toBeInTheDocument();
  },
);

it.each(teacherLocales)('P1 TeacherDetails uses the verified specialization in both sections in $language', async ({ language }) => {
  vi.mocked(userService.getAdminUserDetail).mockResolvedValue({ ...teacher, specialization });
  mountDetail(pages[0], teacher.id, language);

  expect(await screen.findAllByText(specialization)).toHaveLength(2);
  expect(screen.queryByText(/TESOL|CELTA/)).not.toBeInTheDocument();
});

it.each(teacherLocales.flatMap(locale => absentSpecializations.map(value => ({ ...locale, ...value }))))(
  'P2 Teachers and TeacherDetails show a neutral placeholder for $variant in $language',
  async ({ language, fields, missing }) => {
    vi.mocked(userService.getAdminUserDetail).mockResolvedValue({ ...teacher, ...fields } as UserProfile);
    const { unmount } = mountTeachers([teacher], language);
    const card = await findTeacherCard(teacher);
    expect(await card.findByText(missing)).toBeVisible();
    unmount();

    mountDetail(pages[0], teacher.id, language);
    expect(await screen.findAllByText(missing)).toHaveLength(2);
  },
);

it('P2 Clips long specialization on the card and keeps the full text available in details', async () => {
  vi.mocked(userService.getAdminUserDetail).mockResolvedValue({ ...teacher, specialization: longSpecialization });
  const { unmount } = mountTeachers([teacher]);
  const card = await findTeacherCard(teacher);
  const preview = await card.findByText(longSpecialization);
  expect(preview).toHaveClass('adm-rep-student-sub');
  expect(preview).toHaveAttribute('title', longSpecialization);
  unmount();

  mountDetail(pages[0], teacher.id);
  const [, overview] = await screen.findAllByText(longSpecialization);
  expect(overview).toHaveClass('break-all');
});

it.each([
  ...loadErrors.map(({ label, error }) => ({ label, response: () => Promise.reject(error) })),
  { label: 'wrong ID', response: async () => ({ ...otherTeacher, specialization: longSpecialization }) },
  { label: 'wrong role', response: async () => ({ ...student, id: teacher.id, specialization: longSpecialization }) },
])('P2 Teachers isolates specialization failure for $label', async ({ response }) => {
  vi.mocked(userService.getAdminUserDetail)
    .mockImplementationOnce(response)
    .mockResolvedValueOnce({ ...otherTeacher, specialization });
  mountTeachers([{ ...teacher, status: 'LOCKED' }, otherTeacher]);

  const failedCard = await findTeacherCard(teacher);
  const goodCard = await findTeacherCard(otherTeacher);
  expect(await failedCard.findByText('Could not load specialization')).toBeVisible();
  expect(failedCard.getByText('Locked')).toHaveClass('badge-blocked');
  expect(failedCard.queryByText(longSpecialization)).not.toBeInTheDocument();
  expect(goodCard.getByText(specialization)).toBeVisible();
  expect(goodCard.getByText('Active')).toHaveClass('badge-active');
});

it('P3 Teachers schedules at most four concurrent detail GETs and aborts on unmount', async () => {
  const pending = teacherRows.map(() => deferred<UserProfile>());
  const detail = vi.mocked(userService.getAdminUserDetail);
  pending.forEach(request => detail.mockReturnValueOnce(request.promise));
  const { unmount } = mountTeachers(teacherRows);
  const card = await findTeacherCard(teacher);

  expect(card.getByText('Loading specialization...')).toBeVisible();
  expect(detailRequests()).toEqual(teacherRows.slice(0, 4).map(({ id }) => id));
  await act(async () => pending[0].resolve({ ...teacher, specialization }));
  expect(detailRequests()).toEqual(teacherRows.slice(0, 5).map(({ id }) => id));
  expect(card.getByText(specialization)).toBeVisible();

  unmount();
  expect(detail.mock.calls.every(([, options]) => options?.signal?.aborted)).toBe(true);
  await act(async () => pending.forEach((request, index) => request.resolve(teacherRows[index])));
  expect(detail).toHaveBeenCalledTimes(5);
});

it('P3 Teachers aborts old page and page-size queues, ignores late replies, and loads only visible IDs', async () => {
  pagination.useSmallPages = true;
  const detail = vi.mocked(userService.getAdminUserDetail);
  const oldRequests = teacherRows.slice(0, 4).map(() => deferred<UserProfile>());
  oldRequests.forEach(request => detail.mockReturnValueOnce(request.promise));
  detail.mockImplementation(async id => {
    const profile = teacherRows.find(row => row.id === id);
    if (!profile) throw new NotFoundError();
    return { ...profile, specialization };
  });
  mountTeachers(teacherRows);
  await findTeacherCard(teacher);

  const firstIds = teacherRows.slice(0, 4).map(({ id }) => id);
  expect(detailRequests()).toEqual(firstIds);
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Items per page' }), '3');
  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(screen.queryByRole('heading', { name: teacher.fullName })).not.toBeInTheDocument();
  expect(detail.mock.calls.every(([, options]) => options?.signal?.aborted)).toBe(true);
  expect(detailRequests()).toEqual(firstIds);

  await act(async () => oldRequests.forEach((request, index) => {
    request.resolve({ ...teacherRows[index], specialization: longSpecialization });
  }));
  expect(detailRequests()).toEqual([...firstIds, ...teacherRows.slice(3, 6).map(({ id }) => id)]);
  expect(screen.getAllByText(specialization)).toHaveLength(3);
  expect(screen.queryByText(longSpecialization)).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
  const firstCard = await findTeacherCard(teacher);
  expect(firstCard.getByText(specialization)).toBeVisible();
  expect(detailRequests().slice(-3)).toEqual(teacherRows.slice(0, 3).map(({ id }) => id));
});

it('P3 Teachers keeps identical search sets in flight, replaces changed sets, and aborts for empty results', async () => {
  const first = deferred<UserProfile>();
  const next = deferred<UserProfile>();
  const detail = vi.mocked(userService.getAdminUserDetail)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(next.promise);
  mountTeachers([teacher, otherTeacher]);
  await findTeacherCard(teacher);
  await waitFor(() => expect(detail).toHaveBeenCalled());
  const search = screen.getByPlaceholderText('Search teachers...');
  const firstSignal = detail.mock.calls[0]?.[1]?.signal;

  fireEvent.change(search, { target: { value: 'GV-' } });
  fireEvent.change(search, { target: { value: 'GV-00' } });
  expect(detailRequests()).toEqual([teacher.id, otherTeacher.id]);
  expect(firstSignal?.aborted).toBe(false);

  detail.mockResolvedValue({ ...otherTeacher, specialization });
  fireEvent.change(search, { target: { value: otherTeacher.email } });
  expect(firstSignal?.aborted).toBe(true);
  expect((await findTeacherCard(otherTeacher)).getByText(specialization)).toBeVisible();
  expect(detailRequests()).toEqual([teacher.id, otherTeacher.id, otherTeacher.id]);
  await act(async () => {
    first.resolve({ ...teacher, specialization: longSpecialization });
    next.resolve({ ...otherTeacher, specialization: longSpecialization });
  });
  expect(screen.queryByText(longSpecialization)).not.toBeInTheDocument();

  const last = deferred<UserProfile>();
  detail.mockReturnValueOnce(last.promise);
  fireEvent.change(search, { target: { value: teacher.email } });
  const lastSignal = detail.mock.calls.at(-1)?.[1]?.signal;
  fireEvent.change(search, { target: { value: 'GV-000' } });
  expect(screen.getByText('No teachers found')).toBeVisible();
  expect(lastSignal?.aborted).toBe(true);
  expect(detailRequests()).toEqual([teacher.id, otherTeacher.id, otherTeacher.id, teacher.id]);
  await act(async () => last.resolve({ ...teacher, specialization: longSpecialization }));
  expect(screen.queryByText(longSpecialization)).not.toBeInTheDocument();
});

it('P3 Teachers makes no detail requests when the summary list is empty', async () => {
  mountTeachers([]);
  expect(await screen.findByText('No teachers found')).toBeVisible();
  expect(userService.getAdminUserDetail).not.toHaveBeenCalled();
});

it('P4 Teachers preserves name, code and email search, per-page choices, and cached detail', async () => {
  const [active, missing, failed] = teacherRows;
  vi.mocked(userService.getAdminUserDetail)
    .mockResolvedValueOnce({ ...active, specialization })
    .mockResolvedValueOnce(missing)
    .mockRejectedValueOnce(new TimeoutError());
  mountTeachers([active, missing, failed]);
  await screen.findByText('Could not load specialization');

  expect(screen.queryByRole('button', { name: /^(TESOL|Writing|Speaking)$/ })).not.toBeInTheDocument();
  expect(screen.queryByText('IELTS 8.0+')).not.toBeInTheDocument();
  const pageSize = screen.getByRole('combobox', { name: 'Items per page' });
  expect(pageSize).toHaveValue('9');
  expect(within(pageSize).getAllByRole('option').map(option => option.textContent)).toEqual(['9', '18', '27', '45']);

  for (const value of ['18', '27', '45']) await userEvent.selectOptions(pageSize, value);
  const search = screen.getByPlaceholderText('Search teachers...');
  for (const value of [active.fullName.toUpperCase(), 'gv-004', active.email]) {
    fireEvent.change(search, { target: { value } });
    expect(screen.getByRole('heading', { name: active.fullName })).toBeVisible();
    expect(screen.queryByRole('heading', { name: missing.fullName })).not.toBeInTheDocument();
  }
  fireEvent.change(search, { target: { value: '' } });
  expect(screen.getByText('Not specified')).toBeVisible();
  expect(screen.getByText('Could not load specialization')).toBeVisible();
  expect(detailRequests()).toEqual([active.id, missing.id, failed.id]);
});

function mountOwnProfile(profile: UserProfile | null, language: string, fallbackSpecialization?: string) {
  const get = vi.spyOn(userService, 'getMyProfile');
  if (profile) get.mockResolvedValue(profile);
  else get.mockRejectedValue(new NetworkError());
  return renderPage(
    <AuthContext.Provider value={{
      user: { ...teacher, role: 'teacher', specialization: fallbackSpecialization },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    }}>
      <Profile />
    </AuthContext.Provider>,
    '/teacher/profile', undefined, undefined, language,
  );
}

it.each(teacherLocales.flatMap(locale => absentSpecializations.map(value => ({ ...locale, ...value }))))(
  'P5 Profile shows an empty read-only field for $variant specialization in $language',
  async ({ language, fields, missing }) => {
    mountOwnProfile({ ...teacher, ...fields } as UserProfile, language);

    const field = await screen.findByPlaceholderText(missing);
    expect(field).toHaveValue('');
    expect(field).toHaveAttribute('readonly');
  },
);

it.each([specialization, '   '])('P5 Profile keeps the fallback specialization read-only on a failed profile GET (%s)', async value => {
  mountOwnProfile(null, 'en', value);
  const field = await screen.findByPlaceholderText('Not specified');
  expect(field).toHaveAttribute('readonly');
  expect(field).toHaveValue(value.trim() ? value : '');
});

it.each(teacherLocales)('P5 Profile preserves specialization verbatim but does not send it in $language', async ({ language, save }) => {
  const storedSpecialization = ` ${specialization} `;
  const previousAdapter = apiClient.defaults.adapter;
  const request = vi.fn<AxiosAdapter>(async config => ({
    config, data: { message: 'Updated' }, status: 200, statusText: 'OK', headers: {},
  }));
  apiClient.defaults.adapter = request;
  onTestFinished(() => { apiClient.defaults.adapter = previousAdapter; });
  mountOwnProfile({ ...teacher, specialization: storedSpecialization }, language);

  expect(await screen.findByDisplayValue(storedSpecialization, { exact: true, normalizer: input => input }))
    .toHaveAttribute('readonly');
  const avatar = screen.getByRole('img', { name: 'Preset 1' }).getAttribute('src');
  await userEvent.click(screen.getByRole('button', { name: 'Preset avatar 1' }));
  await userEvent.click(screen.getByRole('button', { name: save }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  const [config] = request.mock.calls[0];
  expect(config.method).toBe('put');
  expect(new URL(apiClient.getUri(config), window.location.origin).pathname).toBe('/api/v1/users/me');
  expect(JSON.parse(config.data)).toEqual({
    fullName: teacher.fullName, phone: '', avatarUrl: avatar,
  });
});

type DrawerProfile = ComponentProps<typeof AdminUserProfileDrawer>['profile'];

// Optional profile fields are absent from users.csv. Reuse values exercised by AdminUserServiceTest.
const storedPhone = '0900000000';
const storedBirthDate = '2005-03-10';
const drawerTeacher: DrawerProfile = { ...teacher, role: 'TEACHER', phone: storedPhone, specialization };
const drawerStudent: DrawerProfile = {
  ...otherStudent, role: 'STUDENT', phone: storedPhone, dateOfBirth: storedBirthDate, studentCode: 'HV0012',
};

interface DrawerHarnessProps {
  profile: DrawerProfile;
  initiallyOpen: boolean;
  showOpener?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function DrawerHarness({ profile, initiallyOpen, showOpener = true, onClose, onSaved }: DrawerHarnessProps) {
  const { toggleLanguage } = useLanguage();
  const [target, setTarget] = useState(profile);
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      {showOpener && (
        <button type="button" onClick={() => {
          setTarget(profile);
          setOpen(true);
        }}>Open profile</button>
      )}
      <button type="button" onClick={() => {
        setTarget(drawerStudent);
        setOpen(true);
      }}>Open student profile</button>
      <button type="button" onClick={toggleLanguage}>Change language</button>
      <AdminUserProfileDrawer
        isOpen={open}
        profile={target}
        onSaved={onSaved}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
      />
    </>
  );
}

function mountDrawer(profile = drawerTeacher, initiallyOpen = true) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  const props = { profile, initiallyOpen, onClose, onSaved };
  const view = render(<LanguageProvider><DrawerHarness {...props} /></LanguageProvider>);
  const user = userEvent.setup();
  return { ...view, props, user, onClose, onSaved, update: vi.mocked(userService.updateUser) };
}

function drawerPanel() {
  return screen.getByRole('dialog', { name: 'Chỉnh sửa hồ sơ' });
}

function drawerSave() {
  return screen.getByRole('button', { name: 'Lưu thay đổi' });
}

function changeDrawerField(label: string, value: string) {
  const field = screen.getByRole('textbox', { name: label });
  fireEvent.change(field, { target: { value } });
  return field;
}

it.each([
  {
    profile: drawerTeacher, roleLabel: 'Giáo viên', statusLabel: 'Đang hoạt động',
    fieldLabel: 'Chuyên môn', otherField: 'Ngày sinh', value: specialization,
    newValue: `${specialization} ${specialization}`, payloadKey: 'specialization',
  },
  {
    profile: drawerStudent, roleLabel: 'Học viên', statusLabel: 'Đã khóa',
    fieldLabel: 'Ngày sinh', otherField: 'Chuyên môn', value: storedBirthDate,
    newValue: '2004-02-29', payloadKey: 'dateOfBirth',
  },
])('D1 Drawer prefills and saves only changed fields for $roleLabel ($profile.status)', async data => {
  const { profile, roleLabel, statusLabel, fieldLabel, otherField, value, newValue, payloadKey } = data;
  const { user, update, onSaved, onClose } = mountDrawer(profile);
  const panel = within(drawerPanel());
  expect(drawerPanel()).toHaveAttribute('aria-modal', 'true');
  expect(drawerPanel()).toHaveAttribute('aria-labelledby', panel.getByRole('heading').id);
  expect(panel.getByRole('textbox', { name: 'Họ và tên' })).toHaveValue(profile.fullName);
  expect(panel.getByRole('textbox', { name: 'Số điện thoại' })).toHaveValue(storedPhone);
  expect(panel.getByRole('textbox', { name: fieldLabel })).toHaveValue(value);
  expect(panel.queryByRole('textbox', { name: otherField })).not.toBeInTheDocument();
  expect(panel.getAllByRole('textbox')).toHaveLength(3);
  expect(panel.getByText(profile.email)).toBeVisible();
  expect(panel.getByText(roleLabel)).toBeVisible();
  expect(panel.getByText(statusLabel)).toBeVisible();
  if (profile.studentCode) expect(panel.getByText(profile.studentCode)).toBeVisible();
  expect(userService.getAdminUserDetail).not.toHaveBeenCalled();
  expect(userService.getUserById).not.toHaveBeenCalled();

  changeDrawerField(fieldLabel, newValue);
  changeDrawerField('Số điện thoại', `+${storedPhone}`);
  await user.click(drawerSave());

  expect(update).toHaveBeenCalledExactlyOnceWith(profile.id, { phone: `+${storedPhone}`, [payloadKey]: newValue });
  expect(onSaved).toHaveBeenCalledTimes(1);
  expect(onSaved).toHaveBeenCalledBefore(onClose);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(userService.getAdminUserDetail).not.toHaveBeenCalled();
});

it.each([
  { value: '', message: 'Vui lòng nhập họ và tên.' },
  { value: '   ', message: 'Vui lòng nhập họ và tên.' },
  { value: 'Á', message: 'Họ và tên phải có ít nhất 2 ký tự.' },
  { value: 'Á'.repeat(51), message: 'Họ và tên không được vượt quá 50 ký tự.' },
  { value: `${teacher.fullName} 4`, message: 'Họ và tên không được chứa chữ số.' },
  { value: `${teacher.fullName}!`, message: 'Họ và tên không được chứa ký tự đặc biệt.' },
])('D2 Drawer rejects invalid full name "$value"', async ({ value, message }) => {
  const { user, update, onSaved } = mountDrawer();
  const name = changeDrawerField('Họ và tên', value);
  await user.click(drawerSave());

  expect(name).toHaveValue(value);
  expect(name).toHaveAttribute('aria-invalid', 'true');
  expect(name).toHaveAccessibleDescription(message);
  expect(update).not.toHaveBeenCalled();
  expect(onSaved).not.toHaveBeenCalled();
});

it.each([
  { value: 'Án', normalized: 'Án' },
  { value: 'Á'.repeat(50), normalized: 'Á'.repeat(50) },
  { value: `  ${otherTeacher.fullName.replaceAll(' ', '   ')}  `, normalized: otherTeacher.fullName },
])('D2 Drawer saves a normalized valid full name "$value"', async ({ value, normalized }) => {
  const { user, update } = mountDrawer();
  changeDrawerField('Họ và tên', value);
  await user.click(drawerSave());

  expect(update).toHaveBeenCalledExactlyOnceWith(drawerTeacher.id, { fullName: normalized });
});

const phoneDigits = (length: number) => storedPhone.repeat(2).slice(0, length);

it.each([phoneDigits(8), phoneDigits(16), `${storedPhone}x`, `${storedPhone}+`])(
  'D3 Drawer rejects invalid phone "%s"',
  async value => {
    const { user, update } = mountDrawer();
    const phone = changeDrawerField('Số điện thoại', value);
    await user.click(drawerSave());

    expect(phone).toHaveAttribute('aria-invalid', 'true');
    expect(phone).toHaveAccessibleDescription('Số điện thoại không đúng định dạng (9-15 chữ số).');
    expect(update).not.toHaveBeenCalled();
  },
);

it.each([
  { value: phoneDigits(9), normalized: phoneDigits(9) },
  { value: phoneDigits(15), normalized: phoneDigits(15) },
  { value: ` +${phoneDigits(15)}  `, normalized: `+${phoneDigits(15)}` },
  { value: '', normalized: '' },
])('D3 Drawer saves or explicitly clears phone "$value"', async ({ value, normalized }) => {
  const { user, update } = mountDrawer();
  changeDrawerField('Số điện thoại', value);
  await user.click(drawerSave());

  expect(update).toHaveBeenCalledExactlyOnceWith(drawerTeacher.id, { phone: normalized });
});

it.each([
  { role: 'teacher', profile: { ...drawerTeacher, phone: undefined, specialization: undefined } },
  { role: 'student', profile: { ...drawerStudent, phone: undefined, dateOfBirth: undefined } },
])('D3–D5 Drawer omits unchanged empty optional fields for $role', async ({ profile }) => {
  const { user, update } = mountDrawer(profile);
  expect(screen.getByRole('textbox', { name: 'Số điện thoại' })).toHaveValue('');
  expect(screen.getByRole('textbox', { name: profile.role === 'TEACHER' ? 'Chuyên môn' : 'Ngày sinh' })).toHaveValue('');
  changeDrawerField('Họ và tên', otherTeacher.fullName);
  await user.click(drawerSave());

  expect(update).toHaveBeenCalledExactlyOnceWith(profile.id, { fullName: otherTeacher.fullName });
});

it.each([149, 150, 151, 600])('D4 Drawer enforces specialization length %i', async length => {
  const { user, update } = mountDrawer();
  const value = specialization.repeat(40).slice(0, length);
  const field = changeDrawerField('Chuyên môn', value);
  expect(field).toHaveAttribute('maxlength', '150');
  await user.click(drawerSave());

  if (length <= 150) {
    expect(update).toHaveBeenCalledExactlyOnceWith(drawerTeacher.id, { specialization: value });
  } else {
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Chuyên môn không được vượt quá 150 ký tự.');
    expect(update).not.toHaveBeenCalled();
  }
});

it.each(['', '   '])('D4 Drawer sends an empty string to clear a saved specialization ("%s")', async value => {
  const { user, update } = mountDrawer();
  changeDrawerField('Chuyên môn', value);
  await user.click(drawerSave());

  expect(update).toHaveBeenCalledExactlyOnceWith(drawerTeacher.id, { specialization: '' });
});

const dateFormatError = 'Nhập ngày sinh hợp lệ theo định dạng YYYY-MM-DD.';

it.each([
  { value: '10/03/2005', message: dateFormatError },
  { value: '2004-02-30', message: dateFormatError },
  { value: '1900-02-29', message: dateFormatError },
  { value: '0000-01-01', message: dateFormatError },
  { value: '2005-13-01', message: dateFormatError },
  { value: '2005-03-00', message: dateFormatError },
  { value: '2026-11-22', message: 'Ngày sinh không được sau hôm nay.' },
  { value: '', message: 'Không thể xóa ngày sinh đã lưu.' },
  { value: '   ', message: 'Không thể xóa ngày sinh đã lưu.' },
])('D5 Drawer rejects birth date "$value" with a field error', async ({ value, message }) => {
  vi.setSystemTime(new Date(2026, 10, 21, 0, 10));
  const { user, update } = mountDrawer(drawerStudent);
  const date = changeDrawerField('Ngày sinh', value);
  await user.click(drawerSave());

  expect(date).toHaveAttribute('aria-invalid', 'true');
  expect(date).toHaveAccessibleDescription(message);
  expect(update).not.toHaveBeenCalled();
});

it.each(['2004-02-29', '2000-02-29', '2026-11-21'])('D5 Drawer saves birth date %s without timezone conversion', async value => {
  vi.setSystemTime(new Date(2026, 10, 21, 0, 10));
  const { user, update } = mountDrawer(drawerStudent);
  changeDrawerField('Ngày sinh', value);
  await user.click(drawerSave());

  expect(update).toHaveBeenCalledExactlyOnceWith(drawerStudent.id, { dateOfBirth: value });
});

it('D6 Drawer disables Save initially and after restoring normalized baseline values', () => {
  const { update } = mountDrawer();
  expect(drawerSave()).toBeDisabled();
  changeDrawerField('Họ và tên', otherTeacher.fullName);
  expect(drawerSave()).toBeEnabled();
  changeDrawerField('Họ và tên', `  ${teacher.fullName.replaceAll(' ', '   ')} `);
  changeDrawerField('Số điện thoại', ` ${storedPhone}  `);
  changeDrawerField('Chuyên môn', ` ${specialization}  `);
  expect(drawerSave()).toBeDisabled();
  expect(update).not.toHaveBeenCalled();
});

it('D6/D9 Drawer handles same-turn double submit and blocks every dismissal until PUT succeeds', async () => {
  const { user, update, onSaved, onClose } = mountDrawer(drawerTeacher, false);
  const trigger = screen.getByRole('button', { name: 'Open profile' });
  await user.click(trigger);
  changeDrawerField('Họ và tên', otherTeacher.fullName);
  const request = deferred<Awaited<ReturnType<typeof userService.updateUser>>>();
  update.mockReturnValueOnce(request.promise);
  const submit = drawerSave().closest('form')!;
  act(() => {
    fireEvent.submit(submit);
    fireEvent.submit(submit);
  });

  expect(update).toHaveBeenCalledExactlyOnceWith(drawerTeacher.id, { fullName: otherTeacher.fullName });
  expect(submit).toHaveAttribute('aria-busy', 'true');
  expect(drawerSave()).toBeDisabled();
  for (const name of ['Hủy', 'Đóng']) {
    const button = within(drawerPanel()).getByRole('button', { name });
    expect(button).toBeDisabled();
    fireEvent.click(button);
  }
  await user.keyboard('{Escape}');
  fireEvent.click(drawerPanel().parentElement!);
  await user.tab();
  expect(drawerPanel()).toHaveFocus();
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
  expect(onClose).not.toHaveBeenCalled();
  expect(onSaved).not.toHaveBeenCalled();

  await act(async () => request.resolve({ message: 'Updated' }));
  expect(update).toHaveBeenCalledTimes(1);
  expect(onSaved).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

it('D7 Drawer shows the 400 response error at form level when the server names no field', async () => {
  const { user, update, onSaved, onClose } = mountDrawer();
  const message = 'Dữ liệu không hợp lệ.';
  update.mockRejectedValueOnce({ isAxiosError: true, response: { status: 400, data: { error: message } } });
  const name = changeDrawerField('Họ và tên', otherTeacher.fullName);
  await user.click(drawerSave());

  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(name).toHaveValue(otherTeacher.fullName);
  expect(name).not.toHaveAttribute('aria-invalid');
  expect(screen.getByRole('textbox', { name: 'Số điện thoại' })).not.toHaveAttribute('aria-invalid');
  expect(drawerSave()).toBeEnabled();
  expect(update).toHaveBeenCalledTimes(1);
  expect(onSaved).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it('D7 Drawer puts a 400 error on an explicitly identified field and allows correction', async () => {
  const { user, update, onSaved } = mountDrawer();
  const fieldMessage = 'Số điện thoại không hợp lệ.';
  update.mockRejectedValueOnce(new ValidationError('Dữ liệu không hợp lệ.', [
    { field: 'phone', message: fieldMessage },
    { field: 'role', message: 'Vai trò không hợp lệ.' },
  ]));
  const phone = changeDrawerField('Số điện thoại', `+${storedPhone}`);
  await user.click(drawerSave());

  expect(await screen.findByRole('alert')).toHaveTextContent('Dữ liệu không hợp lệ.');
  expect(phone).toHaveAttribute('aria-invalid', 'true');
  expect(phone).toHaveAccessibleDescription(fieldMessage);
  expect(screen.queryByText('Vai trò không hợp lệ.')).not.toBeInTheDocument();
  expect(onSaved).not.toHaveBeenCalled();

  changeDrawerField('Số điện thoại', phoneDigits(9));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(phone).not.toHaveAttribute('aria-invalid');
  await user.click(drawerSave());
  expect(update).toHaveBeenLastCalledWith(drawerTeacher.id, { phone: phoneDigits(9) });
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it.each([
  { label: '403', error: new ForbiddenError(), message: 'Bạn không có quyền sửa hồ sơ này.' },
  { label: '404', error: new NotFoundError(), message: 'Hồ sơ này không còn khả dụng.' },
])('D7 Drawer preserves the draft and blocks another save after $label', async ({ error, message }) => {
  const { user, update, onSaved, onClose } = mountDrawer();
  update.mockRejectedValueOnce(error);
  const name = changeDrawerField('Họ và tên', otherTeacher.fullName);
  await user.click(drawerSave());

  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(name).toHaveValue(otherTeacher.fullName);
  expect(drawerSave()).toBeDisabled();
  changeDrawerField('Số điện thoại', phoneDigits(9));
  await user.click(drawerSave());
  fireEvent.submit(drawerSave().closest('form')!);
  expect(screen.getByRole('alert')).toHaveTextContent(message);
  expect(update).toHaveBeenCalledTimes(1);
  expect(onSaved).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it.each([
  { label: '500', error: new ApiClientError('Server error', 500), message: 'Không thể lưu hồ sơ. Vui lòng thử lại.' },
  { label: 'network', error: new NetworkError(), message: 'Mất kết nối mạng. Kiểm tra kết nối rồi thử lại.' },
  { label: 'timeout', error: new TimeoutError(), message: 'Yêu cầu lưu quá thời gian chờ. Vui lòng thử lại.' },
])('D7 Drawer keeps the draft and retries $label only after a new Save click', async ({ error, message }) => {
  const { user, update, onSaved, onClose } = mountDrawer();
  update.mockRejectedValueOnce(error);
  const name = changeDrawerField('Họ và tên', otherTeacher.fullName);
  await user.click(drawerSave());

  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(name).toHaveValue(otherTeacher.fullName);
  expect(drawerSave()).toBeEnabled();
  expect(update).toHaveBeenCalledTimes(1);
  expect(onSaved).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();

  await user.click(drawerSave());
  expect(update).toHaveBeenCalledTimes(2);
  expect(update).toHaveBeenLastCalledWith(drawerTeacher.id, { fullName: otherTeacher.fullName });
  expect(onSaved).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

const dismissalActions = [
  { name: 'Cancel', dismiss: (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Hủy' })) },
  { name: 'X', dismiss: (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('button', { name: 'Đóng' })) },
  { name: 'Escape', dismiss: (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}') },
  { name: 'overlay', dismiss: (user: ReturnType<typeof userEvent.setup>) => user.click(drawerPanel().parentElement!) },
];

it.each(dismissalActions)('D9 Drawer closes a clean form via $name and restores opener focus', async ({ dismiss }) => {
  const { user, onClose, update } = mountDrawer(drawerTeacher, false);
  const opener = screen.getByRole('button', { name: 'Open profile' });
  await user.click(opener);

  await dismiss(user);
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(update).not.toHaveBeenCalled();
});

it.each(dismissalActions)('D9 Drawer confirms a dirty form via $name and restores editing or opener focus', async ({ dismiss }) => {
  const { user, onClose, update } = mountDrawer(drawerTeacher, false);
  const opener = screen.getByRole('button', { name: 'Open profile' });
  await user.click(opener);
  changeDrawerField('Họ và tên', otherTeacher.fullName);

  await dismiss(user);
  let confirm = within(screen.getByRole('dialog', { name: 'Bỏ thay đổi?' }));
  expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(1);
  expect(onClose).not.toHaveBeenCalled();

  await user.click(confirm.getByRole('button', { name: 'Tiếp tục chỉnh sửa' }));
  const field = within(drawerPanel()).getByRole('textbox', { name: 'Họ và tên' });
  expect(field).toHaveValue(otherTeacher.fullName);
  expect(field).toHaveFocus();

  await dismiss(user);
  confirm = within(screen.getByRole('dialog', { name: 'Bỏ thay đổi?' }));
  await user.click(confirm.getByRole('button', { name: 'Bỏ thay đổi' }));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
  expect(update).not.toHaveBeenCalled();
});

it('D9 Drawer and discard confirmation each trap Tab and receive Escape only while active', async () => {
  const { user, onClose, unmount } = mountDrawer(drawerTeacher, false);
  await user.click(screen.getByRole('button', { name: 'Open profile' }));
  const close = within(drawerPanel()).getByRole('button', { name: 'Đóng' });
  expect(close).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('textbox', { name: 'Họ và tên' })).toHaveFocus();
  changeDrawerField('Họ và tên', otherTeacher.fullName);
  close.focus();
  await user.tab({ shift: true });
  expect(drawerSave()).toHaveFocus();
  await user.tab();
  expect(close).toHaveFocus();

  await user.keyboard('{Escape}');
  const confirm = within(screen.getByRole('dialog', { name: 'Bỏ thay đổi?' }));
  const confirmClose = confirm.getByRole('button', { name: 'Đóng' });
  expect(confirmClose).toHaveFocus();
  await user.tab({ shift: true });
  expect(confirm.getByRole('button', { name: 'Bỏ thay đổi' })).toHaveFocus();
  await user.tab();
  expect(confirmClose).toHaveFocus();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog', { name: 'Bỏ thay đổi?' })).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Họ và tên' })).toHaveFocus();
  expect(onClose).not.toHaveBeenCalled();

  unmount();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).not.toHaveBeenCalled();
});

it('D9 Drawer resets the draft and role fields when reopening for another profile', async () => {
  const { user, onClose, update } = mountDrawer();
  changeDrawerField('Họ và tên', otherTeacher.fullName);
  changeDrawerField('Số điện thoại', phoneDigits(9));
  await user.click(screen.getByRole('button', { name: 'Hủy' }));
  await user.click(screen.getByRole('button', { name: 'Bỏ thay đổi' }));
  expect(onClose).toHaveBeenCalledTimes(1);

  const newOpener = screen.getByRole('button', { name: 'Open student profile' });
  await user.click(newOpener);
  expect(screen.getByRole('textbox', { name: 'Họ và tên' })).toHaveValue(drawerStudent.fullName);
  expect(screen.getByRole('textbox', { name: 'Số điện thoại' })).toHaveValue(storedPhone);
  expect(screen.getByRole('textbox', { name: 'Ngày sinh' })).toHaveValue(storedBirthDate);
  expect(screen.queryByRole('textbox', { name: 'Chuyên môn' })).not.toBeInTheDocument();
  expect(drawerSave()).toBeDisabled();
  expect(update).not.toHaveBeenCalled();
  await user.keyboard('{Escape}');
  expect(newOpener).toHaveFocus();
});

it('D9 Drawer leaves browser focus alone when its opener no longer exists', async () => {
  const { user, props, rerender, onClose } = mountDrawer(drawerTeacher, false);
  const opener = screen.getByRole('button', { name: 'Open profile' });
  await user.click(opener);
  rerender(<LanguageProvider><DrawerHarness {...props} showOpener={false} /></LanguageProvider>);
  expect(opener).not.toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.body).toHaveFocus();
});

it('D11 Drawer changes language without resetting the validation state, draft or target', async () => {
  const { user, update, onSaved } = mountDrawer(drawerStudent);
  changeDrawerField('Ngày sinh', '2004-02-30');
  changeDrawerField('Họ và tên', student.fullName);
  await user.click(drawerSave());
  expect(screen.getByRole('textbox', { name: 'Ngày sinh' })).toHaveAccessibleDescription(dateFormatError);

  fireEvent.click(screen.getByRole('button', { name: 'Change language' }));
  expect(screen.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();
  expect(screen.getByText('Locked')).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue(student.fullName);
  const date = screen.getByRole('textbox', { name: 'Date of birth' });
  expect(date).toHaveValue('2004-02-30');
  expect(date).toHaveAccessibleDescription('Enter a valid date of birth in YYYY-MM-DD format.');
  expect(update).not.toHaveBeenCalled();

  await user.keyboard('{Escape}');
  const confirm = within(screen.getByRole('dialog', { name: 'Discard changes?' }));
  await user.click(confirm.getByRole('button', { name: 'Keep editing' }));
  changeDrawerField('Date of birth', '2004-02-29');
  await user.click(screen.getByRole('button', { name: 'Save Changes' }));

  expect(update).toHaveBeenCalledExactlyOnceWith(drawerStudent.id, { fullName: student.fullName, dateOfBirth: '2004-02-29' });
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it.each(teacherLocales.flatMap(locale => [
  { ...locale, result: 'rejected', error: new Error('Teacher detail request failed') },
  { ...locale, result: 'not found', error: new NotFoundError() },
]))('A9 TeacherDetails never shows Active while loading or after $result in $language', async ({ language, active, error }) => {
  const page = pages[0];
  const gate = deferred<void>();
  vi.mocked(userService.getAdminUserDetail).mockImplementation(async () => {
    await gate.promise;
    throw error;
  });
  const { container } = mountDetail(page, page.primary.id, language);
  expect(screen.getByText(language === 'vi' ? 'Đang tải thông tin giảng viên...' : page.loading)).toBeVisible();
  expect(screen.queryByText(active)).not.toBeInTheDocument();

  await act(async () => gate.resolve());
  expect(await screen.findByRole('alert')).toHaveTextContent(error.message);
  expect(screen.queryByText(active)).not.toBeInTheDocument();
  expectNoProfile(container, page.primary.fullName);
});

const editPages = [
  {
    ...pages[0], snapshot: drawerTeacher, language: 'en',
    changes: { fullName: otherTeacher.fullName, phone: `+${storedPhone}`, specialization: `${specialization} ${specialization}` },
    edit: 'Edit', nameLabel: 'Full name', phoneLabel: 'Phone', detailLabel: 'Specialization',
    title: 'Edit profile', save: 'Save Changes', cancel: 'Cancel', stay: 'Keep editing', discard: 'Discard changes',
    confirmTitle: 'Discard changes?', loadingLabel: pages[0].loading,
    refreshError: 'Saved, but the profile could not be reloaded', retry: 'Retry', locked: 'Locked',
  },
  {
    ...pages[1], snapshot: drawerStudent, language: 'vi',
    changes: { fullName: student.fullName, phone: `+${storedPhone}`, dateOfBirth: '2004-02-29' },
    edit: 'Sửa', nameLabel: 'Họ và tên', phoneLabel: 'Số điện thoại', detailLabel: 'Ngày sinh',
    title: 'Chỉnh sửa hồ sơ', save: 'Lưu thay đổi', cancel: 'Hủy', stay: 'Tiếp tục chỉnh sửa', discard: 'Bỏ thay đổi',
    confirmTitle: 'Bỏ thay đổi?', loadingLabel: 'Đang tải thông tin học viên...',
    refreshError: 'Đã lưu, chưa tải lại được hồ sơ', retry: 'Thử lại', locked: 'Đã khóa',
  },
];

type EditPage = (typeof editPages)[number];

async function openPageDrawer(page: EditPage) {
  const trigger = await screen.findByRole('button', { name: page.edit });
  await userEvent.click(trigger);
  return { trigger, drawer: within(screen.getByRole('dialog', { name: page.title })) };
}

function expectActivityLoadedOnce(page: EditPage) {
  if (page.snapshot.role === 'STUDENT') {
    expect(reportService.getStudentProgress).toHaveBeenCalledExactlyOnceWith(page.snapshot.id);
    expect(studentEvaluationService.list).toHaveBeenCalledExactlyOnceWith(page.snapshot.id);
    return;
  }
  expect(classService.list).toHaveBeenCalledTimes(1);
}

it.each(editPages)('D8 $name saves edited fields, closes Drawer and renders the reloaded profile', async page => {
  const { snapshot, changes, nameLabel, phoneLabel, detailLabel } = page;
  const get = vi.mocked(userService.getAdminUserDetail).mockResolvedValueOnce(snapshot);
  const refresh = deferred<UserProfile>();
  get.mockReturnValueOnce(refresh.promise);
  mountDetail(page, snapshot.id, page.language);

  const { drawer } = await openPageDrawer(page);
  expect(drawer.getByRole('textbox', { name: nameLabel })).toHaveValue(snapshot.fullName);
  expect(get).toHaveBeenCalledTimes(1);
  changeDrawerField(nameLabel, changes.fullName);
  changeDrawerField(phoneLabel, changes.phone);
  const profileValue = changes.specialization ?? changes.dateOfBirth!;
  changeDrawerField(detailLabel, profileValue);
  await userEvent.click(drawer.getByRole('button', { name: page.save }));

  expect(userService.updateUser).toHaveBeenCalledExactlyOnceWith(snapshot.id, changes);
  expect(detailRequests()).toEqual([snapshot.id, snapshot.id]);
  expect(screen.getByText(page.loadingLabel)).toBeVisible();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: snapshot.fullName })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: page.edit })).not.toBeInTheDocument();
  await act(async () => refresh.resolve({ ...snapshot, ...changes, status: 'LOCKED' }));

  expect(await screen.findByRole('heading', { name: changes.fullName })).toBeVisible();
  expect(screen.getByText(changes.phone)).toBeVisible();
  expect(screen.getAllByText(profileValue).every(element => element.textContent === profileValue)).toBe(true);
  expect(screen.getAllByText(page.locked)).toHaveLength(page.badges);
  screen.getAllByText(page.locked).forEach(badge => expect(badge).toHaveClass('badge-blocked'));
  expectActivityLoadedOnce(page);
});

it.each(editPages.flatMap(page => loadErrors.map(error => ({ name: page.name, page, ...error }))))(
  'D8 $name reports saved but reload failed on $label and retries only GET',
  async ({ page, error }) => {
    const { snapshot, changes } = page;
    const updated = { ...snapshot, fullName: changes.fullName };
    const get = vi.mocked(userService.getAdminUserDetail)
      .mockResolvedValueOnce(snapshot)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(updated);
    mountDetail(page, snapshot.id, page.language);
    const { drawer } = await openPageDrawer(page);
    changeDrawerField(page.nameLabel, changes.fullName);
    await userEvent.click(drawer.getByRole('button', { name: page.save }));

    for (const attempts of [2, 3]) {
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(page.refreshError);
      expect(alert).toHaveTextContent(error.message);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: snapshot.fullName })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: page.edit })).not.toBeInTheDocument();
      expect(get).toHaveBeenCalledTimes(attempts);
      expect(userService.updateUser).toHaveBeenCalledExactlyOnceWith(snapshot.id, { fullName: changes.fullName });
      await userEvent.click(within(alert).getByRole('button', { name: page.retry }));
    }

    expect(await screen.findByRole('heading', { name: updated.fullName })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(detailRequests()).toEqual([snapshot.id, snapshot.id, snapshot.id, snapshot.id]);
    expect(userService.updateUser).toHaveBeenCalledTimes(1);
    expectActivityLoadedOnce(page);
  },
);

it.each(editPages)('D9 $name keeps or discards its draft and restores focus', async page => {
  vi.mocked(userService.getAdminUserDetail).mockResolvedValueOnce(page.snapshot);
  mountDetail(page, page.snapshot.id, page.language);
  const { trigger, drawer } = await openPageDrawer(page);
  changeDrawerField(page.nameLabel, page.changes.fullName);
  await userEvent.click(drawer.getByRole('button', { name: page.cancel }));

  let confirm = within(screen.getByRole('dialog', { name: page.confirmTitle }));
  await userEvent.click(confirm.getByRole('button', { name: page.stay }));
  const edit = within(screen.getByRole('dialog', { name: page.title }));
  expect(edit.getByRole('textbox', { name: page.nameLabel })).toHaveValue(page.changes.fullName);
  expect(edit.getByRole('textbox', { name: page.nameLabel })).toHaveFocus();
  await userEvent.keyboard('{Escape}');

  confirm = within(screen.getByRole('dialog', { name: page.confirmTitle }));
  await userEvent.click(confirm.getByRole('button', { name: page.discard }));
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(userService.updateUser).not.toHaveBeenCalled();
  expect(detailRequests()).toEqual([page.snapshot.id]);
});

const rejectedActors = [
  { actor: teacher, destination: '/403', label: 'TEACHER' },
  { actor: student, destination: '/403', label: 'STUDENT' },
  { actor: null, destination: '/login', label: 'anonymous' },
];

it.each(editPages.flatMap(page => rejectedActors.map(actor => ({ name: page.name, page, ...actor }))))(
  'D10 App protects $name and redirects $label to $destination',
  async ({ page, actor, destination }) => {
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(Boolean(actor));
    vi.spyOn(authService, 'getSavedUser').mockReturnValue(actor);
    if (actor) vi.spyOn(userService, 'getMyProfile').mockResolvedValue(actor);
    renderPage(<App />, '*', `${page.path}/${page.snapshot.id}`);

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(destination));
    expect(screen.queryByRole('button', { name: /^(Edit|Sửa)$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(userService.getAdminUserDetail).not.toHaveBeenCalled();
    expect(userService.updateUser).not.toHaveBeenCalled();
  },
);

it.each(editPages)('D10 $name keeps the draft and skips refresh when PUT reports lost permission', async page => {
  const { snapshot, changes } = page;
  vi.mocked(userService.getAdminUserDetail).mockResolvedValueOnce(snapshot);
  vi.mocked(userService.updateUser).mockRejectedValueOnce(new ForbiddenError());
  mountDetail(page, snapshot.id, page.language);
  const { drawer } = await openPageDrawer(page);
  const field = changeDrawerField(page.nameLabel, changes.fullName);
  await userEvent.click(drawer.getByRole('button', { name: page.save }));

  expect(await drawer.findByRole('alert')).toHaveTextContent(page.language === 'vi'
    ? 'Bạn không có quyền sửa hồ sơ này.'
    : 'You do not have permission to edit this profile.');
  expect(field).toHaveValue(changes.fullName);
  expect(drawer.getByRole('button', { name: page.save })).toBeDisabled();
  expect(screen.getByRole('heading', { name: snapshot.fullName })).toBeVisible();
  expect(screen.queryByText(page.refreshError)).not.toBeInTheDocument();
  expect(detailRequests()).toEqual([snapshot.id]);
  expect(userService.updateUser).toHaveBeenCalledExactlyOnceWith(snapshot.id, { fullName: changes.fullName });
});

function mountNavigableEdit(page: EditPage) {
  const { Component, path, snapshot, primary, secondary } = page;
  const next = snapshot.id === primary.id ? secondary : primary;
  renderPage(
    <><NextProfile to={`${path}/${next.id}`} /><Component /></>,
    `${path}/:id`, `${path}/${snapshot.id}`, undefined, page.language,
  );
  return next;
}

it.each(editPages)('D9 $name opens the next target with its own snapshot after discarding a draft', async page => {
  const get = vi.mocked(userService.getAdminUserDetail).mockResolvedValueOnce(page.snapshot);
  const next = mountNavigableEdit(page);
  get.mockResolvedValueOnce(next);
  const { drawer } = await openPageDrawer(page);
  changeDrawerField(page.nameLabel, page.changes.fullName);
  changeDrawerField(page.phoneLabel, page.changes.phone);
  await userEvent.click(drawer.getByRole('button', { name: page.cancel }));
  await userEvent.click(screen.getByRole('button', { name: page.discard }));
  await userEvent.click(screen.getByRole('button', { name: 'Next profile' }));

  const { drawer: nextDrawer } = await openPageDrawer(page);
  expect(nextDrawer.getByRole('textbox', { name: page.nameLabel })).toHaveValue(next.fullName);
  expect(nextDrawer.getByRole('textbox', { name: page.phoneLabel })).toHaveValue('');
  expect(nextDrawer.getByRole('button', { name: page.save })).toBeDisabled();
  expect(detailRequests()).toEqual([page.snapshot.id, next.id]);
  expect(userService.updateUser).not.toHaveBeenCalled();
});

it.each(editPages)('D8 $name aborts a late post-save GET for the old route', async page => {
  const { snapshot, changes } = page;
  const oldRefresh = deferred<UserProfile>();
  const get = vi.mocked(userService.getAdminUserDetail)
    .mockResolvedValueOnce(snapshot)
    .mockReturnValueOnce(oldRefresh.promise);
  const next = mountNavigableEdit(page);
  get.mockResolvedValueOnce(next);
  const { drawer } = await openPageDrawer(page);
  changeDrawerField(page.nameLabel, changes.fullName);
  await userEvent.click(drawer.getByRole('button', { name: page.save }));
  await waitFor(() => expect(detailRequests()).toEqual([snapshot.id, snapshot.id]));
  const signal = get.mock.calls[1][1]?.signal;
  expect(signal?.aborted).toBe(false);

  await userEvent.click(screen.getByRole('button', { name: 'Next profile' }));
  expect(await screen.findByRole('heading', { name: next.fullName })).toBeVisible();
  expect(signal?.aborted).toBe(true);
  await act(async () => oldRefresh.resolve({ ...snapshot, ...changes }));
  const { drawer: nextDrawer } = await openPageDrawer(page);
  expect(nextDrawer.getByRole('textbox', { name: page.nameLabel })).toHaveValue(next.fullName);
  expect(nextDrawer.getByRole('textbox', { name: page.phoneLabel })).toHaveValue('');
  expect(detailRequests()).toEqual([snapshot.id, snapshot.id, next.id]);
  expect(userService.updateUser).toHaveBeenCalledTimes(1);
});

it.each(editPages)('D8 $name route changes during PUT and old completion leaves the next Drawer open', async page => {
  const { snapshot, changes } = page;
  const request = deferred<Awaited<ReturnType<typeof userService.updateUser>>>();
  const update = vi.mocked(userService.updateUser).mockReturnValueOnce(request.promise);
  const get = vi.mocked(userService.getAdminUserDetail).mockResolvedValueOnce(snapshot);
  const next = mountNavigableEdit(page);
  get.mockResolvedValueOnce(next);
  const { drawer } = await openPageDrawer(page);
  changeDrawerField(page.nameLabel, changes.fullName);
  await userEvent.click(drawer.getByRole('button', { name: page.save }));
  expect(drawer.getByRole('button', { name: page.save })).toBeDisabled();
  expect(screen.getByRole('button', { name: statusAction })).toBeDisabled();

  fireEvent.click(screen.getByRole('button', { name: 'Next profile' }));
  expect(await screen.findByRole('heading', { name: next.fullName })).toBeVisible();
  const { drawer: nextDrawer } = await openPageDrawer(page);
  await act(async () => request.resolve({ message: 'Updated' }));
  expect(nextDrawer.getByRole('textbox', { name: page.nameLabel })).toHaveValue(next.fullName);
  expect(update).toHaveBeenCalledExactlyOnceWith(snapshot.id, { fullName: changes.fullName });
  expect(detailRequests()).toEqual([snapshot.id, next.id]);
});
