import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ApiClientError } from '../../api/core/errors';
import { answerAnnotationService, type GradingAnnotation, type GradingAnnotationListResponse } from '../../api/services/answer-annotation.service';
import { getAnnotationErrorKind, useStudentAnswerAnnotations } from '../../hooks/useStudentAnswerAnnotations';
import { deferred } from '../deferred';

vi.mock('../../api/services/answer-annotation.service', () => ({ answerAnnotationService: { listAnnotations: vi.fn() } }));

const annotation: GradingAnnotation = {
  id: 101, source: 'AI', startOffset: 0, endOffset: 5, errorType: 'GRAMMAR',
  comment: 'Accepted feedback', suggestedFix: 'Correct wording', reviewStatus: 'ACCEPTED',
};

beforeEach(() => vi.resetAllMocks());

it.each([{ data: [annotation] }, { data: [] }])('loads annotations successfully, including an empty response (%#)', async ({ data }) => {
  const response = deferred<GradingAnnotationListResponse>();
  vi.mocked(answerAnnotationService.listAnnotations).mockReturnValue(response.promise);
  const { result } = renderHook(() => useStudentAnswerAnnotations(60));
  expect(result.current).toMatchObject({ status: 'loading', annotations: [] });

  await act(async () => response.resolve({ data }));

  expect(result.current).toMatchObject({ status: 'success', annotations: data });
  expect(answerAnnotationService.listAnnotations).toHaveBeenCalledExactlyOnceWith(60);
});

it('does not request a missing answer, including after clearing a loaded answer', async () => {
  vi.mocked(answerAnnotationService.listAnnotations).mockResolvedValue({ data: [annotation] });
  const initialProps: { id: number | undefined } = { id: undefined };
  const { result, rerender } = renderHook(({ id }: { id: number | undefined }) => useStudentAnswerAnnotations(id), {
    initialProps,
  });
  expect(result.current).toMatchObject({ status: 'missingAnswerId', annotations: [] });
  expect(answerAnnotationService.listAnnotations).not.toHaveBeenCalled();

  rerender({ id: 60 });
  await waitFor(() => expect(result.current.status).toBe('success'));
  rerender({ id: undefined });
  expect(result.current).toMatchObject({ status: 'missingAnswerId', annotations: [] });
  expect(answerAnnotationService.listAnnotations).toHaveBeenCalledTimes(1);
});

it.each([
  { error: new ApiClientError('Forbidden', 403), status: 'forbidden' },
  { error: new ApiClientError('Missing', 404), status: 'notFound' },
  { error: new ApiClientError('Server error', 500), status: 'network' },
  { error: new ApiClientError('Timeout', 408), status: 'network' },
  { error: new Error('Offline'), status: 'network' },
])('classifies $error.message as $status', async ({ error, status }) => {
  vi.mocked(answerAnnotationService.listAnnotations).mockRejectedValue(error);
  const { result } = renderHook(() => useStudentAnswerAnnotations(60));
  await waitFor(() => expect(result.current.status).toBe(status));
  expect(result.current.annotations).toEqual([]);
});

it.each([
  [new ApiClientError('Forbidden', 403), 'forbidden'],
  [new ApiClientError('Missing', 404), 'notFound'],
  [new ApiClientError('Server error', 500), 'network'],
  [new Error('No HTTP status'), 'network'],
])('shares error classification with Teacher (%#)', (error, expected) => {
  expect(getAnnotationErrorKind(error)).toBe(expected);
});

it('retries the current answer after an error', async () => {
  vi.mocked(answerAnnotationService.listAnnotations)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce({ data: [annotation] });
  const { result, rerender } = renderHook(({ id }) => useStudentAnswerAnnotations(id), { initialProps: { id: 60 } });
  await waitFor(() => expect(result.current.status).toBe('network'));
  rerender({ id: 61 });
  await waitFor(() => expect(answerAnnotationService.listAnnotations).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(result.current.status).toBe('network'));

  act(() => result.current.retry());
  await waitFor(() => expect(result.current.status).toBe('success'));

  expect(result.current.annotations).toEqual([annotation]);
  expect(vi.mocked(answerAnnotationService.listAnnotations).mock.calls).toEqual([[60], [61], [61]]);
});

it('clears loaded data immediately when the answer changes', async () => {
  const next = deferred<GradingAnnotationListResponse>();
  vi.mocked(answerAnnotationService.listAnnotations)
    .mockResolvedValueOnce({ data: [annotation] })
    .mockReturnValueOnce(next.promise);
  const { result, rerender } = renderHook(({ id }) => useStudentAnswerAnnotations(id), { initialProps: { id: 60 } });
  await waitFor(() => expect(result.current.annotations).toEqual([annotation]));

  rerender({ id: 61 });
  expect(result.current).toMatchObject({ status: 'loading', annotations: [] });
  await act(async () => next.resolve({ data: [] }));
  expect(result.current).toMatchObject({ status: 'success', annotations: [] });
});

it.each([false, true])('ignores a late response from the previous answer (reject=%s)', async reject => {
  const previous = deferred<GradingAnnotationListResponse>();
  const latest = { ...annotation, id: 102, comment: 'Current answer' };
  vi.mocked(answerAnnotationService.listAnnotations)
    .mockImplementationOnce(() => previous.promise.then(response => {
      if (reject) throw new Error('Late failure');
      return response;
    }))
    .mockResolvedValueOnce({ data: [latest] });
  const { result, rerender } = renderHook(({ id }) => useStudentAnswerAnnotations(id), { initialProps: { id: 60 } });

  rerender({ id: 61 });
  await waitFor(() => expect(result.current.annotations).toEqual([latest]));
  await act(async () => previous.resolve({ data: [annotation] }));

  expect(result.current).toMatchObject({ status: 'success', annotations: [latest] });
});

it.each([false, true])('ignores completion after unmount (reject=%s)', async reject => {
  const response = deferred<GradingAnnotationListResponse>();
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const render = vi.fn();
  vi.mocked(answerAnnotationService.listAnnotations).mockImplementation(() => response.promise.then(value => {
    if (reject) throw new Error('Late failure');
    return value;
  }));
  const { unmount } = renderHook(() => {
    render();
    return useStudentAnswerAnnotations(60);
  });
  const rendersBeforeUnmount = render.mock.calls.length;

  unmount();
  await act(async () => response.resolve({ data: [annotation] }));

  expect(render).toHaveBeenCalledTimes(rendersBeforeUnmount);
  expect(consoleError).not.toHaveBeenCalled();
});
