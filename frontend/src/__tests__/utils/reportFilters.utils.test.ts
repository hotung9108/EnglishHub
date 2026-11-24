import { describe, expect, it } from 'vitest';
import type { ClassSummary } from '../../api/services/class.service';
import type { ReportClassSummary } from '../../types/report.types';
import {
  filterReportClasses, filterAvailableClasses, reconcileSelectedClass, computeReportPagination,
} from '../../utils/reportFilters.utils';

// Class identities and teachers come from local-dev/db-snapshot/classes.csv.
const classes: ClassSummary[] = [
  { id: 1, name: 'IELTS Foundation K1', status: 'ACTIVE', teacherId: 9 },
  { id: 2, name: 'Tiếng Anh Giao Tiếp Cơ Bản A1', status: 'ACTIVE', teacherId: 4 },
  { id: 3, name: 'IELTS Intensive 6.5+', status: 'ACTIVE', teacherId: 9 },
];
const reports: ReportClassSummary[] = classes.map(englishClass => ({
  classId: englishClass.id, className: englishClass.name, status: englishClass.status,
  assignedAssignmentCount: 0, averageScorePercent: 0, completionRatePercent: 0,
}));

describe('report filters', () => {
  it.each([
    { selected: undefined, expected: [1, 2, 3] },
    { selected: 1, expected: [1] },
    { selected: 2, expected: [2] },
    { selected: 999999, expected: [] },
  ])('filters report rows for class $selected', ({ selected, expected }) => {
    expect(filterReportClasses(reports, selected).map(row => row.classId)).toEqual(expected);
    expect(reports).toHaveLength(3);
  });

  it.each([
    { teacher: undefined, expected: [1, 2, 3] },
    { teacher: 9, expected: [1, 3] },
    { teacher: 4, expected: [2] },
    { teacher: 999999, expected: [] },
  ])('filters class choices for teacher $teacher', ({ teacher, expected }) => {
    expect(filterAvailableClasses(classes, teacher).map(row => row.id)).toEqual(expected);
    expect(classes).toHaveLength(3);
  });

  it('combines teacher choices with a class selection', () => {
    const available = filterAvailableClasses(classes, 9);
    const selected = reconcileSelectedClass(3, 9, available);
    expect(available.map(row => row.id)).toEqual([1, 3]);
    expect(filterReportClasses(reports, selected).map(row => row.classId)).toEqual([3]);
  });

  it.each([
    { selected: 1, teacher: 9, expected: 1 },
    { selected: 1, teacher: 4, expected: undefined },
    { selected: undefined, teacher: 9, expected: undefined },
    { selected: 1, teacher: undefined, expected: 1 },
    { selected: 999999, teacher: 9, expected: 999999 },
  ])('preserves existing reconciliation for class $selected and teacher $teacher', ({ selected, teacher, expected }) => {
    expect(reconcileSelectedClass(selected, teacher, classes)).toBe(expected);
  });

  it('handles empty lists and preserves an unknown selection as currently implemented', () => {
    expect(filterReportClasses([], 1)).toEqual([]);
    expect(filterAvailableClasses([], 9)).toEqual([]);
    expect(reconcileSelectedClass(1, 9, [])).toBe(1);
  });
});

describe('report pagination', () => {
  it.each([
    { total: 13, page: 2, size: 5, expected: { totalPages: 3, safeCurrentPage: 2, startIndex: 5, endIndex: 10 } },
    { total: 1, page: 8, size: 10, expected: { totalPages: 1, safeCurrentPage: 1, startIndex: 0, endIndex: 10 } },
    { total: 0, page: 0, size: 0, expected: { totalPages: 1, safeCurrentPage: 1, startIndex: 0, endIndex: 1 } },
    { total: 3, page: -1, size: 2, expected: { totalPages: 2, safeCurrentPage: 1, startIndex: 0, endIndex: 2 } },
  ])('clamps pagination for total $total, page $page, size $size', ({ total, page, size, expected }) => {
    expect(computeReportPagination(total, page, size)).toEqual(expected);
  });
});
