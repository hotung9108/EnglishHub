import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, BookOpen, Clock, Sparkles, Plus, 
  ArrowUpRight, CheckCircle2, TrendingUp, 
  FileText, PenTool, Mic, Headphones, Library,
  Calendar, Zap, ChevronRight, AlertCircle, Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import type { 
  TeacherSkill, 
  TeacherPendingSubmission, 
  TeacherClassSummary,
  TeacherSkillPerformance,
  TeacherUpcomingDeadline,
  TeacherActivityItem
} from '../types/teacher-dashboard.types';
import '../styles/teacher-dashboard.css';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { user } = useAuth();

  const teacherName = user?.name || (isVi ? 'Cô Trần Thị Mai Lan' : 'Ms. Trần Thị Mai Lan');

  // Filter for pending submissions queue
  const [selectedSkill, setSelectedSkill] = useState<string>('all');

  // Pending Submissions Mock Data
  const pendingSubmissions: TeacherPendingSubmission[] = useMemo(() => [
    {
      id: 'sub-01',
      assignmentId: '1',
      assignmentTitle: 'IELTS Writing Task 2: Artificial Intelligence & Workforce Evolution',
      studentId: 'std-01',
      studentName: 'Alice Johnson',
      studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      className: 'ENG-IELTS-6.5A',
      skill: 'writing',
      submittedAt: isVi ? '15 phút trước' : '15 mins ago',
      aiPreScore: 'Band 6.5',
      aiConfidence: 96,
      urgency: 'high'
    },
    {
      id: 'sub-02',
      assignmentId: '2',
      assignmentTitle: 'Speaking Part 2: Environmental Pollution in Urban Megacities',
      studentId: 'std-02',
      studentName: 'Trần Minh Quân',
      studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      className: 'ENG-IELTS-6.5A',
      skill: 'speaking',
      submittedAt: isVi ? '42 phút trước' : '42 mins ago',
      aiPreScore: 'Band 7.0',
      aiConfidence: 92,
      urgency: 'high'
    },
    {
      id: 'sub-03',
      assignmentId: '3',
      assignmentTitle: 'Academic Reading Passage 2: Deep Sea Microbial Life',
      studentId: 'std-03',
      studentName: 'Lê Hoàng Nam',
      studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      className: 'ENG-IELTS-6.5A',
      skill: 'reading',
      submittedAt: isVi ? '1 giờ trước' : '1 hour ago',
      aiPreScore: '34/40 (Band 7.5)',
      aiConfidence: 100,
      urgency: 'normal'
    },
    {
      id: 'sub-04',
      assignmentId: '4',
      assignmentTitle: 'IELTS Listening Practice Test: Library Induction Tour',
      studentId: 'std-04',
      studentName: 'Nguyễn Phương Thảo',
      studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      className: 'ENG-SPEAK-PRO',
      skill: 'listening',
      submittedAt: isVi ? '2 giờ trước' : '2 hours ago',
      aiPreScore: '36/40 (Band 8.0)',
      aiConfidence: 100,
      urgency: 'normal'
    },
    {
      id: 'sub-05',
      assignmentId: '1',
      assignmentTitle: 'IELTS Writing Task 2: Artificial Intelligence & Workforce Evolution',
      studentId: 'std-05',
      studentName: 'Phạm Đức Duy',
      studentAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      className: 'ENG-IELTS-6.5A',
      skill: 'writing',
      submittedAt: isVi ? '3 giờ trước' : '3 hours ago',
      aiPreScore: 'Band 6.0',
      aiConfidence: 94,
      urgency: 'medium'
    },
    {
      id: 'sub-06',
      assignmentId: '2',
      assignmentTitle: 'Speaking Part 2: Environmental Pollution in Urban Megacities',
      studentId: 'std-06',
      studentName: 'Đặng Mai Phương',
      studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      className: 'ENG-SPEAK-PRO',
      skill: 'speaking',
      submittedAt: isVi ? '5 giờ trước' : '5 hours ago',
      aiPreScore: 'Band 6.5',
      aiConfidence: 91,
      urgency: 'medium'
    }
  ], [isVi]);

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    if (selectedSkill === 'all') return pendingSubmissions;
    return pendingSubmissions.filter(item => item.skill === selectedSkill);
  }, [pendingSubmissions, selectedSkill]);

  // Skill counts for tabs
  const queueCounts = useMemo(() => {
    return {
      all: 18,
      writing: 5,
      speaking: 4,
      reading: 5,
      listening: 4
    };
  }, []);

  // Class Summaries
  const classesData: TeacherClassSummary[] = useMemo(() => [
    {
      id: '1',
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5 (Target Master)',
      enrolled: 24,
      pendingGrading: 6,
      avgScore: 7.2,
      nextSession: isVi ? 'T2 18:00 (Hôm nay)' : 'Mon 18:00 (Today)',
      schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
      progressPercent: 68
    },
    {
      id: '2',
      code: 'ENG-GRAM-ADV',
      name: 'Chuyên đề Ngữ pháp & Viết học thuật nâng cao',
      enrolled: 18,
      pendingGrading: 4,
      avgScore: 6.8,
      nextSession: isVi ? 'T3 19:30 (Ngày mai)' : 'Tue 19:30 (Tomorrow)',
      schedule: 'T3 - T5 - T7 (19:30 - 21:00)',
      progressPercent: 54
    },
    {
      id: '3',
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC 4 kỹ năng Mục tiêu 750+',
      enrolled: 26,
      pendingGrading: 5,
      avgScore: 7.5,
      nextSession: isVi ? 'T4 18:00' : 'Wed 18:00',
      schedule: 'T4 - T6 - CN (18:00 - 19:30)',
      progressPercent: 82
    },
    {
      id: '4',
      code: 'ENG-SPEAK-PRO',
      name: 'Luyện phát âm & Phản xạ giao tiếp Quốc tế',
      enrolled: 18,
      pendingGrading: 3,
      avgScore: 7.0,
      nextSession: isVi ? 'T5 19:30' : 'Thu 19:30',
      schedule: 'T3 - T5 (19:30 - 21:00)',
      progressPercent: 45
    }
  ], [isVi]);

  // 4-Skill Performance
  const skillPerformances: TeacherSkillPerformance[] = useMemo(() => [
    {
      skill: 'writing',
      skillName: 'Writing',
      avgScore: 6.8,
      benchmark: 7.0,
      submissionRate: 92,
      needsReviewCount: 5
    },
    {
      skill: 'speaking',
      skillName: 'Speaking',
      avgScore: 7.2,
      benchmark: 7.0,
      submissionRate: 88,
      needsReviewCount: 4
    },
    {
      skill: 'reading',
      skillName: 'Reading',
      avgScore: 7.5,
      benchmark: 7.5,
      submissionRate: 98,
      needsReviewCount: 5
    },
    {
      skill: 'listening',
      skillName: 'Listening',
      avgScore: 7.4,
      benchmark: 7.0,
      submissionRate: 96,
      needsReviewCount: 4
    }
  ], []);

  // Upcoming Deadlines
  const upcomingDeadlines: TeacherUpcomingDeadline[] = useMemo(() => [
    {
      id: 'd-1',
      title: 'Hạn nộp HW-01: IELTS Writing Task 2',
      type: 'assignment',
      className: 'ENG-IELTS-6.5A',
      date: '23:59 Hôm nay',
      timeRemaining: 'còn 4 giờ',
      status: 'urgent'
    },
    {
      id: 'd-2',
      title: 'Hạn trả điểm Speaking Part 2 đợt 1',
      type: 'grading_deadline',
      className: 'ENG-SPEAK-PRO',
      date: '17:00 Ngày mai',
      timeRemaining: 'còn 21 giờ',
      status: 'upcoming'
    },
    {
      id: 'd-3',
      title: 'Workshop: Kỹ thuật Paraphrase Task 1',
      type: 'workshop',
      className: 'ENG-GRAM-ADV',
      date: '19:30 Tối T5',
      timeRemaining: '3 ngày tới',
      status: 'upcoming'
    }
  ], []);

  // Activity Feed
  const recentActivities: TeacherActivityItem[] = useMemo(() => [
    {
      id: 'act-1',
      type: 'submission',
      title: 'Alice Johnson đã nộp bài Writing Task 2',
      desc: 'Bài viết đạt độ dài 285 từ, đã chuyển sang AI Engine sơ chấm.',
      timestamp: isVi ? '15 phút trước' : '15m ago',
      className: 'ENG-IELTS-6.5A'
    },
    {
      id: 'act-2',
      type: 'ai_graded',
      title: 'AI Grading hoàn tất chấm 18 bài Listening Passage 3',
      desc: 'Điểm trung bình đạt 34.5/40 (Band 7.5). Đã sẵn sàng trả kết quả.',
      timestamp: isVi ? '35 phút trước' : '35m ago',
      className: 'ENG-TOEIC-750'
    },
    {
      id: 'act-3',
      type: 'feedback_viewed',
      title: 'Trần Minh Quân đã đọc feedback bài Speaking Part 2',
      desc: 'Học viên đã hoàn thành nghe lại bản ghi âm sửa lỗi phát âm.',
      timestamp: isVi ? '1 giờ trước' : '1h ago',
      className: 'ENG-IELTS-6.5A'
    },
    {
      id: 'act-4',
      type: 'system',
      title: 'Đã hoàn tất duyệt 15 bài thi thử tháng 3',
      desc: 'Điểm số đã được đồng bộ vào học bạ số của lớp.',
      timestamp: isVi ? '3 giờ trước' : '3h ago',
      className: 'ENG-GRAM-ADV'
    }
  ], [isVi]);

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
            <span>{isVi ? 'Học kỳ 1 - 2026 • Giảng viên Ưu tú' : 'Semester 1 - 2026 • Master Instructor'}</span>
          </div>
          <h1 className="teacher-dash-greeting">
            {isVi ? `Chào mừng trở lại, ${teacherName}! 👋` : `Welcome back, ${teacherName}! 👋`}
          </h1>
          <p className="teacher-dash-subgreeting">
            {isVi 
              ? 'Hôm nay bạn có 4 lớp học đang hoạt động và 18 bài tập nộp cần chấm duyệt. Hệ thống AI đã hoàn tất sơ chấm 100% bài viết & nói.' 
              : 'You have 4 active classes and 18 student submissions pending grading. AI grading engine has pre-evaluated 100% of tasks.'}
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

      {/* 2. Key Metrics Strip (KPIs) */}
      <section className="teacher-dash-kpi-grid">
        {/* KPI 1: Active Classes */}
        <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/classes')}>
          <div className="teacher-dash-kpi-header">
            <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <BookOpen size={22} />
            </div>
            <span className="teacher-dash-kpi-trend positive">
              <TrendingUp size={12} /> 100% On-track
            </span>
          </div>
          <div className="teacher-dash-kpi-body">
            <div className="teacher-dash-kpi-value">4</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Lớp đang giảng dạy' : 'Active Classes'}</div>
            <div className="teacher-dash-kpi-subtext">{isVi ? '3 lớp IELTS & 1 chuyên đề' : '3 IELTS & 1 Specialized'}</div>
          </div>
        </div>

        {/* KPI 2: Total Students */}
        <div className="teacher-dash-kpi-card">
          <div className="teacher-dash-kpi-header">
            <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
              <Users size={22} />
            </div>
            <span className="teacher-dash-kpi-trend neutral">
              <Users size={12} /> 100% {isVi ? 'Chuyên cần' : 'Attendance'}
            </span>
          </div>
          <div className="teacher-dash-kpi-body">
            <div className="teacher-dash-kpi-value">86</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Tổng số học viên' : 'Enrolled Students'}</div>
            <div className="teacher-dash-kpi-subtext">{isVi ? 'Trung bình 21.5 học viên/lớp' : 'Avg 21.5 students/class'}</div>
          </div>
        </div>

        {/* KPI 3: Pending Grading Queue */}
        <div className="teacher-dash-kpi-card" onClick={() => navigate('/teacher/assignments')}>
          <div className="teacher-dash-kpi-header">
            <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
              <Clock size={22} />
            </div>
            <span className="teacher-dash-kpi-trend urgent">
              <AlertCircle size={12} /> {isVi ? 'Cần chấm ngay' : 'Action needed'}
            </span>
          </div>
          <div className="teacher-dash-kpi-body">
            <div className="teacher-dash-kpi-value">18</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Bài nộp chờ chấm' : 'Pending Submissions'}</div>
            <div className="teacher-dash-kpi-subtext">{isVi ? 'AI đã sơ chấm 18/18 bài' : 'AI pre-graded 18/18'}</div>
          </div>
        </div>

        {/* KPI 4: Average Score */}
        <div className="teacher-dash-kpi-card">
          <div className="teacher-dash-kpi-header">
            <div className="teacher-dash-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Award size={22} />
            </div>
            <span className="teacher-dash-kpi-trend positive">
              <ArrowUpRight size={12} /> +0.3 Band
            </span>
          </div>
          <div className="teacher-dash-kpi-body">
            <div className="teacher-dash-kpi-value">Band 7.1</div>
            <div className="teacher-dash-kpi-label">{isVi ? 'Điểm trung bình các lớp' : 'Overall Band Avg'}</div>
            <div className="teacher-dash-kpi-subtext">{isVi ? 'Mục tiêu khóa: Band 7.0' : 'Target Goal: Band 7.0'}</div>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Columns */}
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
                <span className="teacher-dash-section-badge urgent">
                  18 {isVi ? 'bài' : 'items'}
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
              {filteredQueue.map(item => (
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
                          {isVi ? `AI sơ bộ: ${item.aiPreScore}` : `AI Pre-score: ${item.aiPreScore}`}
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
                onClick={() => navigate('/progress')}
              >
                <span>{isVi ? 'Chi tiết tiến độ' : 'Detailed progress'}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="teacher-dash-skill-matrix">
              {skillPerformances.map(item => (
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
                      {item.avgScore}
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
                <span className="teacher-dash-section-badge">4 {isVi ? 'lớp' : 'classes'}</span>
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
              {classesData.map(cls => (
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
              {upcomingDeadlines.map(item => (
                <div key={item.id} className="teacher-dash-deadline-item">
                  <div 
                    className="teacher-dash-deadline-icon"
                    style={{ 
                      backgroundColor: item.status === 'urgent' ? '#fef2f2' : '#eff6ff',
                      color: item.status === 'urgent' ? '#dc2626' : '#2563eb'
                    }}
                  >
                    {item.type === 'assignment' && <FileText size={16} />}
                    {item.type === 'grading_deadline' && <Clock size={16} />}
                    {item.type === 'workshop' && <Sparkles size={16} />}
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
              {recentActivities.map(act => (
                <div key={act.id} className="teacher-dash-activity-item">
                  <div 
                    className="teacher-dash-activity-dot"
                    style={{ 
                      backgroundColor: 
                        act.type === 'submission' ? '#2563eb' :
                        act.type === 'ai_graded' ? '#7e22ce' :
                        act.type === 'feedback_viewed' ? '#16a34a' : '#64748b'
                    }}
                  />
                  <div className="teacher-dash-activity-content">
                    <div className="teacher-dash-activity-title">{act.title}</div>
                    <div className="teacher-dash-activity-desc">{act.desc}</div>
                    <div className="teacher-dash-activity-time">{act.timestamp} • {act.className}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
