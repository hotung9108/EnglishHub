import { useEffect, useRef, useState, useCallback } from 'react';
import { submissionService, type SubmissionDetail } from '../api/services/submission.service';

export interface UseStudentSubmissionPollingOptions {
  submissionId: number | null | undefined;
  isGraded: boolean;
  intervalMs?: number;
  timeoutMs?: number;
  enabled?: boolean;
  onGraded?: (updatedSubmission: SubmissionDetail) => void;
}

export function useStudentSubmissionPolling({
  submissionId,
  isGraded,
  intervalMs = 3500,
  timeoutMs = 60000,
  enabled = true,
  onGraded,
}: UseStudentSubmissionPollingOptions) {
  const [isPolling, setIsPolling] = useState(false);
  const onGradedRef = useRef(onGraded);
  onGradedRef.current = onGraded;

  const checkGradedCondition = useCallback((sub: SubmissionDetail): boolean => {
    if (sub.status === 'GRADED') return true;
    if (sub.modules && sub.modules.length > 0) {
      return sub.modules.some(
        (m) =>
          m.status === 'GRADED' ||
          m.grading?.status === 'AI_GRADED' ||
          m.grading?.status === 'COMPLETED'
      );
    }
    return false;
  }, []);

  useEffect(() => {
    if (!submissionId || isGraded || !enabled) {
      setIsPolling(false);
      return;
    }

    let isMounted = true;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    const startTime = Date.now();

    setIsPolling(true);

    const poll = async () => {
      if (!isMounted) return;

      if (Date.now() - startTime >= timeoutMs) {
        setIsPolling(false);
        return;
      }

      try {
        const fresh = await submissionService.getSubmission(submissionId);
        if (!isMounted) return;

        if (checkGradedCondition(fresh)) {
          setIsPolling(false);
          onGradedRef.current?.(fresh);
          return;
        }
      } catch (err) {
        console.warn('[useStudentSubmissionPolling] Failed to fetch submission:', err);
      }

      if (isMounted && Date.now() - startTime < timeoutMs) {
        timerId = setTimeout(poll, intervalMs);
      } else if (isMounted) {
        setIsPolling(false);
      }
    };

    timerId = setTimeout(poll, intervalMs);

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
    };
  }, [submissionId, isGraded, enabled, intervalMs, timeoutMs, checkGradedCondition]);

  return { isPolling };
}
