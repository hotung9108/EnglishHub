import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, Headphones, 
  Timer, Bookmark, ChevronLeft,
  Play, Pause, Volume2, SkipBack, SkipForward,
  AlertCircle, RefreshCw, Lightbulb
} from 'lucide-react';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { questionService, extractMcqOptions, type QuestionResponse } from '../api/services/question.service';
import { submissionService, type SubmissionDetail, type SubmitModuleAnswerPayload } from '../api/services/submission.service';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';
import '../styles/student-exam.css';

const StudentAssignmentListening: React.FC = () => {
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
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(30);
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Record<number, boolean>>({});

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
        // 1. Fetch assignment
        let currentAssignment: AssignmentDetail | null = null;
        try {
          currentAssignment = await assignmentService.getAssignment(numericId);
          if (isMounted) setAssignment(currentAssignment);
        } catch {
          currentAssignment = {
            id: numericId,
            title: `Listening Practice #${id || '1'}`,
            status: 'PUBLISHED',
            modules: [{ id: 1, skill: 'LISTENING' }]
          };
          if (isMounted) setAssignment(currentAssignment);
        }

        // 2. Fetch listening module and questions
        const listeningMod = currentAssignment?.modules?.find((m) => m.skill?.toUpperCase() === 'LISTENING');
        let moduleId = listeningMod?.id;
        if (!moduleId) {
          try {
            const modRes = await moduleService.listModules(numericId);
            const mList = modRes.modules || modRes.data || [];
            const matched = mList.find((m) => m.skill?.toUpperCase() === 'LISTENING') || mList[0];
            if (matched) {
              moduleId = matched.id;
            }
          } catch {
            // Fallback
          }
        }

        if (moduleId) {
          try {
            const mod = await moduleService.getModule(moduleId);
            if (isMounted) setModuleDetail(mod);
          } catch {
            // Fallback
          }

          try {
            const qRes = await questionService.listQuestions(moduleId);
            if (isMounted) {
              const qList = qRes.questions || qRes.data || [];
              setQuestions(qList);
            }
          } catch {
            if (isMounted) setQuestions([]);
          }
        } else {
          if (isMounted) setQuestions([]);
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
            } else if (currentAssignment?.status === 'PUBLISHED') {
              const startRes = await submissionService.startAttempt(numericId);
              const sub = await submissionService.getSubmission(startRes.id);
              if (isMounted) setSubmission(sub);
            } else if (currentAssignment?.status === 'CLOSED') {
              if (isMounted) {
                setError('Bài tập này đã được giáo viên đóng. Học viên không thể làm bài hoặc nộp bài.');
              }
            }
          } catch {
            // Fallback
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
  }, [numericId, id, searchParams, user?.id, reloadKey]);

  const totalQuestions = questions.length;
  const answeredCount = useMemo(() => {
    return questions.filter((q, idx) => {
      const val = selectedAnswers[idx + 1] ?? selectedAnswers[q.id];
      return val !== undefined && val !== null && String(val).trim().length > 0;
    }).length;
  }, [questions, selectedAnswers]);

  const handleSelectAnswer = (qId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const toggleBookmark = (qId: number) => {
    setBookmarkedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmit = async () => {
    if (assignment?.status === 'CLOSED') {
      setError('Bài tập này đã được giáo viên đóng. Không thể nộp bài.');
      return;
    }
    if (answeredCount === 0) {
      if (!confirm('Bạn chưa trả lời câu hỏi nào. Bạn có chắc chắn muốn nộp bài?')) {
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const subId = submission?.id;
      const listeningSubMod = submission?.modules?.find((m) => m.skill?.toUpperCase() === 'LISTENING');
      const subModuleId = listeningSubMod?.id || submission?.modules?.[0]?.id;

      if (subModuleId) {
        const optionKeyToId: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };
        const answersPayload: SubmitModuleAnswerPayload[] = [];

        questions.forEach((q, idx) => {
          const qIndex = idx + 1;
          const chosenVal = selectedAnswers[qIndex] ?? selectedAnswers[q.id];
          if (chosenVal === undefined || chosenVal === null || !String(chosenVal).trim()) return;

          const qType = (q.questionType || '').toUpperCase();
          if (qType === 'SHORT_ANSWER') {
            answersPayload.push({
              questionId: q.id,
              content: { text: String(chosenVal).trim() },
            });
            return;
          }

          let optId: number;
          if (typeof chosenVal === 'number') {
            optId = chosenVal;
          } else {
            const upper = String(chosenVal).trim().toUpperCase();
            optId = optionKeyToId[upper] ?? parseInt(upper, 10);
            if (isNaN(optId) || optId < 1 || optId > 4) {
              optId = 1;
            }
          }

          answersPayload.push({
            questionId: q.id,
            content: { selectedOptionIds: [optId] },
          });
        });

        if (answersPayload.length > 0) {
          await submissionService.submitModule(subModuleId, { answers: answersPayload });
        }
      }

      // Check if all modules in this submission are now completed
      const otherModules = submission?.modules?.filter((m) => m.id !== subModuleId) || [];
      const allOthersDone = otherModules.length === 0 || otherModules.every((m) => m.status === 'SUBMITTED' || m.status === 'GRADED');

      if (subId && allOthersDone) {
        try {
          await submissionService.submitSubmission(subId);
        } catch (subErr) {
          console.warn('submitSubmission warning:', subErr);
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
        setSuccessMessage('Đã hoàn thành phần thi Listening! Đang quay lại trang tổng quan bài tập...');
        setTimeout(() => {
          navigate(`/student/assignments/${id}/overview`);
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestionItem = questions[activeQuestion - 1] || questions[0];

  return (
    <div className="exam-page">
      {/* Page Header */}
      <div className="exam-header">
        <div className="exam-header-left">
          <Button 
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/student/assignments')}
          >
            Quay lại danh sách bài tập
          </Button>
          
          <div className="exam-breadcrumbs">
            <span>Hệ thống</span> <ChevronRight size={14} />
            <span>Lớp học</span> <ChevronRight size={14} />
            <span className="exam-breadcrumbs-current">
              {assignment?.title || `Listening Practice #${id}`}
            </span>
          </div>
        </div>

        <div className="exam-header-right">
          <div className="exam-timer-badge">
            <Timer size={16} />
            <span>30:00</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="exam-alert-error">
          <div className="exam-alert-msg">
            <AlertCircle size={20} />
            <span>{error}</span>
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
              <div className="exam-audio-controls-row">
                <div className="exam-audio-btn-group">
                  <button 
                    type="button"
                    onClick={() => setAudioProgress(Math.max(0, audioProgress - 10))}
                    className="exam-audio-skip-btn"
                    aria-label="Tua lùi 10s"
                  >
                    <SkipBack size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="exam-audio-play-btn"
                    aria-label={isPlaying ? 'Tạm dừng' : 'Phát âm thanh'}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="exam-play-icon" />}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAudioProgress(Math.min(100, audioProgress + 10))}
                    className="exam-audio-skip-btn"
                    aria-label="Tua tới 10s"
                  >
                    <SkipForward size={18} />
                  </button>
                </div>

                <div className="exam-audio-time-info">
                  <Volume2 size={18} />
                  <span>01:24 / 04:30</span>
                </div>
              </div>

              {/* Progress Bar (width is dynamic runtime progress) */}
              <div 
                className="exam-audio-progress-bar"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = ((e.clientX - rect.left) / rect.width) * 100;
                  setAudioProgress(pos);
                }}
              >
                <div 
                  className="exam-audio-progress-fill" 
                  style={{ width: `${audioProgress}%` }} 
                />
              </div>
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
                  {answeredCount} / {totalQuestions} đã làm
                </div>
              )}
            </div>

            {/* Question Navigator */}
            {totalQuestions > 0 && (
              <div className="exam-nav-grid">
                {questions.map((q, i) => {
                  const qId = i + 1;
                  const rawAns = selectedAnswers[qId] ?? selectedAnswers[q.id];
                  const isAnswered = Boolean(rawAns !== undefined && rawAns !== null && String(rawAns).trim().length > 0);
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
            ) : currentQuestionItem ? (() => {
              const isShortAnswer = (currentQuestionItem.questionType || '').toUpperCase() === 'SHORT_ANSWER';
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
                      <Bookmark size={18} fill={bookmarkedQuestions[activeQuestion] ? '#EAB308' : 'none'} />
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
                        placeholder="Nhập câu trả lời ngắn của bạn tại đây..."
                        value={selectedAnswers[activeQuestion] ?? selectedAnswers[currentQuestionItem.id] ?? ''}
                        onChange={(e) => handleSelectAnswer(activeQuestion, e.target.value)}
                        autoComplete="off"
                      />
                    </div>
                  ) : (
                    /* Options */
                    <div className="exam-options-group">
                      {['A', 'B', 'C', 'D'].map((optKey, optIdx) => {
                        const isSelected = selectedAnswers[activeQuestion] === optKey;
                        const extracted = currentQuestionItem.correctAnswer ? extractMcqOptions(currentQuestionItem.correctAnswer) : null;
                        const questionWithOptions = currentQuestionItem as {
                          options?: Array<{ id?: string | number; key?: string; text?: string; content?: string }>;
                        };
                        const matchedOption = questionWithOptions.options?.find(
                          (o) => o.id === optKey || o.key === optKey || o.id === optIdx + 1
                        );
                        const optText = (extracted && extracted.options[optIdx]) || matchedOption?.text || matchedOption?.content || `Lựa chọn ${optKey}`;
                        return (
                          <label 
                            key={optKey}
                            onClick={() => handleSelectAnswer(activeQuestion, optKey)}
                            className={`exam-option-item ${isSelected ? 'is-selected' : ''}`}
                          >
                            <div className="exam-radio-indicator">
                              {isSelected && <div className="exam-radio-dot" />}
                            </div>
                            <div className="exam-option-content">
                              <strong className="exam-option-key">{optKey}.</strong> {optText}
                            </div>
                          </label>
                        );
                      })}
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
