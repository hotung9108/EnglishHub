import { beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeacherCreateAssignment from '../../pages/TeacherCreateAssignment';
import { classService } from '../../api/services/class.service';
import { assignmentService } from '../../api/services/assignment.service';
import { moduleService } from '../../api/services/module.service';
import { questionService } from '../../api/services/question.service';
import { renderPage } from './renderPage';

vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn() } }));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { createAssignment: vi.fn(), updateAssignmentStatus: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({ moduleService: { createModule: vi.fn(), uploadAudio: vi.fn() } }));
vi.mock('../../api/services/question.service', async (original) => ({
  ...await original<typeof import('../../api/services/question.service')>(),
  questionService: { createQuestion: vi.fn() },
}));
beforeEach(() => {
  vi.mocked(classService.list).mockResolvedValue({ data: [{ id: 12, name: 'IELTS A', status: 'ACTIVE' }, { id: 13, name: 'IELTS B', status: 'ACTIVE' }], pagination: { page: 1, limit: 100, total: 2 } });
  vi.mocked(assignmentService.createAssignment).mockResolvedValue({ id: 42, message: 'Created' });
  vi.mocked(moduleService.createModule).mockResolvedValue({ id: 70, message: 'Created' });
  vi.mocked(assignmentService.updateAssignmentStatus).mockResolvedValue({ message: 'Published' });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:audio');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
async function setup(skill = 'writing', language: 'vi' | 'en' = 'vi') {
  const result = renderPage(<TeacherCreateAssignment />, '/teacher/create', '/teacher/create?type=' + skill, undefined, language);
  await screen.findByRole('option', { name: /IELTS A/ });
  fireEvent.change(screen.getByPlaceholderText(language === 'vi' ? 'Nhập tiêu đề bài tập mới...' : 'Enter new assignment title...'), { target: { value: 'Weekly practice' } });
  return { ...result, user: userEvent.setup() };
}
function fillPrompt(container: HTMLElement, value = 'Discuss public transport.') {
  fireEvent.change(container.querySelector('textarea')!, { target: { value } });
}
function uploadAudio(container: HTMLElement) {
  const file = new File(['audio'], 'lesson.mp3', { type: 'audio/mpeg' });
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  return file;
}
async function reading(container: HTMLElement) {
  fireEvent.change(screen.getByPlaceholderText(/THE EVOLUTION OF RENEWABLE ENERGY/), { target: { value: 'Energy' } });
  fillPrompt(container, 'Solar power is renewable.');
}
it.each(['vi', 'en'] as const)('validates missing title and writing prompt (%s)', async language => {
  const { user } = await setup('writing', language);
  const title = screen.getByDisplayValue('Weekly practice');
  fireEvent.change(title, { target: { value: '  ' } });
  await user.click(screen.getByRole('button', { name: language === 'vi' ? 'Giao bài tập' : 'Create & Publish' }));
  expect(screen.getByText(language === 'vi' ? 'Tiêu đề bài tập không được để trống!' : 'Title cannot be empty!')).toBeVisible();
  fireEvent.change(title, { target: { value: 'Practice' } });
  await user.click(screen.getByRole('button', { name: language === 'vi' ? 'Giao bài tập' : 'Create & Publish' }));
  expect(screen.getByText(language === 'vi' ? 'Nội dung đề bài Writing không được để trống!' : 'Writing prompt cannot be empty!')).toBeVisible();
  expect(assignmentService.createAssignment).not.toHaveBeenCalled();
});
it.each(['vi', 'en'] as const)('requires a class when class loading fails (%s)', async language => {
  vi.mocked(classService.list).mockRejectedValue(new Error('Offline'));
  renderPage(<TeacherCreateAssignment />, '/teacher/create', '/teacher/create', undefined, language);
  await userEvent.click(screen.getByRole('button', { name: language === 'vi' ? 'Giao bài tập' : 'Create & Publish' }));
  expect(screen.getByText(language === 'vi' ? 'Vui lòng chọn lớp học trước khi tạo đề!' : 'Please select a class!')).toBeVisible();
  expect(assignmentService.createAssignment).not.toHaveBeenCalled();
});
it.each(['vi', 'en'] as const)('publishes writing with exact payload and local schedule (%s)', async language => {
  const { container, user } = await setup('invalid', language);
  fillPrompt(container);
  const dates = container.querySelectorAll('input[type="datetime-local"]');
  fireEvent.change(dates[0], { target: { value: '2026-11-01T09:00' } });
  fireEvent.change(dates[1], { target: { value: '2026-11-08T09:00' } });
  await user.selectOptions(screen.getByRole('combobox'), '13');
  fireEvent.change(container.querySelectorAll('input[type="number"]')[1], { target: { value: '4' } });
  await user.click(screen.getByRole('button', { name: language === 'vi' ? 'Giao bài tập' : 'Create & Publish' }));
  await waitFor(() => expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED'));
  expect(assignmentService.createAssignment).toHaveBeenCalledExactlyOnceWith(13, {
    title: 'Weekly practice', description: 'Discuss public transport.', maxSubmissions: 4,
    openAt: '2026-11-01T02:00:00.000Z', closeAt: '2026-11-08T02:00:00.000Z',
  });
  expect(moduleService.createModule).toHaveBeenCalledExactlyOnceWith(42, {
    skill: 'WRITING', taskType: 'ESSAY', orderIndex: 1, instructions: 'Discuss public transport.', maxScore: 10, aiInstruction: undefined,
  });
  expect(await screen.findByText(language === 'vi' ? 'Giao bài tập mới thành công!' : 'Assignment published successfully!')).toBeVisible();
});
it.each(['vi', 'en'] as const)('saves a speaking draft without publishing (%s)', async language => {
  const { container, user } = await setup('speaking', language);
  await user.click(screen.getByRole('button', { name: language === 'vi' ? 'Lưu bản nháp' : 'Save Draft' }));
  expect(screen.getByText(language === 'vi' ? 'Nội dung đề bài Speaking không được để trống!' : 'Speaking prompt cannot be empty!')).toBeVisible();
  fillPrompt(container, 'Describe a journey.');
  fireEvent.change(container.querySelectorAll('textarea')[1], { target: { value: 'Assess fluency.' } });
  for (const input of container.querySelectorAll('input[type="datetime-local"]')) fireEvent.change(input, { target: { value: '' } });
  await user.click(screen.getByRole('button', { name: language === 'vi' ? 'Lưu bản nháp' : 'Save Draft' }));
  await screen.findByText(language === 'vi' ? 'Đã lưu bản nháp bài tập mới!' : 'Assignment draft saved!');
  expect(moduleService.createModule).toHaveBeenCalledExactlyOnceWith(42, {
    skill: 'SPEAKING', taskType: 'RECORDING', orderIndex: 1, instructions: 'Describe a journey.', maxScore: 10, aiInstruction: 'Assess fluency.',
  });
  expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();
});
it.each(['reading', 'listening'])('persists actual MCQ and short-answer questions (%s)', async skill => {
  const { container, user } = await setup(skill);
  let file: File | undefined;
  if (skill === 'reading') await reading(container);
  else { file = uploadAudio(container); fillPrompt(container, 'Listen carefully.'); }
  await user.click(screen.getByRole('button', { name: 'Trắc nghiệm' }));
  const prompt = screen.getByPlaceholderText(skill === 'reading' ? 'Nhập nội dung câu hỏi...' : 'Nhập nội dung câu hỏi hoặc câu có chỗ trống [ _____ ]...');
  fireEvent.change(prompt, { target: { value: 'Choose renewable energy.' } });
  const radios = screen.getAllByRole('radio');
  await user.click(radios[2]);
  expect(radios[2]).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'Điền từ / Ngắn' }));
  fireEvent.change(screen.getAllByPlaceholderText(skill === 'reading' ? 'Nhập nội dung câu hỏi...' : 'Nhập nội dung câu hỏi hoặc câu có chỗ trống [ _____ ]...')[1], { target: { value: 'Name the energy.' } });
  fireEvent.change(screen.getByPlaceholderText(skill === 'reading' ? 'Ví dụ: renewable energy' : 'Ví dụ: Central Park'), { target: { value: 'solar' } });
  await user.click(screen.getByRole('button', { name: 'Giao bài tập' }));
  await waitFor(() => expect(questionService.createQuestion).toHaveBeenCalledTimes(2));
  expect(questionService.createQuestion).toHaveBeenNthCalledWith(1, 70, {
    content: 'Choose renewable energy.', questionType: 'MULTIPLE_CHOICE', score: 1, orderIndex: 1,
    correctAnswer: { options: ['A', 'B', 'C', 'D'].map((letter, index) => ({ id: index + 1, content: 'Lựa chọn ' + letter, isCorrect: index === 2 })) },
  });
  expect(questionService.createQuestion).toHaveBeenNthCalledWith(2, 70, {
    content: 'Name the energy.', questionType: 'SHORT_ANSWER', score: 1, orderIndex: 2, correctAnswer: { correctAnswer: 'solar' },
  });
  expect(moduleService.createModule).toHaveBeenCalledExactlyOnceWith(42, {
    skill: skill.toUpperCase(), taskType: 'QUIZ', orderIndex: 1, maxScore: 10, aiInstruction: undefined,
    instructions: skill === 'reading' ? 'Energy\n\nSolar power is renewable.' : 'Listen carefully.',
  });
  if (file) expect(moduleService.uploadAudio).toHaveBeenCalledExactlyOnceWith(70, file);
});
it.each(['vi', 'en'] as const)('validates reading content, questions and answer keys (%s)', async language => {
  const { container, user } = await setup('reading', language);
  const publish = () => user.click(screen.getByRole('button', { name: language === 'vi' ? 'Giao bài tập' : 'Create & Publish' }));
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Tiêu đề bài đọc không được để trống!' : 'Passage title cannot be empty!')).toBeVisible();
  fireEvent.change(screen.getByPlaceholderText(/THE EVOLUTION OF RENEWABLE ENERGY/), { target: { value: 'Energy' } });
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Nội dung văn bản bài đọc không được để trống!' : 'Passage content cannot be empty!')).toBeVisible();
  fillPrompt(container);
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Vui lòng tạo ít nhất 1 câu hỏi cho bài đọc!' : 'Please add at least 1 question for the reading assignment!')).toBeVisible();
  await user.click(screen.getByRole('button', { name: language === 'vi' ? 'Điền từ / Ngắn' : 'Short Answer' }));
  const question = screen.getByPlaceholderText(language === 'vi' ? 'Nhập nội dung câu hỏi...' : 'Enter question statement...');
  fireEvent.change(question, { target: { value: ' ' } });
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Nội dung câu hỏi Reading #1 không được để trống!' : 'Reading question #1 statement cannot be empty!')).toBeVisible();
  fireEvent.change(question, { target: { value: 'Question' } });
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Đáp án chính xác cho câu hỏi Reading #1 không được để trống!' : 'Correct answer for reading question #1 cannot be empty!')).toBeVisible();
  expect(assignmentService.createAssignment).not.toHaveBeenCalled();
});
it.each(['vi', 'en'] as const)('validates listening audio, questions and answer keys (%s)', async language => {
  const { container, user } = await setup('listening', language);
  const publish = () => user.click(screen.getByRole('button', { name: language === 'vi' ? 'Giao bài tập' : 'Create & Publish' }));
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Vui lòng chọn tệp âm thanh cho bài nghe!' : 'Please select an audio file for the listening assignment!')).toBeVisible();
  uploadAudio(container);
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Vui lòng tạo ít nhất 1 câu hỏi cho bài nghe!' : 'Please add at least 1 question for the listening assignment!')).toBeVisible();
  await user.click(screen.getByRole('button', { name: language === 'vi' ? 'Điền từ / Ngắn' : 'Short Answer' }));
  const question = screen.getByPlaceholderText(language === 'vi' ? 'Nhập nội dung câu hỏi hoặc câu có chỗ trống [ _____ ]...' : 'Enter question text or sentence with blank [ _____ ]...');
  fireEvent.change(question, { target: { value: '' } });
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Nội dung câu hỏi Listening #1 không được để trống!' : 'Listening question #1 statement cannot be empty!')).toBeVisible();
  fireEvent.change(question, { target: { value: 'Question' } });
  await publish();
  expect(screen.getByText(language === 'vi' ? 'Đáp án chính xác cho câu hỏi Listening #1 không được để trống!' : 'Correct answer for listening question #1 cannot be empty!')).toBeVisible();
  expect(assignmentService.createAssignment).not.toHaveBeenCalled();
});
it.each(['vi', 'en'] as const)('reports creation errors and enables retry (%s)', async language => {
  const { container, user } = await setup('writing', language);
  fillPrompt(container);
  vi.mocked(assignmentService.createAssignment).mockRejectedValueOnce(new Error('Offline'));
  const button = screen.getByRole('button', { name: language === 'vi' ? 'Giao bài tập' : 'Create & Publish' });
  await user.click(button);
  expect(await screen.findByText(language === 'vi' ? 'Có lỗi xảy ra khi tạo bài tập. Vui lòng thử lại!' : 'Failed to create assignment. Please try again!')).toBeVisible();
  expect(button).toBeEnabled();
  await user.click(button);
  await waitFor(() => expect(assignmentService.updateAssignmentStatus).toHaveBeenCalled());
});
it('previews entered writing, closes preview and cancels', async () => {
  const { container, user } = await setup();
  fillPrompt(container, 'Discuss climate change.');
  await user.click(screen.getByRole('button', { name: 'Xem thử giao diện học viên' }));
  expect(screen.getByText('Discuss climate change.', { selector: 'p' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Đóng xem thử' }));
  await user.click(screen.getByRole('button', { name: 'Hủy bỏ' }));
  expect(screen.getByTestId('location')).toHaveTextContent('/teacher/assignments');
});
