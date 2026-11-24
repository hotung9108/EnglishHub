import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import AdminReports from '../../pages/AdminReports';
import { reportService } from '../../api/services/report.service';
import { classService, type ClassSummary } from '../../api/services/class.service';
import { userService, type UserListResponse } from '../../api/services/user.service';
import { submissionService, type SubmissionListResponse } from '../../api/services/submission.service';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
import type { ReportClassListResponse, ReportClassSummary, ReportOverviewParams, ReportOverviewResponse } from '../../types/report.types';
import { deferred } from '../deferred';
import { renderPage } from './renderPage';

vi.mock('../../api/services/report.service', () => ({
  reportService: { getOverview: vi.fn(), listClasses: vi.fn(), getClassProgress: vi.fn() },
}));
vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn() } }));
vi.mock('../../api/services/user.service', () => ({ userService: { listUsers: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: { listSubmissions: vi.fn() } }));

// Identities and non-deleted, non-DRAFT assignment counts come from the CSV snapshot.
const classes: ClassSummary[] = [
  { id: 1, name: 'IELTS Foundation K1', status: 'ACTIVE', teacherId: 9 },
  { id: 2, name: 'Tiếng Anh Giao Tiếp Cơ Bản A1', status: 'ACTIVE', teacherId: 4 },
  { id: 3, name: 'IELTS Intensive 6.5+', status: 'ACTIVE', teacherId: 9 },
];
const assignmentCounts = [3, 1, 4];
const reports: ReportClassSummary[] = classes.map((englishClass, index) => ({
  classId: englishClass.id, className: englishClass.name, status: englishClass.status,
  assignedAssignmentCount: assignmentCounts[index], averageScorePercent: 0, completionRatePercent: 0,
}));

function classList(data = reports): ReportClassListResponse {
  return { data, pagination: { page: 1, limit: 100, total: data.length } };
}

function totalPage(total: number) {
  return { data: [], pagination: { page: 1, limit: 1, total } };
}

const loadUserTotal = vi.fn<() => Promise<UserListResponse>>();

function overview(params: ReportOverviewParams = {}): ReportOverviewResponse {
  const matching = classes.filter(englishClass =>
    (params.teacherId === undefined || englishClass.teacherId === params.teacherId) &&
    (params.classId === undefined || englishClass.id === params.classId),
  );
  return {
    classCount: matching.length,
    assignedAssignmentCount: matching.reduce((total, englishClass) => total + assignmentCounts[englishClass.id - 1], 0),
    completionRatePercent: 0,
    // A controlled response marker distinguishes old/new KPI results, not live score statistics.
    averageScorePercent: params.classId ?? 0,
    pendingGradingCount: 0,
    pendingByStatus: {},
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  loadUserTotal.mockResolvedValue(totalPage(91));
  vi.mocked(classService.list).mockResolvedValue({ data: classes, pagination: { page: 1, limit: 100, total: classes.length } });
  vi.mocked(userService.listUsers).mockImplementation(async params => params?.role !== 'TEACHER' ? loadUserTotal() : ({
    data: [
      { id: 9, fullName: 'Nguyễn Đức Tuấn', email: 'nguyen.duc.tuan@gmail.com', role: 'TEACHER', status: 'ACTIVE' },
      { id: 4, fullName: 'Phạm Diệu Anh', email: 'pham.dieu.anh@gmail.com', role: 'TEACHER', status: 'ACTIVE' },
    ],
    pagination: { page: 1, limit: 100, total: 2 },
  }));
  vi.mocked(submissionService.listSubmissions).mockImplementation(async params =>
    totalPage(params?.status === 'SUBMITTED' ? 149 : 45),
  );
  vi.mocked(reportService.getOverview).mockImplementation(async params => overview(params));
  vi.mocked(reportService.listClasses).mockImplementation(async params => {
    const allowedIds = classes.filter(englishClass => params?.teacherId === undefined || englishClass.teacherId === params.teacherId)
      .map(englishClass => englishClass.id);
    return classList(reports.filter(row => allowedIds.includes(row.classId)));
  });
});

function renderReports() {
  return renderPage(<AdminReports />, '/admin/reports');
}

async function ready() {
  await screen.findByRole('table');
  await screen.findByRole('option', { name: classes[0].name });
}

function classSelect() {
  return screen.getAllByRole('combobox')[1];
}

function kpiValues(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.metric-value'), node => node.textContent).slice(0, 4);
}

function expectRows(ids: number[]) {
  const table = screen.getByRole('table');
  expect(within(table).getAllByRole('row')).toHaveLength(ids.length + 1);
  for (const englishClass of classes) {
    if (ids.includes(englishClass.id)) expect(within(table).getByText(englishClass.name)).toBeVisible();
    else expect(within(table).queryByText(englishClass.name)).not.toBeInTheDocument();
  }
}

it.each([
  { overviewOk: true, listOk: true },
  { overviewOk: true, listOk: false },
  { overviewOk: false, listOk: true },
  { overviewOk: false, listOk: false },
])('handles overview=$overviewOk and list=$listOk independently after existing data', async ({ overviewOk, listOk }) => {
  const { container } = renderReports();
  await ready();
  expectRows([1, 2, 3]);
  if (!overviewOk) vi.mocked(reportService.getOverview).mockRejectedValueOnce(new Error('KPI unavailable'));
  if (!listOk) vi.mocked(reportService.listClasses).mockRejectedValueOnce(new Error('Table unavailable'));

  await userEvent.selectOptions(classSelect(), '1');
  await waitFor(() => expect(screen.queryByText('Đang tổng hợp báo cáo...')).not.toBeInTheDocument());

  expect(classSelect()).toHaveValue('1');
  expect(screen.queryByText('KPI unavailable') !== null).toBe(!overviewOk);
  expect(screen.queryByText('Table unavailable') !== null).toBe(!listOk);
  expect(kpiValues(container)).toEqual(overviewOk ? ['1', '0%', '1%', '0'] : ['—', '—', '—', '—']);
  if (listOk) expectRows([1]);
  else {
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Chưa có dữ liệu thống kê lớp học')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Thử lại' }).length).toBe(overviewOk ? 1 : 2);
  }
});

