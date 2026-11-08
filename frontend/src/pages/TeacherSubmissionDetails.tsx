import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, FileText, ChevronLeft, ChevronRight,
  User,
  Save, Send, RefreshCw, AlertCircle, CheckCircle2, Sparkles,
  XCircle, Plus, Trash2
} from 'lucide-react';
import { MetricCard, FileItem, StickyActionBar, Button, EmptyState, MarkdownView, StatusBadge, LoadingState } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { getAnnotationErrorKind, type AnnotationErrorKind } from '../hooks/useStudentAnswerAnnotations';
import { parseApiError } from '../api';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionListItem,
  type SubmissionModuleDetailResponse,
  isModuleGraded
} from '../api/services/submission.service';
import {
  gradingService,
  type AiGradingSuggestionResponse,
  type SubmissionModuleGradingResponse,
  type GradingDetailResponse
} from '../api/services/grading.service';
import {
  answerAnnotationService,
  type GradingAnnotation
} from '../api/services/answer-annotation.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService } from '../api/services/module.service';
import { classService } from '../api/services/class.service';
import { resolveAudioUrl } from '../utils/audioUrl.utils';
import { extractTranscriptText, extractAnnotationSnippet } from '../utils/annotationSnippet.utils';

const resolveStorageUrl = resolveAudioUrl;

const getFileNameFromKey = (storageKey: string): string => {
  const baseName = storageKey.split('/').pop();
  return baseName || storageKey;
};

interface AnnotationRequestContext {
  generation: number;
  moduleId: number | null;
  answerId: number | null;
  isLoading: boolean;
}

interface AnnotationDataContext {
  moduleId: number;
  answerId: number | null;
}

