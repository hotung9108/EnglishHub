import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../../api/core/errors';
import { submissionService, type SubmissionDetail, type SubmitModuleResponse, type SubmitResponse } from '../../api/services/submission.service';
import { useStudentQuizSubmit, type StudentQuizSubmitResult } from '../../hooks/useStudentQuizSubmit';
import type { StudentQuizSubmitScope } from '../../utils/studentQuiz.utils';
import { deferred } from '../deferred';

vi.mock('../../api/services/submission.service', () => ({ submissionService: {
  submitModule: vi.fn(), submitSubmission: vi.fn(), getSubmission: vi.fn(),
} }));
const scope: StudentQuizSubmitScope = { assignmentId: 4, submissionId: 325, moduleId: 13, submissionModuleId: 1182, expectedModuleIds: [13] };
const answers = [{ questionId: 51, content: { selectedOptionIds: [101] } }];
const moduleResponse: SubmitModuleResponse = { message: 'Saved', submissionModuleId: 1182, status: 'SUBMITTED', answers: [] };
const finalResponse: SubmitResponse = { message: 'Submitted', status: 'SUBMITTED', submittedAt: '2026-10-22T00:00:00Z' };
function progress(overrides: Record<string, unknown> = {}): SubmissionDetail {
  return { id: 325, assignmentId: 4, studentId: 41, attemptNumber: 1, createdAt: '2026-10-22T00:00:00Z', submittedAt: null,
    status: 'IN_PROGRESS', modules: [{ id: 1182, moduleId: 13, skill: 'READING', taskType: 'QUIZ', status: 'SUBMITTED', grading: null }],
    ...overrides } as SubmissionDetail;
}
async function invoke(operation: () => Promise<StudentQuizSubmitResult>) {
  let value: StudentQuizSubmitResult | undefined;
  await act(async () => { value = await operation(); });
  return value;
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(submissionService.submitModule).mockResolvedValue(moduleResponse);
  vi.mocked(submissionService.getSubmission).mockResolvedValue(progress());
  vi.mocked(submissionService.submitSubmission).mockResolvedValue(finalResponse);
});

