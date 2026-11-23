import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Edit3,
  BookOpen,
  Headphones,
  Mic,
  FileText,
  Play
} from 'lucide-react';
import { Button, ConfirmModal } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import {
  submissionService,
  type SubmissionListItem,
  getRemainingAttempts,
  findInProgressAttempt,
  isSubmissionGraded,
  getSubmissionFinalScore
} from '../api/services/submission.service';
import { ExamStepper } from '../components/assignments/ExamStepper';
import {
  getSkillRoute,
  getNextIncompleteModule,
  getSkillLabel,
  resolveEffectiveModules,
  normalizeSkill,
  isAllModulesCompleted
} from '../utils/examStepper.utils';
import { notifyAssignmentSubmitted } from '../utils/assignmentEvents.utils';
import '../styles/student-overview.css';

interface AttemptRecord {
  id: number;
  attemptNumber: number;
  submittedAt: string;
  score: number | null;
  maxScore: number;
  score10: string;
  status: 'graded' | 'pending' | 'in_progress';
  isBest: boolean;
}

const StudentAssignmentOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [attemptsUsed, setAttemptsUsed] = useState<number | null>(null);
  const [inProgressSub, setInProgressSub] = useState<SubmissionListItem | null>(null);
  const [latestCompletedSub, setLatestCompletedSub] = useState<SubmissionListItem | null>(null);

  const numericAssignmentId = useMemo(() => {
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
      setAttemptsUsed(null);
      setAttempts([]);
      setInProgressSub(null);
      setLatestCompletedSub(null);
      try {
        // Fetch assignment detail and student attempts in parallel
        const [assignmentRes, subRes] = await Promise.allSettled([
          assignmentService.getAssignment(numericAssignmentId),
          user?.id
            ? submissionService.listSubmissions({
                assignmentId: numericAssignmentId,
                studentId: user.id,
                limit: 20
              })
            : Promise.reject('No user')
        ]);

        let assignmentData: AssignmentDetail;
        if (assignmentRes.status === 'fulfilled') {
          assignmentData = assignmentRes.value;
        } else {
          // Fallback default info if ID is mock string like HW-01
          assignmentData = {
            id: numericAssignmentId,
            title: `Bài tập ${id || 'HW-01'}`,
            status: 'PUBLISHED',
            modules: [{ id: 1, skill: 'WRITING' }]
          };
        }
        if (isMounted) setAssignment(assignmentData);

        if (subRes.status === 'fulfilled') {
          const list = subRes.value.data || [];
          const activeAttempt = findInProgressAttempt(list);
          const completedAttemptsList = list
            .filter((item) => item.status === 'SUBMITTED' || item.status === 'GRADED')
            .sort((a, b) => b.attemptNumber - a.attemptNumber);
          const latestCompleted = completedAttemptsList[0] || null;

          if (isMounted) {
            setAttemptsUsed(subRes.value.pagination.total);
            setInProgressSub(activeAttempt);
            setLatestCompletedSub(latestCompleted);
          }

          // Find best score
          let maxVal = -1;
          list.forEach((item) => {
            const sc = getSubmissionFinalScore(item);
            if (sc !== null && sc > maxVal) maxVal = sc;
          });

          const records: AttemptRecord[] = list.map((item) => {
            const rawScore = getSubmissionFinalScore(item);
            const isGraded = isSubmissionGraded(item) || rawScore !== null;
            const s10 = rawScore !== null ? (rawScore > 10 ? (rawScore / 10).toFixed(1) : Number(rawScore).toFixed(1)) : '--';
            return {
              id: item.id,
              attemptNumber: item.attemptNumber,
              submittedAt: item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : 'Đang thực hiện',
              score: rawScore,
              maxScore: 10,
              score10: s10,
              status: isGraded ? 'graded' : item.status === 'SUBMITTED' ? 'pending' : 'in_progress',
              isBest: rawScore !== null && rawScore === maxVal && maxVal >= 0,
            };
          });

          if (isMounted) setAttempts(records);
        } else if (isMounted) {
          setError('Không thể tải số lượt làm bài. Vui lòng thử lại.');
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : 'Không thể tải thông tin bài tập.';
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
  }, [numericAssignmentId, id, user?.id, reloadKey]);

  const isUnlimited = assignment?.maxSubmissions === null;
  const maxSubmissions = assignment?.maxSubmissions !== undefined && assignment?.maxSubmissions !== null
    ? assignment.maxSubmissions
    : 1;
  const remainingAttempts = attemptsUsed === null
    ? null
    : getRemainingAttempts(isUnlimited ? null : maxSubmissions, attemptsUsed);
  const canStartNewAttempt = attemptsUsed !== null && (isUnlimited || (remainingAttempts ?? 0) > 0);
  const nextAttemptNumber = attemptsUsed === null ? null : attemptsUsed + 1;

  const displaySub = inProgressSub || latestCompletedSub;
  const hasActiveAttempt = Boolean(inProgressSub);

  const effectiveModules = useMemo(
    () => resolveEffectiveModules(assignment?.modules, displaySub?.modules),
    [assignment?.modules, displaySub?.modules]
  );

  const skillsListText = useMemo(() => {
    if (!effectiveModules || effectiveModules.length === 0) {
      return 'Writing';
    }
    return effectiveModules
      .map((m) => {
        if (!m.skill) return '';
        const s = m.skill.toUpperCase();
        if (s === 'WRITING') return 'Writing';
        if (s === 'SPEAKING') return 'Speaking';
        if (s === 'READING') return 'Reading';
        if (s === 'LISTENING') return 'Listening';
        return m.skill;
      })
      .filter(Boolean)
      .join(', ');
  }, [effectiveModules]);

  const handleStartSkill = async (targetSkill: string, targetIndex?: number) => {
    if (isStarting) return;
    if (!inProgressSub && !canStartNewAttempt) return;
    if (assignment?.status === 'CLOSED') {
      const subMod = inProgressSub?.modules?.find(
        (sm) => sm.skill?.toUpperCase() === targetSkill.toUpperCase()
      );
      if (!subMod || (subMod.status !== 'SUBMITTED' && subMod.status !== 'GRADED')) {
        setError('Bài tập này đã được giáo viên đóng. Không thể làm bài hoặc nộp bài.');
        return;
      }
    }

    const targetModule = (targetIndex !== undefined && effectiveModules[targetIndex])
      ? effectiveModules[targetIndex]
      : effectiveModules.find(m => normalizeSkill(m.skill) === normalizeSkill(targetSkill)) || effectiveModules[0];
    const targetModuleId = targetModule?.id;

    setIsStarting(true);
    setError(null);
    try {
      let submissionId = inProgressSub?.id;
      if (!submissionId) {
        try {
          const startRes = await submissionService.startAttempt(numericAssignmentId);
          submissionId = startRes.id;
        } catch (startErr: unknown) {
          console.error('startAttempt error:', startErr);
          const errData = startErr as { response?: { data?: { message?: string } }; message?: string };
          const msg = errData?.response?.data?.message || errData?.message || 'Không thể bắt đầu làm bài. Bài tập có thể đã đóng.';
          setError(msg);
          setIsStarting(false);
          return;
        }
      }

      const idParam = id || '1';
      const isTargetCompleted = inProgressSub?.modules?.some(
        (sm) => (targetModuleId ? sm.moduleId === targetModuleId || sm.id === targetModuleId : normalizeSkill(sm.skill) === normalizeSkill(targetSkill)) &&
                (sm.status === 'SUBMITTED' || sm.status === 'GRADED')
      );
      const baseRoute = getSkillRoute(targetSkill, idParam, submissionId, targetModuleId);
      const targetRoute = isTargetCompleted ? `${baseRoute}&mode=review` : baseRoute;
      navigate(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo bài làm. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const [renderTimestamp] = useState(() => Date.now());
  const isPastDeadline = Boolean(
    assignment?.closeAt && new Date(assignment.closeAt).getTime() < renderTimestamp
  );
  const isClosedOrExpired = assignment?.status === 'CLOSED' || isPastDeadline;

  const handleOpenFinalSubmitModal = () => {
    if (!inProgressSub) return;
    if (isClosedOrExpired) {
      setError(
        assignment?.status === 'CLOSED'
          ? (isVi ? 'Bài tập này đã được giáo viên đóng. Không thể nộp toàn bộ bài tập.' : 'This assignment is closed.')
          : (isVi ? 'Bài tập này đã hết hạn nộp bài. Không thể nộp bài tập.' : 'This assignment submission deadline has passed.')
      );
      return;
    }
    setShowFinalSubmitModal(true);
  };

  const handleConfirmFinalSubmit = async () => {
    if (!inProgressSub) return;
    setIsStarting(true);
    try {
      await submissionService.submitSubmission(inProgressSub.id);
      try {
        localStorage.removeItem(`eh_draft_writing_${numericAssignmentId}`);
        localStorage.removeItem(`eh_last_writing_${numericAssignmentId}`);
        if (assignment?.modules) {
          for (const m of assignment.modules) {
            localStorage.removeItem(`eh_draft_quiz_${numericAssignmentId}_${m.id}`);
          }
        }
      } catch { /* ignore */ }
      notifyAssignmentSubmitted();
      setShowFinalSubmitModal(false);
      navigate(`/student/submissions/${inProgressSub.id}`);
    } catch (err: unknown) {
      console.warn('Failed to finalize submission:', err);
      const errData = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errData?.response?.data?.message || errData?.message || (isVi ? 'Không thể hoàn tất nộp bài.' : 'Failed to finalize submission.');
      setError(msg);
      setShowFinalSubmitModal(false);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartAttempt = async () => {
    if (isStarting) return;
    if (isClosedOrExpired) {
      setError(
        assignment?.status === 'CLOSED'
          ? (isVi ? 'Bài tập này đã được giáo viên đóng. Không thể làm bài hoặc nộp bài.' : 'This assignment is closed.')
          : (isVi ? 'Bài tập này đã hết hạn nộp bài. Không thể bắt đầu lượt làm mới.' : 'This assignment submission deadline has passed.')
      );
      return;
    }
    if (!inProgressSub && !canStartNewAttempt) return;
    setIsStarting(true);
    setError(null);
    try {
      let submissionId = inProgressSub?.id;
      let activeModules: Array<{ id: number; moduleId: number; skill?: string | null; status: string }> | undefined = inProgressSub?.modules;

      if (!submissionId) {
        try {
          const startRes = await submissionService.startAttempt(numericAssignmentId);
          submissionId = startRes.id;
          activeModules = startRes.modules;
        } catch (startErr: unknown) {
          console.error('startAttempt error:', startErr);
          const errData = startErr as { response?: { data?: { message?: string } }; message?: string };
          const msg = errData?.response?.data?.message || errData?.message || 'Không thể bắt đầu làm bài. Bài tập có thể đã đóng.';
          setError(msg);
          setIsStarting(false);
          return;
        }
      }

      // Find first uncompleted module or first module in assignment sequence
      const resolvedMods = resolveEffectiveModules(assignment?.modules, activeModules);
      const nextMod = getNextIncompleteModule(resolvedMods, activeModules) || resolvedMods[0];
      const targetSkill = nextMod?.skill || 'WRITING';
      const idParam = id || '1';
      const targetRoute = getSkillRoute(targetSkill, idParam, submissionId, nextMod?.id);
      navigate(targetRoute);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo bài làm. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const nextIncompleteModule = getNextIncompleteModule(effectiveModules, inProgressSub?.modules);
  const nextSkillName = nextIncompleteModule ? getSkillLabel(nextIncompleteModule.skill) : '';

  const isAllSubModulesCompleted = Boolean(
    inProgressSub && isAllModulesCompleted(effectiveModules, inProgressSub.modules)
  );

  const bestAttempt = attempts.find((a) => a.isBest);

  return (
    <div className="overview-container">
      {/* Breadcrumbs */}
      <div className="overview-breadcrumbs">
        <button 
          className="overview-back-btn" 
          onClick={() => navigate('/student/assignments')}
          type="button"
        >
          <ArrowLeft size={14} />
          <span>{t('studentSpeaking.backToList') || 'Quay lại danh sách bài tập'}</span>
        </button>
        <span className="overview-breadcrumb-sep">/</span>
        <span className="overview-breadcrumb-current">
          {assignment?.title || (id ? `Bài tập #${id}` : 'Tổng quan bài tập')}
        </span>
      </div>

      {error && (
        <div className="std-error-banner">
          <div className="std-error-msg">
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

      {/* Main Card */}
      <div className="overview-card">
        {/* Header */}
        <div className="overview-header">
          <div className="overview-header-main">
            <h1 className="overview-title">
              {isLoading ? 'Đang tải bài tập...' : (assignment?.title || `Bài tập #${numericAssignmentId}`)}
            </h1>
            <div className="overview-meta-line">
              <span className="overview-meta-item">
                Mã bài tập: <strong>#{numericAssignmentId}</strong>
              </span>
              <span className="overview-meta-divider">•</span>
              <span className="overview-meta-item">
                Kỹ năng: <strong>{skillsListText}</strong>
              </span>
              <span className="overview-meta-divider">•</span>
              <span className={`overview-meta-status ${assignment?.status === 'PUBLISHED' ? 'open' : 'closed'}`}>
                {assignment?.status === 'PUBLISHED' ? 'Đang mở nhận bài' : 'Đã đóng'}
              </span>
            </div>
          </div>

          <div className="overview-header-score">
            <span className="overview-best-score-label">Điểm cao nhất</span>
            <div className="overview-best-score-val">
              {bestAttempt ? (
                <>
                  {bestAttempt.score10}
                  <span className="overview-best-score-scale">/10</span>
                </>
              ) : (
                <span className="overview-best-score-none">Chưa có điểm</span>
              )}
            </div>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="overview-rules-grid">
          <div className="overview-rule-card">
            <div className="overview-rule-label">Thời hạn nộp</div>
            <div className="overview-rule-val">
              {assignment?.status === 'CLOSED'
                ? 'Đã đóng'
                : isPastDeadline
                  ? `Đã hết hạn (${assignment?.closeAt ? new Date(assignment.closeAt).toLocaleDateString('vi-VN') : ''})`
                  : assignment?.closeAt
                    ? new Date(assignment.closeAt).toLocaleDateString('vi-VN')
                    : 'Mở trực tuyến'}
            </div>
          </div>

          <div className="overview-rule-card">
            <div className="overview-rule-label">Số lượt nộp cho phép</div>
            <div className="overview-rule-val">
              {isUnlimited ? 'Không giới hạn' : `Tối đa ${maxSubmissions} lần`}
              {attemptsUsed !== null && ` (Đã dùng ${attemptsUsed} lượt)`}
            </div>
          </div>
        </div>

        {/* Multi-skill Sections / Modules List */}
        {effectiveModules.length > 1 && (
          <div className="overview-sections-container">
            <div className="overview-sections-header">
              <h2 className="overview-section-title">
                Tiến trình các phần thi ({effectiveModules.length} kỹ năng)
              </h2>
              <span className="overview-section-subtitle">
                Học viên hoàn thành lần lượt từng kỹ năng theo thứ tự trước khi nộp toàn bộ bài tập
              </span>
            </div>

            <ExamStepper
              modules={effectiveModules}
              submissionModules={displaySub?.modules}
              assignmentId={numericAssignmentId}
              submissionId={displaySub?.id}
              hasActiveAttempt={hasActiveAttempt}
              canReviewCompleted={!hasActiveAttempt && Boolean(displaySub?.id || bestAttempt?.id)}
              variant="overview"
              onSelectModule={(skill, step) => {
                if (step.isCompleted) {
                  if (!hasActiveAttempt) {
                    const targetSubId = displaySub?.id || bestAttempt?.id;
                    if (targetSubId) {
                      navigate(`/student/submissions/${targetSubId}`);
                    }
                  } else {
                    void handleStartSkill(skill, step.index);
                  }
                  return;
                }
                void handleStartSkill(skill, step.index);
              }}
              disabled={isStarting}
              isClosed={isClosedOrExpired}
            />
          </div>
        )}

        {/* Pre-Submit Review Dashboard (UC020 / AD20) */}
        {hasActiveAttempt && inProgressSub && (
          <div className="overview-instructions-box" style={{ borderColor: 'var(--primary)', borderWidth: '1.5px', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(27, 77, 62, 0.1)', color: 'var(--primary)' }}>
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--on-surface)' }}>
                    {isVi ? 'Kiểm tra và xem lại bài làm trước khi nộp' : 'Review Answers Before Submission'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {isVi
                      ? 'Rà soát danh sách câu trả lời của các kỹ năng. Bạn có thể nhấn "Sửa câu trả lời" để chỉnh sửa trước khi nộp chính thức.'
                      : 'Review answers across all skills. You can click "Edit answers" to adjust before final submission.'}
                  </p>
                </div>
              </div>
              <span className={`badge ${isAllSubModulesCompleted ? 'badge-primary' : 'badge-warning'}`} style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 600 }}>
                {isAllSubModulesCompleted
                  ? (isVi ? 'Đã hoàn thành các phần thi' : 'All skills completed')
                  : (isVi ? 'Còn phần thi chưa hoàn thành' : 'Some skills incomplete')}
              </span>
            </div>

            {/* Incomplete Warning Banner (UC020 Dòng phụ) */}
            {!isAllSubModulesCompleted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e', fontSize: '13px', marginBottom: '16px' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  {isVi
                    ? 'Cảnh báo: Bạn vẫn còn phần thi chưa hoàn thành hoặc câu hỏi đang bị bỏ trống. Bạn có thể bấm "Làm bài ngay" hoặc "Sửa câu trả lời" để hoàn thiện trước khi nộp.'
                    : 'Warning: Some skills or questions remain unanswered. You can click "Start" or "Edit answers" before final submission.'}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '13px', marginBottom: '16px' }}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>
                  {isVi
                    ? 'Bạn đã hoàn thành câu trả lời cho tất cả các phần thi. Vui lòng rà soát lại lần cuối trước khi bấm "Xác nhận nộp toàn bộ bài tập" bên dưới.'
                    : 'All skills have been answered. Please perform a final review before clicking "Final Submit" below.'}
                </span>
              </div>
            )}

            {/* Module Breakdown Grid */}
            <div className="overview-sections-grid" style={{ marginBottom: '8px' }}>
              {effectiveModules.map((mod, idx) => {
                const subMod = inProgressSub?.modules?.find(
                  (sm) => sm.moduleId === mod.id || (sm.skill && normalizeSkill(sm.skill) === normalizeSkill(mod.skill))
                );
                const isCompleted = subMod?.status === 'SUBMITTED' || subMod?.status === 'GRADED';
                const skillCode = normalizeSkill(mod.skill);

                const SkillIcon = skillCode === 'reading' ? BookOpen : skillCode === 'listening' ? Headphones : skillCode === 'speaking' ? Mic : FileText;

                return (
                  <div key={mod.id || idx} className="overview-module-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'var(--surface-container-low)', color: 'var(--primary)' }}>
                        <SkillIcon size={18} />
                      </div>
                      <div className="overview-module-info">
                        <div className="overview-module-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{getSkillLabel(mod.skill)}</span>
                          {isCompleted ? (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
                              Đã làm
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9a3412', backgroundColor: '#ffedd5', padding: '2px 6px', borderRadius: '4px' }}>
                              Chưa nộp
                            </span>
                          )}
                        </div>
                        <div className="overview-module-status" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {isCompleted
                            ? (isVi ? 'Đã hoàn thành nội dung phần thi' : 'Module completed')
                            : (isVi ? 'Đang chờ làm bài / chưa hoàn tất' : 'Pending completion')}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Button
                        variant={isCompleted ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleStartSkill(mod.skill, idx)}
                        icon={isCompleted ? Edit3 : Play}
                        disabled={isStarting}
                      >
                        {isCompleted ? (isVi ? 'Sửa câu trả lời' : 'Edit answers') : (isVi ? 'Làm bài ngay' : 'Start now')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attempts Table */}
        <div className="overview-attempts-section">
          <div className="overview-attempts-header">
            <h3 className="overview-attempts-title">
              Lịch sử các lần làm bài
            </h3>
            <span className="overview-attempts-count">
              Đã làm {attempts.length} lần
            </span>
          </div>

          <div className="overview-table-wrapper">
            <table className="overview-table">
              <thead>
                <tr>
                  <th>Lần nộp</th>
                  <th>Thời gian nộp</th>
                  <th>Điểm số (Thang 10)</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="overview-table-empty">
                      Đang tải lịch sử các lần nộp bài...
                    </td>
                  </tr>
                ) : attempts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="overview-table-empty">
                      Chưa có lần nộp bài nào. Nhấn &quot;Bắt đầu làm bài&quot; bên dưới để làm lần đầu tiên.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att) => (
                    <tr key={att.id}>
                      <td className="overview-cell-attempt">
                        <span>Lần {att.attemptNumber}</span>
                        {att.isBest && (
                          <span className="overview-best-indicator">
                            (Điểm cao nhất)
                          </span>
                        )}
                      </td>
                      <td className="overview-cell-time">{att.submittedAt}</td>
                      <td className="overview-cell-score">
                        {att.score10 !== '--' ? `${att.score10} / 10` : '--'}
                      </td>
                      <td>
                        <span className={`overview-status-text ${att.status}`}>
                          {att.status === 'graded' 
                            ? 'Đã có điểm' 
                            : att.status === 'in_progress' 
                              ? (assignment?.status === 'CLOSED' ? 'Chưa nộp (Đã đóng)' : 'Đang làm') 
                              : 'Chờ chấm điểm'}
                        </span>
                      </td>
                      <td className="text-right">
                        {att.status === 'graded' || att.status === 'pending' ? (
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/student/submissions/${att.id}`)}
                          >
                            Xem kết quả bài nộp
                          </Button>
                        ) : assignment?.status === 'CLOSED' ? (
                          <Button 
                            variant="secondary"
                            size="sm"
                            disabled
                            title="Bài tập đã đóng, không thể tiếp tục làm bài"
                          >
                            Đã đóng
                          </Button>
                        ) : (
                          <Button 
                            variant="primary"
                            size="sm"
                            onClick={handleStartAttempt}
                          >
                            Tiếp tục làm bài
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Start Attempt */}
        <div className="overview-cta-box">
          <div className="overview-cta-info">
            <div className="overview-cta-title">
              {assignment?.status === 'CLOSED'
                ? 'Bài tập này đã được giáo viên đóng. Không tiếp nhận bài làm hoặc nộp bài mới.'
                : inProgressSub
                ? isAllSubModulesCompleted
                  ? `Bạn đã hoàn thành tất cả các phần thi (Lần ${inProgressSub.attemptNumber}). Bạn có thể nộp toàn bộ bài tập ngay bây giờ.`
                  : `Bạn đang làm bài (Lần ${inProgressSub.attemptNumber}). Bạn có thể tiếp tục hoàn thành.`
                : attemptsUsed === null
                  ? (isLoading ? 'Đang tải số lượt làm bài...' : 'Chưa xác định được số lượt làm bài.')
                  : isUnlimited
                    ? `Bắt đầu làm bài (Lần ${nextAttemptNumber}).`
                    : canStartNewAttempt
                      ? `Bạn còn ${remainingAttempts} lượt nộp bài nữa cho đề thi này.`
                      : 'Bạn đã sử dụng hết số lần nộp bài cho phép.'}
            </div>
            <div className="overview-cta-desc">
              {assignment?.status === 'CLOSED'
                ? 'Vui lòng liên hệ giảng viên nếu bạn cần gia hạn thời gian nộp bài.'
                : 'Điểm số tổng kết môn học sẽ ghi nhận lần làm bài có kết quả tốt nhất của bạn.'}
            </div>
          </div>

          <div className="overview-cta-action">
            {isClosedOrExpired ? (
              <button 
                className="overview-cta-btn" 
                onClick={() => {
                  const completedAttempts = attempts.filter((a) => a.status !== 'in_progress');
                  const targetSub = bestAttempt ? bestAttempt.id : completedAttempts[0]?.id;
                  if (targetSub) {
                    navigate(`/student/submissions/${targetSub}`);
                  } else {
                    navigate(`/student/assignments/${id || 'HW-01'}/result`);
                  }
                }}
                disabled={attempts.filter((a) => a.status !== 'in_progress').length === 0}
                type="button"
                title={
                  attempts.filter((a) => a.status !== 'in_progress').length === 0
                    ? (assignment?.status === 'CLOSED'
                      ? (isVi ? 'Bài tập đã được giáo viên đóng' : 'Assignment has been closed')
                      : (isVi ? 'Bài tập đã hết hạn nộp bài' : 'Assignment deadline has passed'))
                    : (isVi ? 'Xem kết quả bài nộp' : 'View Submission Results')
                }
              >
                {attempts.filter((a) => a.status !== 'in_progress').length > 0
                  ? (isVi ? 'Xem kết quả bài nộp' : 'View Submission Results')
                  : (assignment?.status === 'CLOSED'
                    ? (isVi ? 'Bài tập đã đóng (Không thể làm bài)' : 'Assignment Closed')
                    : (isVi ? 'Đã hết hạn nộp bài' : 'Deadline Passed'))}
              </button>
            ) : inProgressSub ? (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="overview-cta-btn" 
                  onClick={handleOpenFinalSubmitModal}
                  disabled={isStarting}
                  type="button"
                >
                  {isStarting
                    ? (isVi ? 'Đang nộp toàn bộ bài tập...' : 'Finalizing...')
                    : (isVi
                      ? `Xác nhận Nộp toàn bộ bài tập (Lần ${inProgressSub.attemptNumber})`
                      : `Final Submit (Attempt ${inProgressSub.attemptNumber})`)}
                </button>
                {!isAllSubModulesCompleted && (
                  <Button 
                    variant="secondary"
                    onClick={handleStartAttempt}
                    disabled={isStarting}
                  >
                    {isVi ? `Tiếp tục làm bài (${nextSkillName || 'Phần tiếp'})` : 'Continue Test'}
                  </Button>
                )}
              </div>
            ) : canStartNewAttempt ? (
              <button 
                className="overview-cta-btn" 
                onClick={handleStartAttempt}
                disabled={isStarting}
                type="button"
              >
                {isStarting ? 'Đang khởi tạo bài làm...' : `Bắt đầu làm bài (Lần ${nextAttemptNumber})`}
              </button>
            ) : attemptsUsed !== null && (
              <button 
                className="overview-cta-btn" 
                onClick={() => {
                  const targetSub = bestAttempt ? bestAttempt.id : attempts[0]?.id;
                  if (targetSub) {
                    navigate(`/student/submissions/${targetSub}`);
                  } else {
                    navigate(`/student/assignments/${id || 'HW-01'}/result`);
                  }
                }}
                type="button"
              >
                Xem kết quả bài nộp tốt nhất
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Modal: Xác nhận nộp toàn bộ bài tập (UC021 / AD21) */}
      <ConfirmModal
        isOpen={showFinalSubmitModal}
        title={isVi ? 'Xác nhận nộp bài tập' : 'Confirm Assignment Submission'}
        message={
          isVi
            ? 'Bạn có chắc chắn muốn nộp toàn bộ bài tập? Sau khi xác nhận nộp, bạn sẽ không thể chỉnh sửa lại các câu trả lời. Hệ thống sẽ tiến hành đóng gói câu trả lời và bắt đầu quy trình đánh giá.'
            : 'Are you sure you want to finalize your submission? Once submitted, you cannot edit your answers. The system will seal your attempt and begin evaluation.'
        }
        confirmText={isVi ? 'Xác nhận nộp bài' : 'Confirm Submission'}
        cancelText={isVi ? 'Kiểm tra lại' : 'Review Again'}
        variant={!isAllSubModulesCompleted ? 'danger' : 'primary'}
        isLoading={isStarting}
        onConfirm={handleConfirmFinalSubmit}
        onCancel={() => setShowFinalSubmitModal(false)}
      />
    </div>
  );
};

export default StudentAssignmentOverview;
