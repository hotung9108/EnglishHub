import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Headphones, 
  PenTool, 
  Mic, 
  Award,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { MetricCard, Button, EmptyState } from '../components/common';
import { useAuth } from '../contexts/AuthContext';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { reportService } from '../api/services/report.service';
import type { ReportStudentProgressResponse } from '../types/report.types';
import '../styles/student-dashboard.css';

interface DashboardAssignmentItem extends AssignmentSummary {
  className?: string;
  classId: number;
  submitted?: boolean;
  score?: number | null;
}

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [assignments, setAssignments] = useState<DashboardAssignmentItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [progress, setProgress] = useState<ReportStudentProgressResponse | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const handleRetry = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch student's classes
        const classRes = await classService.list({ limit: 50 });
        const activeClasses = classRes.data || [];
        if (isMounted) setClasses(activeClasses);

        // 2. Fetch submissions for student
        let subList: SubmissionListItem[] = [];
        if (user?.id) {
          try {
            const subRes = await submissionService.listSubmissions({ studentId: user.id, limit: 100 });
            subList = subRes.data || [];
            if (isMounted) setSubmissions(subList);
          } catch {
            // Fallback if submissions cannot be listed
            if (isMounted) setSubmissions([]);
          }

          // 3. Fetch progress report
          try {
            const progRes = await reportService.getStudentProgress(user.id);
            if (isMounted) setProgress(progRes);
          } catch {
            if (isMounted) setProgress(null);
          }
        }

        // 4. Fetch assignments for each class
        const assignmentPromises = activeClasses.map(async (cls) => {
          try {
            const res = await assignmentService.listAssignments(cls.id, { limit: 20 });
            const items = res.data || [];
            return await Promise.all(
              items.map(async (a) => {
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
                return {
                  ...a,
                  className: cls.name,
                  classId: cls.id,
                  submitted: !!matchedSub && matchedSub.status !== 'IN_PROGRESS',
                  score: matchedSub?.modules?.[0]?.grading?.finalScore ?? null,
                };
              })
            );
          } catch {
            return [];
          }
        });

        const assignmentResults = await Promise.all(assignmentPromises);
        if (isMounted) setAssignments(assignmentResults.flat());
      } catch (err: unknown) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.';
        setError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, reloadKey]);

  // Derived statistics
  const totalAssignments = assignments.length;
  const completedAssignmentsCount = useMemo(() => {
    return assignments.filter((a) => a.submitted).length;
  }, [assignments]);

  const pendingGradingCount = useMemo(() => {
    return submissions.filter((s) => s.status === 'SUBMITTED').length;
  }, [submissions]);

  // Upcoming deadlines (unsubmitted assignments sorted by deadline)
  const upcomingDeadlines = useMemo(() => {
    return assignments
      .filter((a) => !a.submitted && a.status === 'PUBLISHED')
      .sort((a, b) => new Date(a.closeAt).getTime() - new Date(b.closeAt).getTime())
      .slice(0, 4);
  }, [assignments]);

  // Average score derivation (Scale 10)
  const averageScore10 = useMemo(() => {
    if (progress?.skillAverages && progress.skillAverages.length > 0) {
      const sumPercent = progress.skillAverages.reduce((acc, curr) => acc + (Number(curr.averageScorePercent) || 0), 0);
      const avgPercent = sumPercent / progress.skillAverages.length;
      return (avgPercent / 10).toFixed(1);
    }
    const scores = assignments.map((a) => a.score).filter((s): s is number => s !== null && s !== undefined);
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return (avg > 10 ? avg / 10 : avg).toFixed(1);
    }
    return '--';
  }, [progress, assignments]);


  const getAssignmentIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('speaking') || lower.includes('nói')) return <Mic size={18} />;
    if (lower.includes('reading') || lower.includes('đọc')) return <BookOpen size={18} />;
    if (lower.includes('listening') || lower.includes('nghe')) return <Headphones size={18} />;
    return <PenTool size={18} />;
  };

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return 'Không có hạn';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 0) return 'Đã hết hạn';
      if (diffDays === 0) return 'Hạn nộp: Hôm nay';
      if (diffDays === 1) return 'Hạn nộp: Ngày mai';
      return `Hạn nộp: Còn ${diffDays} ngày (${d.toLocaleDateString('vi-VN')})`;
    } catch {
      return dateStr;
    }
  };

  const studentDisplayName = user?.fullName || 'Học viên';

  return (
    <div className="std-dashboard-container">
      {/* Greeting Hero Banner */}
      <section className="std-dash-hero">
        <div className="std-dash-hero-content">
          <div>
            <h1 className="std-dash-greeting">Chào mừng trở lại, {studentDisplayName}!</h1>
            <p className="std-dash-subgreeting">
              {upcomingDeadlines.length > 0 ? (
                <>
                  Hôm nay là một ngày tuyệt vời để nâng cao kỹ năng Tiếng Anh. Bạn có{' '}
                  <strong>{upcomingDeadlines.length} bài tập</strong> sắp đến hạn cần hoàn thành.
                </>
              ) : (
                'Tất cả bài tập đã được nộp đúng hạn. Tiếp tục duy trì phong độ học tập xuất sắc!'
              )}
            </p>
          </div>

          <div className="std-dash-target-pill">
            <div>
              <div className="std-dash-target-title">Mục tiêu học tập</div>
              <div className="std-dash-target-sub">Tiếng Anh Tổng Quát</div>
            </div>
            <div className="std-dash-target-divider"></div>
            <div>
              <div className="std-dash-target-val">8.5</div>
              <div className="std-dash-target-unit">Thang 10</div>
            </div>
          </div>
        </div>
      </section>

      {/* Error state alert */}
      {error && (
        <div className="std-error-banner">
          <div className="std-error-msg">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRetry}
            icon={RefreshCw}
          >
            Thử lại
          </Button>
        </div>
      )}

      {/* Quick Metrics Grid */}
      <section className="std-dash-stats-grid">
        <MetricCard
          title="Bài tập đã hoàn thành"
          value={isLoading ? '...' : `${completedAssignmentsCount} / ${totalAssignments}`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="Điểm TB 4 Kỹ năng"
          value={isLoading ? '...' : (averageScore10 !== '--' ? `${averageScore10} / 10` : '--')}
          icon={Award}
          iconBgColor="#f0fdf4"
          iconColor="#16a34a"
        />
        <MetricCard
          title="Đang chờ chấm điểm"
          value={isLoading ? '...' : `${pendingGradingCount} bài`}
          icon={Clock}
          iconBgColor="#fffbeb"
          iconColor="#d97706"
        />
      </section>

      {/* Main Content: Upcoming Deadlines & My Classes */}
      <div className="std-dash-main-grid">
        {/* Upcoming Deadlines */}
          <div className="std-dash-card">
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <Clock size={18} color="var(--primary)" />
                Bài Tập Sắp Đến Hạn (Deadlines)
              </h2>
              <button 
                type="button"
                className="speaking-btn-link"
                onClick={() => navigate('/student/assignments')}
              >
                Xem tất cả bài tập →
              </button>
            </div>

            <div className="std-dash-card-body p-4">
              {isLoading ? (
                <div className="flex flex-col gap-3 p-3">
                  <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="h-12 rounded-lg bg-slate-100 animate-pulse" />
                </div>
              ) : upcomingDeadlines.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Không có bài tập nào sắp đến hạn!"
                  description="Bạn đã hoàn thành tất cả các bài tập hiện có."
                />
              ) : (
                upcomingDeadlines.map((assignment) => (
                  <div key={assignment.id} className="std-deadline-item">
                    <div className="flex items-center gap-3">
                      <div className="std-deadline-icon">
                        {getAssignmentIcon(assignment.title)}
                      </div>
                      <div>
                        <h3 className="std-deadline-title">{assignment.title}</h3>
                        <div className="std-deadline-meta">
                          <span>{assignment.className || 'Lớp học'}</span>
                          <span>•</span>
                          <span className="std-deadline-tag">{formatDeadline(assignment.closeAt)}</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/student/assignments/${assignment.id}/overview`)}
                    >
                      Làm bài
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Classes Snapshot */}
          <div className="std-dash-card">
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <BookOpen size={18} color="var(--primary)" />
                Lớp Học Đang Diễn Ra
              </h2>
              <button 
                type="button"
                className="speaking-btn-link"
                onClick={() => navigate('/student/classes')}
              >
                Tất cả lớp học →
              </button>
            </div>

            <div className="std-dash-card-body p-4">
              {isLoading ? (
                <div className="std-class-grid">
                  <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
                  <div className="h-24 rounded-lg bg-slate-100 animate-pulse" />
                </div>
              ) : classes.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Chưa tham gia lớp học nào"
                  description="Liên hệ giảng viên hoặc quản trị viên để được ghi danh vào lớp."
                />
              ) : (
                <div className="std-class-grid">
                  {classes.slice(0, 4).map((cls) => {
                    const classAssignments = assignments.filter((a) => a.classId === cls.id);
                    return (
                      <div 
                        key={cls.id}
                        onClick={() => navigate(`/student/classes/${cls.id}`)}
                        className="std-class-card"
                      >
                        <div className="std-class-badge">{cls.name}</div>
                        <div className="std-class-name">{cls.name}</div>
                        <div className="std-class-status">Trạng thái: {cls.status}</div>
                        <div className="std-class-footer">
                          <span>{classAssignments.length} bài tập</span>
                          <span className="std-class-link">Chi tiết lớp →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
