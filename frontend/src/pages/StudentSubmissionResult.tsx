import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  FileText,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Headphones,
  Mic,
  FileEdit,
  HelpCircle,
  File
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  submissionService,
  type SubmissionDetail,
  type SubmissionListItem,
  type SubmissionModuleDetailResponse,
  type SubmissionSkill,
  type SubmittedAnswerItem
} from '../api/services/submission.service';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { questionService, extractMcqOptions, extractShortAnswerText } from '../api/services/question.service';
import { gradingService, type StudentGradingResult } from '../api/services/grading.service';
import { useStudentAnswerAnnotations } from '../hooks/useStudentAnswerAnnotations';
import { Button, MarkdownView } from '../components/common';
import { resolveAudioUrl } from '../utils/audioUrl.utils';
import {
  formatAnnotationBadgeLabel,
  normalizeAnnotationCategory,
  type StudentAnnotationCategory,
} from '../utils/annotationCategory.utils';
import { extractAnnotationSnippet, extractAnswerContentText, extractTranscriptText } from '../utils/annotationSnippet.utils';
import '../styles/student-result.css';

interface DisplayAnnotation {
  id: number;
  type: StudentAnnotationCategory;
  badgeLabel: string;
  original: string;
  suggestion: string | null;
  explanation: string;
  teacherNote?: string;
  approved: boolean;
  startOffset?: number;
  endOffset?: number;
}

const ANNOTATION_FILTER_OPTIONS: ReadonlyArray<{
  category: StudentAnnotationCategory;
  labelKey: string;
}> = [
  { category: 'grammar', labelKey: 'studentResult.filterGrammar' },
  { category: 'vocabulary', labelKey: 'studentResult.filterVocab' },
  { category: 'cohesion', labelKey: 'studentResult.filterCohesion' },
  { category: 'punctuation', labelKey: 'studentResult.filterPunctuation' },
  { category: 'spelling', labelKey: 'studentResult.filterSpelling' },
  { category: 'pronunciation', labelKey: 'studentResult.filterPronunciation' },
  { category: 'fluency', labelKey: 'studentResult.filterFluency' },
  { category: 'positive', labelKey: 'studentResult.filterPositive' },
];

interface QuestionDisplayItem {
  id: number;
  questionNumber: number;
  prompt: string;
  questionType: string;
  options: { key: string; text: string }[];
  studentAnswer: string;
  correctAnswer: string;
  isCorrect?: boolean;
  explanation?: string;
}

function extractAnswerText(answers: SubmittedAnswerItem[] | undefined): string {
  return extractAnswerContentText(answers);
}

// eslint-disable-next-line react-refresh/only-export-components -- exported for focused retry-selection coverage
export function resolveRetryModuleId(
  modules: SubmissionDetail['modules'] | undefined,
  selectedModuleId: number | null,
  moduleDetailId: number | undefined,
): number | null {
  if (!modules?.length) return null;

  return modules.find(module => module.id === selectedModuleId)?.id
    ?? modules.find(module => module.id === moduleDetailId)?.id
    ?? modules[0]?.id
    ?? null;
}