it('shows a genuine empty list without an error', async () => {
  vi.mocked(reportService.listClasses).mockResolvedValue(classList([]));
  renderReports();
  expect(await screen.findByText('Chưa có dữ liệu thống kê lớp học')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
});

it('filters every table row for each class and restores all classes', async () => {
  const { container } = renderReports();
  await ready();
  for (const id of [1, 2, 3]) {
    await userEvent.selectOptions(classSelect(), String(id));
    await waitFor(() => expectRows([id]));
    expect(kpiValues(container)[0]).toBe('1');
    expect(reportService.getOverview).toHaveBeenLastCalledWith({ from: undefined, to: undefined, teacherId: undefined, classId: id });
    expect(reportService.listClasses).toHaveBeenLastCalledWith({ from: undefined, to: undefined, teacherId: undefined, page: 1, limit: 100 });
  }
  await userEvent.selectOptions(classSelect(), '');
  await waitFor(() => expectRows([1, 2, 3]));
  expect(kpiValues(container)[0]).toBe('3');
});

it.each(['overview', 'list'] as const)('retry retains teacher, class and date filters after %s fails', async failingPart => {
  const { container } = renderReports();
  await ready();
  await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '9');
  await waitFor(() => expectRows([1, 3]));
  const dates = container.querySelectorAll('input[type="date"]');
  fireEvent.change(dates[0], { target: { value: '2026-09-01' } });
  fireEvent.change(dates[1], { target: { value: '2026-09-30' } });
  await waitFor(() => expectRows([1, 3]));
  if (failingPart === 'overview') vi.mocked(reportService.getOverview).mockRejectedValueOnce(new Error(''));
  else vi.mocked(reportService.listClasses).mockRejectedValueOnce(new Error(''));
  await userEvent.selectOptions(classSelect(), '3');
  const message = failingPart === 'overview' ? 'Không thể tổng hợp báo cáo thời gian thực.' : 'Không thể tải bảng báo cáo lớp học.';
  expect(await screen.findByText(message)).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

  await waitFor(() => expectRows([3]));
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  expect(screen.getAllByRole('combobox')[0]).toHaveValue('9');
  expect(classSelect()).toHaveValue('3');
  expect(dates[0]).toHaveValue('2026-09-01');
  expect(dates[1]).toHaveValue('2026-09-30');
  expect(reportService.getOverview).toHaveBeenLastCalledWith({ from: '2026-09-01', to: '2026-09-30', teacherId: 9, classId: 3 });
  expect(reportService.listClasses).toHaveBeenLastCalledWith({ from: '2026-09-01', to: '2026-09-30', teacherId: 9, page: 1, limit: 100 });
});

