import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AssignmentCard, type AssignmentDisplayItem } from '../../components/assignments/AssignmentCard';

const currentTimestamp = new Date(2026, 10, 20, 12).getTime();
const defaultItem: AssignmentDisplayItem = {
  id: '42',
  classId: 12,
  code: 'HW-42',
  title: 'Weekly practice',
  className: 'IELTS A',
  skills: ['WRITING', 'SPEAKING', 'READING', 'LISTENING'],
  dueDate: '20/11/2026',
  closeDate: new Date(2026, 10, 20, 15, 5),
  closeAt: new Date(2026, 10, 20, 15, 5).toISOString(),
  totalStudents: 10,
  submittedCount: 0,
  pendingGradingCount: 0,
  status: 'open',
  lifecycleStatus: 'PUBLISHED',
};

function renderCard(overrides: Partial<AssignmentDisplayItem> = {}, isVi = true, isUpdatingLifecycle = false) {
  const onViewDetails = vi.fn();
  const onEdit = vi.fn();
  const onViewSubmissions = vi.fn();
  const onChangeLifecycle = vi.fn();
  const { container } = render(
    <AssignmentCard
      item={{ ...defaultItem, ...overrides }}
      currentTimestamp={currentTimestamp}
      isVi={isVi}
      onViewDetails={onViewDetails}
      onEdit={onEdit}
      onViewSubmissions={onViewSubmissions}
      onChangeLifecycle={onChangeLifecycle}
      isUpdatingLifecycle={isUpdatingLifecycle}
    />
  );
  return { container, onViewDetails, onEdit, onViewSubmissions, onChangeLifecycle };
}

it('keeps the card structure, identity, combined skills and no-submissions pill', () => {
  const { container } = renderCard();
  const card = container.querySelector('.teacher-assignment-card')!;

  expect(Array.from(card.children, node => node.className)).toEqual([
    'teacher-assignment-card-header',
    'teacher-assignment-title',
    'teacher-assignment-card-divider',
    'teacher-assignment-card-footer',
  ]);
  expect(screen.getByRole('heading', { name: 'Weekly practice', level: 3 })).toBeVisible();
  expect(card.querySelector('.teacher-assignment-code-badge')).toHaveTextContent('HW-42');
  expect(card.querySelector('.teacher-assignment-class-tag')).toHaveTextContent('IELTS A');
  expect(screen.getByTitle('Reading, Listening, Writing, Speaking')).toHaveTextContent('4 Kỹ năng');
  expect(card.querySelector('.teacher-assignment-upcoming-pill')).toHaveTextContent('Chưa có bài nộp');
});

it('renders a subset of skills in the supplied order', () => {
  const { container } = renderCard({ skills: ['SPEAKING', 'READING'] });
  expect(Array.from(container.querySelectorAll('.teacher-skill-mini-badge'), node => node.textContent)).toEqual([
    'Speaking',
    'Reading',
  ]);
});

it('keeps an empty skill group when the assignment has no skills', () => {
  const { container } = renderCard({ skills: [] });
  expect(container.querySelector('.teacher-assignment-skills-wrap')).toBeEmptyDOMElement();
  expect(container.querySelector('.teacher-skill-combined-badge')).not.toBeInTheDocument();
});

it.each([
  { name: 'today', closeDate: new Date(2026, 10, 20, 15, 5), status: 'open', label: 'Hết hạn hôm nay • 15:05', variant: 'urgent' },
  { name: 'tomorrow', closeDate: new Date(2026, 10, 21, 9, 2), status: 'upcoming', label: 'Hạn ngày mai • 09:02', variant: 'urgent' },
  { name: 'later', closeDate: new Date(2026, 10, 25, 16, 9), status: 'open', daysLeft: 5, label: 'Hạn nộp: 16:09, 25/11', variant: null },
  { name: 'later without a day count', closeDate: new Date(2026, 10, 25, 16, 9), status: 'open', label: 'Hạn nộp: 16:09, 25/11', variant: null },
  { name: 'later with zero days left', closeDate: new Date(2026, 10, 25, 16, 9), status: 'open', daysLeft: 0, label: 'Hạn nộp: 16:09, 25/11', variant: null },
  { name: 'closed', closeDate: new Date(2026, 10, 19, 15, 5), status: 'closed', label: 'Đã đóng (19/11)', variant: 'expired' },
  { name: 'null', closeDate: null, status: 'open', label: 'Không thời hạn', variant: null },
  { name: 'missing', closeDate: undefined, status: 'open', label: 'Không thời hạn', variant: null },
  { name: 'invalid', closeDate: new Date(NaN), status: 'open', label: 'Không thời hạn', variant: null },
] satisfies Array<Partial<AssignmentDisplayItem> & { name: string; label: string; variant: string | null }>)(
  'keeps the $name deadline label and styling',
  ({ closeDate, status, daysLeft, label, variant }) => {
    const { container } = renderCard({ closeDate, status, daysLeft });
    const deadline = container.querySelector<HTMLElement>('.teacher-assignment-deadline-tag')!;

    expect(within(deadline).getByText(label)).toBeVisible();
    expect(deadline.className).toBe(
      variant ? `teacher-assignment-deadline-tag ${variant}` : 'teacher-assignment-deadline-tag'
    );
    if (daysLeft === 5) {
      expect(within(deadline).getByText('(Còn 5 ngày)')).toBeVisible();
    } else {
      expect(deadline.querySelector('.teacher-assignment-deadline-sub')).not.toBeInTheDocument();
    }
  }
);

