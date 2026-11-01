import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeacherCreateAssignment from '../../pages/TeacherCreateAssignment';
import { assignmentService } from '../../api/services/assignment.service';
import { classService } from '../../api/services/class.service';
import { moduleService } from '../../api/services/module.service';
import { questionService } from '../../api/services/question.service';
import { renderPage } from '../components/renderPage';

vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn() } }));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { createAssignment: vi.fn(), updateAssignmentStatus: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({ moduleService: { createModule: vi.fn() } }));
vi.mock('../../api/services/question.service', () => ({ questionService: { createQuestion: vi.fn() } }));

beforeEach(() => {
  vi.mocked(classService.list).mockResolvedValue({ data: [{ id: 12, name: 'IELTS A', status: 'ACTIVE' }], pagination: { page: 1, limit: 100, total: 1 } });
  vi.mocked(assignmentService.createAssignment).mockResolvedValue({ id: 42, message: 'Created' });
  vi.mocked(moduleService.createModule).mockResolvedValue({ id: 70, message: 'Created' });
  vi.mocked(assignmentService.updateAssignmentStatus).mockResolvedValue({ message: 'Published' });
  vi.mocked(questionService.createQuestion).mockResolvedValue({ id: 91, message: 'Created' });
});

async function setup() {
  const result = renderPage(<TeacherCreateAssignment />, '/teacher/create');
  await screen.findByRole('option', { name: 'Lớp: IELTS A' });
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('Nhập tiêu đề bài tập mới...'), 'Practice');
  fireEvent.change(result.container.querySelector('textarea')!, { target: { value: 'Write an essay.' } });
  return { ...result, user };
}


it('BUG-QA32-CREATE: does not publish an assignment whose module failed to save', async () => {
  vi.mocked(moduleService.createModule).mockRejectedValue(new Error('Module failed'));
  const { user } = await setup();
  await user.click(screen.getByRole('button', { name: 'Giao bài tập' }));
  await waitFor(() => expect(moduleService.createModule).toHaveBeenCalled());
  await waitFor(() => {
    expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
    expect(screen.queryByText('Giao bài tập mới thành công!')).not.toBeInTheDocument();
    expect(screen.getByText('Có lỗi xảy ra khi tạo bài tập. Vui lòng thử lại!')).toBeVisible();
  });
});

it('BUG-QA32-SCHEDULE: rejects a closing date before the opening date', async () => {
  const { user, container } = await setup();
  const dates = container.querySelectorAll('input[type="datetime-local"]');
  fireEvent.change(dates[0], { target: { value: '2026-11-08T09:00' } });
  fireEvent.change(dates[1], { target: { value: '2026-11-01T09:00' } });
  await user.click(screen.getByRole('button', { name: 'Giao bài tập' }));
  expect(assignmentService.createAssignment).not.toHaveBeenCalled();
});
