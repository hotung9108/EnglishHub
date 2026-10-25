import { beforeEach, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentAssignmentWriting from '../../pages/StudentAssignmentWriting';
import { assignmentService } from '../../api/services/assignment.service';
import { moduleService } from '../../api/services/module.service';
import { submissionService, type SubmissionDetail } from '../../api/services/submission.service';
import { renderPage } from '../components/renderPage';

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 5 } }) }));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({ moduleService: { getModule: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: {
  getSubmission: vi.fn(), submitModule: vi.fn(), submitSubmission: vi.fn(),
  getSubmissionModuleDetail: vi.fn(), getDocumentUploadUrl: vi.fn(),
} }));

const submission: SubmissionDetail = {
  id: 40, assignmentId: 12, studentId: 5, attemptNumber: 1,
  status: 'IN_PROGRESS', submittedAt: null, createdAt: '2026-10-22T00:00:00Z',
  modules: [{ id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'IN_PROGRESS', grading: null }],
};

beforeEach(() => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Writing', status: 'PUBLISHED', modules: [{ id: 30, skill: 'WRITING' }] });
  vi.mocked(moduleService.getModule).mockResolvedValue({ id: 30, instructions: 'Write an essay.', skill: 'WRITING', taskType: 'ESSAY', orderIndex: 1, maxScore: 10 });
  vi.mocked(submissionService.getSubmission).mockResolvedValue(submission);
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
    id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'IN_PROGRESS', grading: null, answers: [],
    questions: [{ id: 91, content: 'Write an essay.', questionType: 'SHORT_ANSWER', score: 10, orderIndex: 1 }],
  });
  vi.mocked(submissionService.submitModule).mockResolvedValue({ message: 'Saved', submissionModuleId: 50, status: 'SUBMITTED', answers: [] });
  vi.mocked(submissionService.submitSubmission).mockResolvedValue({ message: 'Submitted', status: 'SUBMITTED', submittedAt: '2026-10-22T00:00:00Z' });
});

async function setup() {
  const result = renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/12?submissionId=40');
  await screen.findByText('Write an essay.');
  await waitFor(() => expect(submissionService.getSubmission).toHaveBeenCalledWith(40));
  return { ...result, user: userEvent.setup() };
}

it('BUG-QA32-WRITING: preserves draft and does not finalize when saving answers fails', async () => {
  vi.mocked(submissionService.submitModule).mockRejectedValue(new Error('Save failed'));
  localStorage.setItem('eh_draft_writing_12', 'Unsaved essay');
  const { user } = await setup();
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  await waitFor(() => {
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(localStorage.getItem('eh_draft_writing_12')).toBe('Unsaved essay');
    expect(screen.queryByText(/Nộp bài thành công!/)).not.toBeInTheDocument();
    // A positive terminal-state assertion prevents an early false pass while
    // an asynchronous submit is still pending.
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  });
});

it('BUG-QA32-WRITING: preserves draft and reports failure when finalization fails', async () => {
  vi.mocked(submissionService.submitSubmission).mockRejectedValue(new Error('Finalize failed'));
  localStorage.setItem('eh_draft_writing_12', 'Unsaved essay');
  const { user } = await setup();
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  await waitFor(() => {
    expect(localStorage.getItem('eh_draft_writing_12')).toBe('Unsaved essay');
    expect(screen.queryByText(/Nộp bài thành công!/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  });
});

it('BUG-QA32-WRITING: must not report success without a submission attempt', async () => {
  vi.mocked(submissionService.getSubmission).mockRejectedValue(new Error('Missing attempt'));
  const { user } = await setup();
  await user.type(screen.getByRole('textbox'), 'Essay');
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  await waitFor(() => {
    expect(screen.queryByText(/Nộp bài thành công!/)).not.toBeInTheDocument();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  });
});


it('BUG-QA32-WRITING: resolves the actual question ID instead of assuming question 1', async () => {
  const { user } = await setup();
  await user.type(screen.getByRole('textbox'), 'Essay for question 91');
  await user.click(screen.getByRole('button', { name: /Nộp bài \(Submit/ }));
  await waitFor(() => expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(50, {
    answers: [{ questionId: 91, content: { text: 'Essay for question 91' } }],
  }));
});

it('BUG-QA32-ROUTE: invalid assignment IDs must not silently load assignment 1', async () => {
  await act(async () => {
    renderPage(<StudentAssignmentWriting />, '/student/writing/:id', '/student/writing/invalid?submissionId=40');
  });
  expect(assignmentService.getAssignment).not.toHaveBeenCalled();
});
