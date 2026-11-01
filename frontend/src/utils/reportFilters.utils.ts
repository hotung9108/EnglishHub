import type { ReportClassSummary } from '../types/report.types';
import type { ClassSummary } from '../api/services/class.service';

/**
 * Filters the list of report classes by the selected class ID.
 * If no class is selected (undefined), returns the complete report classes array.
 */
export function filterReportClasses(
  reportClasses: ReportClassSummary[],
  selectedClassId?: number
): ReportClassSummary[] {
  if (selectedClassId === undefined) {
    return reportClasses;
  }
  return reportClasses.filter((cls) => cls.classId === selectedClassId);
}

/**
 * Filters available class cohort options for the filter dropdown based on the selected instructor.
 * If no instructor is selected (undefined), returns all classes.
 */
export function filterAvailableClasses(
  allClasses: ClassSummary[],
  selectedTeacherId?: number
): ClassSummary[] {
  if (selectedTeacherId === undefined) {
    return allClasses;
  }
  return allClasses.filter((c) => c.teacherId === selectedTeacherId);
}

/**
 * Reconciles selected class when the instructor filter changes.
 * If the currently selected class does not belong to the newly selected teacher,
 * returns undefined to reset the class selection and prevent inconsistent filter state.
 */
export function reconcileSelectedClass(
  selectedClassId: number | undefined,
  newTeacherId: number | undefined,
  allClasses: ClassSummary[]
): number | undefined {
  if (selectedClassId === undefined || newTeacherId === undefined) {
    return selectedClassId;
  }
  const currentClass = allClasses.find((c) => c.id === selectedClassId);
  if (currentClass && currentClass.teacherId !== newTeacherId) {
    return undefined;
  }
  return selectedClassId;
}

export interface ReportPaginationState {
  totalPages: number;
  safeCurrentPage: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Computes safe pagination boundaries for report classes.
 * Guarantees that safeCurrentPage never exceeds totalPages, even when
 * filtering drops total items from 89 down to 1.
 */
export function computeReportPagination(
  totalItems: number,
  currentPage: number,
  pageSize: number
): ReportPaginationState {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.ceil(totalItems / safePageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (safeCurrentPage - 1) * safePageSize;
  const endIndex = startIndex + safePageSize;

  return {
    totalPages,
    safeCurrentPage,
    startIndex,
    endIndex,
  };
}
