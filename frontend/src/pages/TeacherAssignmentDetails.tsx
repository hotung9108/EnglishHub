import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, FileText, 
  RefreshCw, AlertCircle, CheckCircle2, HelpCircle, Lock, Headphones,
  Users, Clock, PenTool, Mic, BookOpen
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import {
  submissionService,
  type SubmissionListItem,
  isSubmissionGraded,
  getSubmissionFinalScore
} from '../api/services/submission.service';
import { moduleService } from '../api/services/module.service';
import { questionService, extractMcqOptions, extractShortAnswerText, type QuestionResponse } from '../api/services/question.service';
import { Button, MetricCard, LoadingState } from '../components/common';

export interface AssignmentModuleData {
  id: number;
  skill: string;
  orderIndex?: number;
  instructions?: string;
  audioUrl?: string;
  questions: QuestionResponse[];
}

interface EnrolledStudentSubmissionRow {
  studentId: number;
  code: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  status: 'submitted' | 'in_progress' | 'missing';
  gradingStatus: 'graded' | 'pending' | 'none';
  submissionId?: number;
  finalScore?: number | null;
}

export const TeacherAssignmentDetails: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { id } = useParams<{ id: string }>();

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  const { user } = useAuth();
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [currentClass, setCurrentClass] = useState<ClassSummary | null>(null);

  const isOwner = useMemo(() => {
    if (!user || user.role !== 'teacher') return false;
    if (currentClass) {
      return currentClass.teacherId ? currentClass.teacherId === user.id : true;
    }
    return true;
  }, [user, currentClass]);

  // Data
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [className, setClassName] = useState<string>('');
  const [closeAtDate, setCloseAtDate] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [skillLabel, setSkillLabel] = useState<string>('Writing Task');
  const [students, setStudents] = useState<EnrolledStudentSubmissionRow[]>([]);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [modulesList, setModulesList] = useState<AssignmentModuleData[]>([]);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(0);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCloseModal = () => {
    if (!assignment || assignment.status !== 'PUBLISHED' || !isOwner) return;
    setShowCloseModal(true);
  };

  const handleConfirmClose = async () => {
    if (!assignment || assignment.status !== 'PUBLISHED' || !isOwner) return;

    setIsClosing(true);
    try {
      const response = await assignmentService.updateAssignmentStatus(assignment.id, 'CLOSED');
      setAssignment((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      setStudents((prev) =>
        prev.map((s) => (s.status === 'in_progress' ? { ...s, status: 'missing' } : s))
      );
      setShowCloseModal(false);
      showToast(response?.message || (isVi ? 'Đã đóng bài tập thành công.' : 'Assignment closed successfully.'));
    } catch (err: unknown) {
      console.error('Failed to close assignment:', err);
      let errorMsg = isVi ? 'Không thể đóng bài tập. Vui lòng thử lại.' : 'Failed to close assignment. Please retry.';
      if (err && typeof err === 'object') {
        const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
        if (apiErr.response?.data?.message) {
          errorMsg = apiErr.response.data.message;
        } else if (apiErr.message) {
          errorMsg = apiErr.message;
        }
      }
      showToast(errorMsg);
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    if (!showCloseModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isClosing) {
        setShowCloseModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCloseModal, isClosing]);

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const fetchData = async () => {

    try {
      const assignmentIdNum = Number(id);

      // 1. Fetch assignment detail, modules list, all classes, and submissions all in parallel
      const [assignRes, modRes, classRes, subRes] = await Promise.allSettled([
        assignmentService.getAssignment(assignmentIdNum),
        moduleService.listModules(assignmentIdNum),
        classService.list({ limit: 100 }),
        submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 })
      ]);

      if (!isMounted) return;

      const assignDetail = assignRes.status === 'fulfilled' ? assignRes.value : null;
      if (assignDetail) setAssignment(assignDetail);

      const classesList = classRes.status === 'fulfilled' ? (classRes.value.data || []) : [];
      const submissionsList: SubmissionListItem[] = subRes.status === 'fulfilled' ? (subRes.value.data || []) : [];

      let rawMods: Array<{ id: number; skill: string; orderIndex?: number }> = [];
      if (modRes.status === 'fulfilled') {
        rawMods = (modRes.value.modules || modRes.value.data || []).map((m) => ({
          id: m.id,
          skill: m.skill,
          orderIndex: m.orderIndex,
        }));
      }

      if (rawMods.length === 0 && assignDetail?.modules && assignDetail.modules.length > 0) {
        rawMods = assignDetail.modules.map((m, idx) => ({
          id: m.id,
          skill: m.skill,
          orderIndex: idx + 1,
        }));
      }

      // 2. Fetch module details and search classes in parallel
      const [detailedMods, classAssignmentsResults] = await Promise.all([
        Promise.all(
          rawMods.map(async (m): Promise<AssignmentModuleData> => {
            const needQuestions = m.skill === 'READING' || m.skill === 'LISTENING';
            const [mDetailRes, qRes] = await Promise.allSettled([
              moduleService.getModule(m.id),
              needQuestions ? questionService.listQuestions(m.id) : Promise.reject('No questions needed')
            ]);
            const inst = mDetailRes.status === 'fulfilled' ? (mDetailRes.value.instructions || '') : '';
            const audio = mDetailRes.status === 'fulfilled' ? (mDetailRes.value.sourceAudioStorageKey || '') : '';
            const modQuestions = qRes.status === 'fulfilled' ? (qRes.value.questions || qRes.value.data || []) : [];
            return {
              id: m.id,
              skill: m.skill,
              orderIndex: m.orderIndex,
              instructions: inst,
              audioUrl: audio,
              questions: modQuestions,
            };
          })
        ),
        Promise.all(
          classesList.map(async (cls) => {
            try {
              const assignList = await assignmentService.listAssignments(cls.id, { limit: 100 });
              const matched = assignList.data?.find((a) => a.id === assignmentIdNum);
              return { cls, matched };
            } catch {
              return { cls, matched: undefined };
            }
          })
        )
      ]);

      if (isMounted) {
        setModulesList(detailedMods);
        if (detailedMods.length > 0) {
          setInstructions(detailedMods[0].instructions || '');
          setSkillLabel(`${detailedMods[0].skill.charAt(0)}${detailedMods[0].skill.slice(1).toLowerCase()} Task`);
          setQuestions(detailedMods[0].questions);
        }
      }

      const foundMatch = classAssignmentsResults.find((r) => r.matched);
      const matchedClass = foundMatch?.cls;
      if (foundMatch?.matched?.closeAt) {
        const d = new Date(foundMatch.matched.closeAt);
        setCloseAtDate(d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }));
      }

      if (isMounted) {
        setCurrentClass(matchedClass || null);
      }
      setClassName(matchedClass ? matchedClass.name : (classesList[0]?.name || 'Lớp tiếng Anh'));

      let classMembers: ClassMember[] = [];
      if (matchedClass) {
        try {
          classMembers = await classService.listMembers(matchedClass.id);
        } catch {
          classMembers = [];
        }
      }

      // 5. Combine class members with submissions
      const bgColors = ['#EAF0E8', '#FEF3C7', '#FCE7F3', '#F3E8FF', '#ECFDF5', '#FAF3E5'];
      const textColors = ['#1B4D3E', '#D97706', '#BE185D', '#7E22CE', '#059669', '#8C5E14'];

      const studentRows: EnrolledStudentSubmissionRow[] = classMembers.map((member, index) => {
        const studentSubs = submissionsList.filter((s) => s.studentId === member.studentId);
        studentSubs.sort((a, b) => {
          const aIsDone = a.status === 'SUBMITTED' || a.status === 'GRADED';
          const bIsDone = b.status === 'SUBMITTED' || b.status === 'GRADED';
          if (aIsDone && !bIsDone) return -1;
          if (!aIsDone && bIsDone) return 1;
          return (b.attemptNumber || b.id) - (a.attemptNumber || a.id);
        });
        const matchedSub = studentSubs[0];

        const nameParts = member.fullName.trim().split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() 
          : (member.fullName.slice(0, 2).toUpperCase() || 'HV');

        const colorIndex = index % bgColors.length;

        let status: 'submitted' | 'in_progress' | 'missing' = 'missing';
        let gradingStatus: 'graded' | 'pending' | 'none' = 'none';
        let finalScore: number | null = null;

        if (matchedSub) {
          if (matchedSub.status === 'IN_PROGRESS') {
            status = assignDetail?.status === 'CLOSED' ? 'missing' : 'in_progress';
            gradingStatus = 'none';
          } else {
            status = 'submitted';
            if (isSubmissionGraded(matchedSub)) {
              gradingStatus = 'graded';
              finalScore = getSubmissionFinalScore(matchedSub);
            } else {
              gradingStatus = 'pending';
            }
          }
        }

        return {
          studentId: member.studentId,
          code: member.studentCode || `HV-${member.studentId.toString().padStart(4, '0')}`,
          name: member.fullName,
          initials,
          avatarBg: bgColors[colorIndex],
          avatarColor: textColors[colorIndex],
          status,
          gradingStatus,
          submissionId: matchedSub?.id,
          finalScore
        };
      });

        if (isMounted) {
          setStudents(studentRows);
        }
      } catch (err) {
        console.error('Failed to load assignment details:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải chi tiết bài tập. Vui lòng thử lại.' : 'Failed to load assignment details. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, isVi, reloadKey]);

  // Dynamic Metrics calculations
  const metrics = useMemo(() => {
    const totalStudents = Math.max(1, students.length);
    const submittedCount = students.filter((s) => s.status === 'submitted').length;
    const inProgressCount = students.filter((s) => s.status === 'in_progress').length;
    const missingCount = students.filter((s) => s.status !== 'submitted').length;
    const gradedCount = students.filter((s) => s.gradingStatus === 'graded').length;
    const pendingCount = students.filter((s) => s.gradingStatus === 'pending').length;

    const scores = students
      .map((s) => s.finalScore)
      .filter((sc): sc is number => sc !== null && sc !== undefined && sc > 0);

    const avgBand = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '0.0';

    const gradedPercentage = submittedCount > 0 
      ? Math.round((gradedCount / submittedCount) * 100) 
      : 0;

    return {
      totalStudents,
      submittedCount,
      inProgressCount,
      missingCount,
      gradedCount,
      pendingCount,
      avgBand,
      gradedPercentage
    };
  }, [students]);

  if (isLoading) {
    return (
      <div className="teacher-container py-6">
        <LoadingState 
          title={isVi ? 'Đang tải chi tiết đề bài...' : 'Loading assignment specifications...'}
          description={isVi ? 'Đang lấy thông tin câu hỏi, tiêu chí chấm và hướng dẫn đề thi.' : 'Loading questions, answer keys, and exam instructions.'}
        />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="teacher-container py-6">
        <div className="adm-alert-error max-w-xl mx-auto my-8">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={24} className="text-danger flex-shrink-0" />
            <h3 className="m-0 text-sm font-bold text-danger">
              {error || (isVi ? 'Không tìm thấy bài tập này.' : 'Assignment not found.')}
            </h3>
          </div>
          <Button 
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={handleRetry}
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="tad-toast">
          <CheckCircle2 size={16} className="text-secondary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unified Hero Header Card */}
      <section className="teacher-page-hero">
        <div className="teacher-hero-content">
          <div>
            <button 
              type="button"
              onClick={() => navigate('/teacher/assignments')}
              className="tad-back-btn"
            >
              <ArrowLeft size={14} />
              <span>{t('assignmentDetails.backToLibrary')}</span>
            </button>

            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="teacher-hero-title">
                {assignment.title}
              </h1>
              <span className={`tcd-status-badge ${assignment.status === 'PUBLISHED' ? 'active' : 'completed'}`}>
                {assignment.status === 'PUBLISHED' 
                  ? t('assignmentDetails.statusOpen') 
                  : assignment.status === 'CLOSED'
                    ? t('assignmentDetails.statusClosed')
                    : assignment.status}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted">
              <span className="font-semibold text-main">
                {t('assignmentDetails.classPrefix')}{className || (isVi ? 'Tất cả các lớp' : 'All Classes')}
              </span>
              <span>•</span>
              <span>{isVi ? 'Hạn nộp:' : 'Deadline:'} <strong className="text-main font-semibold">{closeAtDate || (isVi ? 'Không thời hạn' : 'No deadline')}</strong></span>
              {modulesList.length > 0 && (
                <>
                  <span>•</span>
                  <span className="tad-skill-tag">{skillLabel}</span>
                </>
              )}
            </div>
          </div>

          <div className="teacher-hero-actions">
            <Button 
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => navigate(`/teacher/assignments/${id}/submissions`)}
            >
              {isVi ? 'Quản lý bài nộp' : 'Manage Submissions'}
              {metrics.pendingCount > 0 ? ` (${metrics.pendingCount} ${isVi ? 'chờ chấm' : 'pending'})` : ''}
            </Button>

            {isOwner && (
              <Button 
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => navigate(`/teacher/assignments/${id}/edit`)}
              >
                {t('assignmentDetails.btnEdit')}
              </Button>
            )}

            {isOwner && (
              <Button 
                variant="secondary"
                size="sm"
                icon={Lock}
                disabled={assignment.status !== 'PUBLISHED' || isClosing}
                loading={isClosing}
                onClick={handleOpenCloseModal}
                title={assignment.status === 'CLOSED' ? (isVi ? 'Bài tập này đã đóng' : 'Assignment is already closed') : undefined}
              >
                {t('assignmentDetails.btnClose')}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Top Metric Cards - Specs Overview */}
      <div className="teacher-stats-grid mb-6">
        <MetricCard
          title={isVi ? 'Kỹ năng đánh giá' : 'Target Skill'}
          value={skillLabel.replace(' Task', '')}
          icon={BookOpen}
          iconBgColor="var(--primary-light, #eaf0e8)"
          iconColor="var(--primary, #1b4d3e)"
          className="h-full"
        />
        <MetricCard
          title={isVi ? 'Số câu hỏi / Phần thi' : 'Questions & Parts'}
          value={questions.length > 0 ? `${questions.length} ${isVi ? 'câu hỏi' : 'questions'}` : (modulesList.length > 1 ? `${modulesList.length} ${isVi ? 'phần thi' : 'modules'}` : (isVi ? '1 bài tự luận' : '1 essay task'))}
          icon={FileText}
          iconBgColor="var(--secondary-container, #e7f3ec)"
          iconColor="var(--secondary, #16a34a)"
          className="h-full"
        />
        <MetricCard
          title={isVi ? 'Thời hạn nộp bài' : 'Deadline'}
          value={closeAtDate ? closeAtDate.split(' ')[0] || closeAtDate : (isVi ? 'Không thời hạn' : 'No deadline')}
          suffix={closeAtDate && closeAtDate.includes(' ') ? ` ${closeAtDate.split(' ')[1]}` : ''}
          icon={Clock}
          iconBgColor="var(--tertiary-container, #fbf4e6)"
          iconColor="var(--tertiary, #8c5e14)"
          className="h-full"
        />
        <MetricCard
          title={isVi ? 'Tiến độ nộp bài' : 'Turnout'}
          value={`${metrics.submittedCount}/${metrics.totalStudents}`}
          suffix={metrics.pendingCount > 0 ? ` (${metrics.pendingCount} ${isVi ? 'chờ chấm' : 'pending'})` : ''}
          icon={Users}
          iconBgColor="#f3eefa"
          iconColor="#5b21b6"
          className="h-full cursor-pointer"
          onClick={() => navigate(`/teacher/assignments/${id}/submissions`)}
        />
      </div>

      {/* Multi-skill Module Tabs Switcher */}
      {modulesList.length > 1 && (
        <div className="teacher-filter-bar mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {isVi ? 'Kỹ năng bài tập:' : 'Assignment Skills:'}
            </span>
            <div className="teacher-pills">
              {modulesList.map((m, idx) => {
                const isSelected = selectedModuleIndex === idx;
                const skillNormalized = m.skill.toLowerCase();
                return (
                  <button
                    key={m.id || idx}
                    type="button"
                    onClick={() => setSelectedModuleIndex(idx)}
                    className={`teacher-pill ${isSelected ? 'active' : ''}`}
                  >
                    {skillNormalized === 'writing' && <PenTool size={13} />}
                    {skillNormalized === 'speaking' && <Mic size={13} />}
                    {skillNormalized === 'reading' && <BookOpen size={13} />}
                    {skillNormalized === 'listening' && <Headphones size={13} />}
                    <span>{m.skill === 'WRITING' ? 'Writing' : m.skill === 'SPEAKING' ? 'Speaking' : m.skill === 'READING' ? 'Reading' : 'Listening'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Listening Audio Player if available */}
      {(() => {
        const activeMod = modulesList[selectedModuleIndex] || modulesList[0] || null;
        if (!activeMod?.audioUrl) return null;
        return (
          <div className="eh-card p-5 mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-2 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                <Headphones size={18} />
              </div>
              <div>
                <h3 className="m-0 text-sm font-bold text-main">{isVi ? 'Tệp âm thanh bài nghe' : 'Listening Audio'}</h3>
                <span className="text-xs text-muted">{isVi ? 'Audio chuẩn phục vụ phần kiểm tra kỹ năng nghe' : 'Audio file for listening assessment'}</span>
              </div>
            </div>
            <audio controls className="w-full mt-1" src={activeMod.audioUrl}>
              {isVi ? 'Trình duyệt không hỗ trợ phát âm thanh.' : 'Your browser does not support audio playback.'}
            </audio>
          </div>
        );
      })()}

      {/* Prompt & Rubrics Box */}
      {(() => {
        const activeMod = modulesList[selectedModuleIndex] || modulesList[0] || null;
        const activeInst = activeMod?.instructions ?? instructions;
        if (!activeInst) return null;

        const minWordsMatch = activeInst.match(/<!--\s*minWords:\s*(\d+)\s*-->/i);
        const minWords = minWordsMatch ? Number(minWordsMatch[1]) : null;
        const imgMatch = activeInst.match(/!\[(?:Diagram|Chart|Biểu đồ)?\]\((https?:\/\/[^\s)]+|data:image\/[^)]+)\)/i);
        const diagramUrl = imgMatch ? imgMatch[1] : null;
        const cleanInst = activeInst
          .replace(/<!--\s*minWords:\s*\d+\s*-->/gi, '')
          .replace(/!\[(?:Diagram|Chart|Biểu đồ)?\]\((https?:\/\/[^\s)]+|data:image\/[^)]+)\)/gi, '')
          .trim();

        return (
          <div className="eh-card p-6 mb-6">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <h2 className="flex items-center gap-2.5 m-0 text-base font-bold text-main">
                <div className="p-1.5 rounded-md bg-primary-container text-primary flex items-center justify-center">
                  <FileText size={18} />
                </div>
                <span>{t('assignmentDetails.promptTitle')}</span>
              </h2>
              {minWords && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  {isVi ? `Yêu cầu tối thiểu: ${minWords} từ` : `Min words: ${minWords}`}
                </span>
              )}
            </div>

            {diagramUrl && (
              <div className="mb-4 p-3 bg-white rounded-xl border border-border/50 max-w-xl">
                <img 
                  src={diagramUrl} 
                  alt="Task 1 Diagram Preview" 
                  className="w-full max-h-80 object-contain rounded-lg"
                />
              </div>
            )}

            <div className="text-main/90 text-sm leading-relaxed whitespace-pre-line font-normal bg-surface-variant/40 p-4 rounded-xl border border-border/50 max-h-96 overflow-y-auto">
              {cleanInst || activeInst}
            </div>
          </div>
        );
      })()}

      {/* Assignment Questions Preview Section */}
      {(() => {
        const activeMod = modulesList[selectedModuleIndex] || modulesList[0] || null;
        const isQuiz = activeMod 
          ? (activeMod.skill === 'READING' || activeMod.skill === 'LISTENING')
          : (questions.length > 0 || skillLabel.toLowerCase().includes('reading') || skillLabel.toLowerCase().includes('listening'));
        if (!isQuiz) return null;

        const currentQuestionsList = activeMod?.questions ?? questions;

        return (
          <div className="eh-card p-6 mb-6">
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h2 className="m-0 text-base font-bold text-main flex items-center gap-2">
                    {isVi ? 'Danh sách câu hỏi đề bài' : 'Assignment Questions'}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-variant text-muted">
                      {currentQuestionsList.length} {isVi ? 'câu' : 'questions'}
                    </span>
                  </h2>
                  <span className="text-xs text-muted">
                    {isVi ? 'Bộ câu hỏi trắc nghiệm / tự luận học sinh phải hoàn thành' : 'Configured questions students must complete'}
                  </span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => navigate(`/teacher/assignments/${id}/edit`)}
              >
                {isVi ? 'Chỉnh sửa bộ câu hỏi' : 'Edit Questions'}
              </Button>
            </div>

            {currentQuestionsList.length === 0 ? (
              <div className="p-8 text-center bg-surface-variant/40 border border-dashed border-border rounded-xl">
                <AlertCircle size={32} className="text-muted m-auto mb-2" />
                <p className="m-0 mb-1 text-sm font-semibold text-main">
                  {isVi ? 'Chưa có câu hỏi nào trong bài tập này' : 'No questions created yet'}
                </p>
                <span className="text-xs text-muted">
                  {isVi ? 'Vui lòng nhấn Chỉnh sửa để thêm câu hỏi trắc nghiệm hoặc tự luận.' : 'Please edit the assignment to add questions.'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {currentQuestionsList.map((q, idx) => {
                  const isMcq = q.questionType === 'MULTIPLE_CHOICE';
                  const mcq = isMcq ? extractMcqOptions(q.correctAnswer) : null;
                  const shortAns = !isMcq ? extractShortAnswerText(q.correctAnswer) : '';

                  return (
                    <div key={q.id || idx} className="tad-question-item">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="tad-q-badge-num">
                            {q.orderIndex || idx + 1}
                          </span>
                          <span className={`tad-q-badge-type ${isMcq ? 'mcq' : 'short-ans'}`}>
                            {isMcq ? (isVi ? 'Trắc nghiệm' : 'Multiple Choice') : (isVi ? 'Điền từ / Tự luận' : 'Short Answer')}
                          </span>
                        </div>
                        <span className="text-xs text-muted font-medium">
                          {q.score || 1} {isVi ? 'điểm' : 'pts'}
                        </span>
                      </div>

                      <p className="m-0 mb-3 text-sm font-semibold text-main leading-relaxed">
                        {q.content}
                      </p>

                      {isMcq && mcq && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {mcq.options.map((optText, optIdx) => {
                            const optLetter = String.fromCharCode(65 + optIdx);
                            const isCorrect = optIdx === mcq.correctOptionIndex;
                            return (
                              <div
                                key={optIdx}
                                className={`tad-opt-item ${isCorrect ? 'correct' : ''}`}
                              >
                                <span className={`tad-opt-letter ${isCorrect ? 'correct' : ''}`}>
                                  {optLetter}
                                </span>
                                <span className="flex-1">{optText}</span>
                                {isCorrect && (
                                  <span className="text-xs font-bold text-success inline-flex items-center gap-1">
                                    <CheckCircle2 size={13} />
                                    <span>{isVi ? 'Đáp án đúng' : 'Correct'}</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!isMcq && (
                        <div className="p-3 bg-surface-variant/60 rounded-lg text-xs text-main border border-border/50">
                          <strong className="text-main">{isVi ? 'Đáp án chuẩn:' : 'Correct answer:'} </strong>
                          <span className="text-success font-semibold">{shortAns || (isVi ? '(Chưa cấu hình)' : '(Not configured)')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Quick Grading Access Banner */}
      <div className="eh-card p-6 mb-6 flex items-center justify-between flex-wrap gap-4 border border-outline-variant bg-surface-container-low">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h3 className="m-0 text-sm font-bold text-main font-serif">
              {isVi ? 'Quản lý bài nộp & Chấm điểm học viên' : 'Student Submissions & Grading'}
            </h3>
            <p className="m-0 text-xs text-muted mt-1">
              {isVi 
                ? `Lớp hiện có ${metrics.submittedCount}/${metrics.totalStudents} học sinh đã nộp bài (${metrics.pendingCount} bài đang chờ chấm điểm).` 
                : `${metrics.submittedCount}/${metrics.totalStudents} students submitted (${metrics.pendingCount} pending grading).`}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={CheckCircle2}
          onClick={() => navigate(`/teacher/assignments/${id}/submissions`)}
        >
          {isVi ? 'Mở trang Quản lý chấm & Bảng điểm' : 'Open Grading Hub'}
        </Button>
      </div>

      {/* Confirmation Modal for Closing Assignment */}
      {showCloseModal && (
        <div 
          className="tad-modal-overlay" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="close-modal-title"
          onClick={() => !isClosing && setShowCloseModal(false)}
        >
          <div 
            className="tad-modal-box" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="close-modal-title" className="tad-modal-title">
              {isVi ? 'Đóng bài tập' : 'Close Assignment'}
            </h3>
            <p className="tad-modal-description">
              {isVi 
                ? 'Bạn có chắc chắn muốn đóng bài tập này không? Học viên sẽ không thể nộp bài sau khi đóng.'
                : 'Are you sure you want to close this assignment? Students will not be able to submit after closing.'}
            </p>
            <div className="tad-modal-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isClosing}
                onClick={() => setShowCloseModal(false)}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                loading={isClosing}
                disabled={isClosing}
                onClick={handleConfirmClose}
              >
                {isVi ? 'Đóng bài tập' : 'Close Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignmentDetails;
