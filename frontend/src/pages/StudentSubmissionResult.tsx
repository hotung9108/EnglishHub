import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  Download, 
  RotateCcw, 
  MessageSquare, 
  FileText, 
  Award, 
  UserCheck, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Play, 
  Pause, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  BookOpen, 
  Headphones, 
  Mic, 
  FileEdit, 
  Send, 
  HelpCircle, 
  TrendingUp, 
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
import { gradingService, type AiGradingSuggestionResponse, type GradingDetailResponse } from '../api/services/grading.service';
import '../styles/student-result.css';

interface DisplayAnnotation {
  id: number;
  type: 'grammar' | 'vocabulary' | 'positive' | 'cohesion';
  original: string;
  suggestion: string;
  explanation: string;
  teacherNote?: string;
  approved: boolean;
  startOffset?: number;
  endOffset?: number;
}

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
  if (!answers || answers.length === 0) return '';
  const first = answers[0];
  if (typeof first.content === 'string') return first.content;
  if (first.content && typeof first.content === 'object') {
    const obj = first.content as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.essay === 'string') return obj.essay;
    if (typeof obj.answer === 'string') return obj.answer;
    return JSON.stringify(first.content);
  }
  return '';
}

function extractTranscriptText(transcript: unknown): string {
  if (!transcript) return '';
  if (typeof transcript === 'string') return transcript;
  if (typeof transcript === 'object') {
    const obj = transcript as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.transcript === 'string') return obj.transcript;
    if (Array.isArray(obj.words)) {
      return (obj.words as { word?: string }[]).map(w => w.word || '').join(' ');
    }
    return JSON.stringify(transcript);
  }
  return '';
}

