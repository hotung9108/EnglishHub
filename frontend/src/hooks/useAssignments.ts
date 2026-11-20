import { useQuery } from './core/useQuery';
import { useMutation } from './core/useMutation';
import { assignmentService } from '@/api/services/assignment.service';
import type {
  AssignmentDetail,
  AssignmentListParams,
  AssignmentListResponse,
  AssignmentStatus,
  CreateAssignmentPayload,
  CreatedAssignmentResponse,
  MessageResponse,
  UpdateAssignmentPayload,
  AssignmentId,
} from '@/api/services/assignment.service';
import type { UseQueryResult, UseMutationResult } from './core/types';

export function useAssignments(
  classId: number,
  params?: AssignmentListParams,
  options?: {
    enabled?: boolean;
    immediate?: boolean;
    onSuccess?: (data: AssignmentListResponse) => void;
  }
): UseQueryResult<AssignmentListResponse, AssignmentListParams> {
  const enabled = (options?.enabled ?? true) && classId > 0;
  return useQuery<AssignmentListResponse, AssignmentListParams>(
    (p) => assignmentService.listAssignments(classId, p ?? {}),
    params,
    {
      enabled,
      immediate: options?.immediate ?? true,
      onSuccess: options?.onSuccess,
    }
  );
}

export function useAssignment(
  assignmentId: AssignmentId,
  options?: {
    enabled?: boolean;
    immediate?: boolean;
    onSuccess?: (data: AssignmentDetail) => void;
  }
): UseQueryResult<AssignmentDetail, void> {
  const enabled = (options?.enabled ?? true) && assignmentId > 0;
  return useQuery<AssignmentDetail, void>(
    () => assignmentService.getAssignment(assignmentId),
    undefined,
    {
      enabled,
      immediate: options?.immediate ?? true,
      onSuccess: options?.onSuccess,
    }
  );
}

export interface UseCreateAssignmentOptions {
  onSuccess?: (data: CreatedAssignmentResponse, variables: { classId: number; payload: CreateAssignmentPayload }) => void;
}

export function useCreateAssignment(
  options?: UseCreateAssignmentOptions
): UseMutationResult<CreatedAssignmentResponse, { classId: number; payload: CreateAssignmentPayload }> {
  return useMutation<CreatedAssignmentResponse, { classId: number; payload: CreateAssignmentPayload }>(
    ({ classId, payload }) => assignmentService.createAssignment(classId, payload),
    {
      onSuccess: options?.onSuccess,
    }
  );
}

export interface UseUpdateAssignmentOptions {
  onSuccess?: (data: MessageResponse, variables: { id: AssignmentId; payload: UpdateAssignmentPayload }) => void;
}

export function useUpdateAssignment(
  options?: UseUpdateAssignmentOptions
): UseMutationResult<MessageResponse, { id: AssignmentId; payload: UpdateAssignmentPayload }> {
  return useMutation<MessageResponse, { id: AssignmentId; payload: UpdateAssignmentPayload }>(
    ({ id, payload }) => assignmentService.updateAssignment(id, payload),
    {
      onSuccess: options?.onSuccess,
    }
  );
}

export interface UseDeleteAssignmentOptions {
  onSuccess?: (data: MessageResponse, variables: AssignmentId) => void;
}

export function useDeleteAssignment(
  options?: UseDeleteAssignmentOptions
): UseMutationResult<MessageResponse, AssignmentId> {
  return useMutation<MessageResponse, AssignmentId>(
    (id) => assignmentService.deleteAssignment(id),
    {
      onSuccess: options?.onSuccess,
    }
  );
}

type UpdateAssignmentStatusVariables =
  | { id: AssignmentId; status: AssignmentStatus; reopen?: never }
  | { id: AssignmentId; status: 'PUBLISHED'; reopen: { closeAt?: string } };

export interface UseUpdateAssignmentStatusOptions {
  onSuccess?: (data: MessageResponse, variables: UpdateAssignmentStatusVariables) => void;
}

export function useUpdateAssignmentStatus(
  options?: UseUpdateAssignmentStatusOptions
): UseMutationResult<MessageResponse, UpdateAssignmentStatusVariables> {
  return useMutation<MessageResponse, UpdateAssignmentStatusVariables>(
    ({ id, status, reopen }) => reopen === undefined
      ? assignmentService.updateAssignmentStatus(id, status)
      : assignmentService.updateAssignmentStatus(id, status, { reopen }),
    {
      onSuccess: options?.onSuccess,
    }
  );
}
