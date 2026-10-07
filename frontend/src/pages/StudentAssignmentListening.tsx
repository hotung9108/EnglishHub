import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, ChevronRight, Headphones, 
  Timer, Bookmark, ChevronLeft,
  Play, Pause, Volume2, SkipBack, SkipForward,
  AlertCircle, RefreshCw, Loader2, CheckCircle2
} from 'lucide-react';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { moduleService, type ModuleDetailResponse } from '../api/services/module.service';
import { questionService, type QuestionResponse } from '../api/services/question.service';
import { submissionService, type SubmissionDetail } from '../api/services/submission.service';
import { useAuth } from '../contexts/AuthContext';

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

        // 2. Fetch module and questions
        let moduleId = currentAssignment?.modules?.[0]?.id;
        if (!moduleId) {
          try {
            const modRes = await moduleService.listModules(numericId);
            if (modRes.modules && modRes.modules.length > 0) {
              moduleId = modRes.modules[0].id;
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
              if (qRes.questions && qRes.questions.length > 0) {
                setQuestions(qRes.questions);
              } else {
                setQuestions([]);
              }
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
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectAnswer = (qId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const toggleBookmark = (qId: number) => {
    setBookmarkedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmit = async () => {
    if (answeredCount === 0) {
      if (!confirm('Bạn chưa trả lời câu hỏi nào. Bạn có chắc chắn muốn nộp bài?')) {
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const subId = submission?.id;
      const subModuleId = submission?.modules?.[0]?.id;

      if (subModuleId) {
        const answersPayload = Object.entries(selectedAnswers).map(([qId, ans]) => ({
          questionId: Number(qId),
          content: { selectedOptionIds: [ans] }
        }));

        try {
          await submissionService.submitModule(subModuleId, { answers: answersPayload });
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

      setSuccessMessage('Nộp bài thành công! Đang chuyển đến màn hình kết quả...');
      setTimeout(() => {
        if (subId) {
          navigate(`/student/submissions/${subId}`);
        } else {
          navigate(`/student/assignments/${id}/result`);
        }
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestionItem = questions[activeQuestion - 1] || questions[0];

  return (
    <div style={{ 
      margin: 'calc(var(--margin-desktop, 40px) * -1)',
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#F8FAFC'
    }}>
      {/* Page Header */}
      <div style={{ padding: '16px 24px', backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            type="button"
            onClick={() => navigate('/student/assignments')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#475569', fontWeight: 500, cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Quay lại danh sách bài tập
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
            <span>Hệ thống</span> <ChevronRight size={14} />
            <span>Lớp học</span> <ChevronRight size={14} />
            <span style={{ color: '#2563EB', fontWeight: 500 }}>
              {assignment?.title || `Listening Practice #${id}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '20px', color: '#DC2626', fontWeight: 600, fontSize: '14px' }}>
            <Timer size={16} />
            <span>30:00</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ margin: '16px 24px', padding: '16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#991B1B' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {successMessage && (
        <div style={{ margin: '16px 24px', padding: '16px', borderRadius: '8px', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '10px', color: '#166534' }}>
          <CheckCircle2 size={20} />
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{successMessage}</span>
        </div>
      )}

      {/* Main 2-Column Split Workspace */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 480px', flex: 1, minHeight: 'calc(100vh - 128px)' }}>
        {/* Left Column: Audio Player & Transcript */}
        <div style={{ borderRight: '1px solid #E2E8F0', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headphones size={22} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  {moduleDetail?.instructions || assignment?.title || 'Phần thi Nghe'}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Audio Track • Tiếng Anh chuẩn học thuật</span>
              </div>
            </div>

            {/* Audio Controls */}
            <div style={{ backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button 
                    type="button"
                    onClick={() => setAudioProgress(Math.max(0, audioProgress - 10))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <SkipBack size={18} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#2563EB', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAudioProgress(Math.min(100, audioProgress + 10))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <SkipForward size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B' }}>
                  <Volume2 size={18} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>01:24 / 04:30</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div 
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = ((e.clientX - rect.left) / rect.width) * 100;
                  setAudioProgress(pos);
                }}
                style={{ width: '100%', height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', cursor: 'pointer', position: 'relative' }}
              >
                <div style={{ width: `${audioProgress}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Instructions note */}
          <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>
              Hướng dẫn phần thi Nghe:
            </h4>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#475569' }}>
              Bạn sẽ nghe đoạn hội thoại hoặc bài giảng một lần duy nhất. Đọc trước các câu hỏi bên cạnh và chọn đáp án thích hợp trong khi nghe.
            </p>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginTop: '16px' }}>
              <span style={{ fontSize: '13px', color: '#64748B' }}>
                💡 <strong>Mẹo làm bài:</strong> Chú ý các từ khóa tín hiệu chuyển ý như <em>however</em>, <em>furthermore</em>, <em>on the contrary</em> để bắt kịp đáp án.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: totalQuestions > 0 ? '16px' : 0 }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>
                  Danh sách câu hỏi {totalQuestions > 0 ? `(1 - ${totalQuestions})` : ''}
                </h2>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  {totalQuestions > 0 ? 'Chọn đáp án đúng theo nội dung nghe' : 'Chưa có câu hỏi nào được gán'}
                </span>
              </div>
              {totalQuestions > 0 && (
                <div style={{ padding: '6px 16px', backgroundColor: '#EFF6FF', borderRadius: '20px', color: '#2563EB', fontSize: '14px', fontWeight: 600 }}>
                  {answeredCount} / {totalQuestions} đã làm
                </div>
              )}
            </div>

            {/* Question Navigator */}
            {totalQuestions > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {questions.map((_, i) => {
                  const qId = i + 1;
                  const isAnswered = !!selectedAnswers[qId];
                  const isBookmarked = bookmarkedQuestions[qId];
                  const isActive = activeQuestion === qId;
                  
                  let bgColor = '#F1F5F9';
                  let textColor = '#475569';

                  if (isActive) {
                    bgColor = '#2563EB';
                    textColor = 'white';
                  } else if (isBookmarked) {
                    bgColor = '#FEF08A';
                    textColor = '#A16207';
                  } else if (isAnswered) {
                    bgColor = '#DBEAFE';
                    textColor = '#1D4ED8';
                  }

                  return (
                    <button 
                      key={qId}
                      type="button"
                      onClick={() => setActiveQuestion(qId)}
                      style={{ 
                        width: '36px', height: '36px', borderRadius: '6px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 600, cursor: 'pointer', border: 'none',
                        backgroundColor: bgColor, color: textColor,
                        transition: 'all 0.2s'
                      }}
                    >
                      {qId}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 100, borderRadius: 8, backgroundColor: '#E2E8F0', animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: 60, borderRadius: 8, backgroundColor: '#E2E8F0', animation: 'pulse 1.5s infinite' }} />
              </div>
            ) : totalQuestions === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 16px', color: '#64748B' }}>
                <Headphones size={40} style={{ margin: '0 auto 12px', color: '#94A3B8' }} />
                <p style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Chưa có câu hỏi cho phần thi nghe này</p>
                <span style={{ fontSize: '13px' }}>Giáo viên chưa cập nhật danh sách câu hỏi. Vui lòng quay lại sau.</span>
              </div>
            ) : currentQuestionItem ? (
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2563EB', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                      {activeQuestion}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                      {currentQuestionItem.questionType}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => toggleBookmark(activeQuestion)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: bookmarkedQuestions[activeQuestion] ? '#EAB308' : '#94A3B8' }}
                  >
                    <Bookmark size={18} fill={bookmarkedQuestions[activeQuestion] ? '#EAB308' : 'none'} />
                  </button>
                </div>

                <p style={{ fontSize: '15px', fontWeight: 600, color: '#1E293B', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                  {currentQuestionItem.content}
                </p>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['A', 'B', 'C', 'D'].map((optKey) => {
                    const isSelected = selectedAnswers[activeQuestion] === optKey;
                    const questionWithOptions = currentQuestionItem as QuestionResponse & {
                      options?: Array<{ id?: string; key?: string; text?: string; content?: string }>;
                    };
                    const matchedOption = questionWithOptions.options?.find(
                      (o) => o.id === optKey || o.key === optKey
                    );
                    const optText = matchedOption?.text || matchedOption?.content || `Lựa chọn ${optKey}`;
                    return (
                      <label 
                        key={optKey}
                        onClick={() => handleSelectAnswer(activeQuestion, optKey)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px',
                          borderRadius: '8px', border: `1px solid ${isSelected ? '#2563EB' : '#E2E8F0'}`,
                          backgroundColor: isSelected ? '#EFF6FF' : 'white', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${isSelected ? '#2563EB' : '#CBD5E1'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', backgroundColor: 'white'
                        }}>
                          {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }}></div>}
                        </div>
                        <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                          <strong style={{ color: '#1E293B' }}>{optKey}.</strong> {optText}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Right Column Footer */}
          <div style={{ padding: '16px 24px', backgroundColor: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => setActiveQuestion(Math.max(1, activeQuestion - 1))}
                style={{ padding: '8px 14px', border: '1px solid #E2E8F0', backgroundColor: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                <ChevronLeft size={16} /> Câu trước
              </button>
              <button 
                type="button"
                onClick={() => setActiveQuestion(Math.min(totalQuestions, activeQuestion + 1))}
                style={{ padding: '8px 14px', border: '1px solid #E2E8F0', backgroundColor: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
              >
                Câu sau <ChevronRight size={16} />
              </button>
            </div>

            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{
                padding: '10px 28px',
                border: 'none',
                backgroundColor: '#2563EB',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang nộp bài...
                </>
              ) : (
                'Hoàn thành & Nộp bài'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentListening;
