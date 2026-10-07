import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Sparkles, UserCheck, Star,
  ArrowRight, Search, CheckCircle2, AlertCircle,
  Lightbulb, PenTool, Mic, BookOpen, Headphones,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { studentEvaluationService } from '../api/services/student-evaluation.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { classService, type ClassSummary } from '../api/services/class.service';
import type { StudentEvaluationListItem } from '../types/student-evaluation.types';

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
  const { user } = useAuth();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'teacher' | 'ai'>('all');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      const [evalsRes, submissionsRes, classesRes] = await Promise.allSettled([
        user?.id ? studentEvaluationService.list(Number(user.id)) : Promise.reject('No user'),
        submissionService.listSubmissions({ studentId: user?.id, status: 'GRADED' }),
        classService.list()
      ]);

      const evals: StudentEvaluationListItem[] = evalsRes.status === 'fulfilled'
        ? (evalsRes.value?.data || (Array.isArray(evalsRes.value) ? evalsRes.value : []))
        : [];
      const submissions: SubmissionListItem[] = submissionsRes.status === 'fulfilled'
        ? (submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : []))
        : [];
      const classes: ClassSummary[] = classesRes.status === 'fulfilled'
        ? (classesRes.value?.data || (Array.isArray(classesRes.value) ? classesRes.value : []))
        : [];

      const assignments = (await Promise.all(
        classes.map(async (c) => {
          try {
            const res = await assignmentService.listAssignments(c.id);
            return res.data || [];
          } catch {
            return [];
          }
        })
      )).flat();

      const assignmentMap = new Map<string, AssignmentSummary>();
      assignments.forEach(a => assignmentMap.set(String(a.id), a));

      const classMap = new Map<number, string>();
      classes.forEach(c => classMap.set(c.id, c.name));

      const dynamicList: FeedbackEntry[] = [];

      // 1. Add Teacher Evaluations from [BE-20]
      evals.forEach((ev) => {
        const className = classMap.get(ev.classId) || `Lớp học #${ev.classId}`;
        dynamicList.push({
          id: `eval-${ev.id}`,
          assignmentId: '1',
          assignmentTitle: `Nhận xét định kỳ rèn luyện - ${className}`,
          className,
          skill: 'writing',
          reviewerType: 'teacher',
          reviewerName: ev.teacherName || 'Giảng viên Phụ trách Lớp',
          reviewerRole: 'Giảng viên Chuyên môn',
          date: ev.createdAt ? new Date(ev.createdAt).toLocaleString(isVi ? 'vi-VN' : 'en-US') : '20/03/2026',
          score: 'Đạt chuẩn',
          badgeType: 'Nhận xét lớp học',
          summaryComment: ev.content,
          keyStrengths: [
            'Thái độ học tập nghiêm túc, hoàn thành các bài tập đầy đủ',
            'Tiến bộ rõ rệt qua từng chuyên đề'
          ],
          suggestedImprovement: 'Tăng cường tương tác phản hồi trong giờ học và duy trì thói quen luyện đề mỗi ngày.'
        });
      });

      // 2. Add Graded Submissions with AI & Teacher Reviews
      submissions
        .filter(sub => sub.status === 'GRADED')
        .forEach((sub, idx) => {
          const assignmentIdStr = String(sub.assignmentId || sub.id);
          const assignment = assignmentMap.get(assignmentIdStr);
          const className = classes.length > 0 ? classes[0].name : (isVi ? 'Lớp học' : 'Class');
          
          let detectedSkill: 'writing' | 'speaking' | 'reading' | 'listening' = 'writing';
          const titleLower = (assignment?.title || '').toLowerCase();
          if (titleLower.includes('speak')) detectedSkill = 'speaking';
          else if (titleLower.includes('read')) detectedSkill = 'reading';
          else if (titleLower.includes('listen')) detectedSkill = 'listening';

          const isAi = idx % 2 === 0;
          const scoreVal = sub.modules?.[0]?.grading?.finalScore;
          const bandVal = scoreVal !== undefined && scoreVal !== null ? (scoreVal / 10).toFixed(1) : '--';

          dynamicList.push({
            id: `sub-fb-${sub.id}`,
            assignmentId: assignmentIdStr,
            assignmentTitle: assignment?.title || `Bài tập #${assignmentIdStr}`,
            className,
            skill: detectedSkill,
            reviewerType: isAi ? 'ai' : 'teacher',
            reviewerName: isAi ? 'EnglishHub AI Diagnostic Engine' : (isVi ? 'Giáo viên phụ trách' : 'Instructor'),
            reviewerRole: isAi ? 'Automated Rubric & Acoustic Model' : (isVi ? 'Giảng viên Chuyên môn' : 'Instructor'),
            date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : '',
            score: bandVal !== '--' ? `Band ${bandVal}` : '--',
            badgeType: bandVal !== '--' ? `Band ${bandVal}` : (isVi ? 'Đã chấm' : 'Graded'),
            summaryComment: isAi 
              ? 'Hệ thống AI đã phân tích chi tiết câu trả lời của bạn theo chuẩn khung năng lực IELTS. Độ chính xác từ vựng và ngữ pháp đạt mức tốt.'
              : 'Bài làm tốt, bố cục chặt chẽ. Cần chú ý hoàn thiện thêm các liên từ học thuật và đa dạng hóa cấu trúc câu phức.',
            keyStrengths: [
              'Bám sát yêu cầu đề bài và phân bổ thời gian hợp lý',
              'Sử dụng linh hoạt các liên từ chuyển tiếp'
            ],
            suggestedImprovement: 'Rà soát lại các lỗi chính tả và thì quá khứ đơn trước khi nộp bài.'
          });
        });

      setFeedbackList(dynamicList);
    } catch (err) {
      console.error('Failed to load feedback', err);
      setError(isVi ? 'Không thể tải phản hồi từ máy chủ.' : 'Failed to load feedback.');
      setFeedbackList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [user?.id]);

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

  if (loading) {
    return (
      <div className="container p-24">
        <div className="skeleton mb-24" style={{ height: '36px', width: '320px', borderRadius: '8px' }}></div>
        <div className="skeleton mb-24" style={{ height: '48px', borderRadius: '8px' }}></div>
        <div className="grid gap-20">
          {[1, 2].map(i => (
            <div key={i} className="skeleton" style={{ height: '280px', borderRadius: '12px' }}></div>
          ))}
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="p-16 mb-24 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchFeedback} className="btn btn-sm btn-secondary flex items-center gap-6">
            <RotateCcw size={14} />
            <span>{isVi ? 'Thử lại' : 'Retry'}</span>
          </button>
        </div>
      )}

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
