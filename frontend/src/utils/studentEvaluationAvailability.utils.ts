import type { SubmissionListItem } from '../api/services/submission.service';

export function hasStudentSubmission(
  submissions: readonly Pick<SubmissionListItem, 'studentId' | 'status'>[],
  studentId: number,
): boolean {
  return submissions.some(submission =>
    submission.studentId === studentId && (submission.status === 'SUBMITTED' || submission.status === 'GRADED'),
  );
}
