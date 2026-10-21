import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, FileText, ChevronLeft, ChevronRight,
  User,
  Save, Send, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { MetricCard, FileItem, StickyActionBar, Button, EmptyState, MarkdownView } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { parseApiError } from '../api';
import { submissionService, type SubmissionDetail, type SubmissionModuleDetailResponse } from '../api/services/submission.service';
import { 
  gradingService, 
  type AiGradingSuggestionResponse, 
  type SubmissionModuleGradingResponse,
  type GradingDetailResponse 
} from '../api/services/grading.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { classService, type ClassMember } from '../api/services/class.service';

const resolveAudioUrl = (storageKey?: string | null): string => {
  if (!storageKey) return '';
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  return `/s3-upload/englishhub-dev/${storageKey.replace(/^\/+/, '')}`;
};

export const TeacherSubmissionDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { studentName?: string; studentEmail?: string; studentCode?: string } | null;
  const { id, studentId } = useParams<{ id: string; studentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState<boolean>(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Entities
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(() => {
    const modParam = searchParams.get('moduleId');
    return modParam && Number.isFinite(Number(modParam)) ? Number(modParam) : null;
  });
  const [moduleDetail, setModuleDetail] = useState<SubmissionModuleDetailResponse | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiGradingSuggestionResponse | null>(null);
  const [gradingSummary, setGradingSummary] = useState<SubmissionModuleGradingResponse | null>(null);
  const [gradingDetail, setGradingDetail] = useState<GradingDetailResponse | null>(null);
  const [studentInfo, setStudentInfo] = useState<{ name: string; code: string; email?: string } | null>(() => {
    if (routeState?.studentName) {
      return {
        name: routeState.studentName,
        email: routeState.studentEmail,
        code: routeState.studentCode || `HV-${String(studentId).padStart(4, '0')}`
      };
    }
    return null;
  });

  // Class student list for Prev / Next navigation
  const [classSubmissions, setClassSubmissions] = useState<Array<{ studentId: number; name?: string }>>([]);

  // Form State
  const [finalScoreInput, setFinalScoreInput] = useState<string>('');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [teacherNote, setTeacherNote] = useState<string>('');

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadModuleData = useCallback(async (targetModuleId: number) => {
    try {
      const modDetailRes = await submissionService.getSubmissionModuleDetail(targetModuleId);
      setModuleDetail(modDetailRes);
    } catch {
      setModuleDetail(null);
    }

    try {
      const gradingRes = await gradingService.getBySubmissionModuleId(targetModuleId);
      setGradingSummary(gradingRes);
      if (gradingRes.finalScore !== null && gradingRes.finalScore !== undefined) {
        setFinalScoreInput(String(gradingRes.finalScore));
      }
      if (gradingRes.id) {
        try {
          const detail = await gradingService.getById(gradingRes.id);
          setGradingDetail(detail);
          if (detail.finalScore !== null && detail.finalScore !== undefined) {
            setFinalScoreInput(String(detail.finalScore));
          }
          if (detail.finalFeedback) {
            setFeedbackText(detail.finalFeedback);
          } else if (detail.aiFeedback) {
            setFeedbackText((prev) => prev || detail.aiFeedback || '');
          }
        } catch {
          // ignore
        }
      }
    } catch {
      setGradingSummary(null);
      setGradingDetail(null);
    }

    try {
      const aiRes = await gradingService.getAiSuggestion(targetModuleId);
      setAiSuggestion(aiRes);
      if (aiRes.aiFeedback) {
        setFeedbackText((prev) => prev || aiRes.aiFeedback || '');
      }
      if (aiRes.suggestedScore !== null && aiRes.suggestedScore !== undefined) {
        setFinalScoreInput((prev) => (!prev ? String(aiRes.suggestedScore) : prev));
      }
    } catch {
      setAiSuggestion(null);
    }
  }, []);

  const handleSelectModule = (modId: number) => {
    setSelectedModuleId(modId);
    setSearchParams({ moduleId: String(modId) }, { replace: true });
    loadModuleData(modId);
  };

  useEffect(() => {
    let isMounted = true;
    if (!id || !studentId) return;

    const loadSubmissionData = async () => {
      try {
        const assignmentIdNum = Number(id);
        const studentIdNum = Number(studentId);

        // 1. Fetch assignment detail
        const assignRes = await assignmentService.getAssignment(assignmentIdNum);
        if (isMounted) setAssignment(assignRes);

        // 2. Fetch student profile/name via class members
        let resolvedMember: ClassMember | undefined;
        try {
          const classRes = await classService.list({ limit: 100 });
          const classesList = classRes.data || [];

          // 2a. Find class containing this assignment first
          for (const cls of classesList) {
            try {
              const assignList = await assignmentService.listAssignments(cls.id, { limit: 100 });
              if (assignList.data?.some((a) => a.id === assignmentIdNum)) {
                const members = await classService.listMembers(cls.id);
                resolvedMember = members.find((m) => m.studentId === studentIdNum);
                if (resolvedMember) break;
              }
            } catch {
              // ignore
            }
          }

          // 2b. If not found in assigned class, check all teacher's classes
          if (!resolvedMember) {
            for (const cls of classesList) {
              try {
                const members = await classService.listMembers(cls.id);
                const found = members.find((m) => m.studentId === studentIdNum);
                if (found) {
                  resolvedMember = found;
                  break;
                }
              } catch {
                // ignore
              }
            }
          }

          if (isMounted) {
            if (resolvedMember) {
              setStudentInfo({
                name: resolvedMember.fullName,
                email: resolvedMember.email || routeState?.studentEmail,
                code: resolvedMember.studentCode || `HV-${studentIdNum.toString().padStart(4, '0')}`
              });
            } else if (routeState?.studentName) {
              setStudentInfo({
                name: routeState.studentName,
                email: routeState.studentEmail,
                code: routeState.studentCode || `HV-${studentIdNum.toString().padStart(4, '0')}`
              });
            } else {
              setStudentInfo({
                name: isVi ? `Học viên #${studentIdNum}` : `Student #${studentIdNum}`,
                code: `HV-${studentIdNum.toString().padStart(4, '0')}`
              });
            }
          }
        } catch {
          if (isMounted) {
            if (routeState?.studentName) {
              setStudentInfo({
                name: routeState.studentName,
                email: routeState.studentEmail,
                code: routeState.studentCode || `HV-${studentIdNum.toString().padStart(4, '0')}`
              });
            } else {
              setStudentInfo({
                name: isVi ? `Học viên #${studentIdNum}` : `Student #${studentIdNum}`,
                code: `HV-${studentIdNum.toString().padStart(4, '0')}`
              });
            }
          }
        }

        // 3. Find submission for this student and assignment
        const subListRes = await submissionService.listSubmissions({
          assignmentId: assignmentIdNum,
          studentId: studentIdNum,
          limit: 10
        });

        const submissions = subListRes.data || [];
        const completedSub = submissions.find(s => s.status === 'GRADED' || s.status === 'SUBMITTED');
        const matchedSubItem = completedSub || (submissions.length > 0 ? submissions[0] : null);

        if (!matchedSubItem) {
          if (isMounted) {
            setSubmission(null);
            setIsLoading(false);
          }
          return;
        }

        // Fetch full submission detail
        const subDetail = await submissionService.getSubmission(matchedSubItem.id);
        if (!isMounted) return;
        setSubmission(subDetail);

        if (subDetail.status === 'IN_PROGRESS') {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        // 4. Determine initial module
        if (subDetail.modules && subDetail.modules.length > 0) {
          let initialMod = subDetail.modules[0];
          const queryModId = searchParams.get('moduleId');
          const parsedModId = queryModId && Number.isFinite(Number(queryModId)) ? Number(queryModId) : null;

          if (parsedModId) {
            const found = subDetail.modules.find(m => m.id === parsedModId);
            if (found) initialMod = found;
          } else {
            const speakingMod = subDetail.modules.find(m => m.skill === 'SPEAKING');
            if (speakingMod) initialMod = speakingMod;
          }

          setSelectedModuleId(initialMod.id);
          await loadModuleData(initialMod.id);
        }

        // 5. Fetch sibling submissions for Prev/Next
        try {
          const siblingRes = await submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 });
          if (isMounted && siblingRes.data) {
            const uniqueStudents = Array.from(new Set(siblingRes.data.filter((s) => s.status !== 'IN_PROGRESS').map((s) => s.studentId))).map((sId) => ({
              studentId: sId
            }));
            setClassSubmissions(uniqueStudents);
          }
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Failed to load student submission details:', err);
        if (isMounted) {
          setError(isVi ? 'Không thể tải chi tiết bài nộp của học viên. Vui lòng thử lại.' : 'Failed to load submission details. Please retry.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSubmissionData();

    return () => {
      isMounted = false;
    };
  }, [id, studentId, isVi, reloadKey, searchParams, loadModuleData]);

  const activeModule = useMemo(() => {
    if (!submission?.modules || submission.modules.length === 0) return null;
    if (selectedModuleId) {
      const found = submission.modules.find(m => m.id === selectedModuleId);
      if (found) return found;
    }
    const speakingMod = submission.modules.find(m => m.skill === 'SPEAKING');
    return speakingMod || submission.modules[0];
  }, [submission, selectedModuleId]);

  // Navigate to prev/next student
  const currentIndex = useMemo(() => {
    if (!studentId || classSubmissions.length === 0) return 0;
    const idx = classSubmissions.findIndex((s) => String(s.studentId) === studentId);
    return idx >= 0 ? idx : 0;
  }, [classSubmissions, studentId]);

  const handleNavigateSibling = (direction: 'prev' | 'next') => {
    if (classSubmissions.length <= 1) return;
    const targetIdx = direction === 'prev' 
      ? (currentIndex - 1 + classSubmissions.length) % classSubmissions.length
      : (currentIndex + 1) % classSubmissions.length;
    const nextStudent = classSubmissions[targetIdx];
    if (nextStudent) {
      navigate(`/teacher/assignments/${id}/submissions/${nextStudent.studentId}`, {
        state: nextStudent.name ? { studentName: nextStudent.name } : undefined
      });
    }
  };

  // Trigger AI Analyze
  const handleTriggerAiAnalyze = async () => {
    const targetModuleId = activeModule?.id;
    if (!targetModuleId) return;

    setIsAnalyzingAi(true);
    try {
      showToast(isVi ? 'Đang gửi yêu cầu chấm điểm bằng AI...' : 'Requesting AI grading...');
      await gradingService.requestAiAnalysis(targetModuleId);
      showToast(isVi ? 'AI đang phân tích và chấm điểm bài nói...' : 'AI is analyzing and grading the speaking submission...');

      setTimeout(async () => {
        try {
          await loadModuleData(targetModuleId);
          showToast(isVi ? 'AI đã hoàn thành chấm điểm!' : 'AI grading completed!');
        } catch (pollErr) {
          console.error('Error refreshing grading after AI:', pollErr);
        } finally {
          setIsAnalyzingAi(false);
        }
      }, 3500);
    } catch (err) {
      console.error('Failed to trigger AI analyze:', err);
      const parsed = parseApiError(err);
      showToast(parsed.message || (isVi ? 'Lỗi khi kích hoạt AI. Vui lòng thử lại.' : 'Failed to trigger AI analysis.'));
      setIsAnalyzingAi(false);
    }
  };

  // Submit Grade
  const handleSaveGrade = async (isFinalize: boolean) => {
    const gradingId = gradingSummary?.id;
    if (!gradingId) {
      showToast(isVi ? 'Chưa tìm thấy bản ghi chấm điểm của bài này.' : 'Grading record not found.');
      return;
    }

    const scoreNum = parseFloat(finalScoreInput);
    if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      showToast(isVi ? 'Điểm số không hợp lệ (thang 0.0 - 10.0)!' : 'Invalid score (range 0.0 - 10.0)!');
      return;
    }

    setIsSubmittingGrade(true);
    try {
      await gradingService.submitGrade(gradingId, {
        finalScore: scoreNum,
        finalFeedback: feedbackText,
        note: teacherNote
      });

      showToast(isVi 
        ? (isFinalize ? 'Đã lưu điểm và trả bài cho học viên thành công!' : 'Đã lưu bản nháp nhận xét!') 
        : (isFinalize ? 'Grade finalized and published to student!' : 'Grading draft saved!'));

      if (isFinalize) {
        setTimeout(() => navigate(`/teacher/assignments/${id}`), 1000);
      }
    } catch (err) {
      console.error('Failed to submit grade:', err);
      const parsed = parseApiError(err);
      showToast(parsed.message || (isVi ? 'Có lỗi xảy ra khi lưu điểm. Vui lòng thử lại!' : 'Failed to save grade. Please retry!'));
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  // Check if current active module is speaking
  const isSpeaking = activeModule?.skill === 'SPEAKING' || 
    moduleDetail?.answers?.some(a => !!a.audioStorageKey);

  const audioAnswer = moduleDetail?.answers?.find(a => !!a.audioStorageKey);
  const audioStorageKey = audioAnswer?.audioStorageKey;
  const audioUrl = audioStorageKey ? resolveAudioUrl(audioStorageKey) : null;

  // Extract student text answer
  const studentAnswerText = useMemo(() => {
    if (!moduleDetail?.answers || moduleDetail.answers.length === 0) {
      return isVi 
        ? 'Học viên đã nộp bài tập trực tuyến.' 
        : 'Student submitted the online assignment.';
    }

    const firstAnswer = moduleDetail.answers[0];
    if (typeof firstAnswer.content === 'string') {
      return firstAnswer.content;
    }
    if (typeof firstAnswer.content === 'object' && firstAnswer.content !== null) {
      const obj = firstAnswer.content as Record<string, unknown>;
      return (obj.text || obj.essay || obj.answer || obj.content || JSON.stringify(obj)) as string;
    }
    return String(firstAnswer.content);
  }, [moduleDetail, isVi]);

  const wordCount = useMemo(() => {
    if (!studentAnswerText) return 0;
    return studentAnswerText.trim().split(/\s+/).filter(Boolean).length;
  }, [studentAnswerText]);

  if (isLoading) {
    return (
      <div className="tsd-loading-container">
        <RefreshCw size={36} color="var(--primary)" className="animate-spin tsd-loading-spinner" />
        <h3 className="tsd-loading-title">
          {isVi ? 'Đang tải bài làm học viên và phân tích AI...' : 'Loading student submission & AI insights...'}
        </h3>
        <p className="tsd-loading-desc">
          {isVi ? 'Đang kết nối hệ thống chấm chữa và bài nộp thực tế.' : 'Connecting to grading engine and live answers.'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tsd-error-card">
        <div className="tsd-error-header">
          <AlertCircle size={24} color="var(--error)" />
          <h3 className="tsd-error-title">{error}</h3>
        </div>
        <Button 
          variant="secondary"
          size="sm"
          onClick={handleRetry}
          icon={RefreshCw}
        >
          {isVi ? 'Thử lại' : 'Retry'}
        </Button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="tsd-page-container pt-8">
        <EmptyState
          icon={FileText}
          title={isVi ? 'Học viên này chưa nộp bài tập' : 'No submission found for this student'}
          description={`${studentInfo?.name || 'Học viên'} ${isVi ? 'hiện chưa hoàn thành nộp bài tập này.' : 'has not submitted this assignment yet.'}`}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate(`/teacher/assignments/${id}`)}
            >
              {t('submissionDetails.backToList')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="tsd-page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="tsd-toast">
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumbs & Actions */}
      <div className="tsd-nav-bar">
        <button 
          onClick={() => navigate(`/teacher/assignments/${id}`)}
          className="tsd-back-link"
        >
          <ArrowLeft size={16} /> {t('submissionDetails.backToList')}
        </button>
        
        {classSubmissions.length > 0 && (
          <div className="tsd-pager-bar">
            <button 
              onClick={() => handleNavigateSibling('prev')}
              className="tsd-pager-btn"
            >
              <ChevronLeft size={14} /> {t('submissionDetails.btnPrev')}
            </button>
            <span className="tsd-pager-count">
              {currentIndex + 1} / {classSubmissions.length}
            </span>
            <button 
              onClick={() => handleNavigateSibling('next')}
              className="tsd-pager-btn next"
            >
              {t('submissionDetails.btnNextPrefix')} <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="tsd-header">
        <h1 className="tsd-header-title">
          {assignment?.title || (isVi ? 'BÀI TẬP TIẾNG ANH' : 'ENGLISH ASSIGNMENT')}
        </h1>
      </div>

      {/* Student Banner */}
      <div className="tsd-student-card">
        <div className="tsd-student-info-left">
          <div className="tsd-student-avatar">
            <User size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="tsd-student-name">
                {studentInfo?.name || (isVi ? `Học viên #${studentId}` : `Student #${studentId}`)}
              </h2>
              {!isSpeaking && (
                <span className="tsd-status-chip">
                  {submission.status === 'GRADED' ? (isVi ? 'Đã có điểm' : 'Graded') : t('submissionDetails.statusSubmitted')}
                </span>
              )}
              <span className="tsd-student-code">
                {studentInfo?.code || `HV-${studentId}`}
              </span>
            </div>
            {studentInfo?.email && (
              <div className="tsd-student-meta">
                <span>{studentInfo.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="tsd-time-info">
          <div className="text-right">
            <div className="tsd-time-label">{t('submissionDetails.submissionTimePrefix')}</div>
            <div className="tsd-time-val">
              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Vừa xong'}
            </div>
          </div>
          {!isSpeaking && (
            <>
              <div className="tsd-time-divider"></div>
              <div className="tsd-ontime-indicator">
                <span className="tsd-ontime-dot"></span>
                <span className="font-medium text-slate-700">{t('submissionDetails.statusOnTime')}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Module Switcher Tabs if multiple modules exist */}
      {submission.modules && submission.modules.length > 1 && (
        <div className="tsd-module-tabs">
          {submission.modules.map((m) => {
            const isSelected = m.id === (activeModule?.id || selectedModuleId);
            const label = m.skill || (isVi ? `Phần ${m.id}` : `Module ${m.id}`);
            return (
              <button
                key={m.id}
                type="button"
                className={`tsd-module-tab ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectModule(m.id)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Metrics Row (Only for non-speaking modules) */}
      {!isSpeaking && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MetricCard 
            title={isVi ? 'Điểm AI đề xuất' : 'AI Suggested Score'}
            value={gradingDetail?.finalScore !== null && gradingDetail?.finalScore !== undefined 
              ? String(gradingDetail.finalScore) 
              : (aiSuggestion?.suggestedScore !== null && aiSuggestion?.suggestedScore !== undefined 
                  ? String(aiSuggestion.suggestedScore) 
                  : '--')}
            suffix="/ 10"
          />

          <MetricCard 
            title={isVi ? 'Độ dài bài nộp' : 'Word Count'}
            value={String(wordCount)}
            suffix={isVi ? 'từ' : 'words'}
          />
        </div>
      )}

      {/* Submission Files & Attachments (Only for non-speaking document uploads) */}
      {!isSpeaking && moduleDetail?.answers && moduleDetail.answers.some(a => a.docStorageKey) && (
        <div className="tsd-files-card">
          <div className="tsd-files-header">
            <h3 className="tsd-files-title">
              {t('submissionDetails.filesTitle')}
            </h3>
          </div>
          
          <div className="tsd-files-list">
            {moduleDetail.answers.map((ans) => {
              if (ans.docStorageKey) {
                return (
                  <FileItem 
                    key={ans.id}
                    name={ans.docStorageKey}
                    extension={ans.docMimeType?.includes('pdf') ? 'pdf' : 'docx'}
                    size="Tệp đính kèm"
                    details={t('submissionDetails.submittedOn')}
                    onDownload={() => showToast(isVi ? 'Đang tạo liên kết tải tài liệu...' : 'Preparing download...')}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {isSpeaking ? (
        /* Speaking Optimized Layout: Audio Hero Top + Balanced 2-Column Feedback Workspace (50% AI / 50% Teacher) */
        <div className="tsd-speaking-container">
          {/* Top Section: Audio Hero Card */}
          <div className="tsd-speaking-hero-card">
            <div className="tsd-speaking-hero-header">
              <h3 className="tsd-speaking-hero-title">
                {isVi ? 'Bài nói của học viên' : 'Student Speaking Submission'}
              </h3>
            </div>

            <div className="tsd-speaking-hero-body">
              <div className="tsd-prompt-label">
                {assignment?.title || (isVi ? 'ĐỀ BÀI' : 'TASK PROMPT')}
              </div>

              <div className="tsd-speaking-audio-bar">
                {audioUrl ? (
                  <div className="tsd-speaking-audio-wrap">
                    <audio controls src={audioUrl} className="tsd-audio-player">
                      {isVi ? 'Trình duyệt của bạn không hỗ trợ phát âm thanh.' : 'Your browser does not support audio playback.'}
                    </audio>
                  </div>
                ) : (
                  <div className="tsd-audio-empty">
                    {isVi ? 'Chưa tìm thấy bản ghi âm của học viên.' : 'No audio recording found.'}
                  </div>
                )}

                <button
                  type="button"
                  className="tsd-btn-ai-speaking"
                  disabled={isAnalyzingAi}
                  onClick={handleTriggerAiAnalyze}
                >
                  {isAnalyzingAi 
                    ? (isVi ? 'Đang chấm điểm...' : 'Grading...') 
                    : (gradingDetail?.aiFeedback || aiSuggestion?.aiFeedback
                        ? (isVi ? 'Chấm lại bằng AI' : 'Re-grade with AI')
                        : (isVi ? 'Chấm bài bằng AI' : 'Grade with AI'))}
                </button>
              </div>
            </div>
          </div>

          {/* Main 2-Column Workspace: Left 50% AI Feedback, Right 50% Teacher Evaluation */}
          <div className="tsd-speaking-workspace">
            {/* Left Column: AI Feedback with wide space for readability */}
            <div className="tsd-speaking-ai-panel">
              <div className="tsd-speaking-panel-header">
                <span className="tsd-speaking-panel-title">
                  {isVi ? 'Nhận xét từ AI' : 'AI Feedback'}
                </span>
                {(gradingDetail?.finalScore !== null && gradingDetail?.finalScore !== undefined) ||
                 (aiSuggestion?.suggestedScore !== null && aiSuggestion?.suggestedScore !== undefined) ? (
                  <span className="tsd-speaking-ai-score">
                    {isVi ? 'Điểm đề xuất: ' : 'Suggested: '}
                    <strong>
                      {gradingDetail?.finalScore !== null && gradingDetail?.finalScore !== undefined 
                        ? String(gradingDetail.finalScore) 
                        : String(aiSuggestion?.suggestedScore)}
                    </strong> / 10
                  </span>
                ) : null}
              </div>

              <div className="tsd-speaking-ai-content">
                <MarkdownView 
                  content={gradingDetail?.aiFeedback || aiSuggestion?.aiFeedback}
                  fallbackText={isVi 
                    ? 'Chưa có nhận xét từ AI. Hãy bấm nút "Chấm bài bằng AI" để hệ thống phân tích và đề xuất nhận xét.' 
                    : 'No AI feedback available. Click "Grade with AI" to analyze the submission.'}
                  className="tsd-speaking-ai-markdown"
                />
              </div>
            </div>

            {/* Right Column: Teacher Official Evaluation & Feedback Studio */}
            <div className="tsd-speaking-teacher-panel">
              <div className="tsd-speaking-panel-header">
                <span className="tsd-speaking-panel-title">
                  {isVi ? 'Đánh giá của giáo viên' : 'Teacher Evaluation'}
                </span>
              </div>

              <div className="tsd-speaking-score-row">
                <label className="tsd-card-label">
                  {isVi ? 'Điểm chấm chính thức' : 'Official Score'}
                </label>
                <div className="flex items-center gap-2 mt-1.5">
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0" 
                    max="10" 
                    placeholder="0.0"
                    value={finalScoreInput}
                    onChange={(e) => setFinalScoreInput(e.target.value)}
                    className="tsd-score-input"
                  />
                  <span className="text-sm font-semibold text-slate-500">/ 10</span>
                </div>
              </div>

              <div className="tsd-speaking-feedback-wrap">
                <label className="tsd-card-label mb-2">
                  {t('submissionDetails.feedbackTitle')}
                </label>
                <textarea 
                  className="tsd-feedback-textarea"
                  placeholder={t('submissionDetails.feedbackPlaceholder')} 
                  rows={9}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Two-Column Layout for Writing / Reading / Listening */
        <div className="tsd-grading-grid">
          {/* Left Column: Student Answer Viewer */}
          <div className="tsd-answer-card">
            <div className="tsd-answer-header">
              <div className="tsd-answer-title">
                <span>
                  {isVi ? 'Nội dung bài làm học viên' : 'Student Submitted Answer'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {wordCount} {isVi ? 'từ' : 'words'}
              </div>
            </div>

            <div className="tsd-answer-box">
              <div className="tsd-prompt-label">
                {assignment?.title || (isVi ? 'ĐỀ BÀI' : 'TASK PROMPT')}
              </div>

              <p className="m-0 whitespace-pre-line">
                {studentAnswerText}
              </p>
            </div>

            <div className="tsd-answer-footer">
              <div>
                <span>{t('submissionDetails.wordCountPrefix')}<strong>{wordCount} {t('submissionDetails.wordCountSuffix')}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights & Feedback Studio */}
          <div className="tsd-sidebar">
            {/* Teacher Score Input */}
            <div className="tsd-score-card">
              <label className="tsd-card-label">
                {isVi ? 'Điểm chấm chính thức' : 'Official Score'}
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="10" 
                  placeholder="0.0"
                  value={finalScoreInput}
                  onChange={(e) => setFinalScoreInput(e.target.value)}
                  className="tsd-score-input"
                />
              </div>
            </div>

            {/* AI Grading Insight */}
            <div className="tsd-ai-box">
              <div className="tsd-ai-box-header">
                <span>{isVi ? 'Nhận xét từ AI' : 'AI Feedback'}</span>
              </div>
              <MarkdownView 
                content={gradingDetail?.aiFeedback || aiSuggestion?.aiFeedback}
                fallbackText={isVi 
                  ? 'Chưa có nhận xét từ AI.' 
                  : 'No AI feedback available.'}
                className="tsd-ai-markdown"
              />
            </div>

            {/* Feedback Editor */}
            <div className="tsd-feedback-card">
              <h3 className="tsd-card-title">
                {t('submissionDetails.feedbackTitle')}
              </h3>

              <textarea 
                className="tsd-feedback-textarea"
                placeholder={t('submissionDetails.feedbackPlaceholder')} 
                rows={5}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  {isVi ? 'Ghi chú nội bộ' : 'Private Notes'}
                </label>
                <input 
                  type="text"
                  placeholder={isVi ? 'Ghi chú thêm về học viên này...' : 'Internal note...'}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  className="tsd-internal-note-input"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <StickyActionBar 
        leftActions={
          <>
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/teacher/assignments/${id}`)}
            >
              {isVi ? 'Quay lại' : 'Back'}
            </Button>
            <Button 
              variant="secondary" 
              disabled={isSubmittingGrade}
              onClick={() => handleSaveGrade(false)}
              icon={Save}
            >
              {t('submissionDetails.btnSaveDraft')}
            </Button>
          </>
        }
        rightActions={
          <Button 
            variant="primary" 
            disabled={isSubmittingGrade}
            onClick={() => handleSaveGrade(true)}
            icon={isSubmittingGrade ? RefreshCw : Send}
          >
            {isSubmittingGrade ? (isVi ? 'Đang lưu...' : 'Submitting...') : t('submissionDetails.btnSend')}
          </Button>
        }
      />
    </div>
  );
};

export default TeacherSubmissionDetails;
