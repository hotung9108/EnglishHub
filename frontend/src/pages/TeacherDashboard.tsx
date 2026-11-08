import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, ClipboardList, Plus, 
  CheckCircle2, 
  PenTool, Mic, Headphones,
  ChevronRight, ChevronLeft, AlertCircle,
  RefreshCw, CheckSquare, Clock,
  Sparkles, GraduationCap, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { classService, type ClassSummary, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, type SubmissionModuleSummary, isSubmissionGraded } from '../api/services/submission.service';
import type { 
  TeacherSkill, 
  TeacherPendingSubmission, 
  TeacherActiveAssignment,
  TeacherClassSummary
} from '../types/teacher-dashboard.types';
import { Button, EmptyState, LoadingState } from '../components/common';
import '../styles/teacher-dashboard.css';

interface EnrichedClassData {
  summary: ClassSummary;
  members: ClassMember[];
  assignments: AssignmentSummary[];
  submissions: SubmissionListItem[];
}

const QUEUE_PAGE_SIZE = 4;

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { user } = useAuth();

  const teacherName = user?.fullName || (isVi ? 'Quý Thầy/Cô' : 'Instructor');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Raw fetched data
  const [enrichedClasses, setEnrichedClasses] = useState<EnrichedClassData[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [queuePage, setQueuePage] = useState<number>(1);

  const [currentTimestamp] = useState(() => Date.now());

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        // 1. Fetch teacher classes
        const classRes = await classService.list({ limit: 50 });
        const allClasses = classRes.data || [];
        
        // Filter for teacher's classes if user is teacher, otherwise take active classes
        const targetClasses = allClasses.filter((c) => {
          if (user?.id && c.teacherId && c.teacherId === user.id) {
            return true;
          }
          return c.status === 'ACTIVE';
        });

        const effectiveClasses = targetClasses.length > 0 ? targetClasses : allClasses.slice(0, 10);

        // 2. Fetch members, assignments and submissions for each class in parallel
        const enriched = await Promise.all(
          effectiveClasses.map(async (cls): Promise<EnrichedClassData> => {
            const [members, assignRes, rawSubmissions] = await Promise.all([
              classService.listMembers(cls.id).catch(() => [] as ClassMember[]),
              assignmentService.listAssignments(cls.id, { limit: 50 }).catch(() => ({ data: [] as AssignmentSummary[] })),
              submissionService.listAllSubmissions({ classId: cls.id }).catch(() => [] as SubmissionListItem[]),
            ]);

            const assignments = assignRes.data || [];
            const assignmentIds = new Set(assignments.map((assignment) => assignment.id));
            const submissions = rawSubmissions.filter((submission) => assignmentIds.has(submission.assignmentId));

            return {
              summary: cls,
              members,
              assignments,
              submissions
            };
          })
        );

        if (isMounted) {
          setEnrichedClasses(enriched);
        }
      } catch (err) {
        console.error('Failed to load teacher dashboard data:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại.' : 'Failed to load dashboard data. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isVi, reloadKey]);

  // Derived: All student lookup map
  const studentMap = useMemo(() => {
    const map = new Map<number, { name: string; code?: string; email?: string }>();
    for (const ec of enrichedClasses) {
      for (const m of ec.members) {
        if (!map.has(m.studentId)) {
          map.set(m.studentId, { name: m.fullName, code: m.studentCode, email: m.email });
        }
      }
    }
    return map;
  }, [enrichedClasses]);

  // Derived: Assignment lookup map
  const assignmentMap = useMemo(() => {
    const map = new Map<number, { title: string; classId: number; className: string }>();
    for (const ec of enrichedClasses) {
      for (const a of ec.assignments) {
        map.set(a.id, {
          title: a.title,
          classId: ec.summary.id,
          className: ec.summary.name
        });
      }
    }
    return map;
  }, [enrichedClasses]);

  // Helper: map module skill to TeacherSkill
  const mapSkill = (skill?: string | null): TeacherSkill => {
    if (!skill) return 'writing';
    const s = skill.toLowerCase();
    if (s.includes('speak')) return 'speaking';
    if (s.includes('read')) return 'reading';
    if (s.includes('listen')) return 'listening';
    return 'writing';
  };

  // Helper: Generate initials avatar
  const getInitials = (name?: string) => {
    if (!name) return 'HV';
    const clean = name.replace(/\(.*?\)/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'HV';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // 1. Pending Submissions Queue (100% real API data)
  const pendingSubmissions: TeacherPendingSubmission[] = useMemo(() => {
    const list: TeacherPendingSubmission[] = [];

    for (const ec of enrichedClasses) {
      for (const sub of ec.submissions) {
        const isPendingGrading = sub.status === 'SUBMITTED' || 
          sub.modules.some((m: SubmissionModuleSummary) => m.grading?.status === 'PENDING' || m.grading?.status === 'AI_GRADED');

        if (isPendingGrading) {
          const studentInfo = studentMap.get(sub.studentId);
          const assignInfo = assignmentMap.get(sub.assignmentId);
          const firstMod = sub.modules[0];
          const skill: TeacherSkill = mapSkill(firstMod?.skill);

          const submittedDate = sub.submittedAt ? new Date(sub.submittedAt) : new Date();
          const hoursAgo = Math.max(0, Math.round((currentTimestamp - submittedDate.getTime()) / (1000 * 60 * 60)));

          let timeText = isVi ? 'Vừa xong' : 'Just now';
          if (hoursAgo > 24) {
            const daysAgo = Math.floor(hoursAgo / 24);
            timeText = isVi ? `${daysAgo} ngày trước` : `${daysAgo}d ago`;
          } else if (hoursAgo > 0) {
            timeText = isVi ? `${hoursAgo} giờ trước` : `${hoursAgo}h ago`;
          }

          const hasAiGrading = sub.modules.some((m) => m.grading?.status === 'AI_GRADED');
          const aiScoreVal = firstMod?.grading?.finalScore;
          const aiPreScore = aiScoreVal !== null && aiScoreVal !== undefined 
            ? `Band ${aiScoreVal}` 
            : hasAiGrading 
            ? (isVi ? 'Đã sơ chấm' : 'Pre-graded') 
            : undefined;

          list.push({
            id: `sub-${sub.id}`,
            submissionId: sub.id,
            assignmentId: sub.assignmentId,
            assignmentTitle: assignInfo?.title || (isVi ? `Bài tập #${sub.assignmentId}` : `Assignment #${sub.assignmentId}`),
            studentId: sub.studentId,
            studentName: studentInfo?.name || (isVi ? `Học viên #${sub.studentId}` : `Student #${sub.studentId}`),
            studentEmail: studentInfo?.email,
            studentCode: studentInfo?.code,
            className: assignInfo?.className || ec.summary.name,
            skill,
            submittedAt: timeText,
            aiPreScore
          });
        }
      }
    }

    return list;
  }, [enrichedClasses, studentMap, assignmentMap, isVi, currentTimestamp]);

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    if (selectedSkill === 'all') return pendingSubmissions;
    return pendingSubmissions.filter((item) => item.skill === selectedSkill);
  }, [pendingSubmissions, selectedSkill]);

  // Pagination for Queue
  const totalQueuePages = Math.max(1, Math.ceil(filteredQueue.length / QUEUE_PAGE_SIZE));
  const paginatedQueue = useMemo(() => {
    const startIndex = (queuePage - 1) * QUEUE_PAGE_SIZE;
    return filteredQueue.slice(startIndex, startIndex + QUEUE_PAGE_SIZE);
  }, [filteredQueue, queuePage]);

  const handleSkillTabChange = (skill: string) => {
    setSelectedSkill(skill);
    setQueuePage(1);
  };

  // Skill counts for tabs
  const queueCounts = useMemo(() => {
    return {
      all: pendingSubmissions.length,
      writing: pendingSubmissions.filter((i) => i.skill === 'writing').length,
      speaking: pendingSubmissions.filter((i) => i.skill === 'speaking').length,
      reading: pendingSubmissions.filter((i) => i.skill === 'reading').length,
      listening: pendingSubmissions.filter((i) => i.skill === 'listening').length
    };
  }, [pendingSubmissions]);

  // 2. Active & Assigned Assignments with real submission progress
  const activeAssignments: TeacherActiveAssignment[] = useMemo(() => {
    const list: TeacherActiveAssignment[] = [];

    for (const ec of enrichedClasses) {
      for (const a of ec.assignments) {
        const statusUpper = a.status ? a.status.toUpperCase() : '';
        // Include all published or assigned exercises (exclude unassigned DRAFTs)
        if (statusUpper !== 'DRAFT') {
          const enrolled = ec.members.length;
          const assignmentSubs = ec.submissions.filter((s) => s.assignmentId === a.id);
          const submittedStudentIds = new Set(assignmentSubs.map((s) => s.studentId));
          const submittedCount = submittedStudentIds.size;
          const pendingStudentIds = new Set(
            assignmentSubs.filter((s) => !isSubmissionGraded(s)).map((s) => s.studentId)
          );
          const pendingGradingCount = pendingStudentIds.size;

          const submissionRate = enrolled > 0 
            ? Math.min(100, Math.round((submittedCount / enrolled) * 100))
            : 0;

          let formattedCloseDate = '';
          let isUrgent = false;
          let isExpired = false;
          if (a.closeAt) {
            const d = new Date(a.closeAt);
            if (!isNaN(d.getTime())) {
              const now = new Date();
              const diffMs = d.getTime() - now.getTime();
              isExpired = diffMs < 0 || statusUpper === 'CLOSED';

              const hours = String(d.getHours()).padStart(2, '0');
              const minutes = String(d.getMinutes()).padStart(2, '0');
              const timeStr = `${hours}:${minutes}`;

              const day = String(d.getDate()).padStart(2, '0');
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const dateStr = `${day}/${month}`;

              const isToday = d.toDateString() === now.toDateString();
              const tomorrow = new Date(now);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const isTomorrow = d.toDateString() === tomorrow.toDateString();

              if (isExpired) {
                formattedCloseDate = isVi ? `Đã đóng (${dateStr})` : `Closed (${dateStr})`;
              } else if (isToday) {
                formattedCloseDate = isVi ? `Hạn hôm nay • ${timeStr}` : `Due today • ${timeStr}`;
                isUrgent = true;
              } else if (isTomorrow) {
                formattedCloseDate = isVi ? `Hạn ngày mai • ${timeStr}` : `Due tomorrow • ${timeStr}`;
                isUrgent = true;
              } else {
                formattedCloseDate = isVi ? `Hạn nộp: ${timeStr}, ${dateStr}` : `Due: ${timeStr}, ${dateStr}`;
              }
            }
          }

          list.push({
            id: a.id,
            title: a.title,
            className: ec.summary.name,
            classId: ec.summary.id,
            closeAt: formattedCloseDate,
            isUrgent,
            isExpired,
            enrolledCount: enrolled,
            submittedCount,
            pendingGradingCount,
            submissionRate
          });
        }
      }
    }

    // Sort: open/urgent assignments first, then recently closed, newest ID first
    list.sort((x, y) => {
      if (x.isExpired !== y.isExpired) {
        return x.isExpired ? 1 : -1;
      }
      return y.id - x.id;
    });

    return list.slice(0, 6);
  }, [enrichedClasses, isVi]);

  // 3. Overall Grading Stats
  const gradingOverview = useMemo(() => {
    let totalSubs = 0;
    let gradedSubs = 0;

    for (const ec of enrichedClasses) {
      for (const s of ec.submissions) {
        totalSubs++;
        if (isSubmissionGraded(s)) {
          gradedSubs++;
        }
      }
    }

    const pendingSubs = Math.max(0, totalSubs - gradedSubs);
    const completionRate = totalSubs > 0 
      ? Math.min(100, Math.round((gradedSubs / totalSubs) * 100))
      : 100;

    return {
      totalSubs,
      gradedSubs,
      pendingSubs,
      completionRate
    };
  }, [enrichedClasses]);

  // 4. Class Summaries (100% real API data)
  const classesData: TeacherClassSummary[] = useMemo(() => {
    return enrichedClasses.map((ec) => {
      const cls = ec.summary;
      const totalEnrolled = ec.members.length;
      
      const pendingStudentIds = new Set(
        ec.submissions
          .filter((s) => s.status === 'SUBMITTED' || s.modules.some((m) => m.grading?.status === 'PENDING'))
          .map((s) => s.studentId)
      );
      const pendingCount = pendingStudentIds.size;

      const gradedScores: number[] = [];
      for (const s of ec.submissions) {
        for (const m of s.modules) {
          if (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined) {
            gradedScores.push(m.grading.finalScore);
          }
        }
      }

      const avgScore = gradedScores.length > 0 
        ? Math.round((gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length) * 10) / 10 
        : 0;

      return {
        id: cls.id,
        code: `CLASS-${cls.id}`,
        name: cls.name,
        enrolled: totalEnrolled,
        assignmentsCount: ec.assignments.length,
        pendingGrading: pendingCount,
        avgScore
      };
    });
  }, [enrichedClasses]);

  // Total KPIs
  const totalStudentsCount = useMemo(() => {
    return enrichedClasses.reduce((sum, ec) => sum + ec.members.length, 0);
  }, [enrichedClasses]);

  const totalAssignmentsCount = useMemo(() => {
    return enrichedClasses.reduce((sum, ec) => sum + ec.assignments.length, 0);
  }, [enrichedClasses]);

  // Skill badge helper
  const renderSkillBadge = (skill: TeacherSkill) => {
    switch (skill) {
      case 'writing':
        return (
          <span className="teacher-dash-skill-pill writing">
            <PenTool size={11} /> Writing
          </span>
        );
      case 'speaking':
        return (
          <span className="teacher-dash-skill-pill speaking">
            <Mic size={11} /> Speaking
          </span>
        );
      case 'reading':
        return (
          <span className="teacher-dash-skill-pill reading">
            <BookOpen size={11} /> Reading
          </span>
        );
      default:
        return (
          <span className="teacher-dash-skill-pill listening">
            <Headphones size={11} /> Listening
          </span>
        );
    }
  };

  return (
    <div className="teacher-dashboard-container">
      {/* 1. Hero Banner */}
      <section className="teacher-dash-hero">
        <div className="teacher-dash-hero-content">
          <h1 className="teacher-dash-greeting">
            {isVi ? `Chào mừng trở lại, ${teacherName}!` : `Welcome back, ${teacherName}!`}
          </h1>
          <p className="teacher-dash-subgreeting">
            {pendingSubmissions.length > 0 
              ? (isVi 
                  ? `${pendingSubmissions.length} bài nộp đang chờ chấm điểm.` 
                  : `${pendingSubmissions.length} submissions awaiting review.`)
              : (isVi
                  ? 'Tất cả bài nộp đã được chấm hoàn tất.'
                  : 'All submissions have been graded.')}
          </p>
        </div>

        <div className="teacher-dash-hero-actions">
          <Button 
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => navigate('/teacher/assignments/create')}
          >
            {isVi ? 'Giao bài tập mới' : 'Create Assignment'}
          </Button>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <LoadingState 
          title={isVi ? 'Đang đồng bộ dữ liệu lớp học & bài nộp...' : 'Syncing classes and submissions...'}
          description={isVi ? 'Đang tải hàng đợi bài nộp cần chấm và tiến độ hoàn thành các lớp.' : 'Fetching submissions awaiting evaluation and active class turnouts.'}
        />
      )}

      {/* Error Alert */}
      {!isLoading && error && (
        <div className="adm-alert-error justify-between p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-error" />
            <span className="text-sm text-error font-semibold">{error}</span>
          </div>
          <Button 
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={handleRetry}
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* 2. Key Metrics Strip (KPIs) */}
      {!isLoading && !error && (
        <section className="teacher-dash-kpi-grid">
          {/* KPI 1: Active Classes */}
          <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/classes')}>
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon-wrap classes">
                <BookOpen size={20} />
              </div>
              <span className="teacher-dash-kpi-subtext">
                {isVi ? 'Đang hoạt động' : 'Active'}
              </span>
            </div>
            <div className="teacher-dash-kpi-value">{enrichedClasses.length}</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Lớp giảng dạy' : 'Teaching Classes'}</div>
          </div>

          {/* KPI 2: Total Students */}
          <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/classes')}>
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon-wrap">
                <Users size={20} />
              </div>
              <span className="teacher-dash-kpi-subtext">
                {isVi ? 'Tổng ghi danh' : 'Enrolled'}
              </span>
            </div>
            <div className="teacher-dash-kpi-value">{totalStudentsCount}</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Tổng số học viên' : 'Total Students'}</div>
          </div>

          {/* KPI 3: Pending Grading Queue */}
          <div className="teacher-dash-kpi-card" onClick={() => {
            const el = document.getElementById('pending-queue-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon-wrap gold">
                <CheckSquare size={20} />
              </div>
              {pendingSubmissions.length > 0 ? (
                <span className="teacher-dash-kpi-badge">
                  {isVi ? 'Cần chấm' : 'To Grade'}
                </span>
              ) : (
                <span className="teacher-dash-kpi-badge done">
                  {isVi ? 'Đã hoàn tất' : 'Done'}
                </span>
              )}
            </div>
            <div className="teacher-dash-kpi-value">{pendingSubmissions.length}</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Bài nộp chờ chấm' : 'Pending Submissions'}</div>
          </div>

          {/* KPI 4: Total Assignments Assigned */}
          <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/assignments')}>
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon-wrap">
                <ClipboardList size={20} />
              </div>
              <span className="teacher-dash-kpi-subtext">
                {isVi ? 'Tất cả lớp' : 'All Classes'}
              </span>
            </div>
            <div className="teacher-dash-kpi-value">{totalAssignmentsCount}</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Bài tập đã giao' : 'Total Assignments'}</div>
          </div>
        </section>
      )}

      {/* 3. Main Dashboard Workspace: Two-Column Layout */}
      {!isLoading && !error && (
        <div className="teacher-dash-two-cols">
          {/* Left Column: Pending Submissions Queue with Pagination */}
          <section id="pending-queue-section" className="teacher-dash-section">
            <div className="teacher-dash-section-header">
              <h2 className="teacher-dash-section-title">
                {isVi ? 'Hàng đợi bài nộp cần chấm & đánh giá' : 'Pending Submissions Queue'}
              </h2>
              <button 
                type="button"
                className="teacher-dash-link-action"
                onClick={() => navigate('/teacher/assignments')}
              >
                <span>{isVi ? 'Tất cả bài tập' : 'All assignments'}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Skill Filter Segmented Control */}
            <div className="teacher-dash-skill-filter-wrapper">
              <div className="teacher-dash-skill-segmented" role="tablist" aria-label="Lọc theo kỹ năng">
                <button 
                  type="button"
                  role="tab"
                  aria-selected={selectedSkill === 'all'}
                  className={`teacher-dash-skill-pill ${selectedSkill === 'all' ? 'active' : ''}`}
                  onClick={() => handleSkillTabChange('all')}
                >
                  <span className="teacher-dash-skill-pill-name">{isVi ? 'Tất cả' : 'All'}</span>
                  <span className="teacher-dash-skill-pill-count">{queueCounts.all}</span>
                </button>
                <button 
                  type="button"
                  role="tab"
                  aria-selected={selectedSkill === 'writing'}
                  className={`teacher-dash-skill-pill ${selectedSkill === 'writing' ? 'active' : ''}`}
                  onClick={() => handleSkillTabChange('writing')}
                >
                  <PenTool size={12} />
                  <span className="teacher-dash-skill-pill-name">Writing</span>
                  <span className="teacher-dash-skill-pill-count">{queueCounts.writing}</span>
                </button>
                <button 
                  type="button"
                  role="tab"
                  aria-selected={selectedSkill === 'speaking'}
                  className={`teacher-dash-skill-pill ${selectedSkill === 'speaking' ? 'active' : ''}`}
                  onClick={() => handleSkillTabChange('speaking')}
                >
                  <Mic size={12} />
                  <span className="teacher-dash-skill-pill-name">Speaking</span>
                  <span className="teacher-dash-skill-pill-count">{queueCounts.speaking}</span>
                </button>
                <button 
                  type="button"
                  role="tab"
                  aria-selected={selectedSkill === 'reading'}
                  className={`teacher-dash-skill-pill ${selectedSkill === 'reading' ? 'active' : ''}`}
                  onClick={() => handleSkillTabChange('reading')}
                >
                  <BookOpen size={12} />
                  <span className="teacher-dash-skill-pill-name">Reading</span>
                  <span className="teacher-dash-skill-pill-count">{queueCounts.reading}</span>
                </button>
                <button 
                  type="button"
                  role="tab"
                  aria-selected={selectedSkill === 'listening'}
                  className={`teacher-dash-skill-pill ${selectedSkill === 'listening' ? 'active' : ''}`}
                  onClick={() => handleSkillTabChange('listening')}
                >
                  <Headphones size={12} />
                  <span className="teacher-dash-skill-pill-name">Listening</span>
                  <span className="teacher-dash-skill-pill-count">{queueCounts.listening}</span>
                </button>
              </div>
            </div>

            {/* Submissions List (Paginated, Max 4 per page) */}
            <div className="teacher-dash-queue-list">
              {paginatedQueue.map((item) => (
                <div key={item.id} className={`teacher-dash-queue-card skill-${item.skill}`}>
                  {/* Top Row: Student Identity (Left) & Skill / AI Badges (Right) */}
                  <div className="teacher-dash-queue-card-header">
                    <div className="teacher-dash-queue-student-group">
                      <div className="teacher-dash-avatar-initials">
                        {getInitials(item.studentName)}
                      </div>
                      <div className="teacher-dash-student-meta">
                        <div className="teacher-dash-student-line">
                          <span className="teacher-dash-student-name">{item.studentName}</span>
                          {item.studentCode && (
                            <span className="teacher-dash-student-code">{item.studentCode}</span>
                          )}
                        </div>
                        <div className="teacher-dash-class-line">
                          <GraduationCap size={12} className="teacher-dash-class-icon" />
                          <span className="teacher-dash-class-tag">{item.className}</span>
                        </div>
                      </div>
                    </div>

                    <div className="teacher-dash-queue-badges">
                      {renderSkillBadge(item.skill)}
                      {item.aiPreScore && (
                        <span className="teacher-dash-ai-pill">
                          <Sparkles size={11} />
                          <span>AI: {item.aiPreScore}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="teacher-dash-queue-divider" />

                  {/* Bottom Row: Assignment Title, Submission Time & Grade Action */}
                  <div className="teacher-dash-queue-card-body">
                    <div className="teacher-dash-assignment-info">
                      <div className="teacher-dash-assignment-title" title={item.assignmentTitle}>
                        {item.assignmentTitle}
                      </div>
                      <div className="teacher-dash-time">
                        <Clock size={12} />
                        <span>{isVi ? `Nộp ${item.submittedAt}` : `Submitted ${item.submittedAt}`}</span>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="teacher-dash-btn-grade"
                      onClick={() => navigate(`/teacher/assignments/${item.assignmentId}/submissions/${item.studentId}`, {
                        state: {
                          studentName: item.studentName,
                          studentCode: item.studentCode
                        }
                      })}
                    >
                      <span>{isVi ? 'Chấm bài' : 'Grade'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredQueue.length === 0 && (
                <div className="teacher-dash-queue-empty">
                  <CheckCircle2 size={20} className="text-primary" />
                  <span>
                    {isVi 
                      ? 'Hiện không có bài nộp nào cần chấm trong danh mục này.' 
                      : 'No pending submissions in this category.'}
                  </span>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredQueue.length > QUEUE_PAGE_SIZE && (
              <div className="teacher-dash-pagination">
                <span className="teacher-dash-page-info">
                  {isVi 
                    ? `Hiển thị ${(queuePage - 1) * QUEUE_PAGE_SIZE + 1} - ${Math.min(queuePage * QUEUE_PAGE_SIZE, filteredQueue.length)} trên tổng số ${filteredQueue.length} bài`
                    : `Showing ${(queuePage - 1) * QUEUE_PAGE_SIZE + 1} - ${Math.min(queuePage * QUEUE_PAGE_SIZE, filteredQueue.length)} of ${filteredQueue.length}`}
                </span>

                <div className="teacher-dash-page-actions">
                  <button 
                    type="button" 
                    className="teacher-dash-btn-page"
                    disabled={queuePage <= 1}
                    onClick={() => setQueuePage((prev) => Math.max(1, prev - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="teacher-dash-page-label">
                    {queuePage} / {totalQueuePages}
                  </span>

                  <button 
                    type="button" 
                    className="teacher-dash-btn-page"
                    disabled={queuePage >= totalQueuePages}
                    onClick={() => setQueuePage((prev) => Math.min(totalQueuePages, prev + 1))}
                    aria-label="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: Balanced Real-Data Widgets */}
          <div className="teacher-dash-right-col">
            {/* Widget 1: Active Assignments Submission Tracker */}
            <section className="teacher-dash-section">
              <div className="teacher-dash-section-header">
                <h3 className="teacher-dash-section-title">
                  {isVi ? 'Bài tập đang mở & Tiến độ nộp' : 'Active Assignments'}
                </h3>
              </div>

              <div className="teacher-dash-active-assign-list">
                {activeAssignments.map((a) => (
                  <div 
                    key={a.id} 
                    className="teacher-dash-active-assign-item"
                    onClick={() => navigate(`/teacher/assignments`)}
                  >
                    <div className="teacher-dash-active-assign-top">
                      <h4 className="teacher-dash-active-assign-title">{a.title}</h4>
                      <span className="teacher-dash-active-assign-class">{a.className}</span>
                    </div>

                    <div className="teacher-dash-progress-track">
                      <div 
                        className="teacher-dash-progress-bar"
                        style={{ width: `${a.submissionRate}%` }}
                      />
                    </div>

                    <div className="teacher-dash-active-assign-meta">
                      <span className="teacher-dash-active-assign-stat">
                        {isVi ? 'Đã nộp:' : 'Submitted:'} <strong>{a.submittedCount} / {a.enrolledCount}</strong> ({a.submissionRate}%)
                      </span>
                      {a.closeAt && (
                        <span className={`teacher-dash-deadline-tag ${a.isUrgent ? 'urgent' : ''} ${a.isExpired ? 'expired' : ''}`}>
                          <Clock size={11} />
                          <span>{a.closeAt}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {activeAssignments.length === 0 && (
                  <div className="teacher-dash-queue-empty">
                    <CheckCircle2 size={16} className="text-muted" />
                    <span>{isVi ? 'Không có bài tập nào đang mở.' : 'No active assignments.'}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Widget 2: Overall Grading Efficiency Summary */}
            <section className="teacher-dash-section">
              <div className="teacher-dash-section-header">
                <h3 className="teacher-dash-section-title">
                  {isVi ? 'Hiệu suất chấm điểm' : 'Grading Overview'}
                </h3>
              </div>

              <div className="teacher-dash-grading-summary">
                <div className="teacher-dash-stat-box">
                  <span className="teacher-dash-stat-box-num">{gradingOverview.totalSubs}</span>
                  <span className="teacher-dash-stat-box-label">{isVi ? 'Tổng bài đã nộp' : 'Total Submissions'}</span>
                </div>
                <div className="teacher-dash-stat-box">
                  <span className="teacher-dash-stat-box-num">{gradingOverview.gradedSubs}</span>
                  <span className="teacher-dash-stat-box-label">{isVi ? 'Đã hoàn tất chấm' : 'Graded'}</span>
                </div>
              </div>

              <div className="teacher-dash-completion-bar-wrap">
                <div className="teacher-dash-completion-label-row">
                  <span>{isVi ? 'Tiến độ hoàn tất chấm điểm' : 'Completion Rate'}</span>
                  <span className="teacher-dash-completion-pct">{gradingOverview.completionRate}%</span>
                </div>
                <div className="teacher-dash-progress-track">
                  <div 
                    className="teacher-dash-progress-bar"
                    style={{ width: `${gradingOverview.completionRate}%` }}
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 4. Active Classes Overview (Full Width Bottom Section) */}
      {!isLoading && !error && (
        <section className="teacher-dash-section">
          <div className="teacher-dash-section-header">
            <h2 className="teacher-dash-section-title">
              {isVi ? 'Lớp học đang phụ trách' : 'My Classes Overview'}
            </h2>
            <button 
              type="button"
              className="teacher-dash-link-action"
              onClick={() => navigate('/teacher/classes')}
            >
              <span>{isVi ? 'Quản lý danh sách lớp' : 'Manage all classes'}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="teacher-dash-classes-grid">
            {classesData.map((cls) => (
              <div 
                key={cls.id} 
                className="teacher-dash-class-card"
                onClick={() => navigate(`/teacher/classes/${cls.id}/progress`)}
              >
                <div className="teacher-dash-class-card-top">
                  <div>
                    <span className="teacher-dash-class-code">{cls.code}</span>
                    <div className="teacher-dash-class-name">{cls.name}</div>
                  </div>
                </div>

                <div className="teacher-dash-class-stats">
                  <span className="teacher-dash-class-stat-item">
                    <Users size={14} />
                    <span>{cls.enrolled} {isVi ? 'học viên' : 'students'}</span>
                  </span>
                  <span>•</span>
                  <span className="teacher-dash-class-stat-item">
                    <ClipboardList size={14} />
                    <span>{cls.assignmentsCount} {isVi ? 'bài tập' : 'assignments'}</span>
                  </span>
                </div>

                <div className="teacher-dash-class-footer">
                  {cls.pendingGrading > 0 ? (
                    <span className="teacher-dash-class-badge-pending">
                      {cls.pendingGrading} {isVi ? 'bài chờ chấm' : 'pending review'}
                    </span>
                  ) : (
                    <span className="teacher-dash-class-badge-done">
                      {isVi ? 'Đã chấm hết' : 'All Graded'}
                    </span>
                  )}
                  <span className="teacher-dash-class-view-link">
                    <span>{isVi ? 'Tiến độ' : 'Progress'}</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))}

            {classesData.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  icon={BookOpen}
                  title={isVi ? 'Chưa có lớp học nào được phân công' : 'No classes assigned'}
                  description={isVi ? 'Liên hệ Quản trị viên để được xếp lớp giảng dạy.' : 'Contact administrator to be assigned classes.'}
                />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default TeacherDashboard;