it.each(['success', 'failure'] as const)('keeps the latest filter when an older %s arrives late', async oldOutcome => {
  const { container } = renderReports();
  await ready();
  const oldOverview = deferred<ReportOverviewResponse>();
  const oldList = deferred<ReportClassListResponse>();
  const newOverview = deferred<ReportOverviewResponse>();
  const newList = deferred<ReportClassListResponse>();
  vi.mocked(reportService.getOverview)
    .mockReturnValueOnce(oldOverview.promise.then(value => {
      if (oldOutcome === 'failure') throw new Error('Old KPI failure');
      return value;
    }))
    .mockReturnValueOnce(newOverview.promise);
  vi.mocked(reportService.listClasses)
    .mockReturnValueOnce(oldList.promise.then(value => {
      if (oldOutcome === 'failure') throw new Error('Old table failure');
      return value;
    }))
    .mockReturnValueOnce(newList.promise);

  fireEvent.change(classSelect(), { target: { value: '1' } });
  fireEvent.change(classSelect(), { target: { value: '2' } });
  expect(reportService.getOverview).toHaveBeenCalledTimes(3);
  expect(reportService.listClasses).toHaveBeenCalledTimes(3);
  expect(screen.getByText('Đang tổng hợp báo cáo...')).toBeVisible();
  expect(screen.queryByText('Chưa có dữ liệu thống kê lớp học')).not.toBeInTheDocument();
  await act(async () => {
    newOverview.resolve(overview({ classId: 2 }));
    newList.resolve(classList([reports[1]]));
  });
  expectRows([2]);
  expect(kpiValues(container)[2]).toBe('2%');

  await act(async () => {
    oldOverview.resolve(overview({ classId: 1 }));
    oldList.resolve(classList([reports[0]]));
  });
  expectRows([2]);
  expect(classSelect()).toHaveValue('2');
  expect(kpiValues(container)[2]).toBe('2%');
  expect(screen.queryByText(/Old KPI failure|Old table failure/)).not.toBeInTheDocument();
});

it('ignores requests settling after unmount without console warnings', async () => {
  const error = vi.spyOn(console, 'error');
  const warning = vi.spyOn(console, 'warn');
  const pendingOverview = deferred<ReportOverviewResponse>();
  const pendingList = deferred<ReportClassListResponse>();
  vi.mocked(reportService.getOverview).mockReturnValue(pendingOverview.promise);
  vi.mocked(reportService.listClasses).mockReturnValue(pendingList.promise);
  const { unmount } = renderReports();
  expect(reportService.getOverview).toHaveBeenCalledTimes(1);
  unmount();
  await act(async () => {
    pendingOverview.resolve(overview());
    pendingList.resolve(classList());
  });
  expect(error).not.toHaveBeenCalled();
  expect(warning).not.toHaveBeenCalled();
});

function totalCard(title: string) {
  return within(screen.getByText(title).closest<HTMLElement>('.metric-card')!);
}

const usersTitle = 'Tổng người dùng';
const submissionsTitle = 'Tổng bài nộp';
const totalError = 'Không thể tải dữ liệu';
const noWorkTitle = 'Không có dữ liệu bài tập';
const noWorkDescription = 'Không có bài tập được giao trong phạm vi lọc. Thử mở rộng bộ lọc.';
const noClassesTitle = 'Không có lớp phù hợp với bộ lọc';

