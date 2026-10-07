import type { StudentEvaluationListParams } from '../types/student-evaluation.types';
import { clampLimit, clampPage } from './useUsers.utils';

export function buildStudentEvaluationParams(
  params: StudentEvaluationListParams = {}
): StudentEvaluationListParams & { page: number; limit: number } {
  const fromDate = params.fromDate?.trim();
  const toDate = params.toDate?.trim();

  return {
    ...(params.classId !== undefined ? { classId: params.classId } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
    page: clampPage(params.page),
    limit: clampLimit(params.limit),
  };
}
