import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, TrendingUp, Search, 
  Headphones, BookOpen, Mic, PenTool, 
  CheckCircle2, AlertCircle, Users, Calendar, 
  MapPin, Plus, Download, Sparkles, X, 
  ArrowUpRight, Clock, Award, FileText, Send, Eye
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { 
  ClassDetailItem, 
  StudentGradeRow, 
  ClassAssignmentItem, 
  SkillAnalyticsItem, 
  SyllabusLessonItem 
} from '../types/teacher-class.types';
import '../styles/teacher-class-details.css';

export const TeacherClassProgress: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  // Available classes map for switcher
  const availableClasses: Record<string, ClassDetailItem> = useMemo(() => ({
    'ENG-IELTS-6.5A': {
      id: '1',
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5 (Target Master)',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Online Room #04 (Zoom HD)',
      schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
      status: 'active',
      targetBand: 'Band 6.5 - 7.5',
      currentLesson: 14,
      totalLessons: 24,
      enrolledStudents: 24,
      stats: {
        completionRate: 88.3,
        onTimeRate: 91.5,
        avgScore: 7.1,
        targetAttainment: 87.5,
        assignedCount: 15,
        pendingGrading: 6
      }
    },
    'ENG-GRAM-ADV': {
      id: '2',
      code: 'ENG-GRAM-ADV',
      name: 'Chuyên đề Ngữ pháp & Viết học thuật nâng cao',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Phòng 202 - Tòa A2',
      schedule: 'T3 - T5 - T7 (19:30 - 21:00)',
      status: 'active',
      targetBand: 'C1 Academic',
      currentLesson: 10,
      totalLessons: 20,
      enrolledStudents: 18,
      stats: {
        completionRate: 82.5,
        onTimeRate: 88.0,
        avgScore: 6.8,
        targetAttainment: 83.3,
        assignedCount: 12,
        pendingGrading: 4
      }
    },
    'ENG-TOEIC-750': {
      id: '3',
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC 4 kỹ năng Mục tiêu 750+',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Online Room #02',
      schedule: 'T4 - T6 - CN (18:00 - 19:30)',
      status: 'active',
      targetBand: 'TOEIC 750+',
      currentLesson: 18,
      totalLessons: 24,
      enrolledStudents: 26,
      stats: {
        completionRate: 94.0,
        onTimeRate: 95.2,
        avgScore: 7.5,
        targetAttainment: 92.3,
        assignedCount: 16,
        pendingGrading: 5
      }
    },
    'ENG-SPEAK-PRO': {
      id: '4',
      code: 'ENG-SPEAK-PRO',
      name: 'Luyện phát âm & Phản xạ giao tiếp Quốc tế',
      teacher: 'Cô Trần Thị Mai Lan',
      room: 'Phòng 301 - Tòa B1',
      schedule: 'T3 - T5 (19:30 - 21:00)',
      status: 'active',
      targetBand: 'IELTS 7.0+',
      currentLesson: 8,
      totalLessons: 16,
      enrolledStudents: 18,
      stats: {
        completionRate: 85.0,
        onTimeRate: 89.0,
        avgScore: 7.0,
        targetAttainment: 85.0,
        assignedCount: 10,
        pendingGrading: 3
      }
    }
  }), []);

  // Normalize current class from ID or code parameter
  const currentClassCode = useMemo(() => {
    if (!id) return 'ENG-IELTS-6.5A';
    if (availableClasses[id]) return id;
    if (id === '1') return 'ENG-IELTS-6.5A';
    if (id === '2') return 'ENG-GRAM-ADV';
    if (id === '3') return 'ENG-TOEIC-750';
    if (id === '4') return 'ENG-SPEAK-PRO';
    return 'ENG-IELTS-6.5A';
  }, [id, availableClasses]);

  const currentClass = availableClasses[currentClassCode] || availableClasses['ENG-IELTS-6.5A'];

  // State
  const [activeTab, setActiveTab] = useState<'roster' | 'assignments' | 'analytics' | 'syllabus'>('roster');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'exceed' | 'ontime' | 'support'>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentGradeRow | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mock Students Roster Data (24 students)
  const studentsList: StudentGradeRow[] = useMemo(() => [
    {
      id: 'std-01',
      code: 'HV-2024-0891',
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      email: 'alice.johnson@example.com',
      attendance: 100,
      assignmentsCompleted: 10,
      totalAssignments: 10,
      scores: { writing: 8.0, speaking: 8.5, reading: 8.5, listening: 8.0, overall: 8.2 },
      status: 'exceed',
      statusLabel: isVi ? 'Vượt trội' : 'Exceeding',
      lastActive: isVi ? '15 phút trước' : '15m ago',
      recentFeedback: 'Vốn từ vựng C1/C2 xuất sắc, triển khai ý tưởng Task 2 chặt chẽ và mạch lạc.'
    },
    {
      id: 'std-02',
      code: 'HV-2024-0712',
      name: 'David Phạm',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      email: 'david.pham@example.com',
      attendance: 95,
      assignmentsCompleted: 9,
      totalAssignments: 10,
      scores: { writing: 6.5, speaking: 7.0, reading: 7.0, listening: 6.5, overall: 6.7 },
      status: 'ontime',
      statusLabel: isVi ? 'Đạt chuẩn' : 'On-track',
      lastActive: isVi ? '2 giờ trước' : '2h ago',
      recentFeedback: 'Phát âm tự nhiên, cần cải thiện sự liên kết đoạn trong bài viết Writing Task 1.'
    },
    {
      id: 'std-03',
      code: 'HV-2024-0419',
      name: 'Trần Hoàng Long',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
      email: 'hoanglong.tran@example.com',
      attendance: 75,
      assignmentsCompleted: 6,
      totalAssignments: 10,
      scores: { writing: 5.0, speaking: 5.5, reading: 5.5, listening: 5.0, overall: 5.3 },
      status: 'support',
      statusLabel: isVi ? 'Cần hỗ trợ' : 'Needs Support',
      lastActive: isVi ? '1 ngày trước' : '1d ago',
      recentFeedback: 'Bỏ sót 4 bài tập tuần trước. Cần phụ đạo thêm cấu trúc câu phức và ngữ pháp cơ bản.'
    },
    {
      id: 'std-04',
      code: 'HV-2024-0552',
      name: 'Nguyễn Phương Thảo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      email: 'phuongthao.ng@example.com',
      attendance: 98,
      assignmentsCompleted: 10,
      totalAssignments: 10,
      scores: { writing: 7.5, speaking: 7.5, reading: 8.0, listening: 8.5, overall: 7.9 },
      status: 'exceed',
      statusLabel: isVi ? 'Vượt trội' : 'Exceeding',
      lastActive: isVi ? '30 phút trước' : '30m ago',
      recentFeedback: 'Khả năng bắt từ khóa (Keywords) trong Listening cực kỳ nhạy bén.'
    },
    {
      id: 'std-05',
      code: 'HV-2024-0628',
      name: 'Phạm Đức Duy',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
      email: 'ducduy.pham@example.com',
      attendance: 90,
      assignmentsCompleted: 9,
      totalAssignments: 10,
      scores: { writing: 6.5, speaking: 6.5, reading: 7.5, listening: 7.0, overall: 6.9 },
      status: 'ontime',
      statusLabel: isVi ? 'Đạt chuẩn' : 'On-track',
      lastActive: isVi ? '4 giờ trước' : '4h ago',
      recentFeedback: 'Tiến bộ rõ rệt trong kỹ năng Skimming & Scanning bài đọc Passage 2.'
    },
    {
      id: 'std-06',
      code: 'HV-2024-0331',
      name: 'Đặng Mai Phương',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
      email: 'maiphuong.dang@example.com',
      attendance: 96,
      assignmentsCompleted: 10,
      totalAssignments: 10,
      scores: { writing: 7.0, speaking: 7.5, reading: 7.5, listening: 7.5, overall: 7.4 },
      status: 'ontime',
      statusLabel: isVi ? 'Đạt chuẩn' : 'On-track',
      lastActive: isVi ? '1 giờ trước' : '1h ago',
      recentFeedback: 'Ngữ điệu tự nhiên, phản xạ nói Part 3 lưu loát với lập luận phong phú.'
    },
    {
      id: 'std-07',
      code: 'HV-2024-0210',
      name: 'Vũ Thị Hương',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      email: 'huong.vu@example.com',
      attendance: 80,
      assignmentsCompleted: 7,
      totalAssignments: 10,
      scores: { writing: 5.5, speaking: 5.5, reading: 6.0, listening: 5.5, overall: 5.6 },
      status: 'support',
      statusLabel: isVi ? 'Cần hỗ trợ' : 'Needs Support',
      lastActive: isVi ? '2 ngày trước' : '2d ago',
      recentFeedback: 'Gặp khó khăn với bài tập nghe Section 3 nhiều người nói. Cần rèn luyện thêm chính tả.'
    },
    {
      id: 'std-08',
      code: 'HV-2024-0985',
      name: 'Lê Hoàng Nam',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
      email: 'hoangnam.le@example.com',
      attendance: 100,
      assignmentsCompleted: 10,
      totalAssignments: 10,
      scores: { writing: 8.0, speaking: 8.0, reading: 8.5, listening: 8.0, overall: 8.1 },
      status: 'exceed',
      statusLabel: isVi ? 'Vượt trội' : 'Exceeding',
      lastActive: isVi ? '10 phút trước' : '10m ago',
      recentFeedback: 'Bài làm luôn nộp sớm và đạt chuẩn điểm cao, là hạt nhân tích cực trong lớp.'
    }
  ], [isVi]);

  // Filtered Students List
  const filteredStudents = useMemo(() => {
    return studentsList.filter(std => {
      const matchSearch = 
        std.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        std.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || std.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [studentsList, searchQuery, statusFilter]);

  // Class Assignments Data
  const classAssignments: ClassAssignmentItem[] = useMemo(() => [
    {
      id: '1',
      code: 'HW-01',
      title: 'IELTS Writing Task 2: Artificial Intelligence & Workforce Evolution',
      skill: 'writing',
      dueDate: '2026-03-22 23:59',
      daysLeft: 2,
      submittedCount: 22,
      totalStudents: 24,
      pendingGrading: 2,
      avgScore: 7.2,
      status: 'open'
    },
    {
      id: '2',
      code: 'HW-02',
      title: 'Speaking Part 2: Environmental Pollution in Urban Megacities',
      skill: 'speaking',
      dueDate: '2026-03-20 23:59',
      daysLeft: 0,
      submittedCount: 24,
      totalStudents: 24,
      pendingGrading: 0,
      avgScore: 7.4,
      status: 'closed'
    },
    {
      id: '3',
      code: 'HW-03',
      title: 'Reading Test: Deep Sea Microbial Life & Biosphere (Passage 2)',
      skill: 'reading',
      dueDate: '2026-03-18 23:59',
      daysLeft: 0,
      submittedCount: 24,
      totalStudents: 24,
      pendingGrading: 0,
      avgScore: 7.8,
      status: 'closed'
    },
    {
      id: '4',
      code: 'HW-04',
      title: 'Listening Practice: University Library Induction & Campus Facilities',
      skill: 'listening',
      dueDate: '2026-03-15 23:59',
      daysLeft: 0,
      submittedCount: 23,
      totalStudents: 24,
      pendingGrading: 0,
      avgScore: 7.5,
      status: 'closed'
    },
    {
      id: '5',
      code: 'HW-05',
      title: 'Writing Task 1: Academic Line Graph on Global Energy Transition',
      skill: 'writing',
      dueDate: '2026-03-28 23:59',
      daysLeft: 8,
      submittedCount: 4,
      totalStudents: 24,
      pendingGrading: 4,
      avgScore: 0,
      status: 'upcoming'
    }
  ], []);

  // 4-Skill Analytics Data
  const skillAnalytics: SkillAnalyticsItem[] = useMemo(() => [
    {
      skill: 'writing',
      name: 'Writing',
      avgScore: 6.8,
      targetScore: 7.0,
      completionRate: 92,
      strengths: ['Bố cục 4 đoạn chuẩn mực', 'Dẫn chứng thực tế phong phú', 'Khả năng paraphrase mở bài'],
      weaknesses: ['Lỗi chia thì ở các mệnh đề quan hệ', 'Thiếu Collocations học thuật C1', 'Quá thời gian Task 2'],
      aiRecommendation: 'Cần tăng cường bài tập luyện collocation chủ đề Công nghệ & Môi trường, đồng thời bấm giờ 40 phút cho mỗi bài Task 2.'
    },
    {
      skill: 'speaking',
      name: 'Speaking',
      avgScore: 7.2,
      targetScore: 7.0,
      completionRate: 88,
      strengths: ['Phản xạ nhanh Part 1', 'Ngữ điệu tự nhiên', 'Biết cách tự sửa lỗi khi nói'],
      weaknesses: ['Ngắt quãng ở Part 2 khi thiếu ý', 'Lỗi âm cuối /s/, /t/, /d/', 'Lặp từ vựng trong Part 3'],
      aiRecommendation: 'Tập trung luyện kỹ thuật mở rộng ý bằng phương pháp P.E.E.L (Point - Explain - Example - Link) cho Part 3.'
    },
    {
      skill: 'reading',
      name: 'Reading',
      avgScore: 7.5,
      targetScore: 7.0,
      completionRate: 98,
      strengths: ['Kỹ năng Skimming cực tốt', 'Làm chính xác dạng Gap Fill', 'Tốc độ đọc trung bình 220 wpm'],
      weaknesses: ['Dễ nhầm lẫn dạng True/False/Not Given', 'Mất nhiều thời gian ở Matching Headings'],
      aiRecommendation: 'Củng cố chiến lược phân biệt rõ giữa "False" (trái ngược thông tin) và "Not Given" (thông tin không đề cập).'
    },
    {
      skill: 'listening',
      name: 'Listening',
      avgScore: 7.4,
      targetScore: 7.0,
      completionRate: 96,
      strengths: ['Nghe số điện thoại, tên riêng chính xác', 'Bắt từ khóa Section 1, 2 nhạy bén'],
      weaknesses: ['Bị đánh lừa bởi từ bẫy (Distractors)', 'Dạng trắc nghiệm Section 3 dài'],
      aiRecommendation: 'Rèn luyện thói quen đọc trước đáp án và gạch chân từ khóa then chốt trước khi đoạn băng phát 30 giây.'
    }
  ], []);

  // Syllabus Lessons
  const syllabusLessons: SyllabusLessonItem[] = useMemo(() => [
    {
      session: 1,
      title: 'Tổng quan format IELTS Academic & Đánh giá năng lực đầu khóa',
      date: '2026-02-02',
      focusSkill: 'mock_test',
      status: 'completed',
      materialsCount: 4,
      homeworkAttached: 'Diagnostic Mini-Test'
    },
    {
      session: 13,
      title: 'Speaking Part 2: Chiến lược ghi chú Cue Card trong 1 phút',
      date: '2026-03-18',
      focusSkill: 'speaking',
      status: 'completed',
      materialsCount: 3,
      homeworkAttached: 'HW-02 Speaking Part 2'
    },
    {
      session: 14,
      title: 'Writing Task 2: Cấu trúc bài luận Problem - Solution & Discussion',
      date: '2026-03-20',
      focusSkill: 'writing',
      status: 'current',
      materialsCount: 5,
      homeworkAttached: 'HW-01 Writing Task 2'
    },
    {
      session: 15,
      title: 'Reading Passage 3: Kỹ thuật xử lý dạng bài Multiple Choice phức tạp',
      date: '2026-03-23',
      focusSkill: 'reading',
      status: 'upcoming',
      materialsCount: 4,
      homeworkAttached: 'HW-06 Reading Test'
    },
    {
      session: 16,
      title: 'Listening Section 4: Chiến thuật nghe bài giảng học thuật (Academic Lectures)',
      date: '2026-03-25',
      focusSkill: 'listening',
      status: 'upcoming',
      materialsCount: 3
    }
  ], []);

  // Helper score color
  const getScoreClass = (score: number) => {
    if (score >= 7.5) return 'high';
    if (score >= 6.5) return 'medium';
    return 'low';
  };

  const handleClassChange = (newCode: string) => {
    navigate(`/teacher/classes/${newCode}/progress`);
  };

  return (
    <div className="tcd-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
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
        <span className="tcd-breadcrumb-active">{currentClass.code}</span>
        <ChevronRight size={14} />
        <span className="tcd-breadcrumb-active">
          {isVi ? 'Chi tiết & Bảng điểm' : 'Details & Gradebook'}
        </span>
      </nav>

      {/* 2. Hero Header Card */}
      <section className="tcd-hero-card">
        <div className="tcd-hero-top">
          <div className="tcd-hero-main-info">
            <div className="tcd-badge-group">
              <span className="tcd-class-code-badge">{currentClass.code}</span>
              <span className="tcd-target-band-badge">
                <Award size={13} />
                <span>{currentClass.targetBand}</span>
              </span>
              <span className="tcd-status-badge-active">
                <CheckCircle2 size={13} />
                <span>{isVi ? 'Đang hoạt động' : 'Active Class'}</span>
              </span>
            </div>

            <h1 className="tcd-class-title">{currentClass.name}</h1>

            <div className="tcd-meta-row">
              <span className="tcd-meta-item">
                <Users size={14} />
                <span><strong>{currentClass.enrolledStudents}</strong> {isVi ? 'học viên' : 'students'}</span>
              </span>
              <span className="tcd-meta-item">
                <Calendar size={14} />
                <span>{currentClass.schedule}</span>
              </span>
              <span className="tcd-meta-item">
                <MapPin size={14} />
                <span>{currentClass.room}</span>
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="tcd-hero-actions">
            {/* Quick Class Switcher */}
            <select
              className="tcd-class-select"
              value={currentClassCode}
              onChange={(e) => handleClassChange(e.target.value)}
              title={isVi ? 'Đổi lớp nhanh' : 'Switch Class'}
            >
              {Object.values(availableClasses).map((c) => (
                <option key={c.code} value={c.code}>
                  [{c.code}] {c.name.slice(0, 32)}...
                </option>
              ))}
            </select>

            <button 
              className="tcd-btn-secondary"
              onClick={() => showToast(isVi ? 'Đang xuất bảng điểm Excel của lớp...' : 'Exporting Excel gradebook...')}
            >
              <Download size={14} />
              <span>{isVi ? 'Xuất Excel' : 'Export'}</span>
            </button>

            <button 
              className="tcd-btn-primary"
              onClick={() => navigate(`/teacher/assignments/create?class=${currentClass.code}`)}
            >
              <Plus size={15} />
              <span>{isVi ? 'Giao bài cho lớp' : 'Assign Homework'}</span>
            </button>
          </div>
        </div>

        {/* Syllabus Progress Bar */}
        <div className="tcd-lesson-progress-wrap">
          <div className="tcd-lesson-progress-meta">
            <span>
              {isVi ? 'Tiến độ lộ trình học phần:' : 'Syllabus Progress:'} Buổi {currentClass.currentLesson} / {currentClass.totalLessons}
            </span>
            <span>
              {Math.round((currentClass.currentLesson / currentClass.totalLessons) * 100)}% {isVi ? 'hoàn thành' : 'completed'}
            </span>
          </div>
          <div className="tcd-lesson-track">
            <div 
              className="tcd-lesson-bar" 
              style={{ width: `${(currentClass.currentLesson / currentClass.totalLessons) * 100}%` }}
            />
          </div>
        </div>
      </section>

      {/* 3. 4 KPI Metrics */}
      <section className="tcd-kpi-grid">
        {/* KPI 1 */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <div className="tcd-kpi-icon blue">
              <TrendingUp size={20} />
            </div>
            <span className="tcd-kpi-chip info">
              {currentClass.stats.completionRate}%
            </span>
          </div>
          <div>
            <div className="tcd-kpi-value">{currentClass.stats.completionRate}%</div>
            <div className="tcd-kpi-label">{isVi ? 'Tỷ lệ hoàn thành bài tập' : 'Assignment Completion'}</div>
          </div>
          <div className="tcd-mini-progress">
            <div 
              className="tcd-mini-progress-fill" 
              style={{ width: `${currentClass.stats.completionRate}%`, backgroundColor: '#2563eb' }}
            />
          </div>
          <div className="tcd-kpi-foot-text">
            <span>212 / 240 {isVi ? 'bài đã nộp' : 'submitted'}</span>
            <span style={{ color: '#2563eb', fontWeight: 600 }}>28 {isVi ? 'bài tồn' : 'pending'}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <div className="tcd-kpi-icon green">
              <CheckCircle2 size={20} />
            </div>
            <span className="tcd-kpi-chip success">
              +2.3% {isVi ? 'tuần này' : 'this week'}
            </span>
          </div>
          <div>
            <div className="tcd-kpi-value">{currentClass.stats.onTimeRate}%</div>
            <div className="tcd-kpi-label">{isVi ? 'Tỷ lệ nộp bài đúng hạn' : 'On-time Submission Rate'}</div>
          </div>
          <div className="tcd-mini-progress">
            <div 
              className="tcd-mini-progress-fill" 
              style={{ width: `${currentClass.stats.onTimeRate}%`, backgroundColor: '#16a34a' }}
            />
          </div>
          <div className="tcd-kpi-foot-text">
            <span>194 {isVi ? 'đúng hạn' : 'on-time'}</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{isVi ? 'Xuất sắc' : 'Excellent'}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <div className="tcd-kpi-icon purple">
              <Award size={20} />
            </div>
            <span className="tcd-kpi-chip info">
              +0.3 Band
            </span>
          </div>
          <div>
            <div className="tcd-kpi-value">Band {currentClass.stats.avgScore}</div>
            <div className="tcd-kpi-label">{isVi ? 'Điểm trung bình cả lớp' : 'Overall Class Band Avg'}</div>
          </div>
          <div className="tcd-mini-progress">
            <div 
              className="tcd-mini-progress-fill" 
              style={{ width: `${(currentClass.stats.avgScore / 9.0) * 100}%`, backgroundColor: '#7e22ce' }}
            />
          </div>
          <div className="tcd-kpi-foot-text">
            <span>{isVi ? 'Mục tiêu:' : 'Target:'} {currentClass.targetBand}</span>
            <span style={{ color: '#7e22ce', fontWeight: 600 }}>{isVi ? 'Đạt chuẩn' : 'Target Met'}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="tcd-kpi-card">
          <div className="tcd-kpi-head">
            <div className="tcd-kpi-icon amber">
              <AlertCircle size={20} />
            </div>
            <span className="tcd-kpi-chip warning">
              3 {isVi ? 'em cần phụ đạo' : 'need support'}
            </span>
          </div>
          <div>
            <div className="tcd-kpi-value">{currentClass.stats.targetAttainment}%</div>
            <div className="tcd-kpi-label">{isVi ? 'Tỷ lệ đạt chuẩn mục tiêu' : 'Target Attainment Rate'}</div>
          </div>
          <div className="tcd-mini-progress">
            <div 
              className="tcd-mini-progress-fill" 
              style={{ width: `${currentClass.stats.targetAttainment}%`, backgroundColor: '#d97706' }}
            />
          </div>
          <div className="tcd-kpi-foot-text">
            <span>21 / 24 {isVi ? 'học viên đạt & vượt' : 'achieved'}</span>
            <span style={{ color: '#dc2626', fontWeight: 600 }}>3 {isVi ? 'nguy cơ tụt' : 'at risk'}</span>
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
          <span>{isVi ? 'Bảng điểm & Học viên' : 'Gradebook & Students'}</span>
          <span className="tcd-tab-count">{studentsList.length}</span>
        </button>

        <button 
          className={`tcd-tab-item ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText size={16} />
          <span>{isVi ? 'Danh sách Bài tập lớp' : 'Class Assignments'}</span>
          <span className="tcd-tab-count">{classAssignments.length}</span>
        </button>

        <button 
          className={`tcd-tab-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Sparkles size={16} />
          <span>{isVi ? 'Phân tích 4KN & AI Insights' : '4-Skill Analytics & AI'}</span>
        </button>

        <button 
          className={`tcd-tab-item ${activeTab === 'syllabus' ? 'active' : ''}`}
          onClick={() => setActiveTab('syllabus')}
        >
          <Clock size={16} />
          <span>{isVi ? 'Lộ trình & Buổi học' : 'Syllabus & Sessions'}</span>
          <span className="tcd-tab-count">{currentClass.totalLessons}</span>
        </button>
      </div>

      {/* 5. TAB 1: Bảng điểm & Học viên */}
      {activeTab === 'roster' && (
        <section className="tcd-card-section">
          {/* Toolbar */}
          <div className="tcd-toolbar">
            <div className="tcd-search-wrap">
              <Search size={15} className="tcd-search-icon" />
              <input 
                type="text" 
                className="tcd-search-input"
                placeholder={isVi ? 'Tìm kiếm học viên theo tên, mã HV...' : 'Search student by name, ID...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="tcd-filter-pills">
              <button 
                className={`tcd-pill-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                {isVi ? 'Tất cả' : 'All'} ({studentsList.length})
              </button>
              <button 
                className={`tcd-pill-btn ${statusFilter === 'exceed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('exceed')}
              >
                {isVi ? 'Vượt trội' : 'Exceeding'} (3)
              </button>
              <button 
                className={`tcd-pill-btn ${statusFilter === 'ontime' ? 'active' : ''}`}
                onClick={() => setStatusFilter('ontime')}
              >
                {isVi ? 'Đạt chuẩn' : 'On-track'} (18)
              </button>
              <button 
                className={`tcd-pill-btn ${statusFilter === 'support' ? 'active' : ''}`}
                onClick={() => setStatusFilter('support')}
              >
                {isVi ? 'Cần hỗ trợ' : 'Needs Support'} (3)
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="tcd-table-wrap">
            <table className="tcd-table">
              <thead>
                <tr>
                  <th>{isVi ? 'Học viên' : 'Student'}</th>
                  <th style={{ textAlign: 'center' }}>{isVi ? 'Chuyên cần' : 'Attendance'}</th>
                  <th>{isVi ? 'Tiến độ nộp' : 'Assignments'}</th>
                  <th style={{ textAlign: 'center' }}>Writing</th>
                  <th style={{ textAlign: 'center' }}>Speaking</th>
                  <th style={{ textAlign: 'center' }}>Reading</th>
                  <th style={{ textAlign: 'center' }}>Listening</th>
                  <th style={{ textAlign: 'center' }}>Overall</th>
                  <th>{isVi ? 'Trạng thái' : 'Status'}</th>
                  <th style={{ textAlign: 'right' }}>{isVi ? 'Chi tiết' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((std) => (
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

                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 600, color: std.attendance < 85 ? '#dc2626' : '#334155' }}>
                        {std.attendance}%
                      </span>
                    </td>

                    <td>
                      <div style={{ width: '120px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                          <span>{std.assignmentsCompleted}/{std.totalAssignments}</span>
                          <span style={{ fontWeight: 600 }}>{Math.round((std.assignmentsCompleted / std.totalAssignments) * 100)}%</span>
                        </div>
                        <div className="tcd-mini-progress">
                          <div 
                            className="tcd-mini-progress-fill" 
                            style={{ 
                              width: `${(std.assignmentsCompleted / std.totalAssignments) * 100}%`,
                              backgroundColor: std.assignmentsCompleted < 8 ? '#dc2626' : '#2563eb'
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.writing)}`}>
                        {std.scores.writing}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.speaking)}`}>
                        {std.scores.speaking}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.reading)}`}>
                        {std.scores.reading}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className={`tcd-score-pill ${getScoreClass(std.scores.listening)}`}>
                        {std.scores.listening}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span className="tcd-overall-score">{std.scores.overall}</span>
                    </td>

                    <td>
                      <span className={`tcd-status-chip ${std.status}`}>
                        {std.status === 'exceed' && <Sparkles size={11} />}
                        {std.status === 'ontime' && <CheckCircle2 size={11} />}
                        {std.status === 'support' && <AlertCircle size={11} />}
                        <span>{std.statusLabel}</span>
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="tcd-btn-action-icon"
                        title={isVi ? 'Xem chi tiết học viên' : 'View Profile'}
                        onClick={() => setSelectedStudent(std)}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 6. TAB 2: Danh sách Bài tập lớp */}
      {activeTab === 'assignments' && (
        <section className="tcd-card-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                {isVi ? 'Bài tập đã giao cho lớp này' : 'Assignments for this Class'}
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                {isVi ? 'Quản lý hạn nộp, tỷ lệ hoàn thành và duyệt chấm bài tập của học viên.' : 'Monitor due dates, submission rates and grading queue.'}
              </p>
            </div>
            <button 
              className="tcd-btn-primary"
              onClick={() => navigate(`/teacher/assignments/create?class=${currentClass.code}`)}
            >
              <Plus size={15} />
              <span>{isVi ? 'Giao bài tập mới' : 'New Assignment'}</span>
            </button>
          </div>

          <div className="tcd-assignments-grid">
            {classAssignments.map((hw) => (
              <div key={hw.id} className="tcd-assignment-card">
                <div className="tcd-assignment-card-header">
                  <div>
                    <span className="tcd-class-code-badge" style={{ backgroundColor: '#2563eb' }}>
                      {hw.code}
                    </span>
                    <h3 className="tcd-assignment-title" style={{ marginTop: '8px' }}>
                      {hw.title}
                    </h3>
                  </div>
                </div>

                <div className="tcd-assignment-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} /> {hw.dueDate}
                  </span>
                  <span style={{ 
                    fontWeight: 600, 
                    color: hw.daysLeft === 0 ? '#dc2626' : '#2563eb' 
                  }}>
                    {hw.daysLeft === 0 ? (isVi ? 'Hết hạn hôm nay' : 'Due today') : `${hw.daysLeft} ${isVi ? 'ngày nữa' : 'days left'}`}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                    <span>{isVi ? 'Đã nộp:' : 'Submitted:'} <strong>{hw.submittedCount}/{hw.totalStudents}</strong></span>
                    <span style={{ fontWeight: 600 }}>{Math.round((hw.submittedCount / hw.totalStudents) * 100)}%</span>
                  </div>
                  <div className="tcd-mini-progress">
                    <div 
                      className="tcd-mini-progress-fill"
                      style={{ 
                        width: `${(hw.submittedCount / hw.totalStudents) * 100}%`,
                        backgroundColor: '#2563eb'
                      }}
                    />
                  </div>
                </div>

                <div className="tcd-assignment-stat-row">
                  <span>
                    {isVi ? 'Chờ chấm:' : 'To Grade:'} <strong style={{ color: hw.pendingGrading > 0 ? '#dc2626' : '#16a34a' }}>{hw.pendingGrading} bài</strong>
                  </span>
                  {hw.avgScore > 0 && (
                    <span>{isVi ? 'Điểm TB:' : 'Avg:'} <strong>Band {hw.avgScore}</strong></span>
                  )}
                </div>

                <div className="tcd-assignment-actions">
                  <button 
                    className="tcd-btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => navigate(`/teacher/assignments/${hw.id}`)}
                  >
                    <span>{isVi ? 'Chấm & Quản lý bài' : 'Review & Grade'}</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. TAB 3: Phân tích 4 Kỹ năng & AI Insights */}
      {activeTab === 'analytics' && (
        <section className="tcd-card-section">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {isVi ? 'Đánh giá Năng lực 4 Kỹ năng & AI Insights' : '4-Skill Analytics & AI Diagnostic'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              {isVi ? 'Báo cáo tổng hợp từ công cụ AI Grading Engine dựa trên 240 bài nộp trong học kỳ.' : 'Synthesized diagnosis from AI Grading Engine across 240 semester submissions.'}
            </p>
          </div>

          <div className="tcd-analytics-grid">
            {skillAnalytics.map((sk) => (
              <div key={sk.skill} className="tcd-analytics-skill-card">
                <div className="tcd-skill-card-top">
                  <span className="tcd-skill-tag-name">
                    {sk.skill === 'writing' && <PenTool size={16} color="#2563eb" />}
                    {sk.skill === 'speaking' && <Mic size={16} color="#9333ea" />}
                    {sk.skill === 'reading' && <BookOpen size={16} color="#16a34a" />}
                    {sk.skill === 'listening' && <Headphones size={16} color="#0d9488" />}
                    <span>{sk.name}</span>
                  </span>

                  <div className="tcd-skill-score-box">
                    <span className="tcd-skill-avg-score">{sk.avgScore}</span>
                    <span className="tcd-skill-target-score">/ {sk.targetScore}</span>
                  </div>
                </div>

                <div className="tcd-mini-progress">
                  <div 
                    className="tcd-mini-progress-fill"
                    style={{ 
                      width: `${(sk.avgScore / 9.0) * 100}%`,
                      backgroundColor: sk.skill === 'writing' ? '#2563eb' : sk.skill === 'speaking' ? '#9333ea' : sk.skill === 'reading' ? '#16a34a' : '#0d9488'
                    }}
                  />
                </div>

                {/* Strengths */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', marginBottom: '6px' }}>
                    {isVi ? '✓ Điểm mạnh của lớp:' : '✓ Class Strengths:'}
                  </div>
                  <div className="tcd-tags-list">
                    {sk.strengths.map((str, idx) => (
                      <span key={idx} className="tcd-tag-item strength">{str}</span>
                    ))}
                  </div>
                </div>

                {/* Weaknesses */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>
                    {isVi ? '⚠ Điểm yếu cần khắc phục:' : '⚠ Common Weaknesses:'}
                  </div>
                  <div className="tcd-tags-list">
                    {sk.weaknesses.map((wk, idx) => (
                      <span key={idx} className="tcd-tag-item weakness">{wk}</span>
                    ))}
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="tcd-ai-block">
                  <div className="tcd-ai-header">
                    <Sparkles size={14} />
                    <span>{isVi ? 'Đề xuất can thiệp từ AI' : 'AI Recommendation'}</span>
                  </div>
                  <p className="tcd-ai-text">{sk.aiRecommendation}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Intervention Alert Banner */}
          <div style={{ 
            backgroundColor: '#fffbeb', 
            border: '1px solid #fde68a', 
            borderRadius: '14px', 
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#92400e' }}>
                {isVi ? 'Cảnh báo 3 học viên có nguy cơ không đạt Target Band' : 'Intervention Alert: 3 students at risk'}
              </div>
              <p style={{ fontSize: '13px', color: '#b45309', margin: '4px 0 10px 0' }}>
                {isVi 
                  ? 'Học viên Trần Hoàng Long, Vũ Thị Hương, và Đỗ Minh Quân đang có điểm số trung bình dưới Band 6.0 và tỷ lệ nộp bài chậm. Đề xuất xếp lịch 1-on-1 tutoring trước buổi học số 16.' 
                  : 'Students are currently performing under Band 6.0 with overdue assignments. Recommended to schedule 1-on-1 tutoring before lesson 16.'}
              </p>
              <button 
                className="tcd-btn-primary"
                style={{ backgroundColor: '#d97706', fontSize: '12.5px', padding: '6px 14px' }}
                onClick={() => showToast(isVi ? 'Đã gửi lời mời phụ đạo 1-on-1 tới 3 học viên' : 'Sent 1-on-1 tutoring invites')}
              >
                <Send size={13} />
                <span>{isVi ? 'Gửi lời mời phụ đạo 1-on-1' : 'Send Tutoring Invite'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 8. TAB 4: Lộ trình & Thông tin buổi học */}
      {activeTab === 'syllabus' && (
        <section className="tcd-card-section">
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              {isVi ? 'Lộ trình chi tiết 24 Buổi học' : '24-Session Syllabus & Timeline'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              {isVi ? 'Theo dõi nội dung giảng dạy, tài liệu đính kèm và bài tập về nhà theo từng buổi.' : 'Monitor lesson plans, attached slide decks and homework per session.'}
            </p>
          </div>

          <div className="tcd-syllabus-timeline">
            {syllabusLessons.map((les) => (
              <div 
                key={les.session} 
                className={`tcd-syllabus-item ${les.status === 'current' ? 'current' : les.status === 'completed' ? 'completed' : ''}`}
              >
                <div className="tcd-syllabus-left">
                  <div className="tcd-session-badge">
                    #{les.session}
                  </div>
                  <div>
                    <div className="tcd-syllabus-title-text">{les.title}</div>
                    <div className="tcd-syllabus-date">
                      <Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {les.date} • {les.materialsCount} {isVi ? 'tài liệu đính kèm' : 'materials'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {les.homeworkAttached && (
                    <span style={{ 
                      fontSize: '11.5px', 
                      fontWeight: 600, 
                      padding: '3px 8px', 
                      borderRadius: '6px',
                      backgroundColor: '#eff6ff',
                      color: '#2563eb'
                    }}>
                      {les.homeworkAttached}
                    </span>
                  )}
                  {les.status === 'completed' && (
                    <span className="tcd-status-chip ontime">
                      <CheckCircle2 size={12} /> {isVi ? 'Đã hoàn tất' : 'Completed'}
                    </span>
                  )}
                  {les.status === 'current' && (
                    <span className="tcd-status-chip exceed">
                      <Clock size={12} /> {isVi ? 'Đang diễn ra' : 'Current Session'}
                    </span>
                  )}
                  {les.status === 'upcoming' && (
                    <span className="tcd-status-chip" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                      {isVi ? 'Sắp diễn ra' : 'Upcoming'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. Student Detail Drawer (Modal) */}
      {selectedStudent && (
        <div className="tcd-drawer-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="tcd-drawer-box" onClick={(e) => e.stopPropagation()}>
            <div className="tcd-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={selectedStudent.avatar} alt={selectedStudent.name} className="tcd-avatar" style={{ width: 44, height: 44 }} />
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>{selectedStudent.name}</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{selectedStudent.code} • {selectedStudent.email}</div>
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
              {/* Overall Band Banner */}
              <div style={{ 
                backgroundColor: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{isVi ? 'Điểm trung bình (Overall)' : 'Overall Band'}</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>Band {selectedStudent.scores.overall}</div>
                </div>
                <span className={`tcd-status-chip ${selectedStudent.status}`}>
                  {selectedStudent.statusLabel}
                </span>
              </div>

              {/* 4 Skills Breakdown */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0', color: '#0f172a' }}>
                  {isVi ? 'Chi tiết 4 Kỹ năng' : '4-Skill Performance'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>Writing</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1d4ed8' }}>Band {selectedStudent.scores.writing}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#faf5ff', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#9333ea', fontWeight: 600 }}>Speaking</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#7e22ce' }}>Band {selectedStudent.scores.speaking}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Reading</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#15803d' }}>Band {selectedStudent.scores.reading}</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#f0fdfa', borderRadius: '10px' }}>
                    <div style={{ fontSize: '12px', color: '#0d9488', fontWeight: 600 }}>Listening</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f766e' }}>Band {selectedStudent.scores.listening}</div>
                  </div>
                </div>
              </div>

              {/* Attendance & Completion */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 10px 0', color: '#0f172a' }}>
                  {isVi ? 'Chuyên cần & Bài nộp' : 'Attendance & Homework'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{isVi ? 'Tỷ lệ điểm danh:' : 'Attendance Rate:'}</span>
                    <strong>{selectedStudent.attendance}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{isVi ? 'Bài tập hoàn thành:' : 'Completed Assignments:'}</span>
                    <strong>{selectedStudent.assignmentsCompleted} / {selectedStudent.totalAssignments}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{isVi ? 'Hoạt động gần nhất:' : 'Last Active:'}</span>
                    <span>{selectedStudent.lastActive}</span>
                  </div>
                </div>
              </div>

              {/* Recent Feedback */}
              {selectedStudent.recentFeedback && (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
                    {isVi ? 'Nhận xét gần nhất của giáo viên' : 'Latest Teacher Feedback'}
                  </h4>
                  <p style={{ 
                    fontSize: '13px', 
                    lineHeight: 1.6, 
                    color: '#475569', 
                    backgroundColor: '#f8fafc', 
                    padding: '12px 14px', 
                    borderRadius: '8px',
                    margin: 0,
                    border: '1px solid #e2e8f0'
                  }}>
                    "{selectedStudent.recentFeedback}"
                  </p>
                </div>
              )}
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
                onClick={() => {
                  showToast(isVi ? `Đã gửi tin nhắn nhắc nhở tới ${selectedStudent.name}` : `Message sent to ${selectedStudent.name}`);
                  setSelectedStudent(null);
                }}
              >
                <Send size={13} />
                <span>{isVi ? 'Gửi tin nhắn cho học viên' : 'Send Direct Message'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherClassProgress;