it('loads system totals once from pagination and keeps them through class, teacher, date and reset filters', async () => {
  const { container } = renderReports();
  await ready();
  expect(totalCard(usersTitle).getByText('91')).toBeVisible();
  expect(totalCard(submissionsTitle).getByText('194')).toBeVisible();

  await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '9');
  await userEvent.selectOptions(classSelect(), '1');
  const dates = container.querySelectorAll('input[type="date"]');
  fireEvent.change(dates[0], { target: { value: '2026-09-01' } });
  fireEvent.change(dates[1], { target: { value: '2026-09-30' } });
  await waitFor(() => expect(kpiValues(container)[0]).toBe('1'));
  await userEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
  await waitFor(() => expect(kpiValues(container)[0]).toBe('3'));

  expect(totalCard(usersTitle).getByText('91')).toBeVisible();
  expect(totalCard(submissionsTitle).getByText('194')).toBeVisible();
  expect(vi.mocked(userService.listUsers).mock.calls.filter(([params]) => !params?.role)).toEqual([
    [{ page: 1, limit: 1 }, { signal: expect.any(AbortSignal) }],
  ]);
  expect(vi.mocked(submissionService.listSubmissions).mock.calls).toEqual([
    [{ page: 1, limit: 1, status: 'SUBMITTED' }, { signal: expect.any(AbortSignal) }],
    [{ page: 1, limit: 1, status: 'GRADED' }, { signal: expect.any(AbortSignal) }],
  ]);
});

it('shows loading until both submission totals are available and accepts zero', async () => {
  const pending = deferred<SubmissionListResponse>();
  loadUserTotal.mockResolvedValueOnce(totalPage(0));
  vi.mocked(submissionService.listSubmissions).mockResolvedValueOnce(totalPage(0)).mockReturnValueOnce(pending.promise);
  renderReports();
  expect(totalCard(usersTitle).getByText('Đang tải…')).toBeVisible();
  expect(await totalCard(usersTitle).findByText('0')).toBeVisible();
  expect(totalCard(submissionsTitle).getByText('Đang tải…')).toBeVisible();
  expect(totalCard(submissionsTitle).queryByText('0')).not.toBeInTheDocument();
  await act(async () => pending.resolve(totalPage(0)));
  expect(totalCard(submissionsTitle).getByText('0')).toBeVisible();
});

it.each([
  ['missing pagination', undefined],
  ['missing total', { page: 1, limit: 1 }],
  ['null', { page: 1, limit: 1, total: null }],
  ['negative', { page: 1, limit: 1, total: -1 }],
  ['string', { page: 1, limit: 1, total: '149' }],
  ['NaN', { page: 1, limit: 1, total: NaN }],
  ['infinite', { page: 1, limit: 1, total: Infinity }],
])('treats %s as an invalid total and retries only that submission request', async (_name, pagination) => {
  vi.mocked(submissionService.listSubmissions).mockResolvedValueOnce({ data: [], pagination } as SubmissionListResponse);
  renderReports();
  expect(await totalCard(submissionsTitle).findByText(totalError)).toBeVisible();
  expect(totalCard(submissionsTitle).queryByText('45')).not.toBeInTheDocument();
  expect(totalCard(usersTitle).getByText('91')).toBeVisible();
  await userEvent.click(totalCard(submissionsTitle).getByRole('button', { name: 'Thử lại tổng bài nộp' }));
  expect(await totalCard(submissionsTitle).findByText('194')).toBeVisible();
  expect(vi.mocked(submissionService.listSubmissions).mock.calls.map(([params]) => params?.status))
    .toEqual(['SUBMITTED', 'GRADED', 'SUBMITTED']);
  expect(userService.listUsers).toHaveBeenCalledTimes(2);
});

