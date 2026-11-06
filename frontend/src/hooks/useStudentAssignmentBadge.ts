import { useState, useEffect, useCallback, useRef } from 'react';
import { classService } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, isSubmissionGraded } from '../api/services/submission.service';
import { ASSIGNMENT_SUBMITTED_EVENT } from '../utils/assignmentEvents.utils';

export interface UseStudentAssignmentBadgeResult {
  badge: string | undefined;
  count: number;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Formats the assignment badge string.
 * Returns undefined when count <= 0 to satisfy Zero-Bloat standard (no redundant '0' badge).
 * Returns '99+' when count exceeds 99.
 */
export function formatAssignmentBadge(count: number): string | undefined {
  if (!Number.isFinite(count) || count <= 0) {
    return undefined;
  }
  if (count > 99) {
    return '99+';
  }
  return String(Math.floor(count));
}

let cachedBadgeCount: number | null = null;
let cachedBadgeExpiry = 0;
let inFlightBadgePromise: Promise<number> | null = null;

export function invalidateStudentAssignmentBadgeCache(): void {
  cachedBadgeCount = null;
  cachedBadgeExpiry = 0;
  inFlightBadgePromise = null;
}

/**
 * Calculates pending/incomplete assignment count for the currently authenticated student.
 * An assignment is considered incomplete if it is PUBLISHED and the student has not yet
 * submitted a completed submission (status SUBMITTED or GRADED).
 */
export function useStudentAssignmentBadge(
  studentId?: number,
  role?: string
): UseStudentAssignmentBadgeResult {
  const [count, setCount] = useState<number>(() => cachedBadgeCount ?? 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  const isStudent = role === 'student' && typeof studentId === 'number' && studentId > 0;

  const fetchBadgeData = useCallback(async (forceRefresh = false) => {
    if (!isStudent) {
      if (isMountedRef.current) {
        setCount(0);
        setIsLoading(false);
      }
      return;
    }

    if (!forceRefresh && cachedBadgeCount !== null && Date.now() < cachedBadgeExpiry) {
      if (isMountedRef.current) {
        setCount(cachedBadgeCount);
        setIsLoading(false);
      }
      return;
    }

    if (inFlightBadgePromise) {
      try {
        const pendingCount = await inFlightBadgePromise;
        if (isMountedRef.current) {
          setCount(pendingCount);
          setIsLoading(false);
        }
      } catch {
        // ignore
      }
      return;
    }

    setIsLoading(true);
    const worker = async (): Promise<number> => {
      // 1. Fetch student's enrolled classes
      const classRes = await classService.list({ limit: 50 });
      const classes = classRes.data || [];

      if (classes.length === 0) {
        return 0;
      }

      // 2. Fetch assignments across all enrolled classes and student submissions in parallel
      const [classAssignmentsResults, subRes] = await Promise.all([
        Promise.all(
          classes.map(async (cls) => {
            try {
              const res = await assignmentService.listAssignments(cls.id, {
                status: 'PUBLISHED',
                limit: 50,
              });
              return res.data || [];
            } catch {
              return [];
            }
          })
        ),
        submissionService
          .listSubmissions({ studentId, limit: 100 })
          .catch(() => ({ data: [] as SubmissionListItem[] })),
      ]);

      // 3. Deduplicate assignments by id
      const uniqueAssignments = new Map<number, AssignmentSummary>();
      for (const assignmentList of classAssignmentsResults) {
        for (const item of assignmentList) {
          if (!uniqueAssignments.has(item.id)) {
            uniqueAssignments.set(item.id, item);
          }
        }
      }

      // 4. Identify assignments that have completed/submitted submissions
      const submissions = subRes.data || [];
      const submittedAssignmentIds = new Set<number>();
      for (const s of submissions) {
        if (s.status === 'SUBMITTED' || s.status === 'GRADED' || isSubmissionGraded(s)) {
          submittedAssignmentIds.add(s.assignmentId);
        }
      }

      // 5. Calculate pending / incomplete assignments (Published and not submitted)
      let pending = 0;
      for (const [id] of uniqueAssignments) {
        if (!submittedAssignmentIds.has(id)) {
          pending++;
        }
      }
      return pending;
    };

    inFlightBadgePromise = worker();

    try {
      const finalCount = await inFlightBadgePromise;
      cachedBadgeCount = finalCount;
      cachedBadgeExpiry = Date.now() + 60000; // Cache for 60 seconds

      if (isMountedRef.current) {
        setCount(finalCount);
      }
    } catch {
      if (isMountedRef.current) {
        setCount(0);
      }
    } finally {
      inFlightBadgePromise = null;
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isStudent, studentId]);

  useEffect(() => {
    isMountedRef.current = true;
    let isIgnore = false;

    queueMicrotask(() => {
      if (isIgnore) return;
      void fetchBadgeData();
    });

    return () => {
      isIgnore = true;
      isMountedRef.current = false;
    };
  }, [fetchBadgeData]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isStudent) return;

    const handleAssignmentSubmitted = () => {
      invalidateStudentAssignmentBadgeCache();
      void fetchBadgeData(true);
    };

    window.addEventListener(ASSIGNMENT_SUBMITTED_EVENT, handleAssignmentSubmitted);
    return () => {
      window.removeEventListener(ASSIGNMENT_SUBMITTED_EVENT, handleAssignmentSubmitted);
    };
  }, [isStudent, fetchBadgeData]);

  return {
    badge: formatAssignmentBadge(count),
    count,
    isLoading,
    refetch: fetchBadgeData,
  };
}
