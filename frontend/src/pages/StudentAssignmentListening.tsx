import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, Headphones, 
  Bookmark, ChevronLeft,
  Play, Pause, Volume2, SkipBack, SkipForward,
  AlertCircle, RefreshCw, Lightbulb
} from 'lucide-react';
import { parseApiError } from '../api';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { questionService } from '../api/services/question.service';
import { submissionService, type SubmissionDetail } from '../api/services/submission.service';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import { ExamStepper } from '../components/assignments/ExamStepper';
import {
  getSkillRoute,
  getSkillLabel,
  getExamPageRedirectRoute,
  resolveEffectiveModules
} from '../utils/examStepper.utils';
import { useStudentQuizSubmit, QUIZ_SUBMIT_ERROR } from '../hooks/useStudentQuizSubmit';
import { notifyAssignmentSubmitted } from '../utils/assignmentEvents.utils';
import {
  validateStudentQuizQuestions, buildStudentQuizPayload, isStudentQuizBlank,
  classifyStudentQuizProgress, isStudentQuizPendingFinalization, isStudentQuizSubmitScopeValid,
  type StudentQuizAnswer, type StudentQuizAnswers, type StudentQuizSubmitScope,
} from '../utils/studentQuiz.utils';
import '../styles/student-exam.css';

const MCQ_OPTION_LABELS = ['A', 'B', 'C', 'D'];
const NAVIGATION_DELAY_MS = 1200;
const PENDING_MESSAGE = 'Đáp án của bạn đã được lưu, nhưng hệ thống chưa xác nhận hoàn tất bài thi. Vui lòng thử nộp lại.';
const UNCONFIRMED_MESSAGE = 'Chưa thể xác nhận trạng thái nộp bài. Vui lòng tải lại trang để kiểm tra trước khi thử lại.';
const AUDIO_NOT_FOUND_MESSAGE = 'Bài nghe chưa có tệp audio.';
const AUDIO_LOAD_ERROR_MESSAGE = 'Không tải được audio đề bài. Vui lòng thử lại.';
const AUDIO_PLAY_ERROR_MESSAGE = 'Phát audio thất bại. Vui lòng bấm phát lại.';
const AUDIO_MEDIA_ERROR_MESSAGE = 'Không thể phát audio đề bài. Vui lòng thử lại.';

