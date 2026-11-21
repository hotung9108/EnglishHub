import { useState, useEffect, useCallback, useRef } from 'react';
import { userService, type UserProfile } from '../api/services/user.service';
import { reportService } from '../api/services/report.service';
import { studentEvaluationService } from '../api/services/student-evaluation.service';
import type { ReportStudentProgressResponse } from '../types/report.types';
import type { StudentEvaluationListItem } from '../types/student-evaluation.types';

export interface UseStudentDetailsOptions {
  studentId: number;
  isVi?: boolean;
}

type StudentProfile = UserProfile & { role: 'STUDENT' };

export interface UseStudentDetailsResult {
  studentUser: StudentProfile | null;
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

interface StudentProfileResult {
  studentId: number;
  user: StudentProfile | null;
  errorMessage?: string;
}

export function useStudentDetails({
  studentId,
  isVi = true,
}: UseStudentDetailsOptions): UseStudentDetailsResult {
  const isInvalidId = !Number.isSafeInteger(studentId) || studentId <= 0;

  const [profile, setProfile] = useState<StudentProfileResult | null>(null);
  const currentProfile = profile?.studentId === studentId ? profile : null;
  const studentUser = currentProfile?.user ?? null;
  const [progressData, setProgressData] = useState<ReportStudentProgressResponse | null>(null);
  const [evaluations, setEvaluations] = useState<StudentEvaluationListItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const mountedRef = useRef(true);
  const profileRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadProfile = useCallback(() => {
    if (isInvalidId) return Promise.resolve();
    profileRequest.current?.abort();
    const controller = new AbortController();
    profileRequest.current = controller;
    const { signal } = controller;

    return userService.getAdminUserDetail(studentId, { signal }).then(
      user => {
        if (signal.aborted) return;
        const student = user?.id === studentId && user.role === 'STUDENT' ? { ...user, role: user.role } : null;
        setProfile({ studentId, user: student });
      },
      (error: unknown) => {
        if (!signal.aborted) {
          setProfile({ studentId, user: null, errorMessage: error instanceof Error ? error.message : undefined });
        }
      },
    );
  }, [studentId, isInvalidId]);

  useEffect(() => {
    void loadProfile();
    return () => profileRequest.current?.abort();
  }, [loadProfile]);

  useEffect(() => {
    if (isInvalidId) return;
    let ignore = false;

    const loadStudentActivity = async () => {
      const [progress, evaluationList] = await Promise.allSettled([
        reportService.getStudentProgress(studentId),
        studentEvaluationService.list(studentId),
      ]);
      if (ignore) return;
      setProgressData(progress.status === 'fulfilled' ? progress.value : null);
      setEvaluations(evaluationList.status === 'fulfilled' ? evaluationList.value.data || [] : []);
    };

    void loadStudentActivity();
    return () => {
      ignore = true;
    };
  }, [studentId, isInvalidId]);

  const toggleSuspend = useCallback(async (): Promise<boolean> => {
    if (!studentUser || studentUser.id !== studentId) return false;
    const nextStatus = studentUser.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    try {
      setIsTogglingStatus(true);
      await userService.updateStatus(studentUser.id, nextStatus);
      if (mountedRef.current) {
        setProfile(current => {
          if (current?.studentId !== studentId || !current.user) return current;
          return { ...current, user: { ...current.user, status: nextStatus } };
        });
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
      const msg =
        err instanceof Error
          ? err.message
          : isVi
          ? 'Không thể đổi trạng thái tài khoản.'
          : 'Failed to toggle status.';
      if (mountedRef.current) setStatusMessage(msg);
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
      const msg =
        err instanceof Error
          ? err.message
          : isVi
          ? 'Không thể đổi mật khẩu.'
          : 'Failed to reset password.';
      if (mountedRef.current) setStatusMessage(msg);
      return false;
    } finally {
      if (mountedRef.current) {
        setIsResettingPassword(false);
      }
    }
  }, [studentUser, studentId, isVi]);

  const refetch = useCallback(async (): Promise<void> => {
    if (isInvalidId) return;
    setProfile(null);
    await loadProfile();
  }, [isInvalidId, loadProfile]);

  const isLoading = !isInvalidId && !currentProfile;
  const isError = isInvalidId || (!isLoading && !studentUser);
  let errorMessage: string | null = null;
  if (isInvalidId) {
    errorMessage = isVi ? 'Mã học viên không hợp lệ.' : 'Invalid student ID.';
  } else if (isError) {
    errorMessage = currentProfile?.errorMessage || (isVi
      ? 'Không thể xác minh hồ sơ học viên cho mã này.'
      : 'Student identity could not be verified for this ID.');
  }

  return {
    studentUser,
    progressData: studentUser ? progressData : null,
    evaluations: studentUser ? evaluations : [],
    isLoading,
    isError,
    errorMessage,
    statusMessage,
    isTogglingStatus,
    isResettingPassword,
    toggleSuspend,
    resetPassword,
    refetch,
  };
}
