import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Clock, Sparkles, Plus, 
  ArrowUpRight, CheckCircle2, TrendingUp, 
  FileText, PenTool, Mic, Headphones, Library,
  Calendar, Zap, ChevronRight, AlertCircle, Award,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { classService, type ClassSummary, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, type SubmissionModuleSummary } from '../api/services/submission.service';
import type { 
  TeacherSkill, 
  TeacherPendingSubmission, 
  TeacherClassSummary,
  TeacherSkillPerformance,
  TeacherUpcomingDeadline,
  TeacherActivityItem
} from '../types/teacher-dashboard.types';
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
            let submissions: SubmissionListItem[] = [];

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

            // Fetch submissions for assignments in this class
            if (assignments.length > 0) {
              const subPromises = assignments.map(async (a) => {
                try {
                  const subRes = await submissionService.listSubmissions({ assignmentId: a.id, limit: 50 });
                  return subRes.data || [];
                } catch {
                  return [];
                }
              });
              const subResults = await Promise.all(subPromises);
              submissions = subResults.flat();
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
          const assignInfo = sub.assignmentId ? assignmentMap.get(sub.assignmentId) : undefined;
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
            assignmentId: String(sub.assignmentId || '1'),
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
        benchmark: 7.0,
        submissionRate: calcSkillSubmissionRate('writing'),
        needsReviewCount: queueCounts.writing
      },
      {
        skill: 'speaking',
        skillName: 'Speaking',
        avgScore: calcAvg(skillScores.speaking),
        benchmark: 7.0,
        submissionRate: calcSkillSubmissionRate('speaking'),
        needsReviewCount: queueCounts.speaking
      },
      {
        skill: 'reading',
        skillName: 'Reading',
        avgScore: calcAvg(skillScores.reading),
        benchmark: 7.5,
        submissionRate: calcSkillSubmissionRate('reading'),
        needsReviewCount: queueCounts.reading
      },
      {
        skill: 'listening',
        skillName: 'Listening',
        avgScore: calcAvg(skillScores.listening),
        benchmark: 7.0,
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
        const assignInfo = sub.assignmentId ? assignmentMap.get(sub.assignmentId) : undefined;
        const studentName = studentInfo?.name || (isVi ? 'Học viên' : 'Student');

        if (sub.status === 'GRADED') {
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
          <div className="teacher-dash-badge-wrap">
            <Sparkles size={14} />
            <span>{isVi ? 'Học kỳ Hiện Tại • Giảng Viên EnglishHub' : 'Current Term • EnglishHub Instructor'}</span>
          </div>
          <h1 className="teacher-dash-greeting">
            {isVi ? `Chào mừng trở lại, ${teacherName}! 👋` : `Welcome back, ${teacherName}! 👋`}
          </h1>
          <p className="teacher-dash-subgreeting">
            {isVi 
              ? `Hiện bạn đang phụ trách ${enrichedClasses.length} lớp học với ${pendingSubmissions.length} bài tập cần chấm duyệt.` 
              : `You are managing ${enrichedClasses.length} classes with ${pendingSubmissions.length} submissions pending review.`}
          </p>
        </div>

        <div className="teacher-dash-hero-actions">
          <button 
            className="teacher-dash-btn-primary"
            onClick={() => navigate('/teacher/assignments/create')}
          >
            <Plus size={16} />
            <span>{isVi ? 'Giao bài tập mới' : 'Create Assignment'}</span>
          </button>
          <button 
            className="teacher-dash-btn-glass"
            onClick={() => navigate('/teacher/exam-bank')}
          >
            <Library size={16} />
            <span>{isVi ? 'Kho đề thi & Mẫu' : 'Exam Bank'}</span>
          </button>
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <RefreshCw size={36} color="#4f46e5" className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            {isVi ? 'Đang tải dữ liệu thực tế từ hệ thống...' : 'Loading live dashboard metrics...'}
          </h3>
          <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            {isVi ? 'Đang đồng bộ lớp học, bài tập nộp và điểm số học viên.' : 'Syncing classes, submissions, and performance data.'}
          </p>
        </div>
      )}

      {/* Error Alert */}
      {!isLoading && error && (
        <div style={{ 
          padding: '20px 24px', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          gap: '16px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={22} color="#dc2626" />
            <span style={{ fontSize: '14px', color: '#b91c1c', fontWeight: 600 }}>{error}</span>
          </div>
          <button 
            className="btn btn-secondary bg-white btn-sm"
            onClick={handleRetry}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} />
            <span>{isVi ? 'Thử lại' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* 2. Key Metrics Strip (KPIs) */}
      {!isLoading && !error && (
        <section className="teacher-dash-kpi-grid">
          {/* KPI 1: Active Classes */}
          <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/classes')}>
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                <BookOpen size={22} />
              </div>
              <span className="teacher-dash-kpi-trend positive">
                <TrendingUp size={12} /> {enrichedClasses.length > 0 ? '100% On-track' : 'Chưa có lớp'}
              </span>
            </div>
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{enrichedClasses.length}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Lớp đang giảng dạy' : 'Active Classes'}</div>
              <div className="teacher-dash-kpi-subtext">{isVi ? 'Được phân công giảng dạy' : 'Assigned teaching load'}</div>
            </div>
          </div>

          {/* KPI 2: Total Students */}
          <div className="teacher-dash-kpi-card">
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
                <Users size={22} />
              </div>
              <span className="teacher-dash-kpi-trend neutral">
                <Users size={12} /> {isVi ? 'Sĩ số' : 'Roster'}
              </span>
            </div>
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{totalStudentsCount}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Tổng số học viên' : 'Enrolled Students'}</div>
              <div className="teacher-dash-kpi-subtext">
                {enrichedClasses.length > 0 
                  ? (isVi ? `TB ${(totalStudentsCount / enrichedClasses.length).toFixed(1)} học viên/lớp` : `Avg ${(totalStudentsCount / enrichedClasses.length).toFixed(1)}/class`)
                  : (isVi ? '0 học viên' : '0 students')}
              </div>
            </div>
          </div>

          {/* KPI 3: Pending Grading Queue */}
          <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/assignments')}>
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                <Clock size={22} />
              </div>
              <span className="teacher-dash-kpi-trend urgent">
                <AlertCircle size={12} /> {pendingSubmissions.length > 0 ? (isVi ? 'Cần chấm' : 'Action needed') : (isVi ? 'Đã xong' : 'Clear')}
              </span>
            </div>
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{pendingSubmissions.length}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Bài nộp chờ chấm' : 'Pending Submissions'}</div>
              <div className="teacher-dash-kpi-subtext">{isVi ? 'Cần giáo viên nhận xét & chấm điểm' : 'Awaiting evaluation'}</div>
            </div>
          </div>

          {/* KPI 4: Average Score */}
          <div className="teacher-dash-kpi-card">
            <div className="teacher-dash-kpi-header">
              <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                <Award size={22} />
              </div>
              <span className={`teacher-dash-kpi-trend ${overallAvgBand !== 'Band 0.0' ? 'positive' : 'neutral'}`}>
                <ArrowUpRight size={12} /> {overallAvgBand !== 'Band 0.0' ? (isVi ? 'Đang đạt chuẩn' : 'Target Met') : (isVi ? 'Chưa có điểm' : 'No data')}
              </span>
            </div>
            <div className="teacher-dash-kpi-body">
              <div className="teacher-dash-kpi-value">{overallAvgBand}</div>
              <div className="teacher-dash-kpi-label">{isVi ? 'Điểm trung bình các lớp' : 'Overall Band Avg'}</div>
              <div className="teacher-dash-kpi-subtext">{isVi ? 'Mục tiêu khóa: Band 7.0' : 'Target Goal: Band 7.0'}</div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Dashboard Columns */}
      {!isLoading && !error && (
        <div className="teacher-dash-main-cols">
          {/* Left Column: Pending Submissions Queue & 4-Skill Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Pending Submissions Queue */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <Clock size={20} color="#4f46e5" />
                  <h2 className="teacher-dash-section-title">
                    {isVi ? 'Hàng đợi bài nộp cần chấm & duyệt' : 'Pending Grading & Review Queue'}
                  </h2>
                  <span className={`teacher-dash-section-badge ${pendingSubmissions.length > 0 ? 'urgent' : ''}`}>
                    {pendingSubmissions.length} {isVi ? 'bài' : 'items'}
                  </span>
                </div>
                <button 
                  className="teacher-dash-link-action"
                  onClick={() => navigate('/teacher/assignments')}
                >
                  <span>{isVi ? 'Xem tất cả bài tập' : 'View all assignments'}</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Skill Filter Tabs */}
              <div className="teacher-dash-skill-tabs">
                <button 
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('all')}
                >
                  <span>{isVi ? 'Tất cả' : 'All Skills'}</span>
                  <span className="teacher-dash-tab-count">{queueCounts.all}</span>
                </button>
                <button 
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'writing' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('writing')}
                >
                  <PenTool size={13} />
                  <span>Writing</span>
                  <span className="teacher-dash-tab-count">{queueCounts.writing}</span>
                </button>
                <button 
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'speaking' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('speaking')}
                >
                  <Mic size={13} />
                  <span>Speaking</span>
                  <span className="teacher-dash-tab-count">{queueCounts.speaking}</span>
                </button>
                <button 
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'reading' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('reading')}
                >
                  <BookOpen size={13} />
                  <span>Reading</span>
                  <span className="teacher-dash-tab-count">{queueCounts.reading}</span>
                </button>
                <button 
                  className={`teacher-dash-skill-tab-btn ${selectedSkill === 'listening' ? 'active' : ''}`}
                  onClick={() => setSelectedSkill('listening')}
                >
                  <Headphones size={13} />
                  <span>Listening</span>
                  <span className="teacher-dash-tab-count">{queueCounts.listening}</span>
                </button>
              </div>

              {/* Submission Queue Items */}
              <div className="teacher-dash-queue-list">
                {filteredQueue.map((item) => (
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
                            <Sparkles size={11} />
                            {isVi ? `AI: ${item.aiPreScore}` : `AI: ${item.aiPreScore}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="teacher-dash-queue-actions">
                      <button 
                        className="teacher-dash-btn-grade"
                        onClick={() => navigate(`/teacher/assignments/${item.assignmentId}/submissions/${item.studentId}`)}
                      >
                        <Zap size={13} />
                        <span>{isVi ? 'Chấm bài' : 'Grade Now'}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {filteredQueue.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <CheckCircle2 size={32} color="#16a34a" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {isVi ? 'Không có bài nộp chờ chấm nào' : 'No submissions waiting in queue'}
                    </h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                      {isVi ? 'Tất cả bài tập đã được chấm hoặc học sinh chưa nộp bài mới.' : 'All submissions have been reviewed or none are pending.'}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 4-Skill Matrix Performance */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <Award size={20} color="#4f46e5" />
                  <h2 className="teacher-dash-section-title">
                    {isVi ? 'Năng lực 4 Kỹ năng (Tổng hợp các lớp)' : '4-Skill Competence Matrix'}
                  </h2>
                </div>
                <button 
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
                        {item.skill === 'writing' && <PenTool size={14} color="#2563eb" />}
                        {item.skill === 'speaking' && <Mic size={14} color="#9333ea" />}
                        {item.skill === 'reading' && <BookOpen size={14} color="#16a34a" />}
                        {item.skill === 'listening' && <Headphones size={14} color="#0d9488" />}
                        {item.skillName}
                      </span>
                      <span className="teacher-dash-skill-score">
                        {item.avgScore > 0 ? item.avgScore : '—'}
                      </span>
                    </div>

                    <div className="teacher-dash-skill-benchmark">
                      {isVi ? `Mục tiêu chuẩn: Band ${item.benchmark}` : `Benchmark: Band ${item.benchmark}`}
                    </div>

                    <div className="teacher-dash-progress-track">
                      <div 
                        className={`teacher-dash-progress-bar ${item.skill}`}
                        style={{ width: `${(item.avgScore / 9.0) * 100}%` }}
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
                  <BookOpen size={20} color="#4f46e5" />
                  <h2 className="teacher-dash-section-title">
                    {isVi ? 'Tổng quan các Lớp đang phụ trách' : 'My Active Classes Overview'}
                  </h2>
                  <span className="teacher-dash-section-badge">{classesData.length} {isVi ? 'lớp' : 'classes'}</span>
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
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                          <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 3 }} />
                          {isVi ? 'Đã hoàn tất' : 'All Graded'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {classesData.length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '36px 20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                    <BookOpen size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {isVi ? 'Chưa có lớp học nào được phân công' : 'No classes assigned'}
                    </h4>
                    <p style={{ margin: '4px 0 12px 0', fontSize: '12.5px', color: '#64748b' }}>
                      {isVi ? 'Liên hệ Quản trị viên để được xếp lớp giảng dạy.' : 'Contact administrator to be assigned classes.'}
                    </p>
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
                  <Calendar size={18} color="#4f46e5" />
                  <h3 className="teacher-dash-section-title">
                    {isVi ? 'Hạn nộp & Lịch sắp tới' : 'Upcoming Deadlines'}
                  </h3>
                </div>
              </div>

              <div className="teacher-dash-deadline-list">
                {upcomingDeadlines.map((item) => (
                  <div key={item.id} className="teacher-dash-deadline-item">
                    <div 
                      className="teacher-dash-deadline-icon"
                      style={{ 
                        backgroundColor: item.status === 'urgent' ? '#fef2f2' : '#eff6ff',
                        color: item.status === 'urgent' ? '#dc2626' : '#2563eb'
                      }}
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
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '12.5px' }}>
                    {isVi ? 'Không có hạn nộp nào trong thời gian tới.' : 'No upcoming deadlines.'}
                  </div>
                )}
              </div>
            </section>

            {/* Recent Teaching Activities */}
            <section className="teacher-dash-card-section">
              <div className="teacher-dash-section-header">
                <div className="teacher-dash-section-title-wrap">
                  <Zap size={18} color="#4f46e5" />
                  <h3 className="teacher-dash-section-title">
                    {isVi ? 'Hoạt động gần đây' : 'Recent Activity Stream'}
                  </h3>
                </div>
              </div>

              <div className="teacher-dash-activity-timeline">
                {recentActivities.map((act) => (
                  <div key={act.id} className="teacher-dash-activity-item">
                    <div 
                      className="teacher-dash-activity-dot"
                      style={{ 
                        backgroundColor: 
                          act.type === 'submission' ? '#2563eb' :
                          act.type === 'ai_graded' ? '#7e22ce' : '#16a34a'
                      }}
                    />
                    <div className="teacher-dash-activity-content">
                      <div className="teacher-dash-activity-title">{act.title}</div>
                      <div className="teacher-dash-activity-desc">{act.desc}</div>
                      <div className="teacher-dash-activity-time">{act.timestamp} • {act.className}</div>
                    </div>
                  </div>
                ))}

                {recentActivities.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748b', fontSize: '12.5px' }}>
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