export const TeacherSubmissionDetails: React.FC = () => {
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [audioUrlOverride, setAudioUrlOverride] = useState<{ moduleId: number; answerId: number; url: string } | null>(null);
  const [audioErrorContext, setAudioErrorContext] = useState<{ moduleId: number; answerId: number } | null>(null);
  const [audioLoadingContext, setAudioLoadingContext] = useState<{ moduleId: number; answerId: number } | null>(null);
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
  const [moduleInstructions, setModuleInstructions] = useState<string>('');
  const [aiSuggestion, setAiSuggestion] = useState<AiGradingSuggestionResponse | null>(null);
  const [gradingSummary, setGradingSummary] = useState<SubmissionModuleGradingResponse | null>(null);
  const [gradingDetail, setGradingDetail] = useState<GradingDetailResponse | null>(null);
  const [annotations, setAnnotations] = useState<GradingAnnotation[]>([]);
  const [annotationDataContext, setAnnotationDataContext] = useState<AnnotationDataContext | null>(null);
  const [isLoadingAnnotations, setIsLoadingAnnotations] = useState<boolean>(false);
  const [annotationError, setAnnotationError] = useState<AnnotationErrorKind | null>(null);
  const [usingAnnotationFallback, setUsingAnnotationFallback] = useState(false);
  const [reviewingAnnotationIds, setReviewingAnnotationIds] = useState<Record<number, boolean>>({});
  const [deletingAnnotationIds, setDeletingAnnotationIds] = useState<Record<number, boolean>>({});
  const [annotationFilter, setAnnotationFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState<boolean>(false);
  const [isSubmittingAnnotation, setIsSubmittingAnnotation] = useState<boolean>(false);
  const [newAnnErrorType, setNewAnnErrorType] = useState<string>('GRAMMAR');
  const [newAnnSuggestedFix, setNewAnnSuggestedFix] = useState<string>('');
  const [newAnnComment, setNewAnnComment] = useState<string>('');
  const [newAnnStartOffset, setNewAnnStartOffset] = useState<string>('0');
  const [newAnnEndOffset, setNewAnnEndOffset] = useState<string>('0');
  const isMountedRef = useRef(false);
  const moduleLoadGenerationRef = useRef(0);
  const annotationRequestRef = useRef<AnnotationRequestContext>({
    generation: 0,
    moduleId: null,
    answerId: null,
    isLoading: false,
  });
  const submissionIdentityRef = useRef<string | null>(null);
  const aiPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gradeNavigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiRequestRef = useRef<AnnotationRequestContext | null>(null);
  const createRequestRef = useRef<AnnotationRequestContext | null>(null);
  const deleteRequestsRef = useRef(new Map<number, AnnotationRequestContext>());
  const gradeRequestRef = useRef<AnnotationRequestContext | null>(null);
  const annotationItemsRef = useRef<GradingAnnotation[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioRequestRef = useRef(0);
  const audioFallbackUsedRef = useRef(false);
  const pendingAudioTimeRef = useRef<number | null>(null);
  const audioContextRef = useRef<{ moduleId: number; answerId: number } | null>(null);
  useEffect(() => { annotationItemsRef.current = annotations; }, [annotations]);

  const isCurrentAction = useCallback((context: AnnotationRequestContext) => {
    const current = annotationRequestRef.current;
    return isMountedRef.current &&
      context.generation === moduleLoadGenerationRef.current &&
      current.generation === context.generation &&
      current.moduleId === context.moduleId &&
      current.answerId === context.answerId && !current.isLoading;
  }, []);

  const cancelContextActions = useCallback(() => {
    if (aiPollTimerRef.current !== null) clearTimeout(aiPollTimerRef.current);
    if (gradeNavigationTimerRef.current !== null) clearTimeout(gradeNavigationTimerRef.current);
    if (toastTimeoutRef.current !== null) clearTimeout(toastTimeoutRef.current);
    aiPollTimerRef.current = null;
    gradeNavigationTimerRef.current = null;
    toastTimeoutRef.current = null;
    aiRequestRef.current = null;
    createRequestRef.current = null;
    deleteRequestsRef.current.clear();
    annotationItemsRef.current = [];
    gradeRequestRef.current = null;
  }, []);
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


  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const handleViewDocument = (storageKey: string) => {
    const url = resolveStorageUrl(storageKey);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadDocument = (storageKey: string) => {
    const url = resolveStorageUrl(storageKey);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    const fileName = getFileNameFromKey(storageKey);
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isVi ? 'Đang tạo liên kết tải tài liệu...' : 'Preparing download...');
  };

  const showToast = (msg: string) => {
    if (!isMountedRef.current) return;
    setToastMessage(msg);

    if (toastTimeoutRef.current !== null) {
      clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      moduleLoadGenerationRef.current += 1;
      annotationRequestRef.current = {
        generation: moduleLoadGenerationRef.current,
        moduleId: null,
        answerId: null,
        isLoading: false,
      };
      cancelContextActions();
    };
  }, [cancelContextActions]);

  const loadModuleData = useCallback(async (targetModuleId: number) => {
    if (!isMountedRef.current) return;

    cancelContextActions();
    setIsAnalyzingAi(false);
    setIsSubmittingGrade(false);
    setIsSubmittingAnnotation(false);
    setDeletingAnnotationIds({});
    setIsCreatingAnnotation(false);
    setToastMessage(null);
    const generation = ++moduleLoadGenerationRef.current;
    annotationRequestRef.current = {
      generation,
      moduleId: targetModuleId,
      answerId: null,
      isLoading: true,
    };
    setAnnotationDataContext(null);
    setAnnotations([]);
    setIsLoadingAnnotations(true);
    setAnnotationError(null);
    setUsingAnnotationFallback(false);
    setReviewingAnnotationIds({});
    setFinalScoreInput('');
    setFeedbackText('');
    setGradingSummary(null);
    setGradingDetail(null);
    setAiSuggestion(null);
    setModuleInstructions('');

    const isCurrentModuleLoad = () =>
      isMountedRef.current &&
      moduleLoadGenerationRef.current === generation &&
      annotationRequestRef.current.generation === generation &&
      annotationRequestRef.current.moduleId === targetModuleId;

    let currentModDetail: SubmissionModuleDetailResponse | null = null;
    let currentAiSuggestion: AiGradingSuggestionResponse | null = null;

    try {
      const modDetailRes = await submissionService.getSubmissionModuleDetail(targetModuleId);
      if (!isCurrentModuleLoad()) return;
      setModuleDetail(modDetailRes);
      currentModDetail = modDetailRes;

      if (modDetailRes.moduleId && typeof moduleService?.getModule === 'function') {
        void moduleService.getModule(modDetailRes.moduleId).then((mRes) => {
          if (isCurrentModuleLoad() && mRes?.instructions) {
            setModuleInstructions(mRes.instructions);
          }
        }).catch(() => {
          // ignore
        });
      }
    } catch {
      if (!isCurrentModuleLoad()) return;
      setModuleDetail(null);
    }

    let resolvedGradingId: number | null = null;
    let gradingStatus: string | null = null;
    try {
      const gradingRes = await gradingService.getBySubmissionModuleId(targetModuleId);
      if (!isCurrentModuleLoad()) return;
      setGradingSummary(gradingRes);
      gradingStatus = gradingRes.status || null;
      if (gradingRes.finalScore != null) {
        setFinalScoreInput(String(gradingRes.finalScore));
      }
      if (gradingRes.id) {
        resolvedGradingId = gradingRes.id;
      }
    } catch {
      if (!isCurrentModuleLoad()) return;
      setGradingSummary(null);
    }

    if (!resolvedGradingId && currentModDetail?.grading?.id) {
      resolvedGradingId = currentModDetail.grading.id;
      gradingStatus = currentModDetail.grading.status || gradingStatus;
    }

    if (resolvedGradingId) {
      try {
        const detail = await gradingService.getById(resolvedGradingId);
        if (!isCurrentModuleLoad()) return;
        setGradingDetail(detail);
        if (detail.finalScore != null) {
          setFinalScoreInput(String(detail.finalScore));
        }
        if (detail.finalFeedback) {
          setFeedbackText(detail.finalFeedback);
        } else if (detail.aiFeedback) {
          setFeedbackText(detail.aiFeedback);
        }
      } catch {
        if (!isCurrentModuleLoad()) return;
        // ignore
      }
    }

    if (gradingStatus === 'COMPLETED') {
      try {
        localStorage.removeItem(`eh_draft_grading_${targetModuleId}`);
      } catch {
        // ignore
      }
    } else {
      try {
        const localDraft = localStorage.getItem(`eh_draft_grading_${targetModuleId}`);
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          if (parsed && typeof parsed === 'object') {
            if (parsed.score != null && parsed.score !== '') {
              setFinalScoreInput(String(parsed.score));
            }
            if (parsed.feedback != null && parsed.feedback !== '') {
              setFeedbackText(String(parsed.feedback));
            }
          }
        }
      } catch {
        // ignore
      }
    }

    try {
      const aiRes = await gradingService.getAiSuggestion(targetModuleId);
      if (!isCurrentModuleLoad()) return;
      setAiSuggestion(aiRes);
      currentAiSuggestion = aiRes;
      if (aiRes.aiFeedback) {
        setFeedbackText((prev) => prev || aiRes.aiFeedback || '');
      }
      if (aiRes.suggestedScore != null) {
        setFinalScoreInput((prev) => (!prev ? String(aiRes.suggestedScore) : prev));
      }
    } catch {
      if (!isCurrentModuleLoad()) return;
      setAiSuggestion(null);
    }

    // Fetch Annotations for current module answer
    const targetAns = currentModDetail?.answers?.find((a) => !!a.audioStorageKey) || currentModDetail?.answers?.[0];
    const targetAnswerId = targetAns?.id ?? null;
    if (!isCurrentModuleLoad()) return;
    annotationRequestRef.current = {
      generation,
      moduleId: targetModuleId,
      answerId: targetAnswerId,
      isLoading: true,
    };
    setAnnotationDataContext({ moduleId: targetModuleId, answerId: targetAnswerId });

    const isCurrentAnnotationRequest = () =>
      isCurrentModuleLoad() && annotationRequestRef.current.answerId === targetAnswerId;
    const fallbackAnnotations = currentAiSuggestion?.annotations ?? [];
    const applyFallbackAnnotations = () => {
      if (fallbackAnnotations.length === 0) {
        setAnnotations([]);
        return;
      }

      setUsingAnnotationFallback(true);
      setAnnotations(fallbackAnnotations.map((annotation) => ({
        id: annotation.id,
        source: annotation.source,
        startOffset: annotation.startOffset,
        endOffset: annotation.endOffset,
        errorType: annotation.errorType || null,
        comment: annotation.comment || null,
        suggestedFix: annotation.suggestedFix || null,
        reviewStatus: annotation.reviewStatus,
      })));
    };

    try {
      if (targetAnswerId !== null) {
        try {
          const annRes = await answerAnnotationService.listAnnotations(targetAnswerId);
          if (!isCurrentAnnotationRequest()) return;
          const fetchedAnns = annRes.data || [];
          if (fetchedAnns.length > 0) {
            setAnnotations(fetchedAnns);
          } else if (fallbackAnnotations.length > 0) {
            applyFallbackAnnotations();
          } else {
            setAnnotations([]);
          }
        } catch (error) {
          if (!isCurrentAnnotationRequest()) return;
          setAnnotationError(getAnnotationErrorKind(error));
          applyFallbackAnnotations();
        }
      } else if (fallbackAnnotations.length > 0) {
        if (!isCurrentAnnotationRequest()) return;
        applyFallbackAnnotations();
      } else {
        if (!isCurrentAnnotationRequest()) return;
        setAnnotations([]);
      }
    } finally {
      if (isCurrentAnnotationRequest()) {
        annotationRequestRef.current = { ...annotationRequestRef.current, isLoading: false };
        setIsLoadingAnnotations(false);
      }
    }
  }, [cancelContextActions]);

  const handleSelectModule = (modId: number) => {
    setSelectedModuleId(modId);
    setSearchParams({ moduleId: String(modId) }, { replace: true });
    loadModuleData(modId);
  };

  useEffect(() => {
    let isMounted = true;
    const submissionIdentity = `${id ?? ''}:${studentId ?? ''}`;
    if (submissionIdentityRef.current !== submissionIdentity) {
      submissionIdentityRef.current = submissionIdentity;
      cancelContextActions();
      setIsAnalyzingAi(false);
      setIsSubmittingGrade(false);
      setIsSubmittingAnnotation(false);
      setDeletingAnnotationIds({});
      setIsCreatingAnnotation(false);
      setToastMessage(null);
      const generation = ++moduleLoadGenerationRef.current;
      annotationRequestRef.current = {
        generation,
        moduleId: null,
        answerId: null,
        isLoading: false,
      };
      setAnnotationDataContext(null);
      setAnnotations([]);
      setIsLoadingAnnotations(false);
      setAnnotationError(null);
      setUsingAnnotationFallback(false);
      setReviewingAnnotationIds({});
    }
    if (!id || !studentId) return;

    const loadSubmissionData = async () => {
      try {
        const assignmentIdNum = Number(id);
        const studentIdNum = Number(studentId);

        // 1. Fetch assignment detail & all submissions for this assignment in parallel
        const [assignRes, allSubsRes] = await Promise.allSettled([
          assignmentService.getAssignment(assignmentIdNum),
          submissionService.listSubmissions({ assignmentId: assignmentIdNum, limit: 100 })
        ]);

        if (!isMounted) return;

        if (assignRes.status === 'rejected') {
          throw assignRes.reason;
        }

        if (assignRes.status === 'fulfilled') {
          setAssignment(assignRes.value);
        }

        const allSubsList: SubmissionListItem[] = allSubsRes.status === 'fulfilled' ? (allSubsRes.value.data || []) : [];

        // Set sibling submissions for Prev/Next
        const uniqueStudents = Array.from(
          new Set(allSubsList.filter((s) => s.status !== 'IN_PROGRESS').map((s) => s.studentId))
        ).map((sId) => ({ studentId: sId }));
        setClassSubmissions(uniqueStudents);

        // 2. Resolve student profile/name (prefer routeState if available to avoid heavy queries)
        if (routeState?.studentName) {
          setStudentInfo({
            name: routeState.studentName,
            email: routeState.studentEmail,
            code: routeState.studentCode || `HV-${studentIdNum.toString().padStart(4, '0')}`
          });
        } else {
          try {
            const classRes = await classService.list({ limit: 100 });
            const classesList = classRes.data || [];
            const membersList = await Promise.all(
              classesList.map(async (cls) => {
                try {
                  return await classService.listMembers(cls.id);
                } catch {
                  return [];
                }
              })
            );
            const resolvedMember = membersList.flat().find((m) => m.studentId === studentIdNum);
            if (isMounted) {
              if (resolvedMember) {
                setStudentInfo({
                  name: resolvedMember.fullName,
                  email: resolvedMember.email,
                  code: resolvedMember.studentCode || `HV-${studentIdNum.toString().padStart(4, '0')}`
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
              setStudentInfo({
                name: isVi ? `Học viên #${studentIdNum}` : `Student #${studentIdNum}`,
                code: `HV-${studentIdNum.toString().padStart(4, '0')}`
              });
            }
          }
        }

        // 3. Find submission for this student from the pre-fetched assignment submissions
        const studentSubs = allSubsList.filter((s) => s.studentId === studentIdNum);
        const completedSub = studentSubs.find((s) => s.status === 'GRADED' || s.status === 'SUBMITTED');
        const matchedSubItem = completedSub || (studentSubs.length > 0 ? studentSubs[0] : null);

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
  }, [id, studentId, isVi, reloadKey, searchParams, loadModuleData, routeState, cancelContextActions]);

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
    const context = { ...annotationRequestRef.current };
    const targetModuleId = activeModule?.id;
    if (!targetModuleId || context.moduleId !== targetModuleId ||
      !isCurrentAction(context) || aiRequestRef.current) return;

    aiRequestRef.current = context;
    setIsAnalyzingAi(true);
    try {
      showToast(isVi ? 'Đang gửi yêu cầu chấm điểm bằng AI...' : 'Requesting AI grading...');
      await gradingService.requestAiAnalysis(targetModuleId);
      if (!isCurrentAction(context)) return;
      showToast(isVi ? 'AI đang phân tích và chấm điểm bài nói...' : 'AI is analyzing and grading the speaking submission...');

      aiPollTimerRef.current = setTimeout(async () => {
        aiPollTimerRef.current = null;
        if (!isCurrentAction(context)) return;
        const loading = loadModuleData(targetModuleId);
        const pollContext = { ...context, generation: moduleLoadGenerationRef.current };
        try {
          await loading;
          if (!isCurrentAction(pollContext)) return;
          showToast(isVi ? 'AI đã hoàn thành chấm điểm!' : 'AI grading completed!');
        } catch (pollErr) {
          if (!isCurrentAction(pollContext)) return;
          console.error('Error refreshing grading after AI:', pollErr);
        } finally {
          if (isCurrentAction(pollContext)) setIsAnalyzingAi(false);
        }
      }, 3500);
    } catch (err) {
      if (!isCurrentAction(context)) return;
      aiRequestRef.current = null;
      console.error('Failed to trigger AI analyze:', err);
      const parsed = parseApiError(err);
      showToast(parsed.message || (isVi ? 'Lỗi khi kích hoạt AI. Vui lòng thử lại.' : 'Failed to trigger AI analysis.'));
      setIsAnalyzingAi(false);
    }
  };

  // Submit Grade
  const handleSaveGrade = async (isFinalize: boolean) => {
    const context = { ...annotationRequestRef.current };
    const gradingId = gradingSummary?.id;
    if (!gradingId) {
      if (!isMountedRef.current || (!isCurrentAction(context) && !(context.moduleId === null && submission?.status === 'IN_PROGRESS'))) return;
      showToast(isVi ? 'Chưa tìm thấy bản ghi chấm điểm của bài này.' : 'Grading record not found.');
      return;
    }

    if (!isCurrentAction(context) || context.moduleId !== activeModule?.id || gradeRequestRef.current) return;
    const normalizedScoreStr = finalScoreInput.trim().replace(',', '.');
    const scoreNum = parseFloat(normalizedScoreStr);
    if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      showToast(isVi ? 'Điểm số không hợp lệ (thang 0.0 - 10.0)!' : 'Invalid score (range 0.0 - 10.0)!');
      return;
    }

    // 1. If saving draft: persist locally and do NOT call submitGrade to avoid premature finalization
    if (!isFinalize) {
      const targetModuleId = activeModule?.id;
      if (targetModuleId) {
        try {
          localStorage.setItem(
            `eh_draft_grading_${targetModuleId}`,
            JSON.stringify({
              score: normalizedScoreStr,
              feedback: feedbackText,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.warn('Failed to save grading draft to localStorage', e);
        }
      }
      showToast(isVi ? 'Đã lưu bản nháp nhận xét!' : 'Grading draft saved!');
      return;
    }

    gradeRequestRef.current = context;
    setIsSubmittingGrade(true);
    try {
      await gradingService.submitGrade(gradingId, {
        finalScore: scoreNum,
        finalFeedback: feedbackText
      });

      if (!isCurrentAction(context)) return;

      // Clear local draft upon successful publication
      const targetModuleId = activeModule?.id;
      if (targetModuleId) {
        try {
          localStorage.removeItem(`eh_draft_grading_${targetModuleId}`);
        } catch {
          // ignore
        }
      }

      showToast(isVi
        ? 'Đã lưu điểm và trả bài cho học viên thành công!'
        : 'Grade finalized and published to student!');

      if (isFinalize) {
        gradeNavigationTimerRef.current = setTimeout(() => {
          gradeNavigationTimerRef.current = null;
          if (isCurrentAction(context)) navigate(`/teacher/assignments/${id}`);
        }, 1000);
      }
    } catch (err) {
      if (!isCurrentAction(context)) return;
      console.error('Failed to submit grade:', err);
      const parsed = parseApiError(err);
      showToast(parsed.message || (isVi ? 'Có lỗi xảy ra khi lưu điểm. Vui lòng thử lại!' : 'Failed to save grade. Please retry!'));
    } finally {
      if (isCurrentAction(context)) {
        gradeRequestRef.current = null;
        setIsSubmittingGrade(false);
      }
    }
  };

  const targetModuleId = activeModule?.id ?? null;
  const currentModuleDetail = moduleDetail?.id === targetModuleId ? moduleDetail : null;
  const audioAnswer = currentModuleDetail?.answers?.find((answer) =>
    Boolean(answer.audioDownloadUrl?.trim() || answer.audioStorageKey?.trim())
  );
  const directAudioUrl = audioAnswer?.audioDownloadUrl?.trim() || null;
  const currentAudioContext = targetModuleId && audioAnswer
    ? { moduleId: targetModuleId, answerId: audioAnswer.id }
    : null;
  const currentAudioModuleId = currentAudioContext?.moduleId ?? null;
  const currentAudioAnswerId = currentAudioContext?.answerId ?? null;
  useLayoutEffect(() => {
    audioContextRef.current = currentAudioModuleId !== null && currentAudioAnswerId !== null
      ? { moduleId: currentAudioModuleId, answerId: currentAudioAnswerId }
      : null;
  }, [currentAudioModuleId, currentAudioAnswerId]);

  const isSpeaking = activeModule?.skill === 'SPEAKING' ||
    currentModuleDetail?.answers?.some((answer) => Boolean(answer.audioDownloadUrl?.trim() || answer.audioStorageKey?.trim()));
  const audioUrl = currentAudioContext && audioUrlOverride?.moduleId === currentAudioContext.moduleId &&
    audioUrlOverride.answerId === currentAudioContext.answerId
    ? audioUrlOverride.url
    : directAudioUrl;
  const audioError = Boolean(currentAudioContext && audioErrorContext?.moduleId === currentAudioContext.moduleId &&
    audioErrorContext.answerId === currentAudioContext.answerId);
  const isAudioLoading = Boolean(currentAudioContext && audioLoadingContext?.moduleId === currentAudioContext.moduleId &&
    audioLoadingContext.answerId === currentAudioContext.answerId);

  const loadAudioFallback = useCallback(async (
    moduleId: number,
    answerId: number,
    requestId: number,
    preserveTime: boolean,
  ) => {
    if (preserveTime && audioRef.current && Number.isFinite(audioRef.current.currentTime)) {
      pendingAudioTimeRef.current = audioRef.current.currentTime;
    }
    setAudioLoadingContext({ moduleId, answerId });
    setAudioErrorContext(null);
    try {
      const response = await submissionService.getAudioDownloadUrl(moduleId);
      if (requestId !== audioRequestRef.current ||
        audioContextRef.current?.moduleId !== moduleId || audioContextRef.current.answerId !== answerId) return;
      const downloadUrl = response.downloadUrl?.trim();
      if (!downloadUrl) throw new Error('Audio URL is empty.');
      setAudioUrlOverride({ moduleId, answerId, url: downloadUrl });
    } catch {
      if (requestId !== audioRequestRef.current ||
        audioContextRef.current?.moduleId !== moduleId || audioContextRef.current.answerId !== answerId) return;
      setAudioErrorContext({ moduleId, answerId });
    } finally {
      if (requestId === audioRequestRef.current &&
        audioContextRef.current?.moduleId === moduleId && audioContextRef.current.answerId === answerId) {
        setAudioLoadingContext(null);
      }
    }
  }, []);

  useEffect(() => {
    const requestId = ++audioRequestRef.current;
    audioFallbackUsedRef.current = false;
    pendingAudioTimeRef.current = null;
    const audio = audioRef.current;
    audio?.pause();

    if (currentAudioModuleId !== null && currentAudioAnswerId !== null && isSpeaking && !directAudioUrl) {
      audioFallbackUsedRef.current = true;
      void loadAudioFallback(currentAudioModuleId, currentAudioAnswerId, requestId, false);
    }

    return () => {
      audioRequestRef.current += 1;
      audio?.pause();
    };
  }, [
    currentAudioModuleId,
    currentAudioAnswerId,
    directAudioUrl,
    isSpeaking,
    loadAudioFallback,
  ]);

  const handleAudioError = () => {
    if (!currentAudioContext || isAudioLoading) return;
    if (audioRef.current && Number.isFinite(audioRef.current.currentTime)) {
      pendingAudioTimeRef.current = audioRef.current.currentTime;
    }
    audioRef.current?.pause();

    if (audioFallbackUsedRef.current) {
      setAudioErrorContext(currentAudioContext);
      return;
    }

    audioFallbackUsedRef.current = true;
    void loadAudioFallback(
      currentAudioContext.moduleId,
      currentAudioContext.answerId,
      ++audioRequestRef.current,
      true,
    );
  };

  const handleAudioRetry = () => {
    if (!currentAudioContext) return;
    audioFallbackUsedRef.current = true;
    void loadAudioFallback(
      currentAudioContext.moduleId,
      currentAudioContext.answerId,
      ++audioRequestRef.current,
      true,
    );
  };

  const handleAudioMetadata = () => {
    const audio = audioRef.current;
    const savedTime = pendingAudioTimeRef.current;
    if (!audio || savedTime === null) return;
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = Math.min(Math.max(savedTime, 0), audio.duration);
    }
    pendingAudioTimeRef.current = null;
  };

  const targetAnswer = useMemo(() => {
    return moduleDetail?.answers?.find((a) => !!a.audioStorageKey) || moduleDetail?.answers?.[0] || null;
  }, [moduleDetail]);

  const annotationsMatchCurrentAnswer = Boolean(
    annotationDataContext &&
    activeModule?.id === annotationDataContext.moduleId &&
    (targetAnswer?.id ?? null) === annotationDataContext.answerId
  );
  const currentAnnotations = useMemo(
    () => (annotationsMatchCurrentAnswer ? annotations : []),
    [annotationsMatchCurrentAnswer, annotations]
  );
  const currentAnnotationError = annotationsMatchCurrentAnswer ? annotationError : null;
  const usingCurrentAnnotationFallback = annotationsMatchCurrentAnswer && usingAnnotationFallback;
  const canReviewCurrentAnnotations = Boolean(
    annotationsMatchCurrentAnswer &&
    annotationDataContext?.answerId !== null &&
    annotationDataContext?.answerId !== undefined &&
    !isLoadingAnnotations
  );

  // Extract attached documents (for Writing or file uploads)
  const attachedDocAnswers = useMemo(() => {
    return moduleDetail?.answers?.filter((a) => !!a.docStorageKey) || [];
  }, [moduleDetail?.answers]);

  const [loadedDocText, setLoadedDocText] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const txtAnswer = moduleDetail?.answers?.find(
      (a) => a.docStorageKey?.toLowerCase().endsWith('.txt') || a.docMimeType === 'text/plain'
    );
    if (!txtAnswer || !activeModule?.id) {
      return;
    }

    submissionService
      .getDocumentFileBlob(activeModule.id)
      .then((blob) => blob.text())
      .then((text) => {
        if (isMounted) setLoadedDocText(text);
      })
      .catch((err) => {
        console.warn('Failed to load essay.txt content:', err);
      });

    return () => {
      isMounted = false;
      setLoadedDocText(null);
    };
  }, [moduleDetail, activeModule?.id]);

  // Extract student text answer
  const studentAnswerText = useMemo(() => {
    if (!moduleDetail?.answers || moduleDetail.answers.length === 0) {
      return loadedDocText || '';
    }

    const firstAnswer = moduleDetail.answers[0];
    if (firstAnswer.content === null || firstAnswer.content === undefined) {
      return loadedDocText || '';
    }
    if (typeof firstAnswer.content === 'string') {
      const trimmed = firstAnswer.content.trim();
      return trimmed || loadedDocText || '';
    }
    if (typeof firstAnswer.content === 'object') {
      const obj = firstAnswer.content as Record<string, unknown>;
      const textVal = obj.text ?? obj.essay ?? obj.answer ?? obj.content;
      if (typeof textVal === 'string') {
        const trimmed = textVal.trim();
        return trimmed || loadedDocText || '';
      }
      return JSON.stringify(obj);
    }
    return String(firstAnswer.content ?? '').trim() || loadedDocText || '';
  }, [moduleDetail, loadedDocText]);

  const wordCount = useMemo(() => {
    if (!studentAnswerText.trim()) return 0;
    return studentAnswerText.trim().split(/\s+/).filter(Boolean).length;
  }, [studentAnswerText]);

  const handleReviewAnnotation = async (annotationId: number, status: 'ACCEPTED' | 'REJECTED') => {
    const currentModuleId = activeModule?.id;
    const currentAnswerId = targetAnswer?.id ?? null;
    const requestContext = annotationRequestRef.current;
    if (
      !isMountedRef.current ||
      currentModuleId == null ||
      currentAnswerId === null ||
      isLoadingAnnotations ||
      requestContext.isLoading ||
      requestContext.moduleId !== currentModuleId ||
      requestContext.answerId !== currentAnswerId ||
      !annotationsMatchCurrentAnswer ||
      !annotations.some((annotation) => annotation.id === annotationId)
    ) {
      return;
    }

    const generation = requestContext.generation;
    const isCurrentReview = () =>
      isMountedRef.current &&
      moduleLoadGenerationRef.current === generation &&
      annotationRequestRef.current.generation === generation &&
      annotationRequestRef.current.moduleId === currentModuleId &&
      annotationRequestRef.current.answerId === currentAnswerId &&
      !annotationRequestRef.current.isLoading;

    setReviewingAnnotationIds((prev) => ({ ...prev, [annotationId]: true }));
    try {
      await answerAnnotationService.reviewAnnotation(annotationId, { reviewStatus: status });
      if (!isCurrentReview()) return;
      setAnnotations((prev) =>
        prev.map((ann) => (ann.id === annotationId ? { ...ann, reviewStatus: status } : ann))
      );
      showToast(
        isVi
          ? (status === 'ACCEPTED' ? 'Đã duyệt gợi ý của AI.' : 'Đã từ chối gợi ý của AI.')
          : (status === 'ACCEPTED' ? 'AI annotation accepted.' : 'AI annotation rejected.')
      );
    } catch (err) {
      if (!isCurrentReview()) return;
      console.error('Failed to review annotation:', err);
      const parsed = parseApiError(err);
      showToast(parsed.message || (isVi ? 'Không thể cập nhật trạng thái duyệt.' : 'Failed to update review status.'));
    } finally {
      if (isCurrentReview()) {
        setReviewingAnnotationIds((prev) => ({ ...prev, [annotationId]: false }));
      }
    }
  };

  const handleCreateAnnotation = async () => {
    const context = { ...annotationRequestRef.current };
    if (!targetAnswer?.id || !isCurrentAction(context) || context.moduleId !== activeModule?.id ||
      context.answerId !== targetAnswer.id || createRequestRef.current) return;
    if (!newAnnComment.trim()) {
      showToast(isVi ? 'Vui lòng nhập nhận xét cho chú thích.' : 'Please enter a comment.');
      return;
    }
    const startNum = Math.max(0, parseInt(newAnnStartOffset, 10) || 0);
    const endNum = Math.max(startNum, parseInt(newAnnEndOffset, 10) || startNum);

    createRequestRef.current = context;
    setIsSubmittingAnnotation(true);
    try {
      const res = await answerAnnotationService.createAnnotation(targetAnswer.id, {
        startOffset: startNum,
        endOffset: endNum,
        errorType: newAnnErrorType,
        comment: newAnnComment.trim(),
        suggestedFix: newAnnSuggestedFix.trim() || null,
      });
      if (!isCurrentAction(context)) return;
      if (res?.id == null) throw new Error(isVi ? 'Không thể thêm chú thích.' : 'Failed to add annotation.');
      const createdItem: GradingAnnotation = {
        id: res.id,
        source: 'TEACHER',
        startOffset: startNum,
        endOffset: endNum,
        errorType: newAnnErrorType,
        comment: newAnnComment.trim(),
        suggestedFix: newAnnSuggestedFix.trim() || null,
        reviewStatus: 'ACCEPTED',
      };
      setAnnotations((prev) => [...prev, createdItem]);
      setNewAnnComment('');
      setNewAnnSuggestedFix('');
      setNewAnnStartOffset('0');
      setNewAnnEndOffset('0');
      setIsCreatingAnnotation(false);
      showToast(isVi ? 'Đã thêm chú thích mới.' : 'Annotation added.');
    } catch (err) {
      if (!isCurrentAction(context)) return;
      console.error('Failed to create annotation:', err);
      const parsed = parseApiError(err);
      showToast(parsed.message || (isVi ? 'Không thể thêm chú thích.' : 'Failed to add annotation.'));
    } finally {
      if (isCurrentAction(context)) {
        createRequestRef.current = null;
        setIsSubmittingAnnotation(false);
      }
    }
  };

  const handleDeleteAnnotation = async (annotationId: number) => {
    const context = { ...annotationRequestRef.current };
    if (!isCurrentAction(context) || context.moduleId !== activeModule?.id ||
      context.answerId !== (targetAnswer?.id ?? null) ||
      !annotationItemsRef.current.some(annotation => annotation.id === annotationId) || deleteRequestsRef.current.has(annotationId)) return;
    deleteRequestsRef.current.set(annotationId, context);
    setDeletingAnnotationIds((prev) => ({ ...prev, [annotationId]: true }));
    try {
      await answerAnnotationService.deleteAnnotation(annotationId);
      if (!isCurrentAction(context)) return;
      setAnnotations((prev) => prev.filter((ann) => ann.id !== annotationId));
      showToast(isVi ? 'Đã xóa chú thích.' : 'Annotation deleted.');
    } catch (err) {
      if (!isCurrentAction(context)) return;
      console.error('Failed to delete annotation:', err);
      const parsed = parseApiError(err);
      showToast(parsed.message || (isVi ? 'Không thể xóa chú thích.' : 'Failed to delete annotation.'));
    } finally {
      if (isCurrentAction(context)) {
        deleteRequestsRef.current.delete(annotationId);
        setDeletingAnnotationIds((prev) => ({ ...prev, [annotationId]: false }));
      }
    }
  };

  const filteredAnnotations = useMemo(() => {
    if (annotationFilter === 'ALL') return currentAnnotations;
    return currentAnnotations.filter((a) => a.reviewStatus === annotationFilter);
  }, [currentAnnotations, annotationFilter]);

  const annotationCounts = useMemo(() => {
    return {
      all: currentAnnotations.length,
      pending: currentAnnotations.filter((a) => a.reviewStatus === 'PENDING').length,
      accepted: currentAnnotations.filter((a) => a.reviewStatus === 'ACCEPTED').length,
      rejected: currentAnnotations.filter((a) => a.reviewStatus === 'REJECTED').length,
    };
  }, [currentAnnotations]);

  const transcriptText = useMemo(() => {
    const rawTranscript =
      aiSuggestion?.transcript ??
      gradingDetail?.aiTranscript ??
      (gradingSummary as { aiTranscript?: unknown })?.aiTranscript ??
      (moduleDetail?.grading as { aiTranscript?: unknown })?.aiTranscript ??
      (activeModule?.grading as { aiTranscript?: unknown })?.aiTranscript;
    const text = extractTranscriptText(rawTranscript);
    return text.length > 0 ? text : null;
  }, [aiSuggestion, gradingDetail, gradingSummary, moduleDetail, activeModule]);

  const extractSnippet = (start?: number, end?: number): string | null => {
    const baseText = transcriptText || (studentAnswerText.trim().length > 0 ? studentAnswerText : null);
    if (!baseText) return null;
    const res = extractAnnotationSnippet(baseText, start, end, '');
    return res.length > 0 ? res : null;
  };

  const renderAnnotationsSection = () => {
    return (
      <div className="tsd-annotations-section">
        <div className="tsd-annotations-header">
          <div className="tsd-ann-header-top">
            <div className="tsd-annotations-title-wrap">
              <h4 className="tsd-annotations-title">
                {isVi ? 'Gợi ý sửa lỗi theo đoạn' : 'Segment Annotations'}
              </h4>
              <span className="tsd-annotations-counter">{currentAnnotations.length}</span>
            </div>

            {targetAnswer?.id && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={Plus}
                onClick={() => setIsCreatingAnnotation((prev) => !prev)}
              >
                {isVi ? 'Thêm chú thích' : 'Add annotation'}
              </Button>
            )}
          </div>

          {currentAnnotations.length > 0 && (
            <div className="tsd-annotations-filter-bar">
              <button
                type="button"
                className={`tsd-ann-filter-btn ${annotationFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setAnnotationFilter('ALL')}
              >
                {isVi ? 'Tất cả' : 'All'} ({annotationCounts.all})
              </button>
              <button
                type="button"
                className={`tsd-ann-filter-btn ${annotationFilter === 'PENDING' ? 'active' : ''}`}
                onClick={() => setAnnotationFilter('PENDING')}
              >
                {isVi ? 'Chờ duyệt' : 'Pending'} ({annotationCounts.pending})
              </button>
              <button
                type="button"
                className={`tsd-ann-filter-btn ${annotationFilter === 'ACCEPTED' ? 'active' : ''}`}
                onClick={() => setAnnotationFilter('ACCEPTED')}
              >
                {isVi ? 'Đã duyệt' : 'Accepted'} ({annotationCounts.accepted})
              </button>
              <button
                type="button"
                className={`tsd-ann-filter-btn ${annotationFilter === 'REJECTED' ? 'active' : ''}`}
                onClick={() => setAnnotationFilter('REJECTED')}
              >
                {isVi ? 'Đã từ chối' : 'Rejected'} ({annotationCounts.rejected})
              </button>
            </div>
          )}
        </div>

        {isCreatingAnnotation && (
          <div className="tsd-ann-create-form">
            <div className="tsd-ann-form-grid">
              <div className="tsd-ann-form-field">
                <label className="tsd-ann-label">
                  {isVi ? 'Loại lỗi' : 'Error type'}
                </label>
                <select
                  className="tsd-ann-select"
                  value={newAnnErrorType}
                  onChange={(e) => setNewAnnErrorType(e.target.value)}
                >
                  <option value="GRAMMAR">GRAMMAR</option>
                  <option value="VOCABULARY">VOCABULARY</option>
                  <option value="PRONUNCIATION">PRONUNCIATION</option>
                  <option value="COHESION">COHESION</option>
                  <option value="SPELLING">SPELLING</option>
                  <option value="PUNCTUATION">PUNCTUATION</option>
                </select>
              </div>
              <div className="tsd-ann-form-field">
                <label className="tsd-ann-label">
                  {isVi ? 'Từ ký tự' : 'Start offset'}
                </label>
                <input
                  type="number"
                  min="0"
                  className="tsd-ann-input"
                  value={newAnnStartOffset}
                  onChange={(e) => setNewAnnStartOffset(e.target.value)}
                />
              </div>
              <div className="tsd-ann-form-field">
                <label className="tsd-ann-label">
                  {isVi ? 'Đến ký tự' : 'End offset'}
                </label>
                <input
                  type="number"
                  min="0"
                  className="tsd-ann-input"
                  value={newAnnEndOffset}
                  onChange={(e) => setNewAnnEndOffset(e.target.value)}
                />
              </div>
            </div>

            <div className="tsd-ann-form-field">
              <label className="tsd-ann-label">
                {isVi ? 'Gợi ý sửa' : 'Suggested fix'}
              </label>
              <input
                type="text"
                className="tsd-ann-input"
                placeholder={isVi ? 'Nhập câu/từ gợi ý sửa...' : 'Enter suggested correction...'}
                value={newAnnSuggestedFix}
                onChange={(e) => setNewAnnSuggestedFix(e.target.value)}
              />
            </div>

            <div className="tsd-ann-form-field">
              <label className="tsd-ann-label">
                {isVi ? 'Nhận xét chi tiết' : 'Comment'}
              </label>
              <textarea
                rows={2}
                className="tsd-ann-textarea"
                placeholder={isVi ? 'Giải thích lỗi hoặc hướng dẫn sửa...' : 'Explain the issue or feedback...'}
                value={newAnnComment}
                onChange={(e) => setNewAnnComment(e.target.value)}
              />
            </div>

            <div className="tsd-ann-form-actions">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isSubmittingAnnotation}
                onClick={() => setIsCreatingAnnotation(false)}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                loading={isSubmittingAnnotation}
                disabled={isSubmittingAnnotation}
                onClick={handleCreateAnnotation}
              >
                {isVi ? 'Lưu chú thích' : 'Save annotation'}
              </Button>
            </div>
          </div>
        )}

        {usingCurrentAnnotationFallback && currentAnnotations.length > 0 && !isLoadingAnnotations && (
          <div role="status" className="tsd-annotations-empty">
            <AlertCircle size={18} /> {t('annotationStatus.fallback')}
          </div>
        )}

        {isLoadingAnnotations ? (
          <div className="tsd-annotations-loading">
            <RefreshCw size={18} className="animate-spin" />
            <span>{isVi ? 'Đang tải gợi ý sửa lỗi...' : 'Loading AI annotations...'}</span>
          </div>
        ) : currentAnnotationError && (!usingCurrentAnnotationFallback || currentAnnotations.length === 0) ? (
          <div role="alert" className="tsd-annotations-empty">{t(`annotationStatus.${currentAnnotationError}`)}</div>
        ) : filteredAnnotations.length === 0 ? (
          <EmptyState
            title={
              currentAnnotations.length === 0
                ? (isVi ? 'Chưa có gợi ý sửa lỗi từ AI' : 'No AI annotations available')
                : (isVi ? 'Không có gợi ý trong bộ lọc này' : 'No annotations in this filter')
            }
            description={
              currentAnnotations.length === 0
                ? (isVi ? 'AI chưa phát hiện lỗi cần chú thích hoặc bài làm chưa được phân tích bằng AI.' : 'AI has not identified segment errors or submission has not been analyzed.')
                : undefined
            }
            className="tsd-annotations-empty"
          />
        ) : (
          <div className="tsd-annotations-list">
            {filteredAnnotations.map((ann) => {
              const isReviewing = !!reviewingAnnotationIds[ann.id];
              const isDeleting = !!deletingAnnotationIds[ann.id];
              const snippet = extractSnippet(ann.startOffset, ann.endOffset);
              const badgeStatus =
                ann.reviewStatus === 'ACCEPTED' ? 'success' : ann.reviewStatus === 'REJECTED' ? 'error' : 'warning';
              const badgeLabel =
                ann.reviewStatus === 'ACCEPTED'
                  ? (isVi ? 'Đã duyệt' : 'Accepted')
                  : ann.reviewStatus === 'REJECTED'
                  ? (isVi ? 'Đã từ chối' : 'Rejected')
                  : (isVi ? 'Chờ duyệt' : 'Pending');

              return (
                <div key={ann.id} className={`tsd-annotation-item ${ann.reviewStatus.toLowerCase()}`}>
                  <div className="tsd-ann-item-header">
                    <div className="tsd-ann-type-group">
                      <span className="tsd-ann-type-pill">
                        {ann.errorType || (isVi ? 'Gợi ý' : 'Suggestion')}
                      </span>
                      {ann.source === 'TEACHER' && (
                        <span className="tsd-ann-source-badge">
                          {isVi ? 'Giáo viên' : 'Teacher'}
                        </span>
                      )}
                      <span className="tsd-ann-range">
                        [{ann.startOffset} - {ann.endOffset}]
                      </span>
                    </div>
                    <StatusBadge status={badgeStatus} label={badgeLabel} showDot />
                  </div>

                  <div className="tsd-ann-item-body">
                    {snippet && (
                      <div className="tsd-ann-snippet">
                        <span className="tsd-ann-quote-mark">&ldquo;</span>
                        {snippet}
                        <span className="tsd-ann-quote-mark">&rdquo;</span>
                      </div>
                    )}

                    {ann.suggestedFix && (
                      <div className="tsd-ann-fix-row">
                        <span className="tsd-ann-field-label">{isVi ? 'Gợi ý sửa:' : 'Suggested fix:'}</span>
                        <span className="tsd-ann-fix-val">{ann.suggestedFix}</span>
                      </div>
                    )}

                    {ann.comment && (
                      <div className="tsd-ann-comment-row">
                        <span className="tsd-ann-field-label">{isVi ? 'Nhận xét:' : 'Comment:'}</span>
                        <span className="tsd-ann-comment-val">{ann.comment}</span>
                      </div>
                    )}
                  </div>

                  <div className="tsd-ann-item-actions">
                    {ann.source === 'AI' && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant={ann.reviewStatus === 'ACCEPTED' ? 'primary' : 'secondary'}
                          icon={CheckCircle2}
                          loading={isReviewing}
                          disabled={isReviewing || isDeleting || !canReviewCurrentAnnotations}
                          onClick={() => handleReviewAnnotation(ann.id, 'ACCEPTED')}
                          className="tsd-btn-review-accept"
                        >
                          {ann.reviewStatus === 'ACCEPTED' ? (isVi ? 'Đã duyệt' : 'Accepted') : (isVi ? 'Duyệt' : 'Accept')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={ann.reviewStatus === 'REJECTED' ? 'danger' : 'ghost'}
                          icon={XCircle}
                          loading={isReviewing}
                          disabled={isReviewing || isDeleting || !canReviewCurrentAnnotations}
                          onClick={() => handleReviewAnnotation(ann.id, 'REJECTED')}
                          className="tsd-btn-review-reject"
                        >
                          {ann.reviewStatus === 'REJECTED' ? (isVi ? 'Đã từ chối' : 'Rejected') : (isVi ? 'Từ chối' : 'Reject')}
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      icon={Trash2}
                      loading={isDeleting}
                      disabled={isReviewing || isDeleting}
                      onClick={() => handleDeleteAnnotation(ann.id)}
                      className="tsd-btn-delete-ann"
                    >
                      {isVi ? 'Xóa' : 'Delete'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="tsd-page-container py-6">
        <LoadingState 
          title={isVi ? 'Đang tải bài làm học viên và phân tích AI...' : 'Loading student submission & AI insights...'}
          description={isVi ? 'Đang kết nối hệ thống chấm chữa và bài nộp thực tế.' : 'Connecting to grading engine and live answers.'}
        />
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
      <div className="tsd-page-container tsd-page-empty">
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
            <div className="tsd-student-name-row">
              <h2 className="tsd-student-name">
                {studentInfo?.name || (isVi ? `Học viên #${studentId}` : `Student #${studentId}`)}
              </h2>
              <StatusBadge
                status={submission.status === 'GRADED' ? 'success' : 'info'}
                label={submission.status === 'GRADED' ? (isVi ? 'Đã có điểm' : 'Graded') : t('submissionDetails.statusSubmitted')}
              />
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
          <div className="tsd-time-block">
            <div className="tsd-time-label">{t('submissionDetails.submissionTimePrefix')}</div>
            <div className="tsd-time-val">
              {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Vừa xong'}
            </div>
          </div>
          {!isSpeaking && (
            <>
              <div className="tsd-time-divider" />
              <div className="tsd-ontime-indicator">
                <span className="tsd-ontime-dot" />
                <span className="tsd-ontime-text">{t('submissionDetails.statusOnTime')}</span>
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
            const isDone = isModuleGraded(m);
            const scoreDisplay = m.grading?.finalScore != null
              ? ` (${m.grading.finalScore}/${m.grading.maxScoreSnapshot || 10})`
              : '';
            return (
              <button
                key={m.id}
                type="button"
                className={`tsd-module-tab ${isSelected ? 'active' : ''} ${isDone ? 'done' : ''}`}
                onClick={() => handleSelectModule(m.id)}
                title={isDone ? (isVi ? 'Phần này đã có điểm' : 'Module graded') : (isVi ? 'Chưa chấm điểm' : 'Pending grading')}
              >
                {label}{scoreDisplay} {isDone ? '✓' : ''}
              </button>
            );
          })}
        </div>
      )}

      {/* Metrics Row (Only for non-speaking modules) */}
      {!isSpeaking && (
        <div className="tsd-metrics-grid">
          <MetricCard
            title={isVi ? 'Điểm AI đề xuất' : 'AI Suggested Score'}
            value={aiSuggestion?.suggestedScore != null
              ? String(aiSuggestion.suggestedScore)
              : (gradingDetail?.aiFeedback || isAnalyzingAi ? (isVi ? 'Đang phân tích' : 'Analyzing') : '--')}
            suffix="/ 10"
          />
          {gradingDetail?.finalScore != null && (
            <MetricCard
              title={isVi ? 'Điểm giáo viên đã chấm' : 'Teacher Score'}
              value={String(gradingDetail.finalScore)}
              suffix={`/ ${gradingDetail.maxScoreSnapshot || activeModule?.grading?.maxScoreSnapshot || 10}`}
            />
          )}
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
              {moduleInstructions && (
                <div className="tsd-prompt-instruction text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2 mb-3 leading-relaxed whitespace-pre-line">
                  <strong>{isVi ? 'Đề bài / Hướng dẫn:' : 'Task Prompt / Instructions:'}</strong>
                  <div className="mt-1">{moduleInstructions}</div>
                </div>
              )}

              <div className="tsd-speaking-audio-bar">
                {isAudioLoading ? (
                  <div className="tsd-audio-empty">
                    {isVi ? 'Đang tải audio bài nộp...' : 'Loading submission audio...'}
                  </div>
                ) : audioError ? (
                    <div className="tsd-audio-error">
                      <div className="tsd-audio-error-msg">
                        <AlertCircle size={16} />
                        <span>
                          {isVi ? 'Không thể tải audio bài nộp. Vui lòng thử lại.' : 'Unable to load submission audio. Please try again.'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                        onClick={handleAudioRetry}
                      >
                        {isVi ? 'Thử lại' : 'Retry'}
                      </Button>
                    </div>
                ) : audioUrl ? (
                  <div className="tsd-speaking-audio-wrap">
                    <audio
                      ref={audioRef}
                      controls
                      src={audioUrl}
                      preload="metadata"
                      className="tsd-audio-player"
                      onError={handleAudioError}
                      onLoadedMetadata={handleAudioMetadata}
                    >
                      {isVi ? 'Trình duyệt của bạn không hỗ trợ phát âm thanh.' : 'Your browser does not support audio playback.'}
                    </audio>
                  </div>
                ) : (
                  <div className="tsd-audio-empty">
                    {isVi ? 'Chưa tìm thấy bản ghi âm của học viên.' : 'No audio recording found.'}
                  </div>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={isAnalyzingAi}
                  onClick={handleTriggerAiAnalyze}
                  icon={Sparkles}
                >
                  {isAnalyzingAi
                    ? (isVi ? 'Đang chấm điểm...' : 'Grading...')
                    : (gradingDetail?.aiFeedback || aiSuggestion?.aiFeedback
                        ? (isVi ? 'Chấm lại bằng AI' : 'Re-grade with AI')
                        : (isVi ? 'Chấm bài bằng AI' : 'Grade with AI'))}
                </Button>
              </div>

              {/* Spoken Audio Transcript for Teacher */}
              <div className="tsd-speaking-transcript-wrap">
                <div className="tsd-speaking-transcript-label">
                  <FileText size={15} />
                  <span>{isVi ? 'Bản ghi lời nói của học viên (AI Transcript):' : 'Student Audio Transcript (AI Transcribed):'}</span>
                </div>
                {transcriptText ? (
                  <div className="tsd-speaking-transcript-text">
                    {transcriptText}
                  </div>
                ) : (
                  <div className="text-xs text-muted italic py-1">
                    {isVi 
                      ? 'Chưa có bản ghi âm tự động (Bấm "Chấm bài bằng AI" để trích xuất transcript lời nói của học viên).' 
                      : 'No automated transcript available (Click "Grade with AI" to transcribe student audio).'}
                  </div>
                )}
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
                {aiSuggestion?.suggestedScore != null ? (
                  <span className="tsd-speaking-ai-score">
                    {isVi ? 'Điểm AI đề xuất: ' : 'AI Suggested: '}
                    <strong>{String(aiSuggestion.suggestedScore)}</strong> / 10
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
                {renderAnnotationsSection()}
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
                <div className="tsd-score-input-wrap">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="10"
                    placeholder="0.0"
                    value={finalScoreInput}
                    onChange={(e) => setFinalScoreInput(e.target.value)}
                    className="tsd-score-input"
                  />
                  <span className="tsd-score-scale">/ 10</span>
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
                <span className="tsd-answer-title-dot" />
                <span>
                  {isVi ? 'Nội dung bài làm học viên' : 'Student Submitted Answer'}
                </span>
              </div>
              <div className="tsd-answer-wordcount">
                {wordCount > 0
                  ? `${wordCount} ${isVi ? 'từ' : 'words'}`
                  : (attachedDocAnswers.length > 0 ? (isVi ? 'Tệp đính kèm' : 'Attached file') : (isVi ? '0 từ' : '0 words'))}
              </div>
            </div>

            <div className="tsd-answer-box">
              <div className="tsd-prompt-label">
                {assignment?.title || (isVi ? 'ĐỀ BÀI' : 'TASK PROMPT')}
              </div>
              {moduleInstructions && (
                <div className="tsd-prompt-instruction text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2 mb-3 leading-relaxed whitespace-pre-line">
                  <strong>{isVi ? 'Đề bài / Hướng dẫn:' : 'Task Prompt / Instructions:'}</strong>
                  <div className="mt-1">{moduleInstructions}</div>
                </div>
              )}

              {/* Display attached document files if student uploaded file */}
              {attachedDocAnswers.length > 0 && (
                <div className="tsd-answer-attached-files">
                  <div className="tsd-attached-files-label">
                    <FileText size={15} />
                    <span>{isVi ? 'Tệp bài làm của học viên:' : 'Student submission document:'}</span>
                  </div>
                  <div className="tsd-attached-files-list">
                    {attachedDocAnswers.map((ans) => {
                      const docKey = ans.docStorageKey || '';
                      const isPdf = ans.docMimeType?.includes('pdf') || docKey.toLowerCase().endsWith('.pdf');
                      const isTxt = ans.docMimeType?.includes('text/plain') || docKey.toLowerCase().endsWith('.txt');
                      const extension = isPdf ? 'pdf' : isTxt ? 'txt' : 'docx';
                      const fileName = getFileNameFromKey(docKey);

                      return (
                        <FileItem
                          key={ans.id}
                          name={fileName}
                          extension={extension}
                          size={isVi ? 'Tệp bài làm' : 'Submission file'}
                          details={t('submissionDetails.submittedOn')}
                          onView={() => handleViewDocument(docKey)}
                          onDownload={() => handleDownloadDocument(docKey)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Display text essay if available */}
              {studentAnswerText ? (
                <p className="tsd-essay-paragraph whitespace-pre-line">
                  {studentAnswerText}
                </p>
              ) : attachedDocAnswers.length > 0 ? (
                <div className="tsd-file-only-note">
                  <p>{isVi ? 'Học viên đã nộp bài hoàn chỉnh qua tệp đính kèm ở trên. Hãy bấm "Xem" hoặc "Tải xuống" để kiểm tra bài làm.' : 'Student submitted their assignment via the attached document above. Click "View" or "Download" to review.'}</p>
                </div>
              ) : (
                <p className="tsd-online-answer-note">
                  {isVi ? 'Học viên đã nộp bài tập trực tuyến.' : 'Student submitted the online assignment.'}
                </p>
              )}
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
              <div className="tsd-score-input-wrap">
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="10"
                  placeholder="0.0"
                  value={finalScoreInput}
                  onChange={(e) => setFinalScoreInput(e.target.value)}
                  className="tsd-score-input"
                />
                <span className="tsd-score-scale">/ 10</span>
              </div>
            </div>

            {/* AI Grading Insight with Grade with AI Button */}
            <div className="tsd-ai-box">
              <div className="tsd-ai-box-header">
                <span className="tsd-ai-header-title">
                  <Sparkles size={14} />
                  {isVi ? 'Nhận xét từ AI' : 'AI Feedback'}
                </span>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={isAnalyzingAi}
                  onClick={handleTriggerAiAnalyze}
                  icon={Sparkles}
                >
                  {isAnalyzingAi
                    ? (isVi ? 'Đang chấm điểm...' : 'Grading...')
                    : (gradingDetail?.aiFeedback || aiSuggestion?.aiFeedback
                        ? (isVi ? 'Chấm lại bằng AI' : 'Re-grade with AI')
                        : (isVi ? 'Chấm bài bằng AI' : 'Grade with AI'))}
                </Button>
              </div>
              <MarkdownView
                content={gradingDetail?.aiFeedback || aiSuggestion?.aiFeedback}
                fallbackText={isVi
                  ? 'Chưa có nhận xét từ AI. Hãy bấm nút "Chấm bài bằng AI" để hệ thống phân tích và đề xuất nhận xét.'
                  : 'No AI feedback available. Click "Grade with AI" to generate AI insights.'}
                className="tsd-ai-markdown"
              />
            </div>

            {/* AI Segment Annotations Card */}
            <div className="tsd-ai-annotations-card">
              {renderAnnotationsSection()}
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