it.each([
  { submittedCount: 0, totalStudents: 10, percent: 0 },
  { submittedCount: 3, totalStudents: 8, percent: 38 },
  { submittedCount: 10, totalStudents: 10, percent: 100 },
  { submittedCount: 12, totalStudents: 10, percent: 100 },
  { submittedCount: 2, totalStudents: 0, percent: 0 },
])('keeps $submittedCount/$totalStudents turnout at $percent%', ({ submittedCount, totalStudents, percent }) => {
  const { container } = renderCard({ submittedCount, totalStudents });
  expect(container.querySelector('.teacher-assignment-turnout-label'))
    .toHaveTextContent(`Đã nộp: ${submittedCount}/${totalStudents} (${percent}%)`);
  expect(container.querySelector('.teacher-assignment-mini-fill')).toHaveStyle({ width: `${percent}%` });
});

it('keeps the title, edit and submission callbacks distinct', async () => {
  const user = userEvent.setup();
  const { onEdit, onViewDetails, onViewSubmissions } = renderCard();

  await user.click(screen.getByRole('heading', { name: 'Weekly practice' }));
  await user.click(screen.getByRole('button', { name: 'Chỉnh sửa' }));
  await user.click(screen.getByRole('button', { name: 'Quản lý bài nộp' }));

  expect(onViewDetails).toHaveBeenCalledExactlyOnceWith();
  expect(onEdit).toHaveBeenCalledExactlyOnceWith();
  expect(onViewSubmissions).toHaveBeenCalledExactlyOnceWith();
});

it('keeps edit hidden for closed cards and the grading CTA for pending submissions', () => {
  const { container, onViewSubmissions } = renderCard({ status: 'closed', submittedCount: 3, pendingGradingCount: 2 });
  expect(screen.queryByRole('button', { name: 'Chỉnh sửa' })).not.toBeInTheDocument();
  expect(container.querySelector('.teacher-assignment-pending-pill')).toHaveTextContent('2 bài chờ chấm');

  fireEvent.click(screen.getByRole('button', { name: 'Chấm bài ngay' }));
  expect(onViewSubmissions).toHaveBeenCalledExactlyOnceWith();
});

it('keeps the completed grading pill and English labels', () => {
  const { container } = renderCard({ submittedCount: 10 }, false);
  expect(container.querySelector('.teacher-assignment-done-pill')).toHaveTextContent('All graded');
  expect(screen.getByText('4 Skills')).toBeVisible();
  expect(screen.getByText('Due today • 15:05')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'View Submissions' })).toBeVisible();
});

const validDeadline = new Date(2026, 10, 20, 15, 5);
const expiredDeadline = new Date(2026, 10, 19, 15, 5);
const deadlineCases = [
  { deadline: 'future', closeDate: validDeadline, closeAt: validDeadline.toISOString(), label: 'Hết hạn hôm nay • 15:05', expired: false },
  { deadline: 'expired', closeDate: expiredDeadline, closeAt: expiredDeadline.toISOString(), label: 'Đã đóng (19/11)', expired: true },
  { deadline: 'null', closeDate: null, closeAt: null, label: 'Không thời hạn', expired: false },
  { deadline: 'invalid', closeDate: new Date(NaN), closeAt: 'not-a-date', label: 'Không thời hạn', expired: false },
];
const lifecycleCases = [
  { lifecycleStatus: 'DRAFT', badge: 'Nháp', action: 'Mở bài tập' },
  { lifecycleStatus: 'PUBLISHED', badge: 'Đã mở', action: 'Khóa bài tập' },
  { lifecycleStatus: 'CLOSED', badge: 'Đã khóa', action: 'Mở bài tập' },
] as const;

it.each(lifecycleCases.flatMap(lifecycle => deadlineCases.map(deadline => ({ ...lifecycle, ...deadline }))))(
  'E06: renders $lifecycleStatus with a $deadline deadline independently',
  ({ lifecycleStatus, badge, action, closeDate, closeAt, label, expired }) => {
    const status = expired ? 'closed' : lifecycleStatus === 'DRAFT' && closeAt === validDeadline.toISOString() ? 'upcoming' : 'open';
    const { container, onChangeLifecycle } = renderCard({ lifecycleStatus, closeDate, closeAt, status });

    const identity = container.querySelector<HTMLElement>('.teacher-assignment-card-identity')!;
    const grading = container.querySelector<HTMLElement>('.teacher-assignment-card-status')!;
    expect(within(identity).getByText(badge)).toHaveClass('status-badge');
    expect(within(grading).getByText('Chưa có bài nộp')).toBeVisible();
    expect(container.querySelector('.teacher-assignment-deadline-tag')).toHaveTextContent(label);
    fireEvent.click(screen.getByRole('button', { name: action }));
    expect(onChangeLifecycle).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ lifecycleStatus }));
    const edit = screen.queryByRole('button', { name: 'Chỉnh sửa' });
    if (expired || lifecycleStatus === 'CLOSED') {
      expect(edit).not.toBeInTheDocument();
    } else {
      expect(edit).toBeVisible();
    }
  }
);

it('keeps the lifecycle button disabled while another assignment is updating', () => {
  const { onChangeLifecycle } = renderCard({}, true, true);
  const button = screen.getByRole('button', { name: 'Khóa bài tập' });

  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(onChangeLifecycle).not.toHaveBeenCalled();
});

it.each(['DRAFT', 'CLOSED'] as const)('shows the same disabled English open action for %s while pending', lifecycleStatus => {
  const { onChangeLifecycle } = renderCard({ lifecycleStatus }, false, true);
  const button = screen.getByRole('button', { name: 'Open assignment' });

  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(onChangeLifecycle).not.toHaveBeenCalled();
});
