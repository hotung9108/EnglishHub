import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import TeacherCreateAssignment from '../../pages/TeacherCreateAssignment';
import TeacherAssignments from '../../pages/TeacherAssignments';
import { useStudentSubmissionPolling } from '../../hooks/useStudentSubmissionPolling';
import { assignmentService } from '../../api/services/assignment.service';
import { moduleService } from '../../api/services/module.service';
import { classService } from '../../api/services/class.service';
import { submissionService, type SubmissionDetail } from '../../api/services/submission.service';
import { renderPage } from './renderPage';

vi.mock('../../api/services/class.service', () => ({
  classService: {
    list: vi.fn(),
    listMembers: vi.fn(),
  },
}));

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: {
    createAssignment: vi.fn(),
    updateAssignmentStatus: vi.fn(),
    listAssignments: vi.fn(),
    deleteAssignment: vi.fn(),
  },
}));

vi.mock('../../api/services/module.service', () => ({
  moduleService: {
    createModule: vi.fn(),
    uploadAudio: vi.fn(),
  },
}));

vi.mock('../../api/services/submission.service', () => ({
  submissionService: {
    getSubmission: vi.fn(),
    listSubmissions: vi.fn(),
  },
}));

describe('FE-108 Assignment Filters, Creation Guard & AI Refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #209: Block publishing when module creation fails', () => {
    it('halts publishing and keeps assignment in DRAFT if module creation throws', async () => {
      vi.mocked(classService.list).mockResolvedValueOnce({
        data: [{ id: 10, name: 'Class 10A', status: 'ACTIVE' }],
        pagination: { page: 1, limit: 10, total: 1 },
      });

      vi.mocked(assignmentService.createAssignment).mockResolvedValueOnce({
        id: 99,
        message: 'Assignment created successfully',
      });

      // Module creation fails!
      vi.mocked(moduleService.createModule).mockRejectedValueOnce(
        new Error('Network error creating module')
      );

      renderPage(<TeacherCreateAssignment />, '/teacher/assignments/create');

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Nhập tiêu đề bài tập mới/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText(/Nhập tiêu đề bài tập mới/i);
      fireEvent.change(titleInput, { target: { value: 'New Test Assignment' } });

      const promptTextarea = screen.getByPlaceholderText(/Nhập chủ đề đề bài/i);
      fireEvent.change(promptTextarea, { target: { value: 'Write an essay about AI and education.' } });

      // Click Publish / Assign button ("Giao bài tập")
      const publishBtn = screen.getByRole('button', { name: /Giao bài tập/i });
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(assignmentService.createAssignment).toHaveBeenCalled();
        expect(moduleService.createModule).toHaveBeenCalled();
      });

      // Crucial: updateAssignmentStatus to PUBLISHED must NEVER have been called!
      expect(assignmentService.updateAssignmentStatus).not.toHaveBeenCalled();

      // Error toast should explain that publishing was blocked and kept as draft
      await waitFor(() => {
        expect(
          screen.getByText(/Tiến trình phát hành đã bị chặn để bảo vệ dữ liệu/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Issue #369: Status filter pills in TeacherAssignments', () => {
    it('renders status filter tabs and filters list by status', async () => {
      vi.mocked(classService.list).mockResolvedValueOnce({
        data: [{ id: 10, name: 'Class 10A', status: 'ACTIVE' }],
        pagination: { page: 1, limit: 10, total: 1 },
      });

      vi.mocked(classService.listMembers).mockResolvedValueOnce([]);

      vi.mocked(assignmentService.listAssignments).mockResolvedValueOnce({
        data: [
          {
            id: 101,
            title: 'Published Homework',
            status: 'PUBLISHED',
            skills: ['WRITING'],
            closeAt: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            id: 102,
            title: 'Draft Homework',
            status: 'DRAFT',
            skills: ['SPEAKING'],
            closeAt: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            id: 103,
            title: 'Closed Homework',
            status: 'CLOSED',
            skills: ['READING'],
            closeAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
        pagination: { page: 1, limit: 10, total: 3 },
      });

      vi.mocked(submissionService.listSubmissions).mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0 },
      });

      renderPage(<TeacherAssignments />, '/teacher/assignments');

      await waitFor(() => {
        expect(screen.getByText('Published Homework')).toBeInTheDocument();
        expect(screen.getByText('Draft Homework')).toBeInTheDocument();
        expect(screen.getByText('Closed Homework')).toBeInTheDocument();
      });

      // Click "Đang mở" (Published) pill
      const publishedPills = screen.getAllByRole('button', { name: /Đang mở/i });
      fireEvent.click(publishedPills[0]);

      await waitFor(() => {
        expect(screen.getByText('Published Homework')).toBeInTheDocument();
        expect(screen.queryByText('Draft Homework')).not.toBeInTheDocument();
        expect(screen.queryByText('Closed Homework')).not.toBeInTheDocument();
      });

      // Click "Bản nháp" (Draft) pill
      const draftPills = screen.getAllByRole('button', { name: /Bản nháp/i });
      fireEvent.click(draftPills[0]);

      await waitFor(() => {
        expect(screen.getByText('Draft Homework')).toBeInTheDocument();
        expect(screen.queryByText('Published Homework')).not.toBeInTheDocument();
        expect(screen.queryByText('Closed Homework')).not.toBeInTheDocument();
      });
    });
  });

  describe('Issue #379: useStudentSubmissionPolling Hook', () => {
    it('polls submission endpoint and triggers onGraded callback when status changes to GRADED', async () => {
      vi.useFakeTimers();

      const pendingSub: SubmissionDetail = {
        id: 50,
        assignmentId: 1,
        studentId: 2,
        attemptNumber: 1,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        modules: [
          {
            id: 501,
            moduleId: 11,
            skill: 'WRITING',
            taskType: 'ESSAY',
            status: 'SUBMITTED',
            grading: null,
          },
        ],
      };

      const gradedSub: SubmissionDetail = {
        ...pendingSub,
        status: 'GRADED',
        modules: [
          {
            ...pendingSub.modules[0],
            status: 'GRADED',
            grading: {
              id: 999,
              method: 'AUTO',
              status: 'AI_GRADED',
              finalScore: 8.5,
              maxScoreSnapshot: 10,
              aiFeedback: 'Well written!',
              finalFeedback: null,
            },
          },
        ],
      };

      // 1st poll returns still pending
      vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(pendingSub);
      // 2nd poll returns graded
      vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(gradedSub);

      const onGradedMock = vi.fn();

      const { result } = renderHook(() =>
        useStudentSubmissionPolling({
          submissionId: 50,
          isGraded: false,
          intervalMs: 1000,
          timeoutMs: 10000,
          onGraded: onGradedMock,
        })
      );

      expect(result.current.isPolling).toBe(true);

      // Advance 1s for first poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(submissionService.getSubmission).toHaveBeenCalledTimes(1);
      expect(onGradedMock).not.toHaveBeenCalled();

      // Advance 1s for second poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
      expect(onGradedMock).toHaveBeenCalledWith(gradedSub);

      vi.useRealTimers();
    });

    it('completes polling and triggers callback when AI grading transitions to FAILED status', async () => {
      vi.useFakeTimers();

      const pendingSub: SubmissionDetail = {
        id: 51,
        assignmentId: 1,
        studentId: 2,
        attemptNumber: 1,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        modules: [
          {
            id: 502,
            moduleId: 12,
            skill: 'SPEAKING',
            taskType: 'RECORDING',
            status: 'SUBMITTED',
            grading: null,
          },
        ],
      };

      const failedSub: SubmissionDetail = {
        ...pendingSub,
        modules: [
          {
            ...pendingSub.modules[0],
            grading: {
              id: 1001,
              method: 'AUTO',
              status: 'FAILED',
              finalScore: null,
              maxScoreSnapshot: 10,
              aiFeedback: null,
              finalFeedback: null,
            },
          },
        ],
      };

      vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(failedSub);

      const onGradedMock = vi.fn();

      const { result } = renderHook(() =>
        useStudentSubmissionPolling({
          submissionId: 51,
          isGraded: false,
          intervalMs: 1000,
          timeoutMs: 10000,
          onGraded: onGradedMock,
        })
      );

      expect(result.current.isPolling).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      expect(submissionService.getSubmission).toHaveBeenCalledTimes(1);
      expect(onGradedMock).toHaveBeenCalledWith(failedSub);

      vi.useRealTimers();
    });
  });
});
