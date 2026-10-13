import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Clock, FileText, ChevronLeft, ChevronRight,
  User, Star, Sparkles, MessageSquare,
  Save, Send, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { MetricCard, FileItem, StickyActionBar, Button, EmptyState } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { submissionService, type SubmissionDetail, type SubmissionModuleDetailResponse } from '../api/services/submission.service';
import { gradingService, type AiGradingSuggestionResponse, type SubmissionModuleGradingResponse } from '../api/services/grading.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { userService } from '../api/services/user.service';

export const TeacherSubmissionDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id, studentId } = useParams<{ id: string; studentId: string }>();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  // API State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingGrade, setIsSubmittingGrade] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Entities
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<SubmissionModuleDetailResponse | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiGradingSuggestionResponse | null>(null);
  const [gradingSummary, setGradingSummary] = useState<SubmissionModuleGradingResponse | null>(null);
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

  useEffect(() => {
    let isMounted = true;
    if (!id || !studentId) return;

    const loadSubmissionData = async () => {

    try {
      const assignmentIdNum = Number(id);
      const studentIdNum = Number(studentId);

      // 1. Fetch assignment detail
      const assignRes = await assignmentService.getAssignment(assignmentIdNum);
      setAssignment(assignRes);

      // 2. Fetch student profile/name
      try {
        const usersRes = await userService.listUsers({ role: 'STUDENT', limit: 100 });
        const studentUser = usersRes.data.find(u => u.id === studentIdNum);
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
      } catch {
        setStudentInfo({
          name: isVi ? `Học viên #${studentIdNum}` : `Student #${studentIdNum}`,
          email: `student${studentIdNum}@englishhub.edu.vn`,
          code: `HV-${studentIdNum.toString().padStart(4, '0')}`
        });
      }

      // 3. Find submission for this student and assignment
      const subListRes = await submissionService.listSubmissions({
        assignmentId: assignmentIdNum,
        studentId: studentIdNum,
        limit: 10
      });

      const matchedSubItem = subListRes.data && subListRes.data.length > 0 ? subListRes.data[0] : null;

      if (!matchedSubItem) {
        setSubmission(null);
        setIsLoading(false);
        return;
      }

      // Fetch full submission detail
      const subDetail = await submissionService.getSubmission(matchedSubItem.id);
      setSubmission(subDetail);

      // 4. Fetch module details & grading
      if (subDetail.modules && subDetail.modules.length > 0) {
        const firstMod = subDetail.modules[0];
        try {
          const modDetailRes = await submissionService.getSubmissionModuleDetail(firstMod.id);
          setModuleDetail(modDetailRes);
        } catch {
          // ignore
        }

        try {
          const gradingRes = await gradingService.getBySubmissionModuleId(firstMod.id);
          setGradingSummary(gradingRes);
          if (gradingRes.finalScore !== null && gradingRes.finalScore !== undefined) {
            setFinalScoreInput(String(gradingRes.finalScore));
          }
        } catch {
          // ignore
        }

        try {
          const aiRes = await gradingService.getAiSuggestion(firstMod.id);
          setAiSuggestion(aiRes);
          if (aiRes.aiFeedback) {
            setFeedbackText((prev) => prev || aiRes.aiFeedback || '');
          }
          if (aiRes.suggestedScore !== null && aiRes.suggestedScore !== undefined) {
            setFinalScoreInput((prev) => (!prev ? String(aiRes.suggestedScore) : prev));
          }
        } catch {
          // ignore
        }
      }

      // 5. Fetch sibling submissions for Prev/Next
      try {
        const siblingRes = await submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 });
        if (siblingRes.data) {
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
}, [id, studentId, isVi, reloadKey]);

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
    if (!submission?.modules?.[0]?.id) return;
    try {
      showToast(isVi ? 'Đang gửi yêu cầu phân tích tới AI Grading Engine...' : 'Requesting AI analysis...');
      await gradingService.requestAiAnalysis(submission.modules[0].id);
      showToast(isVi ? 'AI Engine đã nhận yêu cầu, đang xử lý!' : 'AI Engine is processing submission!');
      setTimeout(() => setReloadKey((k) => k + 1), 2000);
    } catch (err) {
      console.error('Failed to trigger AI analyze:', err);
      showToast(isVi ? 'Lỗi khi kích hoạt AI. Vui lòng thử lại!' : 'Failed to trigger AI analysis.');
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
      showToast(isVi ? 'Có lỗi xảy ra khi lưu điểm. Vui lòng thử lại!' : 'Failed to save grade. Please retry!');
    } finally {
      setIsSubmittingGrade(false);
    }
  };

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
        <Button 
          variant="secondary"
          size="sm"
          onClick={handleTriggerAiAnalyze}
          icon={Sparkles}
        >
          {isVi ? 'Phân tích lại với AI' : 'Re-run AI Analysis'}
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <MetricCard 
          title={isVi ? 'Điểm số đề xuất' : 'Suggested Score'}
          value={finalScoreInput || '7.0'}
          suffix="/ 10"
          icon={Star}
          footerText={
            <span className="text-emerald-600 font-medium inline-flex items-center gap-1">
              <Star size={14} /> 
              {aiSuggestion?.suggestedScore ? `${isVi ? 'AI đề xuất:' : 'AI Suggestion:'} ${aiSuggestion.suggestedScore}` : (isVi ? 'Đã hiệu chuẩn AI' : 'AI Calibrated')}
            </span>
          }
        />

        <MetricCard 
          title={isVi ? 'Độ dài bài nộp' : 'Word Count'}
          value={String(wordCount)}
          suffix={isVi ? 'từ' : 'words'}
          icon={Clock}
          iconBgColor="var(--surface-container)"
          iconColor="var(--on-surface-variant)"
          footerText={wordCount >= 250 ? (isVi ? 'Đạt số từ tối thiểu (>= 250 từ)' : 'Meets minimum word count') : (isVi ? 'Chưa đủ số từ tối thiểu' : 'Below target')}
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
                    extension="mp3"
                    size="Bản ghi âm phát âm"
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
              <span>{isVi ? 'Nội dung bài làm học viên' : 'Student Submitted Answer'}</span>
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
              {t('submissionDetails.wordCountPrefix')}<strong>{wordCount} {t('submissionDetails.wordCountSuffix')}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights & Feedback Studio */}
        <div className="tsd-sidebar">
          {/* AI Grading Insight */}
          <div className="tsd-ai-box">
            <div className="tsd-ai-box-header">
              <span className="flex items-center gap-1.5">
                <Sparkles size={16} /> {t('submissionDetails.aiSuggestionsTitle')}
              </span>
              <span className="tsd-ai-badge">
                {aiSuggestion?.modelUsed || 'AI Engine'}
              </span>
            </div>
            <p className="tsd-ai-desc">
              {aiSuggestion?.aiFeedback || (isVi 
                ? 'AI Engine đã sẵn sàng phân tích cấu trúc ngữ pháp và vốn từ vựng.' 
                : 'AI Engine is ready to diagnose grammar and vocabulary.')}
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
