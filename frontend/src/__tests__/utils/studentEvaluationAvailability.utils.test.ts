import { expect, it } from 'vitest';
import { hasStudentSubmission } from '../../utils/studentEvaluationAvailability.utils';

it('chỉ tính lượt SUBMITTED hoặc GRADED của đúng học viên', () => {
  const studentId = 19;
  expect(hasStudentSubmission([], studentId)).toBe(false);
  expect(hasStudentSubmission([
    { studentId, status: 'IN_PROGRESS' },
    { studentId: 23, status: 'GRADED' },
  ], studentId)).toBe(false);
  expect(hasStudentSubmission([{ studentId, status: 'SUBMITTED' }], studentId)).toBe(true);
  expect(hasStudentSubmission([{ studentId, status: 'GRADED' }], studentId)).toBe(true);
});
