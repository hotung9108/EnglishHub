import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, FileText, ChevronLeft, ChevronRight,
  User, Star, MessageSquare,
  Save, Send, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { MetricCard, FileItem, StickyActionBar, Button, EmptyState } from '../components/common';
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
import { userService } from '../api/services/user.service';

const resolveAudioUrl = (storageKey?: string | null): string => {
  if (!storageKey) return '';
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  return `/s3-upload/englishhub-dev/${storageKey.replace(/^\/+/, '')}`;
};

export const TeacherSubmissionDetails: React.FC = () => {
  const navigate = useNavigate();
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
  const [studentInfo, setStudentInfo] = useState<{ name: string; email: string; code: string } | null>(null);

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

        // 2. Fetch student profile/name
        try {
          const usersRes = await userService.listUsers({ role: 'STUDENT', limit: 100 });
          const studentUser = usersRes.data.find(u => u.id === studentIdNum);
          if (isMounted) {
            if (studentUser) {
              setStudentInfo({
                name: studentUser.fullName,
                email: studentUser.email,
                code: `HV-${studentUser.id.toString().padStart(4, '0')}`
              });
            } else {
              setStudentInfo({
                name: isVi ? `Học viên #${studentIdNum}` : `Student #${studentIdNum}`,
                email: `student${studentIdNum}@englishhub.edu.vn`,
                code: `HV-${studentIdNum.toString().padStart(4, '0')}`
              });
            }
          }
        } catch {
          if (isMounted) {
            setStudentInfo({
              name: isVi ? `Học viên #${studentIdNum}` : `Student #${studentIdNum}`,
              email: `student${studentIdNum}@englishhub.edu.vn`,
              code: `HV-${studentIdNum.toString().padStart(4, '0')}`
            });
          }
        }

        // 3. Find submission for this student and assignment
        const subListRes = await submissionService.listSubmissions({
          assignmentId: assignmentIdNum,
          studentId: studentIdNum,
          limit: 10
        });

        const matchedSubItem = subListRes.data && subListRes.data.length > 0 ? subListRes.data[0] : null;

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
            const uniqueStudents = Array.from(new Set(siblingRes.data.map((s) => s.studentId))).map((sId) => ({
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
      navigate(`/teacher/assignments/${id}/submissions/${nextStudent.studentId}`);
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

  // Format AI transcript if available
  const formattedTranscript = useMemo(() => {
    if (!gradingDetail?.aiTranscript) return null;
    const tr = gradingDetail.aiTranscript;
    if (typeof tr === 'string') return tr;
    if (typeof tr === 'object' && tr !== null) {
      const obj = tr as Record<string, unknown>;
      if (typeof obj.full_transcript === 'string') return obj.full_transcript;
      if (typeof obj.text === 'string') return obj.text;
      if (typeof obj.transcript === 'string') return obj.transcript;
      return JSON.stringify(obj, null, 2);
    }
    return String(tr);
  }, [gradingDetail?.aiTranscript]);

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

      {/* Quick Actions Bar */}
      <div className="tsd-actions-bar">
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => showToast(isVi ? 'Đang chuẩn bị tải về bài nộp...' : 'Downloading submission...')}
          icon={Download}
        >
          {t('submissionDetails.btnDownloadAll')}
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => window.print()}
          icon={Printer}
        >
          {t('submissionDetails.btnPrint')}
        </Button>
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
                {studentInfo?.name || 'Học viên'}
              </h2>
              <span className="tsd-status-chip">
                {submission.status === 'GRADED' ? (isVi ? 'Đã có điểm' : 'Graded') : t('submissionDetails.statusSubmitted')}
              </span>
              <span className="tsd-student-code">
                {studentInfo?.code || `HV-${studentId}`}
              </span>
            </div>
            <div className="tsd-student-meta">
              <span>{studentInfo?.email}</span>
            </div>
          </div>
        </div>

        <div className="tsd-time-info">
          <div className="text-right">
            <div className="tsd-time-label">{t('submissionDetails.submissionTimePrefix')}</div>
            <div className="tsd-time-val">
              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Vừa xong'}
            </div>
          </div>
          <div className="tsd-time-divider"></div>
          <div className="tsd-ontime-indicator">
            <span className="tsd-ontime-dot"></span>
            <span className="font-medium text-slate-700">{t('submissionDetails.statusOnTime')}</span>
          </div>
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard 
          title={isVi ? 'Điểm số đề xuất' : 'Suggested Score'}
          value={gradingDetail?.finalScore !== null && gradingDetail?.finalScore !== undefined 
            ? String(gradingDetail.finalScore) 
            : (aiSuggestion?.suggestedScore !== null && aiSuggestion?.suggestedScore !== undefined 
                ? String(aiSuggestion.suggestedScore) 
                : (finalScoreInput || '--'))}
          suffix="/ 10"
          footerText={
            <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
              <Star size={14} /> 
              {aiSuggestion?.suggestedScore ? `${isVi ? 'AI đề xuất:' : 'AI Suggestion:'} ${aiSuggestion.suggestedScore}` : (isVi ? 'Đã hiệu chuẩn AI' : 'AI Calibrated')}
            </span>
          }
        />

        <MetricCard 
          title={isSpeaking ? (isVi ? 'Kỹ năng chấm' : 'Skill') : (isVi ? 'Độ dài bài nộp' : 'Word Count')}
          value={isSpeaking ? 'Speaking' : String(wordCount)}
          suffix={isSpeaking ? '' : (isVi ? 'từ' : 'words')}
          footerText={isSpeaking 
            ? (isVi ? 'Bản ghi âm trực tuyến' : 'Online recording') 
            : (wordCount >= 250 ? (isVi ? 'Đạt số từ tối thiểu' : 'Meets minimum word count') : (isVi ? 'Chưa đủ số từ tối thiểu' : 'Below target'))}
        />
      </div>

      {/* Submission Files & Attachments */}
      {moduleDetail?.answers && moduleDetail.answers.some(a => a.docStorageKey || a.audioStorageKey) && (
        <div className="tsd-files-card">
          <div className="tsd-files-header">
            <h3 className="tsd-files-title">
              <FileText size={16} /> {t('submissionDetails.filesTitle')}
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
              if (ans.audioStorageKey) {
                return (
                  <FileItem 
                    key={ans.id}
                    name={ans.audioStorageKey}
                    extension="wav"
                    size="Bản ghi âm bài nói"
                    details={t('submissionDetails.submittedOn')}
                    onDownload={() => showToast(isVi ? 'Đang mở audio phát âm...' : 'Opening audio...')}
                  />
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Two-Column Working Space */}
      <div className="tsd-grading-grid">
        {/* Left Column: Student Answer Viewer */}
        <div className="tsd-answer-card">
          <div className="tsd-answer-header">
            <div className="tsd-answer-title">
              <span className="tsd-answer-title-dot"></span>
              <span>
                {isSpeaking 
                  ? (isVi ? 'Bài nói của học viên' : 'Student Speaking Submission')
                  : (isVi ? 'Nội dung bài làm học viên' : 'Student Submitted Answer')}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {isSpeaking ? 'Speaking' : `${wordCount} ${isVi ? 'từ' : 'words'}`}
            </div>
          </div>

          <div className="tsd-answer-box">
            <div className="tsd-prompt-label">
              {assignment?.title || (isVi ? 'ĐỀ BÀI' : 'TASK PROMPT')}
            </div>

            {isSpeaking ? (
              <div>
                {audioUrl ? (
                  <div className="tsd-audio-player-wrap">
                    <div className="tsd-audio-label">
                      {isVi ? 'Bản ghi âm bài nói' : 'Audio Recording'}
                    </div>
                    <audio controls src={audioUrl} className="tsd-audio-player">
                      {isVi ? 'Trình duyệt của bạn không hỗ trợ phát âm thanh.' : 'Your browser does not support audio playback.'}
                    </audio>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    {isVi ? 'Chưa tìm thấy bản ghi âm của học viên.' : 'No audio recording found.'}
                  </p>
                )}

                {/* Clean AI grading button for Speaking: no badge, no icon, no subtitle, no redundant text */}
                <div className="tsd-speaking-ai-action">
                  <button
                    type="button"
                    className="tsd-btn-ai-speaking"
                    disabled={isAnalyzingAi}
                    onClick={handleTriggerAiAnalyze}
                  >
                    {isAnalyzingAi 
                      ? (isVi ? 'Đang chấm điểm...' : 'Grading...') 
                      : (isVi ? 'Chấm bài bằng AI' : 'Grade with AI')}
                  </button>
                </div>

                {formattedTranscript && (
                  <div className="tsd-transcript-box">
                    <div className="tsd-prompt-label">
                      {isVi ? 'Văn bản chuyển đổi từ giọng nói (Transcript)' : 'Speech-to-text Transcript'}
                    </div>
                    <p className="tsd-transcript-text">{formattedTranscript}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="m-0 whitespace-pre-line">
                {studentAnswerText}
              </p>
            )}
          </div>

          <div className="tsd-answer-footer">
            <div>
              {isSpeaking ? (
                <span>{isVi ? 'Kỹ năng: Nói (Speaking)' : 'Skill: Speaking'}</span>
              ) : (
                <span>{t('submissionDetails.wordCountPrefix')}<strong>{wordCount} {t('submissionDetails.wordCountSuffix')}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Feedback Studio */}
        <div className="tsd-sidebar">
          {/* AI Grading Insight */}
          <div className="tsd-ai-box">
            <div className="tsd-ai-box-header">
              <span>{t('submissionDetails.aiSuggestionsTitle')}</span>
            </div>
            <p className="tsd-ai-desc">
              {gradingDetail?.aiFeedback || aiSuggestion?.aiFeedback || (isVi 
                ? 'AI Engine đã sẵn sàng phân tích bài nộp.' 
                : 'AI Engine is ready to diagnose submission.')}
            </p>
          </div>

          {/* Teacher Score Input */}
          <div className="tsd-score-card">
            <label className="tsd-card-label">
              {isVi ? 'Điểm Chấm Chính Thức (Thang 10)' : 'Official Final Score (Scale 10)'}
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
              <span className="text-xs text-slate-500">
                {isVi ? 'Thang điểm 0 - 10' : 'Score Scale 0 - 10'}
              </span>
            </div>
          </div>

          {/* Feedback Editor */}
          <div className="tsd-feedback-card">
            <h3 className="tsd-card-title">
              <MessageSquare size={16} /> {t('submissionDetails.feedbackTitle')}
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
                {isVi ? 'Ghi chú nội bộ giáo viên (chỉ giảng viên xem được)' : 'Private Teacher Notes'}
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