export const StudentSubmissionResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { user } = useAuth();

  // State
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<SubmissionModuleDetailResponse | null>(null);
  const [gradingResult, setGradingResult] = useState<StudentGradingResult | null>(null);
  const [fallbackAiTranscript, setFallbackAiTranscript] = useState<unknown | null>(null);
  const [attempts, setAttempts] = useState<SubmissionListItem[]>([]);
  const [isLoadingAnnotationAnswer, setIsLoadingAnnotationAnswer] = useState(false);
  const annotationLoadId = useRef(0);
  const moduleLoaderMounted = useRef(false);
  const retryRequestId = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noSubmissionFound, setNoSubmissionFound] = useState<boolean>(false);

  // Tab & skill selection
  const [selectedSkill, setSelectedSkill] = useState<SubmissionSkill>('WRITING');
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | StudentAnnotationCategory>('all');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);
  const [questionFilter, setQuestionFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  const [audioErrorUrl, setAudioErrorUrl] = useState<string | null>(null);

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [id]);

  const isAssignmentRoute = useMemo(() => {
    return location.pathname.includes('/assignments/');
  }, [location.pathname]);

  useEffect(() => {
    moduleLoaderMounted.current = true;
    return () => { moduleLoaderMounted.current = false; };
  }, []);

  // Load active module details when selectedSkill changes or subModule changes
  const loadModuleData = useCallback(async (subModuleId: number) => {
    if (!moduleLoaderMounted.current) return;
    const loadId = ++annotationLoadId.current;
    const isCurrentLoad = () => moduleLoaderMounted.current && loadId === annotationLoadId.current;
    setSelectedModuleId(subModuleId);
    setGradingResult(null);
    setFallbackAiTranscript(null);
    setError(null);
    setIsLoading(true);
    setModuleDetail(null);
    setIsLoadingAnnotationAnswer(true);
    try {
      const [modRes, gradingRes] = await Promise.allSettled([
        submissionService.getSubmissionModuleDetail(subModuleId),
        gradingService.getStudentGradingResult(subModuleId)
      ]);

      if (!isCurrentLoad()) return;
      setGradingResult(gradingRes.status === 'fulfilled' ? gradingRes.value : null);
      if (gradingRes.status === 'rejected') {
        setError('Không thể tải kết quả chấm bài. Vui lòng thử lại.');
      }

      if (modRes.status === 'fulfilled') {
        const modValue = modRes.value;
        const needQuestions = (!modValue.questions || modValue.questions.length === 0) && !!modValue.moduleId;

        if (needQuestions) {
          try {
            const qRes = await questionService.listQuestions(modValue.moduleId!);
            if (!isCurrentLoad()) return;
            const qList = qRes.questions || qRes.data || [];
            if (qList.length > 0) {
              modValue.questions = qList;
            }
          } catch {
            if (!isCurrentLoad()) return;
          }
        }
        setModuleDetail(modValue);
      }
    } catch {
      if (isCurrentLoad()) {
        setGradingResult(null);
    setFallbackAiTranscript(null);
        setError('Không thể tải kết quả chấm bài. Vui lòng thử lại.');
      }
    } finally {
      if (isCurrentLoad()) {
        setIsLoadingAnnotationAnswer(false);
        setIsLoading(false);
      }
    }
  }, []);

  const [loadedDocText, setLoadedDocText] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const existing = extractAnswerText(moduleDetail?.answers);
    if (existing && existing.trim()) {
      return;
    }
    if (!selectedModuleId || selectedSkill !== 'WRITING' || typeof submissionService?.getDocumentFileBlob !== 'function') {
      return;
    }

    submissionService
      .getDocumentFileBlob(selectedModuleId)
      .then((blob) => blob.text())
      .then((text) => {
        if (isMounted && text && text.trim()) {
          setLoadedDocText(text);
        }
      })
      .catch((err) => {
        console.warn('Failed to load essay.txt in StudentSubmissionResult:', err);
      });

    return () => {
      isMounted = false;
      setLoadedDocText(null);
    };
  }, [moduleDetail, selectedModuleId, selectedSkill]);

  useEffect(() => {
    if (moduleDetail?.skill !== 'SPEAKING') {
      return;
    }
    const gradingId = moduleDetail?.grading?.id;
    if (!gradingResult?.aiTranscript && gradingId && typeof gradingService.getById === 'function') {
      Promise.resolve(gradingService.getById(gradingId))
        .then((res) => {
          if (res?.aiTranscript) {
            setFallbackAiTranscript(res.aiTranscript);
          }
        })
        .catch(() => {
          // ignore if forbidden or network error
        });
    }
  }, [gradingResult?.aiTranscript, moduleDetail?.grading?.id, moduleDetail?.skill]);

  const speakingTranscriptText = useMemo(() => {
    const rawTranscript =
      gradingResult?.aiTranscript ??
      fallbackAiTranscript ??
      (moduleDetail?.grading as { aiTranscript?: unknown })?.aiTranscript;
    const text = extractTranscriptText(rawTranscript);
    return text.length > 0 ? text : null;
  }, [gradingResult, fallbackAiTranscript, moduleDetail]);

  const targetAnswer = moduleDetail?.answers?.find(answer => !!answer.audioStorageKey) || moduleDetail?.answers?.[0];
  const annotationResult = useStudentAnswerAnnotations(targetAnswer?.id);
  const annotationStatus = isLoading || isLoadingAnnotationAnswer ? 'loading' : annotationResult.status;
  const annotations = useMemo<DisplayAnnotation[]>(() => {
    const rawText = moduleDetail?.skill === 'SPEAKING'
      ? (speakingTranscriptText || '')
      : (extractAnswerContentText(moduleDetail?.answers, targetAnswer?.id) || loadedDocText || '');
    return annotationResult.annotations
      .filter(annotation => annotation.reviewStatus === 'ACCEPTED')
      .map((annotation, index) => {
        const category = normalizeAnnotationCategory(annotation.errorType);
        return {
          id: annotation.id || index + 1,
          type: category,
          badgeLabel: formatAnnotationBadgeLabel(annotation.errorType, category),
          original: extractAnnotationSnippet(rawText, annotation.startOffset, annotation.endOffset, t('studentResult.segmentUnavailable')),
          suggestion: annotation.suggestedFix?.trim() || null,
          explanation: annotation.comment?.trim() || 'Nhận xét từ hệ thống AI',
          teacherNote: annotation.source === 'TEACHER' ? 'Ghi chú từ giáo viên' : undefined,
          approved: true,
          startOffset: annotation.startOffset,
          endOffset: annotation.endOffset,
        };
      });
  }, [annotationResult.annotations, moduleDetail, targetAnswer?.id, loadedDocText, speakingTranscriptText, t]);

  const [reloadKey, setReloadKey] = useState(0);
  const handleRetry = () => {
    const currentModuleId = resolveRetryModuleId(submission?.modules, selectedModuleId, moduleDetail?.id);
    if (currentModuleId !== null) {
      if (retryRequestId.current === annotationLoadId.current) return;
      const moduleLoad = loadModuleData(currentModuleId);
      const requestId = annotationLoadId.current;
      retryRequestId.current = requestId;
      void moduleLoad.finally(() => {
        if (retryRequestId.current === requestId) retryRequestId.current = null;
      });
      return;
    }

    annotationLoadId.current++;
    setGradingResult(null);
    setFallbackAiTranscript(null);
    setError(null);
    setIsLoading(true);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let isMounted = true;
    const annotationRequests = annotationLoadId;

    const loadData = async () => {
      let moduleLoadStarted = false;
      setGradingResult(null);
    setFallbackAiTranscript(null);
      setIsLoading(true);
      setError(null);
      setNoSubmissionFound(false);
      setSelectedModuleId(null);

      try {
        let currentSubmission: SubmissionDetail | null = null;
        let targetAssignmentId = numericId;

        if (isAssignmentRoute) {
          // Path is /student/assignments/:id/result -> numericId is assignmentId
          targetAssignmentId = numericId;
          const [asgRes, listRes] = await Promise.allSettled([
            assignmentService.getAssignment(targetAssignmentId),
            user?.id
              ? submissionService.listSubmissions({
                  assignmentId: targetAssignmentId,
                  studentId: user.id,
                  limit: 10
                })
              : Promise.reject('No user')
          ]);

          if (isMounted && asgRes.status === 'fulfilled') setAssignment(asgRes.value);

          if (listRes.status === 'fulfilled' && listRes.value.data && listRes.value.data.length > 0) {
            if (isMounted) setAttempts(listRes.value.data);
            currentSubmission = await submissionService.getSubmission(listRes.value.data[0].id);
          } else {
            if (isMounted) setNoSubmissionFound(true);
          }
        } else {
          // Path is /student/submissions/:id -> numericId is submissionId
          try {
            currentSubmission = await submissionService.getSubmission(numericId);
            targetAssignmentId = currentSubmission.assignmentId;
            const [asgRes, listRes] = await Promise.allSettled([
              assignmentService.getAssignment(targetAssignmentId),
              user?.id
                ? submissionService.listSubmissions({
                    assignmentId: targetAssignmentId,
                    studentId: user.id,
                    limit: 10
                  })
                : Promise.reject('No user')
            ]);

            if (isMounted && asgRes.status === 'fulfilled') setAssignment(asgRes.value);
            if (isMounted && listRes.status === 'fulfilled' && listRes.value.data && listRes.value.data.length > 0) {
              setAttempts(listRes.value.data);
            }
          } catch {
            // If not found as submission, try assignment
            const asg = await assignmentService.getAssignment(numericId);
            if (isMounted) setAssignment(asg);
            if (user?.id) {
              const listRes = await submissionService.listSubmissions({
                assignmentId: numericId,
                studentId: user.id,
                limit: 10
              });
              if (listRes.data && listRes.data.length > 0) {
                if (isMounted) setAttempts(listRes.data);
                currentSubmission = await submissionService.getSubmission(listRes.data[0].id);
              } else {
                if (isMounted) setNoSubmissionFound(true);
              }
            }
          }
        }

        if (isMounted) setSubmission(currentSubmission);

        if (isMounted && currentSubmission && currentSubmission.modules && currentSubmission.modules.length > 0) {
          const firstMod = currentSubmission.modules[0];
          if (firstMod.skill && isMounted) {
            setSelectedSkill(firstMod.skill);
          }
          moduleLoadStarted = true;
          await loadModuleData(firstMod.id);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu kết quả chấm bài.';
        setError(msg);
      } finally {
        if (isMounted && !moduleLoadStarted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
      annotationRequests.current++;
    };
  }, [numericId, isAssignmentRoute, user?.id, loadModuleData, reloadKey]);

  // Handle switching attempts
  const handleSelectAttempt = async (attemptId: number) => {
    let loadId = ++annotationLoadId.current;
    setSubmission(null);
    setGradingResult(null);
    setFallbackAiTranscript(null);
    setModuleDetail(null);
    setSelectedModuleId(null);
    setError(null);
    setIsLoading(true);
    setIsLoadingAnnotationAnswer(true);
    setSelectedAnnotationId(null);
    setActiveFilter('all');
    setNoSubmissionFound(false);
    try {
      const sub = await submissionService.getSubmission(attemptId);
      if (!moduleLoaderMounted.current || loadId !== annotationLoadId.current) return;
      setSubmission(sub);
      const subModule = sub.modules?.[0];
      if (subModule) {
        if (subModule.skill) setSelectedSkill(subModule.skill);
        const moduleLoad = loadModuleData(subModule.id);
        loadId = annotationLoadId.current;
        await moduleLoad;
      }
    } catch {
      if (!moduleLoaderMounted.current || loadId !== annotationLoadId.current) return;
      setSubmission(null);
      setModuleDetail(null);
      setGradingResult(null);
    setFallbackAiTranscript(null);
      setSelectedModuleId(null);
      setError('Không thể tải lần nộp đã chọn. Vui lòng thử lại.');
    } finally {
      if (moduleLoaderMounted.current && loadId === annotationLoadId.current) {
        setIsLoadingAnnotationAnswer(false);
        setIsLoading(false);
      }
    }
  };

  // Handle switching skill tabs
  const handleSelectSkill = async (skill: SubmissionSkill) => {
    setSelectedSkill(skill);
    setActiveFilter('all');
    const targetModule = submission?.modules?.find(m => m.skill === skill);
    if (targetModule) {
      await loadModuleData(targetModule.id);
    }
  };

  // Compute active module
  const activeSubModule = useMemo(() => {
    if (!submission?.modules || submission.modules.length === 0) return null;
    return submission.modules.find(module => module.id === selectedModuleId)
      || submission.modules.find(module => module.skill === selectedSkill)
      || submission.modules[0];
  }, [submission, selectedModuleId, selectedSkill]);

  const rawScore = gradingResult?.finalScore ?? null;
  const maxScore = gradingResult?.maxScoreSnapshot ?? null;

  const displayScore = useMemo<string | null>(() => {
    if (rawScore === null || maxScore === null || !Number.isFinite(rawScore) || !Number.isFinite(maxScore) || maxScore <= 0) {
      return null;
    }
    const scoreVal = Number(rawScore.toFixed(2)).toString();
    const maxVal = Number(maxScore.toFixed(2)).toString();
    return `${scoreVal}/${maxVal}`;
  }, [rawScore, maxScore]);

  const isGraded = useMemo<boolean>(() => {
    if (submission?.status === 'GRADED') return true;
    if (activeSubModule?.status === 'GRADED') return true;
    if (moduleDetail?.status === 'GRADED') return true;
    if (gradingResult) return true;
    if (activeSubModule?.grading?.status === 'AI_GRADED' || activeSubModule?.grading?.status === 'COMPLETED') return true;
    if (moduleDetail?.grading?.status === 'AI_GRADED' || moduleDetail?.grading?.status === 'COMPLETED') return true;
    if (rawScore != null) return true;
    return false;
  }, [submission, activeSubModule, moduleDetail, gradingResult, rawScore]);

  // Annotations
  const filteredAnnotations = useMemo(() => {
    if (activeFilter === 'all') return annotations;
    return annotations.filter(a => a.type === activeFilter);
  }, [annotations, activeFilter]);

  const selectedAnnotation = useMemo(() => {
    if (filteredAnnotations.length === 0) return null;
    return filteredAnnotations.find(a => a.id === selectedAnnotationId) || filteredAnnotations[0];
  }, [filteredAnnotations, selectedAnnotationId]);

  const availableAnnotationFilters = useMemo(() => {
    return ANNOTATION_FILTER_OPTIONS.map((opt) => ({
      ...opt,
      count: annotations.filter((a) => a.type === opt.category).length,
    })).filter((opt) => opt.count > 0);
  }, [annotations]);

  // Questions derivation for Reading or Listening
  const questionsList = useMemo<QuestionDisplayItem[]>(() => {
    if (!moduleDetail?.questions || moduleDetail.questions.length === 0) return [];
    return moduleDetail.questions.map((q, idx) => {
      const studentAnsItem = moduleDetail.answers?.find(a => a.questionId === q.id);
      const isMcq = q.questionType === 'MULTIPLE_CHOICE';

      // 1. Correct Answer & Options Parsing
      let mcq = {
        options: [] as string[],
        correctOptionContent: '',
        correctOptionIndex: 0,
      };
      let shortAns = '';

      if (isMcq) {
        mcq = extractMcqOptions(q.correctAnswer as Record<string, unknown> | null);
      } else {
        shortAns = extractShortAnswerText(q.correctAnswer as Record<string, unknown> | null);
      }

      const displayOptions = isMcq
        ? mcq.options.map((optText, optIdx) => ({
            key: String.fromCharCode(65 + optIdx),
            text: optText,
          }))
        : [];

      const correctOptLetter = String.fromCharCode(65 + mcq.correctOptionIndex);
      const cAnsText = isMcq
        ? `${correctOptLetter}. ${mcq.correctOptionContent}`
        : (shortAns || '--');

      // 2. Student Answer & Score Parsing
      let sAnsText = '--';
      let studentSelectedOptId: number | null = null;
      let isAnswerCorrect: boolean | undefined = undefined;

      if (studentAnsItem) {
        if (typeof studentAnsItem.content === 'string') {
          sAnsText = studentAnsItem.content;
        } else if (studentAnsItem.content && typeof studentAnsItem.content === 'object') {
          const obj = studentAnsItem.content as Record<string, unknown>;

          if (typeof obj.isCorrect === 'boolean') {
            isAnswerCorrect = obj.isCorrect;
          } else if (typeof obj.is_correct === 'boolean') {
            isAnswerCorrect = obj.is_correct;
          }

          if (isMcq) {
            const selIds = obj.selectedOptionIds;
            if (Array.isArray(selIds) && selIds.length > 0 && typeof selIds[0] === 'number') {
              studentSelectedOptId = selIds[0];
            } else if (typeof obj.selectedOptionId === 'number') {
              studentSelectedOptId = obj.selectedOptionId;
            } else if (typeof obj.selectedOption === 'string') {
              const letterIdx = ['A', 'B', 'C', 'D'].indexOf(obj.selectedOption.toUpperCase());
              if (letterIdx !== -1) {
                studentSelectedOptId = letterIdx + 1;
              }
            } else if (typeof obj.answer === 'string') {
              const letterIdx = ['A', 'B', 'C', 'D'].indexOf(obj.answer.toUpperCase());
              if (letterIdx !== -1) {
                studentSelectedOptId = letterIdx + 1;
              }
            }

            if (studentSelectedOptId !== null && studentSelectedOptId >= 1 && studentSelectedOptId <= mcq.options.length) {
              const sLetter = String.fromCharCode(65 + studentSelectedOptId - 1);
              const sText = mcq.options[studentSelectedOptId - 1] || '';
              sAnsText = `${sLetter}. ${sText}`;
            } else if (typeof obj.answer === 'string') {
              sAnsText = obj.answer;
            } else if (typeof obj.selectedOption === 'string') {
              sAnsText = obj.selectedOption;
            }
          } else {
            if (typeof obj.text === 'string') {
              sAnsText = obj.text;
            } else if (typeof obj.answer === 'string') {
              sAnsText = obj.answer;
            }
          }
        }
      }

      // Fallback for isAnswerCorrect
      if (isAnswerCorrect === undefined) {
        if (studentAnsItem && sAnsText !== '--') {
          if (isMcq) {
            if (studentSelectedOptId !== null) {
              isAnswerCorrect = (studentSelectedOptId - 1) === mcq.correctOptionIndex;
            }
          } else if (shortAns) {
            isAnswerCorrect = sAnsText.trim().toLowerCase() === shortAns.trim().toLowerCase();
          }
        } else {
          isAnswerCorrect = false;
        }
      }

      return {
        id: q.id,
        questionNumber: q.orderIndex || idx + 1,
        prompt: q.content,
        questionType: q.questionType,
        options: displayOptions,
        studentAnswer: sAnsText,
        correctAnswer: cAnsText,
        isCorrect: isAnswerCorrect,
        explanation: 'Đối chiếu theo đáp án chuẩn của bài học.',
      };
    });
  }, [moduleDetail]);

  const filteredQuestions = useMemo(() => {
    if (questionFilter === 'correct') return questionsList.filter(q => q.isCorrect === true);
    if (questionFilter === 'incorrect') return questionsList.filter(q => q.isCorrect === false);
    return questionsList;
  }, [questionsList, questionFilter]);

  // Extracted student contents
  const studentEssay = useMemo(() => {
    return extractAnswerText(moduleDetail?.answers) || loadedDocText || '';
  }, [moduleDetail?.answers, loadedDocText]);

  const attachedDocKey = useMemo(() => {
    return moduleDetail?.answers?.find(a => a.docStorageKey)?.docStorageKey || null;
  }, [moduleDetail?.answers]);

  const audioStorageKey = useMemo(() => {
    return moduleDetail?.answers?.find(a => a.audioStorageKey)?.audioStorageKey || null;
  }, [moduleDetail?.answers]);

  const audioUrl = useMemo(() => resolveAudioUrl(audioStorageKey), [audioStorageKey]);

  const audioError = Boolean(audioUrl && audioErrorUrl === audioUrl);

  const teacherFeedbackText = gradingResult?.finalFeedback || '';

  // Available skills in submission
  const availableSkills: SubmissionSkill[] = useMemo(() => {
    const list: SubmissionSkill[] = [];
    if (submission?.modules && submission.modules.length > 0) {
      submission.modules.forEach(m => {
        if (m.skill) list.push(m.skill);
      });
    }
    if (assignment?.modules && assignment.modules.length > 0) {
      assignment.modules.forEach(m => {
        if (m.skill) list.push(m.skill);
      });
    }
    if (list.length === 0) return [selectedSkill || 'READING'];
    const unique = Array.from(new Set(list));
    const standardOrder: SubmissionSkill[] = ['LISTENING', 'READING', 'WRITING', 'SPEAKING'];
    return unique.sort((a, b) => {
      const idxA = standardOrder.indexOf(a);
      const idxB = standardOrder.indexOf(b);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
  }, [submission, assignment, selectedSkill]);

  // Empty submission state
  if (noSubmissionFound) {
    return (
      <div className="student-result-page">
        <div className="result-breadcrumbs">
          <button
            type="button"
            className="result-back-btn"
            onClick={() => navigate('/student/assignments')}
          >
            <ArrowLeft size={14} />
            <span>{t('studentResult.backToList')}</span>
          </button>
        </div>

        <div className="result-card p-24 result-empty-card">
          <AlertCircle size={48} className="result-empty-icon" />
          <h2 className="result-empty-title">
            Chưa tìm thấy bài nộp nào
          </h2>
          <p className="result-empty-desc">
            {assignment?.title
              ? `Bạn chưa nộp bài cho bài tập "${assignment.title}". Hãy vào phần làm bài để hoàn thành và nhận đánh giá từ hệ thống.`
              : 'Hiện tại chưa ghi nhận lượt nộp bài nào của bạn cho mã bài tập này.'}
          </p>
          <div className="result-empty-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/student/assignments')}
            >
              Danh sách bài tập
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/student/assignments/${assignment?.id || numericId}/overview`)}
            >
              Làm bài tập ngay
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submission && (!submission.modules || submission.modules.length === 0) && !isLoading) {
    return (
      <div className="student-result-page">
        <div className="result-breadcrumbs">
          <button
            type="button"
            className="result-back-btn"
            onClick={() => navigate('/student/assignments')}
          >
            <ArrowLeft size={14} />
            <span>{t('studentResult.backToList')}</span>
          </button>
          <span className="result-crumb-sep">/</span>
          <span className="result-crumb-link">
            {assignment?.title || t('studentResult.assignmentDetails')}
          </span>
          <span className="result-crumb-sep">/</span>
          <span className="result-crumb-current">
            {t('studentResult.resultAndFeedback')}
          </span>
        </div>

        <div role="status" className="result-card p-24 result-empty-card">
          <AlertCircle size={48} className="result-empty-icon" />
          <h2 className="result-empty-title">
            {isVi ? 'Chưa có dữ liệu mô-đun' : 'No module data available'}
          </h2>
          <p className="result-empty-desc">
            {isVi
              ? 'Lần nộp này chưa có mô-đun bài tập để hiển thị kết quả.'
              : 'This submission has no assignment modules to display.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="student-result-page">
      {/* 1. Breadcrumbs */}
      <div className="result-breadcrumbs">
        <button
          type="button"
          className="result-back-btn"
          onClick={() => navigate('/student/assignments')}
        >
          <ArrowLeft size={14} />
          <span>{t('studentResult.backToList')}</span>
        </button>
        <span className="result-crumb-sep">/</span>
        <span
          className="result-crumb-link"
          onClick={() => navigate(`/student/assignments/${assignment?.id || numericId}/overview`)}
          role="button"
          tabIndex={0}
        >
          {assignment?.title || t('studentResult.assignmentDetails')}
        </span>
        <span className="result-crumb-sep">/</span>
        <span className="result-crumb-current">
          {t('studentResult.resultAndFeedback')}
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="result-alert-error">
          <div className="result-alert-msg">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            className="btn btn-danger btn-sm"
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {/* Pending Grading Alert */}
      {!isGraded && !isLoading && (
        <div className="result-alert-pending">
          <Clock size={32} className="result-pending-icon" />
          <div>
            <h3 className="result-pending-title">
              {t('studentResult.statusPending')} ({submission?.status || 'SUBMITTED'})
            </h3>
            <p className="result-pending-text">
              Bài nộp của bạn đã được tiếp nhận thành công vào lúc {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleString('vi-VN') : 'vừa xong'}. Điểm số và bài chữa chi tiết từ AI và Giảng viên sẽ xuất hiện tại đây ngay khi hoàn tất.
            </p>
          </div>
        </div>
      )}

      {/* 2. Hero Score Header */}
      <section className="result-hero-banner">
        <div className="result-hero-left">
          <div className="result-badge-row">
            <span className="result-hero-tag">
              {isGraded ? t('studentResult.statusGraded') : t('studentResult.statusAiGrading')}
            </span>

            {/* Attempt Switcher if multiple attempts exist */}
            {attempts.length > 1 ? (
              <select
                className="result-attempt-select"
                value={submission?.id || attempts[0]?.id}
                onChange={(e) => void handleSelectAttempt(Number(e.target.value))}
              >
                {attempts.map((att) => (
                  <option key={att.id} value={att.id}>
                    {t('studentResult.attemptPrefix')}{att.attemptNumber} {att.id === submission?.id ? `(${t('studentResult.latestBadge')})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="result-hero-tag">
                {t('studentResult.attemptPrefix')}{submission?.attemptNumber ?? 1}
              </span>
            )}
          </div>

          <h1 className="result-hero-title">
            {assignment?.title ? assignment.title : `Kết quả đánh giá bài làm #${submission?.id || numericId}`}
          </h1>

          <div className="result-hero-meta">
            <span><strong>{t('studentResult.submittedOn')}:</strong> {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString('vi-VN') : 'Hôm nay'}</span>
            <span>•</span>
            <span><strong>Kỹ năng:</strong> {selectedSkill}</span>
          </div>
        </div>

        <div className="flex items-center gap-20 flex-wrap">
          {/* Main Score Capsule */}
          {displayScore !== null && (
            <div className="result-hero-score-box">
              <span className="result-score-number">{displayScore}</span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="result-hero-actions">
            <button
              className="result-btn-white"
              onClick={() => navigate(`/student/assignments/${submission?.assignmentId || assignment?.id || numericId}/overview`)}
              type="button"
            >
              <RotateCcw size={14} />
              {t('studentResult.btnRetake')}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Skill / Module Switcher */}
      {availableSkills.length > 0 && (
        <section className="result-skill-switcher" aria-label={t('studentResult.moduleSwitcherLabel')}>
          <span className="result-filter-count">
            {t('studentResult.moduleSwitcherLabel')}
          </span>

          <div className="result-skill-buttons-group">
            {availableSkills.map((skill) => {
              const Icon = skill === 'LISTENING' ? Headphones : skill === 'READING' ? BookOpen : skill === 'SPEAKING' ? Mic : FileEdit;
              const label = skill.charAt(0) + skill.slice(1).toLowerCase();
              return (
                <button
                  key={skill}
                  type="button"
                  className={`result-skill-btn ${selectedSkill === skill ? 'active' : ''}`}
                  onClick={() => void handleSelectSkill(skill)}
                >
                  <Icon size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Tab Navigation Bar */}
      <div className="result-nav-tabs">
        <button
          type="button"
          className="result-nav-tab active"
        >
          <FileText size={16} />
          <span>{t('studentResult.tabDetailedReview')}</span>
        </button>
      </div>

      {annotationStatus !== 'success' && (
        <div role={annotationStatus === 'loading' ? 'status' : 'alert'} className="result-card p-20">
          <p>{t(`annotationStatus.${annotationStatus}`)}</p>
          {annotationStatus === 'network' && (
            <Button type="button" onClick={annotationResult.retry}>{t('annotationStatus.retry')}</Button>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 1: DETAILED REVIEW
          ========================================================================= */}
      {/* WRITING SKILL VIEW */}
      {selectedSkill === 'WRITING' && (
        <div className="result-workspace-grid">
          {/* Left Essay Canvas */}
          <div className="result-card">
            <div className="result-card-header">
              <h2 className="result-card-title">
                Bài Nộp &amp; Chữa Lỗi Trực Tuyến
              </h2>
              {annotationStatus === 'success' && (
                <span className="result-filter-badge-text">
                  {annotations.length > 0 ? (
                    <>Tổng cộng <strong>{annotations.length}</strong> {t('studentResult.annotationsCount')}</>
                  ) : (
                    'Chưa có ghi chú'
                  )}
                </span>
              )}
            </div>

            {/* Filter Bar */}
            {annotations.length > 0 && (
              <div className="annotation-filters-bar">
                <span className="result-filter-count">
                  Lọc ghi chú:
                </span>
                <button
                  type="button"
                  className={`annotation-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFilter('all')}
                >
                  {t('studentResult.filterAll')} ({annotations.length})
                </button>
                {availableAnnotationFilters.map((opt) => (
                  <button
                    key={opt.category}
                    type="button"
                    className={`annotation-filter-btn ${activeFilter === opt.category ? 'active' : ''}`}
                    onClick={() => setActiveFilter(opt.category)}
                  >
                    {t(opt.labelKey)} ({opt.count})
                  </button>
                ))}
              </div>
            )}

            {/* Essay Text Canvas */}
            <div className="essay-text-canvas">
              {studentEssay ? (
                studentEssay.split('\n').filter(Boolean).map((paragraph, pIdx) => (
                  <p key={pIdx} className="result-essay-paragraph">
                    {paragraph}
                  </p>
                ))
              ) : attachedDocKey ? (
                <div className="result-doc-card">
                  <File size={36} className="result-doc-icon" />
                  <div className="result-doc-title">Tệp tài liệu bài nộp</div>
                  <div className="result-doc-name">{attachedDocKey}</div>
                </div>
              ) : (
                <div className="result-empty-tab-content">
                  <FileText size={32} className="result-empty-tab-icon" />
                  <p className="result-empty-tab-msg">Chưa có nội dung văn bản bài nộp cho phần này.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Inspector */}
          <div className="flex-col gap-20">
            <div className="result-card">
              <div className="result-card-header">
                <h3 className="result-card-title">
                  {t('studentResult.selectedAnnotationHeader')}
                </h3>
                {selectedAnnotation && (
                  <span className={`question-status-badge ${selectedAnnotation.type === 'positive' ? 'correct' : 'incorrect'}`}>
                    {selectedAnnotation.badgeLabel}
                  </span>
                )}
              </div>

              <div className="result-card-body annotation-inspect-box">
                {selectedAnnotation ? (
                  <>
                    <div>
                      <div className="result-ann-section-label">
                        {t('studentResult.originalSegment')}
                      </div>
                      <div className="diff-box original">
                        &quot;{selectedAnnotation.original}&quot;
                      </div>
                    </div>

                    {selectedAnnotation.suggestion && (
                      <div>
                        <div className="result-ann-section-label">
                          {t('studentResult.suggestedFix')}
                        </div>
                        <div className="diff-box suggestion">
                          &quot;{selectedAnnotation.suggestion}&quot;
                        </div>
                      </div>
                    )}

                    <div className="explanation-card">
                      <div className="result-ann-header-title">
                        {t('studentResult.ruleExplanation')}
                      </div>
                      {selectedAnnotation.explanation}
                    </div>

                    {selectedAnnotation.teacherNote && (
                      <div className="teacher-annotation-note">
                        <div className="result-ann-item-row">
                          <UserCheck size={14} />
                          {t('studentResult.teacherAdvice')}
                        </div>
                        &quot;{selectedAnnotation.teacherNote}&quot;
                      </div>
                    )}
                  </>
                ) : annotationStatus === 'success' ? (
                  <div className="result-ann-empty">
                    {annotations.length === 0
                      ? t('annotationStatus.empty')
                      : 'Chọn một ghi chú ở danh sách để xem chi tiết.'}
                  </div>
                ) : null}

                {/* Annotation list chips */}
                {filteredAnnotations.length > 0 && (
                  <div className="result-ann-summary-list">
                    <div className="result-ann-summary-title">
                      Danh sách điểm chữa ({filteredAnnotations.length})
                    </div>
                    {filteredAnnotations.map(ann => (
                      <button
                        key={ann.id}
                        type="button"
                        onClick={() => setSelectedAnnotationId(ann.id)}
                        className={`result-ann-chip ${selectedAnnotation?.id === ann.id ? 'is-active' : ''}`}
                      >
                        <span className="result-ann-summary-text">#{ann.id} {ann.badgeLabel}</span>: {ann.suggestion || ann.original}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Teacher Feedback */}
            <div className="result-card">
              <div className="result-card-header">
                <h3 className="result-card-title">
                  {isVi ? 'Nhận xét của giáo viên' : 'Teacher Feedback'}
                </h3>
              </div>
              <div className="result-card-body">
                {teacherFeedbackText ? (
                  <div className="result-teacher-feedback-content">
                    <MarkdownView content={teacherFeedbackText} />
                  </div>
                ) : (
                  <p className="result-teacher-feedback-empty">
                    {isVi ? 'Chưa có nhận xét từ giáo viên cho bài nộp này.' : 'No teacher feedback available for this submission yet.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SPEAKING SKILL VIEW */}
      {selectedSkill === 'SPEAKING' && (
        <div className="flex-col gap-20">
          {/* Student Audio Recording */}
          <div className="result-card">
            <div className="result-card-header">
              <h3 className="result-card-title">
                {isVi ? 'Bài nói của bạn' : 'Your Speaking Submission'}
              </h3>
            </div>

            <div className="result-card-body">
              {audioUrl ? (
                audioError ? (
                  <div className="result-audio-error">
                    <div className="result-audio-error-msg">
                      <AlertCircle size={16} />
                      <span>
                        {isVi ? 'Không thể tải bản ghi âm. Vui lòng thử lại.' : 'Failed to load audio recording.'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={RefreshCw}
                      onClick={() => setAudioErrorUrl(null)}
                    >
                      {isVi ? 'Thử lại' : 'Retry'}
                    </Button>
                  </div>
                ) : (
                  <div className="result-audio-player-wrap">
                    <audio
                      controls
                      src={audioUrl}
                      className="result-audio-player"
                      onError={() => setAudioErrorUrl(audioUrl)}
                    >
                      {isVi ? 'Trình duyệt của bạn không hỗ trợ phát âm thanh.' : 'Your browser does not support audio playback.'}
                    </audio>
                  </div>
                )
              ) : (
                <div className="result-audio-empty">
                  {isVi ? 'Chưa tìm thấy bản ghi âm của bài nộp này.' : 'No audio recording found for this submission.'}
                </div>
              )}

              {/* Spoken Transcript for Student */}
              {speakingTranscriptText && (
                <div className="result-speaking-transcript-wrap">
                  <div className="result-speaking-transcript-label">
                    <FileText size={16} />
                    <span>{isVi ? 'Bản ghi lời nói (AI Transcript):' : 'Spoken Transcript (AI Transcribed):'}</span>
                  </div>
                  <div className="result-speaking-transcript-text">
                    {speakingTranscriptText}
                  </div>
                </div>
              )}
            </div>
          </div>

          {annotationStatus === 'success' && annotations.length === 0 && (
            <div className="result-ann-empty">{t('annotationStatus.empty')}</div>
          )}

          {/* Accepted Speaking Annotations */}
          {annotations.length > 0 && (
            <div className="result-card">
              <div className="result-card-header">
                <h3 className="result-card-title">
                  {isVi ? 'Chi tiết điểm sửa lỗi đã duyệt' : 'Approved Annotations'}
                </h3>
                <span className="result-filter-badge-text">
                  <strong>{annotations.length}</strong> {t('studentResult.annotationsCount')}
                </span>
              </div>
              <div className="result-card-body annotation-inspect-box">
                {annotations.map((ann) => (
                  <div key={ann.id} className="explanation-card">
                    <div className="result-speaking-ann-header">
                      <span className="result-ann-type-pill">{ann.badgeLabel}</span>
                      <div className="result-ann-header-title">
                        <span>&ldquo;{ann.original}&rdquo;</span>
                        {ann.suggestion && (
                          <>
                            {' '}&rarr; <strong>{ann.suggestion}</strong>
                          </>
                        )}
                      </div>
                    </div>
                    <div>{ann.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teacher Feedback */}
          <div className="result-card">
            <div className="result-card-header">
              <h3 className="result-card-title">
                {isVi ? 'Nhận xét của giáo viên' : 'Teacher Feedback'}
              </h3>
            </div>

            <div className="result-card-body">
              {teacherFeedbackText ? (
                <div className="result-teacher-feedback-content">
                  <MarkdownView content={teacherFeedbackText} />
                </div>
              ) : (
                <p className="result-teacher-feedback-empty">
                  {isVi ? 'Chưa có nhận xét từ giáo viên cho bài nộp này.' : 'No teacher feedback available for this submission yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* READING OR LISTENING SKILL VIEW */}
      {(selectedSkill === 'READING' || selectedSkill === 'LISTENING') && (
        <div className="flex-col gap-20">
          <div className="result-card p-20">
            <div className="flex-between items-center mb-16 flex-wrap">
              <div className="result-mcq-header-title">
                {selectedSkill === 'READING' ? <BookOpen size={20} className="text-primary" /> : <Headphones size={20} className="text-primary" />}
                <h3 className="result-mcq-title-h3">
                  {t('studentResult.questionReview')} ({questionsList.length} câu)
                </h3>
              </div>

              {questionsList.length > 0 && (
                <div className="result-mcq-filter-group">
                  <button
                    type="button"
                    className={`annotation-filter-btn ${questionFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setQuestionFilter('all')}
                  >
                    {t('studentResult.filterAll')} ({questionsList.length})
                  </button>
                  <button
                    type="button"
                    className={`annotation-filter-btn ${questionFilter === 'correct' ? 'active' : ''}`}
                    onClick={() => setQuestionFilter('correct')}
                  >
                    {t('studentResult.filterCorrect')} ({questionsList.filter(q => q.isCorrect === true).length})
                  </button>
                  <button
                    type="button"
                    className={`annotation-filter-btn ${questionFilter === 'incorrect' ? 'active' : ''}`}
                    onClick={() => setQuestionFilter('incorrect')}
                  >
                    {t('studentResult.filterIncorrect')} ({questionsList.filter(q => q.isCorrect === false).length})
                  </button>
                </div>
              )}
            </div>

            {questionsList.length === 0 ? (
              <div className="result-empty-tab-content">
                <HelpCircle size={32} className="result-empty-tab-icon" />
                <p className="result-empty-tab-msg">Không có câu hỏi trắc nghiệm nào trong module này.</p>
              </div>
            ) : (
              <div className="result-mcq-list">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`result-mcq-card ${q.isCorrect === true ? 'is-correct' : q.isCorrect === false ? 'is-incorrect' : ''}`}
                  >
                    <div className="result-mcq-card-top">
                      <span className="result-mcq-card-num">
                        Câu {q.questionNumber}: {q.prompt}
                      </span>
                      {q.isCorrect !== undefined && (
                        <span className={`result-mcq-status-badge ${q.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
                          {q.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </span>
                      )}
                    </div>

                    <div className="result-mcq-meta">
                      <div>
                        <span className="text-on-surface-variant">{t('studentResult.yourAnswer')}: </span>
                        <strong className={q.isCorrect === true ? 'result-mcq-answer-correct' : q.isCorrect === false ? 'result-mcq-answer-incorrect' : ''}>
                          {q.studentAnswer}
                        </strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant">{t('studentResult.correctAnswer')}: </span>
                        <strong className="result-mcq-answer-correct">{q.correctAnswer}</strong>
                      </div>
                    </div>

                    {q.options && q.options.length > 0 && (
                      <div className="result-mcq-options-grid">
                        {q.options.map((opt) => {
                          const isStudentPick = q.studentAnswer.startsWith(opt.key);
                          const isCorrectOption = q.correctAnswer.startsWith(opt.key);
                          return (
                            <div
                              key={opt.key}
                              className={`result-mcq-opt-item ${isCorrectOption ? 'is-correct' : isStudentPick && !q.isCorrect ? 'is-student-wrong' : ''}`}
                            >
                              <span className={`result-mcq-opt-key ${isCorrectOption ? 'is-correct' : isStudentPick ? 'is-student-wrong' : ''}`}>
                                {opt.key}
                              </span>
                              <span className={`result-mcq-opt-text ${isCorrectOption ? 'is-correct' : isStudentPick ? 'is-student-wrong' : ''}`}>
                                {opt.text}
                              </span>
                              {isCorrectOption && (
                                <span className="result-mcq-tag-correct inline-flex items-center gap-1">
                                  <CheckCircle2 size={12} />
                                  <span>Đáp án đúng</span>
                                </span>
                              )}
                              {isStudentPick && !isCorrectOption && (
                                <span className="result-mcq-tag-wrong inline-flex items-center gap-1">
                                  <XCircle size={12} />
                                  <span>Lựa chọn của bạn</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teacher Feedback */}
          <div className="result-card">
            <div className="result-card-header">
              <h3 className="result-card-title">
                {isVi ? 'Nhận xét của giáo viên' : 'Teacher Feedback'}
              </h3>
            </div>
            <div className="result-card-body">
              {teacherFeedbackText ? (
                <div className="result-teacher-feedback-content">
                  <MarkdownView content={teacherFeedbackText} />
                </div>
              ) : (
                <p className="result-teacher-feedback-empty">
                  {isVi ? 'Chưa có nhận xét từ giáo viên cho bài nộp này.' : 'No teacher feedback available for this submission yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubmissionResult;
