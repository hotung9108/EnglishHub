import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Plus, Mic, BookOpen, Headphones, PenTool, Clock, Calendar, 
  Search, CheckCircle2, AlertCircle, FileText, ArrowRight,
  UploadCloud, X, Zap
} from 'lucide-react';

interface AssignmentItem {
  id: string;
  code: string;
  type: 'writing' | 'speaking' | 'reading' | 'listening';
  typeLabel: string;
  title: string;
  className: string;
  dueDate: string;
  daysLeft?: number;
  totalStudents: number;
  submittedCount: number;
  pendingGradingCount: number;
  status: 'open' | 'closed' | 'upcoming';
}

export const TeacherAssignments: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [selectedClass, setSelectedClass] = useState<string>('ENG-IELTS-6.5A');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSkillModal, setShowSkillModal] = useState(false);

  const assignments: AssignmentItem[] = [
    {
      id: '1',
      code: 'HW-01',
      type: 'writing',
      typeLabel: 'Writing Task 2',
      title: 'IELTS Writing Task 2: Artificial Intelligence & Workforce Evolution',
      className: 'ENG-IELTS-6.5A',
      dueDate: '2026-03-22 23:59',
      daysLeft: 2,
      totalStudents: 24,
      submittedCount: 22,
      pendingGradingCount: 2,
      status: 'open'
    },
    {
      id: '2',
      code: 'HW-02',
      type: 'speaking',
      typeLabel: 'Speaking Part 2',
      title: 'Speaking Part 2: Environmental Pollution in Urban Megacities',
      className: 'ENG-IELTS-6.5A',
      dueDate: '2026-03-20 23:59',
      daysLeft: 0,
      totalStudents: 24,
      submittedCount: 24,
      pendingGradingCount: 3,
      status: 'open'
    },
    {
      id: '3',
      code: 'HW-03',
      type: 'reading',
      typeLabel: 'Reading Mock Test',
      title: 'Cambridge 19 - Academic Reading Passage: Biomimicry Innovation',
      className: 'ENG-IELTS-6.5A',
      dueDate: '2026-03-18 21:00',
      totalStudents: 24,
      submittedCount: 24,
      pendingGradingCount: 0,
      status: 'closed'
    },
    {
      id: '4',
      code: 'HW-04',
      type: 'listening',
      typeLabel: 'Listening Section 3 & 4',
      title: 'IELTS Listening Practice: Campus Life & Renewable Energy Seminar',
      className: 'ENG-IELTS-6.5A',
      dueDate: '2026-03-15 21:00',
      totalStudents: 24,
      submittedCount: 23,
      pendingGradingCount: 0,
      status: 'closed'
    },
    {
      id: '5',
      code: 'HW-05',
      type: 'writing',
      typeLabel: 'Writing Task 1',
      title: 'IELTS Writing Task 1: Comparative Bar Chart on Carbon Emissions',
      className: 'ENG-IELTS-6.5A',
      dueDate: '2026-03-25 08:00',
      daysLeft: 5,
      totalStudents: 24,
      submittedCount: 8,
      pendingGradingCount: 2,
      status: 'upcoming'
    }
  ];

  const filteredAssignments = useMemo(() => {
    return assignments.filter(item => {
      if (skillFilter !== 'all' && item.type !== skillFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [assignments, skillFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = assignments.length;
    const openCount = assignments.filter(a => a.status === 'open').length;
    const pendingTotal = assignments.reduce((sum, a) => sum + a.pendingGradingCount, 0);
    const avgSubmission = Math.round(
      (assignments.reduce((sum, a) => sum + (a.submittedCount / a.totalStudents), 0) / assignments.length) * 100
    );
    return {
      total,
      openCount,
      pendingTotal,
      avgSubmission
    };
  }, [assignments]);

  const getSkillBadge = (type: string) => {
    switch (type) {
      case 'writing':
        return (
          <span className="std-skill-tag writing">
            <PenTool size={13} />
            Writing
          </span>
        );
      case 'speaking':
        return (
          <span className="std-skill-tag speaking">
            <Mic size={13} />
            Speaking
          </span>
        );
      case 'reading':
        return (
          <span className="std-skill-tag reading">
            <BookOpen size={13} />
            Reading
          </span>
        );
      default:
        return (
          <span className="std-skill-tag listening">
            <Headphones size={13} />
            Listening
          </span>
        );
    }
  };

  const handleSelectSkillToCreate = (skillType: string) => {
    setShowSkillModal(false);
    navigate(`/teacher/assignments/create?type=${skillType}`);
  };

  return (
    <div className="teacher-container">
      {/* Header */}
      <div className="teacher-header">
        <div>
          <h1 className="teacher-title">
            <FileText size={28} color="var(--primary)" />
            {isVi ? 'Quản Lý Bài Tập & Chấm Điểm' : 'Assignment & Grading Management'}
          </h1>
          <p className="teacher-subtitle">
            {isVi
              ? 'Tạo đề bài mới, theo dõi tiến độ nộp bài của cả lớp và chấm chữa bài nhanh với sự hỗ trợ của AI.'
              : 'Create homework prompts, monitor submission turnout, and review student drafts with AI assistance.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Class Select Dropdown */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{
              padding: '9px 14px',
              fontSize: '13.5px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--outline-variant)',
              backgroundColor: 'var(--surface)',
              color: 'var(--on-surface)',
              fontWeight: 600,
              outline: 'none'
            }}
          >
            <option value="ENG-IELTS-6.5A">Lớp: ENG-IELTS-6.5A (Intensive)</option>
            <option value="ENG-GRAM-ADV">Lớp: ENG-GRAM-ADV (Ngữ pháp)</option>
            <option value="ENG-TOEIC-750">Lớp: ENG-TOEIC-750 (Cấp tốc)</option>
          </select>

          <button
            type="button"
            className="std-eco-btn-secondary"
            onClick={() => alert(isVi ? 'Đang mở Ngân hàng đề thi mẫu IELTS Cambridge...' : 'Opening Cambridge Exam Bank...')}
          >
            <UploadCloud size={16} />
            <span>{isVi ? 'Ngân hàng đề thi' : 'Exam Bank'}</span>
          </button>

          <button
            type="button"
            className="std-eco-btn-primary"
            onClick={() => setShowSkillModal(true)}
          >
            <Plus size={16} />
            <span>{isVi ? 'Giao bài tập mới' : 'Create Assignment'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="teacher-stats-grid">
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="teacher-stat-num">{stats.total} {isVi ? 'Bài tập' : 'Items'}</div>
            <div className="teacher-stat-label">{isVi ? 'Tổng bài tập trong học kỳ' : 'Total Course Assignments'}</div>
          </div>
        </div>

        <div className="teacher-stat-card">
          <div className="teacher-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="teacher-stat-num">{stats.openCount} {isVi ? 'Bài đang mở' : 'Active'}</div>
            <div className="teacher-stat-label">{isVi ? 'Học viên đang làm & nộp bài' : 'Currently Open for Submissions'}</div>
          </div>
        </div>

        <div className="teacher-stat-card" style={{ borderColor: stats.pendingTotal > 0 ? '#fde68a' : undefined }}>
          <div className="teacher-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={22} />
          </div>
          <div>
            <div className="teacher-stat-num" style={{ color: '#d97706' }}>
              {stats.pendingTotal} {isVi ? 'Bài cần chấm' : 'To Grade'}
            </div>
            <div className="teacher-stat-label">{isVi ? 'Chờ giáo viên nhận xét & chấm điểm' : 'Pending Teacher Evaluation'}</div>
          </div>
        </div>

        <div className="teacher-stat-card">
          <div className="teacher-stat-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
            <Zap size={22} />
          </div>
          <div>
            <div className="teacher-stat-num">{stats.avgSubmission}%</div>
            <div className="teacher-stat-label">{isVi ? 'Tỷ lệ nộp bài trung bình' : 'Avg Submission Turnout'}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="teacher-filter-bar">
        <div className="teacher-pills">
          <button
            type="button"
            className={`teacher-pill ${skillFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSkillFilter('all')}
          >
            {isVi ? 'Tất cả kỹ năng' : 'All Skills'}
            <span className="teacher-pill-badge">{assignments.length}</span>
          </button>
          <button
            type="button"
            className={`teacher-pill ${skillFilter === 'writing' ? 'active' : ''}`}
            onClick={() => setSkillFilter('writing')}
          >
            <PenTool size={13} />
            Writing
          </button>
          <button
            type="button"
            className={`teacher-pill ${skillFilter === 'speaking' ? 'active' : ''}`}
            onClick={() => setSkillFilter('speaking')}
          >
            <Mic size={13} />
            Speaking
          </button>
          <button
            type="button"
            className={`teacher-pill ${skillFilter === 'reading' ? 'active' : ''}`}
            onClick={() => setSkillFilter('reading')}
          >
            <BookOpen size={13} />
            Reading
          </button>
          <button
            type="button"
            className={`teacher-pill ${skillFilter === 'listening' ? 'active' : ''}`}
            onClick={() => setSkillFilter('listening')}
          >
            <Headphones size={13} />
            Listening
          </button>
        </div>

        <div className="teacher-search-wrap">
          <Search size={15} className="teacher-search-icon" />
          <input
            type="text"
            className="teacher-search-input"
            placeholder={isVi ? 'Tìm bài tập theo tên hoặc mã HW...' : 'Search assignment or HW code...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Assignments List */}
      <div className="teacher-assignments-list">
        {filteredAssignments.map((item) => {
          const submissionPercent = Math.round((item.submittedCount / item.totalStudents) * 100);

          return (
            <div key={item.id} className="teacher-assignment-card">
              {/* Left Column: Skill, Title, Due date */}
              <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: '#0f172a', 
                    color: '#ffffff' 
                  }}>
                    {item.code}
                  </span>
                  {getSkillBadge(item.type)}
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                    {item.typeLabel}
                  </span>
                </div>

                <h3 
                  onClick={() => navigate(`/teacher/assignments/${item.id}`)}
                  style={{ 
                    fontSize: '16px', 
                    fontWeight: 700, 
                    color: 'var(--on-surface)', 
                    margin: 0, 
                    cursor: 'pointer',
                    lineHeight: 1.4
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--on-surface)')}
                >
                  {item.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12.5px', color: 'var(--on-surface-variant)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} />
                    {isVi ? 'Hạn nộp:' : 'Deadline:'} <strong>{item.dueDate}</strong>
                  </span>
                  {item.daysLeft !== undefined && (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      backgroundColor: item.daysLeft <= 1 ? '#fef2f2' : '#f0fdf4',
                      color: item.daysLeft <= 1 ? '#dc2626' : '#16a34a' 
                    }}>
                      {item.daysLeft === 0 
                        ? (isVi ? 'Hết hạn hôm nay' : 'Due today') 
                        : (isVi ? `Còn ${item.daysLeft} ngày` : `${item.daysLeft} days left`)}
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Column: Submission Progress */}
              <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <span style={{ color: 'var(--on-surface-variant)' }}>{isVi ? 'Tiến độ nộp bài:' : 'Turnout:'}</span>
                  <span style={{ fontWeight: 700, color: 'var(--on-surface)' }}>
                    {item.submittedCount}/{item.totalStudents} ({submissionPercent}%)
                  </span>
                </div>
                <div className="teacher-progress-bar">
                  <div 
                    className="teacher-progress-fill" 
                    style={{ width: `${submissionPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Right Column: Pending grading badge & Action Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                {item.pendingGradingCount > 0 ? (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    padding: '4px 10px', 
                    borderRadius: '12px', 
                    backgroundColor: '#fffbeb', 
                    color: '#d97706',
                    border: '1px solid #fde68a'
                  }}>
                    <AlertCircle size={13} />
                    {item.pendingGradingCount} {isVi ? 'bài chờ chấm' : 'to grade'}
                  </span>
                ) : (
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px', 
                    fontSize: '12px', 
                    color: '#16a34a', 
                    fontWeight: 600 
                  }}>
                    <CheckCircle2 size={13} />
                    {isVi ? 'Đã chấm hết' : 'All Graded'}
                  </span>
                )}

                <button
                  type="button"
                  className="std-eco-btn-primary"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => navigate(`/teacher/assignments/${item.id}`)}
                >
                  <span>{item.pendingGradingCount > 0 ? (isVi ? 'Chấm bài ngay' : 'Grade Now') : (isVi ? 'Xem kết quả' : 'View Submissions')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {filteredAssignments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
            <FileText size={36} color="var(--on-surface-variant)" style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              {isVi ? 'Không tìm thấy bài tập nào' : 'No assignments found'}
            </h4>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              {isVi ? 'Hãy thử đổi bộ lọc kỹ năng hoặc từ khóa tìm kiếm.' : 'Try adjusting the skill filter or search query.'}
            </p>
          </div>
        )}
      </div>

      {/* Skill Picker Modal */}
      {showSkillModal && (
        <div className="skill-modal-overlay" onClick={() => setShowSkillModal(false)}>
          <div className="skill-modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--on-surface)' }}>
                {isVi ? 'Chọn Loại Kỹ Năng Cần Giao Bài' : 'Select Assignment Skill Module'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowSkillModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--on-surface-variant)', margin: '0 0 20px 0' }}>
              {isVi 
                ? 'Hệ thống tự động tích hợp rubric chấm điểm chuẩn IELTS và bộ công cụ chẩn đoán AI cho từng kỹ năng.' 
                : 'Automated IELTS rubrics and AI assessment engines will be calibrated for your assignment.'}
            </p>

            <div className="skill-card-grid">
              {/* Writing */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('writing')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PenTool size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>Writing Task 1 & 2</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    {isVi ? 'Bài luận học thuật, phân tích biểu đồ kèm bộ đếm từ và chấm điểm tự động.' : 'Academic essays & charts with word counters and auto-grammar check.'}
                  </p>
                </div>
              </div>

              {/* Speaking */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('speaking')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Mic size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>Speaking Part 1, 2, 3</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    {isVi ? 'Thu âm giọng nói trực tiếp, phân tích âm vị phát âm và độ trôi chảy AI.' : 'Audio recordings with AI fluency & phoneme accuracy analysis.'}
                  </p>
                </div>
              </div>

              {/* Reading */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('reading')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>Reading Mock Passage</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    {isVi ? 'Đề đọc hiểu 3 passage, câu hỏi Matching Headings, True/False/Not Given.' : 'Full reading passages with automated key checking and time tracker.'}
                  </p>
                </div>
              </div>

              {/* Listening */}
              <div className="skill-card-option" onClick={() => handleSelectSkillToCreate('listening')}>
                <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Headphones size={22} />
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700 }}>Listening Section 1-4</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>
                    {isVi ? 'Tải lên audio bài nghe MP3, câu hỏi điền từ và phát hiện bẫy nghe.' : 'Upload MP3 audio files with transcripts and distractor markers.'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="std-eco-btn-secondary"
                onClick={() => setShowSkillModal(false)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;
