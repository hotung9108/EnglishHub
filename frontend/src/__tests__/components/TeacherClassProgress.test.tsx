import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { assignmentService, type AssignmentSummary } from '../../api/services/assignment.service';
import { classService, type ClassMember } from '../../api/services/class.service';
import { studentEvaluationService } from '../../api/services/student-evaluation.service';
import { submissionService, type SubmissionListItem, type SubmissionSkill } from '../../api/services/submission.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { TeacherClassProgress } from '../../pages/TeacherClassProgress';
import { renderPage } from './renderPage';

vi.mock('../../api/services/class.service', () => ({
  classService: { list: vi.fn(), getDetail: vi.fn(), listMembers: vi.fn() },
}));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { listAssignments: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: { listAllSubmissions: vi.fn() } }));
vi.mock('../../api/services/student-evaluation.service', () => ({ studentEvaluationService: { list: vi.fn() } }));

// Class, member and assignment identities are from the CSV snapshot. Dates and grades exercise filter boundaries.
const englishClass = { id: 1, name: 'IELTS Foundation K1', status: 'ACTIVE' } as const;
const secondClass = { id: 2, name: 'Tiếng Anh Giao Tiếp Cơ Bản A1', status: 'ACTIVE' } as const;
const members: ClassMember[] = [
  { memberId: 14, studentId: 19, fullName: 'Cao Gia Bảo' },
  { memberId: 2, studentId: 23, fullName: 'Cao Thanh Hải' },
  { memberId: 9, studentId: 28, fullName: 'Nguyễn Thị Như' },
  { memberId: 4, studentId: 29, fullName: 'Trần Hoàng Khang' },
];
const assignments: AssignmentSummary[] = [
  { id: 1, title: 'Assignment 1 - Daily Routine Vocabulary', status: 'DRAFT', closeAt: '2026-11-30T08:00:00Z', skills: [] },
  { id: 2, title: 'Assignment 2 - Weekly Test - Unit 3: Travel', status: 'CLOSED', closeAt: '2026-11-09T10:00:00Z', skills: ['WRITING'] },
  { id: 3, title: 'Assignment 3 - Workplace Communication Practice', status: 'PUBLISHED', closeAt: '2026-11-30T08:00:00Z', skills: ['READING'] },
  { id: 4, title: 'Assignment 4 - Education and Future Plans Review', status: 'CLOSED', closeAt: '', skills: ['LISTENING', 'SPEAKING'] },
];

function attempt(
  id: number, assignmentId: number, studentId: number, submittedAt: string | null,
  status: SubmissionListItem['status'], skill?: SubmissionSkill, score?: number,
): SubmissionListItem {
  return {
    id, assignmentId, studentId, submittedAt, status, attemptNumber: 1,
    modules: skill ? [{
      id, moduleId: id, skill, taskType: null, status,
      grading: { status: score === undefined ? 'PENDING' : 'COMPLETED', finalScore: score ?? null, maxScoreSnapshot: 10 },
    }] : [],
  };
}

const submissions = [
  attempt(31, 4, 19, '2026-11-09T23:59:59.999+07:00', 'SUBMITTED', 'WRITING', 4),
  attempt(1, 2, 19, '2026-11-09T17:00:00.000Z', 'GRADED', 'WRITING', 8),
  attempt(20, 3, 19, '2026-11-11T01:59:59.999+09:00', 'GRADED', 'READING', 10),
  attempt(2, 2, 23, '2026-11-11T00:00:00+07:00', 'SUBMITTED', 'SPEAKING'),
  attempt(19, 3, 28, null, 'IN_PROGRESS'),
];
const path = '/teacher/classes/:id/progress';
const entry = '/teacher/classes/1/progress';
const adjustmentTitle = 'Điều chỉnh điểm (Kèm lý do kiểm toán)';
const reversedError = 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.';
const notice = 'Dữ liệu đánh giá còn hạn chế vì học viên chưa có bài nộp trong lớp này.';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-15T00:00:00Z'));
  vi.mocked(classService.list).mockResolvedValue({
    data: [englishClass, secondClass], pagination: { page: 1, limit: 100, total: 2 },
  });
  vi.mocked(classService.getDetail).mockResolvedValue(englishClass);
  vi.mocked(classService.listMembers).mockResolvedValue(members);
  vi.mocked(assignmentService.listAssignments).mockResolvedValue({
    data: assignments, pagination: { page: 1, limit: 100, total: assignments.length },
  });
  vi.mocked(submissionService.listAllSubmissions).mockResolvedValue(submissions);
  vi.mocked(studentEvaluationService.list).mockResolvedValue({ data: [], pagination: { page: 1, limit: 20, total: 0 } });
});

