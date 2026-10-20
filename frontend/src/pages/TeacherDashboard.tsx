import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Clock, Plus, 
  CheckCircle2, 
  FileText, PenTool, Mic, Headphones, Library,
  ChevronRight, AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { classService, type ClassSummary, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, type SubmissionModuleSummary, isSubmissionGraded } from '../api/services/submission.service';
import type { 
  TeacherSkill, 
  TeacherPendingSubmission, 
  TeacherClassSummary,
  TeacherSkillPerformance,
  TeacherUpcomingDeadline,
  TeacherActivityItem
} from '../types/teacher-dashboard.types';
import { Button, EmptyState } from '../components/common';
import '../styles/teacher-dashboard.css';

interface EnrichedClassData {
  summary: ClassSummary;
  members: ClassMember[];
  assignments: AssignmentSummary[];
  submissions: SubmissionListItem[];
}

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

  // Timestamp captured once per mount/session to ensure pure rendering calculations
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

        const effectiveClasses = targetClasses.length > 0 ? targetClasses : allClasses.slice(0, 8);

        // 2. Fetch members, assignments and submissions for each class in parallel
        const enriched = await Promise.all(
          effectiveClasses.map(async (cls): Promise<EnrichedClassData> => {
            let members: ClassMember[];
            let assignments: AssignmentSummary[];
            let submissions: SubmissionListItem[];

            try {
              members = await classService.listMembers(cls.id);
            } catch {
              members = [];
            }

            try {
              const assignRes = await assignmentService.listAssignments(cls.id, { limit: 50 });
              assignments = assignRes.data || [];
            } catch {
              assignments = [];
            }

            const classId = cls.id;
            const assignmentIds = new Set(assignments.map((assignment) => assignment.id));
            try {
              const classSubmissions = await submissionService.listAllSubmissions({ classId });
              submissions = classSubmissions.filter((submission) => assignmentIds.has(submission.assignmentId));
            } catch {
              submissions = [];
              console.warn('Failed to load class submissions', { classId });
            }

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
    const map = new Map<number, { name: string; code?: string }>();
    for (const ec of enrichedClasses) {
      for (const m of ec.members) {
        if (!map.has(m.studentId)) {
          map.set(m.studentId, { name: m.fullName, code: m.studentCode });
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

  // 1. Pending Submissions Queue
  const pendingSubmissions: TeacherPendingSubmission[] = useMemo(() => {
    const list: TeacherPendingSubmission[] = [];

    for (const ec of enrichedClasses) {
      for (const sub of ec.submissions) {
        // Consider submissions that are SUBMITTED or have pending module grading
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
            : (isVi ? 'Chờ AI' : 'Pending AI');

          list.push({
            id: `sub-${sub.id}`,
            assignmentId: String(sub.assignmentId),
            assignmentTitle: assignInfo?.title || (isVi ? `Bài tập #${sub.assignmentId}` : `Assignment #${sub.assignmentId}`),
            studentId: String(sub.studentId),
            studentName: studentInfo?.name || (isVi ? `Học viên #${sub.studentId}` : `Student #${sub.studentId}`),
            studentAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(studentInfo?.name || 'ST')}`,
            className: assignInfo?.className || ec.summary.name,
            skill,
            submittedAt: timeText,
            aiPreScore,
            aiConfidence: hasAiGrading ? 95 : 85,
            urgency: hoursAgo > 48 ? 'high' : hoursAgo > 12 ? 'medium' : 'normal'
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

  // Condensed queue items for concise dashboard overview
  const MAX_OVERVIEW_QUEUE_ITEMS = 4;
  const displayedQueue = useMemo(() => {
    return filteredQueue.slice(0, MAX_OVERVIEW_QUEUE_ITEMS);
  }, [filteredQueue]);

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

  // 2. Class Summaries
  const classesData: TeacherClassSummary[] = useMemo(() => {
    return enrichedClasses.map((ec) => {
      const cls = ec.summary;
      const totalEnrolled = ec.members.length;
      
      const pendingCount = ec.submissions.filter(
        (s) => s.status === 'SUBMITTED' || s.modules.some((m) => m.grading?.status === 'PENDING')
      ).length;

      // Calculate avg score across completed submissions
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

      const totalPossibleSubmissions = ec.assignments.length * Math.max(1, totalEnrolled);
      const submittedCount = ec.submissions.length;
      const progressPercent = totalPossibleSubmissions > 0 
        ? Math.min(100, Math.round((submittedCount / totalPossibleSubmissions) * 100))
        : 0;

      return {
        id: String(cls.id),
        code: `CLASS-${cls.id}`,
        name: cls.name,
        enrolled: totalEnrolled,
        pendingGrading: pendingCount,
        avgScore,
        nextSession: isVi ? 'Lịch học trong tuần' : 'Scheduled this week',
        schedule: isVi ? 'Theo thời khóa biểu' : 'Regular Schedule',
        progressPercent
      };
    });
  }, [enrichedClasses, isVi]);

  // 3. 4-Skill Performance
  const skillPerformances: TeacherSkillPerformance[] = useMemo(() => {
    const skillScores: Record<TeacherSkill, number[]> = {
      writing: [],
      speaking: [],
      reading: [],
      listening: []
    };

    for (const ec of enrichedClasses) {
      for (const s of ec.submissions) {
        for (const m of s.modules) {
          const sk = mapSkill(m.skill);
          if (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined) {
            skillScores[sk].push(m.grading.finalScore);
          }
        }
      }
    }

    const calcAvg = (scores: number[]) => {
      const valid = scores.filter((sc) => sc > 0);
      if (valid.length === 0) return 0;
      return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
    };

    const calcSkillSubmissionRate = (skill: TeacherSkill) => {
      let possible = 0;
      let actual = 0;
      for (const ec of enrichedClasses) {
        const matchingAssigns = ec.assignments.filter((a) => mapSkill(a.title) === skill);
        possible += matchingAssigns.length * ec.members.length;
        for (const s of ec.submissions) {
          if (s.modules.some((m) => mapSkill(m.skill) === skill)) {
            actual++;
          }
        }
      }
      return possible > 0 ? Math.min(100, Math.round((actual / possible) * 100)) : 0;
    };

    return [
      {
        skill: 'writing',
        skillName: 'Writing',
        avgScore: calcAvg(skillScores.writing),
        submissionRate: calcSkillSubmissionRate('writing'),
        needsReviewCount: queueCounts.writing
      },
      {
        skill: 'speaking',
        skillName: 'Speaking',
        avgScore: calcAvg(skillScores.speaking),
        submissionRate: calcSkillSubmissionRate('speaking'),
        needsReviewCount: queueCounts.speaking
      },
      {
        skill: 'reading',
        skillName: 'Reading',
        avgScore: calcAvg(skillScores.reading),
        submissionRate: calcSkillSubmissionRate('reading'),
        needsReviewCount: queueCounts.reading
      },
      {
        skill: 'listening',
        skillName: 'Listening',
        avgScore: calcAvg(skillScores.listening),
        submissionRate: calcSkillSubmissionRate('listening'),
        needsReviewCount: queueCounts.listening
      }
    ];
  }, [enrichedClasses, queueCounts]);

  // 4. Upcoming Deadlines
  const upcomingDeadlines: TeacherUpcomingDeadline[] = useMemo(() => {
    const deadlines: TeacherUpcomingDeadline[] = [];

    for (const ec of enrichedClasses) {
      for (const a of ec.assignments) {
        const closeDate = a.closeAt ? new Date(a.closeAt) : null;
        if (!closeDate) continue;

        const msRemaining = closeDate.getTime() - currentTimestamp;
        const hoursRemaining = Math.round(msRemaining / (1000 * 60 * 60));

        let timeRemaining = isVi ? 'Đã quá hạn' : 'Overdue';
        let status: 'urgent' | 'upcoming' = 'upcoming';

        if (hoursRemaining > 24) {
          const days = Math.round(hoursRemaining / 24);
          timeRemaining = isVi ? `còn ${days} ngày` : `${days} days left`;
        } else if (hoursRemaining > 0) {
          timeRemaining = isVi ? `còn ${hoursRemaining} giờ` : `${hoursRemaining}h left`;
          status = 'urgent';
        }

        deadlines.push({
          id: `dl-${a.id}`,
          title: a.title,
          type: 'assignment',
          className: ec.summary.name,
          date: closeDate.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          }),
          timeRemaining,
          status
        });
      }
    }

    return deadlines.slice(0, 4);
  }, [enrichedClasses, isVi, currentTimestamp]);

  // 5. Activity Feed
  const recentActivities: TeacherActivityItem[] = useMemo(() => {
    const activities: TeacherActivityItem[] = [];

    for (const ec of enrichedClasses) {
      for (const sub of ec.submissions) {
        const studentInfo = studentMap.get(sub.studentId);
        const assignInfo = assignmentMap.get(sub.assignmentId);
        const studentName = studentInfo?.name || (isVi ? 'Học viên' : 'Student');

        if (isSubmissionGraded(sub)) {
          activities.push({
            id: `act-grad-${sub.id}`,
            type: 'ai_graded',
            title: isVi 
              ? `Hoàn tất chấm bài của ${studentName}` 
              : `Grading finalized for ${studentName}`,
            desc: assignInfo?.title || ec.summary.name,
            timestamp: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : (isVi ? 'Gần đây' : 'Recently'),
            className: ec.summary.name
          });
        } else if (sub.status === 'SUBMITTED') {
          activities.push({
            id: `act-sub-${sub.id}`,
            type: 'submission',
            title: isVi 
              ? `${studentName} đã nộp bài tập` 
              : `${studentName} submitted assignment`,
            desc: assignInfo?.title || ec.summary.name,
            timestamp: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : (isVi ? 'Hôm nay' : 'Today'),
            className: ec.summary.name
          });
        }
      }
    }

    return activities.slice(0, 5);
  }, [enrichedClasses, studentMap, assignmentMap, isVi]);

  // Total KPIs
  const totalStudentsCount = useMemo(() => {
    return enrichedClasses.reduce((sum, ec) => sum + ec.members.length, 0);
  }, [enrichedClasses]);

  const overallAvgBand = useMemo(() => {
    const scores = skillPerformances.map((s) => s.avgScore).filter((s) => s > 0);
    if (scores.length === 0) return 'Band 0.0';
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return `Band ${avg.toFixed(1)}`;
  }, [skillPerformances]);

  // Skill badge helper
  const renderSkillBadge = (skill: TeacherSkill) => {
    switch (skill) {
      case 'writing':
        return (
          <span className="exam-badge-skill writing">
            <PenTool size={12} /> Writing
          </span>
        );
      case 'speaking':
        return (
          <span className="exam-badge-skill speaking">
            <Mic size={12} /> Speaking
          </span>
        );
      case 'reading':
        return (
          <span className="exam-badge-skill reading">
            <BookOpen size={12} /> Reading
          </span>
        );
      default:
        return (
          <span className="exam-badge-skill listening">
            <Headphones size={12} /> Listening
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
        </div>

        <div className="teacher-dash-hero-actions">
          <Button 
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/teacher/assignments/create')}
          >
            {isVi ? 'Giao bài tập mới' : 'Create Assignment'}
          </Button>
          <Button 
            variant="secondary"
            icon={<Library size={16} />}
            onClick={() => navigate('/teacher/assignments')}
          >
            {isVi ? 'Quản lý bài tập' : 'Assignments'}
          </Button>
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="eh-card p-8 text-center text-muted">
          <RefreshCw size={36} className="animate-spin mx-auto mb-3 text-primary block" />
          <h3 className="m-0 text-base font-bold text-surface">
            {isVi ? 'Đang tải dữ liệu thực tế từ hệ thống...' : 'Loading live dashboard metrics...'}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {isVi ? 'Đang đồng bộ lớp học, bài tập nộp và điểm số học viên.' : 'Syncing classes, submissions, and performance data.'}
          </p>
        </div>
      )}

      {/* Error Alert */}
      {!isLoading && error && (
        <div className="adm-alert-error justify-between p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="text-error" />
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
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{enrichedClasses.length}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Lớp đang giảng dạy' : 'Active Classes'}</div>
            </div>
          </div>

          {/* KPI 2: Total Students */}
          <div className="teacher-dash-kpi-card">
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{totalStudentsCount}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Tổng số học viên' : 'Enrolled Students'}</div>
            </div>
          </div>

          {/* KPI 3: Pending Grading Queue */}
          <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/assignments')}>
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{pendingSubmissions.length}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Bài nộp chờ chấm' : 'Pending Submissions'}</div>
            </div>
          </div>

          {/* KPI 4: Average Score */}
          <div className="teacher-dash-kpi-card">
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{overallAvgBand}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Điểm trung bình các lớp' : 'Overall Average'}</div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Dashboard Columns */}
      {!isLoading && !error && (
        <div className="teacher-dash-main-cols">
          {/* Left Column: Pending Submissions Queue & 4-Skill Matrix */}
          <div className="flex flex-col gap-6">
            {/* Pending Submissions Queue (Condensed Overview) */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <h2 className="teacher-dash-section-title">
                    {isVi ? 'Hàng đợi bài nộp cần chấm & duyệt' : 'Pending Grading & Review Queue'}
                  </h2>
                </div>
                <button 
                  type="button"
                  className="teacher-dash-link-action"
                  onClick={() => navigate('/teacher/assignments')}
                >
                  <span>{isVi ? 'Xem tất cả' : 'View all'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Skill Filter Tabs */}
              <div className="teacher-dash-skill-tabs">
                <button 
                  type="button"
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('all')}
                >
                  <span>{isVi ? 'Tất cả' : 'All'}</span>
                  <span className="teacher-dash-tab-count">{queueCounts.all}</span>
                </button>
                <button 
                  type="button"
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'writing' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('writing')}
                >
                  <PenTool size={12} />
                  <span>Writing</span>
                  <span className="teacher-dash-tab-count">{queueCounts.writing}</span>
                </button>
                <button 
                  type="button"
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'speaking' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('speaking')}
                >
                  <Mic size={12} />
                  <span>Speaking</span>
                  <span className="teacher-dash-tab-count">{queueCounts.speaking}</span>
                </button>
                <button 
                  type="button"
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'reading' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('reading')}
                >
                  <BookOpen size={12} />
                  <span>Reading</span>
                  <span className="teacher-dash-tab-count">{queueCounts.reading}</span>
                </button>
                <button 
                  type="button"
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'listening' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('listening')}
                >
                  <Headphones size={12} />
                  <span>Listening</span>
                  <span className="teacher-dash-tab-count">{queueCounts.listening}</span>
                </button>
              </div>

              {/* Submission Queue Items (Overview Condensed) */}
              <div className="teacher-dash-queue-list">
                {displayedQueue.map((item) => (
                  <div 
                    key={item.id} 
                    className={`teacher-dash-queue-item ${item.urgency === 'high' ? 'high-urgency' : ''}`}
                  >
                    <div className="teacher-dash-student-info">
                      <img 
                        src={item.studentAvatar} 
                        alt={item.studentName} 
                        className="teacher-dash-avatar" 
                      />
                      <div className="teacher-dash-details">
                        <div className="teacher-dash-student-name">
                          <span>{item.studentName}</span>
                          <span className="teacher-dash-class-tag">{item.className}</span>
                          {renderSkillBadge(item.skill)}
                        </div>
                        <div className="teacher-dash-assignment-title" title={item.assignmentTitle}>
                          {item.assignmentTitle}
                        </div>
                        <div className="teacher-dash-meta-pills">
                          <span>{item.submittedAt}</span>
                          <span>•</span>
                          <span className="teacher-dash-ai-pill">
                            AI: {item.aiPreScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="teacher-dash-queue-actions">
                      <button 
                        type="button"
                        className="teacher-dash-btn-grade"
                        onClick={() => navigate(`/teacher/assignments/${item.assignmentId}/submissions/${item.studentId}`)}
                      >
                        <span>{isVi ? 'Chấm bài' : 'Grade'}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {filteredQueue.length === 0 && (
                  <div className="teacher-dash-queue-empty">
                    <CheckCircle2 size={18} className="text-primary" />
                    <span>
                      {isVi 
                        ? 'Không có bài nộp chờ chấm. Tất cả bài tập đã được chấm hoặc học sinh chưa nộp bài mới.' 
                        : 'No pending submissions in queue.'}
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* 4-Skill Matrix Performance */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <h2 className="teacher-dash-section-title">
                    {isVi ? 'Năng lực 4 Kỹ năng (Tổng hợp các lớp)' : '4-Skill Competence Matrix'}
                  </h2>
                </div>
                <button 
                  type="button"
                  className="teacher-dash-link-action"
                  onClick={() => navigate('/teacher/classes')}
                >
                  <span>{isVi ? 'Chi tiết tiến độ' : 'Detailed progress'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="teacher-dash-skill-matrix">
                {skillPerformances.map((item) => (
                  <div key={item.skill} className="teacher-dash-skill-box">
                    <div className="teacher-dash-skill-box-top">
                      <span className="teacher-dash-skill-title">
                        {item.skill === 'writing' && <PenTool size={14} className="text-primary" />}
                        {item.skill === 'speaking' && <Mic size={14} color="#9333ea" />}
                        {item.skill === 'reading' && <BookOpen size={14} className="text-secondary" />}
                        {item.skill === 'listening' && <Headphones size={14} color="#0d9488" />}
                        {item.skillName}
                      </span>
                      <span className="teacher-dash-skill-score">
                        {item.avgScore > 0 ? item.avgScore : '—'}
                      </span>
                    </div>

                    <div className="teacher-dash-progress-track">
                      <div 
                        className={`teacher-dash-progress-bar ${item.skill}`}
                        style={{ width: `${Math.min(100, Math.round((item.avgScore / 10.0) * 100))}%` }}
                      />
                    </div>

                    <div className="teacher-dash-skill-foot">
                      <span>{isVi ? 'Nộp bài:' : 'Completion:'} {item.submissionRate}%</span>
                      <span>{item.needsReviewCount} {isVi ? 'chờ duyệt' : 'pending'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Active Classes Grid */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <h2 className="teacher-dash-section-title">
                    {isVi ? 'Tổng quan các Lớp đang phụ trách' : 'My Active Classes Overview'}
                  </h2>
                </div>
                <button 
                  className="teacher-dash-link-action"
                  onClick={() => navigate('/teacher/classes')}
                >
                  <span>{isVi ? 'Quản lý lớp học' : 'Manage classes'}</span>
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
                    <div className="teacher-dash-class-header">
                      <div>
                        <span className="teacher-dash-class-code">{cls.code}</span>
                        <div className="teacher-dash-class-name">{cls.name}</div>
                      </div>
                    </div>

                    <div className="teacher-dash-class-meta-row">
                      <span className="teacher-dash-class-meta-item">
                        <Users size={14} /> {cls.enrolled} {isVi ? 'học viên' : 'students'}
                      </span>
                      <span className="teacher-dash-class-meta-item">
                        <Clock size={14} /> {cls.nextSession}
                      </span>
                    </div>

                    <div className="teacher-dash-progress-track">
                      <div 
                        className="teacher-dash-progress-bar writing"
                        style={{ width: `${cls.progressPercent}%` }}
                      />
                    </div>

                    <div className="teacher-dash-class-footer">
                      <span className="teacher-dash-class-score-pill">
                        Band TB: {cls.avgScore}
                      </span>
                      {cls.pendingGrading > 0 ? (
                        <span className="teacher-dash-class-pending-badge">
                          {cls.pendingGrading} {isVi ? 'bài cần chấm' : 'to grade'}
                        </span>
                      ) : (
                        <span className="teacher-dash-class-done-badge">
                          {isVi ? 'Đã hoàn tất' : 'All Graded'}
                        </span>
                      )}
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
          </div>

          {/* Right Column: Widgets (Schedule & Timeline) */}
          <div className="teacher-dash-side-widgets">
            {/* Upcoming Schedule & Deadlines */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <h3 className="teacher-dash-section-title">
                    {isVi ? 'Hạn nộp & Lịch sắp tới' : 'Upcoming Deadlines'}
                  </h3>
                </div>
              </div>

              <div className="teacher-dash-deadline-list">
                {upcomingDeadlines.map((item) => (
                  <div key={item.id} className="teacher-dash-deadline-item">
                    <div 
                      className={`teacher-dash-deadline-icon ${item.status === 'urgent' ? 'urgent' : 'normal'}`}
                    >
                      <FileText size={16} />
                    </div>
                    <div className="teacher-dash-deadline-info">
                      <div className="teacher-dash-deadline-title">{item.title}</div>
                      <div className="teacher-dash-deadline-class">{item.className}</div>
                      <div className="teacher-dash-deadline-time">
                        <Clock size={11} /> {item.date} ({item.timeRemaining})
                      </div>
                    </div>
                  </div>
                ))}

                {upcomingDeadlines.length === 0 && (
                  <div className="teacher-dash-widget-empty">
                    {isVi ? 'Không có hạn nộp nào trong thời gian tới.' : 'No upcoming deadlines.'}
                  </div>
                )}
              </div>
            </section>

            {/* Recent Teaching Activities */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <h3 className="teacher-dash-section-title">
                    {isVi ? 'Hoạt động gần đây' : 'Recent Activity Stream'}
                  </h3>
                </div>
              </div>

              <div className="teacher-dash-activity-timeline">
                {recentActivities.map((act) => (
                  <div key={act.id} className="teacher-dash-activity-item">
                    <div 
                      className={`teacher-dash-activity-dot ${act.type === 'submission' ? 'submission' : act.type === 'ai_graded' ? 'ai_graded' : 'normal'}`}
                    />
                    <div className="teacher-dash-activity-content">
                      <div className="teacher-dash-activity-title">{act.title}</div>
                      <div className="teacher-dash-activity-desc">{act.desc}</div>
                      <div className="teacher-dash-activity-time">{act.timestamp} • {act.className}</div>
                    </div>
                  </div>
                ))}

                {recentActivities.length === 0 && (
                  <div className="teacher-dash-widget-empty">
                    {isVi ? 'Chưa có hoạt động mới ghi nhận.' : 'No recent activities recorded.'}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
