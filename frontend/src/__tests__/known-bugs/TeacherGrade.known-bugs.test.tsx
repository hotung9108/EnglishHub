import { beforeEach, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeacherSubmissionDetails from '../../pages/TeacherSubmissionDetails';
import { assignmentService } from '../../api/services/assignment.service';
import { submissionService } from '../../api/services/submission.service';
import { gradingService } from '../../api/services/grading.service';
import { classService } from '../../api/services/class.service';
import { renderPage } from '../components/renderPage';

vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: { listSubmissions: vi.fn(), getSubmission: vi.fn(), getSubmissionModuleDetail: vi.fn() } }));
vi.mock('../../api/services/grading.service', () => ({ gradingService: { getBySubmissionModuleId: vi.fn(), getById: vi.fn(), getAiSuggestion: vi.fn(), submitGrade: vi.fn() } }));
vi.mock('../../api/services/class.service', () => ({ classService: { list: vi.fn() } }));

beforeEach(() => {
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({ id: 12, title: 'Writing', status: 'PUBLISHED', modules: [] });
  vi.mocked(classService.list).mockResolvedValue({ data: [], pagination: { page: 1, limit: 100, total: 0 } });
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({ data: [{ id: 40, assignmentId: 12, studentId: 5, attemptNumber: 1, status: 'SUBMITTED', submittedAt: null, modules: [] }], pagination: { page: 1, limit: 100, total: 1 } });
  vi.mocked(submissionService.getSubmission).mockResolvedValue({ id: 40, studentId: 5, assignmentId: 12, attemptNumber: 1, status: 'SUBMITTED', submittedAt: null, createdAt: '2026-10-22T00:00:00Z', modules: [{ id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'SUBMITTED', grading: null }] });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({ id: 50, moduleId: 30, skill: 'WRITING', taskType: 'ESSAY', status: 'SUBMITTED', grading: null, questions: [], answers: [] });
  vi.mocked(gradingService.getBySubmissionModuleId).mockResolvedValue({ id: 80, method: 'TEACHER_MANUAL', status: 'PENDING', finalScore: 7 });
  vi.mocked(gradingService.getAiSuggestion).mockRejectedValue(new Error('No AI suggestion'));
  vi.mocked(gradingService.getById).mockRejectedValue(new Error('Optional detail unavailable'));
  vi.mocked(gradingService.submitGrade).mockResolvedValue({ message: 'Saved' });
});

async function setup() {
  renderPage(<TeacherSubmissionDetails />, '/teacher/assignments/:id/submissions/:studentId', '/teacher/assignments/12/submissions/5');
  return { user: userEvent.setup(), score: await screen.findByRole('spinbutton') };
}

it('BUG-QA32-GRADE: saving a draft must not call the endpoint that completes grading', async () => {
  const { user } = await setup();
  await user.click(screen.getByRole('button', { name: 'Lưu bản nháp nhận xét' }));
  // Backend updateFinalGrade -> withTeacherGrade sets COMPLETED. There is no
  // draft flag in UpdateFinalGradeRequest; do not invent one in the assertion.
  expect(gradingService.submitGrade).not.toHaveBeenCalled();
});
