import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Sparkles, 
  Headphones, 
  PenTool, 
  Mic, 
  TrendingUp,
  Award,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
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

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch student's classes
      const classRes = await classService.list({ limit: 50 });
      const activeClasses = classRes.data || [];
      setClasses(activeClasses);

      // 2. Fetch submissions for student
      let subList: SubmissionListItem[] = [];
      if (user?.id) {
        try {
          const subRes = await submissionService.listSubmissions({ studentId: user.id, limit: 100 });
          subList = subRes.data || [];
          setSubmissions(subList);
        } catch {
          // Fallback if submissions cannot be listed
          setSubmissions([]);
        }

        // 3. Fetch progress report
        try {
          const progRes = await reportService.getStudentProgress(user.id);
          setProgress(progRes);
        } catch {
          setProgress(null);
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
      setAssignments(assignmentResults.flat());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

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

  // Average score derivation
  const averageBand = useMemo(() => {
    if (progress?.skillAverages && progress.skillAverages.length > 0) {
      const sumPercent = progress.skillAverages.reduce((acc, curr) => acc + (Number(curr.averageScorePercent) || 0), 0);
      const avgPercent = sumPercent / progress.skillAverages.length;
      return (avgPercent / 100 * 9).toFixed(1);
    }
    const scores = assignments.map((a) => a.score).filter((s): s is number => s !== null && s !== undefined);
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return (avg / 100 * 9).toFixed(1);
    }
    return '--';
  }, [progress, assignments]);

  // Skill scores for 4 skills
  const skillScores = useMemo(() => {
    const defaultSkills = [
      { skill: 'LISTENING', name: 'Listening', band: '--', percent: 0, icon: Headphones, color: '#3b82f6', cls: 'listening' },
      { skill: 'READING', name: 'Reading', band: '--', percent: 0, icon: BookOpen, color: '#10b981', cls: 'reading' },
      { skill: 'WRITING', name: 'Writing', band: '--', percent: 0, icon: PenTool, color: '#f59e0b', cls: 'writing' },
      { skill: 'SPEAKING', name: 'Speaking', band: '--', percent: 0, icon: Mic, color: '#8b5cf6', cls: 'speaking' },
    ];

    if (!progress?.skillAverages || progress.skillAverages.length === 0) {
      return defaultSkills;
    }

    return defaultSkills.map((def) => {
      const found = progress.skillAverages.find((item) => String(item.skill).toUpperCase() === def.skill);
      if (found) {
        const percent = Math.min(100, Math.max(0, Math.round(Number(found.averageScorePercent) || 0)));
        const band = (percent / 100 * 9).toFixed(1);
        return { ...def, percent, band };
      }
      return def;
    });
  }, [progress]);

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
            <h1 className="std-dash-greeting">Chào mừng trở lại, {studentDisplayName}! 👋</h1>
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
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.8 }}>Mục tiêu chứng chỉ</div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>IELTS Academic</div>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' }}></div>
            <div>
              <div className="std-dash-target-val">7.5</div>
              <div style={{ fontSize: '10px', opacity: 0.8, textAlign: 'center' }}>Target Band</div>
            </div>
          </div>
        </div>
      </section>

      {/* Error state alert */}
      {error && (
        <div style={{ margin: '16px 0', padding: '16px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#991b1b' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchDashboardData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      )}

      {/* Quick Metrics Grid */}
      <section className="std-dash-stats-grid">
        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">
              {isLoading ? '...' : `${completedAssignmentsCount} / ${totalAssignments}`}
            </div>
            <div className="std-dash-stat-label">Bài tập đã hoàn thành</div>
          </div>
        </div>

        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">
              {isLoading ? '...' : `Band ${averageBand}`}
            </div>
            <div className="std-dash-stat-label">Điểm TB 4 Kỹ năng</div>
          </div>
        </div>

        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">
              {isLoading ? '...' : `${pendingGradingCount} bài`}
            </div>
            <div className="std-dash-stat-label">Đang chờ chấm điểm</div>
          </div>
        </div>

        <div className="std-dash-stat-card">
          <div className="std-dash-stat-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <Flame size={24} />
          </div>
          <div>
            <div className="std-dash-stat-num">7 Ngày 🔥</div>
            <div className="std-dash-stat-label">Chuỗi học tập liên tục</div>
          </div>
        </div>
      </section>

      {/* Main Two Column Layout */}
      <div className="std-dash-main-grid">
        {/* Left Column: Upcoming Deadlines & My Classes */}
        <div>
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

            <div className="std-dash-card-body" style={{ padding: '16px' }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 12 }}>
                  <div style={{ height: 48, borderRadius: 8, backgroundColor: 'var(--surface-container-low)', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 48, borderRadius: 8, backgroundColor: 'var(--surface-container-low)', animation: 'pulse 1.5s infinite' }} />
                </div>
              ) : upcomingDeadlines.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>Không có bài tập nào sắp đến hạn!</div>
                  <p style={{ fontSize: '13px', marginTop: 4 }}>Bạn đã hoàn thành tất cả các bài tập hiện có.</p>
                </div>
              ) : (
                upcomingDeadlines.map((assignment) => (
                  <div key={assignment.id} className="std-deadline-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getAssignmentIcon(assignment.title)}
                      </div>
                      <div>
                        <h3 className="std-deadline-title">{assignment.title}</h3>
                        <div className="std-deadline-meta">
                          <span>{assignment.className || 'Lớp học'}</span>
                          <span>•</span>
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>{formatDeadline(assignment.closeAt)}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="button"
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                      onClick={() => navigate(`/student/assignments/${assignment.id}/overview`)}
                    >
                      Làm bài
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Classes Snapshot */}
          <div className="std-dash-card" style={{ marginTop: '24px' }}>
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

            <div className="std-dash-card-body" style={{ padding: '16px' }}>
              {isLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div style={{ height: 100, borderRadius: 8, backgroundColor: 'var(--surface-container-low)', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 100, borderRadius: 8, backgroundColor: 'var(--surface-container-low)', animation: 'pulse 1.5s infinite' }} />
                </div>
              ) : classes.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <BookOpen size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <div>Chưa tham gia lớp học nào.</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {classes.slice(0, 4).map((cls) => {
                    const classAssignments = assignments.filter((a) => a.classId === cls.id);
                    return (
                      <div 
                        key={cls.id}
                        onClick={() => navigate(`/student/classes/${cls.id}`)}
                        style={{ padding: '16px', borderRadius: '10px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-low)', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--outline-variant)'; }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>{cls.name}</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)', marginBottom: 6 }}>{cls.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Trạng thái: {cls.status}</div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                          <span>{classAssignments.length} bài tập</span>
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>Chi tiết lớp →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 4-Skill Progress & AI Recommendations */}
        <div>
          {/* 4-Skill Proficiency Bars */}
          <div className="std-dash-card">
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <TrendingUp size={18} color="var(--primary)" />
                Năng Lực 4 Kỹ Năng
              </h2>
              <button
                type="button"
                className="speaking-btn-link"
                onClick={() => navigate('/student/analytics')}
              >
                Phân tích chi tiết →
              </button>
            </div>

            <div className="std-dash-card-body">
              {skillScores.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.skill} className="skill-bar-row">
                    <div className="skill-bar-info">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <IconComponent size={15} color={item.color} /> {item.name}
                      </span>
                      <span>Band {item.band}</span>
                    </div>
                    <div className="skill-bar-track">
                      <div className={`skill-bar-fill ${item.cls}`} style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Daily Recommendation */}
          <div className="std-dash-card" style={{ marginTop: '24px' }}>
            <div className="std-dash-card-header">
              <h2 className="std-dash-card-title">
                <Sparkles size={18} color="#16a34a" />
                AI Đề Xuất Bổ Trợ Hôm Nay
              </h2>
            </div>

            <div className="std-dash-card-body" style={{ padding: '16px' }}>
              <div className="ai-recommend-box">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: 2 }}>
                    Luyện tập Phát âm &amp; Ngữ điệu Speaking
                  </div>
                  <div style={{ fontSize: '11px', color: '#15803d', lineHeight: 1.4 }}>
                    Dựa trên đánh giá âm phổ gần nhất, cải thiện nối âm (linking sounds) và trọng âm từ sẽ giúp đẩy band Speaking lên 7.5+.
                  </div>
                  <button 
                    type="button"
                    style={{ marginTop: 8, padding: '4px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => navigate('/student/assignments')}
                  >
                    Xem bài tập Nói
                  </button>
                </div>
              </div>

              <div className="ai-recommend-box" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#bfdbfe' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', marginBottom: 2 }}>
                    Cấu trúc câu phức &amp; Mạo từ Writing
                  </div>
                  <div style={{ fontSize: '11px', color: '#1d4ed8', lineHeight: 1.4 }}>
                    Luyện tập mệnh đề quan hệ rút gọn và câu điều kiện hỗn hợp để nâng cao chỉ số Grammatical Range.
                  </div>
                  <button 
                    type="button"
                    style={{ marginTop: 8, padding: '4px 10px', fontSize: '11px', fontWeight: 700, backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    onClick={() => navigate('/student/assignments')}
                  >
                    Xem bài tập Viết
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
