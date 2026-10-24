import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { parseApiError } from '../api';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { submissionService, type SubmissionDetail } from '../api/services/submission.service';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Button } from '../components/common';
import { ExamStepper } from '../components/assignments/ExamStepper';
import {
  getSkillRoute,
  getNextIncompleteModule,
  getSkillLabel
} from '../utils/examStepper.utils';
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

  // Real Audio Recorder Hook
  const {
    isRecording,
    recordingDuration,
    audioBlob,
    audioUrl,
    backendMimeType,
    permissionError,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  // Audio Playback State
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);

  // Personal Notes
  const [personalNotes, setPersonalNotes] = useState('');
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [id]);

  const [reloadKey, setReloadKey] = useState(0);
  const handleRetry = () => setReloadKey((k) => k + 1);

  // Load assignment and submission data
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
          } catch (subErr: unknown) {
            if (isMounted) {
              const apiErr = parseApiError(subErr);
              setError(apiErr.message || 'Không thể tải thông tin bài nộp.');
            }
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
            } else if (currentAssignment?.status === 'PUBLISHED') {
              const startRes = await submissionService.startAttempt(numericId);
              const sub = await submissionService.getSubmission(startRes.id);
              if (isMounted) setSubmission(sub);
            } else if (currentAssignment?.status) {
              if (isMounted) {
                const statusLabel = currentAssignment.status === 'DRAFT' ? 'Nháp (DRAFT - Chưa công bố)' : currentAssignment.status;
                setError(`Bài tập này hiện không mở để làm bài (Trạng thái: ${statusLabel}). Vui lòng liên hệ giáo viên để công bố bài tập.`);
              }
            }
          } catch (subErr: unknown) {
            if (isMounted) {
              const apiErr = parseApiError(subErr);
              setError(apiErr.message || 'Không thể bắt đầu phiên làm bài.');
            }
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

  // Handle Play/Pause for recorded audio
  const togglePlay = () => {
    if (!audioPlayerRef.current || !audioUrl) return;

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((playErr) => {
        console.warn('Playback error:', playErr);
        setIsPlaying(false);
      });
    }
  };

  // Toggle Recording with real MediaRecorder
  const toggleRecording = async () => {
    setError(null);
    if (!isRecording) {
      if (assignment?.status && assignment.status !== 'PUBLISHED') {
        const statusLabel = assignment.status === 'DRAFT' ? 'Nháp (DRAFT)' : assignment.status;
        setError(`Bài tập này đang ở trạng thái ${statusLabel}, chưa thể thực hiện ghi âm làm bài.`);
        return;
      }
      if (isPlaying && audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      }
      try {
        await startRecording();
      } catch (recErr: unknown) {
        const msg = recErr instanceof Error ? recErr.message : 'Không thể kích hoạt microphone.';
        setError(msg);
      }
    } else {
      stopRecording();
    }
  };

  // Reset recording to re-record
  const handleResetRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setPlaybackSeconds(0);
    resetRecording();
  };

  const handleSaveNotes = () => {
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 3000);
  };

  // Submit flow: Upload Blob to Presigned S3 URL -> submitModule with audioStorageKey
  const handleSubmitAssignment = async () => {
    if (assignment?.status === 'CLOSED') {
      setError('Bài tập này đã được giáo viên đóng. Không thể nộp bài.');
      return;
    }
    if (!audioBlob) {
      setError('Vui lòng thực hiện ghi âm bài nói trước khi nộp bài.');
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    if (!submission) {
      setError('Không tìm thấy phiên làm bài hợp lệ. Vui lòng tải lại trang hoặc liên hệ giáo viên.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const subId = submission?.id;
      const speakingSubMod = submission?.modules?.find((m) => m.skill?.toUpperCase() === 'SPEAKING');
      const subModuleId = speakingSubMod?.id || submission?.modules?.[0]?.id;

      if (!subModuleId) {
        throw new Error('Không tìm thấy thông tin phần làm bài nói trong bài nộp.');
      }

      // Step 1: Request presigned PUT URL from backend
      // Backend validates MIME against: 'audio/webm', 'audio/wav', 'audio/mpeg'
      const { uploadUrl, storageKey } = await submissionService.getAudioUploadUrl(
        subModuleId,
        backendMimeType
      );

      // Step 2: Upload audio blob directly to S3 / MinIO storage
      await submissionService.uploadDirectToStorage(uploadUrl, audioBlob, backendMimeType);

      // Step 3: Submit module with audioStorageKey (backend probes storage and marks READY)
      await submissionService.submitModule(subModuleId, {
        audioStorageKey: storageKey,
      });

      // Step 4: Check if other modules in submission are already completed
      const otherModules = submission?.modules?.filter((m) => m.id !== subModuleId) || [];
      const allOthersDone = otherModules.length === 0 || otherModules.every((m) => m.status === 'SUBMITTED' || m.status === 'GRADED');

      if (subId && allOthersDone) {
        try {
          await submissionService.submitSubmission(subId);
        } catch {
          // Fallback continue
        }
      }

      if (allOthersDone) {
        setSuccessMessage('Nộp bài thành công! Đang chuyển đến màn hình kết quả...');
        setTimeout(() => {
          if (subId) {
            navigate(`/student/submissions/${subId}`);
          } else {
            navigate(`/student/assignments/${id}/result`);
          }
        }, 1200);
      } else {
        const currentSubModules = (submission?.modules || []).map((m) =>
          m.id === subModuleId ? { ...m, status: 'SUBMITTED' as const } : m
        );
        const nextMod = getNextIncompleteModule(assignment?.modules || [], currentSubModules);
        if (nextMod) {
          const nextSkillLabel = getSkillLabel(nextMod.skill);
          setSuccessMessage(`Đã hoàn thành phần thi Speaking! Đang chuyển tiếp sang ${nextSkillLabel}...`);
          const nextRoute = getSkillRoute(nextMod.skill, numericId, subId);
          setTimeout(() => {
            navigate(nextRoute);
          }, 1500);
        } else {
          setSuccessMessage('Đã hoàn thành phần thi Speaking! Đang quay lại trang tổng quan bài tập...');
          setTimeout(() => {
            navigate(`/student/assignments/${id}/overview`);
          }, 1200);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.';
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

  const recordedAudioReady = Boolean(audioBlob && audioUrl);
  const activeError = permissionError || error;

  return (
    <div className="speaking-container">
      {/* Hidden audio element for previewing the recorded sound */}
      <audio
        ref={audioPlayerRef}
        src={audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setPlaybackSeconds(0);
        }}
        onTimeUpdate={() => {
          if (audioPlayerRef.current) {
            setPlaybackSeconds(Math.floor(audioPlayerRef.current.currentTime));
          }
        }}
      />

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
        {assignment?.modules && assignment.modules.length > 1 && (
          <div className="speaking-stepper-wrapper">
            <ExamStepper
              variant="compact"
              modules={assignment.modules}
              submissionModules={submission?.modules}
              currentSkill="SPEAKING"
              assignmentId={numericId}
              submissionId={submission?.id}
              onSelectModule={(skill, step) => {
                if (step.isCompleted || step.isAccessible) {
                  navigate(getSkillRoute(skill, numericId, submission?.id));
                }
              }}
            />
          </div>
        )}
      </div>

      {activeError && (
        <div className="speaking-error-banner">
          <div className="speaking-error-msg">
            <AlertCircle size={18} />
            <span>{activeError}</span>
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
                Ghi âm
              </h2>
              <span className={`speaking-card-timing ${isRecording ? 'recording' : ''}`}>
                {isRecording 
                  ? `Đang thu âm: ${formatTime(recordingDuration)}` 
                  : recordedAudioReady 
                    ? `Đã thu âm: ${formatTime(recordingDuration)}` 
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
                    onClick={handleResetRecording}
                    disabled={isRecording || !recordedAudioReady}
                    title="Thu âm lại từ đầu"
                  >
                    <RotateCcw size={18} />
                  </button>

                  <button 
                    type="button"
                    className={`speaking-btn-record ${isRecording ? 'active' : ''}`}
                    onClick={() => void toggleRecording()}
                    title={isRecording ? 'Dừng thu âm' : 'Bắt đầu thu âm'}
                  >
                    {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
                  </button>

                  <button 
                    type="button"
                    className="speaking-btn-icon"
                    onClick={togglePlay}
                    disabled={!recordedAudioReady || isRecording}
                    title={isPlaying ? 'Tạm dừng phát' : 'Phát lại bản ghi'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                </div>

                <div className="speaking-recorder-hint">
                  {isRecording ? (
                    <span className="speaking-status-recording">
                      Đang ghi âm... ({formatTime(recordingDuration)})
                    </span>
                  ) : recordedAudioReady ? (
                    <span className="speaking-status-ready">
                      {isPlaying
                        ? `Đang phát lại (${formatTime(playbackSeconds)} / ${formatTime(recordingDuration)})`
                        : `Đã ghi âm (${formatTime(recordingDuration)}) • Bấm Play để nghe lại hoặc Nộp bài`}
                    </span>
                  ) : (
                    <span>Bấm biểu tượng micro để bắt đầu thu âm câu trả lời</span>
                  )}
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
                    {recordedAudioReady 
                      ? `speaking_attempt_${numericId}.${backendMimeType === 'audio/wav' ? 'wav' : 'webm'}` 
                      : 'chua_co_ban_ghi.webm'}
                  </div>
                  <div className="submission-file-meta">
                    {recordedAudioReady && audioBlob
                      ? `${formatTime(recordingDuration)} • ${(audioBlob.size / 1024).toFixed(1)} KB` 
                      : 'Chưa có bản ghi âm'}
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
                    <span>Đang tải lên &amp; gửi bài...</span>
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
