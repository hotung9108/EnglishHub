import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  BookOpen, Users, Clock, Award, Search, Plus, 
  Calendar, MapPin, 
  TrendingUp, FileText, User
} from 'lucide-react';

interface TeacherClassItem {
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

  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('current');

  const classes: TeacherClassItem[] = useMemo(() => [
    {
      id: '1',
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5 (Target Master)',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Online Room #04 (Zoom HD)',
      schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
      status: 'active',
      enrolledStudents: 24,
      stats: {
        assigned: 15,
        pending: 2,
        avgScore: 7.2
      }
    },
    {
      id: '2',
      code: 'ENG-GRAM-ADV',
      name: 'Chuyên đề Ngữ pháp & Viết học thuật nâng cao',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Phòng 202 - Tòa A2',
      schedule: 'T3 - T5 - T7 (19:30 - 21:00)',
      status: 'active',
      enrolledStudents: 18,
      stats: {
        assigned: 8,
        pending: 0,
        avgScore: 8.0
      }
    },
    {
      id: '3',
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc Mục tiêu 750+',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Online Room #02 (Teams)',
      schedule: 'T7 - CN (09:00 - 11:30)',
      status: 'active',
      enrolledStudents: 22,
      stats: {
        assigned: 12,
        pending: 5,
        avgScore: 7.8
      }
    },
    {
      id: '4',
      code: 'ENG-IELTS-5.0',
      name: 'IELTS Pre-Intermediate Khóa 12',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Phòng 101 - Tòa B1',
      schedule: 'Đã hoàn thành 30/30 buổi',
      status: 'completed',
      enrolledStudents: 20,
      stats: {
        assigned: 20,
        pending: 0,
        avgScore: 7.5
      }
    }
  ], []);

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      if (filter !== 'all' && cls.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return cls.name.toLowerCase().includes(q) || cls.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [classes, filter, searchQuery]);

  const counts = useMemo(() => {
    const active = classes.filter(c => c.status === 'active').length;
    const completed = classes.filter(c => c.status === 'completed').length;
    const totalStudents = classes.reduce((sum, c) => sum + c.enrolledStudents, 0);
    const totalPending = classes.reduce((sum, c) => sum + c.stats.pending, 0);
    return {
      all: classes.length,
      active,
      completed,
      totalStudents,
      totalPending
    };
  }, [classes]);