function GradebookWithLanguageSwitch() {
  const { toggleLanguage } = useLanguage();
  return (
    <main>
      <button type="button" onClick={toggleLanguage}>Switch language</button>
      <TeacherClassProgress />
    </main>
  );
}

async function openGradebook(withLanguageSwitch = false) {
  const page = withLanguageSwitch ? <GradebookWithLanguageSwitch /> : <main><TeacherClassProgress /></main>;
  renderPage(page, path, entry);
  await screen.findByRole('row', { name: new RegExp(members[0].fullName) });
}

const studentRow = (index: number) => screen.getByRole('row', { name: new RegExp(members[index].fullName) });
const overall = (index = 0) => studentRow(index).querySelector('.tcd-overall-score');
const editButton = (index = 0) => within(studentRow(index)).getByRole('button', { name: adjustmentTitle });
const fromDate = () => screen.getByLabelText('Từ ngày');
const toDate = () => screen.getByLabelText('Đến ngày');
const changeDate = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });
const clearDates = () => fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc ngày' }));

function readCsv() {
  let href = '';
  const download = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    href = this.getAttribute('href') ?? '';
  });
  fireEvent.click(screen.getByRole('button', { name: 'Xuất CSV' }));
  expect(download).toHaveBeenCalledOnce();
  download.mockRestore();
  return decodeURI(href);
}

it('dùng cùng khoảng ngày Việt Nam cho bảng, KPI, thống kê kỹ năng và CSV', async () => {
  await openGradebook();
  expect(document.querySelectorAll('main input[type="date"]')).toHaveLength(2);
  expect(overall()).toHaveTextContent(/^8$/);

  changeDate(fromDate(), '2026-11-10');
  changeDate(toDate(), '2026-11-10');
  expect(overall()).toHaveTextContent(/^9$/);
  expect(within(studentRow(0)).getByText('2/4')).toBeVisible();
  expect(overall(1)).toHaveTextContent('—');
  expect(within(studentRow(1)).getByText('0/4')).toBeVisible();
  expect(screen.getByText('2 / 16 lượt nộp bài')).toBeVisible();
  expect(screen.getByText('9.0', { selector: '.tcd-kpi-value' })).toBeVisible();
  expect(readCsv()).toContain('HV-0019,"Cao Gia Bảo",2/4,8,,10,,9,"Đạt chuẩn"');

  fireEvent.click(screen.getByRole('button', { name: 'Đánh giá 4 kỹ năng' }));
  const reading = screen.getByText('Reading', { selector: '.tcd-analytics-skill-card *' })
    .closest<HTMLElement>('.tcd-analytics-skill-card')!;
  expect(reading.querySelector('.tcd-skill-score-box')).toHaveTextContent(/10\s*\/\s*10/);
  expect(fromDate()).toHaveValue('2026-11-10');
  expect(submissionService.listAllSubmissions).toHaveBeenCalledExactlyOnceWith({ classId: englishClass.id });
});

