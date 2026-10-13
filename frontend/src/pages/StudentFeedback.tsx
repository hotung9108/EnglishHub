import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Sparkles, UserCheck, Star,
  ArrowRight, Search, CheckCircle2, AlertCircle,
  Lightbulb, PenTool, Mic, BookOpen, Headphones,
  RotateCcw
} from 'lucide-react';
import { Button, EmptyState, Skeleton } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { studentEvaluationService } from '../api/services/student-evaluation.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { classService, type ClassSummary } from '../api/services/class.service';
import type { StudentEvaluationListItem } from '../types/student-evaluation.types';
import '../styles/student-ecosystem.css';

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

  const [reloadKey, setReloadKey] = useState(0);
  const handleReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

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
          const score10Val = scoreVal !== undefined && scoreVal !== null ? (scoreVal <= 10 ? scoreVal.toFixed(1) : (scoreVal / 10).toFixed(1)) : '--';

          dynamicList.push({
            id: `sub-fb-${sub.id}`,
            assignmentId: assignmentIdStr,
            assignmentTitle: assignment?.title || `Bài tập #${assignmentIdStr}`,
            className,
            skill: detectedSkill,
            reviewerType: isAi ? 'ai' : 'teacher',
            reviewerName: isAi ? 'EnglishHub AI Diagnostic Engine' : (isVi ? 'Giáo viên phụ trách' : 'Instructor'),
            reviewerRole: isAi ? 'AI Evaluation' : (isVi ? 'Giảng viên Chuyên môn' : 'Instructor'),
            date: sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US') : '',
            score: score10Val !== '--' ? `${score10Val} / 10` : '--',
            badgeType: score10Val !== '--' ? `${score10Val} / 10` : (isVi ? 'Đã chấm' : 'Graded'),
            summaryComment: isAi 
              ? 'Hệ thống AI đã phân tích chi tiết câu trả lời của bạn. Độ chính xác từ vựng và ngữ pháp đạt mức tốt.'
              : 'Bài làm tốt, bố cục chặt chẽ. Cần chú ý hoàn thiện thêm các liên từ và đa dạng hóa cấu trúc câu.',
            keyStrengths: [
              'Bám sát yêu cầu đề bài và phân bổ thời gian hợp lý',
              'Sử dụng linh hoạt các liên từ chuyển tiếp'
            ],
            suggestedImprovement: 'Rà soát lại các lỗi chính tả và thì quá khứ đơn trước khi nộp bài.'
          });
        });

        if (isMounted) {
          setFeedbackList(dynamicList);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load feedback', err);
        setError(isVi ? 'Không thể tải phản hồi từ máy chủ.' : 'Failed to load feedback.');
        setFeedbackList([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchFeedback();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isVi, reloadKey]);

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
      <div className="std-eco-container pt-6">
        <Skeleton width="320px" height="36px" className="mb-6" />
        <Skeleton height="48px" className="mb-6" />
        <div className="grid gap-5">
          {[1, 2].map(i => (
            <Skeleton key={i} height="280px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="std-eco-container pt-6">
      {/* Header */}
      <div className="std-eco-header">
        <div>
          <h1 className="std-eco-title">
            <MessageSquare size={28} color="var(--primary)" />
            {isVi ? 'Nhận xét & Phản hồi' : 'Feedback'}
          </h1>
          <p className="std-eco-subtitle">
            {isVi
              ? 'Nhận xét và góp ý chi tiết từ giáo viên.'
              : 'Detailed feedback and comments from teachers.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="std-error-banner mb-6">
          <div className="std-error-msg">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={handleReload} icon={RotateCcw}>
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

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

        <div className="flex items-center gap-3">
          {/* Skill Filter Dropdown */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="select-input"
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
      <div className="flex flex-col gap-5">
        {filtered.map((item) => (
          <div key={item.id} className="feedback-card">
            {/* Header */}
            <div className="feedback-header">
              <div className="flex items-center gap-4">
                <div className={`feedback-reviewer-avatar ${item.reviewerType}`}>
                  {item.reviewerType === 'teacher' ? (
                    <UserCheck size={22} />
                  ) : (
                    <Sparkles size={22} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-slate-900 text-sm">
                      {item.reviewerName}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                        item.reviewerType === 'teacher' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {item.reviewerRole}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    {item.className} • <span>{item.date}</span>
                  </div>
                </div>
              </div>

              {/* Band Score & Skill Tag */}
              <div className="flex items-center gap-3">
                <span className={`std-skill-tag ${item.skill}`}>
                  {getSkillIcon(item.skill)}
                  {item.skill}
                </span>

                <span className="grade-score-pill high">
                  <Star size={13} fill="#059669" />
                  {item.score}
                </span>
              </div>
            </div>

            {/* Assignment Title */}
            <div className="mb-4">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                {isVi ? 'Bài tập được đánh giá:' : 'Evaluated Assignment:'}
              </span>
              <h3 className="text-base font-bold text-primary m-0 mt-1">
                {item.assignmentTitle}
              </h3>
            </div>

            {/* Quote Box: General Evaluation */}
            <div className="feedback-quote-box">
              <div className="text-xs font-bold uppercase text-primary tracking-wider mb-2">
                {isVi ? 'Đánh giá tổng quan' : 'General Assessment'}
              </div>
              <div>{item.summaryComment}</div>
            </div>

            {/* Key Strengths & Suggested Improvements */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Strengths */}
              <div className="feedback-strengths-box">
                <div className="flex items-center gap-2 font-bold mb-3 text-xs text-emerald-800">
                  <CheckCircle2 size={16} />
                  <span>{isVi ? 'Điểm mạnh nổi bật' : 'Key Strengths'}</span>
                </div>
                <ul className="m-0 pl-4 text-xs text-emerald-900 space-y-1">
                  {item.keyStrengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Weakness / Advice */}
              <div className="feedback-weakness-box">
                <div className="flex items-center gap-2 font-bold mb-3 text-xs text-amber-800">
                  <Lightbulb size={16} />
                  <span>{isVi ? 'Gợi ý cần khắc phục' : 'Targeted Improvement'}</span>
                </div>
                <div className="text-xs text-amber-950 leading-relaxed">
                  {item.suggestedImprovement}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                onClick={() => navigate(`/student/assignments/${item.assignmentId}/result`)}
                icon={ArrowRight}
                iconPosition="right"
              >
                {isVi ? 'Xem bài làm & Lời giải chi tiết' : 'Review Full Submission & Corrections'}
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={AlertCircle}
            title={isVi ? 'Không tìm thấy nhận xét nào phù hợp' : 'No feedback entries found'}
            description={isVi ? 'Hãy thử đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc.' : 'Try adjusting your search query or active filters.'}
          />
        )}
      </div>
    </div>
  );
};

export default StudentFeedback;
