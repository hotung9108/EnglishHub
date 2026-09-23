import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, CheckCircle2, Clock, 
  TrendingUp, ArrowRight, Download, Search,
  PenTool, Mic, BookOpen, Headphones, AlertCircle, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface GradeRow {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  skill: 'Writing' | 'Speaking' | 'Reading' | 'Listening';
  submittedDate: string;
  weight: string;
  rawScore: string;
  scaledGrade: string;
  status: 'graded' | 'pending';
}

export const StudentGrades: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [grades] = useState<GradeRow[]>([
    {
      id: 'g-1',
      assignmentId: '1',
      assignmentTitle: 'HW-01: Writing Task 2 - Artificial Intelligence & Workforce',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      skill: 'Writing',
      submittedDate: '2026-03-18',
      weight: '15%',
      rawScore: '84/100',
      scaledGrade: '7.5 / 9.0',
      status: 'graded'
    },
    {
      id: 'g-2',
      assignmentId: '2',
      assignmentTitle: 'HW-02: Speaking Part 2 - Environmental Issues & Urban Pollution',
      className: 'IELTS Speaking Master',
      skill: 'Speaking',
      submittedDate: '2026-03-19',
      weight: '15%',
      rawScore: '78/100',
      scaledGrade: '7.0 / 9.0',
      status: 'graded'
    },
    {
      id: 'g-3',
      assignmentId: '3',
      assignmentTitle: 'HW-03: Reading Mock Test 3 - Academic Section 1 & 2',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      skill: 'Reading',
      submittedDate: '2026-03-16',
      weight: '10%',
      rawScore: '34/40',
      scaledGrade: '7.5 / 9.0',
      status: 'graded'
    },
    {
      id: 'g-4',
      assignmentId: '4',
      assignmentTitle: 'HW-04: Listening Practice 4 - Campus Facilities & Academic Life',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      skill: 'Listening',
      submittedDate: '2026-03-14',
      weight: '10%',
      rawScore: '36/40',
      scaledGrade: '8.0 / 9.0',
      status: 'graded'
    },
    {
      id: 'g-5',
      assignmentId: '5',
      assignmentTitle: 'HW-05: Writing Task 1 - Comparative Bar Chart on Renewable Energy',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      skill: 'Writing',
      submittedDate: '2026-03-20',
      weight: '10%',
      rawScore: '--',
      scaledGrade: isVi ? 'Đang chấm' : 'Evaluating',
      status: 'pending'
    },
    {
      id: 'g-6',
      assignmentId: '6',
      assignmentTitle: 'HW-06: Speaking Part 1 & 3 - Education Technology & Future Jobs',
      className: 'IELTS Speaking Master',
      skill: 'Speaking',
      submittedDate: '2026-03-12',
      weight: '15%',
      rawScore: '82/100',
      scaledGrade: '7.5 / 9.0',
      status: 'graded'
    }
  ]);

  const classes = useMemo(() => {
    const set = new Set(grades.map(g => g.className));
    return Array.from(set);
  }, [grades]);

  const filteredGrades = useMemo(() => {
    return grades.filter(g => {
      if (selectedClass !== 'all' && g.className !== selectedClass) return false;
      if (selectedSkill !== 'all' && g.skill !== selectedSkill) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return g.assignmentTitle.toLowerCase().includes(q) || g.className.toLowerCase().includes(q);
      }
      return true;
    });
  }, [grades, selectedClass, selectedSkill, searchQuery]);

  const gradedCount = grades.filter(g => g.status === 'graded').length;
  const pendingCount = grades.filter(g => g.status === 'pending').length;

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'Writing': return <PenTool size={14} />;
      case 'Speaking': return <Mic size={14} />;
      case 'Reading': return <BookOpen size={14} />;
      case 'Listening': return <Headphones size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getSkillTagClass = (skill: string) => {
    switch (skill) {
      case 'Writing': return 'writing';
      case 'Speaking': return 'speaking';
      case 'Reading': return 'reading';
      case 'Listening': return 'listening';
      default: return 'mock';
    }
  };

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="std-eco-container">
      {/* Header */}
      <div className="std-eco-header">
        <div>
          <h1 className="std-eco-title">
            <Award size={28} color="var(--primary)" />
            {isVi ? 'Bảng Điểm & Kết Quả Đánh Giá' : 'Academic Grade Book & Assessment'}
          </h1>
          <p className="std-eco-subtitle">
            {isVi 
              ? 'Theo dõi chi tiết điểm số từng bài nộp, trọng số học phần và kết quả quy đổi theo chuẩn IELTS.' 
              : 'Track assignment grades, weighted GPA, and standardized IELTS band scale equivalents.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="button" 
            className="std-eco-btn-secondary"
            onClick={handleExport}
          >
            <Download size={16} />
            <span>{isVi ? 'Xuất Bảng Điểm (PDF)' : 'Export Transcript'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="std-eco-stats-grid">
        <div className="std-eco-stat-card">
          <div className="std-eco-stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="std-eco-stat-num">Band 7.5</div>
            <div className="std-eco-stat-label">{isVi ? 'Điểm TB Tích lũy (Overall Band)' : 'Cumulative Band Score'}</div>
          </div>
        </div>

        <div className="std-eco-stat-card">
          <div className="std-eco-stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="std-eco-stat-num">{gradedCount} / {grades.length}</div>
            <div className="std-eco-stat-label">{isVi ? 'Bài tập đã có kết quả' : 'Assignments Graded'}</div>
          </div>
        </div>

        <div className="std-eco-stat-card">
          <div className="std-eco-stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="std-eco-stat-num">{pendingCount} {isVi ? 'bài' : 'items'}</div>
            <div className="std-eco-stat-label">{isVi ? 'Đang chờ giáo viên/AI chấm' : 'Awaiting Grading'}</div>
          </div>
        </div>

        <div className="std-eco-stat-card">
          <div className="std-eco-stat-icon" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="std-eco-stat-num">+0.5 Band</div>
            <div className="std-eco-stat-label">{isVi ? 'Tăng trưởng so với đầu kỳ' : 'Progress vs Diagnostic'}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="std-eco-filter-bar">
        <div className="std-eco-pills">
          <button 
            type="button"
            className={`std-eco-pill ${selectedSkill === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedSkill('all')}
          >
            {isVi ? 'Tất cả kỹ năng' : 'All Skills'}
            <span className="std-eco-pill-badge">{grades.length}</span>
          </button>
          <button 
            type="button"
            className={`std-eco-pill ${selectedSkill === 'Writing' ? 'active' : ''}`}
            onClick={() => setSelectedSkill('Writing')}
          >
            <PenTool size={14} />
            Writing
          </button>
          <button 
            type="button"
            className={`std-eco-pill ${selectedSkill === 'Speaking' ? 'active' : ''}`}
            onClick={() => setSelectedSkill('Speaking')}
          >
            <Mic size={14} />
            Speaking
          </button>
          <button 
            type="button"
            className={`std-eco-pill ${selectedSkill === 'Reading' ? 'active' : ''}`}
            onClick={() => setSelectedSkill('Reading')}
          >
            <BookOpen size={14} />
            Reading
          </button>
          <button 
            type="button"
            className={`std-eco-pill ${selectedSkill === 'Listening' ? 'active' : ''}`}
            onClick={() => setSelectedSkill('Listening')}
          >
            <Headphones size={14} />
            Listening
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Class Filter */}
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
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
            <option value="all">{isVi ? 'Tất cả các lớp' : 'All Enrolled Classes'}</option>
            {classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Search box */}
          <div className="std-eco-search-wrap">
            <Search size={15} className="std-eco-search-icon" />
            <input 
              type="text"
              className="std-eco-search-input"
              placeholder={isVi ? 'Tìm kiếm bài tập...' : 'Search assignment...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Grades Table */}
      <div className="std-eco-card">
        <div className="std-eco-card-header">
          <h2 className="std-eco-card-title">
            <FileText size={18} color="var(--primary)" />
            {isVi ? 'Danh Sách Điểm Số & Đánh Giá Chi Tiết' : 'Detailed Assignment Grades & Scores'}
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
            {isVi ? `Hiển thị ${filteredGrades.length} kết quả` : `Showing ${filteredGrades.length} entries`}
          </span>
        </div>

        <div className="grades-table-responsive">
          <table className="grades-table">
            <thead>
              <tr>
                <th>{isVi ? 'Bài tập & Khóa học' : 'Assignment & Class'}</th>
                <th>{isVi ? 'Kỹ năng' : 'Skill'}</th>
                <th>{isVi ? 'Ngày nộp' : 'Submitted Date'}</th>
                <th>{isVi ? 'Trọng số' : 'Weight'}</th>
                <th>{isVi ? 'Điểm thô' : 'Raw Score'}</th>
                <th>{isVi ? 'Quy đổi IELTS' : 'Equivalent Band'}</th>
                <th>{isVi ? 'Trạng thái' : 'Status'}</th>
                <th style={{ textAlign: 'right' }}>{isVi ? 'Hành động' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: '3px' }}>
                      {row.assignmentTitle}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                      {row.className}
                    </div>
                  </td>
                  <td>
                    <span className={`std-skill-tag ${getSkillTagClass(row.skill)}`}>
                      {getSkillIcon(row.skill)}
                      {row.skill}
                    </span>
                  </td>
                  <td style={{ color: 'var(--on-surface-variant)', fontSize: '13px' }}>
                    {row.submittedDate}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: '13px' }}>
                      {row.weight}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: row.rawScore !== '--' ? 'var(--on-surface)' : 'var(--on-surface-variant)' }}>
                      {row.rawScore}
                    </span>
                  </td>
                  <td>
                    {row.status === 'graded' ? (
                      <span className="grade-score-pill high">
                        {row.scaledGrade}
                      </span>
                    ) : (
                      <span className="grade-score-pill pending">
                        <Clock size={12} />
                        {row.scaledGrade}
                      </span>
                    )}
                  </td>
                  <td>
                    {row.status === 'graded' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#16a34a', fontWeight: 600 }}>
                        <CheckCircle2 size={15} />
                        {isVi ? 'Đã chấm' : 'Graded'}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: '#d97706', fontWeight: 600 }}>
                        <Clock size={15} />
                        {isVi ? 'Đang chấm' : 'Pending'}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {row.status === 'graded' ? (
                      <button
                        type="button"
                        className="std-eco-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12.5px' }}
                        onClick={() => navigate(`/student/assignments/${row.assignmentId}/result`)}
                      >
                        <span>{isVi ? 'Xem lời giải' : 'Review Result'}</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="std-eco-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12.5px', opacity: 0.7 }}
                        onClick={() => navigate(`/student/assignments/${row.assignmentId}`)}
                      >
                        <span>{isVi ? 'Xem bài nộp' : 'View Submission'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredGrades.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--on-surface-variant)' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {isVi ? 'Không tìm thấy kết quả phù hợp với bộ lọc' : 'No grade records match the selected filters'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
