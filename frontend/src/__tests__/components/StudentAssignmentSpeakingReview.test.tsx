import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentAssignmentSpeaking from '../../pages/StudentAssignmentSpeaking';
import { assignmentService } from '../../api/services/assignment.service';
import { moduleService } from '../../api/services/module.service';
import { submissionService } from '../../api/services/submission.service';
import { renderPage } from './renderPage';

const { auth } = vi.hoisted(() => ({ auth: { user: { id: 5 } as { id: number } | null } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({ moduleService: { getModule: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({
  submissionService: {
    listSubmissions: vi.fn(),
    getSubmission: vi.fn(),
    startAttempt: vi.fn(),
    submitModule: vi.fn(),
    getSubmissionModuleDetail: vi.fn(),
    getAudioDownloadUrl: vi.fn(),
    uploadAudio: vi.fn(),
  },
  isSubmissionGraded: () => false,
}));

// Mock Audio recorder hook
vi.mock('../../hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    recordingDuration: 0,
    audioBlob: null,
    audioUrl: null,
    backendMimeType: 'audio/webm',
    permissionError: null,
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    resetRecording: vi.fn(),
  }),
}));

beforeEach(() => {
  auth.user = { id: 5 };
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({
    id: 12,
    title: 'Speaking practice test',
    status: 'PUBLISHED',
    modules: [{ id: 30, skill: 'SPEAKING' }],
  });
  vi.mocked(moduleService.getModule).mockResolvedValue({
    id: 30,
    skill: 'SPEAKING',
    taskType: 'RECORDING',
    instructions: 'Talk about your favorite trip.',
    orderIndex: 1,
    maxScore: 10,
  });
  vi.mocked(submissionService.listSubmissions).mockResolvedValue({
    data: [
      {
        id: 40,
        assignmentId: 12,
        studentId: 5,
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        submittedAt: null,
        modules: [
          {
            id: 50,
            moduleId: 30,
            skill: 'SPEAKING',
            taskType: 'RECORDING',
            status: 'SUBMITTED',
            grading: null,
          },
        ],
      },
    ],
    pagination: { page: 1, limit: 1, total: 1 },
  });
  vi.mocked(submissionService.getSubmission).mockResolvedValue({
    id: 40,
    studentId: 5,
    assignmentId: 12,
    status: 'IN_PROGRESS',
    submittedAt: null,
    attemptNumber: 1,
    createdAt: '2026-10-22T00:00:00Z',
    modules: [
      {
        id: 50,
        moduleId: 30,
        skill: 'SPEAKING',
        taskType: 'RECORDING',
        status: 'SUBMITTED',
        grading: null,
      },
    ],
  });
  vi.mocked(submissionService.getSubmissionModuleDetail).mockResolvedValue({
    id: 50,
    moduleId: 30,
    skill: 'SPEAKING',
    taskType: 'RECORDING',
    status: 'SUBMITTED',
    grading: null,
    questions: [],
    answers: [
      {
        id: 101,
        questionId: null,
        content: null,
        audioStorageKey: 'audio/speaking/test-audio-recording.mp3',
        audioDownloadUrl: 'https://storage.local/audio/speaking/test-audio-recording.mp3',
        audioMimeType: 'audio/mpeg',
      },
    ],
  });
  vi.mocked(submissionService.getAudioDownloadUrl).mockResolvedValue({
    submissionModuleId: 50,
    downloadUrl: 'https://storage.local/audio/speaking/test-audio-recording.mp3',
    storageKey: 'audio/speaking/test-audio-recording.mp3',
    fileName: 'test-audio-recording.mp3',
    mimeType: 'audio/mpeg',
    expiresAt: '2026-10-22T12:00:00Z',
  });
});

describe('StudentAssignmentSpeaking - Review Mode & Previous Submission Preview', () => {
  it('loads and displays previously submitted speaking audio in review mode', async () => {
    renderPage(
      <StudentAssignmentSpeaking />,
      '/student/assignments/speaking/:id',
      '/student/assignments/speaking/12?mode=review&submissionId=40&moduleId=30'
    );

    await screen.findByText('Talk about your favorite trip.');

    // Verify download URL was queried for previous audio
    await waitFor(() => {
      expect(submissionService.getAudioDownloadUrl).toHaveBeenCalledWith(50);
    });

    // Check Previous Audio Card rendered
    expect(await screen.findByText('Bài nói đã nộp trước đó')).toBeInTheDocument();
    expect(screen.getByText('Bản ghi hiện tại')).toBeInTheDocument();
    expect(screen.getAllByText('test-audio-recording.mp3')).toHaveLength(2);

    // Verify right sidebar shows existing recording and Keep & Return CTA
    expect(screen.getByText('Bản ghi trước đó (Đã lưu)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Giữ nguyên & Quay lại' })).toBeInTheDocument();
  });

  it('clicking "Giữ nguyên & Quay lại" navigates back to assignment overview', async () => {
    const user = userEvent.setup();
    renderPage(
      <StudentAssignmentSpeaking />,
      '/student/assignments/speaking/:id',
      '/student/assignments/speaking/12?mode=review&submissionId=40&moduleId=30'
    );

    const keepBtn = await screen.findByRole('button', { name: 'Giữ nguyên & Quay lại' });
    await user.click(keepBtn);

    // Submission was not re-sent, just navigate back
    expect(submissionService.submitModule).not.toHaveBeenCalled();
  });
});
