import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit2, FileText, Search, Bell, 
  RefreshCw, AlertCircle, CheckCircle2, HelpCircle, Lock, Headphones
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService, type ClassSummary, type ClassMember } from '../api/services/class.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, type SubmissionModuleSummary } from '../api/services/submission.service';
import { moduleService } from '../api/services/module.service';
import { questionService, extractMcqOptions, extractShortAnswerText, type QuestionResponse } from '../api/services/question.service';
import { Button, EmptyState, Pagination } from '../components/common';

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
  email: string;
  initials: string;
  avatarBg: string;
  avatarColor: string;
  status: 'submitted' | 'missing';
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

  // Filter tabs
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'missing'>('all');
  const [subTab, setSubTab] = useState<'all' | 'graded' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleActiveTabChange = (tab: 'all' | 'submitted' | 'missing') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSubTabChange = (sub: 'all' | 'graded' | 'pending') => {
    setSubTab(sub);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCloseAssignment = async () => {
    if (!assignment) return;
    const confirmMsg = isVi 
      ? 'Bạn có chắc chắn muốn đóng bài tập này không? Học viên sẽ không thể nộp bài sau khi đóng.'
      : 'Are you sure you want to close this assignment? Students will not be able to submit after closing.';
    if (!window.confirm(confirmMsg)) return;

    setIsClosing(true);
    try {
      await assignmentService.updateAssignmentStatus(assignment.id, 'CLOSED');
      setAssignment((prev) => (prev ? { ...prev, status: 'CLOSED' } : null));
      showToast(isVi ? 'Đã đóng bài tập thành công.' : 'Assignment closed successfully.');
    } catch (err) {
      console.error('Failed to close assignment:', err);
      showToast(isVi ? 'Không thể đóng bài tập. Vui lòng thử lại.' : 'Failed to close assignment. Please retry.');
    } finally {
      setIsClosing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (!id) return;

    const fetchData = async () => {

    try {
      const assignmentIdNum = Number(id);

      // 1. Fetch assignment detail
      const assignDetail = await assignmentService.getAssignment(assignmentIdNum);
      setAssignment(assignDetail);

      // 2. Fetch all modules for instructions, skill & questions
      let rawMods: Array<{ id: number; skill: string; orderIndex?: number }> = [];
      try {
        const modRes = await moduleService.listModules(assignmentIdNum);
        rawMods = (modRes.modules || modRes.data || []).map((m) => ({
          id: m.id,
          skill: m.skill,
          orderIndex: m.orderIndex,
        }));
      } catch {
        rawMods = [];
      }

      if (rawMods.length === 0 && assignDetail.modules && assignDetail.modules.length > 0) {
        rawMods = assignDetail.modules.map((m, idx) => ({
          id: m.id,
          skill: m.skill,
          orderIndex: idx + 1,
        }));
      }

      const detailedMods: AssignmentModuleData[] = [];
      for (const m of rawMods) {
        let inst = '';
        let audio = '';
        try {
          const modDetail = await moduleService.getModule(m.id);
          inst = modDetail.instructions || '';
          audio = modDetail.sourceAudioStorageKey || '';
        } catch {
          // ignore
        }

        let modQuestions: QuestionResponse[] = [];
        if (m.skill === 'READING' || m.skill === 'LISTENING') {
          try {
            const qRes = await questionService.listQuestions(m.id);
            modQuestions = qRes.questions || qRes.data || [];
          } catch {
            modQuestions = [];
          }
        }

        detailedMods.push({
          id: m.id,
          skill: m.skill,
          orderIndex: m.orderIndex,
          instructions: inst,
          audioUrl: audio,
          questions: modQuestions,
        });
      }

      if (isMounted) {
        setModulesList(detailedMods);
        if (detailedMods.length > 0) {
          setInstructions(detailedMods[0].instructions || '');
          setSkillLabel(`${detailedMods[0].skill.charAt(0)}${detailedMods[0].skill.slice(1).toLowerCase()} Task`);
          setQuestions(detailedMods[0].questions);
        }
      }

      // 3. Find class & members
      const classRes = await classService.list({ limit: 100 });
      const classesList = classRes.data || [];

      let matchedClass: ClassSummary | undefined = undefined;
      for (const cls of classesList) {
        try {
          const assignList = await assignmentService.listAssignments(cls.id, { limit: 100 });
          const matchedSummary = assignList.data?.find((a) => a.id === assignmentIdNum);
          if (matchedSummary) {
            matchedClass = cls;
            if (matchedSummary.closeAt) {
              const d = new Date(matchedSummary.closeAt);
              setCloseAtDate(d.toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              }));
            }
            break;
          }
        } catch {
          // ignore
        }
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

      // 4. Fetch submissions
      let submissionsList: SubmissionListItem[] = [];
      try {
        const subRes = await submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 });
        submissionsList = subRes.data || [];
      } catch {
        submissionsList = [];
      }

      // 5. Combine class members with submissions
      const bgColors = ['#EAF0E8', '#FEF3C7', '#FCE7F3', '#F3E8FF', '#ECFDF5', '#FAF3E5'];
      const textColors = ['#1B4D3E', '#D97706', '#BE185D', '#7E22CE', '#059669', '#8C5E14'];

      const studentRows: EnrolledStudentSubmissionRow[] = classMembers.map((member, index) => {
        const matchedSub = submissionsList.find((s) => s.studentId === member.studentId);
        const nameParts = member.fullName.trim().split(' ');
        const initials = nameParts.length > 1 
          ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase() 
          : (member.fullName.slice(0, 2).toUpperCase() || 'HV');

        const colorIndex = index % bgColors.length;

        let status: 'submitted' | 'missing' = 'missing';
        let gradingStatus: 'graded' | 'pending' | 'none' = 'none';
        let finalScore: number | null = null;

        if (matchedSub) {
          status = 'submitted';
          const hasGraded = matchedSub.status === 'GRADED' || 
            matchedSub.modules.some((m: SubmissionModuleSummary) => m.grading?.status === 'COMPLETED' || (m.grading?.finalScore !== null && m.grading?.finalScore !== undefined));
          
          if (hasGraded) {
            gradingStatus = 'graded';
            const firstModScore = matchedSub.modules[0]?.grading?.finalScore;
            finalScore = firstModScore ?? null;
          } else {
            gradingStatus = 'pending';
          }
        }

        return {
          studentId: member.studentId,
          code: member.studentCode || `HV-${member.studentId.toString().padStart(4, '0')}`,
          name: member.fullName,
          email: `${member.studentCode?.toLowerCase() || `student${member.studentId}`}@englishhub.edu.vn`,
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
    const missingCount = students.filter((s) => s.status === 'missing').length;
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
      missingCount,
      gradedCount,
      pendingCount,
      avgBand,
      gradedPercentage
    };
  }, [students]);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (activeTab === 'submitted' && s.status !== 'submitted') return false;
      if (activeTab === 'missing' && s.status !== 'missing') return false;

      if (subTab === 'graded' && s.gradingStatus !== 'graded') return false;
      if (subTab === 'pending' && s.gradingStatus !== 'pending') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      }

      return true;
    });
  }, [students, activeTab, subTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, safeCurrentPage, pageSize]);

  if (isLoading) {
    return (
      <div className="eh-card p-8 max-w-xl mx-auto my-8 text-center">
        <RefreshCw size={36} className="text-primary animate-spin m-auto mb-4" />
        <h3 className="m-0 text-sm font-bold text-main">
          {isVi ? 'Đang tải dữ liệu bài tập và danh sách nộp bài...' : 'Loading assignment and submissions...'}
        </h3>
        <p className="mt-1 text-xs text-muted">
          {isVi ? 'Đang đồng bộ số liệu chấm điểm và học viên từ hệ thống.' : 'Syncing grading turnout and enrolled student roster.'}
        </p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
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
    );
  }

  return (
    <div className="tad-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="tad-toast">
          <CheckCircle2 size={16} className="text-secondary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button */}
      <button 
        type="button"
        onClick={() => navigate('/teacher/assignments')}
        className="tad-back-btn"
      >
        <ArrowLeft size={16} /> {t('assignmentDetails.backToLibrary')}
      </button>

      {/* Header */}
      <div className="tad-header">
        <div>
          <h1 className="tad-title">
            {assignment.title}
          </h1>
          <div className="tad-meta-row">
            <span className={`tad-status-pill ${assignment.status === 'PUBLISHED' ? 'open' : 'closed'}`}>
              {assignment.status === 'PUBLISHED' 
                ? t('assignmentDetails.statusOpen') 
                : assignment.status === 'CLOSED'
                  ? t('assignmentDetails.statusClosed')
                  : assignment.status}
            </span>
            <span className="tad-skill-tag">
              {skillLabel}
            </span>
            <span className="text-muted text-sm">•</span>
            <span className="text-muted text-sm font-medium">
              {t('assignmentDetails.classPrefix')}{className}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary"
            size="sm"
            icon={Edit2}
            onClick={() => navigate(`/teacher/assignments/${id}/edit`)}
          >
            {t('assignmentDetails.btnEdit')}
          </Button>

          <Button 
            variant="secondary"
            size="sm"
            icon={Lock}
            disabled={assignment.status !== 'PUBLISHED'}
            loading={isClosing}
            onClick={handleCloseAssignment}
            title={assignment.status === 'CLOSED' ? (isVi ? 'Bài tập này đã đóng' : 'Assignment is already closed') : undefined}
          >
            {t('assignmentDetails.btnClose')}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="tad-stats-grid">
        {/* Card 1: Hạn nộp bài */}
        <div className="tad-stat-card">
          <div className="tad-stat-label">
            {isVi ? 'Hạn nộp bài' : 'Deadline'}
          </div>
          <div className="tad-stat-value date-value">
            {closeAtDate || (isVi ? 'Không thời hạn' : 'No deadline')}
          </div>
        </div>

        {/* Card 2: Tiến độ nộp bài */}
        <div className="tad-stat-card">
          <div className="tad-stat-label">
            {isVi ? 'Tiến độ nộp bài' : 'Submission Progress'}
          </div>
          <div className="tad-stat-value">
            <span className="tad-stat-number">{metrics.submittedCount}</span>
            <span className="tad-stat-total">/{metrics.totalStudents}</span>
          </div>
        </div>

        {/* Card 3: Đã chấm điểm */}
        <div className="tad-stat-card">
          <div className="tad-stat-label">
            {isVi ? 'Đã chấm điểm' : 'Graded Submissions'}
          </div>
          <div className="tad-stat-value">
            <span className="tad-stat-number">{metrics.gradedCount}</span>
            <span className="tad-stat-total">/{metrics.submittedCount}</span>
          </div>
        </div>

        {/* Card 4: Điểm trung bình */}
        <div className="tad-stat-card">
          <div className="tad-stat-label">
            {isVi ? 'Điểm trung bình' : 'Average Score'}
          </div>
          <div className="tad-stat-value text-primary">
            <span className="tad-stat-number">{metrics.avgBand !== '0.0' ? metrics.avgBand : '—'}</span>
            <span className="tad-stat-total">/10</span>
          </div>
        </div>
      </div>

      {/* Multi-skill Module Tabs Switcher */}
      {modulesList.length > 1 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {modulesList.map((m, idx) => {
            const isSelected = selectedModuleIndex === idx;
            return (
              <button
                key={m.id || idx}
                type="button"
                onClick={() => setSelectedModuleIndex(idx)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface text-muted border-border hover:text-main hover:bg-surface-variant'
                }`}
              >
                {m.skill === 'WRITING' ? 'Writing' : m.skill === 'SPEAKING' ? 'Speaking' : m.skill === 'READING' ? 'Reading' : 'Listening'}
              </button>
            );
          })}
        </div>
      )}

      {/* Listening Audio Player if available */}
      {(() => {
        const activeMod = modulesList[selectedModuleIndex] || modulesList[0] || null;
        if (!activeMod?.audioUrl) return null;
        return (
          <div className="tad-card mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Headphones size={18} className="text-primary" />
              <h3 className="m-0 text-sm font-semibold text-main">{isVi ? 'Tệp âm thanh bài nghe' : 'Listening Audio'}</h3>
            </div>
            <audio controls className="w-full mt-2" src={activeMod.audioUrl}>
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
        return (
          <div className="tad-card">
            <div className="flex justify-between items-start mb-3">
              <h2 className="flex items-center gap-2 m-0 text-base font-semibold text-main">
                <FileText size={20} className="text-primary" /> {t('assignmentDetails.promptTitle')}
              </h2>
            </div>
            <div className="text-muted text-sm leading-relaxed whitespace-pre-line">
              {activeInst}
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
          <div className="tad-card">
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary-container text-primary flex items-center justify-center">
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
              <div className="p-8 text-center bg-surface-variant border-dashed rounded-md">
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
                        <div className="p-3 bg-surface-variant rounded-md text-xs text-main">
                          <strong className="text-main">{isVi ? 'Đáp án chuẩn:' : 'Correct answer:'} </strong>
                          <span className="text-success font-semibold">{shortAns || '(Chưa cấu hình)'}</span>
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

      {/* Students List */}
      <div className="tad-card p-0 overflow-hidden">
        {/* Tabs */}
        <div className="tad-tabs-bar">
          {[
            { id: 'all' as const, label: t('assignmentDetails.tabAll'), count: students.length },
            { id: 'submitted' as const, label: t('assignmentDetails.tabSubmitted'), count: metrics.submittedCount },
            { id: 'missing' as const, label: t('assignmentDetails.tabMissing'), count: metrics.missingCount, isRed: true }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleActiveTabChange(tab.id)}
              className={`tad-tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.isRed && activeTab !== tab.id ? 'missing' : ''}`}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="tad-toolbar">
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => handleSubTabChange('all')}
              className={`tad-subtab-btn ${subTab === 'all' ? 'active' : ''}`}
            >
              {isVi ? 'Tất cả' : 'All'}
            </button>
            <button 
              type="button"
              onClick={() => handleSubTabChange('graded')}
              className={`tad-subtab-btn ${subTab === 'graded' ? 'active' : ''}`}
            >
              {t('assignmentDetails.subTabGraded')} ({metrics.gradedCount})
            </button>
            <button 
              type="button"
              onClick={() => handleSubTabChange('pending')}
              className={`tad-subtab-btn ${subTab === 'pending' ? 'pending-active' : ''}`}
            >
              {t('assignmentDetails.subTabPending')} ({metrics.pendingCount})
            </button>
          </div>
          
          <div className="flex gap-3 items-center">
            <div className="relative">
              <input 
                type="text" 
                placeholder={t('assignmentDetails.searchPlaceholder')} 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="tad-search-input"
              />
              <Search size={16} className="absolute left-3 top-2.5 text-muted pointer-events-none" />
            </div>
            {metrics.missingCount > 0 && (
              <Button 
                variant="secondary"
                size="sm"
                icon={Bell}
                onClick={() => showToast(isVi ? `Đã gửi thông báo nhắc nộp bài tới ${metrics.missingCount} học viên` : `Sent reminders to ${metrics.missingCount} students`)}
              >
                {t('assignmentDetails.btnRemind')} ({metrics.missingCount}{t('assignmentDetails.unitFriends')})
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="tad-table">
            <thead>
              <tr>
                <th>{t('assignmentDetails.colStudent')}</th>
                <th>{t('assignmentDetails.colStatus')}</th>
                <th>{t('assignmentDetails.colGrading')}</th>
                <th className="text-right">{t('assignmentDetails.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={student.studentId}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div 
                        className="tad-avatar"
                        style={{ backgroundColor: student.avatarBg, color: student.avatarColor }}
                      >
                        {student.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-main text-sm">{student.name}</div>
                        <div className="text-muted text-xs">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {student.status === 'submitted' ? (
                      <span className="tad-badge-submitted">
                        <div className="tad-badge-dot submitted" />
                        {t('assignmentDetails.statusSubmittedLabel')}
                      </span>
                    ) : (
                      <span className="tad-badge-missing">
                        <div className="tad-badge-dot missing" />
                        {t('assignmentDetails.statusMissingLabel')}
                      </span>
                    )}
                  </td>
                  <td>
                    {student.gradingStatus === 'graded' && (
                      <span className="tad-grading-graded">
                        {t('assignmentDetails.gradingGraded')} {student.finalScore !== null && `(${student.finalScore}/10)`}
                      </span>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <span className="tad-grading-pending">
                        {t('assignmentDetails.gradingPending')}
                      </span>
                    )}
                    {student.gradingStatus === 'none' && (
                      <span className="text-muted text-xs">{t('assignmentDetails.gradingNone')}</span>
                    )}
                  </td>
                  <td className="text-right">
                    {student.gradingStatus === 'graded' && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.studentId}`)}
                      >
                        {t('assignmentDetails.btnView')}
                      </Button>
                    )}
                    {student.gradingStatus === 'pending' && (
                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/teacher/assignments/${id}/submissions/${student.studentId}`)}
                      >
                        {t('assignmentDetails.btnGradeNow')}
                      </Button>
                    )}
                    {student.gradingStatus === 'none' && (
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => showToast(isVi ? `Đã gửi nhắc nhở tới ${student.name}` : `Reminder sent to ${student.name}`)}
                      >
                        {t('assignmentDetails.btnSendReminder')}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}

              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={AlertCircle}
                      title={isVi ? 'Không tìm thấy học viên phù hợp.' : 'No students match your filter.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredStudents.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel={isVi ? 'học viên' : 'students'}
            isVi={isVi}
            variant="table"
          />
        )}
      </div>
    </div>
  );
};

export default TeacherAssignmentDetails;
