import { useState, useEffect, useCallback, useRef } from 'react';
import { userService } from '../api/services/user.service';
import { reportService } from '../api/services/report.service';
import { studentEvaluationService } from '../api/services/student-evaluation.service';
import type { UserListItem } from '../api/services/user.service';
import type { ReportStudentProgressResponse } from '../types/report.types';
import type { StudentEvaluationListItem } from '../types/student-evaluation.types';

export interface StudentIdentityHint {
  studentId?: number;
  fullName?: string;
  studentCode?: string;
  email?: string;
}

export interface UseStudentDetailsOptions {
  studentId: number;
  initialHint?: StudentIdentityHint | null;
  isVi?: boolean;
}

export interface UseStudentDetailsResult {
  studentUser: UserListItem | null;
  progressData: ReportStudentProgressResponse | null;
  evaluations: StudentEvaluationListItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  statusMessage: string | null;
  isTogglingStatus: boolean;
  isResettingPassword: boolean;
  toggleSuspend: () => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useStudentDetails({
  studentId,
  initialHint,
  isVi = true,
}: UseStudentDetailsOptions): UseStudentDetailsResult {
  const hintFullName = initialHint?.fullName;
  const hintEmail = initialHint?.email;

  const isInvalidId = !studentId || isNaN(studentId) || studentId <= 0;

  const [studentUser, setStudentUser] = useState<UserListItem | null>(null);
  const [progressData, setProgressData] = useState<ReportStudentProgressResponse | null>(null);
  const [evaluations, setEvaluations] = useState<StudentEvaluationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(!isInvalidId);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [refetchCounter, setRefetchCounter] = useState(0);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    if (isInvalidId) {
      return;
    }

    const loadData = async () => {
      try {
        // Call reports and evaluations in parallel
        const [progressRes, evalRes] = await Promise.allSettled([
          reportService.getStudentProgress(studentId),
          studentEvaluationService.list(studentId),
        ]);

        if (ignore) return;

        let resolvedProgress: ReportStudentProgressResponse | null = null;
        if (progressRes.status === 'fulfilled') {
          resolvedProgress = progressRes.value;
          setProgressData(resolvedProgress);
        } else {
          setProgressData(null);
        }

        if (evalRes.status === 'fulfilled') {
          setEvaluations(evalRes.value.data || []);
        } else {
          setEvaluations([]);
        }

        // Build identity hint for accurate lookup without full scan
        const lookupHint = {
          fullName: hintFullName || resolvedProgress?.studentName,
          email: hintEmail,
        };

        const resolvedUser = await userService.getUserById(studentId, lookupHint);

        if (ignore) return;

        if (resolvedUser && resolvedUser.id === studentId) {
          setStudentUser(resolvedUser);
          setIsError(false);
          setErrorMessage(null);
        } else {
          // Absolutely NEVER fallback to users[0]
          setStudentUser(null);
          setIsError(true);
          setErrorMessage(
            isVi
              ? 'Không tìm thấy thông tin học viên tương ứng với mã định danh này.'
              : 'Student identity could not be found for this ID.'
          );
        }
      } catch (err: unknown) {
        if (!ignore) {
          setIsError(true);
          setErrorMessage(
            err instanceof Error
              ? err.message
              : isVi
              ? 'Không thể tải thông tin học viên.'
              : 'Failed to load student details.'
          );
          setStudentUser(null);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, [studentId, hintFullName, hintEmail, isVi, isInvalidId, refetchCounter]);

  const toggleSuspend = useCallback(async (): Promise<boolean> => {
    if (!studentUser || studentUser.id !== studentId) return false;
    const nextStatus = studentUser.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    try {
      setIsTogglingStatus(true);
      await userService.updateStatus(studentUser.id, nextStatus);
      if (mountedRef.current) {
        setStudentUser(prev => (prev ? { ...prev, status: nextStatus } : null));
        setStatusMessage(
          nextStatus === 'LOCKED'
            ? isVi
              ? 'Đã tạm khóa tài khoản học viên.'
              : 'Student account suspended.'
            : isVi
            ? 'Đã kích hoạt lại tài khoản học viên.'
            : 'Student account reactivated.'
        );
        setTimeout(() => {
          if (mountedRef.current) setStatusMessage(null);
        }, 3000);
      }
      return true;
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : isVi
          ? 'Không thể đổi trạng thái tài khoản.'
          : 'Failed to toggle status.'
      );
      return false;
    } finally {
      if (mountedRef.current) {
        setIsTogglingStatus(false);
      }
    }
  }, [studentUser, studentId, isVi]);

  const resetPassword = useCallback(async (newPassword: string): Promise<boolean> => {
    if (!newPassword.trim() || !studentUser || studentUser.id !== studentId) return false;
    try {
      setIsResettingPassword(true);
      await userService.updateUser(studentUser.id, {});
      return true;
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : isVi
          ? 'Không thể đổi mật khẩu.'
          : 'Failed to reset password.'
      );
      return false;
    } finally {
      if (mountedRef.current) {
        setIsResettingPassword(false);
      }
    }
  }, [studentUser, studentId, isVi]);

  const refetch = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setRefetchCounter(prev => prev + 1);
  }, []);

  return {
    studentUser: isInvalidId ? null : studentUser,
    progressData: isInvalidId ? null : progressData,
    evaluations: isInvalidId ? [] : evaluations,
    isLoading: isInvalidId ? false : isLoading,
    isError: isInvalidId ? true : isError,
    errorMessage: isInvalidId
      ? (isVi ? 'Mã học viên không hợp lệ.' : 'Invalid student ID.')
      : errorMessage,
    statusMessage,
    isTogglingStatus,
    isResettingPassword,
    toggleSuspend,
    resetPassword,
    refetch,
  };
}
