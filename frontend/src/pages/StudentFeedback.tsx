import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, UserCheck, Star,
  ArrowRight, Search, AlertCircle,
  PenTool, Mic, BookOpen, Headphones,
  RotateCcw, GraduationCap
} from 'lucide-react';
import { Button, EmptyState, Skeleton, Pagination, MarkdownView } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { studentEvaluationService } from '../api/services/student-evaluation.service';
import { submissionService, type SubmissionListItem, isSubmissionGraded } from '../api/services/submission.service';
import { assignmentService, type AssignmentSummary } from '../api/services/assignment.service';
import { classService, type ClassSummary } from '../api/services/class.service';
import type { StudentEvaluationListItem } from '../types/student-evaluation.types';
import '../styles/student-ecosystem.css';

interface FeedbackEntry {
  id: string;
  type: 'evaluation' | 'submission';
  targetTitle: string;
  className: string;
  skill?: 'writing' | 'speaking' | 'reading' | 'listening';
  reviewerType: 'teacher' | 'ai';
  reviewerName: string;
  reviewerRole: string;
  date: string;
  score?: string;
  badgeType: string;
  content: string;
  actionUrl: string;
  actionLabel: string;
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const handleActiveFilterChange = (filter: 'all' | 'teacher' | 'ai') => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSkillFilterChange = (skill: string) => {
    setSkillFilter(skill);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const [reloadKey, setReloadKey] = useState(0);
  const handleReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const fetchFeedback = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch Teacher Evaluations, Submissions, Classes in parallel
        const [evalsRes, submissionsRes, classesRes] = await Promise.allSettled([
          user?.id ? studentEvaluationService.list(Number(user.id)) : Promise.reject('No user'),
          submissionService.listSubmissions({ studentId: user?.id, limit: 50 }),
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

        const classMap = new Map<number, string>();
        classes.forEach(c => classMap.set(c.id, c.name));

        // 2. Fetch assignments for each class to map assignmentId -> Assignment & Class
        const assignmentMap = new Map<string, AssignmentSummary>();
        const assignmentClassMap = new Map<string, string>();

        await Promise.all(
          classes.map(async (c) => {
            try {
              const res = await assignmentService.listAssignments(c.id);
              const asgs = res.data || [];
              asgs.forEach(a => {
                assignmentMap.set(String(a.id), a);
                assignmentClassMap.set(String(a.id), c.name);
              });
            } catch {
              // Non-critical
            }
          })
        );

        const dynamicList: FeedbackEntry[] = [];

        // 3. Process Teacher Evaluations (StudentEvaluation schema: id, classId, teacherName, content, createdAt)
        evals.forEach((ev) => {
          const className = classMap.get(ev.classId) || (isVi ? `Lớp học #${ev.classId}` : `Class #${ev.classId}`);
          const formattedDate = ev.createdAt
            ? new Date(ev.createdAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '';

          dynamicList.push({
            id: `eval-${ev.id}`,
            type: 'evaluation',
            targetTitle: isVi ? `Đánh giá rèn luyện học tập - ${className}` : `Academic & Progress Evaluation - ${className}`,
            className,
            reviewerType: 'teacher',
            reviewerName: ev.teacherName || (isVi ? 'Giảng viên phụ trách lớp' : 'Course Instructor'),
            reviewerRole: isVi ? 'Đánh giá định kỳ lớp học' : 'Class Evaluation',
            date: formattedDate,
            badgeType: isVi ? 'Nhận xét lớp học' : 'Class Review',
            content: ev.content,
            actionUrl: `/student/classes/${ev.classId}`,
            actionLabel: isVi ? 'Xem thông tin lớp học' : 'View Class Details'
          });
        });

        // 4. Process Graded Submissions (Fetch detail to get real finalFeedback & aiFeedback)
        const gradedSubmissions = submissions
          .filter(sub => isSubmissionGraded(sub))
          .slice(0, 20);

        const submissionDetails = await Promise.allSettled(
          gradedSubmissions.map(sub => submissionService.getSubmission(sub.id))
        );

        submissionDetails.forEach((res) => {
          if (res.status !== 'fulfilled' || !res.value) return;
          const subDetail = res.value;
          const assignmentIdStr = String(subDetail.assignmentId);
          const assignment = assignmentMap.get(assignmentIdStr);
          const className = assignmentClassMap.get(assignmentIdStr) || (classes.length > 0 ? classes[0].name : (isVi ? 'Lớp học' : 'Class'));
          const assignmentTitle = assignment?.title || (isVi ? `Bài tập #${assignmentIdStr}` : `Assignment #${assignmentIdStr}`);
          const formattedDate = subDetail.submittedAt
            ? new Date(subDetail.submittedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })
            : '';

          subDetail.modules?.forEach((mod) => {
            const grading = mod.grading;
            if (!grading) return;

            const rawSkill = mod.skill?.toLowerCase();
            const skill: 'writing' | 'speaking' | 'reading' | 'listening' =
              rawSkill === 'speaking' || rawSkill === 'reading' || rawSkill === 'listening' ? rawSkill : 'writing';

            const scoreVal = grading.finalScore;
            const maxVal = grading.maxScoreSnapshot;
            const scoreStr = scoreVal !== null && scoreVal !== undefined
              ? (maxVal ? `${scoreVal} / ${maxVal}` : `${scoreVal} / 10`)
              : undefined;

            // Real teacher feedback
            if (grading.finalFeedback && grading.finalFeedback.trim()) {
              dynamicList.push({
                id: `sub-${subDetail.id}-mod-${mod.id}-teacher`,
                type: 'submission',
                targetTitle: assignmentTitle,
                className,
                skill,
                reviewerType: 'teacher',
                reviewerName: isVi ? 'Giáo viên chấm bài' : 'Instructor',
                reviewerRole: isVi ? 'Nhận xét bài nộp' : 'Submission Feedback',
                date: formattedDate,
                score: scoreStr,
                badgeType: isVi ? 'Nhận xét bài nộp' : 'Submission Review',
                content: grading.finalFeedback.trim(),
                actionUrl: `/student/submissions/${subDetail.id}`,
                actionLabel: isVi ? 'Xem bài làm & Lời giải' : 'Review Submission'
              });
            }

            // Real AI feedback
            if (grading.aiFeedback && grading.aiFeedback.trim()) {
              dynamicList.push({
                id: `sub-${subDetail.id}-mod-${mod.id}-ai`,
                type: 'submission',
                targetTitle: assignmentTitle,
                className,
                skill,
                reviewerType: 'ai',
                reviewerName: 'EnglishHub AI Diagnostic Engine',
                reviewerRole: isVi ? 'Đánh giá tự động AI' : 'AI Diagnostic',
                date: formattedDate,
                score: scoreStr,
                badgeType: isVi ? 'Đánh giá AI' : 'AI Evaluation',
                content: grading.aiFeedback.trim(),
                actionUrl: `/student/submissions/${subDetail.id}`,
                actionLabel: isVi ? 'Xem bài làm & Lời giải' : 'Review Submission'
              });
            }

            // If neither feedback text is present, but module has score / completed status
            if (!grading.finalFeedback?.trim() && !grading.aiFeedback?.trim() && scoreStr) {
              const isAuto = grading.method === 'AUTO';
              dynamicList.push({
                id: `sub-${subDetail.id}-mod-${mod.id}-graded`,
                type: 'submission',
                targetTitle: assignmentTitle,
                className,
                skill,
                reviewerType: isAuto ? 'ai' : 'teacher',
                reviewerName: isAuto ? 'Hệ thống tự động' : (isVi ? 'Giáo viên phụ trách' : 'Instructor'),
                reviewerRole: isVi ? 'Kết quả chấm điểm' : 'Grading Result',
                date: formattedDate,
                score: scoreStr,
                badgeType: isVi ? 'Đã chấm điểm' : 'Graded',
                content: isVi 
                  ? 'Bài làm đã được chấm điểm hoàn tất. Bạn có thể mở bài nộp để xem chi tiết điểm số và đáp án.' 
                  : 'Grading is complete for this submission. You can open the submission to review scores and answers.',
                actionUrl: `/student/submissions/${subDetail.id}`,
                actionLabel: isVi ? 'Xem bài làm & Lời giải' : 'Review Submission'
              });
            }
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

  const filtered = useMemo(() => {
    return feedbackList.filter(item => {
      if (activeFilter === 'teacher' && item.reviewerType !== 'teacher') return false;
      if (activeFilter === 'ai' && item.reviewerType !== 'ai') return false;
      if (skillFilter !== 'all' && item.skill !== skillFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.targetTitle.toLowerCase().includes(q) ||
          item.reviewerName.toLowerCase().includes(q) ||
          item.className.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [feedbackList, activeFilter, skillFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedFeedback = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  const getSkillIcon = (skill?: string) => {
    switch (skill) {
      case 'writing': return <PenTool size={14} />;
      case 'speaking': return <Mic size={14} />;
      case 'reading': return <BookOpen size={14} />;
      case 'listening': return <Headphones size={14} />;
      default: return <GraduationCap size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="std-eco-container pt-6">
        <Skeleton width="320px" height="36px" className="mb-6" />
        <Skeleton height="48px" className="mb-6" />
        <div className="grid gap-5">
          {[1, 2].map(i => (
            <Skeleton key={i} height="240px" />
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
            {isVi ? 'Nhận xét & Phản hồi' : 'Feedback'}
          </h1>
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
            onClick={() => handleActiveFilterChange('all')}
          >
            {isVi ? 'Tất cả phản hồi' : 'All Reviews'}
            <span className="std-eco-pill-badge">{feedbackList.length}</span>
          </button>

          <button
            type="button"
            className={`std-eco-pill ${activeFilter === 'teacher' ? 'active' : ''}`}
            onClick={() => handleActiveFilterChange('teacher')}
          >
            <UserCheck size={14} />
            {isVi ? 'Từ Giảng viên' : 'From Instructors'}
            <span className="std-eco-pill-badge">{teacherFeedbackCount}</span>
          </button>

          <button
            type="button"
            className={`std-eco-pill ${activeFilter === 'ai' ? 'active' : ''}`}
            onClick={() => handleActiveFilterChange('ai')}
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
            onChange={(e) => handleSkillFilterChange(e.target.value)}
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
              placeholder={isVi ? 'Tìm nhận xét, lớp, bài tập...' : 'Search feedback, teacher...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="flex flex-col gap-5">
        {paginatedFeedback.map((item) => (
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
                    {item.className} {item.date ? `• ${item.date}` : ''}
                  </div>
                </div>
              </div>

              {/* Band Score & Skill Tag */}
              <div className="flex items-center gap-3">
                {item.skill && (
                  <span className={`std-skill-tag ${item.skill}`}>
                    {getSkillIcon(item.skill)}
                    {item.skill.charAt(0).toUpperCase() + item.skill.slice(1)}
                  </span>
                )}

                {item.score && (
                  <span className="grade-score-pill high">
                    <Star size={13} fill="#059669" />
                    {item.score}
                  </span>
                )}
              </div>
            </div>

            {/* Target Title */}
            <div className="mb-2">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
                {item.type === 'submission' 
                  ? (isVi ? 'Bài tập được đánh giá:' : 'Evaluated Assignment:') 
                  : (isVi ? 'Đánh giá học tập lớp:' : 'Class Evaluation:')}
              </span>
              <h3 className="text-base font-bold text-primary m-0 mt-1">
                {item.targetTitle}
              </h3>
            </div>

            {/* Quote Box: General Evaluation */}
            <div className="feedback-quote-box">
              <div className="text-xs font-bold uppercase text-primary tracking-wider mb-2">
                {item.reviewerType === 'ai'
                  ? (isVi ? 'Nhận xét từ hệ thống AI' : 'AI Diagnostic Feedback')
                  : (isVi ? 'Nhận xét của giảng viên' : 'Instructor Feedback')}
              </div>
              <div className="text-slate-700 leading-relaxed text-sm">
                <MarkdownView content={item.content} />
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                onClick={() => navigate(item.actionUrl)}
                icon={ArrowRight}
                iconPosition="right"
              >
                {item.actionLabel}
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <EmptyState
            icon={AlertCircle}
            title={isVi ? 'Không tìm thấy nhận xét nào phù hợp' : 'No feedback entries found'}
            description={isVi ? 'Hiện chưa có nhận xét nào hoặc hãy thử đổi từ khóa tìm kiếm.' : 'No feedback entries available or try adjusting your search.'}
          />
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20]}
            itemLabel={isVi ? 'nhận xét' : 'feedback'}
            isVi={isVi}
            variant="standalone"
          />
        )}
      </div>
    </div>
  );
};

export default StudentFeedback;

