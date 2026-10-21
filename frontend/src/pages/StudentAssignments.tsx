import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary, type AssignmentDetail } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, isSubmissionGraded, getSubmissionFinalScore } from '../api/services/submission.service';
import { 
  PenTool, 
  Mic, 
  BookOpen, 
  Headphones, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Search, 
  Calendar, 
  Sparkles, 
  Layers, 
  AlertCircle, 
  RefreshCw,
  GraduationCap,
  ChevronDown,
  X
} from 'lucide-react';
import { Button, MetricCard, EmptyState, Skeleton, Pagination } from '../components/common';
import '../styles/student-ecosystem.css';

type AssignmentDisplayStatus = 'not_started' | 'in_progress' | 'pending' | 'ai_processing' | 'graded';

interface StudentAssignmentDisplay {
  id: string | number;
  classId: string | number;
  className: string;
  title: string;
  type: string; // e.g. 'Writing', 'Speaking', 'Reading', 'Listening'
  status: AssignmentDisplayStatus;
  submissionId?: number;
  submittedOn?: string;
  deadline?: string;
  teacherName?: string;
  score?: number;
  accuracy?: string;
  aiScore?: number;
  daysLeft?: number;
  requirement?: string;
}

const StudentAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [rawAssignments, setRawAssignments] = useState<StudentAssignmentDisplay[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'not_started' | 'grading' | 'graded'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleStatusFilterChange = (status: 'all' | 'not_started' | 'grading' | 'graded') => {
    setActiveStatusFilter(status);
    setCurrentPage(1);
  };

  const handleClassFilterChange = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const [reloadKey, setReloadKey] = useState(0);
  const handleRetry = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const fetchAssignmentsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch student's classes
        const classRes = await classService.list({ limit: 50 });
        const fetchedClasses = classRes.data || [];
        if (isMounted) setClasses(fetchedClasses);

        // 2. Fetch assignments across all enrolled classes
        const assignmentPromises = fetchedClasses.map(async (cls) => {
          try {
            const res = await assignmentService.listAssignments(cls.id, { limit: 50 });
            const items = res.data || [];
            return await Promise.all(
              items.map(async (a: AssignmentSummary): Promise<StudentAssignmentDisplay> => {
                let matchedSub: SubmissionListItem | undefined = undefined;
                if (user?.id) {
                  try {
                    const subRes = await submissionService.listSubmissions({
                      assignmentId: a.id,
                      studentId: user.id,
                      limit: 1
                    });
                    if (subRes.data && subRes.data.length > 0) {
                      matchedSub = subRes.data[0];
                    }
                  } catch {
                    // Fallback
                  }
                }

                let displayStatus: AssignmentDisplayStatus = 'not_started';
                let score: number | undefined = undefined;

                if (matchedSub) {
                  if (isSubmissionGraded(matchedSub)) {
                    displayStatus = 'graded';
                    const finalSc = getSubmissionFinalScore(matchedSub);
                    score = finalSc !== null && finalSc !== undefined ? finalSc : undefined;
                  } else if (matchedSub.status === 'SUBMITTED') {
                    displayStatus = 'pending';
                  } else if (matchedSub.status === 'IN_PROGRESS') {
                    displayStatus = a.status === 'CLOSED' ? 'not_started' : 'in_progress';
                  }
                }

                // Fetch assignment details to determine exact skill module
                let detail: AssignmentDetail | null = null;
                try {
                  detail = await assignmentService.getAssignment(a.id);
                } catch {
                  // Fallback to title
                }

                // Determine skill type from module or title fallback
                let skillType = 'General Task';
                const modSkill = detail?.modules?.[0]?.skill?.toUpperCase();
                if (modSkill === 'SPEAKING') {
                  skillType = 'Speaking';
                } else if (modSkill === 'WRITING') {
                  skillType = 'Writing';
                } else if (modSkill === 'READING') {
                  skillType = 'Reading';
                } else if (modSkill === 'LISTENING') {
                  skillType = 'Listening';
                } else {
                  const lowerTitle = a.title.toLowerCase();
                  if (lowerTitle.includes('speaking') || lowerTitle.includes('nói')) skillType = 'Speaking';
                  else if (lowerTitle.includes('writing') || lowerTitle.includes('viết') || lowerTitle.includes('essay')) skillType = 'Writing';
                  else if (lowerTitle.includes('reading') || lowerTitle.includes('đọc')) skillType = 'Reading';
                  else if (lowerTitle.includes('listening') || lowerTitle.includes('nghe')) skillType = 'Listening';
                }

                // Calculate days left
                let daysLeft = 3;
                if (a.closeAt) {
                  const diffMs = new Date(a.closeAt).getTime() - Date.now();
                  daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                }

                return {
                  id: a.id,
                  classId: String(cls.id),
                  className: cls.name,
                  title: a.title,
                  type: skillType,
                  status: displayStatus,
                  submissionId: matchedSub?.id,
                  submittedOn: matchedSub?.submittedAt ? new Date(matchedSub.submittedAt).toLocaleDateString('vi-VN') : undefined,
                  deadline: a.closeAt ? new Date(a.closeAt).toLocaleDateString('vi-VN') : undefined,
                  teacherName: 'Giảng viên phụ trách',
                  score,
                  daysLeft,
                };
              })
            );
          } catch {
            return [];
          }
        });

        const assignmentResults = await Promise.all(assignmentPromises);
        const combined = assignmentResults.flat();
        if (isMounted) setRawAssignments(combined);
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài tập. Vui lòng thử lại.';
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchAssignmentsData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, reloadKey]);

  const getAssignmentRoute = (assignment: StudentAssignmentDisplay) => {
    const typeLower = assignment.type.toLowerCase();
    if (typeLower.includes('speaking')) {
      return `/student/assignments/speaking/${assignment.id}`;
    }
    if (typeLower.includes('reading')) {
      return `/student/assignments/reading/${assignment.id}`;
    }
    if (typeLower.includes('listening')) {
      return `/student/assignments/listening/${assignment.id}`;
    }
    if (typeLower.includes('writing')) {
      return `/student/assignments/${assignment.id}`;
    }
    return `/student/assignments/${assignment.id}/overview`;
  };

  // Filtered by class & search query & status filter
  const filteredAssignments = useMemo(() => {
    return rawAssignments.filter((a) => {
      const matchClass = selectedClassId === 'all' || String(a.classId) === String(selectedClassId);
      const matchSearch = searchQuery.trim() === '' || 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.teacherName && a.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let matchStatus = true;
      if (activeStatusFilter === 'not_started') {
        matchStatus = a.status === 'not_started';
      } else if (activeStatusFilter === 'grading') {
        matchStatus = a.status === 'pending' || a.status === 'ai_processing' || a.status === 'in_progress';
      } else if (activeStatusFilter === 'graded') {
        matchStatus = a.status === 'graded';
      }

      return matchClass && matchSearch && matchStatus;
    });
  }, [rawAssignments, selectedClassId, searchQuery, activeStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAssignments.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedAssignments = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredAssignments.slice(start, start + pageSize);
  }, [filteredAssignments, safeCurrentPage, pageSize]);

  // Overall counts for stats cards based on class filter
  const classAssignments = useMemo(() => {
    return selectedClassId === 'all' 
      ? rawAssignments 
      : rawAssignments.filter(a => String(a.classId) === String(selectedClassId));
  }, [rawAssignments, selectedClassId]);

  const stats = {
    notStarted: classAssignments.filter(a => a.status === 'not_started').length,
    grading: classAssignments.filter(a => a.status === 'pending' || a.status === 'ai_processing' || a.status === 'in_progress').length,
    graded: classAssignments.filter(a => a.status === 'graded').length,
  };

  const selectedClass = classes.find(c => String(c.id) === String(selectedClassId));

  // Helper to render type icons & colors
  const getTypeBadge = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('writing')) {
      return {
        icon: <PenTool size={18} strokeWidth={2.2} />,
        skillClass: 'writing',
        label: type
      };
    }
    if (lower.includes('speaking')) {
      return {
        icon: <Mic size={18} strokeWidth={2.2} />,
        skillClass: 'speaking',
        label: type
      };
    }
    if (lower.includes('reading')) {
      return {
        icon: <BookOpen size={18} strokeWidth={2.2} />,
        skillClass: 'reading',
        label: type
      };
    }
    if (lower.includes('listening')) {
      return {
        icon: <Headphones size={18} strokeWidth={2.2} />,
        skillClass: 'listening',
        label: type
      };
    }
    return {
      icon: <FileText size={18} strokeWidth={2.2} />,
      skillClass: 'default',
      label: type
    };
  };

  return (
    <div className="std-eco-container">
      {/* 1. Page Header */}
      <div className="std-eco-header">
        <div className="std-eco-header-main">
          <div className="std-eco-breadcrumb">
            <span>{t('studentPortal') || 'Cổng Học viên'}</span>
            <span className="std-eco-breadcrumb-separator">/</span>
            <span className="current">{t('studentAssignments.title')}</span>
          </div>
          <h1 className="std-eco-title">
            <span>{t('studentAssignments.title')}</span>
          </h1>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="analytics-error-banner">
          <div className="flex items-center gap-10">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRetry}
            icon={<RefreshCw size={14} />}
          >
            {t('studentAssignments.retry')}
          </Button>
        </div>
      )}

      {/* 2. Top Summary Stat Cards */}
      <div className="std-asg-stats-grid">
        <MetricCard
          title={t('studentAssignments.statNotStarted')}
          value={isLoading ? '...' : stats.notStarted}
        />
        <MetricCard
          title={t('studentAssignments.statGrading')}
          value={isLoading ? '...' : stats.grading}
        />
        <MetricCard
          title={t('studentAssignments.statGraded')}
          value={isLoading ? '...' : stats.graded}
        />
      </div>

      {/* 3. Filter Toolbar */}
      <div className="std-asg-toolbar">
        {/* Status Pills */}
        <div className="std-eco-pills">
          <button
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className={`std-eco-pill ${activeStatusFilter === 'all' ? 'active' : ''}`}
          >
            {t('studentAssignments.tabAll')} <span className="std-eco-pill-badge">{classAssignments.length}</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('not_started')}
            className={`std-eco-pill ${activeStatusFilter === 'not_started' ? 'active' : ''}`}
          >
            {t('studentAssignments.tabNotStarted')} <span className="std-eco-pill-badge">{stats.notStarted}</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('grading')}
            className={`std-eco-pill ${activeStatusFilter === 'grading' ? 'active' : ''}`}
          >
            {t('studentAssignments.tabGrading')} <span className="std-eco-pill-badge">{stats.grading}</span>
          </button>

          <button
            type="button"
            onClick={() => handleStatusFilterChange('graded')}
            className={`std-eco-pill ${activeStatusFilter === 'graded' ? 'active' : ''}`}
          >
            {t('studentAssignments.tabGraded')} <span className="std-eco-pill-badge">{stats.graded}</span>
          </button>
        </div>

        {/* Search & Class Dropdown */}
        <div className="std-asg-toolbar-right">
          <div className={`std-asg-select-wrap ${selectedClassId !== 'all' ? 'has-value' : ''}`}>
            <GraduationCap size={15} className="std-asg-select-icon" />
            <select
              id="student-class-select"
              value={selectedClassId}
              onChange={(e) => handleClassFilterChange(e.target.value)}
              className={`std-asg-select ${selectedClassId !== 'all' ? 'has-value' : ''}`}
              aria-label={t('studentAssignments.filterClassLabel')}
            >
              <option value="all">{t('studentAssignments.filterAllClasses')}</option>
              {classes.map(c => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="std-asg-select-arrow" />
          </div>

          <div className="std-eco-search-wrap">
            <Search size={15} className="std-eco-search-icon" />
            <input
              type="text"
              placeholder={t('studentAssignments.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="std-eco-search-input"
            />
          </div>
        </div>
      </div>

      {/* Selected Class Filter Pill */}
      {selectedClass && (
        <div className="std-asg-active-class-bar">
          <span className="std-asg-active-class-chip">
            <Layers size={13} />
            <span>{t('studentAssignments.viewingClassPrefix')}<strong>{selectedClass.name}</strong></span>
            <button 
              type="button"
              onClick={() => handleClassFilterChange('all')}
              className="std-asg-clear-class-btn"
              title="Xem tất cả lớp"
              aria-label="Xóa bộ lọc lớp"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        </div>
      )}

      {/* 4. Assignments List */}
      <div className="std-asg-list">
        {isLoading ? (
          <div className="flex flex-col gap-12">
            <Skeleton height="88px" borderRadius="12px" />
            <Skeleton height="88px" borderRadius="12px" />
            <Skeleton height="88px" borderRadius="12px" />
          </div>
        ) : filteredAssignments.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title={t('studentAssignments.emptyTitle')}
            description={t('studentAssignments.emptyDesc')}
          />
        ) : (
          paginatedAssignments.map((assignment) => {
            const badge = getTypeBadge(assignment.type);
            const handleAction = () => {
              if (assignment.status === 'graded') {
                navigate(assignment.submissionId ? `/student/submissions/${assignment.submissionId}` : `/student/assignments/${assignment.id}/result`);
              } else if (assignment.status === 'not_started') {
                navigate(`/student/assignments/${assignment.id}/overview`);
              } else {
                navigate(getAssignmentRoute(assignment));
              }
            };

            return (
              <div
                key={assignment.id}
                onClick={handleAction}
                className="std-asg-card"
              >
                {/* Left: Icon & Info */}
                <div className="std-asg-card-left">
                  <div className={`std-asg-icon-box ${badge.skillClass}`}>
                    {badge.icon}
                  </div>

                  <div className="std-asg-card-content">
                    <div className="std-asg-card-header-row">
                      <span className={`std-skill-tag ${badge.skillClass}`}>
                        {assignment.type}
                      </span>
                      <span className="std-asg-class-pill">
                        <BookOpen size={11} />
                        <span>{assignment.className}</span>
                      </span>
                    </div>

                    <h3 className="std-asg-card-title">
                      {assignment.title}
                    </h3>

                    {/* Metadata & Deadlines */}
                    <div className="std-asg-card-meta">
                      {assignment.submittedOn ? (
                        <span className="std-asg-meta-item text-success">
                          <CheckCircle2 size={13} />
                          <span>{t('studentAssignments.submittedOn')}{assignment.submittedOn}</span>
                        </span>
                      ) : (
                        <span className={`std-asg-meta-item ${assignment.daysLeft !== undefined && assignment.daysLeft <= 2 ? 'urgent' : ''}`}>
                          <Calendar size={13} />
                          <span>{t('studentAssignments.deadlinePrefix')}{assignment.deadline || t('studentAssignments.noDeadline')}</span>
                          {assignment.daysLeft !== undefined && assignment.daysLeft > 0 && assignment.daysLeft <= 3 && (
                            <span className="std-asg-urgent-badge">
                              {assignment.daysLeft === 1 ? 'Hôm nay' : `Còn ${assignment.daysLeft} ngày`}
                            </span>
                          )}
                        </span>
                      )}

                      {assignment.score !== undefined && (
                        <span className="std-asg-score-badge">
                          <Sparkles size={11} />
                          <span>{t('studentAssignments.scorePrefix')}{assignment.score}/100 • Band {(assignment.score / 100 * 9).toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Clean Status Badge & Action */}
                <div className="std-asg-card-right">
                  {(assignment.status === 'pending' || assignment.status === 'ai_processing') && (
                    <div className="std-asg-status-badge grading">
                      <span className="std-asg-dot" />
                      {t('studentAssignments.statusGrading')}
                    </div>
                  )}

                  {assignment.status === 'in_progress' && (
                    <div className="std-asg-status-badge in_progress">
                      <Clock size={12} />
                      {t('studentAssignments.statusInProgress')}
                    </div>
                  )}

                  {assignment.status === 'graded' && (
                    <div className="std-asg-status-badge graded">
                      <CheckCircle2 size={13} strokeWidth={2.2} />
                      {t('studentAssignments.tabGraded')}
                    </div>
                  )}

                  {assignment.status === 'not_started' && (
                    <div className="std-asg-status-badge not_started">
                      <Clock size={13} strokeWidth={2} />
                      {t('studentAssignments.tabNotStarted')}
                    </div>
                  )}

                  <Button
                    variant={assignment.status === 'not_started' ? 'primary' : 'secondary'}
                    size="sm"
                    className="std-asg-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction();
                    }}
                  >
                    {assignment.status === 'not_started'
                      ? t('studentAssignments.btnStartNow')
                      : assignment.status === 'graded'
                        ? t('studentAssignments.btnFeedback')
                        : assignment.status === 'in_progress'
                          ? t('studentAssignments.btnContinue')
                          : t('studentAssignments.btnReview')}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Pagination */}
      {!isLoading && filteredAssignments.length > 0 && (
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
    </div>
  );
};

export default StudentAssignments;
