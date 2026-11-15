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
  Loader2,
  UploadCloud,
  FileAudio,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { parseApiError } from '../api';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { submissionService, isSubmissionGraded, type SubmissionDetail, type SubmissionListItem, type SubmitModulePayload } from '../api/services/submission.service';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { Button } from '../components/common';
import { ExamStepper } from '../components/assignments/ExamStepper';
import {
  getSkillRoute,
  getNextIncompleteModule,
  getSkillLabel,
  getExamPageRedirectRoute,
  resolveEffectiveModules
} from '../utils/examStepper.utils';
import { notifyAssignmentSubmitted } from '../utils/assignmentEvents.utils';
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
  const [showEmptyConfirmModal, setShowEmptyConfirmModal] = useState(false);

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

  // Audio Input Mode (Mic vs Upload - UC017 / FE-91)
  const [audioInputMode, setAudioInputMode] = useState<'mic' | 'upload'>('mic');
  const [uploadedAudioFile, setUploadedAudioFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_AUDIO_SIZE) {
      setError('Dung lượng tệp âm thanh không được vượt quá 25MB.');
      return;
    }

    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm', 'audio/m4a', 'audio/mp4', 'audio/x-m4a'];
    const isExtensionValid = /\.(mp3|wav|m4a|webm|mp4)$/i.test(file.name);
    if (!validTypes.includes(file.type) && !isExtensionValid) {
      setError('Định dạng tệp âm thanh không được hỗ trợ. Vui lòng tải lên tệp .mp3, .wav, .m4a hoặc .webm.');
      return;
    }

    setError(null);
    if (uploadedAudioUrl) {
      URL.revokeObjectURL(uploadedAudioUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setUploadedAudioFile(file);
    setUploadedAudioUrl(objectUrl);
  };

  const handleRemoveUploadedAudio = () => {
    if (uploadedAudioUrl) {
      URL.revokeObjectURL(uploadedAudioUrl);
    }
    setUploadedAudioFile(null);
    setUploadedAudioUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };


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

        // 2. Fetch speaking module details & initial submission in parallel
        const urlModId = searchParams.get('moduleId');
        const matchedMod = urlModId && Number.isFinite(Number(urlModId))
          ? currentAssignment?.modules?.find((m) => m.id === Number(urlModId))
          : null;
        const speakingMod = matchedMod || currentAssignment?.modules?.find((m) => m.skill?.toUpperCase() === 'SPEAKING');
        const moduleId = speakingMod?.id || currentAssignment?.modules?.[0]?.id;
        const urlSubmissionId = searchParams.get('submissionId');

        const [modRes, initialSubRes] = await Promise.allSettled([
          moduleId ? moduleService.getModule(moduleId) : Promise.reject('No module'),
          urlSubmissionId && Number.isFinite(Number(urlSubmissionId))
            ? submissionService.getSubmission(Number(urlSubmissionId))
            : user?.id
            ? submissionService.listSubmissions({
                assignmentId: numericId,
                studentId: user.id,
                limit: 10
              })
            : Promise.reject('No submission query')
        ]);

        if (!isMounted) return;

        if (modRes.status === 'fulfilled') {
          setModuleDetail(modRes.value);
        }

        // 3. Resolve or start submission attempt
        if (urlSubmissionId && Number.isFinite(Number(urlSubmissionId))) {
          if (initialSubRes.status === 'fulfilled' && 'id' in initialSubRes.value) {
            const sub = initialSubRes.value as SubmissionDetail;
            const redirectRoute = getExamPageRedirectRoute(
              sub,
              'SPEAKING',
              numericId,
              currentAssignment?.modules,
              moduleId
            );
            if (redirectRoute) {
              navigate(redirectRoute, { replace: true });
              return;
            }
            setSubmission(sub);
          } else if (initialSubRes.status === 'rejected') {
            const apiErr = parseApiError(initialSubRes.reason);
            setError(apiErr.message || 'Không thể tải thông tin bài nộp.');
          }
        } else if (user?.id) {
          try {
            let subs: SubmissionListItem[] = [];
            if (initialSubRes.status === 'fulfilled' && 'data' in initialSubRes.value) {
              subs = initialSubRes.value.data || [];
            } else {
              const subList = await submissionService.listSubmissions({
                assignmentId: numericId,
                studentId: user.id,
                limit: 10
              });
              subs = subList.data || [];
            }
            const inProgressItem = subs.find((s) => s.status === 'IN_PROGRESS');

            if (inProgressItem) {
              const sub = await submissionService.getSubmission(inProgressItem.id);
              if (!isMounted) return;
              const redirectRoute = getExamPageRedirectRoute(
                sub,
                'SPEAKING',
                numericId,
                currentAssignment?.modules,
                moduleId
              );
              if (redirectRoute) {
                navigate(redirectRoute, { replace: true });
                return;
              }
              setSubmission(sub);
            } else {
              const completedItem = subs.find(
                (s) => isSubmissionGraded(s) || s.status === 'SUBMITTED'
              );
              if (completedItem) {
                if (isMounted) {
                  navigate(`/student/submissions/${completedItem.id}`, { replace: true });
                }
                return;
              }

              if (currentAssignment?.status === 'PUBLISHED') {
                const startRes = await submissionService.startAttempt(numericId);
                const sub = await submissionService.getSubmission(startRes.id);
                if (!isMounted) return;
                const redirectRoute = getExamPageRedirectRoute(
                  sub,
                  'SPEAKING',
                  numericId,
                  currentAssignment?.modules,
                  moduleId
                );
                if (redirectRoute) {
                  navigate(redirectRoute, { replace: true });
                  return;
                }
                setSubmission(sub);
              } else if (currentAssignment?.status) {
                if (isMounted) {
                  const statusLabel = currentAssignment.status === 'DRAFT' ? 'Nháp (DRAFT - Chưa công bố)' : currentAssignment.status;
                  setError(`Bài tập này hiện không mở để làm bài (Trạng thái: ${statusLabel}). Vui lòng liên hệ giáo viên để công bố bài tập.`);
                }
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
  }, [numericId, id, searchParams, user?.id, reloadKey, navigate]);

  // Handle Play/Pause for recorded audio or uploaded audio
  const effectiveAudioUrl = audioInputMode === 'mic' ? audioUrl : uploadedAudioUrl;
  const effectiveBlobOrFile: Blob | File | null = audioInputMode === 'mic' ? audioBlob : uploadedAudioFile;
  const effectiveMimeType = audioInputMode === 'mic' 
    ? backendMimeType 
    : (uploadedAudioFile?.type || 'audio/mpeg');

  const togglePlay = () => {
    if (!audioPlayerRef.current || !effectiveAudioUrl) return;

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


  const effectiveModules = useMemo(
    () => resolveEffectiveModules(assignment?.modules, submission?.modules),
    [assignment?.modules, submission?.modules]
  );

  // Submit flow: Upload Blob to Presigned S3 URL -> submitModule with audioStorageKey
  const handleSubmitAssignment = async () => {
    if (assignment?.status === 'CLOSED') {
      setError('Bài tập này đã được giáo viên đóng. Không thể nộp bài.');
      return;
    }

    if (isRecording) {
      setError('Vui lòng bấm dừng ghi âm và nghe lại bản ghi trước khi nộp bài.');
      return;
    }

    if (!submission) {
      setError('Không tìm thấy phiên làm bài hợp lệ. Vui lòng tải lại trang hoặc liên hệ giáo viên.');
      return;
    }

    // Kịch bản học viên chưa ghi âm bài nói và chưa tải tệp -> hiển thị Modal cảnh báo xác nhận nộp rỗng
    if (!effectiveBlobOrFile) {
      setShowEmptyConfirmModal(true);
      return;
    }

    await doSubmitAssignment(effectiveBlobOrFile, effectiveMimeType);
  };

  const doSubmitAssignment = async (blobToSubmit: Blob | File | null, mimeTypeToUse?: string) => {
    setIsSubmitting(true);
    setError(null);
    setShowEmptyConfirmModal(false);

    try {
      const subId = submission?.id;
      const urlModId = searchParams.get('moduleId');
      const matchedSubMod = urlModId && Number.isFinite(Number(urlModId))
        ? submission?.modules?.find((m) => m.moduleId === Number(urlModId))
        : null;
      const speakingSubMod = matchedSubMod || submission?.modules?.find((m) => m.skill?.toUpperCase() === 'SPEAKING');
      const subModuleId = speakingSubMod?.id || submission?.modules?.[0]?.id;

      if (!subModuleId) {
        throw new Error('Không tìm thấy thông tin phần làm bài nói trong bài nộp.');
      }

      if (speakingSubMod && (speakingSubMod.status === 'SUBMITTED' || speakingSubMod.status === 'GRADED')) {
        navigate(`/student/submissions/${subId}`, { replace: true });
        return;
      }

      let uploadedAudioStorageKey: string | undefined = undefined;

      // Step 1: Upload audio using consolidated 2-in-1 helper if student recorded or uploaded
      if (blobToSubmit) {
        const uploadRes = await submissionService.uploadAudio(subModuleId, blobToSubmit, mimeTypeToUse || backendMimeType);
        uploadedAudioStorageKey = uploadRes.storageKey;
      }

      // Step 2: Submit module (with audioStorageKey if recorded, or empty if skipped)
      const submitPayload: SubmitModulePayload = {};
      if (uploadedAudioStorageKey) {
        submitPayload.audioStorageKey = uploadedAudioStorageKey;
      }
      await submissionService.submitModule(subModuleId, submitPayload);

      const currentSubModules = (submission?.modules || []).map((m) =>
        m.id === subModuleId ? { ...m, status: 'SUBMITTED' as const } : m
      );
      setSubmission((prev) => (prev ? { ...prev, modules: currentSubModules } : prev));

      // Step 3: Check if other modules in submission are already completed
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
        notifyAssignmentSubmitted();
        setSuccessMessage('Nộp bài thành công! Đang chuyển đến màn hình kết quả...');
        setTimeout(() => {
          if (subId) {
            navigate(`/student/submissions/${subId}`, { replace: true });
          } else {
            navigate(`/student/assignments/${id}/result`, { replace: true });
          }
        }, 1200);
      } else {
        const resolvedMods = resolveEffectiveModules(assignment?.modules, currentSubModules);
        const nextMod = getNextIncompleteModule(resolvedMods, currentSubModules);
        if (nextMod) {
          const nextSkillLabel = getSkillLabel(nextMod.skill);
          setSuccessMessage(`Đã hoàn thành phần thi Speaking! Đang chuyển tiếp sang ${nextSkillLabel}...`);
          const nextRoute = getSkillRoute(nextMod.skill, numericId, subId);
          setTimeout(() => {
            navigate(nextRoute, { replace: true });
          }, 1200);
        } else {
          setSuccessMessage('Đã hoàn thành phần thi Speaking! Đang quay lại trang tổng quan bài tập...');
          setTimeout(() => {
            navigate(`/student/assignments/${id}/overview`, { replace: true });
          }, 1200);
        }
      }
    } catch (err: unknown) {
      const apiErr = parseApiError(err);
      setError(apiErr.message || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const recordedAudioReady = Boolean(
    audioInputMode === 'mic' ? (audioBlob && audioUrl) : (uploadedAudioFile && uploadedAudioUrl)
  );
  const activeError = permissionError || error;

  return (
    <div className="speaking-container">
      {/* Hidden audio element for previewing the recorded sound */}
      <audio
        ref={audioPlayerRef}
        src={effectiveAudioUrl || undefined}
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
        {effectiveModules.length > 1 && (
          <div className="speaking-stepper-wrapper">
            <ExamStepper
              variant="compact"
              modules={effectiveModules}
              submissionModules={submission?.modules}
              currentSkill="SPEAKING"
              assignmentId={numericId}
              submissionId={submission?.id}
              onSelectModule={(skill, step) => {
                if (!step.isCompleted && step.isAccessible && step.status !== 'ACTIVE') {
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

          {/* Card 2: Voice Studio / Recorder & File Upload (UC017 / FE-91) */}
          <section className="speaking-card">
            <div className="speaking-card-header flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="speaking-card-title m-0">
                  {audioInputMode === 'mic' ? 'Ghi âm trực tiếp' : 'Tải tệp âm thanh'}
                </h2>
                <div className="inline-flex rounded-lg border border-border p-0.5 bg-surface-variant/30 text-xs">
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                      audioInputMode === 'mic' ? 'bg-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
                    }`}
                    onClick={() => {
                      if (isPlaying && audioPlayerRef.current) {
                        audioPlayerRef.current.pause();
                        setIsPlaying(false);
                      }
                      setAudioInputMode('mic');
                    }}
                  >
                    <Mic size={13} />
                    <span>Microphone</span>
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                      audioInputMode === 'upload' ? 'bg-primary text-white shadow-xs' : 'text-muted hover:text-foreground'
                    }`}
                    onClick={() => {
                      if (isRecording) {
                        stopRecording();
                      }
                      if (isPlaying && audioPlayerRef.current) {
                        audioPlayerRef.current.pause();
                        setIsPlaying(false);
                      }
                      setAudioInputMode('upload');
                    }}
                  >
                    <UploadCloud size={13} />
                    <span>Tải tệp (.mp3/.wav)</span>
                  </button>
                </div>
              </div>

              <span className={`speaking-card-timing ${isRecording ? 'recording' : ''}`}>
                {audioInputMode === 'mic'
                  ? isRecording 
                    ? `Đang thu âm: ${formatTime(recordingDuration)}` 
                    : recordedAudioReady 
                      ? `Đã thu âm: ${formatTime(recordingDuration)}` 
                      : ''
                  : uploadedAudioFile
                    ? `${(uploadedAudioFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : ''}
              </span>
            </div>

            <div className="speaking-card-body">
              {audioInputMode === 'mic' ? (
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
              ) : (
                /* Mode Upload File */
                <div className="p-4 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center bg-surface hover:bg-surface-variant/20 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.webm,audio/*"
                    onChange={handleAudioFileChange}
                    className="hidden"
                    id="speaking-audio-file-input"
                  />

                  {!uploadedAudioFile ? (
                    <label
                      htmlFor="speaking-audio-file-input"
                      className="flex flex-col items-center cursor-pointer p-4 w-full"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <UploadCloud size={24} />
                      </div>
                      <span className="text-sm font-semibold text-foreground mb-1">
                        Bấm để chọn hoặc kéo thả tệp âm thanh bài nói
                      </span>
                      <span className="text-xs text-muted">
                        Hỗ trợ định dạng .mp3, .wav, .m4a, .webm (Dung lượng tối đa 25MB)
                      </span>
                    </label>
                  ) : (
                    <div className="w-full flex flex-col items-center p-2">
                      <div className="flex items-center justify-between w-full p-3 rounded-lg bg-surface-variant/40 border border-border mb-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                            <FileAudio size={20} />
                          </div>
                          <div className="text-left overflow-hidden">
                            <div className="text-sm font-semibold text-foreground truncate max-w-[280px]">
                              {uploadedAudioFile.name}
                            </div>
                            <div className="text-xs text-muted">
                              {(uploadedAudioFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadedAudioFile.type || 'audio file'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={togglePlay}
                            className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                            title={isPlaying ? 'Tạm dừng' : 'Nghe thử'}
                          >
                            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveUploadedAudio}
                            className="p-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
                            title="Xóa tệp này và chọn tệp khác"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <span className="text-xs text-muted">
                        {isPlaying ? 'Đang phát âm thanh...' : 'Tệp âm thanh đã sẵn sàng. Bạn có thể nghe thử hoặc bấm nộp bài.'}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                  <div className="submission-file-title truncate max-w-[200px]" title={audioInputMode === 'mic' ? `speaking_attempt_${numericId}.webm` : (uploadedAudioFile?.name || '')}>
                    {recordedAudioReady 
                      ? (audioInputMode === 'mic'
                          ? `speaking_attempt_${numericId}.${backendMimeType === 'audio/wav' ? 'wav' : 'webm'}`
                          : uploadedAudioFile?.name)
                      : 'chua_co_ban_ghi.webm'}
                  </div>
                  <div className="submission-file-meta">
                    {recordedAudioReady
                      ? (audioInputMode === 'mic' && audioBlob
                          ? `${formatTime(recordingDuration)} • ${(audioBlob.size / 1024).toFixed(1)} KB (Mic)`
                          : uploadedAudioFile
                            ? `${(uploadedAudioFile.size / (1024 * 1024)).toFixed(2)} MB (Tệp tải lên)`
                            : '')
                      : 'Chưa có bản ghi âm hoặc tệp'}
                  </div>
                </div>
                <span className={`submission-file-status ${recordedAudioReady ? 'ready' : 'pending'}`}>
                  {recordedAudioReady ? 'Sẵn sàng nộp' : 'Chưa có bài'}
                </span>
              </div>

              {/* Submit CTA */}
              <button 
                className="btn-submit-speaking"
                onClick={handleSubmitAssignment}
                disabled={isSubmitting || !recordedAudioReady || !submission}
                type="button"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Đang tải lên &amp; gửi bài...</span>
                  </>
                ) : (
                  <span>Nộp bài Nói (Submit Speaking)</span>
                )}
              </button>
              <p className="text-[11px] text-muted text-center mt-1">
                Lưu ý: Nộp bản ghi âm cho riêng phần thi Nói này (không nộp toàn bộ bài tập).
              </p>
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

      {/* Modal xác nhận nộp Speaking rỗng khi không có bản ghi âm */}
      {showEmptyConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Xác nhận nộp bài không ghi âm
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Bạn chưa thực hiện ghi âm bài nói. Bạn có chắc chắn muốn nộp bài trống (nhận 0 điểm phần này) để tiếp tục không?
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowEmptyConfirmModal(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={() => void doSubmitAssignment(null)}
                loading={isSubmitting}
              >
                Tiếp tục nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentSpeaking;