it('áp dụng từng đầu khoảng độc lập, giữ học viên khi không có lượt và phục hồi khi xóa bộ lọc', async () => {
  await openGradebook();
  expect(screen.getByRole('button', { name: 'Xóa bộ lọc ngày' })).toBeDisabled();
  changeDate(fromDate(), '2026-11-11');
  expect(overall()).toHaveTextContent('—');
  expect(screen.getByText('1 / 16 lượt nộp bài')).toBeVisible();
  changeDate(fromDate(), '');
  changeDate(toDate(), '2026-11-09');
  expect(overall()).toHaveTextContent(/^4$/);
  expect(screen.getByText('1 / 16 lượt nộp bài')).toBeVisible();
  changeDate(fromDate(), '2026-11-01');
  changeDate(toDate(), '2026-11-02');
  expect(overall()).toHaveTextContent('—');
  expect(screen.getByText('0 / 16 lượt nộp bài')).toBeVisible();
  expect(readCsv()).toContain('HV-0019,"Cao Gia Bảo",0/4,,,,,,"Cần hỗ trợ"');
  clearDates();
  expect(fromDate()).toHaveValue('');
  expect(toDate()).toHaveValue('');
  expect(overall()).toHaveTextContent(/^8$/);
  expect(editButton()).toBeEnabled();
});

it('loại timestamp null, sai định dạng và thiếu offset chỉ khi khoảng lọc hiệu lực', async () => {
  vi.mocked(submissionService.listAllSubmissions).mockResolvedValue([
    attempt(31, 4, 19, null, 'GRADED', 'WRITING', 6),
    attempt(1, 2, 19, 'invalid', 'GRADED', 'SPEAKING', 7),
    attempt(20, 3, 19, '2026-11-10T12:00:00', 'GRADED', 'LISTENING', 8),
  ]);
  await openGradebook();
  expect(overall()).toHaveTextContent(/^7$/);
  changeDate(fromDate(), '2026-11-10');
  expect(overall()).toHaveTextContent('—');
  expect(screen.getByText('0 / 16 lượt nộp bài')).toBeVisible();
  expect(readCsv()).toContain('HV-0019,"Cao Gia Bảo",0/4');
  clearDates();
  expect(overall()).toHaveTextContent(/^7$/);
});

it('báo khoảng đảo ngược tại hai input và quay về thống kê, CSV và chỉnh điểm toàn thời gian', async () => {
  await openGradebook();
  changeDate(fromDate(), '2026-11-10');
  changeDate(toDate(), '2026-11-10');
  expect(overall()).toHaveTextContent(/^9$/);
  expect(editButton()).toBeDisabled();
  changeDate(fromDate(), '2026-11-11');
  expect(screen.getByRole('alert')).toHaveTextContent(reversedError);
  expect(fromDate()).toHaveAccessibleDescription(reversedError);
  expect(toDate()).toHaveAccessibleDescription(reversedError);
  expect(fromDate()).toHaveAttribute('aria-invalid', 'true');
  expect(overall()).toHaveTextContent(/^8$/);
  expect(screen.getByText('5 / 16 lượt nộp bài')).toBeVisible();
  expect(readCsv()).toContain('HV-0019,"Cao Gia Bảo",3/4,6,,10,,8,"Đạt chuẩn"');
  expect(editButton()).toBeEnabled();
  fireEvent.click(editButton());
  expect(screen.getByRole('heading', { name: 'Điều chỉnh điểm số học viên' })).toBeVisible();
  clearDates();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('chỉ chỉnh cục bộ ở chế độ toàn thời gian và phục hồi điểm đã chỉnh sau khi xóa lọc', async () => {
  await openGradebook();
  fireEvent.click(editButton());
  const grade = screen.getByRole('spinbutton');
  const reason = screen.getByPlaceholderText(/Nhập lý do điều chỉnh điểm/);
  const save = screen.getByRole('button', { name: 'Lưu điều chỉnh điểm' });
  fireEvent.change(grade, { target: { value: '11' } });
  fireEvent.change(reason, { target: { value: 'a' } });
  fireEvent.click(save);
  expect(screen.getByText('Điểm số phải nằm trong khoảng từ 0 đến 10.')).toBeVisible();
  fireEvent.change(grade, { target: { value: '9.5' } });
  fireEvent.click(save);
  expect(screen.getByText(/Vui lòng nhập lý do điều chỉnh điểm/)).toBeVisible();
  fireEvent.change(reason, { target: { value: 'Đã phúc khảo' } });
  fireEvent.click(save);
  expect(overall()).toHaveTextContent(/^9\.5$/);
  fireEvent.click(editButton());
  changeDate(toDate(), '2026-11-09');
  expect(screen.queryByRole('heading', { name: 'Điều chỉnh điểm số học viên' })).not.toBeInTheDocument();
  expect(editButton()).toBeDisabled();
  fireEvent.click(editButton());
  expect(screen.queryByRole('button', { name: 'Lưu điều chỉnh điểm' })).not.toBeInTheDocument();
  expect(overall()).toHaveTextContent(/^4$/);
  clearDates();
  expect(overall()).toHaveTextContent(/^9\.5$/);
  expect(editButton()).toBeEnabled();
});

it('giữ cách tính điểm trung bình khi điều chỉnh một kỹ năng ở chế độ toàn thời gian', async () => {
  await openGradebook();
  fireEvent.click(editButton());
  fireEvent.change(screen.getByRole('combobox', { name: '' }), { target: { value: 'writing' } });
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '8' } });
  fireEvent.change(screen.getByPlaceholderText(/Nhập lý do điều chỉnh điểm/), { target: { value: 'Đã phúc khảo' } });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu điều chỉnh điểm' }));
  expect(overall()).toHaveTextContent(/^9$/);
  expect(readCsv()).toContain('HV-0019,"Cao Gia Bảo",3/4,8,,10,,9,"Đạt chuẩn"');
});

