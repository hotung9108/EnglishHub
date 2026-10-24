import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, TrendingUp, Search, 
  Headphones, BookOpen, Mic, PenTool, 
  CheckCircle2, AlertCircle, Users, Calendar, 
  Plus, Download, X, 
  ArrowUpRight, Award, FileText, Send, Eye,
  RefreshCw, BarChart3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary, type ClassDetail, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { studentEvaluationService } from '../api/services/student-evaluation.service';
import { Pagination } from '../components/common';
import type { 
  ClassSkill, 
  StudentGradeRow, 
  ClassAssignmentItem, 
  SkillAnalyticsItem
} from '../types/teacher-class.types';
import '../styles/teacher-class-details.css';

export const TeacherClassProgress: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Available classes & current class
  const [classesList, setClassesList] = useState<ClassSummary[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassDetail | null>(null);

  // Enriched Class Data
  const [enrolledMembers, setEnrolledMembers] = useState<ClassMember[]>([]);
  const [classAssignments, setClassAssignments] = useState<ClassAssignmentItem[]>([]);
  const [studentsRoster, setStudentsRoster] = useState<StudentGradeRow[]>([]);

  // Tab State
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'analytics'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exceed' | 'ontime' | 'support'>('all');

  // Pagination for students roster table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (filter: 'all' | 'exceed' | 'ontime' | 'support') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const [selectedStudent, setSelectedStudent] = useState<StudentGradeRow | null>(null);
  const [directMessageText, setDirectMessageText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper score color
  const getScoreClass = (score: number) => {
    if (score >= 7.5) return 'high';
    if (score >= 6.5) return 'medium';
    if (score > 0) return 'low';
    return 'none';
  };

  const detectSkill = (title: string): ClassSkill => {
    const t = title.toLowerCase();
    if (t.includes('speak') || t.includes('nói') || t.includes('part 1') || t.includes('part 2')) return 'speaking';
    if (t.includes('read') || t.includes('đọc') || t.includes('passage')) return 'reading';
    if (t.includes('listen') || t.includes('nghe') || t.includes('audio')) return 'listening';
    return 'writing';
  };

  // Load live class data
  useEffect(() => {
    let isMounted = true;

    const fetchClassProgressData = async () => {
      setError(null);
      try {
        // 1. Fetch all classes
        const classRes = await classService.list({ limit: 100 });
        if (!isMounted) return;
        const allClasses: ClassSummary[] = classRes.data || [];
        setClassesList(allClasses);

        if (allClasses.length === 0) {
          setIsLoading(false);
          return;
        }

        // 2. Resolve target class
        let targetClassSummary: ClassSummary | undefined = undefined;
        if (id) {
          const idNum = Number(id);
          if (!Number.isNaN(idNum)) {
            targetClassSummary = allClasses.find((c) => c.id === idNum);
          }
          if (!targetClassSummary) {
            targetClassSummary = allClasses.find((c) => c.name.toLowerCase().includes(id.toLowerCase()));
          }
        }

        if (!targetClassSummary) {
          targetClassSummary = allClasses[0];
        }

        // 3. Fetch class detail
        let classDetail: ClassDetail = targetClassSummary;
        try {
          classDetail = await classService.getDetail(targetClassSummary.id);
        } catch {
          // Fallback to summary
        }
        if (!isMounted) return;
        setCurrentClass(classDetail);

        // 4. Fetch enrolled members
        let members: ClassMember[] = [];
        try {
          members = await classService.listMembers(targetClassSummary.id);
          if (!isMounted) return;
          setEnrolledMembers(members);
        } catch {
          members = [];
        }
        if (!isMounted) return;

        // 5. Fetch assignments for this class
        let rawAssignments: AssignmentSummary[] = [];
        try {
          const aRes = await assignmentService.listAssignments(targetClassSummary.id, { limit: 100 });
          if (!isMounted) return;
          rawAssignments = aRes.data || [];
        } catch {
          rawAssignments = [];
        }
        if (!isMounted) return;

        // 6. Fetch class submissions, keeping only the assignments loaded above
        const assignmentIds = new Set(rawAssignments.map((assignment) => assignment.id));
        const classSubmissions = await submissionService.listAllSubmissions({ classId: targetClassSummary.id });
        if (!isMounted) return;
        const allSubmissions = classSubmissions.filter((submission) => assignmentIds.has(submission.assignmentId));
        const allSubmissionsByAssignId: Record<number, SubmissionListItem[]> = {};
        for (const submission of allSubmissions) {
          (allSubmissionsByAssignId[submission.assignmentId] ??= []).push(submission);
        }

        // Map class assignments items (clean, real fields)
        const mappedAssignments: ClassAssignmentItem[] = rawAssignments.map((a) => {
          const subs = allSubmissionsByAssignId[a.id] || [];
          const submittedCount = subs.length;
          const pendingGrading = subs.filter(
            (s) => s.status === 'SUBMITTED' || s.modules.some((m) => m.grading?.status === 'PENDING')
          ).length;

          const gradedScores = subs
            .flatMap((s) => s.modules)
            .map((m) => m.grading?.finalScore)
            .filter((sc): sc is number => sc !== null && sc !== undefined);

          const avgScore = gradedScores.length > 0 
            ? Math.round((gradedScores.reduce((x, y) => x + y, 0) / gradedScores.length) * 10) / 10 
            : 0;

          const closeDate = a.closeAt ? new Date(a.closeAt) : null;
          let daysLeft = 0;
          let status: 'open' | 'closed' | 'upcoming' = 'open';

          if (closeDate) {
            const diffMs = closeDate.getTime() - Date.now();
            daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            if (diffMs < 0) status = 'closed';
            else if (a.status === 'DRAFT') status = 'upcoming';
            else status = 'open';
          }

          const skill = detectSkill(a.title);

          return {
            id: String(a.id),
            title: a.title,
            skill,
            dueDate: closeDate ? closeDate.toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : '—',
            daysLeft,
            submittedCount,
            totalStudents: Math.max(1, members.length),
            pendingGrading,
            avgScore,
            status
          };
        });
        if (!isMounted) return;
        setClassAssignments(mappedAssignments);

        // 7. Build Student Grade Roster
        const rosterRows: StudentGradeRow[] = members.map((member) => {
          const studentSubs = allSubmissions.filter((s) => s.studentId === member.studentId);
          const completedCount = studentSubs.length;

          const writingScores: number[] = [];
          const speakingScores: number[] = [];
          const readingScores: number[] = [];
          const listeningScores: number[] = [];

          for (const sub of studentSubs) {
            for (const mod of sub.modules) {
              const score = mod.grading?.finalScore;
              if (score !== null && score !== undefined) {
                const skill = detectSkill(mod.skill || 'writing');
                if (skill === 'writing') writingScores.push(score);
                else if (skill === 'speaking') speakingScores.push(score);
                else if (skill === 'reading') readingScores.push(score);
                else if (skill === 'listening') listeningScores.push(score);
              }
            }
          }

          const avgOf = (arr: number[]) => {
            if (arr.length === 0) return 0;
            return Math.round((arr.reduce((x, y) => x + y, 0) / arr.length) * 10) / 10;
          };

          const w = avgOf(writingScores);
          const sp = avgOf(speakingScores);
          const r = avgOf(readingScores);
          const l = avgOf(listeningScores);
          const scoredSkills = [w, sp, r, l].filter((sc) => sc > 0);
          const overall = scoredSkills.length > 0 
            ? Math.round((scoredSkills.reduce((x, y) => x + y, 0) / scoredSkills.length) * 10) / 10 
            : 0;

          let status: 'exceed' | 'ontime' | 'support' = 'ontime';
          let statusLabel = isVi ? 'Đạt chuẩn' : 'On-track';

          if (overall >= 8.0 && completedCount >= rawAssignments.length * 0.8) {
            status = 'exceed';
            statusLabel = isVi ? 'Vượt trội' : 'Exceeding';
          } else if ((overall > 0 && overall < 6.0) || (rawAssignments.length > 0 && completedCount < rawAssignments.length * 0.5)) {
            status = 'support';
            statusLabel = isVi ? 'Cần hỗ trợ' : 'Needs Support';
          }

          const sortedSubs = [...studentSubs].sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
          const latestSub = sortedSubs[0];
          const lastActive = latestSub?.submittedAt 
            ? new Date(latestSub.submittedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') 
            : '—';

          const recentFeedback = completedCount > 0 
            ? (isVi ? `Đã hoàn thành ${completedCount} bài nộp.` : `Submitted ${completedCount} assignments.`)
            : (isVi ? 'Chưa có bài nộp nào.' : 'No submissions yet.');

          return {
            id: `std-${member.studentId}`,
            code: member.studentCode || `HV-${member.studentId.toString().padStart(4, '0')}`,
            name: member.fullName,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.fullName)}`,
            assignmentsCompleted: completedCount,
            totalAssignments: rawAssignments.length,
            scores: {
              writing: w,
              speaking: sp,
              reading: r,
              listening: l,
              overall
            },
            status,
            statusLabel,
            lastActive,
            recentFeedback
          };
        });

        if (!isMounted) return;
        setStudentsRoster(rosterRows);
      } catch (err) {
        console.error('Failed to load class progress data:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải dữ liệu tiến độ lớp học. Vui lòng thử lại.' : 'Failed to load class progress. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchClassProgressData();

    return () => {
      isMounted = false;
    };
  }, [id, isVi, reloadKey]);

  // Overall Class KPI Metrics (clean, real calculations)
  const classKpis = useMemo(() => {
    const totalStudents = enrolledMembers.length;
    const totalAssignmentsCount = classAssignments.length;
    const totalPossibleSubs = totalStudents * totalAssignmentsCount;

    const totalActualSubs = classAssignments.reduce((sum, a) => sum + a.submittedCount, 0);
    const completionRate = totalPossibleSubs > 0 
      ? Math.min(100, Math.round((totalActualSubs / totalPossibleSubs) * 100)) 
      : 0;

    const scores = studentsRoster.map((s) => s.scores.overall).filter((sc) => sc > 0);
    const avgScore = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '0.0';

    const gradedSubsCount = classAssignments.reduce((sum, a) => sum + Math.max(0, a.submittedCount - a.pendingGrading), 0);
    const supportCount = studentsRoster.filter((s) => s.status === 'support').length;

    return {
      totalStudents,
      completionRate,
      avgScore,
      supportCount,
      totalPossibleSubs,
      totalActualSubs,
      gradedSubsCount
    };
  }, [enrolledMembers, classAssignments, studentsRoster]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return studentsRoster.filter((std) => {
      const matchSearch = 
        std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || std.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [studentsRoster, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, safeCurrentPage, pageSize]);

  // 4-Skill Analytics Data calculated from submissions
  const skillAnalytics: SkillAnalyticsItem[] = useMemo(() => {
    const getAvg = (skill: ClassSkill) => {
      const vals = studentsRoster.map((s) => s.scores[skill]).filter((v) => v > 0);
      if (vals.length === 0) return 0;
      return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    };

    const getSkillCompletion = (skill: ClassSkill) => {
      const skillAssignments = classAssignments.filter((a) => a.skill === skill);
      if (skillAssignments.length === 0 || enrolledMembers.length === 0) return 0;
      const possible = skillAssignments.length * enrolledMembers.length;
      const actual = skillAssignments.reduce((sum, a) => sum + a.submittedCount, 0);
      return Math.min(100, Math.round((actual / possible) * 100));
    };

    const skills: { skill: ClassSkill; name: string }[] = [
      { skill: 'writing', name: 'Writing' },
      { skill: 'speaking', name: 'Speaking' },
      { skill: 'reading', name: 'Reading' },
      { skill: 'listening', name: 'Listening' }
    ];

    return skills.map(({ skill, name }) => {
      const skillAssignments = classAssignments.filter((a) => a.skill === skill);
      const gradedCount = skillAssignments.reduce((sum, a) => sum + Math.max(0, a.submittedCount - a.pendingGrading), 0);

      return {
        skill,
        name,
        avgScore: getAvg(skill),
        completionRate: getSkillCompletion(skill),
        assignmentCount: skillAssignments.length,
        gradedCount
      };
    });
  }, [studentsRoster, classAssignments, enrolledMembers]);

  const handleClassChange = (newClassId: string) => {
    navigate(`/teacher/classes/${newClassId}/progress`);
  };

  const handleSendDirectEvaluation = async () => {
    if (!selectedStudent || !currentClass) return;
    try {
      const studentIdNum = Number(selectedStudent.id.replace('std-', ''));
      if (directMessageText.trim()) {
        await studentEvaluationService.create(studentIdNum, {
          classId: currentClass.id,
          content: directMessageText
        });
      }
      showToast(isVi ? `Đã lưu nhận xét cho ${selectedStudent.name}!` : `Evaluation saved for ${selectedStudent.name}!`);
      setSelectedStudent(null);
      setDirectMessageText('');
    } catch (err) {
      console.error('Failed to send evaluation:', err);
      showToast(isVi ? 'Không thể lưu nhận xét lúc này. Vui lòng thử lại.' : 'Failed to save evaluation. Please retry.');
      setSelectedStudent(null);
      setDirectMessageText('');
    }
  };

  const handleExportCsv = () => {
    if (studentsRoster.length === 0) {
      showToast(isVi ? 'Không có dữ liệu học viên để xuất file.' : 'No data to export.');
      return;
    }
    const headers = [
      isVi ? 'Mã học viên' : 'Student Code',
      isVi ? 'Họ và tên' : 'Full Name',
      isVi ? 'Bài nộp' : 'Submissions',
      'Writing',
      'Speaking',
      'Reading',
      'Listening',
      isVi ? 'Điểm trung bình' : 'Average Score',
      isVi ? 'Trạng thái' : 'Status'
    ];
    const rows = studentsRoster.map((s) => [
      s.code,
      `"${s.name}"`,
      `${s.assignmentsCompleted}/${s.totalAssignments}`,
      s.scores.writing > 0 ? s.scores.writing : '',
      s.scores.speaking > 0 ? s.scores.speaking : '',
      s.scores.reading > 0 ? s.scores.reading : '',
      s.scores.listening > 0 ? s.scores.listening : '',
      s.scores.overall > 0 ? s.scores.overall : '',
      `"${s.statusLabel}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Diem_${currentClass?.name || 'Class'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isVi ? 'Đã xuất file bảng điểm thành công!' : 'Gradebook exported successfully!');
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '800px', margin: '40px auto' }}>
        <RefreshCw size={36} color="var(--primary, #1b4d3e)" className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          {isVi ? 'Đang tải dữ liệu tiến độ lớp học...' : 'Loading class progress...'}
        </h3>
        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          {isVi ? 'Đang đồng bộ kết quả bài tập và học viên.' : 'Syncing assignments and student results.'}
        </p>
      </div>
    );
  }

  if (error || !currentClass) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertCircle size={24} color="#dc2626" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#b91c1c' }}>
            {error || (isVi ? 'Không tìm thấy lớp học này.' : 'Class not found.')}
          </h3>
        </div>
        <button 
          className="tcd-btn-secondary"
          onClick={handleRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>{isVi ? 'Thử lại' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="tcd-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="tcd-toast-alert">
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Breadcrumbs */}
      <nav className="tcd-breadcrumbs">
        <Link to="/teacher/classes" className="tcd-breadcrumb-link">
          {isVi ? 'Lớp học của tôi' : 'My Classes'}
        </Link>
        <ChevronRight size={14} />
        <span className="tcd-breadcrumb-active">{currentClass.name}</span>
        <ChevronRight size={14} />
        <span className="tcd-breadcrumb-active">
          {isVi ? 'Tiến độ học tập' : 'Class Progress'}
        </span>
      </nav>

      {/* 2. Hero Header Card */}
      <section className="tcd-hero-card">
        <div className="tcd-hero-top">
          <div className="tcd-hero-main-info">
            <span className={`tcd-status-badge ${currentClass.status === 'ACTIVE' ? 'active' : 'completed'}`}>
              {currentClass.status === 'ACTIVE' 
                ? (isVi ? 'Đang hoạt động' : 'Active') 
                : (isVi ? 'Đã hoàn thành' : 'Completed')}
            </span>

            <h1 className="tcd-class-title">{currentClass.name}</h1>

            {currentClass.description && (
              <p className="tcd-class-desc">{currentClass.description}</p>
            )}

            <div className="tcd-meta-row">
              <span className="tcd-meta-item">
                <Users size={14} />
                <span><strong>{enrolledMembers.length}</strong> {isVi ? 'học viên' : 'students'}</span>
              </span>

              {currentClass.level && (
                <span className="tcd-meta-item">
                  <Award size={14} />
                  <span>{currentClass.level}</span>
                </span>
              )}

              {(currentClass.startDate || currentClass.endDate) && (
                <span className="tcd-meta-item">
                  <Calendar size={14} />
                  <span>
                    {currentClass.startDate ? new Date(currentClass.startDate).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : ''}
                    {currentClass.endDate ? ` - ${new Date(currentClass.endDate).toLocaleDateString(isVi ? 'vi-VN' : 'en-US')}` : ''}
                  </span>
                </span>
              )}

              {currentClass.teacher?.fullName && (
                <span className="tcd-meta-item">
                  <BookOpen size={14} />
                  <span>{currentClass.teacher.fullName}</span>
                </span>
              )}
            </div>
          </div>

          {/* Header Actions */}
          <div className="tcd-hero-actions">
            {/* Quick Class Switcher */}
            {classesList.length > 1 && (
              <select
                className="tcd-class-select"
                value={String(currentClass.id)}
                onChange={(e) => handleClassChange(e.target.value)}
                title={isVi ? 'Đổi lớp nhanh' : 'Switch Class'}
              >
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button 
              className="tcd-btn-secondary"
              onClick={handleExportCsv}
            >
              <Download size={14} />
              <span>{isVi ? 'Xuất CSV' : 'Export CSV'}</span>
            </button>

            <button 
              className="tcd-btn-primary"
              onClick={() => navigate(`/teacher/assignments/create?classId=${currentClass.id}`)}
            >
              <Plus size={15} />
              <span>{isVi ? 'Giao bài tập' : 'Assign Homework'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. 4 KPI Metrics */}
      <section className="tcd-kpi-grid">
        {/* KPI 1: Enrolled Students */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <span className="tcd-kpi-label">{isVi ? 'Tổng số học viên' : 'Enrolled Students'}</span>
            <div className="tcd-kpi-icon">
              <Users size={18} />
            </div>
          </div>
          <div className="tcd-kpi-value-wrap">
            <span className="tcd-kpi-value">{classKpis.totalStudents}</span>
            <span className="tcd-kpi-suffix">{isVi ? 'học viên' : 'students'}</span>
          </div>
          <div className="tcd-kpi-foot-text">
            <span>{classAssignments.length} {isVi ? 'bài tập đã giao' : 'assignments created'}</span>
          </div>
        </div>

        {/* KPI 2: Completion Rate */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <span className="tcd-kpi-label">{isVi ? 'Tỷ lệ hoàn thành' : 'Completion Rate'}</span>
            <div className="tcd-kpi-icon">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="tcd-kpi-value-wrap">
            <span className="tcd-kpi-value">{classKpis.completionRate}%</span>
          </div>
          <div className="tcd-mini-progress">
            <div 
              className="tcd-mini-progress-fill" 
              style={{ width: `${classKpis.completionRate}%`, backgroundColor: 'var(--primary, #1b4d3e)' }}
            />
          </div>
          <div className="tcd-kpi-foot-text">
            <span>{classKpis.totalActualSubs} / {classKpis.totalPossibleSubs} {isVi ? 'lượt nộp bài' : 'submissions'}</span>
          </div>
        </div>

        {/* KPI 3: Average Score */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <span className="tcd-kpi-label">{isVi ? 'Điểm trung bình lớp' : 'Class Average Score'}</span>
            <div className="tcd-kpi-icon">
              <Award size={18} />
            </div>
          </div>
          <div className="tcd-kpi-value-wrap">
            <span className="tcd-kpi-value">{classKpis.avgScore}</span>
            <span className="tcd-kpi-suffix">/ 10</span>
          </div>
          <div className="tcd-mini-progress">
            <div 
              className="tcd-mini-progress-fill" 
              style={{ width: `${Math.min(100, (parseFloat(classKpis.avgScore) / 10.0) * 100)}%`, backgroundColor: 'var(--primary, #1b4d3e)' }}
            />
          </div>
          <div className="tcd-kpi-foot-text">
            <span>{classKpis.gradedSubsCount} {isVi ? 'bài đã chấm điểm' : 'graded submissions'}</span>
          </div>
        </div>

        {/* KPI 4: Students Needing Support */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <span className="tcd-kpi-label">{isVi ? 'Cần theo dõi & hỗ trợ' : 'Needs Support'}</span>
            <div className="tcd-kpi-icon warning">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="tcd-kpi-value-wrap">
            <span className="tcd-kpi-value">{classKpis.supportCount}</span>
            <span className="tcd-kpi-suffix">{isVi ? 'học viên' : 'students'}</span>
          </div>
          <div className="tcd-kpi-foot-text">
            <span>{isVi ? 'Điểm TB < 6.0 hoặc nộp < 60%' : 'Avg < 6.0 or turnout < 60%'}</span>
          </div>
        </div>
      </section>

      {/* 4. Tab Navigation */}
      <div className="tcd-tabs-bar">
        <button 
          className={`tcd-tab-item ${activeTab === 'roster' ? 'active' : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          <Users size={16} />
          <span>{isVi ? 'Sổ điểm & Học viên' : 'Gradebook & Students'}</span>
          <span className="tcd-tab-count">{studentsRoster.length}</span>
        </button>

        <button 
          className={`tcd-tab-item ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText size={16} />
          <span>{isVi ? 'Danh sách Bài tập' : 'Class Assignments'}</span>
          <span className="tcd-tab-count">{classAssignments.length}</span>
        </button>

        <button 
          className={`tcd-tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={16} />
          <span>{isVi ? 'Đánh giá 4 kỹ năng' : '4-Skill Performance'}</span>
        </button>
      </div>

      {/* 5. TAB 1: Sổ điểm & Học viên */}
      {activeTab === 'roster' && (
        <section className="tcd-card-section">
          {/* Toolbar */}
          <div className="tcd-toolbar">
            <div className="tcd-search-wrap">
              <Search size={15} className="tcd-search-icon" />
              <input 
                type="text" 
                className="tcd-search-input"
                placeholder={isVi ? 'Tìm kiếm theo tên hoặc mã HV...' : 'Search by name or student ID...'}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <div className="tcd-filter-pills">
              <button 
                className={`tcd-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('all')}
              >
                {isVi ? 'Tất cả' : 'All'} ({studentsRoster.length})
              </button>
              <button 
                className={`tcd-pill-btn ${statusFilter === 'exceed' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('exceed')}
              >
                {isVi ? 'Vượt trội' : 'Exceeding'} ({studentsRoster.filter(s => s.status === 'exceed').length})
              </button>
              <button 
                className={`tcd-pill-btn ${statusFilter === 'ontime' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('ontime')}
              >
                {isVi ? 'Đạt chuẩn' : 'On-track'} ({studentsRoster.filter(s => s.status === 'ontime').length})
              </button>
              <button 
                className={`tcd-pill-btn ${statusFilter === 'support' ? 'active' : ''}`}
                onClick={() => handleStatusFilterChange('support')}
              >
                {isVi ? 'Cần hỗ trợ' : 'Needs Support'} ({studentsRoster.filter(s => s.status === 'support').length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="tcd-table-wrap">
            <table className="tcd-table">
              <thead>
                <tr>
                  <th>{isVi ? 'Học viên' : 'Student'}</th>
                  <th>{isVi ? 'Tiến độ nộp' : 'Submissions'}</th>
                  <th className="text-center">Writing</th>
                  <th className="text-center">Speaking</th>
                  <th className="text-center">Reading</th>
                  <th className="text-center">Listening</th>
                  <th className="text-center">{isVi ? 'Điểm TB' : 'Overall'}</th>
                  <th>{isVi ? 'Trạng thái' : 'Status'}</th>
                  <th className="text-right">{isVi ? 'Chi tiết' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((std) => (
                  <tr 
                    key={std.id} 
                    className={std.status === 'support' ? 'row-support' : ''}
                  >
                    <td>
                      <div className="tcd-student-cell">
                        <img src={std.avatar} alt={std.name} className="tcd-avatar" />
                        <div className="tcd-student-info-text">
                          <span className="tcd-student-name">{std.name}</span>
                          <span className="tcd-student-code">{std.code}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="tcd-submission-col">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{std.assignmentsCompleted}/{std.totalAssignments}</span>
                          <span className="font-semibold">
                            {std.totalAssignments > 0 ? Math.round((std.assignmentsCompleted / std.totalAssignments) * 100) : 0}%
                          </span>
                        </div>
                        <div className="tcd-mini-progress">
                          <div 
                            className="tcd-mini-progress-fill" 
                            style={{ 
                              width: `${std.totalAssignments > 0 ? (std.assignmentsCompleted / std.totalAssignments) * 100 : 0}%`,
                              backgroundColor: std.assignmentsCompleted < Math.ceil(std.totalAssignments * 0.5) && std.totalAssignments > 0
                                ? '#dc2626' 
                                : 'var(--primary, #1b4d3e)'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="text-center">
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.writing)}`}>
                        {std.scores.writing > 0 ? std.scores.writing : '—'}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.speaking)}`}>
                        {std.scores.speaking > 0 ? std.scores.speaking : '—'}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.reading)}`}>
                        {std.scores.reading > 0 ? std.scores.reading : '—'}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.listening)}`}>
                        {std.scores.listening > 0 ? std.scores.listening : '—'}
                      </span>
                    </td>

                    <td className="text-center">
                      <span className="tcd-overall-score">{std.scores.overall > 0 ? std.scores.overall : '—'}</span>
                    </td>

                    <td>
                      <span className={`tcd-status-chip ${std.status}`}>
                        {std.statusLabel}
                      </span>
                    </td>

                    <td className="text-right">
                      <button 
                        className="tcd-btn-action-icon"
                        title={isVi ? 'Xem chi tiết học viên' : 'View Student'}
                        onClick={() => setSelectedStudent(std)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center p-6 text-muted text-sm">
                      {isVi ? 'Không có học viên nào khớp với bộ lọc tìm kiếm.' : 'No students match your criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {filteredStudents.length > 0 && (
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalItems={filteredStudents.length}
                itemLabel={isVi ? 'học viên' : 'students'}
                isVi={isVi}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setCurrentPage(1);
                }}
                pageSizeOptions={[5, 10, 20]}
                variant="table"
              />
            )}
          </div>
        </section>
      )}

      {/* 6. TAB 2: Danh sách Bài tập lớp */}
      {activeTab === 'assignments' && (
        <section className="tcd-card-section">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-main m-0">
                {isVi ? 'Bài tập đã giao cho lớp' : 'Assignments for this Class'}
              </h2>
            </div>
            <button 
              className="tcd-btn-primary"
              onClick={() => navigate(`/teacher/assignments/create?classId=${currentClass.id}`)}
            >
              <Plus size={15} />
              <span>{isVi ? 'Giao bài tập mới' : 'New Assignment'}</span>
            </button>
          </div>

          <div className="tcd-assignments-grid">
            {classAssignments.map((hw) => (
              <div key={hw.id} className="tcd-assignment-card">
                <div className="tcd-assignment-card-header">
                  <span className={`tcd-skill-badge ${hw.skill}`}>
                    {hw.skill}
                  </span>
                  <span className={`tcd-status-chip ${hw.status === 'open' ? 'ontime' : 'support'}`}>
                    {hw.status === 'open' ? (isVi ? 'Đang mở' : 'Open') : (isVi ? 'Đã đóng' : 'Closed')}
                  </span>
                </div>

                <h3 className="tcd-assignment-title">
                  {hw.title}
                </h3>

                <div className="tcd-assignment-meta">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {hw.dueDate}
                  </span>
                  {hw.status === 'open' && (
                    <span className={`font-semibold ${hw.daysLeft === 0 ? 'text-danger' : 'text-primary'}`}>
                      {hw.daysLeft === 0 ? (isVi ? 'Hạn hôm nay' : 'Due today') : `${hw.daysLeft} ${isVi ? 'ngày nữa' : 'days left'}`}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{isVi ? 'Đã nộp:' : 'Turnout:'} <strong>{hw.submittedCount}/{hw.totalStudents}</strong></span>
                    <span className="font-semibold">{Math.round((hw.submittedCount / hw.totalStudents) * 100)}%</span>
                  </div>
                  <div className="tcd-mini-progress">
                    <div 
                      className="tcd-mini-progress-fill" 
                      style={{ 
                        width: `${Math.min(100, (hw.submittedCount / hw.totalStudents) * 100)}%`,
                        backgroundColor: 'var(--primary, #1b4d3e)'
                      }}
                    />
                  </div>
                </div>

                <div className="tcd-assignment-stat-row">
                  <span>
                    {isVi ? 'Chờ chấm:' : 'To Grade:'} <strong className={hw.pendingGrading > 0 ? 'text-danger' : 'text-success'}>{hw.pendingGrading}</strong>
                  </span>
                  {hw.avgScore > 0 ? (
                    <span>{isVi ? 'Điểm TB:' : 'Avg:'} <strong>{hw.avgScore} / 10</strong></span>
                  ) : (
                    <span className="text-muted">{isVi ? 'Chưa chấm' : 'Not graded'}</span>
                  )}
                </div>

                <div className="tcd-assignment-actions">
                  <button 
                    className="tcd-btn-primary flex-1 justify-center"
                    onClick={() => navigate(`/teacher/assignments/${hw.id}`)}
                  >
                    <span>{isVi ? 'Chấm bài & Quản lý' : 'Grade & Manage'}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}

            {classAssignments.length === 0 && (
              <div className="col-span-full text-center p-6 bg-surface-low rounded-xl border-dashed border-subtle">
                <FileText size={36} className="m-auto mb-2 block text-muted" />
                <h4 className="m-0 text-base font-bold text-main">
                  {isVi ? 'Lớp này chưa có bài tập nào' : 'No assignments created yet'}
                </h4>
                <p className="mt-1 mb-4 text-xs text-muted">
                  {isVi ? 'Tạo bài tập đầu tiên để bắt đầu theo dõi tiến độ của học viên.' : 'Create first assignment to start tracking student progress.'}
                </p>
                <button 
                  className="tcd-btn-primary"
                  onClick={() => navigate(`/teacher/assignments/create?classId=${currentClass.id}`)}
                >
                  <Plus size={14} />
                  <span>{isVi ? 'Giao bài tập mới' : 'Create Assignment'}</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. TAB 3: Đánh giá 4 Kỹ năng */}
      {activeTab === 'analytics' && (
        <section className="tcd-card-section">
          <div>
            <h2 className="text-base font-bold text-main m-0">
              {isVi ? 'Đánh giá Năng lực 4 Kỹ năng' : '4-Skill Performance Summary'}
            </h2>
          </div>

          <div className="tcd-analytics-grid">
            {skillAnalytics.map((sk) => (
              <div key={sk.skill} className="tcd-analytics-skill-card">
                <div className="tcd-skill-card-top">
                  <span className="tcd-skill-tag-name">
                    {sk.skill === 'writing' && <PenTool size={16} color="var(--skill-writing, #8C5E14)" />}
                    {sk.skill === 'speaking' && <Mic size={16} color="var(--skill-speaking, #5B21B6)" />}
                    {sk.skill === 'reading' && <BookOpen size={16} color="var(--skill-reading, #16533D)" />}
                    {sk.skill === 'listening' && <Headphones size={16} color="var(--skill-listening, #1E3A8A)" />}
                    <span>{sk.name}</span>
                  </span>

                  <div className="tcd-skill-score-box">
                    <span className="tcd-skill-avg-score">{sk.avgScore > 0 ? sk.avgScore : '—'}</span>
                    {sk.avgScore > 0 && <span style={{ fontSize: '12px', color: '#64748b' }}>/ 10</span>}
                  </div>
                </div>

                <div className="tcd-mini-progress">
                  <div 
                    className="tcd-mini-progress-fill" 
                    style={{ 
                      width: `${Math.min(100, Math.round((sk.avgScore / 10.0) * 100))}%`,
                      backgroundColor: sk.skill === 'writing' ? 'var(--skill-writing, #8C5E14)' : sk.skill === 'speaking' ? 'var(--skill-speaking, #5B21B6)' : sk.skill === 'reading' ? 'var(--skill-reading, #16533D)' : 'var(--skill-listening, #1E3A8A)'
                    }}
                  />
                </div>

                <div className="tcd-skill-stats-list">
                  <div className="tcd-skill-stat-item">
                    <span>{isVi ? 'Tỷ lệ hoàn thành:' : 'Completion Rate:'}</span>
                    <strong>{sk.completionRate}%</strong>
                  </div>
                  <div className="tcd-skill-stat-item">
                    <span>{isVi ? 'Bài tập trong lớp:' : 'Assignments:'}</span>
                    <strong>{sk.assignmentCount} {isVi ? 'bài' : 'items'}</strong>
                  </div>
                  <div className="tcd-skill-stat-item">
                    <span>{isVi ? 'Bài đã chấm điểm:' : 'Graded Submissions:'}</span>
                    <strong>{sk.gradedCount} {isVi ? 'bài' : 'items'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Student Detail Drawer (Modal) */}
      {selectedStudent && (
        <div className="tcd-drawer-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="tcd-drawer-box" onClick={(e) => e.stopPropagation()}>
            <div className="tcd-drawer-header">
              <div className="flex items-center gap-3">
                <img src={selectedStudent.avatar} alt={selectedStudent.name} className="tcd-avatar tcd-drawer-avatar" />
                <div>
                  <h3 className="m-0 text-base font-bold text-main">{selectedStudent.name}</h3>
                  <div className="text-xs text-muted mt-1">{selectedStudent.code}</div>
                </div>
              </div>
              <button 
                className="tcd-btn-action-icon"
                onClick={() => setSelectedStudent(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="tcd-drawer-body">
              {/* Overall Score Box */}
              <div className="tcd-drawer-overall-box">
                <div>
                  <div className="text-xs text-muted font-semibold">{isVi ? 'Điểm trung bình (Overall)' : 'Overall Average'}</div>
                  <div className="text-2xl font-bold text-main">
                    {selectedStudent.scores.overall > 0 ? `${selectedStudent.scores.overall} / 10` : '—'}
                  </div>
                </div>
                <span className={`tcd-status-chip ${selectedStudent.status}`}>
                  {selectedStudent.statusLabel}
                </span>
              </div>

              {/* 4 Skills Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-main mb-2 mt-0">
                  {isVi ? 'Chi tiết 4 Kỹ năng' : '4-Skill Performance'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="tcd-skill-stat-card-writing">
                    <div style={{ fontSize: '11.5px', color: '#8c5e14', fontWeight: 600 }}>Writing</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#8c5e14', marginTop: '2px' }}>
                      {selectedStudent.scores.writing > 0 ? `${selectedStudent.scores.writing} / 10` : '—'}
                    </div>
                  </div>
                  <div className="tcd-skill-stat-card-speaking">
                    <div style={{ fontSize: '11.5px', color: '#5b21b6', fontWeight: 600 }}>Speaking</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#5b21b6', marginTop: '2px' }}>
                      {selectedStudent.scores.speaking > 0 ? `${selectedStudent.scores.speaking} / 10` : '—'}
                    </div>
                  </div>
                  <div className="tcd-skill-stat-card-reading">
                    <div style={{ fontSize: '11.5px', color: '#16533d', fontWeight: 600 }}>Reading</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#16533d', marginTop: '2px' }}>
                      {selectedStudent.scores.reading > 0 ? `${selectedStudent.scores.reading} / 10` : '—'}
                    </div>
                  </div>
                  <div className="tcd-skill-stat-card-listening">
                    <div style={{ fontSize: '11.5px', color: '#1e3a8a', fontWeight: 600 }}>Listening</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                      {selectedStudent.scores.listening > 0 ? `${selectedStudent.scores.listening} / 10` : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submissions & Activity */}
              <div>
                <h4 className="text-sm font-bold text-main mb-2 mt-0">
                  {isVi ? 'Tiến độ làm bài' : 'Assignment Progress'}
                </h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">{isVi ? 'Bài tập hoàn thành:' : 'Completed Assignments:'}</span>
                    <strong>{selectedStudent.assignmentsCompleted} / {selectedStudent.totalAssignments}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">{isVi ? 'Hoạt động gần nhất:' : 'Last Active:'}</span>
                    <strong>{selectedStudent.lastActive}</strong>
                  </div>
                </div>
              </div>

              {/* Direct Feedback / Evaluation input */}
              <div>
                <h4 className="text-sm font-bold text-main mb-2 mt-0">
                  {isVi ? 'Nhận xét đánh giá học viên' : 'Direct Evaluation'}
                </h4>
                <textarea
                  className="tcd-drawer-eval-input"
                  rows={3}
                  placeholder={isVi ? 'Nhập nhận xét hoặc hướng dẫn ôn tập cho học viên này...' : 'Enter evaluation for this student...'}
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                />
              </div>
            </div>

            <div className="tcd-drawer-footer">
              <button 
                className="tcd-btn-secondary"
                onClick={() => setSelectedStudent(null)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
              <button 
                className="tcd-btn-primary"
                onClick={handleSendDirectEvaluation}
              >
                <Send size={13} />
                <span>{isVi ? 'Lưu đánh giá' : 'Save Evaluation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClassProgress;
