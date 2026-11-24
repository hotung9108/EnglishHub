import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { assignmentService } from '../../api/services/assignment.service';
import { useUpdateAssignmentStatus } from '../../hooks/useAssignments';

vi.mock('../../api/services/assignment.service', () => ({
  assignmentService: { updateAssignmentStatus: vi.fn() },
}));

it('preserves the legacy id/status call, result and onSuccess callback', async () => {
  const response = { message: 'Closed' };
  const variables = { id: 42, status: 'CLOSED' } as const;
  const onSuccess = vi.fn();
  vi.mocked(assignmentService.updateAssignmentStatus).mockResolvedValue(response);
  const { result } = renderHook(() => useUpdateAssignmentStatus({ onSuccess }));

  await act(async () => {
    await expect(result.current.mutateAsync(variables)).resolves.toEqual(response);
  });

  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'CLOSED');
  expect(onSuccess).toHaveBeenCalledExactlyOnceWith(response, variables);
  expect(result.current).toMatchObject({ data: response, isSuccess: true });
});

it.each([
  { name: 'the stored deadline', reopen: {} },
  { name: 'a new deadline', reopen: { closeAt: '2026-11-25T16:59:59+00:00' } },
])('forwards reopen options for $name', async ({ reopen }) => {
  vi.mocked(assignmentService.updateAssignmentStatus).mockResolvedValue({ message: 'Published' });
  const { result } = renderHook(() => useUpdateAssignmentStatus());

  await act(async () => {
    await result.current.mutateAsync({ id: 42, status: 'PUBLISHED', reopen });
  });

  expect(assignmentService.updateAssignmentStatus).toHaveBeenCalledExactlyOnceWith(42, 'PUBLISHED', { reopen });
});
