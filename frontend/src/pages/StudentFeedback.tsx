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
    <div className="container p-24">
      {/* Header */}
      <div className="mb-24">
        <h1 className="flex items-center gap-12 m-0 text-on-surface font-bold mb-8" style={{ fontSize: '28px' }}>
          <MessageSquare size={28} color="var(--primary)" />
          {isVi ? 'Hòm Thư Nhận Xét & Phản Hồi Chữa Bài' : 'Feedback & Detailed Evaluation Inbox'}
        </h1>
        <p className="m-0 text-on-surface-variant" style={{ fontSize: '15px' }}>
          {isVi
            ? 'Tổng hợp lời nhận xét, ghi chú sửa lỗi từng câu từ Giảng viên chuyên môn và Trợ lý AI thông minh.'
            : 'Review pedagogical feedback, rubric evaluation notes, and sentence-level corrections from instructors and AI.'}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex-between items-center bg-white p-12-18 rounded border mb-24">
        <div className="flex items-center gap-8">
          <button
            type="button"
            className={`flex items-center text-nowrap flex-shrink-0 gap-8 font-medium rounded-full cursor-pointer px-14 py-8 transition-all ${activeFilter === 'all' ? 'bg-primary text-white border-none' : 'bg-transparent text-on-surface border'}`}
            onClick={() => setActiveFilter('all')}
            style={{ fontSize: '13px', borderColor: activeFilter === 'all' ? 'transparent' : '#CBD5E1' }}
          >
            {isVi ? 'Tất cả phản hồi' : 'All Reviews'}
            <span className={`flex-center rounded-full ${activeFilter === 'all' ? 'bg-white text-primary' : 'bg-surface-container-high text-on-surface'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>{feedbackList.length}</span>
          </button>

          <button
            type="button"
            className={`flex items-center text-nowrap flex-shrink-0 gap-8 font-medium rounded-full cursor-pointer px-14 py-8 transition-all ${activeFilter === 'teacher' ? 'bg-primary text-white border-none' : 'bg-transparent text-on-surface border'}`}
            onClick={() => setActiveFilter('teacher')}
            style={{ fontSize: '13px', borderColor: activeFilter === 'teacher' ? 'transparent' : '#CBD5E1' }}
          >
            <UserCheck size={14} />
            {isVi ? 'Từ Giảng viên' : 'From Instructors'}
            <span className={`flex-center rounded-full ${activeFilter === 'teacher' ? 'bg-white text-primary' : 'bg-surface-container-high text-on-surface'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>{teacherFeedbackCount}</span>
          </button>

          <button
            type="button"
            className={`flex items-center text-nowrap flex-shrink-0 gap-8 font-medium rounded-full cursor-pointer px-14 py-8 transition-all ${activeFilter === 'ai' ? 'bg-primary text-white border-none' : 'bg-transparent text-on-surface border'}`}
            onClick={() => setActiveFilter('ai')}
            style={{ fontSize: '13px', borderColor: activeFilter === 'ai' ? 'transparent' : '#CBD5E1' }}
          >
            <Sparkles size={14} />
            {isVi ? 'Từ Trợ lý AI' : 'From AI Diagnostic'}
            <span className={`flex-center rounded-full ${activeFilter === 'ai' ? 'bg-white text-primary' : 'bg-surface-container-high text-on-surface'}`} style={{ fontSize: '11px', padding: '2px 6px' }}>{aiFeedbackCount}</span>
          </button>
        </div>

        <div className="flex items-center gap-10">
          {/* Skill Filter Dropdown */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="p-8-16 border rounded bg-white text-on-surface outline-none"
            style={{ fontSize: '13px' }}
          >
            <option value="all">{isVi ? 'Tất cả kỹ năng' : 'All Skills'}</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
          </select>

          {/* Search box */}
          <div className="flex items-center gap-8 bg-surface-container-low border rounded px-12 py-8" style={{ width: '240px' }}>
            <Search size={15} className="text-on-surface-variant flex-shrink-0" />
            <input
              type="text"
              className="bg-transparent border-none outline-none w-full text-on-surface"
              placeholder={isVi ? 'Tìm nhận xét, bài tập...' : 'Search feedback, teacher...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="flex-col gap-20">
        {filtered.map((item) => (
          <div key={item.id} className="card bg-white p-24">
            {/* Header */}
            <div className="flex-between items-start mb-20">
              <div className="flex items-center gap-16">
                <div className={`flex-center rounded-full text-white ${item.reviewerType === 'teacher' ? 'bg-primary' : 'bg-secondary'}`} style={{ width: 44, height: 44 }}>
                  {item.reviewerType === 'teacher' ? (
                    <UserCheck size={22} />
                  ) : (
                    <Sparkles size={22} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-8 flex-wrap mb-4">
                    <span className="font-bold text-on-surface" style={{ fontSize: '15px' }}>
                      {item.reviewerName}
                    </span>
                    <span
                      className="font-bold rounded"
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        backgroundColor: item.reviewerType === 'teacher' ? '#eff6ff' : '#f0fdf4',
                        color: item.reviewerType === 'teacher' ? '#2563eb' : '#16a34a',
                        border: `1px solid ${item.reviewerType === 'teacher' ? '#bfdbfe' : '#bbf7d0'}`
                      }}
                    >
                      {item.reviewerRole}
                    </span>
                  </div>

                  <div className="text-on-surface-variant" style={{ fontSize: '12.5px' }}>
                    {item.className} • <span>{item.date}</span>
                  </div>
                </div>
              </div>

              {/* Band Score & Skill Tag */}
              <div className="flex items-center gap-12">
                <span className="flex items-center gap-6 font-semibold text-uppercase rounded text-on-surface bg-surface-container-low" style={{ fontSize: '11px', padding: '4px 10px' }}>
                  {getSkillIcon(item.skill)}
                  {item.skill}
                </span>

                <span
                  className="flex items-center gap-6 font-bold rounded-full"
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
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
            <div className="mb-20">
              <span className="font-semibold text-uppercase text-on-surface-variant tracking-wide" style={{ fontSize: '12px' }}>
                {isVi ? 'Bài tập được đánh giá:' : 'Evaluated Assignment:'}
              </span>
              <h3 className="font-bold text-primary m-0 mt-4 leading-snug" style={{ fontSize: '15.5px' }}>
                {item.assignmentTitle}
              </h3>
            </div>

            {/* Quote Box: General Evaluation */}
            <div className="rounded-lg p-20 mb-20 bg-primary-fixed border" style={{ borderColor: 'var(--primary-fixed-dim)' }}>
              <div className="font-bold text-uppercase text-primary tracking-wide mb-8" style={{ fontSize: '12px' }}>
                {isVi ? 'Đánh giá tổng quan' : 'General Assessment'}
              </div>
              <div className="leading-relaxed text-on-surface" style={{ fontSize: '14px' }}>{item.summaryComment}</div>
            </div>

            {/* Key Strengths & Suggested Improvements */}
            <div className="grid gap-16 mb-20" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {/* Strengths */}
              <div className="rounded-lg p-20 border bg-white" style={{ borderColor: '#BBF7D0' }}>
                <div className="flex items-center gap-8 font-bold mb-12" style={{ fontSize: '13px', color: '#166534' }}>
                  <CheckCircle2 size={16} />
                  <span>{isVi ? 'Điểm mạnh nổi bật' : 'Key Strengths'}</span>
                </div>
                <ul className="m-0 pl-16 leading-relaxed" style={{ fontSize: '13px', color: '#14532d' }}>
                  {item.keyStrengths.map((str, idx) => (
                    <li key={idx} className="mb-4">{str}</li>
                  ))}
                </ul>
              </div>

              {/* Weakness / Advice */}
              <div className="rounded-lg p-20 border bg-white" style={{ borderColor: '#FDE68A' }}>
                <div className="flex items-center gap-8 font-bold mb-12" style={{ fontSize: '13px', color: '#92400e' }}>
                  <Lightbulb size={16} />
                  <span>{isVi ? 'Gợi ý cần khắc phục' : 'Targeted Improvement'}</span>
                </div>
                <div className="leading-relaxed" style={{ fontSize: '13px', color: '#78350f' }}>
                  {item.suggestedImprovement}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-16 border-t">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/student/assignments/${item.assignmentId}/result`)}
              >
                <span>{isVi ? 'Xem bài làm & Lời giải chi tiết' : 'Review Full Submission & Corrections'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-48">
            <AlertCircle size={36} className="mx-auto mb-16 text-on-surface-variant opacity-50" />
            <h4 className="m-0 font-bold mb-8 text-on-surface" style={{ fontSize: '15px' }}>
              {isVi ? 'Không tìm thấy nhận xét nào phù hợp' : 'No feedback entries found'}
            </h4>
            <p className="m-0 text-on-surface-variant" style={{ fontSize: '13px' }}>
              {isVi ? 'Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.' : 'Try adjusting your search query or active filters.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeedback;