it.each([401, 403, 503])('keeps the other card available on HTTP %s and retries only the failed endpoint', async status => {
  const failure = Object.assign(new Error('Request failed'), { status });
  if (status === 401) loadUserTotal.mockRejectedValueOnce(failure);
  if (status === 403) vi.mocked(submissionService.listSubmissions).mockRejectedValueOnce(failure);
  if (status === 503) {
    vi.mocked(submissionService.listSubmissions).mockResolvedValueOnce(totalPage(149)).mockRejectedValueOnce(failure);
  }
  const failedTitle = status === 401 ? usersTitle : submissionsTitle;
  renderReports();
  expect(await totalCard(failedTitle).findByText(totalError)).toBeVisible();
  if (status === 401) {
    expect(totalCard(submissionsTitle).getByText('194')).toBeVisible();
  } else {
    expect(totalCard(usersTitle).getByText('91')).toBeVisible();
    expect(totalCard(submissionsTitle).queryByText(status === 403 ? '45' : '149')).not.toBeInTheDocument();
  }
  await userEvent.click(totalCard(failedTitle).getByRole('button', { name: /Thử lại/ }));
  expect(await totalCard(failedTitle).findByText(status === 401 ? '91' : '194')).toBeVisible();
  expect(userService.listUsers).toHaveBeenCalledTimes(status === 401 ? 3 : 2);
  expect(vi.mocked(submissionService.listSubmissions).mock.calls.map(([params]) => params?.status))
    .toEqual(status === 401 ? ['SUBMITTED', 'GRADED'] : ['SUBMITTED', 'GRADED', status === 403 ? 'SUBMITTED' : 'GRADED']);
});

it('aborts system total requests and ignores success and failure delivered after unmount', async () => {
  const lateUsers = deferred<Awaited<ReturnType<typeof userService.listUsers>>>();
  const lateSubmissions = deferred<SubmissionListResponse>();
  loadUserTotal.mockReturnValueOnce(lateUsers.promise);
  vi.mocked(submissionService.listSubmissions).mockReturnValueOnce(lateSubmissions.promise.then(() => {
    throw new Error('Late failure');
  }));
  const error = vi.spyOn(console, 'error');
  const { unmount } = renderReports();
  await waitFor(() => expect(loadUserTotal).toHaveBeenCalledTimes(1));
  const totalRequest = vi.mocked(userService.listUsers).mock.calls.find(([params]) => !params?.role);
  const signal = totalRequest?.[1]?.signal;
  expect(signal?.aborted).toBe(false);
  unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    lateUsers.resolve(totalPage(91));
    lateSubmissions.resolve(totalPage(149));
  });
  expect(error).not.toHaveBeenCalled();
});

it('starts just one set of totals requests when React StrictMode replays mount effects', async () => {
  render(<StrictMode><LanguageProvider><AdminReports /></LanguageProvider></StrictMode>);
  expect(await totalCard(submissionsTitle).findByText('194')).toBeVisible();
  expect(totalCard(usersTitle).getByText('91')).toBeVisible();
  expect(vi.mocked(userService.listUsers).mock.calls.filter(([params]) => !params?.role)).toHaveLength(1);
  expect(submissionService.listSubmissions).toHaveBeenCalledTimes(2);
});

it('explains when the filtered overview contains no classes and keeps the system totals visible', async () => {
  vi.mocked(reportService.getOverview).mockResolvedValue({ ...overview(), classCount: 0 });
  renderReports();
  expect(await screen.findByText(noClassesTitle)).toBeVisible();
  expect(screen.getByText('Không có dữ liệu lớp học trong phạm vi lọc. Thử mở rộng bộ lọc.')).toBeVisible();
  expect(screen.queryByText(noWorkTitle)).not.toBeInTheDocument();
  expect(totalCard(usersTitle).getByText('91')).toBeVisible();
  expect(totalCard(submissionsTitle).getByText('194')).toBeVisible();
});

it.each([null, 0])('explains no assigned work with average %s only after a successful overview', async averageScorePercent => {
  const pending = deferred<ReportOverviewResponse>();
  vi.mocked(reportService.getOverview).mockReturnValueOnce(pending.promise);
  const { container } = renderReports();
  expect(screen.getByText('Đang tổng hợp báo cáo...')).toBeVisible();
  expect(screen.queryByText(noWorkTitle)).not.toBeInTheDocument();
  expect(screen.queryByText(noClassesTitle)).not.toBeInTheDocument();
  await act(async () => pending.resolve({ ...overview(), assignedAssignmentCount: 0, averageScorePercent } as ReportOverviewResponse));
  expect(screen.getByText(noWorkTitle)).toBeVisible();
  expect(screen.getByText(noWorkDescription)).toBeVisible();
  expect(kpiValues(container)).toEqual(['3', '0%', '0%', '0']);
  expect(totalCard(submissionsTitle).getByText('194')).toBeVisible();
});