describe('useStudentQuizSubmit', () => {
  it('awaits module POST, fresh GET and final POST in order, forwarding the same signal', async () => {
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toEqual({ kind: 'completed', submissionId: 325 });
    expect(submissionService.submitModule).toHaveBeenCalledExactlyOnceWith(1182, { answers }, { signal: expect.any(AbortSignal) });
    const signal = vi.mocked(submissionService.submitModule).mock.calls[0][2]?.signal;
    expect(submissionService.getSubmission).toHaveBeenCalledExactlyOnceWith(325, { signal });
    expect(submissionService.submitSubmission).toHaveBeenCalledExactlyOnceWith(325, { signal });
    expect(vi.mocked(submissionService.submitModule).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(submissionService.getSubmission).mock.invocationCallOrder[0]);
    expect(vi.mocked(submissionService.getSubmission).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(submissionService.submitSubmission).mock.invocationCallOrder[0]);
    expect(result.current.state.kind).toBe('completed');
  });

  it('returns the next skill from fresh server data, without finalizing', async () => {
    const expanded = { ...scope, expectedModuleIds: [13, 14] };
    vi.mocked(submissionService.getSubmission).mockResolvedValue(progress({ modules: [...progress().modules,
      { id: 1183, moduleId: 14, skill: 'LISTENING', status: 'IN_PROGRESS' }] }));
    const { result } = renderHook(() => useStudentQuizSubmit(expanded));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'nextSkill', nextModule: { id: 1183, moduleId: 14, skill: 'LISTENING' } });
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it.each(['SUBMITTED', 'GRADED'])('does not final POST when fresh parent is already %s', async status => {
    vi.mocked(submissionService.getSubmission).mockResolvedValue(progress({ status }));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'completed' });
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  const badModuleResponses: unknown[] = [undefined, null, [], 'saved', 200, {},
    { status: 'SUBMITTED' }, { status: 'SUBMITTED', submissionModuleId: 999 },
    { status: 'SUBMITTED', submissionModuleId: '1182' }, { submissionModuleId: 1182 },
    { submissionModuleId: 1182, status: 'IN_PROGRESS' }, { submissionModuleId: 1182, status: 'GRADED' }];
  it.each(badModuleResponses.map(value => [value]))('does not accept malformed module response (%#)', async value => {
    vi.mocked(submissionService.submitModule).mockResolvedValue(value as SubmitModuleResponse);
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'unconfirmed', stage: 'module', reason: 'INVALID_MODULE_RESPONSE' });
    expect(submissionService.getSubmission).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  const badProgress: unknown[] = [null, undefined, [], {}, progress({ id: 999 }), progress({ assignmentId: 999 }),
    progress({ status: 'UNKNOWN' }), progress({ modules: [] }), progress({ modules: null }),
    progress({ modules: [{ id: 999, moduleId: 13, skill: 'READING', status: 'SUBMITTED' }] }),
    progress({ modules: [{ id: 1182, moduleId: 999, skill: 'READING', status: 'SUBMITTED' }] }),
    progress({ modules: [{ id: 1182, moduleId: 13, skill: 'READING', status: 'UNKNOWN' }] })];
  it.each(badProgress.map(value => [value]))('keeps accepted module unconfirmed when fresh progress is invalid (%#)', async value => {
    vi.mocked(submissionService.getSubmission).mockResolvedValue(value as SubmissionDetail);
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'unconfirmed', stage: 'progress' });
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('does not treat a shortened module list as all modules completed', async () => {
    const { result } = renderHook(() => useStudentQuizSubmit({ ...scope, expectedModuleIds: [13, 14] }));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'unconfirmed' });
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('does not resend an accepted module when its progress GET fails', async () => {
    vi.mocked(submissionService.getSubmission).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'unconfirmed', stage: 'progress' });
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'completed' });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
  });

  it.each([0, 408, 500])('reconciles module failure %i before allowing another submit', async status => {
    vi.mocked(submissionService.submitModule).mockRejectedValueOnce(new ApiClientError('failure', status));
    vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(progress({ modules: [{ ...progress().modules[0], status: 'IN_PROGRESS' }] }));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'failed', reason: 'MODULE_REJECTED' });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'completed' });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(2);
  });

  it('recovers module response lost after commit, and does not repost the module', async () => {
    vi.mocked(submissionService.submitModule).mockRejectedValueOnce(new ApiClientError('lost response', 0));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'completed' });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(1);
  });

  it('requires a new GET before retrying an unconfirmed module write', async () => {
    vi.mocked(submissionService.submitModule).mockRejectedValueOnce(new Error('lost'));
    vi.mocked(submissionService.getSubmission).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'unconfirmed', stage: 'module' });
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'completed' });
    expect(submissionService.submitModule).toHaveBeenCalledTimes(1);
  });

  it('checks server state before resending after a malformed module response', async () => {
    vi.mocked(submissionService.submitModule).mockResolvedValueOnce(null as unknown as SubmitModuleResponse);
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect((await invoke(() => result.current.submit(answers)))?.kind).toBe('unconfirmed');
    vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(progress({ modules: [{ ...progress().modules[0], status: 'IN_PROGRESS' }] }));
    expect((await invoke(() => result.current.submit(answers)))?.kind).toBe('completed');
    expect(vi.mocked(submissionService.getSubmission).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(submissionService.submitModule).mock.invocationCallOrder[1]);
    expect(submissionService.submitModule).toHaveBeenCalledTimes(2);
  });

  it.each([0, 408, 500])('keeps final failure %i pending without changing the parent or automatic retry', async status => {
    vi.useFakeTimers();
    const input = progress();
    vi.mocked(submissionService.getSubmission).mockResolvedValue(input);
    vi.mocked(submissionService.submitSubmission).mockRejectedValueOnce(new ApiClientError('failure', status));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'pendingFinalization', submission: { status: 'IN_PROGRESS' } });
    expect(input.status).toBe('IN_PROGRESS');
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(submissionService.submitSubmission).toHaveBeenCalledTimes(1);
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['SUBMITTED', 'GRADED'])('recovers FINAL response lost after commit to %s', async status => {
    vi.mocked(submissionService.submitSubmission).mockRejectedValueOnce(new ApiClientError('lost', 0));
    vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(progress()).mockResolvedValueOnce(progress({ status }));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'completed' });
    expect(submissionService.submitSubmission).toHaveBeenCalledTimes(1);
  });

  it('does not report success if the final reconciliation GET also fails', async () => {
    vi.mocked(submissionService.submitSubmission).mockRejectedValueOnce(new Error('lost'));
    vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(progress()).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'unconfirmed', stage: 'final' });
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
  });

  it.each([null, undefined, [], 200, {}, { status: 'IN_PROGRESS' }, { status: 'GRADED' }].map(value => [value]))('contains abnormal FINAL response (%#)', async value => {
    vi.mocked(submissionService.submitSubmission).mockResolvedValue(value as SubmitResponse);
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.retryFinal())).toMatchObject({ kind: 'unconfirmed', stage: 'final' });
  });

  it('retries final repeatedly with GET first and never calls module POST', async () => {
    vi.mocked(submissionService.submitSubmission).mockRejectedValueOnce(new ApiClientError('500', 500));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.retryFinal())).toMatchObject({ kind: 'pendingFinalization' });
    expect(await invoke(() => result.current.retryFinal())).toMatchObject({ kind: 'completed' });
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(3);
    expect(vi.mocked(submissionService.getSubmission).mock.invocationCallOrder[2]).toBeLessThan(vi.mocked(submissionService.submitSubmission).mock.invocationCallOrder[1]);
  });

  it('does not final POST when some module is incomplete', async () => {
    vi.mocked(submissionService.getSubmission).mockResolvedValue(progress({ modules: [{ ...progress().modules[0], status: 'IN_PROGRESS' }] }));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.retryFinal())).toMatchObject({ kind: 'failed', reason: 'MODULES_INCOMPLETE' });
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it('does not POST if the GET before retry final fails', async () => {
    vi.mocked(submissionService.getSubmission).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect(await invoke(() => result.current.retryFinal())).toMatchObject({ kind: 'unconfirmed', stage: 'final' });
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it.each(['SUBMITTED', 'GRADED'])('retry final reads terminal parent %s without another POST', async status => {
    vi.mocked(submissionService.getSubmission).mockResolvedValue(progress({ status }));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect((await invoke(() => result.current.retryFinal()))?.kind).toBe('completed');
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.submitSubmission).not.toHaveBeenCalled();
  });

  it.each(['SUBMITTED', 'IN_PROGRESS'])('handles final 400 only by reading back parent %s', async status => {
    vi.mocked(submissionService.submitSubmission).mockRejectedValueOnce(new ApiClientError('already submitted?', 400));
    vi.mocked(submissionService.getSubmission).mockResolvedValueOnce(progress()).mockResolvedValueOnce(progress({ status }));
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    expect((await invoke(() => result.current.retryFinal()))?.kind).toBe(status === 'SUBMITTED' ? 'completed' : 'failed');
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(2);
  });

  it.each(['submit', 'retryFinal'] as const)('locks two %s calls synchronously, before awaiting or rendering', async mode => {
    const pending = deferred<SubmissionDetail>();
    if (mode === 'submit') vi.mocked(submissionService.submitModule).mockReturnValueOnce(pending.promise as unknown as Promise<SubmitModuleResponse>);
    else vi.mocked(submissionService.getSubmission).mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useStudentQuizSubmit(scope));
    const calls: Promise<StudentQuizSubmitResult>[] = [];
    act(() => {
      calls.push(mode === 'submit' ? result.current.submit(answers) : result.current.retryFinal());
      calls.push(mode === 'submit' ? result.current.submit(answers) : result.current.retryFinal());
    });
    expect(await calls[1]).toEqual({ kind: 'ignored' });
    expect(result.current.state.kind).toBe('submitting');
    expect(mode === 'submit' ? submissionService.submitModule : submissionService.getSubmission).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve(mode === 'submit' ? moduleResponse as unknown as SubmissionDetail : progress()); await calls[0]; });
    expect(result.current.state.kind).toBe('completed');
  });

  it.each(['assignmentId', 'submissionId', 'moduleId'] as const)('aborts and ignores old callbacks after changing %s', async field => {
    vi.useFakeTimers();
    const pending = deferred<SubmitModuleResponse>();
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(pending.promise);
    const { result, rerender, unmount } = renderHook(props => useStudentQuizSubmit(props), { initialProps: scope });
    const calls: Promise<StudentQuizSubmitResult>[] = [];
    act(() => { calls.push(result.current.submit(answers)); });
    const signal = vi.mocked(submissionService.submitModule).mock.calls[0][2]?.signal;
    rerender({ ...scope, [field]: scope[field] + 1 });
    expect(signal?.aborted).toBe(true);
    expect(result.current.state.kind).toBe('idle');
    await act(async () => { pending.resolve(moduleResponse); expect(await calls[0]).toEqual({ kind: 'ignored' }); });
    expect(result.current.state.kind).toBe('idle');
    expect(submissionService.getSubmission).not.toHaveBeenCalled();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['resolve', 'reject'])('does not let an A→B→A callback %s unlock the new A pipeline', async outcome => {
    const first = deferred<SubmitModuleResponse>();
    const current = deferred<SubmitModuleResponse>();
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(first.promise).mockReturnValueOnce(current.promise);
    const { result, rerender } = renderHook(props => useStudentQuizSubmit(props), { initialProps: scope });
    const calls: Promise<StudentQuizSubmitResult>[] = [];
    act(() => { calls.push(result.current.submit(answers)); });
    rerender({ ...scope, submissionId: 326 }); rerender(scope);
    expect(result.current.state.kind).toBe('idle');
    act(() => { calls.push(result.current.submit(answers)); });
    await act(async () => { first.resolve(outcome === 'resolve' ? moduleResponse : Promise.reject(new Error('old failure'))); expect(await calls[0]).toMatchObject({ kind: 'ignored' }); });
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'ignored' });
    expect(result.current.state.kind).toBe('submitting');
    expect(submissionService.submitModule).toHaveBeenCalledTimes(2);
    await act(async () => { current.resolve(moduleResponse); await calls[1]; });
    expect(result.current.state.kind).toBe('completed');
  });

  it('aborts on unmount and returns ignored even if the server commits later', async () => {
    const pending = deferred<SubmitModuleResponse>();
    vi.mocked(submissionService.submitModule).mockReturnValueOnce(pending.promise);
    const { result, unmount } = renderHook(() => useStudentQuizSubmit(scope));
    const calls: Promise<StudentQuizSubmitResult>[] = [];
    act(() => { calls.push(result.current.submit(answers)); });
    const signal = vi.mocked(submissionService.submitModule).mock.calls[0][2]?.signal;
    unmount(); expect(signal?.aborted).toBe(true);
    pending.resolve(moduleResponse);
    expect(await calls[0]).toMatchObject({ kind: 'ignored' });
    expect(submissionService.getSubmission).not.toHaveBeenCalled();
  });

  it.each(['get', 'final'])('aborts a pending %s request without a stale outcome after unmount', async stage => {
    vi.useFakeTimers();
    const pending = deferred<unknown>();
    if (stage === 'get') vi.mocked(submissionService.getSubmission).mockReturnValueOnce(pending.promise as Promise<SubmissionDetail>);
    else vi.mocked(submissionService.submitSubmission).mockReturnValueOnce(pending.promise as Promise<SubmitResponse>);
    const { result, unmount } = renderHook(() => useStudentQuizSubmit(scope));
    const calls: Promise<StudentQuizSubmitResult>[] = [];
    await act(async () => { calls.push(result.current.retryFinal()); });
    const method = stage === 'get' ? vi.mocked(submissionService.getSubmission) : vi.mocked(submissionService.submitSubmission);
    const signal = method.mock.calls[0][1]?.signal;
    unmount(); expect(signal?.aborted).toBe(true);
    pending.resolve(stage === 'get' ? progress() : Promise.reject(new Error('old final failure')));
    expect(await calls[0]).toMatchObject({ kind: 'ignored' });
    expect(submissionService.getSubmission).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not issue any request for an invalid scope', async () => {
    const { result } = renderHook(() => useStudentQuizSubmit({ ...scope, expectedModuleIds: [] }));
    expect(await invoke(() => result.current.submit(answers))).toMatchObject({ kind: 'failed', reason: 'INVALID_SCOPE' });
    expect(submissionService.submitModule).not.toHaveBeenCalled();
    expect(submissionService.getSubmission).not.toHaveBeenCalled();
  });
});
