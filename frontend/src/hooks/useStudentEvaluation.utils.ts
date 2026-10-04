import type { StudentEvaluationListParams } from '../api/services/student-evaluation.service';
import { clampLimit, clampPage } from './useUsers.utils';

export function buildStudentEvaluationParams(
  params: StudentEvaluationListParams = {}
): StudentEvaluationListParams & { page: number; limit: number } {
  return {
    ...(params.classId !== undefined ? { classId: params.classId } : {}),
    page: clampPage(params.page),
    limit: clampLimit(params.limit),
  };
}
