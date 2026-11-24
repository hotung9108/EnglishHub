import type { SubmissionListItem } from '../../api/services/submission.service';
import { useLanguage } from '../../contexts/LanguageContext';
import { hasStudentSubmission } from '../../utils/studentEvaluationAvailability.utils';

interface StudentEvaluationAvailabilityNoticeProps {
  submissions: SubmissionListItem[] | null;
  studentId: number;
}

export function StudentEvaluationAvailabilityNotice({ submissions, studentId }: StudentEvaluationAvailabilityNoticeProps) {
  const { t } = useLanguage();

  if (submissions === null || hasStudentSubmission(submissions, studentId)) return null;

  return <p className="mb-3 text-sm text-muted" role="note">{t('progress.evaluationLimitedData')}</p>;
}