  return (
    <div className="teacher-container">
      {/* Header */}
      <div className="teacher-header">
        <div>
          <h1 className="teacher-title">
            <BookOpen size={28} color="var(--primary)" />
            {isVi ? 'Quản Lý Lớp Học & Giảng Dạy' : 'Teaching & Class Management'}
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 700, 
              padding: '3px 10px', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: 'var(--primary-fixed)', 
              color: 'var(--primary)',
              marginLeft: '8px'
            }}>
              {counts.all} {isVi ? 'lớp học' : 'classes'}
            </span>
          </h1>
          <p className="teacher-subtitle">
            {isVi
              ? 'Theo dõi tiến độ học viên, kiểm tra bài nộp cần chấm điểm và cập nhật lộ trình khóa học.'
              : 'Monitor student learning curves, grade pending submissions, and manage course schedules.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/teacher/assignments/create')}
          >
            <Plus size={16} />
            <span>{isVi ? 'Giao bài tập mới' : 'Create Assignment'}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="teacher-stats-grid">
        {/* Active Classes Card */}
        <div 
          className={`teacher-stat-card ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
        >
          <div className="teacher-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <div className="teacher-stat-num">{counts.active} {isVi ? 'Lớp' : 'Classes'}</div>
            <div className="teacher-stat-label">{isVi ? 'Đang trong thời gian giảng dạy' : 'Active Enrolled Classes'}</div>
          </div>
        </div>

        {/* Total Students Card */}
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Users size={22} />
          </div>
          <div>
            <div className="teacher-stat-num">{counts.totalStudents} {isVi ? 'Học viên' : 'Students'}</div>
            <div className="teacher-stat-label">{isVi ? 'Tổng số học viên các lớp' : 'Total Enrolled Students'}</div>
          </div>
        </div>

        {/* Pending Submissions Card */}
        <div 
          className="teacher-stat-card"
          onClick={() => navigate('/teacher/assignments')}
        >
          <div className="teacher-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="teacher-stat-num" style={{ color: counts.totalPending > 0 ? '#d97706' : 'inherit' }}>
              {counts.totalPending} {isVi ? 'Bài nộp' : 'Submissions'}
            </div>
            <div className="teacher-stat-label">{isVi ? 'Cần giáo viên chấm điểm ngay' : 'Pending Grading'}</div>
          </div>
        </div>

        {/* Average Score Card */}
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
            <Award size={22} />
          </div>
          <div>
            <div className="teacher-stat-num">Band 7.6</div>
            <div className="teacher-stat-label">{isVi ? 'Điểm trung bình toàn khóa' : 'Overall Cohort GPA'}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Term filter */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--outline-variant)',
              backgroundColor: 'var(--surface)',
              color: 'var(--on-surface)',
              outline: 'none'
            }}
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

      {/* Classes Grid */}
      <div className="teacher-classes-grid">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="teacher-class-card">
            <div>
              {/* Header Badge */}
              <div className="teacher-class-header">
                <span style={{ 
                  backgroundColor: '#0f172a', 
                  color: '#ffffff', 
                  fontWeight: 700, 
                  fontSize: '11.5px', 
                  padding: '4px 10px', 
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}>
                  {cls.code}
                </span>

                {cls.status === 'active' ? (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    backgroundColor: '#ecfdf5', 
                    color: '#059669', 
                    padding: '3px 10px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 700,
                    border: '1px solid #a7f3d0'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
                    {isVi ? 'Đang diễn ra' : 'In Progress'}
                  </span>
                ) : (
                  <span style={{ 
                    backgroundColor: 'var(--surface-container-high)', 
                    color: 'var(--on-surface-variant)', 
                    padding: '3px 10px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600 
                  }}>
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
                  <User size={14} color="var(--primary)" />
                  <span>{cls.teacher}</span>
                </div>
                <div className="teacher-class-meta-item">
                  <MapPin size={14} color="var(--on-surface-variant)" />
                  <span>{cls.room}</span>
                </div>
                <div className="teacher-class-meta-item">
                  <Calendar size={14} color="var(--on-surface-variant)" />
                  <span>{cls.schedule}</span>
                </div>
                <div className="teacher-class-meta-item">
                  <Users size={14} color="var(--on-surface-variant)" />
                  <span><strong>{cls.enrolledStudents}</strong> {isVi ? 'học viên đang tham gia' : 'students enrolled'}</span>
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
                  <span className="teacher-mini-kpi-val" style={{ color: cls.stats.pending > 0 ? '#dc2626' : 'inherit' }}>
                    {cls.stats.pending} {isVi ? 'bài' : ''}
                  </span>
                </div>
                <div className="teacher-mini-kpi-item">
                  <span className="teacher-mini-kpi-label">{isVi ? 'Điểm TB' : 'Avg Score'}</span>
                  <span className="teacher-mini-kpi-val" style={{ color: cls.stats.avgScore >= 7.0 ? '#16a34a' : 'inherit' }}>
                    {cls.stats.avgScore.toFixed(1)}/10
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ flex: 1, padding: '10px 14px' }}
                onClick={() => navigate(`/teacher/classes/${cls.code}/progress`)}
              >
                <TrendingUp size={15} />
                <span>{isVi ? 'Tiến độ & Bảng điểm' : 'Class Progress'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary bg-white btn-sm"
                style={{ padding: '10px 14px' }}
                onClick={() => navigate(`/teacher/assignments`)}
                title={isVi ? 'Quản lý bài tập' : 'Manage Assignments'}
              >
                <FileText size={15} />
              </button>
            </div>
          </div>
        ))}

        {filteredClasses.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
            <BookOpen size={36} color="var(--on-surface-variant)" style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              {isVi ? 'Không tìm thấy lớp học nào' : 'No classes match your filter'}
            </h4>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              {isVi ? 'Vui lòng thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác.' : 'Try changing your search query or status filter.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClasses;
