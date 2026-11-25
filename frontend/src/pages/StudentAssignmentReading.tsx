import React, { useState, useEffect, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, BookOpen, 
  Bookmark, Highlighter, 
  ChevronLeft, AlertCircle, RefreshCw,
  CheckCircle2, XCircle, Lightbulb, Trash2, HelpCircle
} from 'lucide-react';
import { parseApiError } from '../api';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { questionService } from '../api/services/question.service';
import { submissionService, type SubmissionDetail, type SubmissionModuleDetailResponse } from '../api/services/submission.service';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/common/ToastContext';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { Skeleton } from '../components/common/Skeleton';
import { ExamStepper } from '../components/assignments/ExamStepper';
import {
  getSkillRoute,
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
import {
  type HighlightItem,
  type HighlightColor,
  loadHighlights,
  saveHighlights,
  clearHighlights,
  renderHighlightedParagraph,
  extractReadingMcqOptions,
  extractReadingShortAnswerText,
} from '../utils/readingHighlight.utils';
import '../styles/student-exam.css';

const NAVIGATION_DELAY_MS = 1200;
const PENDING_MESSAGE = 'Đáp án của bạn đã được lưu, nhưng hệ thống chưa xác nhận hoàn tất bài thi. Vui lòng thử nộp lại.';
const UNCONFIRMED_MESSAGE = 'Chưa thể xác nhận trạng thái nộp bài. Vui lòng tải lại trang để kiểm tra trước khi thử lại.';
// An unavailable scope disables submission; these values are never sent to the API.
const UNAVAILABLE_SCOPE: StudentQuizSubmitScope = {
  assignmentId: 0, submissionId: 0, moduleId: 0, submissionModuleId: 0, expectedModuleIds: [],
};

function createSubmitScope(assignment: AssignmentDetail, submission: SubmissionDetail, moduleId: number, submissionId: number): StudentQuizSubmitScope {
  if (!Array.isArray(assignment.modules) || !Array.isArray(submission?.modules)) return UNAVAILABLE_SCOPE;
  const currentModules = submission.modules.filter(module => module?.moduleId === moduleId && module.skill === 'READING');
  if (currentModules.length !== 1) return UNAVAILABLE_SCOPE;
  const scope = { assignmentId: assignment.id, submissionId, moduleId,
    submissionModuleId: currentModules[0].id, expectedModuleIds: assignment.modules.map(module => module?.id) };
  return isStudentQuizSubmitScopeValid(scope) ? scope : UNAVAILABLE_SCOPE;
}

const StudentAssignmentReading: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { warning: toastWarning, error: toastError } = useToast();
  const isReviewMode = searchParams.get('mode') === 'review';

  const [isLoading, setIsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const viewKey = `${id}:${searchParams.toString()}:${reloadKey}`;
  const [pageError, setPageError] = useState<{ key: string; message: string | null }>({ key: viewKey, message: null });
  const error = pageError.key === viewKey ? pageError.message : null;
  const setError = useCallback((message: string | null) => setPageError({ key: viewKey, message }), [viewKey]);
  const [loadedScope, setLoadedScope] = useState({ key: '', scope: UNAVAILABLE_SCOPE });
  const submitScope = loadedScope.key === viewKey ? loadedScope.scope : UNAVAILABLE_SCOPE;
  const scopeReady = isStudentQuizSubmitScopeValid(submitScope);
  const quizSubmit = useStudentQuizSubmit(submitScope, { isReviewMode });
  const submitState = quizSubmit.state;
  const isSubmitting = submitState.kind === 'submitting';
  const viewGeneration = useRef(0);
  useLayoutEffect(() => {
    viewGeneration.current += 1;
    return () => { viewGeneration.current += 1; };
  }, [viewKey, submitScope]);

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<ModuleDetailResponse | null>(null);
  const [questions, setQuestions] = useState<unknown>([]);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  // Review mode & Highlight state
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT' | 'UNANSWERED'>('ALL');
  const [submissionModuleDetail, setSubmissionModuleDetail] = useState<SubmissionModuleDetailResponse | null>(null);
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [floatingPalette, setFloatingPalette] = useState<{
    x: number;
    y: number;
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
    selectedText: string;
  } | null>(null);

  const [activeQuestion, setActiveQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<StudentQuizAnswers>({});
  const answerScope = useRef<{ assignmentId: number | null; submissionId: number | null; moduleId: number | null }>({
    assignmentId: null, submissionId: null, moduleId: null,
  });
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<number, boolean>>({});
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [mobileTab, setMobileTab] = useState<'passage' | 'questions'>('passage');

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 0;
  }, [id]);

  const handleRetry = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const applySubmission = (sub: SubmissionDetail, currentAssignment: AssignmentDetail, moduleId: number, expectedSubmissionId: number) => {
      if (!isMounted) return;
      const scope = createSubmitScope(currentAssignment, sub, moduleId, expectedSubmissionId);
      const progress = classifyStudentQuizProgress(sub, scope);
      if (progress.kind === 'unconfirmed') throw new Error(UNCONFIRMED_MESSAGE);
      if (!isStudentQuizPendingFinalization(sub, scope) && !isReviewMode) {
        const redirectRoute = getExamPageRedirectRoute(sub, 'READING', numericId, currentAssignment.modules, moduleId, isReviewMode);
        if (redirectRoute) {
          navigate(redirectRoute, { replace: true });
          return;
        }
      }
      if (answerScope.current.submissionId !== sub.id) {
        answerScope.current.submissionId = sub.id;
        let savedAnswers: StudentQuizAnswers = {};
        if (isReviewMode) {
          try {
            const raw = localStorage.getItem(`eh_draft_quiz_${numericId}_${moduleId}`)
              || localStorage.getItem(`eh_draft_quiz_${numericId}_${sub.id}_${moduleId}`);
            if (raw) savedAnswers = JSON.parse(raw);
          } catch { /* ignore */ }
        }
        setSelectedAnswers(savedAnswers);
        setActiveQuestion(1);
      }
      setSubmission(sub);
      setLoadedScope({ key: viewKey, scope });

      if (isReviewMode && scope.submissionModuleId) {
        submissionService.getSubmissionModuleDetail(scope.submissionModuleId)
          .then((subModRes) => {
            if (!isMounted || !subModRes) return;
            setSubmissionModuleDetail(subModRes);
            if (Array.isArray(subModRes.questions) && subModRes.questions.length > 0) {
              setQuestions(subModRes.questions);
            }
            if (Array.isArray(subModRes.answers) && subModRes.answers.length > 0) {
              setSelectedAnswers((prev) => {
                const restored: Record<number, StudentQuizAnswer> = {};
                Object.entries(prev).forEach(([k, v]) => {
                  if (v) restored[Number(k)] = v;
                });
                for (const ans of subModRes.answers) {
                  if (ans.questionId) {
                    const c = ans.content as Record<string, unknown>;
                    if (c && typeof c === 'object') {
                      if (typeof c.selectedOptionId === 'number') {
                        restored[ans.questionId] = { questionType: 'MULTIPLE_CHOICE', selectedOptionId: c.selectedOptionId };
                      } else if (Array.isArray(c.selectedOptionIds) && typeof c.selectedOptionIds[0] === 'number') {
                        restored[ans.questionId] = { questionType: 'MULTIPLE_CHOICE', selectedOptionId: c.selectedOptionIds[0] };
                      } else if (typeof c.text === 'string') {
                        restored[ans.questionId] = { questionType: 'SHORT_ANSWER', text: c.text };
                      } else if (typeof c.answer === 'string') {
                        restored[ans.questionId] = { questionType: 'SHORT_ANSWER', text: c.answer };
                      }
                    }
                  }
                }
                return restored;
              });
            }
          })
          .catch((err) => {
            console.warn('Could not load submission module detail in review mode:', err);
          });
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      setShowSubmitConfirm(false);
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
        const skillModules = currentAssignment.modules.filter(module => module?.skill === 'READING');
        if (skillModules.length === 0) throw new Error(UNCONFIRMED_MESSAGE);
        const queryModParam = searchParams.get('moduleId');
        const matchedQueryMod = queryModParam && Number.isSafeInteger(Number(queryModParam))
          ? skillModules.find(m => m.id === Number(queryModParam))
          : null;
        const targetModule = matchedQueryMod || skillModules[0];
        const moduleId = targetModule.id;
        if (!Number.isSafeInteger(moduleId) || moduleId <= 0) throw new Error(UNCONFIRMED_MESSAGE);

        if (!isMounted) return;
        if (answerScope.current.moduleId !== (moduleId ?? null)) {
          answerScope.current.moduleId = moduleId ?? null;
          let savedAnswers: StudentQuizAnswers = {};
          if (isReviewMode && moduleId) {
            try {
              const raw = localStorage.getItem(`eh_draft_quiz_${numericId}_${moduleId}`)
                || (requestedSubmissionId ? localStorage.getItem(`eh_draft_quiz_${numericId}_${requestedSubmissionId}_${moduleId}`) : null);
              if (raw) savedAnswers = JSON.parse(raw);
            } catch { /* ignore */ }
          }
          setSelectedAnswers(savedAnswers);
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
            setHighlights(loadHighlights(numericId, moduleId));
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
        const msg = err instanceof Error ? err.message : 'Không thể tải đề bài đọc.';
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
  }, [numericId, searchParams, user?.id, viewKey, navigate, setError, isReviewMode]);

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
  const recoveryPending = !isReviewMode && scopeReady && isStudentQuizPendingFinalization(submission, submitScope);
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
    ? (isReviewMode
        ? 'Cập nhật phần thi Reading thành công! Đang chuyển đến màn hình xem lại bài làm...'
        : 'Nộp bài thành công! Đang chuyển đến màn hình kết quả...')
    : submitState.kind === 'nextSkill'
      ? 'Đã hoàn thành phần thi Reading! Đang quay lại trang tổng quan bài tập...' : null;

  useEffect(() => {
    if (!scopeReady || (submitState.kind !== 'completed' && submitState.kind !== 'nextSkill')) return;
    const generation = viewGeneration.current;
    const destination = isReviewMode
      ? `/student/assignments/${submitScope.assignmentId}/overview`
      : (submitState.kind === 'completed' ? `/student/submissions/${submitState.submissionId}`
          : `/student/assignments/${submitScope.assignmentId}/overview`);
    if (submitState.kind === 'completed' && !isReviewMode) notifyAssignmentSubmitted();
    const timer = setTimeout(() => {
      if (viewGeneration.current === generation) navigate(destination, { replace: true });
    }, NAVIGATION_DELAY_MS);
    return () => clearTimeout(timer);
  }, [scopeReady, submitState, submitScope, viewKey, navigate, isReviewMode]);

  const handleSelectAnswer = (questionId: number, answer: StudentQuizAnswer) => {
    if (canSubmitModule) {
      setSelectedAnswers(prev => {
        const next = { ...prev, [questionId]: answer };
        if (import.meta.env?.MODE !== 'test' && numericId && submitScope?.moduleId) {
          try {
            localStorage.setItem(`eh_draft_quiz_${numericId}_${submitScope.moduleId}`, JSON.stringify(next));
          } catch { /* ignore */ }
        }
        return next;
      });
    }
  };

  const toggleBookmark = (qId: number) => {
    setBookmarkedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const unansweredCount = validQuestionCount - answeredCount;

  const handleSubmit = () => {
    if (assignment?.status === 'CLOSED') {
      toastError('Bài tập này đã được giáo viên đóng. Không thể nộp bài.');
      return;
    }
    if (!canSubmitModule) return;
    if (!quizPayload.validation.isValid) {
      setError(questionDataError);
      return;
    }
    if (isStudentQuizBlank(questions, selectedAnswers)) {
      toastWarning('Vui lòng trả lời ít nhất một câu hỏi trước khi nộp phần thi này.');
      return;
    }
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(false);
    setError(null);
    void quizSubmit.submit(quizPayload.answers);
  };

  const handleRetryFinal = () => {
    if (!scopeReady || isLoading || assignment?.status === 'CLOSED') return;
    setError(null);
    void quizSubmit.retryFinal();
  };

  interface QuestionReviewInfo {
    questionId: number;
    questionNumber: number;
    questionType: string;
    isAnswered: boolean;
    isCorrect: boolean | null;
    studentAnswerText: string;
    correctAnswerText: string;
    correctOptionId: number | null;
    correctOptionIndex: number;
    explanation: string;
    evidence: string;
  }

  const reviewQuestionsInfo = useMemo<Record<number, QuestionReviewInfo>>(() => {
    const map: Record<number, QuestionReviewInfo> = {};
    if (!Array.isArray(questions)) return map;

    const rawQuestionsMap = new Map<number, unknown>();
    questions.forEach((q: unknown) => {
      if (q && typeof (q as { id?: unknown }).id === 'number') {
        rawQuestionsMap.set((q as { id: number }).id, q);
      }
    });

    validatedQuestions.forEach((result, idx) => {
      const q = result.question;
      if (!q) return;
      const rawQ = (rawQuestionsMap.get(q.id) || q) as Record<string, unknown>;
      const qNum = typeof rawQ.orderIndex === 'number' ? rawQ.orderIndex : idx + 1;
      const qType = q.questionType;
      const currentAns = selectedAnswers[q.id];
      const isMcq = qType === 'MULTIPLE_CHOICE';

      let isAnswered = false;
      let studentAnswerText = '--';
      let correctAnswerText: string;
      let correctOptionId: number | null = null;
      let correctOptionIndex = 0;
      let isCorrect: boolean | null = null;

      if (isMcq) {
        const mcq = extractReadingMcqOptions(
          rawQ.correctAnswer as Record<string, unknown> | null,
          Array.isArray(rawQ.options) ? rawQ.options : q.options
        );
        correctOptionIndex = mcq.correctOptionIndex;
        correctAnswerText = mcq.correctOptionContent
          ? `${String.fromCharCode(65 + mcq.correctOptionIndex)}. ${mcq.correctOptionContent}`
          : '--';

        const opts = (Array.isArray(rawQ.options) ? rawQ.options : q.options) as Array<{ id: number; content: string }>;
        if (Array.isArray(opts) && opts.length > mcq.correctOptionIndex) {
          correctOptionId = opts[mcq.correctOptionIndex]?.id ?? null;
        }

        if (currentAns?.questionType === 'MULTIPLE_CHOICE' && currentAns.selectedOptionId) {
          isAnswered = true;
          const optIdx = opts?.findIndex((o) => o.id === currentAns.selectedOptionId);
          if (optIdx !== undefined && optIdx >= 0) {
            studentAnswerText = `${String.fromCharCode(65 + optIdx)}. ${opts[optIdx].content}`;
            isCorrect = (correctOptionId !== null && currentAns.selectedOptionId === correctOptionId) || optIdx === mcq.correctOptionIndex;
          } else {
            studentAnswerText = `Lựa chọn #${currentAns.selectedOptionId}`;
            isCorrect = false;
          }
        }
      } else {
        const shortAns = extractReadingShortAnswerText(rawQ.correctAnswer as Record<string, unknown> | null);
        correctAnswerText = shortAns || '--';
        if (currentAns?.questionType === 'SHORT_ANSWER' && typeof currentAns.text === 'string' && currentAns.text.trim()) {
          isAnswered = true;
          studentAnswerText = currentAns.text.trim();
          if (shortAns) {
            isCorrect = studentAnswerText.toLowerCase() === shortAns.trim().toLowerCase();
          }
        }
      }

      // If submissionModuleDetail.answers provided isCorrect directly, adopt it
      const subAns = submissionModuleDetail?.answers?.find((a) => a.questionId === q.id);
      if (subAns?.content && typeof subAns.content === 'object') {
        const c = subAns.content as Record<string, unknown>;
        if (typeof c.isCorrect === 'boolean') isCorrect = c.isCorrect;
        else if (typeof c.is_correct === 'boolean') isCorrect = c.is_correct;
      }

      const cAnsObj = (rawQ.correctAnswer && typeof rawQ.correctAnswer === 'object') ? (rawQ.correctAnswer as Record<string, unknown>) : null;
      const explanation = (rawQ.explanation || cAnsObj?.explanation || cAnsObj?.note || 'Đối chiếu với dẫn chứng trong bài đọc và đáp án chuẩn của bài thi.') as string;
      const evidence = (rawQ.evidence || cAnsObj?.evidence || '') as string;

      map[q.id] = {
        questionId: q.id,
        questionNumber: qNum,
        questionType: qType,
        isAnswered,
        isCorrect: isAnswered ? isCorrect : null,
        studentAnswerText,
        correctAnswerText,
        correctOptionId,
        correctOptionIndex,
        explanation,
        evidence
      };
    });

    return map;
  }, [questions, validatedQuestions, selectedAnswers, submissionModuleDetail]);

  const reviewStats = useMemo(() => {
    const list = Object.values(reviewQuestionsInfo);
    const total = list.length || validQuestionCount || 0;
    const correctCount = list.filter((item) => item.isCorrect === true).length;
    const incorrectCount = list.filter((item) => item.isAnswered && item.isCorrect === false).length;
    const unansweredCount = list.filter((item) => !item.isAnswered).length;
    const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return {
      total,
      correctCount,
      incorrectCount,
      unansweredCount,
      scorePercent
    };
  }, [reviewQuestionsInfo, validQuestionCount]);

  const handleParagraphMouseUp = (paragraphIndex: number, paragraphText: string, event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setFloatingPalette(null);
      return;
    }
    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setFloatingPalette(null);
      return;
    }

    let startOffset = paragraphText.indexOf(selectedText);
    if (startOffset === -1) {
      const range = selection.getRangeAt(0);
      startOffset = Math.max(0, range.startOffset);
    }
    const endOffset = startOffset + selectedText.length;

    let x = event.clientX;
    let y = event.clientY - 40;
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = rect.left + rect.width / 2;
        y = rect.top - 45 + (window.scrollY || window.pageYOffset || 0);
      }
    } catch {
      // fallback
    }

    setFloatingPalette({
      x: Math.max(10, x),
      y: Math.max(10, y),
      paragraphIndex,
      startOffset,
      endOffset,
      selectedText
    });
  };

  const handleApplyHighlight = (color: HighlightColor) => {
    if (!floatingPalette || !numericId || !moduleDetail?.id) return;
    const newHighlight: HighlightItem = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      paragraphIndex: floatingPalette.paragraphIndex,
      startOffset: floatingPalette.startOffset,
      endOffset: floatingPalette.endOffset,
      color,
      text: floatingPalette.selectedText,
      createdAt: Date.now()
    };
    const updated = [...highlights, newHighlight];
    setHighlights(updated);
    saveHighlights(numericId, moduleDetail.id, updated);
    setFloatingPalette(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleRemoveHighlight = (highlightId: string) => {
    if (!numericId || !moduleDetail?.id) return;
    const updated = highlights.filter(h => h.id !== highlightId);
    setHighlights(updated);
    saveHighlights(numericId, moduleDetail.id, updated);
  };

  const handleClearAllHighlights = () => {
    if (!numericId || !moduleDetail?.id) return;
    clearHighlights(numericId, moduleDetail.id);
    setHighlights([]);
    setFloatingPalette(null);
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
            <span className="exam-breadcrumbs-link" onClick={() => navigate('/student/dashboard')}>
              Trang chủ
            </span>
            <ChevronRight size={14} />
            <span className="exam-breadcrumbs-link" onClick={() => navigate('/student/assignments')}>
              Danh sách bài tập
            </span>
            <ChevronRight size={14} />
            <span className="exam-breadcrumbs-title">
              {assignment?.title || `Reading #${id}`}
            </span>
            <ChevronRight size={14} />
            <span className="exam-skill-badge exam-skill-badge-reading">
              Kỹ năng Đọc
            </span>
          </div>
        </div>

        {effectiveModules.length > 1 && (
          <div className="exam-header-right">
            <ExamStepper
              variant="compact"
              modules={effectiveModules}
              submissionModules={submission?.modules}
              currentSkill="READING"
              assignmentId={numericId}
              submissionId={submission?.id}
              onSelectModule={(skill, step) => {
                if (step.isAccessible && step.status !== 'ACTIVE') {
                  const baseRoute = getSkillRoute(skill, numericId, submission?.id, step.module.id);
                  const targetUrl = step.isCompleted ? `${baseRoute}&mode=review` : baseRoute;
                  navigate(targetUrl);
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

      {/* Mobile Tab Switcher (< 768px) */}
      <div className="exam-mobile-tab-bar" role="tablist" aria-label="Reading section tabs">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'passage'}
          className={`exam-mobile-tab-btn ${mobileTab === 'passage' ? 'active' : ''}`}
          onClick={() => setMobileTab('passage')}
        >
          <BookOpen size={16} />
          <span>Bài đọc</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === 'questions'}
          className={`exam-mobile-tab-btn ${mobileTab === 'questions' ? 'active' : ''}`}
          onClick={() => setMobileTab('questions')}
        >
          <HelpCircle size={16} />
          <span>Câu hỏi ({Object.keys(selectedAnswers).length}/{totalQuestions})</span>
        </button>
      </div>

      {/* Main 2-Column Split Workspace */}
      <div className="exam-workspace-grid">
        {/* Left Column: Reading Passage */}
        <div className={`exam-pane-left ${mobileTab !== 'passage' ? 'mobile-hidden' : ''}`}>
          <div className="exam-passage-header">
            <div className="exam-passage-label">
              <BookOpen size={18} />
              <span>READING PASSAGE</span>
            </div>
            <div className="reading-highlight-toolbar">
              {highlights.length > 0 && (
                <span className="reading-highlight-count-pill" title={`${highlights.length} đoạn đã highlight`}>
                  {highlights.length} highlight
                </span>
              )}
              <Button 
                variant="secondary"
                size="sm"
                icon={Highlighter}
                onClick={() => {
                  toastWarning('Bôi đen văn bản trong đoạn đọc để mở bảng màu highlight.');
                }}
              >
                Highlight
              </Button>
              {highlights.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={handleClearAllHighlights}
                  title="Xóa tất cả highlight"
                >
                  Xóa tất cả
                </Button>
              )}
            </div>
          </div>

          <div className="exam-passage-body">
            <h1 className="exam-passage-title">
              {assignment?.title || 'Bài đọc'}
            </h1>
            <p className="exam-passage-subtitle">
              {totalQuestions > 0 ? `Đọc đoạn văn sau và trả lời các câu hỏi từ 1 đến ${totalQuestions}.` : 'Đọc đoạn văn sau.'}
            </p>

            <div className="exam-passage-paragraphs">
              {moduleDetail?.instructions ? (
                moduleDetail.instructions
                  .split('\n\n')
                  .filter((p: string) => p.trim())
                  .map((paragraph: string, index: number) => (
                    <div key={index} className="exam-paragraph-item">
                      <div className="exam-paragraph-header">
                        <span className="exam-paragraph-tag">
                          PARAGRAPH {index + 1}
                        </span>
                      </div>
                      <p 
                        className="exam-paragraph-text"
                        onMouseUp={(e) => handleParagraphMouseUp(index, paragraph, e)}
                      >
                        {renderHighlightedParagraph(paragraph, index, highlights, handleRemoveHighlight)}
                      </p>
                    </div>
                  ))
              ) : (
                <div className="exam-empty-box">
                  <BookOpen size={40} className="exam-empty-icon" />
                  <p className="exam-empty-title">Chưa có nội dung bài đọc</p>
                  <span className="exam-empty-desc">Nội dung bài đọc chưa được cập nhật cho phần thi này.</span>
                </div>
              )}
            </div>

            {/* Floating Highlight Palette */}
            {floatingPalette && (
              <div
                className="reading-floating-palette"
                role="toolbar"
                aria-label="Bảng màu highlight"
                style={{
                  left: `${floatingPalette.x}px`,
                  top: `${floatingPalette.y}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <button
                  type="button"
                  className="reading-palette-color-btn yellow"
                  title="Highlight màu Vàng (Ý chính)"
                  aria-label="Highlight màu Vàng"
                  onClick={() => handleApplyHighlight('yellow')}
                />
                <button
                  type="button"
                  className="reading-palette-color-btn green"
                  title="Highlight màu Xanh lá (Dẫn chứng đáp án)"
                  aria-label="Highlight màu Xanh lá"
                  onClick={() => handleApplyHighlight('green')}
                />
                <button
                  type="button"
                  className="reading-palette-color-btn pink"
                  title="Highlight màu Hồng (Từ vựng quan trọng)"
                  aria-label="Highlight màu Hồng"
                  onClick={() => handleApplyHighlight('pink')}
                />
                <div className="reading-palette-divider" />
                <button
                  type="button"
                  className="reading-palette-action-btn"
                  onClick={() => setFloatingPalette(null)}
                  title="Đóng bảng màu"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Questions */}
        <div className={`exam-pane-right ${mobileTab !== 'questions' ? 'mobile-hidden' : ''}`}>
          {/* Review Mode Banner */}
          {isReviewMode && (
            <div className="exam-review-banner" role="region" aria-label="Review Mode">
              <div className="exam-review-banner-left">
                <div className="exam-review-banner-icon">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="exam-review-banner-title">
                    Chế độ xem lại bài làm &amp; Đối chiếu đáp án (UC020, UC032)
                  </h3>
                  <p className="exam-review-banner-desc">
                    Đối chiếu trực quan câu trả lời của bạn với đáp án chuẩn, giải thích chi tiết và dẫn chứng bài đọc.
                  </p>
                </div>
              </div>
              <div className="exam-review-stats">
                <span className="exam-review-stat-pill correct">
                  ✓ Đúng: {reviewStats.correctCount} / {reviewStats.total}
                </span>
                <span className="exam-review-stat-pill incorrect">
                  ✗ Sai: {reviewStats.incorrectCount}
                </span>
                <span className="exam-review-stat-pill score">
                  Điểm: {reviewStats.scorePercent}%
                </span>
              </div>
            </div>
          )}

          <div className="exam-questions-header">
            {/* Review Filter Tabs */}
            {isReviewMode && totalQuestions > 0 && (
              <div className="exam-review-filter-tabs" role="tablist" aria-label="Lọc câu hỏi">
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewFilter === 'ALL'}
                  className={`exam-review-filter-btn ${reviewFilter === 'ALL' ? 'is-active' : ''}`}
                  onClick={() => setReviewFilter('ALL')}
                >
                  Tất cả ({totalQuestions})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewFilter === 'CORRECT'}
                  className={`exam-review-filter-btn ${reviewFilter === 'CORRECT' ? 'is-active' : ''}`}
                  onClick={() => {
                    setReviewFilter('CORRECT');
                    const first = validatedQuestions.findIndex((r) => r.question && reviewQuestionsInfo[r.question.id]?.isCorrect === true);
                    if (first !== -1) setActiveQuestion(first + 1);
                  }}
                >
                  Đúng ({reviewStats.correctCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewFilter === 'INCORRECT'}
                  className={`exam-review-filter-btn ${reviewFilter === 'INCORRECT' ? 'is-active' : ''}`}
                  onClick={() => {
                    setReviewFilter('INCORRECT');
                    const first = validatedQuestions.findIndex((r) => r.question && reviewQuestionsInfo[r.question.id]?.isAnswered && reviewQuestionsInfo[r.question.id]?.isCorrect === false);
                    if (first !== -1) setActiveQuestion(first + 1);
                  }}
                >
                  Sai ({reviewStats.incorrectCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={reviewFilter === 'UNANSWERED'}
                  className={`exam-review-filter-btn ${reviewFilter === 'UNANSWERED' ? 'is-active' : ''}`}
                  onClick={() => {
                    setReviewFilter('UNANSWERED');
                    const first = validatedQuestions.findIndex((r) => r.question && !reviewQuestionsInfo[r.question.id]?.isAnswered);
                    if (first !== -1) setActiveQuestion(first + 1);
                  }}
                >
                  Chưa làm ({reviewStats.unansweredCount})
                </button>
              </div>
            )}

            <div className="exam-questions-meta">
              <div>
                <h2 className="exam-questions-title">
                  Danh sách câu hỏi {totalQuestions > 0 ? `(1 - ${totalQuestions})` : ''}
                </h2>
                <span className="exam-questions-hint">
                  {isReviewMode
                    ? 'Xem lại câu trả lời và đối chiếu với đáp án chuẩn bên dưới'
                    : (totalQuestions > 0 ? 'Chọn đáp án đúng nhất cho từng câu' : 'Chưa có câu hỏi nào được gán')}
                </span>
              </div>
              {totalQuestions > 0 && !isReviewMode && (
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
                  const qItem = result.question;
                  const isAnswered = qItem !== null && answeredQuestionIds.has(qItem.id);
                  const isBookmarked = bookmarkedQuestions[qId];
                  const isActive = activeQuestion === qId;
                  const revInfo = qItem ? reviewQuestionsInfo[qItem.id] : null;
                  
                  const btnClasses = [
                    'exam-nav-btn',
                    isActive ? 'is-active' : '',
                    isBookmarked ? 'is-bookmarked' : '',
                    isReviewMode && revInfo
                      ? revInfo.isCorrect === true
                        ? 'is-correct'
                        : revInfo.isAnswered && revInfo.isCorrect === false
                          ? 'is-incorrect'
                          : 'is-unanswered'
                      : (!isActive && !isBookmarked && isAnswered ? 'is-answered' : '')
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
                <BookOpen size={40} className="exam-empty-icon" />
                <p className="exam-empty-title">Chưa có câu hỏi cho bài đọc này</p>
                <span className="exam-empty-desc">Giáo viên chưa cập nhật danh sách câu hỏi. Vui lòng quay lại sau.</span>
              </div>
            ) : currentQuestionResult?.reason ? (
              <div className="exam-alert-error" role="alert">
                <p>Câu {currentQuestionResult.index + 1} có dữ liệu không hợp lệ.</p>
              </div>
            ) : currentQuestionItem ? (() => {
              const isShortAnswer = currentQuestionItem.questionType === 'SHORT_ANSWER';
              const currentAnswer = selectedAnswers[currentQuestionItem.id];
              const revInfo = reviewQuestionsInfo[currentQuestionItem.id];
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
                      {isReviewMode && revInfo && (
                        <span className={`exam-review-stat-pill ${revInfo.isCorrect ? 'correct' : revInfo.isAnswered ? 'incorrect' : ''}`}>
                          {revInfo.isCorrect ? '✓ Đúng' : revInfo.isAnswered ? '✗ Sai' : 'Chưa làm'}
                        </span>
                      )}
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
                      <div className="flex items-center justify-between mb-2">
                        <label 
                          htmlFor={`short-answer-${currentQuestionItem.id || activeQuestion}`} 
                          className="exam-short-answer-label font-bold text-sm text-slate-800"
                        >
                          Điền đáp án cho ô trống [{activeQuestion}]:
                        </label>
                        {!isReviewMode && (
                          <span className="text-xs text-muted">
                            (Không quá 3 từ / Chữ số)
                          </span>
                        )}
                      </div>
                      <input
                        id={`short-answer-${currentQuestionItem.id || activeQuestion}`}
                        type="text"
                        className={`exam-short-answer-input ${isReviewMode ? (revInfo?.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50') : ''}`}
                        disabled={!canSubmitModule || isReviewMode}
                        placeholder={isReviewMode ? '(Chưa có câu trả lời)' : `Nhập từ/cụm từ điền vào ô trống #${activeQuestion}...`}
                        value={currentAnswer?.questionType === 'SHORT_ANSWER' ? currentAnswer.text : ''}
                        onChange={(e) => handleSelectAnswer(currentQuestionItem.id, { questionType: 'SHORT_ANSWER', text: e.target.value })}
                        autoComplete="off"
                      />
                      {isReviewMode && revInfo && (
                        <div className="exam-short-answer-correct-box mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                          <span className="font-bold text-emerald-800">Đáp án chuẩn: </span>
                          <strong className="text-emerald-950">{revInfo.correctAnswerText || '--'}</strong>
                        </div>
                      )}
                    </div>
                  ) : currentQuestionItem.questionType === 'MULTIPLE_CHOICE' ? (
                    /* Options */
                    <div className="exam-options-group">
                      {currentQuestionItem.options?.map((option, optIdx) => {
                        const isSelected = currentAnswer?.questionType === 'MULTIPLE_CHOICE' && currentAnswer.selectedOptionId === option.id;
                        const isCorrectOpt = isReviewMode && revInfo && (revInfo.correctOptionId === option.id || optIdx === revInfo.correctOptionIndex);

                        let optClass = 'exam-option-item';
                        if (isReviewMode) {
                          if (isCorrectOpt) {
                            optClass += ' is-correct-answer';
                          } else if (isSelected && !isCorrectOpt) {
                            optClass += ' is-student-wrong';
                          } else {
                            optClass += ' is-dimmed';
                          }
                        } else if (isSelected) {
                          optClass += ' is-selected';
                        }

                        return (
                          <label 
                            key={option.id}
                            onClick={() => {
                              if (!isReviewMode) {
                                handleSelectAnswer(currentQuestionItem.id, { questionType: 'MULTIPLE_CHOICE', selectedOptionId: option.id });
                              }
                            }}
                            className={optClass}
                            style={{ cursor: isReviewMode ? 'default' : 'pointer' }}
                          >
                            <span className="exam-option-key">{String.fromCharCode(65 + optIdx)}</span>
                            <span className="exam-option-content">{option.content}</span>

                            {isReviewMode && isCorrectOpt && (
                              <span className="exam-option-status-badge correct">
                                <CheckCircle2 size={13} />
                                <span>Đáp án đúng</span>
                              </span>
                            )}
                            {isReviewMode && isSelected && !isCorrectOpt && (
                              <span className="exam-option-status-badge wrong">
                                <XCircle size={13} />
                                <span>Bạn đã chọn</span>
                              </span>
                            )}
                            {isReviewMode && isSelected && isCorrectOpt && (
                              <span className="exam-option-status-badge correct" style={{ marginLeft: 4 }}>
                                <span>(Lựa chọn của bạn)</span>
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Explanation Card */}
                  {isReviewMode && revInfo && (
                    <div className="exam-explanation-card">
                      <div className="exam-explanation-header">
                        <Lightbulb size={16} />
                        <span>Giải thích chi tiết &amp; Dẫn chứng</span>
                      </div>
                      <p className="exam-explanation-text">
                        {revInfo.explanation}
                      </p>
                      {revInfo.evidence ? (
                        <div className="exam-explanation-quote">
                          <strong>Dẫn chứng bài đọc: </strong>
                          &ldquo;{revInfo.evidence}&rdquo;
                        </div>
                      ) : null}
                    </div>
                  )}
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
                disabled={activeQuestion <= 1}
              >
                Câu trước
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => setActiveQuestion(Math.min(totalQuestions, activeQuestion + 1))}
                disabled={activeQuestion >= totalQuestions}
              >
                Câu sau
              </Button>
            </div>

            <div className="exam-pane-footer-submit">
              {isReviewMode ? (
                <Button 
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/student/assignments/${id}/overview`)}
                  className="w-full"
                >
                  Quay lại tổng quan bài thi
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  size="md"
                  loading={isSubmitting}
                  disabled={!canSubmitModule || isSubmitting}
                  onClick={handleSubmit}
                  className="w-full"
                >
                  Hoàn thành & Nộp phần Đọc
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showSubmitConfirm && canSubmitModule}
        title={t('readingSubmit.title')}
        message={unansweredCount > 0
          ? t('readingSubmit.unanswered').replace('{count}', String(unansweredCount))
          : t('readingSubmit.message')}
        confirmText={t('readingSubmit.confirm')}
        cancelText={t('readingSubmit.cancel')}
        closeLabel={t('readingSubmit.close')}
        variant={unansweredCount > 0 ? 'warning' : 'primary'}
        trapFocus
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
};

export default StudentAssignmentReading;
