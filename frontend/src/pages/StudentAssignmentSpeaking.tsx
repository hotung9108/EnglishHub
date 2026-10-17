import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  MicOff, 
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { submissionService, type SubmissionDetail } from '../api/services/submission.service';
import { Button } from '../components/common';
import '../styles/student-speaking.css';

const StudentAssignmentSpeaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [id]);

  const [reloadKey, setReloadKey] = useState(0);
  const handleRetry = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch assignment details
        let currentAssignment: AssignmentDetail | null = null;
        try {
          currentAssignment = await assignmentService.getAssignment(numericId);
          if (isMounted) setAssignment(currentAssignment);
        } catch {
          currentAssignment = {
            id: numericId,
            title: `Speaking Practice #${id || '1'}`,
            status: 'PUBLISHED',
            modules: [{ id: 1, skill: 'SPEAKING' }]
          };
          if (isMounted) setAssignment(currentAssignment);
        }

        // 2. Fetch speaking module details
        const speakingMod = currentAssignment?.modules?.find((m) => m.skill?.toUpperCase() === 'SPEAKING');
        const moduleId = speakingMod?.id || currentAssignment?.modules?.[0]?.id;
        if (moduleId) {
          try {
            const mod = await moduleService.getModule(moduleId);
            if (isMounted) setModuleDetail(mod);
          } catch {
            // Fallback
          }
        }

        // 3. Resolve or start submission attempt
        const urlSubmissionId = searchParams.get('submissionId');
        if (urlSubmissionId && Number.isFinite(Number(urlSubmissionId))) {
          try {
            const sub = await submissionService.getSubmission(Number(urlSubmissionId));
            if (isMounted) setSubmission(sub);
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
              if (isMounted) setSubmission(sub);
            } else {
              const startRes = await submissionService.startAttempt(numericId);
              const sub = await submissionService.getSubmission(startRes.id);
              if (isMounted) setSubmission(sub);
            }
          } catch {
            // Fallback
          }
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải đề bài nói.';
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [numericId, id, searchParams, user?.id, reloadKey]);

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
      const speakingSubMod = submission?.modules?.find((m) => m.skill?.toUpperCase() === 'SPEAKING');
      const subModuleId = speakingSubMod?.id || submission?.modules?.[0]?.id;

      if (subModuleId) {
        try {
          await submissionService.submitModule(subModuleId, {});
        } catch {
          // Continue
        }
      }

      // Check if all modules in this submission are now completed
      const otherModules = submission?.modules?.filter((m) => m.id !== subModuleId) || [];
      const allOthersDone = otherModules.length === 0 || otherModules.every((m) => m.status === 'SUBMITTED' || m.status === 'GRADED');

      if (subId && allOthersDone) {
        try {
          await submissionService.submitSubmission(subId);
        } catch {
          // Continue
        }
      }

      if (allOthersDone) {
        setSuccessMessage('Nộp bài thành công!');
        setTimeout(() => {
          if (subId) {
            navigate(`/student/submissions/${subId}`);
          } else {
            navigate(`/student/assignments/${id}/result`);
          }
        }, 1200);
      } else {
        setSuccessMessage('Đã hoàn thành phần thi Speaking!');
        setTimeout(() => {
          navigate(`/student/assignments/${id}/overview`);
        }, 1200);
      }
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
          <span>Quay lại danh sách bài tập</span>
        </button>
        <span className="speaking-breadcrumb-sep">/</span>
        <span className="speaking-breadcrumb-current">
          {assignment?.title || `Speaking Practice #${id}`}
        </span>
      </div>

      {error && (
        <div className="speaking-error-banner">
          <div className="speaking-error-msg">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleRetry}
            icon={RefreshCw}
          >
            Thử lại
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="speaking-success-banner">
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div className="speaking-grid">
        {/* Left Column (Main Stage) */}
        <div className="speaking-main-col">
          {/* Card 1: Cue Card / Prompt */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <div className="speaking-card-header-main">
                <h1 className="speaking-cue-title">
                  {isLoading ? 'Đang tải đề thi...' : (assignment?.title || 'Describe a difficult environmental issue')}
                </h1>
              </div>
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
            </div>
          </section>

          {/* Card 2: Voice Studio / Recorder */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                Phòng thu âm
              </h2>
              <span className={`speaking-card-timing ${isRecording ? 'recording' : ''}`}>
                {isRecording 
                  ? `Đang thu âm: ${formatTime(recordingSeconds)}` 
                  : recordedAudioReady 
                    ? `Đã thu âm: ${formatTime(recordingSeconds)}` 
                    : ''}
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
                    title="Thu âm lại từ đầu"
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button 
                    type="button"
                    className={`speaking-btn-record ${isRecording ? 'active' : ''}`}
                    onClick={toggleRecording}
                    title={isRecording ? 'Dừng thu âm' : 'Bắt đầu thu âm'}
                  >
                    {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                  </button>

                  <button 
                    type="button"
                    className="speaking-btn-icon"
                    onClick={togglePlay}
                    disabled={!recordedAudioReady}
                    title="Phát lại bản ghi"
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                </div>

                <div className="speaking-recorder-hint">
                  {isRecording ? (
                    <span className="speaking-status-recording">Đang ghi âm...</span>
                  ) : recordedAudioReady ? (
                    <span className="speaking-status-ready">
                      Đã ghi âm ({formatTime(recordingSeconds)})
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Personal Notes Box */}
              <div className="speaking-notes-section">
                <div className="speaking-notes-header">
                  <label htmlFor="speaking-prep-notes" className="speaking-notes-label">
                    Ghi chú chuẩn bị
                  </label>
                  {isNotesSaved && (
                    <span className="speaking-notes-saved-msg">
                      Đã lưu ghi chú thành công!
                    </span>
                  )}
                </div>
                <textarea 
                  id="speaking-prep-notes"
                  className="speaking-notes-textarea"
                  placeholder="Nhập dàn ý chuẩn bị..."
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  rows={4}
                />
                <div className="speaking-notes-action">
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveNotes}
                  >
                    Lưu ghi chú
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Submission & Grading */}
        <div className="speaking-side-col">
          {/* Card 1: Submission */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                Bài nộp
              </h2>
            </div>

            <div className="speaking-card-body">
              {/* Audio file block */}
              <div className="submission-file-box">
                <div className="submission-file-info">
                  <div className="submission-file-title">
                    {recordedAudioReady ? `speaking_attempt_${numericId}.mp3` : 'chua_co_ban_ghi.mp3'}
                  </div>
                  <div className="submission-file-meta">
                    {recordedAudioReady ? formatTime(recordingSeconds) : 'Chưa có bản ghi âm'}
                  </div>
                </div>
                <span className={`submission-file-status ${recordedAudioReady ? 'ready' : 'pending'}`}>
                  {recordedAudioReady ? 'Sẵn sàng nộp' : 'Chưa ghi âm'}
                </span>
              </div>

              {/* Submit CTA */}
              <button 
                className="btn-submit-speaking"
                onClick={handleSubmitAssignment}
                disabled={isSubmitting || !recordedAudioReady}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang gửi bài...</span>
                  </>
                ) : (
                  <span>Nộp bài</span>
                )}
              </button>
            </div>
          </section>

          {/* Card 2: Grading Scale */}
          <section className="speaking-card">
            <div className="speaking-card-header">
              <h2 className="speaking-card-title">
                Tiêu chí chấm điểm
              </h2>
            </div>

            <div className="speaking-card-body">
              <div className="grading-row">
                <span className="grading-label">Tổng điểm</span>
                <span className="grading-val-total">100</span>
              </div>

              {/* Criteria breakdown */}
              <div className="grading-row">
                <span className="grading-label">Phát âm</span>
                <span className="grading-val-weight">25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">Độ trôi chảy &amp; Mạch lạc</span>
                <span className="grading-val-weight">25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">Từ vựng</span>
                <span className="grading-val-weight">25%</span>
              </div>
              <div className="grading-row">
                <span className="grading-label">Ngữ pháp</span>
                <span className="grading-val-weight">25%</span>
              </div>

              {/* Current Score Display */}
              <div className="grading-current-grade">
                <div className="speaking-eval-title">
                  Điểm số
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