interface ListeningAudioState {
  moduleId: number | null;
  url: string | null;
  isAudioLoading: boolean;
  audioError: string | null;
  audioErrorCanRetry: boolean;
  playError: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

function createListeningAudioState(moduleId: number | null, isAudioLoading = false): ListeningAudioState {
  return {
    moduleId,
    url: null,
    isAudioLoading,
    audioError: null,
    audioErrorCanRetry: false,
    playError: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  };
}

// An unavailable scope disables submission; these values are never sent to the API.
const UNAVAILABLE_SCOPE: StudentQuizSubmitScope = {
  assignmentId: 0, submissionId: 0, moduleId: 0, submissionModuleId: 0, expectedModuleIds: [],
};

function formatAudioTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function createSubmitScope(assignment: AssignmentDetail, submission: SubmissionDetail, moduleId: number, submissionId: number): StudentQuizSubmitScope {
  if (!Array.isArray(assignment.modules) || !Array.isArray(submission?.modules)) return UNAVAILABLE_SCOPE;
  const currentModules = submission.modules.filter(module => module?.moduleId === moduleId && module.skill === 'LISTENING');
  if (currentModules.length !== 1) return UNAVAILABLE_SCOPE;
  const scope = { assignmentId: assignment.id, submissionId, moduleId,
    submissionModuleId: currentModules[0].id, expectedModuleIds: assignment.modules.map(module => module?.id) };
  return isStudentQuizSubmitScopeValid(scope) ? scope : UNAVAILABLE_SCOPE;
}

const StudentAssignmentListening: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const viewKey = `${id}:${searchParams.toString()}:${reloadKey}`;
  const [pageError, setPageError] = useState<{ key: string; message: string | null }>({ key: viewKey, message: null });
  const error = pageError.key === viewKey ? pageError.message : null;
  const setError = useCallback((message: string | null) => setPageError({ key: viewKey, message }), [viewKey]);
  const [loadedScope, setLoadedScope] = useState({ key: '', scope: UNAVAILABLE_SCOPE });
  const submitScope = loadedScope.key === viewKey ? loadedScope.scope : UNAVAILABLE_SCOPE;
  const scopeReady = isStudentQuizSubmitScopeValid(submitScope);
  const quizSubmit = useStudentQuizSubmit(submitScope);
  const submitState = quizSubmit.state;
  const isSubmitting = submitState.kind === 'submitting';
  const viewGeneration = useRef(0);
  useLayoutEffect(() => {
    viewGeneration.current += 1;
    return () => { viewGeneration.current += 1; };
  }, [viewKey, submitScope]);

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailResponse | null>(null);
  const [audioModuleId, setAudioModuleId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<unknown>([]);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  useLayoutEffect(() => () => {
    audioRef.current?.pause();
  }, []);
  const audioRequestId = useRef(0);
  const audioRefetchUsed = useRef(false);
  const pendingAudioTime = useRef<number | null>(null);
  const [audioState, setAudioState] = useState(() => createListeningAudioState(null));
  const activeAudioState = audioState.moduleId === audioModuleId
    ? audioState
    : createListeningAudioState(audioModuleId, audioModuleId !== null);
  const {
    url: audioUrl,
    isAudioLoading,
    audioError,
    audioErrorCanRetry,
    playError,
    isPlaying,
    currentTime: audioCurrentTime,
    duration: audioDuration,
  } = activeAudioState;
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<StudentQuizAnswers>({});
  const answerScope = useRef<{ assignmentId: number | null; submissionId: number | null; moduleId: number | null }>({
    assignmentId: null, submissionId: null, moduleId: null,
  });
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<number, boolean>>({});

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
  }, [id]);

  const handleRetry = () => setReloadKey((k) => k + 1);

  const updateAudioState = useCallback((currentModuleId: number | null, updates: Partial<ListeningAudioState>) => {
    setAudioState((current) => {
      const base = current.moduleId === currentModuleId
        ? current
        : createListeningAudioState(currentModuleId, true);
      return { ...base, ...updates, moduleId: currentModuleId };
    });
  }, []);

  const loadAudioUrl = useCallback(async (currentModuleId: number, requestId: number) => {
    try {
      const response = await moduleService.getAudioDownloadUrl(currentModuleId);
      if (requestId !== audioRequestId.current) return;
      if (!response.downloadUrl) {
        updateAudioState(currentModuleId, {
          url: null,
          audioError: AUDIO_LOAD_ERROR_MESSAGE,
          audioErrorCanRetry: true,
          isAudioLoading: false,
        });
        return;
      }
      updateAudioState(currentModuleId, {
        url: response.downloadUrl,
        audioError: null,
        audioErrorCanRetry: false,
        playError: null,
      });
    } catch (err: unknown) {
      if (requestId !== audioRequestId.current) return;
      const apiError = parseApiError(err);
      updateAudioState(currentModuleId, {
        url: null,
        audioError: apiError.statusCode === 404 ? AUDIO_NOT_FOUND_MESSAGE : AUDIO_LOAD_ERROR_MESSAGE,
        audioErrorCanRetry: apiError.statusCode !== 404,
        isAudioLoading: false,
      });
    }
  }, [updateAudioState]);

  useEffect(() => {
    const requestId = ++audioRequestId.current;
    audioRefetchUsed.current = false;
    pendingAudioTime.current = null;
    const audio = audioRef.current;
    audio?.pause();

    if (audioModuleId) {
      void loadAudioUrl(audioModuleId, requestId);
    }

    return () => {
      if (audioRequestId.current === requestId) audioRequestId.current += 1;
      audio?.pause();
    };
  }, [audioModuleId, loadAudioUrl]);

  useEffect(() => {
    if (audioUrl) audioRef.current?.load();
  }, [audioUrl]);

  const handleAudioRetry = () => {
    if (!audioModuleId) return;
    audioRefetchUsed.current = false;
    pendingAudioTime.current = null;
    audioRef.current?.pause();
    setAudioState(createListeningAudioState(audioModuleId, true));
    void loadAudioUrl(audioModuleId, ++audioRequestId.current);
  };

  const handleAudioPlay = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || isAudioLoading) return;
    updateAudioState(audioModuleId, { playError: null });
    try {
      await audio.play();
      updateAudioState(audioModuleId, { isPlaying: true });
    } catch {
      updateAudioState(audioModuleId, { isPlaying: false, playError: AUDIO_PLAY_ERROR_MESSAGE });
    }
  };

  const handleAudioError = () => {
    if (!audioModuleId || (isAudioLoading && !audioUrl)) return;
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.currentTime)) {
      pendingAudioTime.current = audio.currentTime;
    }
    audio?.pause();
    updateAudioState(audioModuleId, {
      url: null,
      isPlaying: false,
      isAudioLoading: true,
      playError: null,
    });

    if (audioRefetchUsed.current) {
      pendingAudioTime.current = null;
      updateAudioState(audioModuleId, {
        audioError: AUDIO_MEDIA_ERROR_MESSAGE,
        audioErrorCanRetry: true,
        isAudioLoading: false,
      });
      return;
    }

    audioRefetchUsed.current = true;
    void loadAudioUrl(audioModuleId, ++audioRequestId.current);
  };

  const handleAudioMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const duration = audio.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      updateAudioState(audioModuleId, { duration: 0, currentTime: 0, isAudioLoading: false });
      pendingAudioTime.current = null;
      return;
    }

    if (pendingAudioTime.current !== null) {
      const restoredTime = Math.min(Math.max(pendingAudioTime.current, 0), duration);
      audio.currentTime = restoredTime;
      updateAudioState(audioModuleId, { duration, currentTime: restoredTime, isAudioLoading: false });
      pendingAudioTime.current = null;
    } else {
      updateAudioState(audioModuleId, {
        duration,
        currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
        isAudioLoading: false,
      });
    }
  };

  const handleAudioTimeUpdate = () => {
    const currentTime = audioRef.current?.currentTime ?? 0;
    updateAudioState(audioModuleId, { currentTime: Number.isFinite(currentTime) ? currentTime : 0 });
  };

  const handleAudioSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audioDuration) || audioDuration <= 0) return;
    const nextTime = Math.min(Math.max(value, 0), audioDuration);
    audio.currentTime = nextTime;
    updateAudioState(audioModuleId, { currentTime: nextTime });
  };

  const canSeekAudio = Boolean(audioUrl) && !isAudioLoading && Number.isFinite(audioDuration) && audioDuration > 0;
  const audioProgress = canSeekAudio ? Math.min((audioCurrentTime / audioDuration) * 100, 100) : 0;

  useEffect(() => {
    let isMounted = true;

    const applySubmission = (sub: SubmissionDetail, currentAssignment: AssignmentDetail, moduleId: number, expectedSubmissionId: number) => {
      if (!isMounted) return;
      const scope = createSubmitScope(currentAssignment, sub, moduleId, expectedSubmissionId);
      const progress = classifyStudentQuizProgress(sub, scope);
      if (progress.kind === 'unconfirmed') throw new Error(UNCONFIRMED_MESSAGE);
      if (!isStudentQuizPendingFinalization(sub, scope)) {
        const redirectRoute = getExamPageRedirectRoute(sub, 'LISTENING', numericId, currentAssignment.modules, moduleId);
        if (redirectRoute) {
          navigate(redirectRoute, { replace: true });
          return;
        }
      }
      if (answerScope.current.submissionId !== sub.id) {
        answerScope.current.submissionId = sub.id;
        setSelectedAnswers({});
        setActiveQuestion(1);
      }
      setSubmission(sub);
      setLoadedScope({ key: viewKey, scope });
    };

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setAudioModuleId(null);
      setAudioState(createListeningAudioState(null));
      setLoadedScope({ key: viewKey, scope: UNAVAILABLE_SCOPE });
      setSubmission(null);
      const requestedId = searchParams.get('submissionId');
      const requestedSubmissionId = requestedId && Number.isFinite(Number(requestedId)) ? Number(requestedId) : null;
      const scope = answerScope.current;
      if (scope.assignmentId !== numericId || (requestedSubmissionId !== null && scope.submissionId !== requestedSubmissionId)) {
        answerScope.current = { assignmentId: numericId, submissionId: requestedSubmissionId, moduleId: null };
        setSelectedAnswers({});
        setActiveQuestion(1);
      }
      try {
        if (requestedId !== null && (!Number.isSafeInteger(Number(requestedId)) || Number(requestedId) <= 0)) throw new Error(UNCONFIRMED_MESSAGE);
        if (!numericId) throw new Error('Không tìm thấy bài tập hợp lệ.');
        const currentAssignment = await assignmentService.getAssignment(numericId);
        if (!isMounted) return;
        if (currentAssignment?.id !== numericId || !Array.isArray(currentAssignment.modules)) throw new Error(UNCONFIRMED_MESSAGE);
        if (!currentAssignment.modules.every(module => Number.isSafeInteger(module?.id) && module.id > 0 && typeof module.skill === 'string')) throw new Error(UNCONFIRMED_MESSAGE);
        setAssignment(currentAssignment);
        const skillModules = currentAssignment.modules.filter(module => module?.skill === 'LISTENING');
        if (skillModules.length === 0) throw new Error(UNCONFIRMED_MESSAGE);
        const queryModParam = searchParams.get('moduleId');
        const matchedQueryMod = queryModParam && Number.isSafeInteger(Number(queryModParam))
          ? skillModules.find(m => m.id === Number(queryModParam))
          : null;
        const targetModule = matchedQueryMod || skillModules[0];
        const moduleId = targetModule.id;
        if (!Number.isSafeInteger(moduleId) || moduleId <= 0) throw new Error(UNCONFIRMED_MESSAGE);

        if (!isMounted) return;
        setAudioModuleId(moduleId);
        setAudioState(createListeningAudioState(moduleId, true));
        if (answerScope.current.moduleId !== (moduleId ?? null)) {
          answerScope.current.moduleId = moduleId ?? null;
          setSelectedAnswers({});
          setActiveQuestion(1);
        }

        if (moduleId) {
          const [modRes, qRes] = await Promise.allSettled([
            moduleService.getModule(moduleId),
            questionService.listQuestions(moduleId)
          ]);
          if (!isMounted) return;

          if (modRes.status === 'fulfilled') {
            setModuleDetail(modRes.value);
          }
          if (qRes.status === 'fulfilled') {
            const qList = qRes.value.questions ?? qRes.value.data;
            setQuestions(() => qList);
          } else {
            setQuestions([]);
          }
        } else {
          if (isMounted) setQuestions([]);
        }

        if (!isMounted) return;
        // Resolve or start submission attempt
        const urlSubmissionId = searchParams.get('submissionId');
        if (urlSubmissionId && Number.isFinite(Number(urlSubmissionId))) {
          try {
            const sub = await submissionService.getSubmission(Number(urlSubmissionId));
            if (!isMounted) return;
            applySubmission(sub, currentAssignment, moduleId, Number(urlSubmissionId));
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
              limit: 10
            });
            const subs = subList.data || [];
            const inProgressItem = subs.find((s) => s.status === 'IN_PROGRESS');

            if (inProgressItem) {
              const sub = await submissionService.getSubmission(inProgressItem.id);
              if (!isMounted) return;
              applySubmission(sub, currentAssignment, moduleId, inProgressItem.id);
            } else {
              const completedItem = subs.find(
                (s) => s.status === 'GRADED' || s.status === 'SUBMITTED'
              );
              if (completedItem) {
                const sub = await submissionService.getSubmission(completedItem.id);
                applySubmission(sub, currentAssignment, moduleId, completedItem.id);
                return;
              }

              if (currentAssignment?.status === 'PUBLISHED') {
                const startRes = await submissionService.startAttempt(numericId);
                if (!isMounted) return;
                const sub = await submissionService.getSubmission(startRes.id);
                if (!isMounted) return;
                applySubmission(sub, currentAssignment, moduleId, startRes.id);
              } else if (currentAssignment?.status === 'CLOSED') {
                if (isMounted) {
                  setError('Bài tập này đã được giáo viên đóng. Học viên không thể làm bài hoặc nộp bài.');
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
        const msg = err instanceof Error ? err.message : 'Không thể tải đề bài nghe.';
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
  }, [numericId, searchParams, user?.id, viewKey, navigate, setError]);

  const effectiveModules = useMemo(
    () => resolveEffectiveModules(assignment?.modules, submission?.modules),
    [assignment?.modules, submission?.modules]
  );

  const questionValidation = useMemo(() => validateStudentQuizQuestions(questions), [questions]);
  const quizPayload = useMemo(() => buildStudentQuizPayload(questions, selectedAnswers), [questions, selectedAnswers]);
  const validatedQuestions = questionValidation.questions;
  const totalQuestions = validatedQuestions.length;
  const validQuestionCount = validatedQuestions.filter(result => result.question !== null).length;
  const invalidQuestionNumbers = validatedQuestions.filter(result => result.reason !== null).map(result => result.index + 1);
  const answeredCount = quizPayload.answers.length;
  const answeredQuestionIds = new Set(quizPayload.answers.map(answer => answer.questionId));
  let questionDataError: string | null = null;
  if (!questionValidation.isValid) {
    questionDataError = invalidQuestionNumbers.length > 0
      ? `Đề bài có dữ liệu lỗi ở câu ${invalidQuestionNumbers.join(', ')}. Chưa thể nộp phần thi. Vui lòng tải lại đề hoặc liên hệ giáo viên.`
      : 'Đề bài không có danh sách câu hỏi hợp lệ. Chưa thể nộp phần thi. Vui lòng tải lại đề hoặc liên hệ giáo viên.';
  }
  const recoveryPending = scopeReady && isStudentQuizPendingFinalization(submission, submitScope);
  const finalRejected = submitState.kind === 'failed' && submitState.reason === QUIZ_SUBMIT_ERROR.FINAL_REJECTED;
  const showFinalRetry = submitState.kind === 'pendingFinalization' || finalRejected
    || (submitState.kind === 'idle' && recoveryPending);
  const canSubmitModule = scopeReady && !isLoading && !recoveryPending
    && (submitState.kind === 'idle' || (submitState.kind === 'failed' && submitState.reason === QUIZ_SUBMIT_ERROR.MODULE_REJECTED));
  let submitError: string | null = null;
  if (submitState.kind === 'unconfirmed') submitError = UNCONFIRMED_MESSAGE;
  if (submitState.kind === 'failed') {
    submitError = submitState.reason === QUIZ_SUBMIT_ERROR.MODULES_INCOMPLETE
      ? 'Tiến độ bài thi đã thay đổi. Vui lòng tải lại trang để kiểm tra các phần chưa hoàn tất.'
      : parseApiError(submitState.cause).message || 'Không thể nộp bài. Vui lòng thử lại.';
  }
  const displayError = error || submitError || (!isLoading && canSubmitModule ? questionDataError : null);
  const successMessage = submitState.kind === 'completed'
    ? 'Nộp bài thành công! Đang chuyển đến màn hình kết quả...'
    : submitState.kind === 'nextSkill'
      ? `Đã hoàn thành phần thi Listening! Đang chuyển tiếp sang ${getSkillLabel(submitState.nextModule.skill)}...` : null;

  useEffect(() => {
    if (!scopeReady || (submitState.kind !== 'completed' && submitState.kind !== 'nextSkill')) return;
    const generation = viewGeneration.current;
    const destination = submitState.kind === 'completed' ? `/student/submissions/${submitState.submissionId}`
      : getSkillRoute(submitState.nextModule.skill, submitScope.assignmentId, submitState.submission.id);
    if (submitState.kind === 'completed') notifyAssignmentSubmitted();
    const timer = setTimeout(() => {
      if (viewGeneration.current === generation) navigate(destination, { replace: true });
    }, NAVIGATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [scopeReady, submitState, submitScope, viewKey, navigate]);

  const handleSelectAnswer = (questionId: number, answer: StudentQuizAnswer) => {
    if (canSubmitModule) setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const toggleBookmark = (qId: number) => {
    setBookmarkedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmit = () => {
    if (assignment?.status === 'CLOSED') {
      setError('Bài tập này đã được giáo viên đóng. Không thể nộp bài.');
      return;
    }
    if (!canSubmitModule) return;
    if (!quizPayload.validation.isValid) {
      setError(questionDataError);
      return;
    }
    if (isStudentQuizBlank(questions, selectedAnswers)) {
      setError('Vui lòng trả lời ít nhất một câu hỏi trước khi nộp phần thi này.');
      return;
    }
    setError(null);
    void quizSubmit.submit(quizPayload.answers);
  };

  const handleRetryFinal = () => {
    if (!scopeReady || isLoading || assignment?.status === 'CLOSED') return;
    setError(null);
    void quizSubmit.retryFinal();
  };

  const currentQuestionResult = validatedQuestions[activeQuestion - 1] || validatedQuestions[0];
  const currentQuestionItem = currentQuestionResult?.question;

  return (
    <div className="exam-page">
      {/* Page Header */}
      <div className="exam-header">
        <div className="exam-header-left">
          <Button 
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate(`/student/assignments/${id}/overview`)}
          >
            Tổng quan bài thi
          </Button>
          
          <div className="exam-breadcrumbs">
            <span>Hệ thống</span> <ChevronRight size={14} />
            <span>Lớp học</span> <ChevronRight size={14} />
            <span className="exam-breadcrumbs-current">
              {assignment?.title || `Listening Practice #${id}`}
            </span>
          </div>
        </div>

        {effectiveModules.length > 1 && (
          <div className="exam-header-right">
            <ExamStepper
              variant="compact"
              modules={effectiveModules}
              submissionModules={submission?.modules}
              currentSkill="LISTENING"
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

      {displayError && (
        <div className="exam-alert-error" role="alert">
          <div className="exam-alert-msg">
            <AlertCircle size={20} />
            <span>{displayError}</span>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={RefreshCw}
            onClick={handleRetry}
          >
            Thử lại
          </Button>
        </div>
      )}

      {showFinalRetry && (
        <div className="exam-alert-error" role="alert">
          <div className="exam-alert-msg">
            <AlertCircle size={20} />
            <span>{PENDING_MESSAGE}</span>
          </div>
          <Button variant="danger" size="sm" icon={RefreshCw} onClick={handleRetryFinal}
            disabled={isSubmitting || isLoading || assignment?.status === 'CLOSED'}>
            Thử nộp lại bài
          </Button>
        </div>
      )}

      {successMessage && (
        <div className="exam-alert-success">
          <AlertCircle size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main 2-Column Split Workspace */}
      <div className="exam-workspace-grid">
        {/* Left Column: Audio Player & Instructions */}
        <div className="exam-pane-left">
          <div className="exam-audio-header-wrap">
            <div className="exam-audio-title-row">
              <div className="exam-audio-icon-box">
                <Headphones size={22} />
              </div>
              <div>
                <h3 className="exam-audio-title">
                  {moduleDetail?.instructions || assignment?.title || 'Phần thi Nghe'}
                </h3>
                <span className="exam-audio-subtitle">Audio Track • Tiếng Anh chuẩn học thuật</span>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="exam-audio-player-box">
              <audio
                ref={audioRef}
                src={audioUrl ?? undefined}
                preload="metadata"
                aria-label="Audio đề bài Listening"
                onPlay={() => {
                  updateAudioState(audioModuleId, { isPlaying: true, playError: null });
                }}
                onPause={() => updateAudioState(audioModuleId, { isPlaying: false })}
                onTimeUpdate={handleAudioTimeUpdate}
                onLoadedMetadata={handleAudioMetadata}
                onEnded={() => {
                  updateAudioState(audioModuleId, { isPlaying: false, currentTime: audioDuration });
                }}
                onError={handleAudioError}
              />
              <div className="exam-audio-controls-row">
                <div className="exam-audio-btn-group">
                  <button 
                    type="button"
                    onClick={() => handleAudioSeek(audioCurrentTime - 10)}
                    disabled={!canSeekAudio}
                    className="exam-audio-skip-btn"
                    aria-label="Tua lùi 10s"
                  >
                    <SkipBack size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (isPlaying) {
                        audioRef.current?.pause();
                        updateAudioState(audioModuleId, { isPlaying: false });
                      } else {
                        void handleAudioPlay();
                      }
                    }}
                    disabled={!audioUrl || isAudioLoading}
                    className="exam-audio-play-btn"
                    aria-label={isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="exam-play-icon" />}
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleAudioSeek(audioCurrentTime + 10)}
                    disabled={!canSeekAudio}
                    className="exam-audio-skip-btn"
                    aria-label="Tua tới 10s"
                  >
                    <SkipForward size={18} />
                  </button>
                </div>

                <div className="exam-audio-time-info">
                  <Volume2 size={18} />
                  <span role="status" aria-live="polite">
                    {isAudioLoading
                      ? 'Đang tải audio...'
                      : `${formatAudioTime(audioDuration > 0 ? audioCurrentTime : 0)} / ${formatAudioTime(audioDuration)}`}
                  </span>
                </div>
              </div>

              <div className="exam-audio-progress-bar">
                <div 
                  className="exam-audio-progress-fill" 
                  style={{ width: `${audioProgress}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={audioDuration > 0 ? audioDuration : 1}
                  step={0.1}
                  value={audioDuration > 0 ? Math.min(audioCurrentTime, audioDuration) : 0}
                  disabled={!canSeekAudio}
                  aria-label="Tiến trình audio"
                  aria-valuetext={`${formatAudioTime(audioDuration > 0 ? audioCurrentTime : 0)} / ${formatAudioTime(audioDuration)}`}
                  onChange={(event) => handleAudioSeek(Number(event.currentTarget.value))}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    margin: 0,
                    opacity: 0.01,
                    cursor: canSeekAudio ? 'pointer' : 'not-allowed',
                  }}
                />
              </div>
              {(audioError || playError) && (
                <div className="exam-alert-error" role="alert">
                  <span>{audioError || playError}</span>
                  {audioError && audioErrorCanRetry && (
                    <button
                      type="button"
                      className="exam-audio-skip-btn"
                      onClick={handleAudioRetry}
                      disabled={isAudioLoading}
                    >
                      Thử lại
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions note */}
          <div className="exam-instructions-body">
            <h4 className="exam-instructions-heading">
              Hướng dẫn phần thi Nghe:
            </h4>
            <p className="exam-instructions-text">
              Bạn sẽ nghe đoạn hội thoại hoặc bài giảng một lần duy nhất. Đọc trước các câu hỏi bên cạnh và chọn đáp án thích hợp trong khi nghe.
            </p>
            <div className="exam-tip-box">
              <span className="flex items-start gap-1.5">
                <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Mẹo làm bài:</strong> Chú ý các từ khóa tín hiệu chuyển ý như <em>however</em>, <em>furthermore</em>, <em>on the contrary</em> để bắt kịp đáp án.
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Questions */}
        <div className="exam-pane-right">
          <div className="exam-questions-header">
            <div className="exam-questions-meta">
              <div>
                <h2 className="exam-questions-title">
                  Danh sách câu hỏi {totalQuestions > 0 ? `(1 - ${totalQuestions})` : ''}
                </h2>
                <span className="exam-questions-hint">
                  {totalQuestions > 0 ? 'Chọn đáp án đúng theo nội dung nghe' : 'Chưa có câu hỏi nào được gán'}
                </span>
              </div>
              {totalQuestions > 0 && (
                <div className="exam-progress-badge">
                  {answeredCount} / {validQuestionCount} đã làm{invalidQuestionNumbers.length > 0 ? ' (câu hợp lệ)' : ''}
                </div>
              )}
            </div>

            {/* Question Navigator */}
            {totalQuestions > 0 && (
              <div className="exam-nav-grid">
                {validatedQuestions.map((result, i) => {
                  const qId = i + 1;
                  const isAnswered = result.question !== null && answeredQuestionIds.has(result.question.id);
                  const isBookmarked = bookmarkedQuestions[qId];
                  const isActive = activeQuestion === qId;
                  
                  const btnClasses = [
                    'exam-nav-btn',
                    isActive ? 'is-active' : '',
                    isBookmarked ? 'is-bookmarked' : '',
                    !isActive && !isBookmarked && isAnswered ? 'is-answered' : ''
                  ].filter(Boolean).join(' ');

                  return (
                    <button 
                      key={qId}
                      type="button"
                      aria-label={result.reason ? `Câu ${qId}: dữ liệu lỗi` : undefined}
                      onClick={() => setActiveQuestion(qId)}
                      className={btnClasses}
                    >
                      {qId}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="exam-questions-body">
            {isLoading ? (
              <div className="exam-skeleton-group">
                <Skeleton height={100} borderRadius={8} />
                <Skeleton height={60} borderRadius={8} />
              </div>
            ) : totalQuestions === 0 ? (
              <div className="exam-empty-box">
                <Headphones size={40} className="exam-empty-icon" />
                <p className="exam-empty-title">Chưa có câu hỏi cho phần thi nghe này</p>
                <span className="exam-empty-desc">Giáo viên chưa cập nhật danh sách câu hỏi. Vui lòng quay lại sau.</span>
              </div>
            ) : currentQuestionResult?.reason ? (
              <div className="exam-alert-error" role="alert">
                <p>Câu {currentQuestionResult.index + 1} có dữ liệu không hợp lệ.</p>
              </div>
            ) : currentQuestionItem ? (() => {
              const isShortAnswer = currentQuestionItem.questionType === 'SHORT_ANSWER';
              const currentAnswer = selectedAnswers[currentQuestionItem.id];
              return (
                <div className="exam-question-card">
                  <div className="exam-question-top">
                    <div className="exam-question-type-wrap">
                      <span className="exam-question-number-badge">
                        {activeQuestion}
                      </span>
                      <span className="exam-question-type-badge">
                        {isShortAnswer ? 'Trả lời ngắn' : 'Trắc nghiệm'}
                      </span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => toggleBookmark(activeQuestion)}
                      className={`exam-bookmark-btn ${bookmarkedQuestions[activeQuestion] ? 'is-active' : ''}`}
                      aria-label="Đánh dấu câu hỏi"
                    >
                      <Bookmark size={18} fill={bookmarkedQuestions[activeQuestion] ? 'var(--eh-gold, #9a7e56)' : 'none'} />
                    </button>
                  </div>

                  <p className="exam-question-prompt">
                    {currentQuestionItem.content}
                  </p>

                  {isShortAnswer ? (
                    <div className="exam-short-answer-group">
                      <label 
                        htmlFor={`short-answer-${currentQuestionItem.id || activeQuestion}`} 
                        className="exam-short-answer-label"
                      >
                        Câu trả lời của bạn:
                      </label>
                      <input
                        id={`short-answer-${currentQuestionItem.id || activeQuestion}`}
                        type="text"
                        className="exam-short-answer-input"
                        disabled={!canSubmitModule}
                        placeholder="Nhập câu trả lời ngắn của bạn tại đây..."
                        value={currentAnswer?.questionType === 'SHORT_ANSWER' ? currentAnswer.text : ''}
                        onChange={(e) => handleSelectAnswer(currentQuestionItem.id, { questionType: 'SHORT_ANSWER', text: e.target.value })}
                        autoComplete="off"
                      />
                    </div>
                  ) : currentQuestionItem.questionType === 'MULTIPLE_CHOICE' ? (
                    /* Options */
                    <div className="exam-options-group">
                      {currentQuestionItem.options?.map((option, optIdx) => {
                        const isSelected = currentAnswer?.questionType === 'MULTIPLE_CHOICE' && currentAnswer.selectedOptionId === option.id;
                        return (
                          <label 
                            key={option.id}
                            onClick={() => handleSelectAnswer(currentQuestionItem.id, { questionType: 'MULTIPLE_CHOICE', selectedOptionId: option.id })}
                            className={`exam-option-item ${isSelected ? 'is-selected' : ''}`}
                          >
                            <div className="exam-radio-indicator">
                              {isSelected && <div className="exam-radio-dot" />}
                            </div>
                            <div className="exam-option-content">
                              <strong className="exam-option-key">{MCQ_OPTION_LABELS[optIdx]}.</strong> {option.content}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })() : null}
          </div>

          {/* Right Column Footer */}
          <div className="exam-pane-footer">
            <div className="exam-pane-footer-nav">
              <Button 
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setActiveQuestion(Math.max(1, activeQuestion - 1))}
              >
                Câu trước
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => setActiveQuestion(Math.min(totalQuestions, activeQuestion + 1))}
              >
                Câu sau
              </Button>
            </div>

            <Button 
              variant="primary"
              size="md"
              loading={isSubmitting}
              disabled={!canSubmitModule || isSubmitting}
              onClick={handleSubmit}
            >
              Hoàn thành & Nộp bài
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentListening;
