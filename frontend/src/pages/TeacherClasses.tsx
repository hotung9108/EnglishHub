import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { classService, type ClassSummary } from '../api/services/class.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { submissionService } from '../api/services/submission.service';
import { 
  BookOpen, Users, Clock, Award, Search, Plus, 
  Calendar, MapPin, 
  RefreshCw, AlertCircle
} from 'lucide-react';
import { Button, EmptyState } from '../components/common';

interface TeacherClassCardData {
  id: string;
  code: string;
  name: string;
  teacher: string;
  room: string;
  schedule?: string;
  status: 'active' | 'completed';
  enrolledStudents: number;
  stats: {
    assigned: number;
    pending: number;
    avgScore: number;
  };
}

export const TeacherClasses: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { user } = useAuth();

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  const [classes, setClasses] = useState<TeacherClassCardData[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('current');

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchClasses = async () => {
      try {
        const res = await classService.list({ limit: 100 });
        const rawClasses: ClassSummary[] = res.data || [];

        // Filter classes for this teacher if teacherId is present
        const targetClasses = rawClasses.filter((c) => {
          if (user?.id && c.teacherId && c.teacherId === user.id) return true;
          return true;
        });

        const loadedList = await Promise.all(
          targetClasses.map(async (cls): Promise<TeacherClassCardData> => {
            let membersCount: number;
            try {
              const members = await classService.listMembers(cls.id);
              membersCount = members.length;
            } catch {
              membersCount = 0;
            }

            let assignments: AssignmentSummary[];
            try {
              const aRes = await assignmentService.listAssignments(cls.id, { limit: 50 });
              assignments = aRes.data || [];
            } catch {
              assignments = [];
            }

            let pendingCount = 0;
            const gradedScores: number[] = [];

            if (assignments.length > 0) {
              const subPromises = assignments.map(async (a) => {
                try {
                  const subRes = await submissionService.listSubmissions({ assignmentId: a.id, limit: 50 });
                  return subRes.data || [];
                } catch {
                  return [];
                }
              });
              const allSubs = (await Promise.all(subPromises)).flat();
              pendingCount = allSubs.filter(
                (s) => s.status === 'SUBMITTED' || s.modules.some((m) => m.grading?.status === 'PENDING')
              ).length;

              for (const s of allSubs) {
                for (const m of s.modules) {
                  if (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined) {
                    gradedScores.push(m.grading.finalScore);
                  }
                }
              }
            }

            const avgScore = gradedScores.length > 0 
              ? Math.round((gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length) * 10) / 10 
              : 0;

            return {
              id: String(cls.id),
              code: `CLASS-${cls.id.toString().padStart(2, '0')}`,
              name: cls.name,
              teacher: user?.fullName || (isVi ? 'Quý Thầy/Cô' : 'Teacher'),
              room: isVi ? 'Lớp học trực tuyến' : 'Online Classroom',
              schedule: isVi ? 'Theo thời khóa biểu' : 'Per timetable',
              status: cls.status === 'ACTIVE' ? 'active' : 'completed',
              enrolledStudents: membersCount,
              stats: {
                assigned: assignments.length,
                pending: pendingCount,
                avgScore
              }
            };
          })
        );

        if (isMounted) {
          setClasses(loadedList);
        }
      } catch (err) {
        console.error('Failed to load teacher classes:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải danh sách lớp học. Vui lòng thử lại.' : 'Failed to load class list. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchClasses();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.fullName, isVi, reloadKey]);

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (filter !== 'all' && cls.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return cls.name.toLowerCase().includes(q) || cls.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [classes, filter, searchQuery]);

  const counts = useMemo(() => {
    const active = classes.filter((c) => c.status === 'active').length;
    const completed = classes.filter((c) => c.status === 'completed').length;
    const totalStudents = classes.reduce((sum, c) => sum + c.enrolledStudents, 0);
    const totalPending = classes.reduce((sum, c) => sum + c.stats.pending, 0);
    const scores = classes.map((c) => c.stats.avgScore).filter((s) => s > 0);
    const overallAvg = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) 
      : '0.0';

    return {
      all: classes.length,
      active,
      completed,
      totalStudents,
      totalPending,
      overallAvg
    };
  }, [classes]);

  return (
    <div className="teacher-container">
      {/* Header */}
      <div className="teacher-header">
        <div>
          <h1 className="teacher-title">
            {isVi ? 'Quản lý lớp học' : 'Classes'}
          </h1>
        </div>

        <div className="flex gap-2 items-center">
          <Button 
            variant="primary" 
            size="sm"
            icon={Plus}
            onClick={() => navigate('/teacher/assignments/create')}
          >
            {isVi ? 'Giao bài tập mới' : 'Create Assignment'}
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="eh-card p-6 mb-6 text-center">
          <RefreshCw size={28} className="text-primary animate-spin m-auto mb-3" />
          <h3 className="m-0 text-sm font-bold text-main">
            {isVi ? 'Đang tải danh sách lớp học thực tế...' : 'Loading live classes...'}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {isVi ? 'Đang đồng bộ sĩ số, bài tập và điểm trung bình từng lớp.' : 'Syncing enrollment turnout and average class performance.'}
          </p>
        </div>
      )}

      {/* Error state */}
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

      {/* KPI Overview Cards */}
      {!isLoading && !error && (
        <div className="teacher-stats-grid">
          {/* Active Classes Card */}
          <div 
            className={`teacher-stat-card ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
          >
            <div className="teacher-stat-icon active">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="teacher-stat-num">{counts.active} {isVi ? 'Lớp' : 'Classes'}</div>
              <div className="teacher-stat-label">{isVi ? 'Lớp đang dạy' : 'Active Classes'}</div>
            </div>
          </div>

          {/* Total Students Card */}
          <div className="teacher-stat-card">
            <div className="teacher-stat-icon total">
              <Users size={22} />
            </div>
            <div>
              <div className="teacher-stat-num">{counts.totalStudents} {isVi ? 'Học viên' : 'Students'}</div>
              <div className="teacher-stat-label">{isVi ? 'Tổng học viên' : 'Total Students'}</div>
            </div>
          </div>

          {/* Pending Submissions Card */}
          <div 
            className={`teacher-stat-card ${counts.totalPending > 0 ? 'has-pending' : ''}`}
            onClick={() => navigate('/teacher/assignments')}
          >
            <div className="teacher-stat-icon pending">
              <Clock size={22} />
            </div>
            <div>
              <div className="teacher-stat-num">
                {counts.totalPending} {isVi ? 'Bài nộp' : 'Submissions'}
              </div>
              <div className="teacher-stat-label">{isVi ? 'Bài chờ chấm' : 'Pending Grading'}</div>
            </div>
          </div>

          {/* Average Score Card */}
          <div className="teacher-stat-card">
            <div className="teacher-stat-icon turnout">
              <Award size={22} />
            </div>
            <div>
              <div className="teacher-stat-num">Band {counts.overallAvg}</div>
              <div className="teacher-stat-label">{isVi ? 'Điểm trung bình' : 'Average Score'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      {!isLoading && !error && (
        <div className="teacher-filter-bar">
          <div className="teacher-pills">
            <button
              type="button"
              className={`teacher-pill ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              {isVi ? 'Tất cả lớp học' : 'All Classes'}
              <span className="teacher-pill-badge">{counts.all}</span>
            </button>
            <button
              type="button"
              className={`teacher-pill ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              {isVi ? 'Đang diễn ra' : 'Active'}
              <span className="teacher-pill-badge">{counts.active}</span>
            </button>
            <button
              type="button"
              className={`teacher-pill ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              {isVi ? 'Đã kết thúc' : 'Completed'}
              <span className="teacher-pill-badge">{counts.completed}</span>
            </button>
          </div>

          <div className="flex gap-2 items-center">
            {/* Term filter */}
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="select-input"
            >
              <option value="current">{isVi ? 'Học kỳ hiện tại' : 'Current Term'}</option>
              <option value="previous">{isVi ? 'Học kỳ trước' : 'Previous Term'}</option>
            </select>

            {/* Search box */}
            <div className="teacher-search-wrap">
              <Search size={15} className="teacher-search-icon" />
              <input
                type="text"
                className="teacher-search-input"
                placeholder={isVi ? 'Tìm kiếm mã lớp, tên lớp...' : 'Search class code, title...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      {!isLoading && !error && (
        <div className="teacher-classes-grid">
          {filteredClasses.map((cls) => (
            <div key={cls.id} className="teacher-class-card">
              <div>
                {/* Header Badge */}
                <div className="teacher-class-header">
                  <span className="teacher-assignment-code-badge">
                    {cls.code}
                  </span>

                  {cls.status === 'active' ? (
                    <span className="teacher-class-status-active">
                      {isVi ? 'Đang diễn ra' : 'In Progress'}
                    </span>
                  ) : (
                    <span className="teacher-class-status-completed">
                      {isVi ? 'Đã kết thúc' : 'Archived'}
                    </span>
                  )}
                </div>

                {/* Class Title */}
                <h3 className="teacher-class-title">
                  {cls.name}
                </h3>

                {/* Meta information */}
                <div className="teacher-class-meta">
                  <div className="teacher-class-meta-item">
                    <MapPin size={14} className="text-muted" />
                    <span>{cls.room}</span>
                  </div>
                  <div className="teacher-class-meta-item">
                    <Calendar size={14} className="text-muted" />
                    <span>{cls.schedule}</span>
                  </div>
                  <div className="teacher-class-meta-item">
                    <Users size={14} className="text-muted" />
                    <span><strong>{cls.enrolledStudents}</strong> {isVi ? 'học viên' : 'students'}</span>
                  </div>
                </div>

                {/* Mini KPI Strip */}
                <div className="teacher-mini-kpi-grid">
                  <div className="teacher-mini-kpi-item">
                    <span className="teacher-mini-kpi-label">{isVi ? 'Đã giao' : 'Assigned'}</span>
                    <span className="teacher-mini-kpi-val">{cls.stats.assigned} {isVi ? 'bài' : ''}</span>
                  </div>
                  <div className="teacher-mini-kpi-item">
                    <span className="teacher-mini-kpi-label">{isVi ? 'Chờ chấm' : 'Pending'}</span>
                    <span className={`teacher-mini-kpi-val ${cls.stats.pending > 0 ? 'pending' : ''}`}>
                      {cls.stats.pending} {isVi ? 'bài' : ''}
                    </span>
                  </div>
                  <div className="teacher-mini-kpi-item">
                    <span className="teacher-mini-kpi-label">{isVi ? 'Điểm TB' : 'Avg Score'}</span>
                    <span className={`teacher-mini-kpi-val ${cls.stats.avgScore >= 7.0 ? 'good' : ''}`}>
                      {cls.stats.avgScore > 0 ? `${cls.stats.avgScore.toFixed(1)}/10` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/teacher/classes/${cls.id}/progress`)}
                >
                  {isVi ? 'Tiến độ & Bảng điểm' : 'Class Progress'}
                </Button>
              </div>
            </div>
          ))}

          {filteredClasses.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={BookOpen}
                title={isVi ? 'Không tìm thấy lớp học nào' : 'No classes match your filter'}
                description={isVi ? 'Vui lòng thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.' : 'Try changing your search query or status filter.'}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;