export const StudentSubmissionResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();

  // State
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [moduleDetail, setModuleDetail] = useState<SubmissionModuleDetailResponse | null>(null);
  const [gradingDetail, setGradingDetail] = useState<GradingDetailResponse | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AiGradingSuggestionResponse | null>(null);
  const [attempts, setAttempts] = useState<SubmissionListItem[]>([]);
  const [annotations, setAnnotations] = useState<DisplayAnnotation[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noSubmissionFound, setNoSubmissionFound] = useState<boolean>(false);

  // Tab & skill selection
  const [activeTab, setActiveTab] = useState<'review' | 'rubrics' | 'feedback'>('review');
  const [selectedSkill, setSelectedSkill] = useState<SubmissionSkill>('WRITING');
  const [activeFilter, setActiveFilter] = useState<'all' | 'grammar' | 'vocabulary' | 'positive' | 'cohesion'>('all');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<number | null>(null);
  const [questionFilter, setQuestionFilter] = useState<'all' | 'correct' | 'incorrect'>('all');

  // Speaking playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Inquiry form
  const [inquiryText, setInquiryText] = useState<string>('');
  const [inquirySent, setInquirySent] = useState<boolean>(false);

  const numericId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : 1;
  }, [id]);

  const isAssignmentRoute = useMemo(() => {
    return location.pathname.includes('/assignments/');
  }, [location.pathname]);

  // Load active module details when selectedSkill changes or subModule changes
  const loadModuleData = useCallback(async (subModuleId: number) => {
    try {
      const [modRes, sugRes] = await Promise.allSettled([
        submissionService.getSubmissionModuleDetail(subModuleId),
        gradingService.getAiSuggestion(subModuleId)
      ]);

      if (modRes.status === 'fulfilled') {
        setModuleDetail(modRes.value);
        if (modRes.value.grading?.id) {
          try {
            const gd = await gradingService.getById(modRes.value.grading.id);
            setGradingDetail(gd);
          } catch {
            // Non-critical
          }
        }
      }

      if (sugRes.status === 'fulfilled') {
        setAiSuggestion(sugRes.value);
        if (sugRes.value.annotations && sugRes.value.annotations.length > 0) {
          const mapped: DisplayAnnotation[] = sugRes.value.annotations.map((ann, idx) => ({
            id: ann.id || idx + 1,
            type: ann.errorType?.toLowerCase().includes('vocab') 
              ? 'vocabulary' 
              : ann.errorType?.toLowerCase().includes('cohesion')
              ? 'cohesion'
              : 'grammar',
            original: `Đoạn ký tự [${ann.startOffset} - ${ann.endOffset}]`,
            suggestion: ann.suggestedFix || 'Gợi ý chuẩn hóa từ AI',
            explanation: ann.comment || 'Nhận xét từ hệ thống AI',
            teacherNote: ann.source === 'TEACHER' ? 'Ghi chú từ giáo viên' : undefined,
            approved: ann.reviewStatus === 'ACCEPTED',
            startOffset: ann.startOffset,
            endOffset: ann.endOffset
          }));
          setAnnotations(mapped);
          setSelectedAnnotationId(mapped[0]?.id ?? null);
        } else {
          setAnnotations([]);
          setSelectedAnnotationId(null);
        }
      } else {
        setAiSuggestion(null);
        setAnnotations([]);
        setSelectedAnnotationId(null);
      }
    } catch {
      // Continue without crashing
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNoSubmissionFound(false);

    try {
      let currentSubmission: SubmissionDetail | null = null;
      let targetAssignmentId = numericId;

      if (isAssignmentRoute) {
        // Path is /student/assignments/:id/result -> numericId is assignmentId
        targetAssignmentId = numericId;
        try {
          const asg = await assignmentService.getAssignment(targetAssignmentId);
          setAssignment(asg);
        } catch {
          // Continue
        }

        if (user?.id) {
          const listRes = await submissionService.listSubmissions({
            assignmentId: targetAssignmentId,
            studentId: user.id,
            limit: 10
          });
          if (listRes.data && listRes.data.length > 0) {
            setAttempts(listRes.data);
            currentSubmission = await submissionService.getSubmission(listRes.data[0].id);
          } else {
            setNoSubmissionFound(true);
          }
        }
      } else {
        // Path is /student/submissions/:id -> numericId is submissionId
        try {
          currentSubmission = await submissionService.getSubmission(numericId);
          targetAssignmentId = currentSubmission.assignmentId;
          const asg = await assignmentService.getAssignment(targetAssignmentId);
          setAssignment(asg);

          if (user?.id) {
            const listRes = await submissionService.listSubmissions({
              assignmentId: targetAssignmentId,
              studentId: user.id,
              limit: 10
            });
            if (listRes.data && listRes.data.length > 0) {
              setAttempts(listRes.data);
            }
          }
        } catch {
          // If not found as submission, try assignment
          try {
            const asg = await assignmentService.getAssignment(numericId);
            setAssignment(asg);
            if (user?.id) {
              const listRes = await submissionService.listSubmissions({
                assignmentId: numericId,
                studentId: user.id,
                limit: 10
              });
              if (listRes.data && listRes.data.length > 0) {
                setAttempts(listRes.data);
                currentSubmission = await submissionService.getSubmission(listRes.data[0].id);
              } else {
                setNoSubmissionFound(true);
              }
            }
          } catch (fetchErr) {
            throw fetchErr;
          }
        }
      }

      setSubmission(currentSubmission);

      if (currentSubmission && currentSubmission.modules && currentSubmission.modules.length > 0) {
        const firstMod = currentSubmission.modules[0];
        if (firstMod.skill) {
          setSelectedSkill(firstMod.skill);
        }
        await loadModuleData(firstMod.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu kết quả chấm bài.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [numericId, isAssignmentRoute, user?.id, loadModuleData]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Handle switching attempts
  const handleSelectAttempt = async (attemptId: number) => {
    setIsLoading(true);
    try {
      const sub = await submissionService.getSubmission(attemptId);
      setSubmission(sub);
      const subModule = sub.modules?.[0];
      if (subModule) {
        if (subModule.skill) setSelectedSkill(subModule.skill);
        await loadModuleData(subModule.id);
      }
    } catch {
      // Continue
    } finally {
      setIsLoading(false);
    }
  };

  // Handle switching skill tabs
  const handleSelectSkill = async (skill: SubmissionSkill) => {
    setSelectedSkill(skill);
    const targetModule = submission?.modules?.find(m => m.skill === skill);
    if (targetModule) {
      setIsLoading(true);
      try {
        await loadModuleData(targetModule.id);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Compute active module
  const activeSubModule = useMemo(() => {
    if (!submission?.modules || submission.modules.length === 0) return null;
    return submission.modules.find(m => m.skill === selectedSkill) || submission.modules[0];
  }, [submission, selectedSkill]);

  // Real score derivation
  const rawScore = useMemo<number | null>(() => {
    if (gradingDetail?.finalScore != null) return gradingDetail.finalScore;
    if (activeSubModule?.grading?.finalScore != null) return activeSubModule.grading.finalScore;
    if (moduleDetail?.grading?.finalScore != null) return moduleDetail.grading.finalScore;
    if (aiSuggestion?.suggestedScore != null) return aiSuggestion.suggestedScore;
    return null;
  }, [gradingDetail, activeSubModule, moduleDetail, aiSuggestion]);

  const maxScore = useMemo<number>(() => {
    if (gradingDetail?.maxScoreSnapshot != null) return gradingDetail.maxScoreSnapshot;
    if (activeSubModule?.grading?.maxScoreSnapshot != null) return activeSubModule.grading.maxScoreSnapshot;
    if (aiSuggestion?.maxScore != null) return aiSuggestion.maxScore;
    return 100;
  }, [gradingDetail, activeSubModule, aiSuggestion]);

  const bandScore = useMemo<string>(() => {
    if (rawScore == null) return '--';
    const computed = (rawScore / maxScore) * 9;
    return computed.toFixed(1);
  }, [rawScore, maxScore]);

  const isGraded = useMemo<boolean>(() => {
    if (submission?.status === 'GRADED') return true;
    if (gradingDetail?.status === 'COMPLETED' || gradingDetail?.status === 'AI_GRADED') return true;
    if (activeSubModule?.grading?.status === 'AI_GRADED') return true;
    return false;
  }, [submission, gradingDetail, activeSubModule]);

  // Annotations
  const selectedAnnotation = useMemo(() => {
    if (annotations.length === 0) return null;
    return annotations.find(a => a.id === selectedAnnotationId) || annotations[0];
  }, [annotations, selectedAnnotationId]);

  const filteredAnnotations = useMemo(() => {
    if (activeFilter === 'all') return annotations;
    return annotations.filter(a => a.type === activeFilter);
  }, [annotations, activeFilter]);

  // Questions derivation for Reading or Listening
  const questionsList = useMemo<QuestionDisplayItem[]>(() => {
    if (!moduleDetail?.questions || moduleDetail.questions.length === 0) return [];
    return moduleDetail.questions.map((q, idx) => {
      const studentAnsItem = moduleDetail.answers?.find(a => a.questionId === q.id);
      let sAnsText = '--';
      if (typeof studentAnsItem?.content === 'string') {
        sAnsText = studentAnsItem.content;
      } else if (studentAnsItem?.content && typeof studentAnsItem.content === 'object') {
        const obj = studentAnsItem.content as Record<string, unknown>;
        sAnsText = typeof obj.answer === 'string' ? obj.answer : typeof obj.selectedOption === 'string' ? obj.selectedOption : JSON.stringify(obj);
      }

      const cAnsText = q.correctAnswer ? String(q.correctAnswer) : '--';
      const isCorrect = sAnsText !== '--' && cAnsText !== '--' ? sAnsText.trim().toLowerCase() === cAnsText.trim().toLowerCase() : undefined;

      return {
        id: q.id,
        questionNumber: idx + 1,
        prompt: q.content,
        questionType: q.questionType,
        options: [
          { key: 'A', text: 'Phương án A' },
          { key: 'B', text: 'Phương án B' },
          { key: 'C', text: 'Phương án C' },
          { key: 'D', text: 'Phương án D' }
        ],
        studentAnswer: sAnsText,
        correctAnswer: cAnsText,
        isCorrect,
        explanation: 'Đối chiếu theo ngân hàng câu hỏi bài học.'
      };
    });
  }, [moduleDetail]);

  const filteredQuestions = useMemo(() => {
    if (questionFilter === 'correct') return questionsList.filter(q => q.isCorrect === true);
    if (questionFilter === 'incorrect') return questionsList.filter(q => q.isCorrect === false);
    return questionsList;
  }, [questionsList, questionFilter]);

  // Audio timer ticker
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => (prev >= 120 ? 0 : prev + 1));
      }, 1000 / playbackSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed]);

  // Extracted student contents
  const studentEssay = useMemo(() => {
    return extractAnswerText(moduleDetail?.answers);
  }, [moduleDetail?.answers]);

  const attachedDocKey = useMemo(() => {
    return moduleDetail?.answers?.find(a => a.docStorageKey)?.docStorageKey || null;
  }, [moduleDetail?.answers]);

  const audioStorageKey = useMemo(() => {
    return moduleDetail?.answers?.find(a => a.audioStorageKey)?.audioStorageKey || null;
  }, [moduleDetail?.answers]);

  const transcriptContent = useMemo(() => {
    return extractTranscriptText(aiSuggestion?.transcript || gradingDetail?.aiTranscript);
  }, [aiSuggestion?.transcript, gradingDetail?.aiTranscript]);

  // Real rubrics criteria from AI suggestion
  const criteriaScores = aiSuggestion?.criteriaScores;

  const criteriaList = useMemo(() => {
    if (selectedSkill === 'SPEAKING') {
      return [
        { 
          key: 'fc', 
          title: 'Fluency & Coherence', 
          score: criteriaScores?.fluencyCohesion != null ? criteriaScores.fluencyCohesion.toFixed(1) : (isGraded ? '--' : '--'), 
          desc: 'Nhịp nói tự nhiên, phát triển ý liền mạch, hạn chế khoảng ngừng ngắt quãng.' 
        },
        { 
          key: 'lr', 
          title: 'Lexical Resource', 
          score: criteriaScores?.lexicalResource != null ? criteriaScores.lexicalResource.toFixed(1) : (isGraded ? '--' : '--'), 
          desc: 'Vận dụng linh hoạt cụm từ chuyên đề, chuyển đổi từ đồng nghĩa chính xác.' 
        },
        { 
          key: 'gr', 
          title: 'Grammatical Range', 
          score: criteriaScores?.grammaticalRange != null ? criteriaScores.grammaticalRange.toFixed(1) : (isGraded ? '--' : '--'), 
          desc: 'Kiểm soát tốt câu ghép và câu điều kiện, ít lỗi chia động từ.' 
        },
        { 
          key: 'pr', 
          title: 'Pronunciation', 
          score: criteriaScores?.pronunciation != null ? criteriaScores.pronunciation.toFixed(1) : (isGraded ? '--' : '--'), 
          desc: 'Ngữ điệu tự nhiên, chuẩn trọng âm từ và âm đuôi /s/, /ed/ rõ ràng.' 
        }
      ];
    }
    return [
      { 
        key: 'ta', 
        title: 'Task Achievement', 
        score: criteriaScores?.taskAchievement != null ? criteriaScores.taskAchievement.toFixed(1) : (isGraded ? '--' : '--'), 
        desc: 'Trả lời đầy đủ các vế của đề bài. Lập luận chặt chẽ và đưa ra dẫn chứng xác đáng.' 
      },
      { 
        key: 'cc', 
        title: 'Coherence & Cohesion', 
        score: criteriaScores?.coherenceCohesion != null ? criteriaScores.coherenceCohesion.toFixed(1) : (isGraded ? '--' : '--'), 
        desc: 'Cấu trúc bài viết logic. Sử dụng linh hoạt các liên từ chuyển tiếp mạch lạc.' 
      },
      { 
        key: 'lr', 
        title: 'Lexical Resource', 
        score: criteriaScores?.lexicalResource != null ? criteriaScores.lexicalResource.toFixed(1) : (isGraded ? '--' : '--'), 
        desc: 'Vốn từ vựng phong phú. Vận dụng tốt các cụm collocations học thuật nâng cao.' 
      },
      { 
        key: 'gr', 
        title: 'Grammatical Range & Accuracy', 
        score: criteriaScores?.grammaticalRange != null ? criteriaScores.grammaticalRange.toFixed(1) : (isGraded ? '--' : '--'), 
        desc: 'Phối hợp đa dạng các cấu trúc ngữ pháp phức. Hạn chế tối đa các lỗi chia thì.' 
      }
    ];
  }, [selectedSkill, criteriaScores, isGraded]);

  // Handle teacher question inquiry
  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim()) return;
    setInquirySent(true);
    setInquiryText('');
    setTimeout(() => setInquirySent(false), 4000);
  };

  // Available skills in submission
  const availableSkills: SubmissionSkill[] = useMemo(() => {
    if (!submission?.modules || submission.modules.length === 0) return ['WRITING'];
    const skills = submission.modules.map(m => m.skill).filter((s): s is SubmissionSkill => Boolean(s));
    return skills.length > 0 ? Array.from(new Set(skills)) : ['WRITING'];
  }, [submission]);

  // Empty submission state
  if (noSubmissionFound) {
    return (
      <div className="student-result-page">
        <div className="result-breadcrumb-bar">
          <button 
            type="button" 
            className="result-crumb-back-btn" 
            onClick={() => navigate('/student/assignments')}
          >
            <ArrowLeft size={16} />
            <span>{t('studentResult.backToList')}</span>
          </button>
        </div>

        <div className="result-card p-24" style={{ textAlign: 'center', marginTop: '40px' }}>
          <AlertCircle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
            Chưa tìm thấy bài nộp nào
          </h2>
          <p style={{ color: 'var(--on-surface-variant)', maxWidth: '520px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            {assignment?.title 
              ? `Bạn chưa nộp bài cho bài tập "${assignment.title}". Hãy vào phần làm bài để hoàn thành và nhận đánh giá từ hệ thống.`
              : 'Hiện tại chưa ghi nhận lượt nộp bài nào của bạn cho mã bài tập này.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
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

  return (
    <div className="student-result-page">
      {/* 1. Breadcrumb Bar */}
      <div className="result-breadcrumb-bar">
        <button 
          type="button" 
          className="result-crumb-back-btn" 
          onClick={() => navigate('/student/assignments')}
        >
          <ArrowLeft size={16} />
          <span>{t('studentResult.backToList')}</span>
        </button>
        <span className="text-outline">/</span>
        <span>{t('studentResult.system')}</span>
        <ChevronRight size={12} className="text-outline" />
        <span 
          className="result-crumb-link"
          onClick={() => navigate('/student/classes')}
          role="button"
          tabIndex={0}
        >
          {t('studentResult.backToClass')}
        </span>
        <ChevronRight size={12} className="text-outline" />
        <span 
          className="result-crumb-link"
          onClick={() => navigate(`/student/assignments/${assignment?.id || numericId}/overview`)}
          role="button"
          tabIndex={0}
        >
          {assignment?.title || t('studentResult.assignmentDetails')}
        </span>
        <ChevronRight size={12} className="text-outline" />
        <span className="font-semibold text-on-surface">
          {t('studentResult.resultAndFeedback')} (#{submission?.id || numericId})
        </span>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={{ marginBottom: '20px', padding: '16px', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991B1B' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', backgroundColor: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {/* Pending Grading Alert */}
      {!isGraded && !isLoading && (
        <div style={{ marginBottom: '24px', padding: '20px 24px', borderRadius: '14px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)' }}>
          <Clock size={32} color="#D97706" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700, color: '#92400E' }}>
              {t('studentResult.statusPending')} ({submission?.status || 'SUBMITTED'})
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#B45309', lineHeight: 1.5 }}>
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
              <Award size={13} />
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
            <span><strong>{t('studentResult.gradedBy')}:</strong> {gradingDetail?.reviewedBy ? `Giảng viên #${gradingDetail.reviewedBy}` : t('studentResult.gradedByVal')}</span>
            <span>•</span>
            <span><strong>Kỹ năng:</strong> {selectedSkill}</span>
          </div>
        </div>

        <div className="flex items-center gap-20 flex-wrap">
          {/* Main Score Capsule */}
          <div className="result-hero-score-box">
            <div className="result-score-main">
              <span className="result-score-number">
                {isLoading ? '...' : bandScore}
              </span>
              <span className="result-score-label">{t('studentResult.bandScore')}</span>
            </div>
            <div className="result-score-divider" />
            <div className="result-score-sub">
              <span className="result-score-100">
                {isLoading ? '...' : rawScore != null ? `${rawScore} / ${maxScore}` : `-- / ${maxScore}`}
              </span>
              <span className="result-score-sub-label">{t('studentResult.score100')}</span>
              <span className="result-score-status-pill">
                {rawScore != null && rawScore >= 50 ? (
                  <>
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 3 }} /> 
                    {t('studentResult.meetsStandard')}
                  </>
                ) : rawScore != null ? (
                  <>
                    <XCircle size={12} style={{ display: 'inline', marginRight: 3 }} /> 
                    {t('studentResult.belowStandard')}
                  </>
                ) : (
                  'Chờ hoàn tất chấm'
                )}
              </span>
            </div>
          </div>

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
            <button 
              className="result-btn-outline-white" 
              onClick={() => window.print()}
              type="button"
            >
              <Download size={14} />
              {t('studentResult.btnDownloadPdf')}
            </button>
            <button 
              className="result-btn-outline-white" 
              onClick={() => navigate('/student/grades')}
              type="button"
            >
              <TrendingUp size={14} />
              {t('studentResult.btnViewGrades')}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Skill / Module Switcher */}
      {availableSkills.length > 0 && (
        <section className="result-skill-switcher">
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)', marginLeft: '8px', marginRight: '4px' }}>
            {t('studentResult.moduleSwitcherLabel')}
          </span>

          {availableSkills.includes('WRITING') && (
            <button
              type="button"
              className={`result-skill-btn ${selectedSkill === 'WRITING' ? 'active' : ''}`}
              onClick={() => void handleSelectSkill('WRITING')}
            >
              <FileEdit size={15} />
              <span>Writing</span>
            </button>
          )}

          {availableSkills.includes('SPEAKING') && (
            <button
              type="button"
              className={`result-skill-btn ${selectedSkill === 'SPEAKING' ? 'active' : ''}`}
              onClick={() => void handleSelectSkill('SPEAKING')}
            >
              <Mic size={15} />
              <span>Speaking</span>
            </button>
          )}

          {availableSkills.includes('READING') && (
            <button
              type="button"
              className={`result-skill-btn ${selectedSkill === 'READING' ? 'active' : ''}`}
              onClick={() => void handleSelectSkill('READING')}
            >
              <BookOpen size={15} />
              <span>Reading</span>
            </button>
          )}

          {availableSkills.includes('LISTENING') && (
            <button
              type="button"
              className={`result-skill-btn ${selectedSkill === 'LISTENING' ? 'active' : ''}`}
              onClick={() => void handleSelectSkill('LISTENING')}
            >
              <Headphones size={15} />
              <span>Listening</span>
            </button>
          )}
        </section>
      )}

      {/* 4. Tab Navigation Bar */}
      <div className="result-nav-tabs">
        <button
          type="button"
          className={`result-nav-tab ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          <FileText size={16} />
          <span>{t('studentResult.tabDetailedReview')}</span>
        </button>
        <button
          type="button"
          className={`result-nav-tab ${activeTab === 'rubrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('rubrics')}
        >
          <Award size={16} />
          <span>{t('studentResult.tabRubricsAnalysis')}</span>
        </button>
        <button
          type="button"
          className={`result-nav-tab ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <MessageSquare size={16} />
          <span>{t('studentResult.tabTeacherFeedback')}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: DETAILED REVIEW
          ========================================================================= */}
      {activeTab === 'review' && (
        <>
          {/* WRITING SKILL VIEW */}
          {selectedSkill === 'WRITING' && (
            <div className="result-workspace-grid">
              {/* Left Essay Canvas */}
              <div className="result-card">
                <div className="result-card-header">
                  <h2 className="result-card-title">
                    <FileText size={18} className="text-primary" />
                    Bài Nộp &amp; Chữa Lỗi Trực Tuyến
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                    {annotations.length > 0 ? (
                      <>Tổng cộng <strong>{annotations.length}</strong> {t('studentResult.annotationsCount')}</>
                    ) : (
                      'Chưa có ghi chú'
                    )}
                  </span>
                </div>

                {/* Filter Bar */}
                {annotations.length > 0 && (
                  <div className="annotation-filters-bar">
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)', marginRight: '4px' }}>
                      Lọc ghi chú:
                    </span>
                    <button 
                      type="button" 
                      className={`annotation-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('all')}
                    >
                      {t('studentResult.filterAll')} ({annotations.length})
                    </button>
                    <button 
                      type="button" 
                      className={`annotation-filter-btn ${activeFilter === 'grammar' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('grammar')}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
                      {t('studentResult.filterGrammar')} ({annotations.filter(a => a.type === 'grammar').length})
                    </button>
                    <button 
                      type="button" 
                      className={`annotation-filter-btn ${activeFilter === 'vocabulary' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('vocabulary')}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                      {t('studentResult.filterVocab')} ({annotations.filter(a => a.type === 'vocabulary').length})
                    </button>
                    <button 
                      type="button" 
                      className={`annotation-filter-btn ${activeFilter === 'positive' ? 'active' : ''}`}
                      onClick={() => setActiveFilter('positive')}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                      {t('studentResult.filterPositive')} ({annotations.filter(a => a.type === 'positive').length})
                    </button>
                  </div>
                )}

                {/* Essay Text Canvas */}
                <div className="essay-text-canvas">
                  {studentEssay ? (
                    studentEssay.split('\n').filter(Boolean).map((paragraph, pIdx) => (
                      <p key={pIdx} style={{ lineHeight: 1.75, marginBottom: '16px' }}>
                        {paragraph}
                      </p>
                    ))
                  ) : attachedDocKey ? (
                    <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <File size={36} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
                      <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Tệp tài liệu bài nộp</div>
                      <div style={{ fontSize: '13px', color: '#64748b', wordBreak: 'break-all' }}>{attachedDocKey}</div>
                    </div>
                  ) : (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                      <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                      <p style={{ margin: 0, fontSize: '14px' }}>Chưa có nội dung văn bản bài nộp cho phần này.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar: Inspector */}
              <div className="flex-col gap-20">
                <div className="result-card">
                  <div className="result-card-header">
                    <h3 className="result-card-title">
                      <Sparkles size={16} className="text-secondary" />
                      {t('studentResult.selectedAnnotationHeader')}
                    </h3>
                    {selectedAnnotation && (
                      <span className={`question-status-badge ${selectedAnnotation.type === 'positive' ? 'correct' : 'incorrect'}`}>
                        {selectedAnnotation.type.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="result-card-body annotation-inspect-box">
                    {selectedAnnotation ? (
                      <>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>
                            {t('studentResult.originalSegment')}
                          </div>
                          <div className="diff-box original">
                            &quot;{selectedAnnotation.original}&quot;
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)', marginBottom: '6px' }}>
                            {t('studentResult.suggestedFix')}
                          </div>
                          <div className="diff-box suggestion">
                            &quot;{selectedAnnotation.suggestion}&quot;
                          </div>
                        </div>

                        <div className="explanation-card">
                          <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--on-surface)' }}>
                            {t('studentResult.ruleExplanation')}
                          </div>
                          {selectedAnnotation.explanation}
                        </div>

                        {selectedAnnotation.teacherNote && (
                          <div className="teacher-annotation-note">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                              <UserCheck size={14} />
                              {t('studentResult.teacherAdvice')}
                            </div>
                            &quot;{selectedAnnotation.teacherNote}&quot;
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '13.5px' }}>
                        {annotations.length === 0 
                          ? 'Chưa có điểm sửa lỗi nào được ghi nhận từ AI hoặc giáo viên.'
                          : 'Chọn một ghi chú ở danh sách để xem chi tiết.'}
                      </div>
                    )}

                    {/* Annotation list chips */}
                    {filteredAnnotations.length > 0 && (
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
                          Danh sách điểm chữa ({filteredAnnotations.length})
                        </div>
                        {filteredAnnotations.map(ann => (
                          <button
                            key={ann.id}
                            type="button"
                            onClick={() => setSelectedAnnotationId(ann.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: selectedAnnotationId === ann.id ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                              backgroundColor: selectedAnnotationId === ann.id ? 'var(--primary-container)' : 'var(--surface)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '12.5px'
                            }}
                          >
                            <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>#{ann.id} {ann.type}</span>: {ann.suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rubrics Preview summary card */}
                <div className="result-card p-20">
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)' }}>
                    Tóm tắt tiêu chí Writing:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                    {criteriaList.map((crit) => (
                      <div key={crit.key} className="flex-between">
                        <span className="text-on-surface-variant">{crit.title}:</span>
                        <strong className="text-primary">{crit.score} / 9.0</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SPEAKING SKILL VIEW */}
          {selectedSkill === 'SPEAKING' && (
            <div className="result-workspace-grid">
              <div className="flex-col gap-24">
                {/* Audio Player Card */}
                <div className="speaking-audio-player">
                  <div className="audio-header-row">
                    <span className="audio-title-pill">
                      <Volume2 size={16} />
                      {audioStorageKey ? audioStorageKey.split('/').pop() : `Speaking_Attempt_${submission?.attemptNumber ?? 1}`}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      {audioStorageKey ? 'File ghi âm bài nộp' : 'Chưa có file âm thanh'}
                    </span>
                  </div>

                  {/* Simulated Waveform Visualizer */}
                  <div className="waveform-container">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const heights = [28, 42, 65, 80, 50, 30, 92, 75, 40, 85, 60, 45, 90, 70, 35, 55, 78, 62, 88, 48, 32, 68, 85, 95];
                      const height = heights[i % heights.length];
                      const isPassed = isPlaying && i < Math.floor((currentTime / 120) * 48);
                      return (
                        <div
                          key={i}
                          className={`waveform-bar ${isPassed ? 'passed' : ''}`}
                          style={{ height: `${height}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Player Controls */}
                  <div className="audio-controls-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <button
                        type="button"
                        className="audio-play-btn"
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={!audioStorageKey}
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                      </button>
                      <span className="audio-time-label">
                        00:{currentTime < 10 ? `0${currentTime}` : currentTime} / {audioStorageKey ? '02:00' : '00:00'}
                      </span>
                    </div>

                    <div className="audio-speed-chips">
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: '4px' }}>Tốc độ:</span>
                      {[0.75, 1, 1.25].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          className={`audio-speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                          onClick={() => setPlaybackSpeed(speed)}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real Speech to Text transcript */}
                <div className="result-card">
                  <div className="result-card-header">
                    <h3 className="result-card-title">
                      <Sparkles size={16} className="text-secondary" />
                      {t('studentResult.sttTranscript')}
                    </h3>
                  </div>

                  <div className="result-card-body">
                    <div className="stt-transcript-box">
                      {transcriptContent ? (
                        <p style={{ margin: 0, lineHeight: 1.7, fontSize: '14px' }}>
                          {transcriptContent}
                        </p>
                      ) : (
                        <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontStyle: 'italic', fontSize: '13.5px' }}>
                          {isGraded 
                            ? 'Bản gỡ băng tự động chưa được lưu lại trong kết quả này.' 
                            : 'Đang chờ phân tích bản gỡ băng (transcript) từ AI...'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Criteria for Speaking */}
              <div className="flex-col gap-20">
                <div className="result-card p-20">
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)' }}>
                    Tiêu chí IELTS Speaking:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
                    {criteriaList.map((crit) => (
                      <div key={crit.key}>
                        <div className="flex-between" style={{ marginBottom: 4 }}>
                          <span className="text-on-surface-variant">{crit.title}:</span>
                          <strong className="text-primary">{crit.score} / 9.0</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--on-surface-variant)' }}>{crit.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* READING OR LISTENING SKILL VIEW */}
          {(selectedSkill === 'READING' || selectedSkill === 'LISTENING') && (
            <div className="flex-col gap-20">
              <div className="result-card p-20">
                <div className="flex-between items-center mb-16 flex-wrap">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {selectedSkill === 'READING' ? <BookOpen size={20} className="text-primary" /> : <Headphones size={20} className="text-primary" />}
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                      {t('studentResult.questionReview')} ({questionsList.length} câu)
                    </h3>
                  </div>

                  {questionsList.length > 0 && (
                    <div style={{ display: 'flex', gap: 8 }}>
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
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                    <HelpCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Không có câu hỏi trắc nghiệm nào trong module này.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {filteredQuestions.map((q) => (
                      <div 
                        key={q.id}
                        style={{
                          padding: '16px',
                          borderRadius: '10px',
                          border: '1px solid var(--outline-variant)',
                          backgroundColor: q.isCorrect === true ? '#f0fdf4' : q.isCorrect === false ? '#fef2f2' : 'var(--surface)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px' }}>
                            Câu {q.questionNumber}: {q.prompt}
                          </span>
                          {q.isCorrect !== undefined && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: q.isCorrect ? '#86efac' : '#fca5a5',
                              color: q.isCorrect ? '#14532d' : '#7f1d1d'
                            }}>
                              {q.isCorrect ? 'ĐÚNG' : 'SAI'}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', marginTop: '8px' }}>
                          <div>
                            <span style={{ color: 'var(--on-surface-variant)' }}>{t('studentResult.yourAnswer')}: </span>
                            <strong>{q.studentAnswer}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--on-surface-variant)' }}>{t('studentResult.correctAnswer')}: </span>
                            <strong style={{ color: '#16a34a' }}>{q.correctAnswer}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          TAB 2: RUBRICS ANALYSIS
          ========================================================================= */}
      {activeTab === 'rubrics' && (
        <div className="flex-col gap-24">
          {/* 4 Rubrics Breakdown */}
          <section className="result-rubrics-grid">
            {criteriaList.map((crit, idx) => {
              const numScore = Number(crit.score);
              const hasScore = !isNaN(numScore);
              const colors = ['#2563eb', '#8b5cf6', '#f59e0b', '#10b981'];
              const color = colors[idx % colors.length];

              return (
                <div key={crit.key} className="result-rubric-card" style={{ borderColor: color }}>
                  <div className="result-rubric-header">
                    <h3 className="result-rubric-title">{crit.title}</h3>
                    <span className="result-rubric-score" style={{ color }}>
                      {hasScore ? `${crit.score} / 9.0` : '-- / 9.0'}
                    </span>
                  </div>
                  <div className="result-rubric-bar-track">
                    <div 
                      className="result-rubric-bar-fill" 
                      style={{ 
                        width: hasScore ? `${(numScore / 9) * 100}%` : '0%', 
                        backgroundColor: color 
                      }} 
                    />
                  </div>
                  <p className="result-rubric-desc">{crit.desc}</p>
                </div>
              );
            })}
          </section>

          {/* AI Diagnostics & Remedial Path */}
          <div className="grid gap-24" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
            <div className="result-card p-24">
              <div className="flex items-center gap-10 mb-16">
                <Sparkles size={20} className="text-secondary" />
                <h3 className="m-0 font-bold text-base text-on-surface">
                  {t('studentResult.aiDiagnosticsTitle')}
                </h3>
              </div>

              <div className="flex-col gap-12">
                {aiSuggestion?.aiFeedback ? (
                  <div className="p-14 rounded-lg bg-surface-container-low border" style={{ borderColor: 'var(--outline-variant)' }}>
                    <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--on-surface)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {aiSuggestion.aiFeedback}
                    </p>
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--on-surface-variant)', fontSize: '13.5px' }}>
                    {isGraded 
                      ? 'Không có chẩn đoán chi tiết bổ sung từ hệ thống AI.'
                      : 'Hệ thống AI đang phân tích bài làm để tạo chẩn đoán năng lực.'}
                  </div>
                )}
              </div>
            </div>

            <div className="result-card p-24">
              <div className="flex items-center gap-10 mb-16">
                <TrendingUp size={20} className="text-primary" />
                <h3 className="m-0 font-bold text-base text-on-surface">
                  {t('studentResult.remedialPathTitle')}
                </h3>
              </div>

              <div className="flex-col gap-12">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '13.5px', fontWeight: 700 }}>Tiếp tục ôn tập kỹ năng {selectedSkill}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Bài tập rèn luyện tương ứng</span>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/student/workspace')}
                  >
                    Luyện tập
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TEACHER FEEDBACK & DISCUSSION
          ========================================================================= */}
      {activeTab === 'feedback' && (
        <div className="teacher-discussion-card">
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: 'var(--on-surface)' }}>
              {t('studentResult.teacherSummaryTitle')}
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              Lời phê chính thức từ Giảng viên phụ trách chấm bài
            </span>
          </div>

          <div className="teacher-profile-bubble">
            <div className="teacher-avatar-circ">
              GV
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex-between items-center mb-8 flex-wrap">
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--on-surface)' }}>
                    {gradingDetail?.reviewedBy ? `Giảng viên phụ trách (ID: #${gradingDetail.reviewedBy})` : 'Giảng viên chấm bài'}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginLeft: 8 }}>
                    • Hệ thống đào tạo Anh ngữ EnglishHub
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                  {gradingDetail?.gradedAt ? new Date(gradingDetail.gradedAt).toLocaleDateString('vi-VN') : '--'}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: 'var(--on-surface)', fontStyle: 'italic' }}>
                {gradingDetail?.finalFeedback ? (
                  `"${gradingDetail.finalFeedback}"`
                ) : gradingDetail?.aiFeedback ? (
                  `"${gradingDetail.aiFeedback}"`
                ) : aiSuggestion?.aiFeedback ? (
                  `"${aiSuggestion.aiFeedback}"`
                ) : (
                  <span style={{ color: 'var(--on-surface-variant)', fontStyle: 'normal' }}>
                    Chưa có nhận xét bằng văn bản từ giảng viên cho bài nộp này.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Inquiry / Student Question Form */}
          <div className="inquiry-form-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={18} className="text-primary" />
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)' }}>
                {t('studentResult.askTeacherTitle')}
              </h4>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              {t('studentResult.askTeacherSubtitle')}
            </p>

            <form onSubmit={handleSendInquiry}>
              <textarea
                className="inquiry-textarea"
                placeholder={t('studentResult.askTeacherPlaceholder')}
                value={inquiryText}
                onChange={(e) => setInquiryText(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!inquiryText.trim()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Send size={14} />
                  {t('studentResult.btnSendQuestion')}
                </button>
              </div>
            </form>

            {inquirySent && (
              <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} />
                <span>{t('studentResult.questionSentSuccess')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubmissionResult;
