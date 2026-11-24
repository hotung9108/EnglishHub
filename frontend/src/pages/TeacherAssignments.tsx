import React, { useState, useMemo, useEffect, useId, useRef, useLayoutEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiClientError, NetworkError, TimeoutError } from '../api/core/errors';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentStatus } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import {
  Plus, Mic, BookOpen, Headphones, PenTool, Search, AlertCircle, FileText, X, RefreshCw,
} from 'lucide-react';
import { Button, ConfirmModal, EmptyState, MetricCard, Pagination, LoadingState, useToast } from '../components/common';
import { AssignmentCard, type AssignmentDisplayItem } from '../components/assignments/AssignmentCard';
import { useUpdateAssignmentStatus } from '../hooks/useAssignments';
import { matchesSkillFilter, type AssignmentSkillFilter } from '../utils/assignmentSkills';
import {
  createReopenDeadlineDraft, validateReopenDeadline, type ReopenDeadlineDraft, type ReopenDeadlineError,
} from '../utils/dateTime.utils';

type AssignmentIdentity = Pick<AssignmentDisplayItem, 'id' | 'classId'>;
type LocalizedText = { vi: string; en: string };
type AssignmentStatusAction = AssignmentIdentity & (
  | { lifecycleStatus: 'DRAFT'; action: 'open' }
  | { lifecycleStatus: 'PUBLISHED'; action: 'close' }
  | {
      lifecycleStatus: 'CLOSED'; action: 'reopen'; deadline: ReopenDeadlineDraft;
      fieldError?: LocalizedText; rejectedDeadline?: { closeAt: string | null; message: LocalizedText };
    }
);

const statusActionCopy = {
  open: {
    title: { vi: 'Mở bài tập', en: 'Open assignment' },
    message: { vi: 'Mở bài tập này cho học viên làm bài?', en: 'Open this assignment for students to work on?' },
    success: { vi: 'Đã mở bài tập.', en: 'Assignment opened.' },
  },
  close: {
    title: { vi: 'Khóa bài tập', en: 'Close assignment' },
    message: {
      vi: 'Học viên chưa nộp bài sẽ không thể nộp sau khi khóa bài tập.',
      en: 'Students who have not submitted will be unable to submit after the assignment is closed.',
    },
    success: { vi: 'Đã khóa bài tập.', en: 'Assignment closed.' },
  },
  reopen: {
    title: { vi: 'Mở lại bài tập', en: 'Reopen assignment' },
    message: { vi: 'Mở lại bài tập này cho học viên làm bài?', en: 'Reopen this assignment for students to work on?' },
    success: { vi: 'Đã mở lại bài tập.', en: 'Assignment reopened.' },
  },
};

const deadlineMessages: Record<ReopenDeadlineError, LocalizedText> = {
  required: { vi: 'Vui lòng nhập hạn nộp mới.', en: 'Enter a new deadline.' },
  invalid: { vi: 'Ngày giờ không hợp lệ.', en: 'Enter a valid date and time.' },
  future: {
    vi: 'Hạn nộp khi mở lại phải sau thời điểm hiện tại.',
    en: 'The new deadline must be in the future.',
  },
  afterOpen: {
    vi: 'Hạn nộp phải sau thời điểm mở bài.',
    en: 'The deadline must be after the assignment opening time.',
  },
};

const backendStatusErrors = new Map<string, { type: 'deadline' | 'state'; message: LocalizedText }>([
  [deadlineMessages.afterOpen.vi, { type: 'deadline', message: deadlineMessages.afterOpen }],
  [deadlineMessages.future.vi, { type: 'deadline', message: deadlineMessages.future }],
  ['Không thể chuyển sang trạng thái này.', {
    type: 'state', message: { vi: 'Chuyển trạng thái bài tập bị từ chối.', en: 'The assignment status change was rejected.' },
  }],
  ['Chỉ được cập nhật hạn nộp khi mở lại bài tập.', {
    type: 'state', message: { vi: 'Chuyển trạng thái bài tập bị từ chối.', en: 'The assignment status change was rejected.' },
  }],
]);

const genericStatusError: LocalizedText = {
  vi: 'Không thể cập nhật trạng thái bài tập.',
  en: 'Could not update the assignment status.',
};

