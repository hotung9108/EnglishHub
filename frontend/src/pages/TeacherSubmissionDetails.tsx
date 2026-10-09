import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Download, Printer, Clock, FileText, ChevronLeft, ChevronRight,
  User, Star, Sparkles, MessageSquare,
  Save, Send, RefreshCw, AlertCircle, CheckCircle2
} from 'lucide-react';
import { MetricCard, FileItem, StickyActionBar } from '../components/common';
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
  const [finalScoreInput, setFinalScoreInput] = useState<string>('7.5');
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
            setFinalScoreInput((prev) => (prev === '7.5' ? String(aiRes.suggestedScore) : prev));
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
      <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '800px', margin: '40px auto' }}>
        <RefreshCw size={36} color="#4f46e5" className="animate-spin" style={{ margin: '0 auto 16px auto', display: 'block' }} />
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          {isVi ? 'Đang tải bài làm học viên và phân tích AI...' : 'Loading student submission & AI insights...'}
        </h3>
        <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          {isVi ? 'Đang kết nối hệ thống chấm chữa và bài nộp thực tế.' : 'Connecting to grading engine and live answers.'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px', backgroundColor: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <AlertCircle size={24} color="#dc2626" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#b91c1c' }}>{error}</h3>
        </div>
        <button 
          className="btn btn-secondary bg-white btn-sm"
          onClick={handleRetry}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          <span>{isVi ? 'Thử lại' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  if (!submission) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <FileText size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto', display: 'block', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          {isVi ? 'Học viên này chưa nộp bài tập' : 'No submission found for this student'}
        </h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '13.5px', color: '#64748b' }}>
          {studentInfo?.name || 'Học viên'} {isVi ? 'hiện chưa hoàn thành nộp bài tập này.' : 'has not submitted this assignment yet.'}
        </p>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => navigate(`/teacher/assignments/${id}`)}
        >
          <ArrowLeft size={14} />
          <span>{t('submissionDetails.backToList')}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumbs & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate(`/teacher/assignments/${id}`)}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px', 
              color: '#2563EB', background: 'none', border: 'none', 
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, padding: 0
            }}
          >
            <ArrowLeft size={16} /> {t('submissionDetails.backToList')}
          </button>
        </div>
        
        {classSubmissions.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '4px', border: '1px solid #E2E8F0' }}>
              <button 
                onClick={() => handleNavigateSibling('prev')}
                style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 500 }}
              >
                <ChevronLeft size={14} /> {t('submissionDetails.btnPrev')}
              </button>
              <span style={{ padding: '0 8px', fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace' }}>
                {currentIndex + 1} / {classSubmissions.length}
              </span>
              <button 
                onClick={() => handleNavigateSibling('next')}
                style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: 'none', color: '#2563EB', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
              >
                {t('submissionDetails.btnNextPrefix')} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Header Info */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            {assignment?.title || 'BÀI TẬP TIẾNG ANH'}
          </h1>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
            IELTS Standard
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>
          {isVi ? 'Bài nộp lần' : 'Attempt'} #{submission.attemptNumber} • {t('submissionDetails.targetBandPrefix')} <span style={{ fontWeight: 600, color: '#334155' }}>6.5 - 7.5</span>
        </p>
      </div>

      {/* Quick Actions Bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button 
          className="btn btn-secondary bg-white btn-sm" 
          onClick={() => showToast(isVi ? 'Đang chuẩn bị tải về bài nộp...' : 'Downloading submission...')}
          style={{ fontWeight: 500, color: '#334155', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
        >
          <Download size={14} color="#64748B" /> {t('submissionDetails.btnDownloadAll')}
        </button>
        <button 
          className="btn btn-secondary bg-white btn-sm" 
          onClick={() => window.print()}
          style={{ fontWeight: 500, color: '#334155', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
        >
          <Printer size={14} color="#64748B" /> {t('submissionDetails.btnPrint')}
        </button>
        <button 
          className="btn btn-secondary bg-white btn-sm"
          onClick={handleTriggerAiAnalyze}
          style={{ fontWeight: 600, color: '#4338ca', backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}
        >
          <Sparkles size={14} color="#4f46e5" />
          <span>{isVi ? 'Phân tích lại với AI' : 'Re-run AI Analysis'}</span>
        </button>
      </div>

      {/* Student Banner */}
      <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} color="#94A3B8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {studentInfo?.name || 'Học viên'}
              </h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' }}>
                {submission.status === 'GRADED' ? (isVi ? 'Đã có điểm' : 'Graded') : t('submissionDetails.statusSubmitted')}
              </span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>
                {studentInfo?.code || `HV-${studentId}`}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>{studentInfo?.email}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#94A3B8', fontSize: '11px' }}>{t('submissionDetails.submissionTimePrefix')}</div>
            <div style={{ fontWeight: 600, color: '#334155' }}>
              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Vừa xong'}
            </div>
          </div>
          <div style={{ width: '1px', height: '32px', backgroundColor: '#E2E8F0' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            <span style={{ fontWeight: 500, color: '#334155' }}>{t('submissionDetails.statusOnTime')}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Score Card */}
        <MetricCard 
          title={isVi ? 'Điểm số đề xuất (Band Score)' : 'Band Score'}
          value={finalScoreInput || '7.0'}
          suffix="/ 9.0"
          icon={<Star size={16} />}
          footerText={
            <span style={{ color: 'var(--success)', fontWeight: 500 }}>
              <Star size={14} style={{ display: 'inline', verticalAlign: 'middle' }}/> 
              {aiSuggestion?.suggestedScore ? `AI Pre-score: Band ${aiSuggestion.suggestedScore}` : 'AI Calibrated'}
            </span>
          }
        />

        {/* Time Spent Card */}
        <MetricCard 
          title={isVi ? 'Độ dài bài nộp' : 'Word Count'}
          value={String(wordCount)}
          suffix={isVi ? 'từ' : 'words'}
          icon={<Clock size={16} />}
          iconBgColor="var(--surface-container)"
          iconColor="var(--on-surface-variant)"
          footerText={wordCount >= 250 ? (isVi ? 'Đạt tiêu chuẩn Task 2 (>= 250 từ)' : 'Meets standard') : (isVi ? 'Cần bổ sung thêm từ vựng' : 'Below target')}
        />
      </div>

      {/* Submission Files & Attachments */}
      {moduleDetail?.answers && moduleDetail.answers.some(a => a.docStorageKey || a.audioStorageKey) && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <FileText size={16} color="#2563EB" /> {t('submissionDetails.filesTitle')}
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <style>{`
          @media (min-width: 1024px) {
            .grading-grid { grid-template-columns: 7fr 5fr !important; }
          }
        `}</style>
        <div className="grading-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* Left Column: Student Answer Viewer */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500, color: '#334155' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></span>
                <span>{isVi ? 'Nội dung bài làm học viên' : 'Student Submitted Answer'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {wordCount} {isVi ? 'từ' : 'words'}
                </span>
              </div>
            </div>

            <div style={{ padding: '24px', fontFamily: 'serif', color: '#1E293B', lineHeight: 1.8, fontSize: '15px', maxHeight: '580px', overflowY: 'auto' }}>
              <div style={{ fontFamily: 'sans-serif', fontWeight: 600, fontSize: '13px', color: '#94A3B8', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9', letterSpacing: '0.025em', textTransform: 'uppercase', marginBottom: '16px' }}>
                {assignment?.title || 'IELTS TASK PROMPT'}
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                {studentAnswerText}
              </p>
            </div>

            <div style={{ padding: '10px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>{t('submissionDetails.wordCountPrefix')}<strong style={{ color: '#1E293B', fontWeight: 600 }}>{wordCount} {t('submissionDetails.wordCountSuffix')}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights & Feedback Studio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* AI Grading Insight */}
            <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'rgba(239, 246, 255, 0.8)', border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#1E3A8A', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="#2563EB" /> {t('submissionDetails.aiSuggestionsTitle')}
                </span>
                <span style={{ fontSize: '10px', backgroundColor: 'rgba(191, 219, 254, 0.7)', color: '#1E40AF', padding: '2px 6px', borderRadius: '4px', fontWeight: 500 }}>
                  {aiSuggestion?.modelUsed || 'AI Engine'}
                </span>
              </div>
              <p style={{ color: '#334155', lineHeight: 1.6, fontSize: '12px', margin: 0 }}>
                {aiSuggestion?.aiFeedback || (isVi 
                  ? 'AI Engine đã sẵn sàng phân tích cấu trúc ngữ pháp, vốn từ vựng và tiêu chí IELTS.' 
                  : 'AI Engine is ready to diagnose grammar and criteria.')}
              </p>
            </div>

            {/* Teacher Score Input */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
                {isVi ? 'Điểm Chấm Chính Thức (Band Score / Thang 10)' : 'Official Final Score'}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="number" 
                  step="0.5" 
                  min="0" 
                  max="10"
                  value={finalScoreInput}
                  onChange={(e) => setFinalScoreInput(e.target.value)}
                  style={{
                    width: '120px',
                    padding: '8px 12px',
                    fontSize: '18px',
                    fontWeight: 800,
                    borderRadius: '8px',
                    border: '2px solid #2563eb',
                    color: '#1e3a8a',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  {isVi ? 'Thang điểm Band 0.0 - 9.0' : 'Score Scale 0.0 - 9.0'}
                </span>
              </div>
            </div>

            {/* Feedback Editor */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.025em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <MessageSquare size={16} color="#475569" /> {t('submissionDetails.feedbackTitle')}
                </h3>
              </div>

              <textarea 
                style={{ 
                  width: '100%', fontSize: '13px', color: '#1E293B', borderColor: '#E2E8F0', 
                  borderRadius: '8px', outline: 'none',
                  padding: '12px', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box'
                }} 
                placeholder={t('submissionDetails.feedbackPlaceholder')} 
                rows={5}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                  {isVi ? 'Ghi chú nội bộ giáo viên (chỉ giảng viên xem được)' : 'Private Teacher Notes'}
                </label>
                <input 
                  type="text"
                  placeholder={isVi ? 'Ghi chú thêm về học viên này...' : 'Internal note...'}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12.5px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <StickyActionBar 
        leftActions={
          <>
            <button 
              className="btn btn-secondary border-none" 
              onClick={() => navigate(`/teacher/assignments/${id}`)}
              style={{ color: '#475569' }}
            >
              {isVi ? 'Quay lại' : 'Back'}
            </button>
            <button 
              className="btn btn-secondary" 
              disabled={isSubmittingGrade}
              onClick={() => handleSaveGrade(false)}
              style={{ backgroundColor: '#F1F5F9', color: '#334155' }}
            >
              <Save size={14} color="#64748B" /> {t('submissionDetails.btnSaveDraft')}
            </button>
          </>
        }
        rightActions={
          <button 
            className="btn btn-primary" 
            disabled={isSubmittingGrade}
            onClick={() => handleSaveGrade(true)}
            style={{ fontWeight: 700 }}
          >
            {isSubmittingGrade ? <RefreshCw size={14} className="animate-spin" /> : <Send size={16} />}
            <span>{isSubmittingGrade ? (isVi ? 'Đang lưu...' : 'Submitting...') : t('submissionDetails.btnSend')}</span>
          </button>
        }
      />
    </div>
  );
};

export default TeacherSubmissionDetails;
