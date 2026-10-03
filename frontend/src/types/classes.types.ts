import type { ApiClientError } from '@/api/core/errors';
import type {
  AddedClassMemberResponse,
  ClassId,
  ClassStatus,
  ClassSummary,
  CreatedClassResponse,
  UpdateClassPayload,
} from '@/api/services/class.service';
import type { MessageResponse } from '@/api/services/user.service';
import type { PaginationMeta } from '@/types/api.types';

export interface UseClassesOptions {
  initialPage?: number;
  initialLimit?: number;
  initialStatus?: ClassStatus;
  enabled?: boolean;
}

export interface ClassesQuery {
  page: number;
  limit: number;
  status: ClassStatus | undefined;
}

export interface ClassListState {
  classes: ClassSummary[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiClientError | null;
}

export interface ClassFilters {
  status: ClassStatus | undefined;
}

export interface UseClassesResult {
  classes: ClassSummary[];
  pagination: PaginationMeta;
  filters: ClassFilters;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: ApiClientError | null;
  isEmpty: boolean;
  setStatus: (status: ClassStatus | undefined) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => Promise<ClassSummary[] | null>;
}

export interface UseClassQueryOptions {
  enabled?: boolean;
}

export interface CreateClassCallbacks {
  onSuccess?: (created: CreatedClassResponse) => void;
}

export interface UpdateClassVariables {
  id: ClassId;
  payload: UpdateClassPayload;
}

export interface UpdateClassCallbacks {
  onSuccess?: (result: MessageResponse) => void;
}

export interface DeleteClassCallbacks {
  onSuccess?: (result: MessageResponse) => void;
}

export interface AddClassMemberVariables {
  classId: ClassId;
  studentId: number;
}

export interface AddClassMemberCallbacks {
  onSuccess?: (result: AddedClassMemberResponse) => void;
}

export interface RemoveClassMemberVariables {
  classId: ClassId;
  memberId: number;
}

export interface RemoveClassMemberCallbacks {
  onSuccess?: (result: MessageResponse) => void;
}