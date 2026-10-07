import type { StudentEvaluationListParams } from '../types/student-evaluation.types';
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
