import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link } from 'react-router-dom';
import StudentAssignmentListening from '../../pages/StudentAssignmentListening';
import { ApiClientError } from '../../api/core/errors';
import { assignmentService } from '../../api/services/assignment.service';
import { moduleService } from '../../api/services/module.service';
import { questionService } from '../../api/services/question.service';
import { submissionService } from '../../api/services/submission.service';
import { renderPage } from './renderPage';
import { deferred } from '../deferred';

const { auth } = vi.hoisted(() => ({ auth: { user: { id: 5 } as { id: number } | null } }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('../../api', () => ({
  parseApiError: (error: unknown) => {
    const apiError = error as { message?: string; statusCode?: number };
    return { message: apiError.message ?? 'Request failed', statusCode: apiError.statusCode ?? 500 };
  },
}));
vi.mock('../../api/services/assignment.service', () => ({ assignmentService: { getAssignment: vi.fn() } }));
vi.mock('../../api/services/module.service', () => ({ moduleService: { getModule: vi.fn(), getAudioDownloadUrl: vi.fn() } }));
vi.mock('../../api/services/question.service', () => ({ questionService: { listQuestions: vi.fn() } }));
vi.mock('../../api/services/submission.service', () => ({ submissionService: { getSubmission: vi.fn() } }));

const AUDIO_URL_30 = 'https://storage.example/modules/30/audio.mp3?signature=first';
const AUDIO_URL_31 = 'https://storage.example/modules/31/audio.mp3?signature=second';
const INITIAL_ENTRY = '/student/assignments/listening/12?moduleId=30&submissionId=40';

function audioResponse(moduleId: number) {
  return {
    message: 'OK',
    moduleId,
    downloadUrl: moduleId === 30 ? AUDIO_URL_30 : AUDIO_URL_31,
    storageKey: `modules/${moduleId}/audio.mp3`,
    mimeType: 'audio/mpeg',
    durationSeconds: 120,
    expiresAt: '2026-11-07T12:00:00Z',
  };
}

function renderListening(entry = INITIAL_ENTRY, includeModuleLink = false) {
  const page = includeModuleLink ? (
    <>
      <Link to="/student/assignments/listening/12?moduleId=31&submissionId=40">Đổi module</Link>
      <StudentAssignmentListening />
    </>
  ) : <StudentAssignmentListening />;
  return renderPage(page, '/student/assignments/listening/:id', entry);
}

function getAudio(container: HTMLElement): HTMLAudioElement {
  const audio = container.querySelector<HTMLAudioElement>('audio');
  if (!audio) throw new Error('Không tìm thấy thẻ audio.');
  return audio;
}

function configureMedia(audio: HTMLAudioElement, initialDuration: number, initialTime = 0) {
  let duration = initialDuration;
  let currentTime = initialTime;
  Object.defineProperty(audio, 'duration', {
    configurable: true,
    get: () => duration,
  });
  Object.defineProperty(audio, 'currentTime', {
    configurable: true,
    get: () => currentTime,
    set: (value: number) => { currentTime = Number(value); },
  });
  return {
    setDuration: (value: number) => { duration = value; },
    setCurrentTime: (value: number) => { currentTime = value; },
    getCurrentTime: () => currentTime,
  };
}

beforeEach(() => {
  auth.user = { id: 5 };
  vi.mocked(assignmentService.getAssignment).mockResolvedValue({
    id: 12,
    title: 'Listening practice',
    status: 'PUBLISHED',
    modules: [
      { id: 30, skill: 'LISTENING' },
      { id: 31, skill: 'LISTENING' },
    ],
  });
  vi.mocked(moduleService.getModule).mockImplementation(async (id) => ({
    id,
    skill: 'LISTENING',
    taskType: 'QUIZ',
    instructions: `Instructions ${id}`,
    orderIndex: 1,
    maxScore: 10,
  }));
  vi.mocked(moduleService.getAudioDownloadUrl).mockImplementation(async (id) => audioResponse(id));
  vi.mocked(questionService.listQuestions).mockResolvedValue({
    questions: [{
      id: 90,
      content: 'Choose the correct answer.',
      questionType: 'MULTIPLE_CHOICE',
      options: [
        { id: 1, content: 'A' },
        { id: 2, content: 'B' },
        { id: 3, content: 'C' },
        { id: 4, content: 'D' },
      ],
      score: 1,
      orderIndex: 1,
    }],
  });
  vi.mocked(submissionService.getSubmission).mockResolvedValue({
    id: 40,
    assignmentId: 12,
    studentId: 5,
    attemptNumber: 1,
    status: 'IN_PROGRESS',
    createdAt: '2026-11-07T10:00:00Z',
    submittedAt: null,
    modules: [
      { id: 50, moduleId: 30, skill: 'LISTENING', taskType: 'QUIZ', status: 'IN_PROGRESS', grading: null },
      { id: 51, moduleId: 31, skill: 'LISTENING', taskType: 'QUIZ', status: 'IN_PROGRESS', grading: null },
    ],
  });
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  vi.spyOn(window.HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('StudentAssignmentListening audio player', () => {
  it('loads the audio URL on mount and disables controls while loading', async () => {
    const pending = deferred<Awaited<ReturnType<typeof moduleService.getAudioDownloadUrl>>>();
    vi.mocked(moduleService.getAudioDownloadUrl).mockReturnValue(pending.promise);
    const { container } = renderListening();

    await waitFor(() => expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledWith(30));
    expect(screen.getByText('Đang tải audio...')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Phát âm thanh' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tua lùi 10s' })).toBeDisabled();

    await act(async () => pending.resolve(audioResponse(30)));
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    expect(getAudio(container)).toHaveAttribute('preload', 'metadata');
  });

  it('shows a specific message for 404 without offering a retry', async () => {
    vi.mocked(moduleService.getAudioDownloadUrl).mockRejectedValueOnce(new ApiClientError('Missing', 404));
    renderListening();

    expect(await screen.findByText('Bài nghe chưa có tệp audio.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });

  it('shows a retry action for other download errors', async () => {
    vi.mocked(moduleService.getAudioDownloadUrl)
      .mockRejectedValueOnce(new ApiClientError('Unavailable', 500))
      .mockResolvedValueOnce(audioResponse(30));
    const { container } = renderListening();

    expect(await screen.findByText('Không tải được audio đề bài. Vui lòng thử lại.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledTimes(2);
  });

  it('updates real time, duration, progress, and ended state from media events', async () => {
    const { container } = renderListening();
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    const audio = getAudio(container);
    const media = configureMedia(audio, 125);

    fireEvent.loadedMetadata(audio);
    expect(screen.getByText('00:00 / 02:05')).toBeVisible();
    media.setCurrentTime(65);
    fireEvent.timeUpdate(audio);
    expect(screen.getByText('01:05 / 02:05')).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Tiến trình audio' })).toHaveValue('65');

    fireEvent.ended(audio);
    expect(screen.getByText('02:05 / 02:05')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Phát âm thanh' })).toBeEnabled();
  });

  it('plays only after a user action and pauses through the media element', async () => {
    const { container } = renderListening();
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    const audio = getAudio(container);
    configureMedia(audio, 90);
    fireEvent.loadedMetadata(audio);
    const play = vi.mocked(window.HTMLMediaElement.prototype.play);
    const pause = vi.mocked(window.HTMLMediaElement.prototype.pause);

    expect(play).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Phát âm thanh' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tạm dừng' })).toBeVisible());
    expect(play).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'Tạm dừng' }));
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Phát âm thanh' })).toBeVisible();
  });

  it('keeps the player stopped and shows an error when play rejects', async () => {
    const { container } = renderListening();
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    configureMedia(getAudio(container), 90);
    fireEvent.loadedMetadata(getAudio(container));
    vi.mocked(window.HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error('Playback blocked'));

    await userEvent.click(screen.getByRole('button', { name: 'Phát âm thanh' }));

    expect(await screen.findByText('Phát audio thất bại. Vui lòng bấm phát lại.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Phát âm thanh' })).toBeVisible();
  });

  it('seeks with the range input and clamps ten-second skips to duration bounds', async () => {
    const { container } = renderListening();
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    const audio = getAudio(container);
    const media = configureMedia(audio, 120);
    fireEvent.loadedMetadata(audio);
    const range = screen.getByRole('slider', { name: 'Tiến trình audio' });

    fireEvent.change(range, { target: { value: '30' } });
    expect(media.getCurrentTime()).toBe(30);
    media.setCurrentTime(5);
    fireEvent.timeUpdate(audio);
    await userEvent.click(screen.getByRole('button', { name: 'Tua lùi 10s' }));
    expect(media.getCurrentTime()).toBe(0);
    media.setCurrentTime(115);
    fireEvent.timeUpdate(audio);
    await userEvent.click(screen.getByRole('button', { name: 'Tua tới 10s' }));
    expect(media.getCurrentTime()).toBe(120);
  });

  it.each([0, Number.NaN, Number.POSITIVE_INFINITY])('disables seeking when duration is %s', async (duration) => {
    const { container } = renderListening();
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    const audio = getAudio(container);
    configureMedia(audio, duration);
    fireEvent.loadedMetadata(audio);

    expect(screen.getByText('00:00 / 00:00')).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Tiến trình audio' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tua lùi 10s' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tua tới 10s' })).toBeDisabled();
  });

  it('refreshes an expired URL once and restores the previous position', async () => {
    vi.mocked(moduleService.getAudioDownloadUrl)
      .mockResolvedValueOnce(audioResponse(30))
      .mockResolvedValueOnce({ ...audioResponse(30), downloadUrl: 'https://storage.example/modules/30/audio.mp3?signature=renewed' });
    const { container } = renderListening();
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    const audio = getAudio(container);
    const media = configureMedia(audio, 100, 42);
    fireEvent.loadedMetadata(audio);
    media.setCurrentTime(42);
    fireEvent.timeUpdate(audio);
    fireEvent.error(audio);

    const renewedUrl = 'https://storage.example/modules/30/audio.mp3?signature=renewed';
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', renewedUrl));
    media.setDuration(90);
    fireEvent.loadedMetadata(audio);
    expect(media.getCurrentTime()).toBe(42);
    expect(screen.getByText('00:42 / 01:30')).toBeVisible();
    expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledTimes(2);
  });

  it('shows an error when the renewed URL fails and does not refetch repeatedly', async () => {
    vi.mocked(moduleService.getAudioDownloadUrl)
      .mockResolvedValueOnce(audioResponse(30))
      .mockResolvedValueOnce({ ...audioResponse(30), downloadUrl: 'https://storage.example/modules/30/audio.mp3?signature=renewed' })
      .mockResolvedValueOnce(audioResponse(30));
    const { container } = renderListening();
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    const audio = getAudio(container);
    configureMedia(audio, 100, 20);
    fireEvent.loadedMetadata(audio);
    fireEvent.error(audio);
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', expect.stringContaining('signature=renewed')));
    fireEvent.loadedMetadata(audio);
    fireEvent.error(audio);

    expect(await screen.findByText('Không thể phát audio đề bài. Vui lòng thử lại.')).toBeVisible();
    expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    await waitFor(() => expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledTimes(3));
  });

  it('requests audio again when the module changes and resets player state', async () => {
    const { container } = renderListening(INITIAL_ENTRY, true);
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_30));
    const audio = getAudio(container);
    const media = configureMedia(audio, 100, 75);
    fireEvent.loadedMetadata(audio);
    media.setCurrentTime(75);
    fireEvent.timeUpdate(audio);

    await userEvent.click(screen.getByRole('link', { name: 'Đổi module' }));
    await waitFor(() => expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledWith(31));
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_31));
    expect(screen.getByText('Đang tải audio...')).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Tiến trình audio' })).toHaveValue('0');

    media.setDuration(60);
    media.setCurrentTime(0);
    fireEvent.loadedMetadata(audio);
    fireEvent.error(audio);
    await waitFor(() => expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledTimes(3));
  });

  it('pauses the audio element when the page unmounts', async () => {
    const view = renderListening();
    await waitFor(() => expect(view.container.querySelector('audio')).toHaveAttribute('src', AUDIO_URL_30));
    const pause = vi.mocked(window.HTMLMediaElement.prototype.pause);
    const callsBeforeUnmount = pause.mock.calls.length;

    view.unmount();

    expect(pause.mock.calls.length).toBeGreaterThan(callsBeforeUnmount);
  });

  it('ignores a late URL response from the previous module', async () => {
    const oldResponse = deferred<Awaited<ReturnType<typeof moduleService.getAudioDownloadUrl>>>();
    vi.mocked(moduleService.getAudioDownloadUrl).mockImplementation((id) => (
      id === 30 ? oldResponse.promise : Promise.resolve(audioResponse(31))
    ));
    const { container } = renderListening(INITIAL_ENTRY, true);
    await waitFor(() => expect(moduleService.getAudioDownloadUrl).toHaveBeenCalledWith(30));
    await userEvent.click(screen.getByRole('link', { name: 'Đổi module' }));
    await waitFor(() => expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_31));

    await act(async () => oldResponse.resolve(audioResponse(30)));

    expect(getAudio(container)).toHaveAttribute('src', AUDIO_URL_31);
  });
});