it.each([
  [0, false],
  [1, false],
  [2, true],
  [3, true],
] as const)('xét lịch sử toàn thời gian cho disclaimer của học viên %i', async (index, showNotice) => {
  await openGradebook();
  changeDate(fromDate(), '2026-12-01');
  expect(overall(index)).toHaveTextContent('—');
  fireEvent.click(within(studentRow(index)).getByRole('button', { name: 'Xem chi tiết học viên' }));
  const drawer = within(document.querySelector<HTMLElement>('.tcd-drawer-box')!);
  await drawer.findByText('Chưa có nhận xét nào trước đây.');
  if (showNotice) expect(drawer.getByRole('note')).toHaveTextContent(notice);
  else expect(drawer.queryByRole('note')).not.toBeInTheDocument();
  expect(drawer.getByRole('textbox')).toBeEnabled();
});

it('không hiện disclaimer khi request lượt nộp thất bại và chưa xác định được số lượt', async () => {
  vi.mocked(submissionService.listAllSubmissions).mockRejectedValueOnce(new Error('Submissions unavailable'));
  await openGradebook();
  fireEvent.click(within(studentRow(3)).getByRole('button', { name: 'Xem chi tiết học viên' }));
  await screen.findByText('Chưa có nhận xét nào trước đây.');
  expect(screen.queryByRole('note')).not.toBeInTheDocument();
});

it('hiện nhãn ngày, lỗi khoảng đảo ngược và disclaimer theo ngôn ngữ đang chọn', async () => {
  await openGradebook(true);
  changeDate(fromDate(), '2026-11-11');
  changeDate(toDate(), '2026-11-10');
  fireEvent.click(within(studentRow(3)).getByRole('button', { name: 'Xem chi tiết học viên' }));
  expect(screen.getByRole('note')).toHaveTextContent(notice);
  fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('The start date must be on or before the end date.'));
  expect(screen.getByLabelText('From date')).toHaveValue('2026-11-11');
  expect(screen.getByLabelText('To date')).toHaveValue('2026-11-10');
  expect(screen.getByRole('button', { name: 'Clear date filter' })).toBeVisible();
  expect(screen.getByRole('note')).toHaveTextContent('There is limited data for this evaluation');
  await screen.findByText('No evaluations recorded yet.');
});