it.each([
  { assignedAssignmentCount: 1, pendingGradingCount: 0, averageScorePercent: 0 },
  { assignedAssignmentCount: 0, pendingGradingCount: 1, averageScorePercent: 0 },
  { assignedAssignmentCount: 0, pendingGradingCount: 0, averageScorePercent: 1 },
])('does not show no assigned work for active overview %j', async metrics => {
  vi.mocked(reportService.getOverview).mockResolvedValue({ ...overview(), ...metrics });
  const { container } = renderReports();
  await ready();
  expect(screen.queryByText(noWorkTitle)).not.toBeInTheDocument();
  expect(kpiValues(container)[2]).toBe(`${metrics.averageScorePercent}%`);
});

it('keeps overview failures separate from both empty states and lets the report retry', async () => {
  vi.mocked(reportService.getOverview).mockRejectedValueOnce(new Error('KPI unavailable'));
  renderReports();
  expect(await screen.findByText('KPI unavailable')).toBeVisible();
  expect(screen.queryByText(noWorkTitle)).not.toBeInTheDocument();
  expect(screen.queryByText(noClassesTitle)).not.toBeInTheDocument();
  expect(totalCard(submissionsTitle).getByText('194')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  await waitFor(() => expect(screen.queryByText('KPI unavailable')).not.toBeInTheDocument());
});

function ReportsWithLanguageSwitch() {
  const { toggleLanguage } = useLanguage();
  return (
    <main>
      <button type="button" onClick={toggleLanguage}>Switch language</button>
      <AdminReports />
    </main>
  );
}

it('localizes both totals and the empty state inside main when switching to English', async () => {
  vi.mocked(reportService.getOverview).mockResolvedValue({ ...overview(), assignedAssignmentCount: 0 });
  renderPage(<ReportsWithLanguageSwitch />, '/admin/reports');
  const main = within(screen.getByRole('main'));
  expect(await main.findByText(noWorkTitle)).toBeVisible();
  expect(main.getByText(noWorkDescription)).toBeVisible();
  await userEvent.click(main.getByRole('button', { name: 'Switch language' }));
  expect(await main.findByText('No assignment data')).toBeVisible();
  expect(main.getByText('There are no assigned tasks for the selected filters. Try expanding the filters.')).toBeVisible();
  expect(totalCard('Total users').getByText('91')).toBeVisible();
  expect(totalCard('Total submissions').getByText('194')).toBeVisible();
  expect(userService.listUsers).toHaveBeenCalledTimes(2);
  expect(submissionService.listSubmissions).toHaveBeenCalledTimes(2);
});

it('exports the existing CSV rows without either system total', async () => {
  const createUrl = vi.fn<(blob: Blob) => string>(() => 'blob:reports');
  const revokeUrl = vi.fn();
  const originalUrl = URL;
  vi.stubGlobal('URL', class extends originalUrl {
    static createObjectURL = createUrl;
    static revokeObjectURL = revokeUrl;
  });
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  try {
    renderReports();
    await ready();
    expect(totalCard(usersTitle).getByText('91')).toBeVisible();
    expect(totalCard(submissionsTitle).getByText('194')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Xuất báo cáo (CSV)' }));
    expect(download).toHaveBeenCalledOnce();
    expect(revokeUrl).toHaveBeenCalledWith('blob:reports');
    const blob = createUrl.mock.calls[0][0];
    const csv = await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });
    expect(csv).toContain('Tổng số lớp,3');
    expect(csv).toContain('Tổng bài tập đã giao,8');
    expect(csv).toContain('1,IELTS Foundation K1,Đang hoạt động,3,0%,0%');
    expect(csv).not.toMatch(/Tổng người dùng|Tổng bài nộp|,91\r?$|,194\r?$/m);
  } finally {
    vi.unstubAllGlobals();
  }
});
