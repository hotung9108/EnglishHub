import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Sparkles, UserCheck, Star,
  ArrowRight, Search, CheckCircle2, AlertCircle,
  Lightbulb, PenTool, Mic, BookOpen, Headphones
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FeedbackEntry {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  className: string;
  skill: 'writing' | 'speaking' | 'reading' | 'listening';
  reviewerType: 'teacher' | 'ai';
  reviewerName: string;
  reviewerRole: string;
  date: string;
  score: string;
  badgeType: string;
  summaryComment: string;
  keyStrengths: string[];
  suggestedImprovement: string;
}

export const StudentFeedback: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [activeFilter, setActiveFilter] = useState<'all' | 'teacher' | 'ai'>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [feedbackList] = useState<FeedbackEntry[]>([
    {
      id: 'fb-1',
      assignmentId: '2',
      assignmentTitle: 'Speaking Part 2: Environmental Issues & Urban Pollution',
      className: 'IELTS Speaking Master',
      skill: 'speaking',
      reviewerType: 'ai',
      reviewerName: 'EnglishHub AI Fluency & Acoustic Engine v2.4',
      reviewerRole: 'Automated Phoneme & Speech-to-Text Diagnostic',
      date: '2026-03-19 14:20',
      score: 'Band 7.0',
      badgeType: 'Band 7.0',
      summaryComment: 'Độ trôi chảy xuất sắc và ngữ điệu tự nhiên xuyên suốt bài nói Part 2. Tốc độ nói đạt chuẩn (138 từ/phút). Tuy nhiên có một số điểm ngập ngừng khi phát âm các từ đa âm tiết như "degradation" và "contaminants".',
      keyStrengths: [
        'Tốc độ nói ổn định và tự tin, không có khoảng ngắt chết (dead pauses)',
        'Sử dụng khéo léo các từ nối phản biện: "Frankly speaking...", "To tackle this pressing issue..."'
      ],
      suggestedImprovement: 'Tập trung nối âm phụ âm cuối sang nguyên âm đầu (linking sounds) để giúp bài nói mượt mà hơn và đẩy điểm Fluency lên Band 7.5.'
    },
    {
      id: 'fb-2',
      assignmentId: '1',
      assignmentTitle: 'Writing Task 2: Artificial Intelligence & Workforce Evolution',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      skill: 'writing',
      reviewerType: 'teacher',
      reviewerName: 'Cô Trần Thị Mai Lan',
      reviewerRole: 'Giảng viên Chuyên môn IELTS 8.5',
      date: '2026-03-18 10:15',
      score: 'Band 7.5',
      badgeType: 'Band 7.5',
      summaryComment: 'Bài viết có bố cục 4 đoạn chuẩn mực academic (Task Achievement rất tốt). Em đã đưa ra ví dụ minh họa thực tế thuyết phục về tự động hóa trong ngành sản xuất. Cần trau chuốt thêm các cặp liên từ phức tạp và tránh lặp từ vựng chủ đề.',
      keyStrengths: [
        'Cấu trúc đoạn thân bài mạch lạc với câu chủ đề rõ ràng (Cohesion tốt)',
        'Vốn từ vựng chuyên ngành công nghệ phong phú: "technological disruption", "human ingenuity"'
      ],
      suggestedImprovement: 'Hạn chế lặp lại từ "technology" quá 4 lần trong bài; hãy linh hoạt thay thế bằng "digital transformation", "technological advances", "automation tools".'
    },
    {
      id: 'fb-3',
      assignmentId: '3',
      assignmentTitle: 'Reading Mock Test 3: Academic Section 1 & 2',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      skill: 'reading',
      reviewerType: 'ai',
      reviewerName: 'EnglishHub Auto-Evaluation Diagnostic',
      reviewerRole: 'Automated Reading Key & Distractor Engine',
      date: '2026-03-16 19:45',
      score: '34 / 40 (Band 7.5)',
      badgeType: 'Band 7.5',
      summaryComment: 'Hoàn thành 34/40 câu đúng trong 48 phút. Em làm rất tốt dạng Matching Headings (100% đúng). Tuy nhiên gặp khó khăn ở dạng câu hỏi True/False/Not Given do bẫy thông tin suy diễn.',
      keyStrengths: [
        'Tốc độ đọc lướt (skimming) và quét thông tin (scanning) rất nhanh',
        'Nắm bắt ý chính của đoạn văn chuẩn xác'
      ],
      suggestedImprovement: 'Đối với câu hỏi Not Given: nếu bài đọc không khẳng định trực tiếp hoặc không thể suy ra chắc chắn từ văn bản, tuyệt đối không được tự ý phán đoán theo logic thực tế bên ngoài.'
    },
    {
      id: 'fb-4',
      assignmentId: '4',
      assignmentTitle: 'Listening Practice 4: Campus Facilities & Academic Life',
      className: 'IELTS Intensive Band 6.5 - 7.5',
      skill: 'listening',
      reviewerType: 'teacher',
      reviewerName: 'Thầy Hoàng Minh Đức',
      reviewerRole: 'Giảng viên IELTS Listening & Pronunciation',
      date: '2026-03-14 16:30',
      score: '36 / 40 (Band 8.0)',
      badgeType: 'Band 8.0',
      summaryComment: 'Kết quả xuất sắc! Em bắt được các bẫy sửa đổi thông tin (self-correction trap) ở Section 3 rất nhanh nhạy. Chỉ mất điểm ở 2 câu điền từ do thiếu số nhiều đuôi "s".',
      keyStrengths: [
        'Khả năng nghe phân biệt âm tốt trong môi trường nhiều tạp âm',
        'Phản xạ nhanh với các từ đồng nghĩa (synonyms) trong câu hỏi'
      ],
      suggestedImprovement: 'Dành 30 giây cuối mỗi Section để kiểm tra ngữ pháp câu điền từ (singular/plural noun và verb tense).'
    }
  ]);

  const teacherFeedbackCount = feedbackList.filter(f => f.reviewerType === 'teacher').length;
  const aiFeedbackCount = feedbackList.filter(f => f.reviewerType === 'ai').length;

  const filtered = feedbackList.filter(item => {
    if (activeFilter === 'teacher' && item.reviewerType !== 'teacher') return false;
    if (activeFilter === 'ai' && item.reviewerType !== 'ai') return false;
    if (skillFilter !== 'all' && item.skill !== skillFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.assignmentTitle.toLowerCase().includes(q) ||
        item.reviewerName.toLowerCase().includes(q) ||
        item.summaryComment.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'writing': return <PenTool size={14} />;
      case 'speaking': return <Mic size={14} />;
      case 'reading': return <BookOpen size={14} />;
      default: return <Headphones size={14} />;
    }
  };

  return (
    <div className="std-eco-container">
      {/* Header */}
      <div className="std-eco-header">
        <div>
          <h1 className="std-eco-title">
            <MessageSquare size={28} color="var(--primary)" />
            {isVi ? 'Hòm Thư Nhận Xét & Phản Hồi Chữa Bài' : 'Feedback & Detailed Evaluation Inbox'}
          </h1>
          <p className="std-eco-subtitle">
            {isVi
              ? 'Tổng hợp lời nhận xét, ghi chú sửa lỗi từng câu từ Giảng viên chuyên môn và Trợ lý AI thông minh.'
              : 'Review pedagogical feedback, rubric evaluation notes, and sentence-level corrections from instructors and AI.'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="std-eco-filter-bar">
        <div className="std-eco-pills">
          <button
            type="button"
            className={`std-eco-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            {isVi ? 'Tất cả phản hồi' : 'All Reviews'}
            <span className="std-eco-pill-badge">{feedbackList.length}</span>
          </button>

          <button
            type="button"
            className={`std-eco-pill ${activeFilter === 'teacher' ? 'active' : ''}`}
            onClick={() => setActiveFilter('teacher')}
          >
            <UserCheck size={14} />
            {isVi ? 'Từ Giảng viên' : 'From Instructors'}
            <span className="std-eco-pill-badge">{teacherFeedbackCount}</span>
          </button>

          <button
            type="button"
            className={`std-eco-pill ${activeFilter === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ai')}
          >
            <Sparkles size={14} />
            {isVi ? 'Từ Trợ lý AI' : 'From AI Diagnostic'}
            <span className="std-eco-pill-badge">{aiFeedbackCount}</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Skill Filter Dropdown */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
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
            <option value="all">{isVi ? 'Tất cả kỹ năng' : 'All Skills'}</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
          </select>

          {/* Search box */}
          <div className="std-eco-search-wrap">
            <Search size={15} className="std-eco-search-icon" />
            <input
              type="text"
              className="std-eco-search-input"
              placeholder={isVi ? 'Tìm nhận xét, bài tập...' : 'Search feedback, teacher...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div>
        {filtered.map((item) => (
          <div key={item.id} className="feedback-card">
            {/* Header */}
            <div className="feedback-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className={`feedback-reviewer-avatar ${item.reviewerType}`}>
                  {item.reviewerType === 'teacher' ? (
                    <UserCheck size={22} />
                  ) : (
                    <Sparkles size={22} />
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--on-surface)' }}>
                      {item.reviewerName}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: item.reviewerType === 'teacher' ? '#eff6ff' : '#f0fdf4',
                        color: item.reviewerType === 'teacher' ? '#2563eb' : '#16a34a',
                        border: `1px solid ${item.reviewerType === 'teacher' ? '#bfdbfe' : '#bbf7d0'}`
                      }}
                    >
                      {item.reviewerRole}
                    </span>
                  </div>

                  <div style={{ fontSize: '12.5px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                    {item.className} • <span style={{ color: 'var(--on-surface-variant)' }}>{item.date}</span>
                  </div>
                </div>
              </div>

              {/* Band Score & Skill Tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`std-skill-tag ${item.skill}`}>
                  {getSkillIcon(item.skill)}
                  {item.skill}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 800,
                    backgroundColor: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0'
                  }}
                >
                  <Star size={13} fill="#059669" />
                  {item.score}
                </span>
              </div>
            </div>

            {/* Assignment Title */}
            <div>
              <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.03em' }}>
                {isVi ? 'Bài tập được đánh giá:' : 'Evaluated Assignment:'}
              </span>
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--primary)', margin: '4px 0 0 0' }}>
                {item.assignmentTitle}
              </h3>
            </div>

            {/* Quote Box: General Evaluation */}
            <div className="feedback-quote-box">
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '4px', letterSpacing: '0.04em' }}>
                {isVi ? 'Đánh giá tổng quan' : 'General Assessment'}
              </div>
              <div>{item.summaryComment}</div>
            </div>

            {/* Key Strengths & Suggested Improvements */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Strengths */}
              <div className="feedback-strengths-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>{isVi ? 'Điểm mạnh nổi bật' : 'Key Strengths'}</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: 1.5, color: '#14532d' }}>
                  {item.keyStrengths.map((str, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Weakness / Advice */}
              <div className="feedback-weakness-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '8px' }}>
                  <Lightbulb size={16} />
                  <span>{isVi ? 'Gợi ý cần khắc phục' : 'Targeted Improvement'}</span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#78350f' }}>
                  {item.suggestedImprovement}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--outline-variant)' }}>
              <button
                type="button"
                className="std-eco-btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => navigate(`/student/assignments/${item.assignmentId}/result`)}
              >
                <span>{isVi ? 'Xem bài làm & Lời giải chi tiết' : 'Review Full Submission & Corrections'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="std-eco-card" style={{ textAlign: 'center', padding: '48px 20px' }}>
            <AlertCircle size={36} color="var(--on-surface-variant)" style={{ margin: '0 auto 10px auto', display: 'block', opacity: 0.5 }} />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
              {isVi ? 'Không tìm thấy nhận xét nào phù hợp' : 'No feedback entries found'}
            </h4>
            <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              {isVi ? 'Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.' : 'Try adjusting your search query or active filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeedback;