const assignmentLoadError: LocalizedText = {
  vi: 'Không thể tải danh sách bài tập. Vui lòng thử lại.',
  en: 'Failed to load assignments. Please retry.',
};

const statusErrorCopy: Partial<Record<number, LocalizedText>> = {
  401: { vi: 'Phiên đăng nhập đã hết hạn.', en: 'Your session has expired.' },
  403: { vi: 'Bạn không có quyền thực hiện thao tác này.', en: 'You do not have permission to perform this action.' },
  404: { vi: 'Bài tập hoặc lớp không còn truy cập được.', en: 'The assignment or class is no longer accessible.' },
  409: { vi: 'Bài tập đang được cập nhật, vui lòng thử lại.', en: 'The assignment is being updated. Please try again.' },
};

function getStatusErrorMessage(error: unknown, statusCode: number | undefined): LocalizedText {
  if (error instanceof NetworkError) {
    return { vi: 'Lỗi kết nối. Vui lòng thử lại.', en: 'Connection error. Please try again.' };
  }
  if (statusCode === 408 || statusCode === undefined) return genericStatusError;
  const message = statusErrorCopy[statusCode];
  if (message) return message;
  if (statusCode >= 400 && statusCode < 500) {
    return { vi: 'Yêu cầu thất bại.', en: 'The request failed.' };
  }
  if (statusCode >= 500 && statusCode < 600) {
    return { vi: 'Lỗi máy chủ. Vui lòng thử lại.', en: 'Server error. Please try again.' };
  }
  return genericStatusError;
}

function matchesAssignment(item: AssignmentIdentity, target: AssignmentIdentity) {
  return item.id === target.id && item.classId === target.classId;
}

function mapAssignmentDeadline(
  closeAt: string | null,
  lifecycleStatus: AssignmentDisplayItem['lifecycleStatus'],
  currentTimestamp: number,
  isVi: boolean,
): Pick<AssignmentDisplayItem, 'closeDate' | 'daysLeft' | 'status' | 'dueDate'> {
  const closeDate = closeAt ? new Date(closeAt) : null;
  let daysLeft: number | undefined;
  let status: AssignmentDisplayItem['status'] = 'open';

  if (closeDate) {
    const msDiff = closeDate.getTime() - currentTimestamp;
    daysLeft = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
    if (msDiff < 0) {
      status = 'closed';
    } else if (lifecycleStatus === 'DRAFT') {
      status = 'upcoming';
    }
  }

  const dueDate = closeDate
    ? closeDate.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    : (isVi ? 'Không thời hạn' : 'No deadline');

  return { closeDate, daysLeft, status, dueDate };
}

interface AssignmentListScope {
  classes: ClassSummary[];
  selectedClassId: string;
  isVi: boolean;
}

function includesClass(selectedClassId: string, classId: number) {
  return !selectedClassId || selectedClassId === 'all' || selectedClassId === String(classId);
}

function isSubmissionFullyGraded(submission: SubmissionListItem) {
  return submission.status === 'GRADED'
    || Boolean(submission.modules?.length && submission.modules.every(module => module.grading?.status === 'COMPLETED'));
}

async function loadAssignments(
  { classes, selectedClassId, isVi }: AssignmentListScope,
  currentTimestamp: number,
  backgroundSignal?: AbortSignal,
): Promise<AssignmentDisplayItem[]> {
  const options = backgroundSignal ? { skipCache: true, signal: backgroundSignal } : { skipCache: true };
  const read = <T, F>(request: Promise<T>, fallback: F): Promise<T | F> =>
    backgroundSignal ? request : request.catch(() => fallback);
  const targetClasses = classes.filter(cls => includesClass(selectedClassId, cls.id));
  const classResults = await Promise.all(targetClasses.map(async cls => {
    const [members, assignmentResponse] = await Promise.all([
      read(classService.listMembers(cls.id, options), []),
      read(assignmentService.listAssignments(cls.id, { limit: 50 }, options), { data: [] }),
    ]);
    backgroundSignal?.throwIfAborted();
    const totalStudents = Array.isArray(members) ? members.length : 0;
    const rawAssignments = assignmentResponse.data || [];

    return Promise.all(rawAssignments.map(async raw => {
      const submissions = await read(
        submissionService.listSubmissions({ assignmentId: raw.id, limit: 100 }, options).then(res => res.data || []),
        [],
      );
      const submitted = submissions.filter(submission => submission.status !== 'IN_PROGRESS');
      const closeAt = raw.closeAt ?? null;

      return {
        id: String(raw.id),
        classId: cls.id,
        code: `HW-${raw.id.toString().padStart(2, '0')}`,
        skills: raw.skills ?? [],
        title: raw.title,
        className: cls.name,
        ...mapAssignmentDeadline(closeAt, raw.status, currentTimestamp, isVi),
        closeAt,
        ...(raw.openAt !== undefined ? { openAt: raw.openAt } : {}),
        totalStudents,
        submittedCount: submitted.length,
        pendingGradingCount: submitted.filter(submission => !isSubmissionFullyGraded(submission)).length,
        lifecycleStatus: raw.status,
      };
    }));
  }));
  return classResults.flat();
}

