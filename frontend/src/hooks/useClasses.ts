import { useQuery } from './core/useQuery';
import { useMutation } from './core/useMutation';
import { classService } from '@/api/services/class.service';
import type { ClassDto, CreateClassPayload } from '@/api/services/class.service';
import type { UseQueryResult, UseMutationResult } from './core/types';

export function useClasses(params?: Record<string, unknown>): UseQueryResult<ClassDto[], Record<string, unknown>> {
  return useQuery<ClassDto[], Record<string, unknown>>(
    p => classService.getAll(p),
    params
  );
}

export function useCreateClass(options?: {
  onSuccess?: (created: ClassDto) => void;
}): UseMutationResult<ClassDto, CreateClassPayload> {
  return useMutation<ClassDto, CreateClassPayload>(
    (payload: CreateClassPayload) => classService.create(payload),
    {
      onSuccess: options?.onSuccess,
    }
  );
}
