import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeacherEditAssignment from '../../pages/TeacherEditAssignment';
import { assignmentService } from '../../api/services/assignment.service';
import { classService } from '../../api/services/class.service';
import { moduleService, type ModuleDetailResponse } from '../../api/services/module.service';
import { renderPage } from './renderPage';

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: { getAssignment: vi.fn(), updateAssignment: vi.fn() },
}));
vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({
  moduleService: { listModules: vi.fn(), getModule: vi.fn(), updateModule: vi.fn() },
}));

const writingModule: ModuleDetailResponse = {
  id: 101,
  skill: 'WRITING',
  taskType: 'ESSAY',
  orderIndex: 1,
  maxScore: 10,
  instructions: 'Discuss public transport.',
};

beforeEach(() => {
  vi.mocked(classService.list).mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
  vi.mocked(moduleService.listModules).mockResolvedValue({ modules: [{ ...writingModule, hasAudio: false }] });
  vi.mocked(moduleService.getModule).mockResolvedValue(writingModule);
  vi.mocked(moduleService.updateModule).mockResolvedValue({ message: 'Updated' });
  vi.mocked(assignmentService.updateAssignment).mockResolvedValue({ message: 'Updated' });
});

async function openEditor(maxSubmissions: number | null) {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({
    id: 12,
    title: 'Writing practice',
    status: 'PUBLISHED',
    openAt: '2026-11-01T00:00:00Z',
    closeAt: '2026-12-01T00:00:00Z',
    maxSubmissions,
    modules: [],
  });
  renderPage(<TeacherEditAssignment />, '/teacher/assignments/:id/edit', '/teacher/assignments/12/edit');
  await screen.findByDisplayValue('Writing practice');
  return userEvent.setup();
}

async function save(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Lưu thay đổi bài tập' }));
}

function capInput() {
  return screen.getByRole('spinbutton', { name: 'Số lần nộp tối đa' });
}

it.each([null, 3])('omits the saved cap %s when only the title changes', async (maxSubmissions) => {
  const user = await openEditor(maxSubmissions);
  expect(capInput()).toHaveValue(maxSubmissions);
  fireEvent.change(screen.getByDisplayValue('Writing practice'), { target: { value: 'Updated title' } });
  await save(user);

  expect(assignmentService.updateAssignment).toHaveBeenCalledWith(12, expect.objectContaining({ title: 'Updated title' }));
  expect(vi.mocked(assignmentService.updateAssignment).mock.calls[0][1]).not.toHaveProperty('maxSubmissions');
});

it('sets cap 1 intentionally and omits it on a later title-only save', async () => {
  const user = await openEditor(null);
  await user.click(screen.getByRole('button', { name: 'Tăng số lần nộp' }));
  await save(user);
  await waitFor(() => expect(moduleService.updateModule).toHaveBeenCalled());
  expect(assignmentService.updateAssignment).toHaveBeenNthCalledWith(1, 12, expect.objectContaining({ maxSubmissions: 1 }));

  fireEvent.change(screen.getByDisplayValue('Writing practice'), { target: { value: 'Updated title' } });
  await save(user);
  expect(assignmentService.updateAssignment).toHaveBeenCalledTimes(2);
  expect(vi.mocked(assignmentService.updateAssignment).mock.calls[1][1]).not.toHaveProperty('maxSubmissions');
});

it.each(['revert', 'clear'])('preserves the saved cap on %s', async (action) => {
  const user = await openEditor(3);
  fireEvent.change(capInput(), { target: { value: '2' } });
  fireEvent.change(capInput(), { target: { value: action === 'revert' ? '3' : '' } });
  fireEvent.blur(capInput());
  expect(capInput()).toHaveValue(3);
  await save(user);

  expect(assignmentService.updateAssignment).toHaveBeenCalledTimes(1);
  expect(vi.mocked(assignmentService.updateAssignment).mock.calls[0][1]).not.toHaveProperty('maxSubmissions');
});

it('keeps sending the edited cap when retrying a failed PUT', async () => {
  vi.mocked(assignmentService.updateAssignment).mockRejectedValueOnce(new Error('Offline'));
  const user = await openEditor(3);
  fireEvent.change(capInput(), { target: { value: '2' } });
  await save(user);
  await screen.findByText('Có lỗi xảy ra khi lưu bài tập. Vui lòng thử lại!');
  await save(user);

  expect(assignmentService.updateAssignment).toHaveBeenNthCalledWith(1, 12, expect.objectContaining({ maxSubmissions: 2 }));
  expect(assignmentService.updateAssignment).toHaveBeenNthCalledWith(2, 12, expect.objectContaining({ maxSubmissions: 2 }));
});
