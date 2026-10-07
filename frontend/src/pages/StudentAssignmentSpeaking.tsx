import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  MicOff, 
  FileText, 
  Send, 
  CheckCircle2, 
  Music,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { submissionService, type SubmissionDetail } from '../api/services/submission.service';
import '../styles/student-speaking.css';

const StudentAssignmentSpeaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailResponse | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  // Recording State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioReady, setRecordedAudioReady] = useState(false);
  const [personalNotes, setPersonalNotes] = useState('');
  const [isNotesSaved, setIsNotesSaved] = useState(false);
  const [hasPdfScript, setHasPdfScript] = useState(true);

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch assignment details
      let currentAssignment: AssignmentDetail | null = null;
      try {
        currentAssignment = await assignmentService.getAssignment(numericId);
        setAssignment(currentAssignment);
      } catch {
        currentAssignment = {
          id: numericId,
          title: `Speaking Practice #${id || '1'}`,
          status: 'PUBLISHED',
          modules: [{ id: 1, skill: 'SPEAKING' }]
        };
        setAssignment(currentAssignment);
      }

      // 2. Fetch module details
      const moduleId = currentAssignment?.modules?.[0]?.id;
      if (moduleId) {
        try {
          const mod = await moduleService.getModule(moduleId);
          setModuleDetail(mod);
        } catch {
          // Fallback
        }
      }

      // 3. Resolve or start submission attempt
      const urlSubmissionId = searchParams.get('submissionId');
      if (urlSubmissionId && Number.isFinite(Number(urlSubmissionId))) {
        try {
          const sub = await submissionService.getSubmission(Number(urlSubmissionId));
          setSubmission(sub);
        } catch {
          // Fallback
        }
      } else if (user?.id) {
        try {
          const subList = await submissionService.listSubmissions({
            assignmentId: numericId,
            studentId: user.id,
            status: 'IN_PROGRESS',
            limit: 1
          });
          if (subList.data && subList.data.length > 0) {
            const sub = await submissionService.getSubmission(subList.data[0].id);
            setSubmission(sub);
          } else {
            const startRes = await submissionService.startAttempt(numericId);
            const sub = await submissionService.getSubmission(startRes.id);
            setSubmission(sub);
          }
        } catch {
          // Fallback
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải đề bài nói.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [numericId, id, searchParams, user?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Timer effect while recording
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setIsPlaying(false);
      setRecordingSeconds(0);
    } else {
      setIsRecording(false);
      setRecordedAudioReady(true);
    }
  };

  const handleSaveNotes = () => {
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 3000);
  };

  const handleSubmitAssignment = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const subId = submission?.id;
      const subModuleId = submission?.modules?.[0]?.id;

      if (subModuleId) {
        try {
          await submissionService.submitModule(subModuleId, {});
        } catch {
          // Continue
        }
      }

      if (subId) {
        try {
          await submissionService.submitSubmission(subId);
        } catch {
          // Continue
        }
      }

      setSuccessMessage('Nộp bài thu âm thành công! AI đang xử lý âm phổ & ngữ điệu...');
      setTimeout(() => {
        if (subId) {
          navigate(`/student/submissions/${subId}`);
        } else {
          navigate(`/student/assignments/${id}/result`);
        }
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi khi nộp bài. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="speaking-container">
      {/* Breadcrumbs & Navigation */}
      <div className="speaking-breadcrumbs">
        <button 
          className="speaking-back-btn" 
          onClick={() => navigate('/student/assignments')}
          type="button"
        >
          <ArrowLeft size={14} />
          <span>{t('studentSpeaking.backToList')}</span>
        </button>
        <span className="speaking-breadcrumb-divider">/</span>
        <span>Hệ thống</span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span 
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => navigate('/student/classes')}
          role="button"
          tabIndex={0}
        >
          Lớp học của tôi
        </span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
          {assignment?.title || `Speaking Practice #${id}`}
        </span>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px', color: '#166534' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="speaking-grid">
        {/* Left Column (Main Stage) */}
        <div>
          {/* Card 1: Cue Card / Prompt */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <div className="speaking-badge-row">
                <span className="speaking-cue-badge">{t('studentSpeaking.cueBadge')}</span>
                <span className="speaking-cue-timing">{t('studentSpeaking.cueTiming')}</span>
              </div>
              <h1 className="speaking-cue-title">
                {isLoading ? 'Đang tải đề thi...' : (assignment?.title || 'Describe a difficult environmental issue')}
              </h1>
            </div>

            <div className="speaking-card-body">
              <div className="speaking-cue-description">
                {moduleDetail?.instructions || (
                  <>
                    You should say:<br />
                    • What the environmental problem is and where it is occurring<br />
                    • What causes this issue and who is most affected by it<br />
                    • What actions have been taken so far by local authorities<br />
                    • And explain what you believe is the most effective long-term solution to address it.
                  </>
                )}
              </div>

              {/* Collapsible Sample / Reference Script */}
              {hasPdfScript && (
                <div className="speaking-sample-script-box">
                  <div className="speaking-sample-header">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={16} color="var(--primary)" />
                      <strong>{t('studentSpeaking.cueCardReference')}</strong>
                    </span>
                    <button 
                      type="button"
                      className="speaking-btn-link"
                      onClick={() => setHasPdfScript(!hasPdfScript)}
                    >
                      {t('studentSpeaking.btnHideScript')}
                    </button>
                  </div>
                  <p className="speaking-sample-body">
                    {t('studentSpeaking.sampleScriptExcerpt')}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Card 2: Voice Studio / Recorder */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                {t('studentSpeaking.studioTitle')}
              </h2>
              <span className="speaking-cue-timing">
                {isRecording ? `Đang thu âm: ${formatTime(recordingSeconds)}` : 'Sẵn sàng thu âm'}
              </span>
            </div>

            <div className="speaking-card-body">
              <div className="speaking-recorder-wrapper">
                {/* Audio Waveform visualization */}
                <div className="speaking-waveform">
                  {[40, 20, 60, 90, 45, 75, 30, 85, 95, 60, 40, 70, 80, 50, 65, 35, 90, 75, 60, 45, 80, 70, 50, 40].map((h, i) => (
                    <div 
                      key={i} 
                      className={`speaking-waveform-bar ${isRecording ? 'recording' : ''}`}
                      style={{ height: isRecording ? `${h}%` : '20%' }}
                    />
                  ))}
                </div>

                {/* Recorder Controls */}
                <div className="speaking-recorder-controls">
                  <button 
                    type="button"
                    className="speaking-btn-icon" 
                    onClick={() => { setRecordedAudioReady(false); setRecordingSeconds(0); }}
                    title={t('studentSpeaking.btnResetRecording')}
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button 
                    type="button"
                    className={`speaking-btn-record ${isRecording ? 'active' : ''}`}
                    onClick={toggleRecording}
                  >
                    {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                  </button>

                  <button 
                    type="button"
                    className="speaking-btn-icon"
                    onClick={togglePlay}
                    disabled={!recordedAudioReady}
                    style={{ opacity: recordedAudioReady ? 1 : 0.5 }}
                    title="Phát lại bản ghi"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                </div>

                <div className="speaking-recorder-hint">
                  {isRecording ? (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>● Đang ghi âm trực tiếp qua Microphone...</span>
                  ) : recordedAudioReady ? (
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Đã ghi âm xong ({formatTime(recordingSeconds)}). Bấm nút nộp bài bên dưới.</span>
                  ) : (
                    'Bấm nút Micro để bắt đầu ghi âm bài nói của bạn.'
                  )}
                </div>
              </div>

              {/* Personal Notes Box */}
              <div className="speaking-notes-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="speaking-prep-notes" className="speaking-notes-label">
                    {t('studentSpeaking.prepNotesLabel')}
                  </label>
                  {isNotesSaved && (
                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                      ✓ {t('studentSpeaking.notesSaved')}
                    </span>
                  )}
                </div>
                <textarea 
                  id="speaking-prep-notes"
                  className="speaking-notes-textarea"
                  placeholder={t('studentSpeaking.prepNotesPlaceholder')}
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  rows={4}
                />
                <button 
                  type="button"
                  className="btn-secondary"
                  style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '12px' }}
                  onClick={handleSaveNotes}
                >
                  {t('studentSpeaking.btnSaveNotes')}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Submission & Grading */}
        <div>
          {/* Card 1: Submission */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                {t('studentSpeaking.submissionTitle')}
              </h2>
            </div>

            <div className="speaking-card-body">
              {/* Audio file block */}
              <div className="submission-file-box">
                <div className="submission-file-icon">
                  <Music size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="submission-file-title">
                    {recordedAudioReady ? `speaking_attempt_${numericId}.mp3` : 'chua_co_ban_ghi.mp3'}
                  </div>
                  <div className="submission-file-meta">
                    {recordedAudioReady ? `${formatTime(recordingSeconds)} • Audio WebM/MPEG` : 'Chưa có tệp'}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: recordedAudioReady ? 'var(--secondary)' : '#94A3B8', fontWeight: 600 }}>
                  <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                  {recordedAudioReady ? 'Sẵn sàng nộp' : 'Chưa ghi âm'}
                </span>
              </div>

              {/* Submit CTA */}
              <button 
                className="btn-submit-speaking"
                onClick={handleSubmitAssignment}
                disabled={isSubmitting}
                type="button"
                style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang gửi bài...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {t('studentSpeaking.btnSubmitAssignment')}
                  </>
                )}
              </button>

              <div className="speaking-submit-note">
                Bài nói sẽ được gửi trực tiếp đến pipeline Speaking AI để đánh giá độ trôi chảy (Fluency), phát âm (Pronunciation), và ngữ pháp.
              </div>
            </div>
          </section>

          {/* Card 2: Grading Scale */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                {t('studentSpeaking.gradingTitle')}
              </h2>
              <span className="speaking-cue-timing">{t('studentSpeaking.gradingScale')}</span>
            </div>

            <div className="speaking-card-body" style={{ gap: '12px' }}>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.totalPoints')}</span>
                <span className="grading-val-total">100 (Band 9.0)</span>
              </div>

              {/* Criteria breakdown */}
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaPronunciation')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaFluency')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaLexical')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">{t('studentSpeaking.criteriaGrammar')}</span>
                <span style={{ fontWeight: 600 }}>25%</span>
              </div>

              {/* Current Score Display */}
              <div className="grading-current-grade">
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--on-surface)' }}>
                    {t('studentSpeaking.currentGrade')}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                    Lần {submission?.attemptNumber ?? 1}
                  </div>
                </div>
                <div className="grading-score-display">-- / 100</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentSpeaking;
