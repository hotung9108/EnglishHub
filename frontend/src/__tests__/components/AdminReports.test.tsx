import { beforeEach, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminReports from '../../pages/AdminReports';
import { reportService } from '../../api/services/report.service';
import { classService, type ClassSummary } from '../../api/services/class.service';
import { userService } from '../../api/services/user.service';
import type { ReportClassListResponse, ReportClassSummary, ReportOverviewParams, ReportOverviewResponse } from '../../types/report.types';
import { deferred } from '../deferred';
import { renderPage } from './renderPage';

vi.mock('../../api/services/report.service', () => ({
  reportService: { getOverview: vi.fn(), listClasses: vi.fn(), getClassProgress: vi.fn() },
}));
vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn() } }));
vi.mock('../../api/services/user.service', () => ({ userService: { listUsers: vi.fn() } }));

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
  vi.mocked(classService.list).mockResolvedValue({ data: classes, pagination: { page: 1, limit: 100, total: classes.length } });
  vi.mocked(userService.listUsers).mockResolvedValue({
    data: [
      { id: 9, fullName: 'Nguyễn Đức Tuấn', email: 'nguyen.duc.tuan@gmail.com', role: 'TEACHER', status: 'ACTIVE' },
      { id: 4, fullName: 'Phạm Diệu Anh', email: 'pham.dieu.anh@gmail.com', role: 'TEACHER', status: 'ACTIVE' },
    ],
    pagination: { page: 1, limit: 100, total: 2 },
  });
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
  return Array.from(container.querySelectorAll('.metric-value'), node => node.textContent);
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
