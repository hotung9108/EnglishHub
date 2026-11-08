import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, FileText, Search, Bell, 
  RefreshCw, AlertCircle, CheckCircle2, Lock,
  Users, Clock, Award
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import {
  submissionService,
  type SubmissionListItem,
  isSubmissionGraded,
  getSubmissionFinalScore
} from '../api/services/submission.service';
import { Button, EmptyState, Pagination, MetricCard, LoadingState } from '../components/common';

interface EnrolledStudentSubmissionRow {
  studentId: number;
  code: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  status: 'submitted' | 'in_progress' | 'missing';
  gradingStatus: 'graded' | 'pending' | 'none';
  submissionId?: number;
  finalScore?: number | null;
}

export const TeacherAssignmentGrading: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { id } = useParams<{ id: string }>();

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const { user } = useAuth();
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [currentClass, setCurrentClass] = useState<ClassSummary | null>(null);

  const isOwner = useMemo(() => {
    if (!user || user.role !== 'teacher') return false;
    if (currentClass) {
      return currentClass.teacherId ? currentClass.teacherId === user.id : true;
    }
    return true;
  }, [user, currentClass]);

  // Data
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [className, setClassName] = useState<string>('');
  const [closeAtDate, setCloseAtDate] = useState<string>('');
  const [students, setStudents] = useState<EnrolledStudentSubmissionRow[]>([]);

  // Filter tabs
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'missing'>('all');
  const [subTab, setSubTab] = useState<'all' | 'graded' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleActiveTabChange = (tab: 'all' | 'submitted' | 'missing') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSubTabChange = (sub: 'all' | 'graded' | 'pending') => {
    setSubTab(sub);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCloseModal = () => {
    if (!assignment || assignment.status !== 'PUBLISHED' || !isOwner) return;
    setShowCloseModal(true);
  };

  const handleConfirmClose = async () => {
    if (!assignment || assignment.status !== 'PUBLISHED' || !isOwner) return;

    setIsClosing(true);
    try {
      const response = await assignmentService.updateAssignmentStatus(assignment.id, 'CLOSED');
      setAssignment((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      setStudents((prev) =>
        prev.map((s) => (s.status === 'in_progress' ? { ...s, status: 'missing' } : s))
      );
      setShowCloseModal(false);
      showToast(response?.message || (isVi ? 'Đã đóng bài tập thành công.' : 'Assignment closed successfully.'));
    } catch (err: unknown) {
      console.error('Failed to close assignment:', err);
      let errorMsg = isVi ? 'Không thể đóng bài tập. Vui lòng thử lại.' : 'Failed to close assignment. Please retry.';
      if (err && typeof err === 'object') {
        const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
        if (apiErr.response?.data?.message) {
          errorMsg = apiErr.response.data.message;
        } else if (apiErr.message) {
          errorMsg = apiErr.message;
        }
      }
      showToast(errorMsg);
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    if (!showCloseModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isClosing) {
        setShowCloseModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCloseModal, isClosing]);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const fetchData = async () => {
      try {
        const assignmentIdNum = Number(id);

        const [assignRes, classRes, subRes] = await Promise.allSettled([
          assignmentService.getAssignment(assignmentIdNum),
          classService.list({ limit: 100 }),
          submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 })
        ]);

        if (!isMounted) return;

        const assignDetail = assignRes.status === 'fulfilled' ? assignRes.value : null;
        if (assignDetail) setAssignment(assignDetail);

        const classesList = classRes.status === 'fulfilled' ? (classRes.value.data || []) : [];
        const submissionsList: SubmissionListItem[] = subRes.status === 'fulfilled' ? (subRes.value.data || []) : [];

        // Match assignment with classroom
        const classAssignmentsResults = await Promise.all(
          classesList.map(async (cls) => {
            try {
              const assignList = await assignmentService.listAssignments(cls.id, { limit: 100 });
              const matched = assignList.data?.find((a) => a.id === assignmentIdNum);
              return { cls, matched };
            } catch {
              return { cls, matched: undefined };
            }
          })
        );

        const foundMatch = classAssignmentsResults.find((r) => r.matched);
        const matchedClass = foundMatch?.cls;
        if (foundMatch?.matched?.closeAt) {
          const d = new Date(foundMatch.matched.closeAt);
          setCloseAtDate(d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }));
        } else if (assignDetail?.closeAt) {
          const d = new Date(assignDetail.closeAt);
          setCloseAtDate(d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }));
        }

        if (matchedClass) {
          setCurrentClass(matchedClass);
          setClassName(matchedClass.name);
        } else {
          setClassName(isVi ? 'Tất cả các lớp' : 'All Classes');
        }

        // Fetch Class Members
        let members: ClassMember[] = [];
        if (matchedClass) {
          try {
            members = await classService.listMembers(matchedClass.id);
          } catch {
            members = [];
          }
        }

        // Map Students
        const bgColors = ['#fef3c7', '#dcfce7', '#e0e7ff', '#f3e8ff', '#fee2e2', '#ccfbf1'];
        const textColors = ['#b45309', '#15803d', '#4338ca', '#7e22ce', '#b91c1c', '#0f766e'];

        const studentRows: EnrolledStudentSubmissionRow[] = members.map((member, idx) => {
          const colorIndex = idx % bgColors.length;
          const cleanName = member.fullName.trim();
          const nameParts = cleanName.split(/\s+/).filter(Boolean);
          const initials = nameParts.length === 1
            ? nameParts[0].substring(0, 2).toUpperCase()
            : (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();

          const matchedSub = submissionsList.find((s) => s.studentId === member.studentId);

          let status: 'submitted' | 'in_progress' | 'missing';
          let gradingStatus: 'graded' | 'pending' | 'none';
          let finalScore: number | null = null;

          if (!matchedSub) {
            status = 'missing';
            gradingStatus = 'none';
          } else if (matchedSub.status === 'IN_PROGRESS') {
            status = assignDetail?.status === 'CLOSED' ? 'missing' : 'in_progress';
            gradingStatus = 'none';
          } else {
            status = 'submitted';
            if (isSubmissionGraded(matchedSub)) {
              gradingStatus = 'graded';
              finalScore = getSubmissionFinalScore(matchedSub);
            } else {
              gradingStatus = 'pending';
            }
          }

          return {
            studentId: member.studentId,
            code: member.studentCode || `HV-${member.studentId.toString().padStart(4, '0')}`,
            name: member.fullName,
            initials,
            avatarBg: bgColors[colorIndex],
            avatarColor: textColors[colorIndex],
            status,
            gradingStatus,
            submissionId: matchedSub?.id,
            finalScore
          };
        });

        if (isMounted) {
          setStudents(studentRows);
        }
      } catch (err) {
        console.error('Failed to load assignment submissions:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải danh sách bài nộp. Vui lòng thử lại.' : 'Failed to load submissions. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, isVi, reloadKey]);

  // Dynamic Metrics calculations
  const metrics = useMemo(() => {
    const totalStudents = Math.max(1, students.length);
    const submittedCount = students.filter((s) => s.status === 'submitted').length;
    const inProgressCount = students.filter((s) => s.status === 'in_progress').length;
    const missingCount = students.filter((s) => s.status !== 'submitted').length;
    const gradedCount = students.filter((s) => s.gradingStatus === 'graded').length;
    const pendingCount = students.filter((s) => s.gradingStatus === 'pending').length;

    const scores = students
      .map((s) => s.finalScore)
      .filter((sc): sc is number => sc !== null && sc !== undefined && sc > 0);

    const avgBand = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '0.0';

    const gradedPercentage = submittedCount > 0 
      ? Math.round((gradedCount / submittedCount) * 100) 
      : 0;

    return {
      totalStudents,
      submittedCount,
      inProgressCount,
      missingCount,
      gradedCount,
      pendingCount,
      avgBand,
      gradedPercentage
    };
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (activeTab === 'submitted' && s.status !== 'submitted') return false;
      if (activeTab === 'missing' && s.status === 'submitted') return false;

      if (subTab === 'graded' && s.gradingStatus !== 'graded') return false;
      if (subTab === 'pending' && s.gradingStatus !== 'pending') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
      }

      return true;
    });
  }, [students, activeTab, subTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, safeCurrentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="teacher-container py-6">
        <LoadingState 
          title={isVi ? 'Đang tải dữ liệu bài nộp & chấm điểm...' : 'Loading submissions & grading...'}
          description={isVi ? 'Đang đồng bộ danh sách học viên, trạng thái nộp bài và kết quả chấm.' : 'Syncing student roster, submissions, and grading evaluations.'}
        />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="teacher-container py-6">
        <div className="adm-alert-error max-w-xl mx-auto my-8">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={24} className="text-danger flex-shrink-0" />
            <h3 className="m-0 text-sm font-bold text-danger">
              {error || (isVi ? 'Không tìm thấy bài tập này.' : 'Assignment not found.')}
            </h3>
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
      </div>
    );
  }

  return (
    <div className="teacher-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="tad-toast">
          <CheckCircle2 size={16} className="text-secondary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unified Hero Header Card */}
      <section className="teacher-page-hero">
        <div className="teacher-hero-content">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <button 
                type="button"
                onClick={() => navigate('/teacher/assignments')}
                className="tad-back-btn"
              >
                <ArrowLeft size={14} />
                <span>{isVi ? 'Quản lý bài tập' : 'Assignments'}</span>
              </button>
              <span className="text-muted text-xs">•</span>
              <button 
                type="button"
                onClick={() => navigate(`/teacher/assignments/${id}`)}
                className="tad-back-btn text-primary hover:underline"
              >
                <FileText size={13} />
                <span>{isVi ? 'Xem đề bài' : 'View Spec'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="teacher-hero-title">
                {isVi ? 'Quản lý bài nộp & Chấm điểm:' : 'Grading & Turnout:'} {assignment.title}
              </h1>
              <span className={`tcd-status-badge ${assignment.status === 'PUBLISHED' ? 'active' : 'completed'}`}>
                {assignment.status === 'PUBLISHED' 
                  ? t('assignmentDetails.statusOpen') 
                  : assignment.status === 'CLOSED'
                    ? t('assignmentDetails.statusClosed')
                    : assignment.status}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted">
              <span className="font-semibold text-main">
                {t('assignmentDetails.classPrefix')}{className || (isVi ? 'Tất cả các lớp' : 'All Classes')}
              </span>
              <span>•</span>
              <span>{isVi ? 'Hạn nộp:' : 'Deadline:'} <strong className="text-main font-semibold">{closeAtDate || (isVi ? 'Không thời hạn' : 'No deadline')}</strong></span>
            </div>
          </div>

          <div className="teacher-hero-actions">
            <Button 
              variant="secondary"
              size="sm"
              icon={FileText}
              onClick={() => navigate(`/teacher/assignments/${id}`)}
            >
              {isVi ? 'Xem nội dung đề bài' : 'View Exam Content'}
            </Button>

            {isOwner && (
              <Button 
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => navigate(`/teacher/assignments/${id}/edit`)}
              >
                {t('assignmentDetails.btnEdit')}
              </Button>
            )}

            {isOwner && (
              <Button 
                variant="secondary"
                size="sm"
                icon={Lock}
                disabled={assignment.status !== 'PUBLISHED' || isClosing}
                loading={isClosing}
                onClick={handleOpenCloseModal}
                title={assignment.status === 'CLOSED' ? (isVi ? 'Bài tập này đã đóng' : 'Assignment is already closed') : undefined}
              >
                {t('assignmentDetails.btnClose')}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Top Metric Cards */}
      <div className="teacher-stats-grid mb-6">
        <MetricCard
          title={isVi ? 'Tiến độ nộp bài' : 'Turnout'}
          value={`${metrics.submittedCount}/${metrics.totalStudents}`}
          suffix={metrics.totalStudents > 0 ? ` (${Math.round((metrics.submittedCount / metrics.totalStudents) * 100)}%)` : ''}
          icon={Users}
          iconBgColor="var(--primary-light, #eaf0e8)"
          iconColor="var(--primary, #1b4d3e)"
          className="h-full"
        />
        <MetricCard
          title={isVi ? 'Đã chấm điểm' : 'Graded Submissions'}
          value={`${metrics.gradedCount}/${metrics.submittedCount}`}
          suffix={metrics.submittedCount > 0 ? ` (${metrics.gradedPercentage}%)` : ''}
          icon={CheckCircle2}
          iconBgColor="var(--secondary-container, #e7f3ec)"
          iconColor="var(--secondary, #16a34a)"
          className="h-full"
        />
        <MetricCard
          title={isVi ? 'Chờ chấm bài' : 'Needs Grading'}
          value={metrics.pendingCount}
          suffix={isVi ? ' bài' : ' subs'}
          icon={Clock}
          iconBgColor="var(--tertiary-container, #fbf4e6)"
          iconColor="var(--tertiary, #8c5e14)"
          className="h-full"
        />
        <MetricCard
          title={isVi ? 'Điểm trung bình' : 'Average Score'}
          value={metrics.avgBand !== '0.0' ? metrics.avgBand : '—'}
          suffix="/10"
          icon={Award}
          iconBgColor="#f3eefa"
          iconColor="#5b21b6"
          className="h-full"
        />
      </div>

      {/* Students Submissions List */}
      <div className="eh-card p-0 overflow-hidden mb-6">
        {/* Filter and Search Bar */}
        <div className="teacher-filter-bar border-0 border-b border-outline-variant rounded-none mb-0 bg-surface">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Turnout Pills */}
            <div className="teacher-pills">
              <button
                type="button"
                onClick={() => handleActiveTabChange('all')}
                className={`teacher-pill ${activeTab === 'all' ? 'active' : ''}`}
              >
                {t('assignmentDetails.tabAll')}
                <span className="teacher-pill-badge">{students.length}</span>
              </button>
              <button
                type="button"
                onClick={() => handleActiveTabChange('submitted')}
                className={`teacher-pill ${activeTab === 'submitted' ? 'active' : ''}`}
              >
                {t('assignmentDetails.tabSubmitted')}
                <span className="teacher-pill-badge">{metrics.submittedCount}</span>
              </button>
              <button
                type="button"
                onClick={() => handleActiveTabChange('missing')}
                className={`teacher-pill ${activeTab === 'missing' ? 'active' : ''}`}
              >
                {t('assignmentDetails.tabMissing')}
                <span className="teacher-pill-badge">{metrics.missingCount}</span>
              </button>
            </div>

            {/* Subtle Divider */}
            <div className="hidden md:block w-px h-5 bg-outline-variant" />

            {/* Grading Sub-pills */}
            <div className="teacher-pills">
              <button
                type="button"
                onClick={() => handleSubTabChange('all')}
                className={`teacher-pill ${subTab === 'all' ? 'active' : ''}`}
              >
                {isVi ? 'Tất cả trạng thái chấm' : 'All Grading'}
              </button>
              <button
                type="button"
                onClick={() => handleSubTabChange('graded')}
                className={`teacher-pill ${subTab === 'graded' ? 'active' : ''}`}
              >
                {t('assignmentDetails.subTabGraded')}
                <span className="teacher-pill-badge">{metrics.gradedCount}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSubTabChange('pending')}
                className={`teacher-pill ${subTab === 'pending' ? 'active' : ''}`}
              >
                {t('assignmentDetails.subTabPending')}
                <span className="teacher-pill-badge">{metrics.pendingCount}</span>
              </button>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="teacher-search-wrap">
              <Search size={15} className="teacher-search-icon" />
              <input
                type="text"
                placeholder={t('assignmentDetails.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="teacher-search-input"
              />
            </div>

            {metrics.missingCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={Bell}
                onClick={() => showToast(isVi ? `Đã gửi thông báo nhắc nộp bài tới ${metrics.missingCount} học viên` : `Sent reminders to ${metrics.missingCount} students`)}
              >
                {t('assignmentDetails.btnRemind')} ({metrics.missingCount}{t('assignmentDetails.unitFriends')})
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="tad-table">
            <thead>
              <tr>
                <th>{t('assignmentDetails.colStudent')}</th>
                <th>{t('assignmentDetails.colStatus')}</th>
                <th>{t('assignmentDetails.colGrading')}</th>
                <th className="text-right">{t('assignmentDetails.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={student.studentId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div 
                        className="tad-avatar"
                        style={{ backgroundColor: student.avatarBg, color: student.avatarColor }}
                      >
                        {student.initials}
                      </div>
                      <div>
                        <div className="font-bold text-main text-sm">{student.name}</div>
                        <div className="text-muted text-xs font-mono">{student.code}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {student.status === 'submitted' ? (
                      <span className="tad-badge-submitted">
                        <div className="tad-badge-dot submitted" />
                        {t('assignmentDetails.statusSubmittedLabel')}
                      </span>
                    ) : student.status === 'in_progress' ? (
                      <span className="tad-badge-in-progress">
                        <div className="tad-badge-dot in-progress" />
                        {t('assignmentDetails.statusInProgressLabel')}
                      </span>
                    ) : (
                      <span className="tad-badge-missing">
                        <div className="tad-badge-dot missing" />
                        {t('assignmentDetails.statusMissingLabel')}
                      </span>
                    )}
                  </td>
                  <td>
                    {student.gradingStatus === 'graded' && (
                      <span className="tad-grading-graded">
                        {t('assignmentDetails.gradingGraded')} {student.finalScore !== null && `(${student.finalScore}/10)`}
                      </span>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <span className="tad-grading-pending">
                        {t('assignmentDetails.gradingPending')}
                      </span>
                    )}
                    {student.gradingStatus === 'none' && (
                      <span className="text-muted text-xs font-medium">{t('assignmentDetails.gradingNone')}</span>
                    )}
                  </td>
                  <td className="text-right">
                    {student.gradingStatus === 'graded' && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.studentId}`, {
                          state: {
                            studentName: student.name,
                            studentCode: student.code
                          }
                        })}
                      >
                        {t('assignmentDetails.btnView')}
                      </Button>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.studentId}`, {
                          state: {
                            studentName: student.name,
                            studentCode: student.code
                          }
                        })}
                      >
                        {t('assignmentDetails.btnGradeNow')}
                      </Button>
                    )}
                    {student.gradingStatus === 'none' && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => showToast(isVi ? `Đã gửi nhắc nhở tới ${student.name}` : `Reminder sent to ${student.name}`)}
                      >
                        {t('assignmentDetails.btnSendReminder')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={AlertCircle}
                      title={isVi ? 'Không tìm thấy học viên phù hợp.' : 'No students match your filter.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredStudents.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel={isVi ? 'học viên' : 'students'}
            isVi={isVi}
            variant="table"
          />
        )}
      </div>

      {/* Confirmation Modal for Closing Assignment */}
      {showCloseModal && (
        <div 
          className="tad-modal-overlay" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="close-modal-title"
          onClick={() => !isClosing && setShowCloseModal(false)}
        >
          <div 
            className="tad-modal-box" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="close-modal-title" className="tad-modal-title">
              {isVi ? 'Đóng bài tập' : 'Close Assignment'}
            </h3>
            <p className="tad-modal-description">
              {isVi 
                ? 'Bạn có chắc chắn muốn đóng bài tập này không? Học viên sẽ không thể nộp bài sau khi đóng.'
                : 'Are you sure you want to close this assignment? Students will not be able to submit after closing.'}
            </p>
            <div className="tad-modal-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isClosing}
                onClick={() => setShowCloseModal(false)}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={isClosing}
                disabled={isClosing}
                onClick={handleConfirmClose}
              >
                {isVi ? 'Đóng bài tập' : 'Close Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentGrading;