export const TeacherAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isVi = language === 'vi';
  const locale = isVi ? 'vi' : 'en';
  const toast = useToast();
  const { mutateAsync, isLoading: isUpdatingLifecycle } = useUpdateAssignmentStatus();
  const [statusAction, setStatusAction] = useState<AssignmentStatusAction | null>(null);
  const dialogTargetRef = useRef<Pick<AssignmentStatusAction, 'id' | 'classId' | 'lifecycleStatus'> | null>(null);
  const inFlightRef = useRef(false);
  const loadVersion = useRef(0);
  const backgroundLoad = useRef<AbortController | null>(null);
  const activeView = useRef<(AssignmentListScope & {
    assignments: AssignmentDisplayItem[]; loadedClassId: string | null; t: typeof t;
  }) | null>(null);
  const deadlineInputId = useId();
  const deadlineHelpId = `${deadlineInputId}-help`;
  const deadlineErrorId = `${deadlineInputId}-error`;

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Classes & Selected Class
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  // Assignments & Submissions
  const [assignments, setAssignments] = useState<AssignmentDisplayItem[]>([]);
  const [loadedClassId, setLoadedClassId] = useState<string | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentDisplayItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [skillFilter, setSkillFilter] = useState<AssignmentSkillFilter>('all');
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const invalidateLoads = useCallback(() => {
    loadVersion.current += 1;
    backgroundLoad.current?.abort();
    backgroundLoad.current = null;
  }, []);

  useLayoutEffect(() => invalidateLoads, [classes, selectedClassId, isVi, reloadKey, invalidateLoads]);
  useLayoutEffect(() => {
    activeView.current = { classes, selectedClassId, isVi, assignments, loadedClassId, t };
    return () => { activeView.current = null; };
  }, [classes, selectedClassId, isVi, assignments, loadedClassId, t]);

  const setDialog = (action: AssignmentStatusAction | null) => {
    dialogTargetRef.current = action && { id: action.id, classId: action.classId, lifecycleStatus: action.lifecycleStatus };
    setStatusAction(action);
  };

  const handleSkillFilterChange = (skill: AssignmentSkillFilter) => {
    setSkillFilter(skill);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleClassFilterChange = (classId: string) => {
    if (classId !== selectedClassId) {
      invalidateLoads();
      if (activeView.current) {
        activeView.current.selectedClassId = classId;
        activeView.current.loadedClassId = null;
      }
      setLoadedClassId(null);
      setError(null);
      const target = dialogTargetRef.current;
      if (!inFlightRef.current && target && !includesClass(classId, target.classId)) setDialog(null);
    }
    setSelectedClassId(classId);
    setCurrentPage(1);
  };

  const [currentTimestamp] = useState(() => Date.now());

  const handleRetry = () => {
    invalidateLoads();
    setIsLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  const handleConfirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    try {
      setIsDeleting(true);
      await assignmentService.deleteAssignment(Number(assignmentToDelete.id));
      setAssignmentToDelete(null);
      setReloadKey((prev) => prev + 1);
    } catch (err: unknown) {
      console.error('Failed to delete assignment:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // 1. Fetch Classes on mount
  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        const res = await classService.list({ limit: 100 });
        const list = res.data || [];
        if (isMounted) {
          setClasses(list);
          if (list.length > 0) {
            setSelectedClassId((prev) => prev || String(list[0].id));
          }
        }
      } catch (err) {
        if (isMounted) console.error('Failed to load classes for assignment management:', err);
      }
    };
    fetchClasses();
    return () => { isMounted = false; };
  }, []); // Run once on mount to avoid re-triggering when selectedClassId changes

  // Foreground reads retain the existing fallbacks and loading behavior.
  useEffect(() => {
    const version = ++loadVersion.current;
    const fetchAssignments = async () => {
      if (classes.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        const rows = await loadAssignments({ classes, selectedClassId, isVi }, currentTimestamp);
        if (loadVersion.current === version) {
          setAssignments(rows);
          setLoadedClassId(selectedClassId);
        }
      } catch (error) {
        if (loadVersion.current === version) {
          console.error('Failed to load assignments:', error);
          setError(assignmentLoadError[isVi ? 'vi' : 'en']);
        }
      } finally {
        if (loadVersion.current === version) setIsLoading(false);
      }
    };

    void fetchAssignments();
  }, [classes, selectedClassId, isVi, reloadKey, currentTimestamp]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (statusFilter !== 'all' && item.lifecycleStatus !== statusFilter) return false;
      if (!matchesSkillFilter(item.skills, skillFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assignments, statusFilter, skillFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAssignments = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, safeCurrentPage, pageSize]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const pendingTotal = assignments.reduce((sum, a) => sum + a.pendingGradingCount, 0);
    const avgSubmission = total > 0
      ? Math.round((assignments.reduce((sum, a) => sum + (a.totalStudents > 0 ? a.submittedCount / a.totalStudents : 0), 0) / total) * 100)
      : 0;
    return {
      total,
      pendingTotal,
      avgSubmission: Math.min(100, Math.max(0, avgSubmission || 0))
    };
  }, [assignments]);

  // eslint-disable-next-line react-hooks/purity -- The active count must use a fresh clock on each render.
  const now = Date.now();
  const openCount = assignments.filter(({ lifecycleStatus, closeAt }) =>
    lifecycleStatus === 'PUBLISHED' && closeAt !== null && Date.parse(closeAt) >= now
  ).length;

  const selectedAssignment = statusAction && assignments.find(item => matchesAssignment(item, statusAction));
  const isClassSnapshotCurrent = loadedClassId === selectedClassId;
  const reopenAction = statusAction?.action === 'reopen' ? statusAction : null;
  const deadlineValidation = reopenAction && validateReopenDeadline(reopenAction.deadline, selectedAssignment?.openAt, now);
  const rejectedDeadline = reopenAction?.rejectedDeadline;
  const isDeadlineRejected = !!(reopenAction && rejectedDeadline && deadlineValidation?.valid
    && rejectedDeadline.closeAt === (deadlineValidation.closeAt ?? reopenAction.deadline.originalCloseAt));
  const deadlineError = reopenAction?.fieldError
    ?? (isDeadlineRejected ? rejectedDeadline?.message : undefined)
    ?? (deadlineValidation && !deadlineValidation.valid ? deadlineMessages[deadlineValidation.error] : undefined);
  const dialogCopy = statusActionCopy[statusAction?.action ?? 'close'];

  const reconcileDialog = (rows: AssignmentDisplayItem[], isVietnamese: boolean) => {
    const target = dialogTargetRef.current;
    if (!target) return;

    const row = rows.find(item => matchesAssignment(item, target));
    if (!row) {
      setDialog(null);
      toast.info(isVietnamese ? 'Bài tập không còn trong danh sách đang xem.' : 'The assignment is no longer in the current list.');
      return;
    }
    if (row.lifecycleStatus !== target.lifecycleStatus) {
      setDialog(null);
      toast.info(isVietnamese ? 'Trạng thái bài tập đã thay đổi.' : 'The assignment status has changed.');
      return;
    }
    if (row.lifecycleStatus === 'CLOSED') {
      const refreshedDeadline = createReopenDeadlineDraft(row.closeAt, Date.now());
      setStatusAction(current => {
        if (current?.action !== 'reopen' || !matchesAssignment(current, target) || current.deadline.originalCloseAt === row.closeAt) {
          return current;
        }
        const { deadline } = current;
        return {
          ...current,
          deadline: deadline.inputValue === deadline.prefillValue
            ? refreshedDeadline
            : { ...deadline, originalCloseAt: row.closeAt },
        };
      });
    }
  };

  const refreshAssignments = async () => {
    const view = activeView.current;
    if (!view) return;

    invalidateLoads();
    const version = loadVersion.current;
    const controller = new AbortController();
    backgroundLoad.current = controller;

    try {
      const rows = await loadAssignments(view, currentTimestamp, controller.signal);
      if (loadVersion.current !== version) return;
      setAssignments(rows);
      setLoadedClassId(view.selectedClassId);
      reconcileDialog(rows, view.isVi);
    } catch {
      if (loadVersion.current !== version) return;
      controller.abort();
      toast.warning(view.isVi ? 'Không thể làm mới danh sách bài tập.' : 'Could not refresh the assignment list.');
      if (view.loadedClassId !== view.selectedClassId) setError(assignmentLoadError[view.isVi ? 'vi' : 'en']);
    } finally {
      if (loadVersion.current === version) {
        backgroundLoad.current = null;
        setIsLoading(false);
      }
    }
  };

  const handleRequestStatusChange = ({ id, classId, lifecycleStatus, closeAt }: AssignmentDisplayItem) => {
    const view = activeView.current;
    if (inFlightRef.current || !view || view.loadedClassId !== view.selectedClassId
      || !includesClass(view.selectedClassId, classId)) return;

    if (lifecycleStatus === 'CLOSED') {
      setDialog({
        id, classId, lifecycleStatus, action: 'reopen', deadline: createReopenDeadlineDraft(closeAt, Date.now()),
      });
    } else if (lifecycleStatus === 'DRAFT') {
      setDialog({ id, classId, lifecycleStatus, action: 'open' });
    } else {
      setDialog({ id, classId, lifecycleStatus, action: 'close' });
    }
  };

  const handleDeadlineChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, validity } = event.currentTarget;
    const fieldError = validity.badInput ? deadlineMessages.invalid : undefined;
    setStatusAction(current => current?.action === 'reopen'
      ? { ...current, deadline: { ...current.deadline, inputValue: value }, fieldError }
      : current
    );
  };

  const handleConfirmStatusChange = async () => {
    if (!statusAction || inFlightRef.current) return;

    const { id, classId, lifecycleStatus, action } = statusAction;
    const view = activeView.current;
    if (!view) return;
    if (view.loadedClassId !== view.selectedClassId || !includesClass(view.selectedClassId, classId)
      || selectedAssignment?.lifecycleStatus !== lifecycleStatus) {
      setDialog(null);
      toast.warning(isVi ? 'Dữ liệu bài tập đã thay đổi.' : 'Assignment data has changed.');
      return;
    }

    let newCloseAt: string | undefined;
    if (statusAction.action === 'reopen') {
      const validation = validateReopenDeadline(statusAction.deadline, selectedAssignment.openAt, Date.now());
      if (!validation.valid) {
        setStatusAction({ ...statusAction, fieldError: deadlineMessages[validation.error] });
        return;
      }
      newCloseAt = validation.closeAt;
      if (statusAction.rejectedDeadline?.closeAt === (newCloseAt ?? statusAction.deadline.originalCloseAt)) return;
    }

    const nextStatus = action === 'close' ? 'CLOSED' : 'PUBLISHED';
    const variables: Parameters<typeof mutateAsync>[0] = newCloseAt === undefined
      ? { id: Number(id), status: nextStatus }
      : { id: Number(id), status: 'PUBLISHED', reopen: { closeAt: newCloseAt } };
    const updatedDeadline = newCloseAt === undefined
      ? {}
      : { closeAt: newCloseAt, ...mapAssignmentDeadline(newCloseAt, nextStatus, currentTimestamp, isVi) };

    try {
      inFlightRef.current = true;
      await mutateAsync(variables);
      const view = activeView.current;
      if (!view) return;

      toast.success(statusActionCopy[action].success[view.isVi ? 'vi' : 'en']);
      setDialog(null);
      if (!includesClass(view.selectedClassId, statusAction.classId)
        || !view.assignments.some(item => matchesAssignment(item, statusAction))) return;

      invalidateLoads();
      setAssignments(items => items.map(item =>
        matchesAssignment(item, statusAction) ? { ...item, ...updatedDeadline, lifecycleStatus: nextStatus } : item
      ));
      void refreshAssignments();
    } catch (error: unknown) {
      const view = activeView.current;
      if (!view) return;
      if (error instanceof TimeoutError) {
        toast.warning(view.t('teacherAssignments.statusResponseUnconfirmed'));
        setDialog(null);
        void refreshAssignments();
        return;
      }
      const errorLocale = view.isVi ? 'vi' : 'en';
      const statusCode = error instanceof ApiClientError ? error.statusCode : undefined;

      if (error instanceof ApiClientError && statusCode === 400) {
        const knownError = backendStatusErrors.get(error.message.trim());
        if (statusAction.action === 'reopen' && knownError?.type === 'deadline') {
          const rejectedDeadline = {
            closeAt: newCloseAt ?? statusAction.deadline.originalCloseAt,
            message: knownError.message,
          };
          setStatusAction(current => current?.action === 'reopen' && matchesAssignment(current, statusAction)
            ? { ...current, rejectedDeadline }
            : current
          );
          toast.error(knownError.message[errorLocale]);
        } else {
          setDialog(null);
          toast.error((knownError?.type === 'state' ? knownError.message : genericStatusError)[errorLocale]);
        }
        void refreshAssignments();
        return;
      }

      if (statusCode !== 409) setDialog(null);
      toast.error(getStatusErrorMessage(error, statusCode)[errorLocale]);
      if (statusCode === 404 || statusCode === 409) void refreshAssignments();
    } finally {
      inFlightRef.current = false;
    }
  };

  const handleSelectSkillToCreate = (skillType: string) => {
    setShowSkillModal(false);
    const classParam = selectedClassId ? `&classId=${selectedClassId}` : '';
    navigate(`/teacher/assignments/create?type=${skillType}${classParam}`);
  };

  return (
    <div className="teacher-container">
      {/* Unified Hero Header Card */}
      <section className="teacher-page-hero">
        <div className="teacher-hero-content">
          <h1 className="teacher-hero-title">
            {isVi ? 'Quản lý bài tập' : 'Assignments'}
          </h1>

          <div className="teacher-hero-actions">
            {/* Class Select Dropdown */}
            <select
              value={selectedClassId}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className="select-input font-semibold text-sm"
            >
              <option value="all">{isVi ? 'Tất cả các lớp' : 'All Classes'}</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowSkillModal(true)}
            >
              {isVi ? 'Giao bài tập mới' : 'Create Assignment'}
            </Button>
          </div>
        </div>
      </section>

      {/* Loading Indicator */}
      {isLoading && (
        <LoadingState 
          title={isVi ? 'Đang tải danh sách bài tập...' : 'Loading assignments...'}
          description={isVi ? 'Đang đồng bộ dữ liệu bài tập và tiến độ nộp bài của các lớp.' : 'Syncing assignments and student submission turnouts.'}
        />
      )}

      {/* Error Alert */}
      {!isLoading && error && (
        <div className="adm-alert-error mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-danger flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={handleRetry}
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* KPI Stats Grid */}
      {!isLoading && !error && (
        <div className="teacher-stats-grid mb-6">
          <MetricCard
            title={isVi ? 'Tổng bài tập' : 'Total Assignments'}
            value={stats.total}
            className="h-full"
          />
          <MetricCard
            title={isVi ? 'Đang mở' : 'Active'}
            value={openCount}
            className="h-full"
          />
          <MetricCard
            title={isVi ? 'Chờ chấm điểm' : 'Needs Grading'}
            value={stats.pendingTotal}
            className="h-full"
          />
          <MetricCard
            title={isVi ? 'Tỷ lệ nộp bài' : 'Turnout Rate'}
            value={stats.avgSubmission}
            suffix="%"
            className="h-full"
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      {!isLoading && !error && (
        <div className="teacher-filter-bar">
          <div className="teacher-pills">
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('all')}
            >
              {isVi ? 'Tất cả kỹ năng' : 'All Skills'}
              <span className="teacher-pill-badge">{assignments.length}</span>
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'writing' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('writing')}
            >
              <PenTool size={13} />
              Writing
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'speaking' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('speaking')}
            >
              <Mic size={13} />
              Speaking
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'reading' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('reading')}
            >
              <BookOpen size={13} />
              Reading
            </button>
            <button
              type="button"
              className={`teacher-pill ${skillFilter === 'listening' ? 'active' : ''}`}
              onClick={() => handleSkillFilterChange('listening')}
            >
              <Headphones size={13} />
              Listening
            </button>
          </div>

          <div className="teacher-pills teacher-status-pills" role="tablist" aria-label="Bộ lọc trạng thái bài tập">
            <button
              type="button"
              className={`teacher-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              {isVi ? 'Tất cả trạng thái' : 'All Statuses'}
            </button>
            <button
              type="button"
              className={`teacher-pill ${statusFilter === 'PUBLISHED' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('PUBLISHED');
                setCurrentPage(1);
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
              {isVi ? 'Đang mở' : 'Published'}
            </button>
            <button
              type="button"
              className={`teacher-pill ${statusFilter === 'CLOSED' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('CLOSED');
                setCurrentPage(1);
              }}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block mr-1.5" />
              {isVi ? 'Đã đóng' : 'Closed'}
            </button>
            <button
              type="button"
              className={`teacher-pill ${statusFilter === 'DRAFT' ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter('DRAFT');
                setCurrentPage(1);
              }}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mr-1.5" />
              {isVi ? 'Bản nháp' : 'Draft'}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            {t('teacherAssignments.filterStatusLabel')}
            <select
              className="select-input font-semibold text-sm"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as AssignmentStatus | 'all');
                setCurrentPage(1);
              }}
            >
              <option value="all">{t('teacherAssignments.filterAll')}</option>
              <option value="PUBLISHED">{t('teacherAssignments.statOpen')}</option>
              <option value="DRAFT">{t('teacherAssignments.filterDraft')}</option>
              <option value="CLOSED">{t('teacherAssignments.filterClosed')}</option>
            </select>
          </label>

          <div className="teacher-search-wrap">
            <Search size={15} className="teacher-search-icon" />
            <input
              type="text"
              className="teacher-search-input"
              placeholder={isVi ? 'Tìm bài tập theo tên hoặc mã HW...' : 'Search assignment or HW code...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Assignments List */}
      {!isLoading && !error && (
        <div className="teacher-assignments-list">
          {paginatedAssignments.map((item) => (
            <AssignmentCard
              key={`${item.classId}:${item.id}`}
              item={item}
              isVi={isVi}
              currentTimestamp={currentTimestamp}
              onViewDetails={() => navigate(`/teacher/assignments/${item.id}`)}
              onEdit={() => navigate(`/teacher/assignments/${item.id}/edit`)}
              onDelete={() => setAssignmentToDelete(item)}
              onViewSubmissions={() => navigate(`/teacher/assignments/${item.id}/submissions`)}
              onChangeLifecycle={handleRequestStatusChange}
              isUpdatingLifecycle={isUpdatingLifecycle || !isClassSnapshotCurrent}
            />
          ))}

          {filteredAssignments.length === 0 && (
            <EmptyState
              icon={FileText}
              title={isVi ? 'Chưa có bài tập nào' : 'No assignments found'}
              description={isVi ? 'Bạn có thể bắt đầu giao bài tập mới cho học viên trong lớp ngay bây giờ.' : 'You can create a new assignment for students in this class right now.'}
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowSkillModal(true)}
                >
                  {isVi ? 'Giao bài tập mới ngay' : 'Create Assignment Now'}
                </Button>
              }
            />
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && filteredAssignments.length > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={filteredAssignments.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          itemLabel={isVi ? 'bài tập' : 'assignments'}
          isVi={isVi}
          variant="standalone"
        />
      )}

      <ConfirmModal
        isOpen={statusAction !== null}
        trapFocus
        title={dialogCopy.title[locale]}
        message={dialogCopy.message[locale]}
        confirmText={dialogCopy.title[locale]}
        cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}
        closeLabel={isVi ? 'Đóng' : 'Close'}
        variant={statusAction?.action === 'close' ? 'danger' : 'primary'}
        isLoading={isUpdatingLifecycle}
        confirmDisabled={isUpdatingLifecycle || !isClassSnapshotCurrent || isDeadlineRejected || deadlineValidation?.valid === false}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => {
          if (!inFlightRef.current) setDialog(null);
        }}
      >
        {reopenAction && (
          <div className="mt-4">
            <label htmlFor={deadlineInputId} className="edit-form-label">
              {isVi ? 'Hạn nộp mới' : 'New deadline'}
            </label>
            <input
              id={deadlineInputId}
              className="edit-form-input"
              type="datetime-local"
              value={reopenAction.deadline.inputValue}
              onChange={handleDeadlineChange}
              required
              data-initial-focus
              disabled={isUpdatingLifecycle}
              aria-invalid={Boolean(deadlineError)}
              aria-describedby={deadlineError ? `${deadlineHelpId} ${deadlineErrorId}` : deadlineHelpId}
            />
            <p id={deadlineHelpId} className="text-xs text-muted">
              {isVi ? 'Chọn hạn nộp mới ở tương lai.' : 'Choose a new deadline in the future.'}
            </p>
            {deadlineError && (
              <p id={deadlineErrorId} className="text-xs text-danger" role="alert">{deadlineError[locale]}</p>
            )}
          </div>
        )}
      </ConfirmModal>

      {/* Skill Picker Modal */}
      {showSkillModal && (
        <div className="skill-modal-overlay" onClick={() => setShowSkillModal(false)}>
          <div className="skill-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="skill-modal-header">
              <h3 className="skill-modal-title">
                {isVi ? 'Chọn Loại Kỹ Năng Cần Giao Bài' : 'Select Assignment Skill Module'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowSkillModal(false)}
                className="skill-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <p className="skill-modal-desc">
              {isVi 
                ? 'Chọn 1 trong 4 kỹ năng tiếng Anh để thiết lập nội dung đề bài.' 
                : 'Select one of the 4 skills to configure assignment content.'}
            </p>

            <div className="skill-card-grid">
              {/* Writing */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('writing')}>
                <div className="skill-card-icon writing">
                  <PenTool size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Writing Task 1 & 2</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Bài luận học thuật, phân tích biểu đồ kèm bộ đếm từ và chấm điểm tự động.' : 'Academic essays & charts with word counters and auto-grammar check.'}
                  </p>
                </div>
              </div>

              {/* Speaking */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('speaking')}>
                <div className="skill-card-icon speaking">
                  <Mic size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Speaking Part 1, 2, 3</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Thu âm giọng nói trực tiếp, phân tích âm vị phát âm và độ trôi chảy AI.' : 'Audio recordings with AI fluency & phoneme accuracy analysis.'}
                  </p>
                </div>
              </div>

              {/* Reading */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('reading')}>
                <div className="skill-card-icon reading">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Reading Mock Passage</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Đề đọc hiểu 3 passage, câu hỏi Matching Headings, True/False/Not Given.' : 'Full reading passages with automated key checking and time tracker.'}
                  </p>
                </div>
              </div>

              {/* Listening */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('listening')}>
                <div className="skill-card-icon listening">
                  <Headphones size={22} />
                </div>
                <div>
                  <h4 className="m-0 mb-1 text-sm font-bold">Listening Section 1-4</h4>
                  <p className="m-0 text-xs text-muted leading-relaxed">
                    {isVi ? 'Tải lên audio bài nghe MP3, câu hỏi điền từ và phát hiện bẫy nghe.' : 'Upload MP3 audio files with transcripts and distractor markers.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSkillModal(false)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Assignment Confirmation Modal */}
      {assignmentToDelete && (
        <div 
          className="tad-modal-overlay modal-overlay" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="delete-assignment-modal-title"
          onClick={() => !isDeleting && setAssignmentToDelete(null)}
        >
          <div 
            className="tad-modal-box tad-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-assignment-modal-title" className="tad-modal-title">
              {isVi ? 'Xóa bài tập' : 'Delete Assignment'}
            </h3>
            <p className="tad-modal-description">
              {isVi 
                ? `Bạn có chắc chắn muốn xóa bài tập "${assignmentToDelete.title}" không? Bài tập này có thể đã có bài nộp của học viên. Xóa bài tập sẽ xóa mềm và ẩn toàn bộ dữ liệu bài tập và bài nộp liên quan.`
                : `Are you sure you want to delete "${assignmentToDelete.title}"? It may contain student submissions and associated data. Soft deleting will archive this assignment and its related submission data.`}
            </p>
            <div className="tad-modal-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isDeleting}
                onClick={() => setAssignmentToDelete(null)}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={isDeleting}
                disabled={isDeleting}
                onClick={handleConfirmDeleteAssignment}
              >
                {isVi ? 'Xác nhận' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
