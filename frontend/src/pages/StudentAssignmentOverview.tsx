import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/common';
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
  const { t } = useLanguage();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [inProgressSub, setInProgressSub] = useState<SubmissionListItem | null>(null);

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
      try {
        // 1. Fetch assignment detail
        let assignmentData: AssignmentDetail | null = null;
        try {
          assignmentData = await assignmentService.getAssignment(numericAssignmentId);
          if (isMounted) setAssignment(assignmentData);
        } catch {
          // Fallback default info if ID is mock string like HW-01
          assignmentData = {
            id: numericAssignmentId,
            title: `Bài tập ${id || 'HW-01'}`,
            status: 'PUBLISHED',
            modules: [{ id: 1, skill: 'WRITING' }]
          };
          if (isMounted) setAssignment(assignmentData);
        }

        // 2. Fetch student attempts
        if (user?.id) {
          try {
            const subRes = await submissionService.listSubmissions({
              assignmentId: numericAssignmentId,
              studentId: user.id,
              limit: 20
            });
            const list = subRes.data || [];
            const activeAttempt = findInProgressAttempt(list);
            if (isMounted) setInProgressSub(activeAttempt);

            // Find best score
            let maxVal = -1;
            list.forEach((item) => {
              const sc = getSubmissionFinalScore(item) ?? 0;
              if (sc > maxVal) maxVal = sc;
            });

            const records: AttemptRecord[] = list.map((item) => {
              const rawScore = getSubmissionFinalScore(item);
              const isGraded = isSubmissionGraded(item);
              const s10 = rawScore !== null ? (rawScore > 10 ? (rawScore / 10).toFixed(1) : Number(rawScore).toFixed(1)) : '--';
              return {
                id: item.id,
                attemptNumber: item.attemptNumber,
                submittedAt: item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : 'Đang thực hiện',
                score: rawScore,
                maxScore: 10,
                score10: s10,
                status: isGraded ? 'graded' : item.status === 'SUBMITTED' ? 'pending' : 'in_progress',
                isBest: rawScore !== null && rawScore === maxVal && maxVal > 0,
              };
            });

            if (isMounted) setAttempts(records);
          } catch {
            if (isMounted) setAttempts([]);
          }
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
  const completedAttemptsCount = attempts.filter((a) => a.status !== 'in_progress').length;
  const remainingAttempts = isUnlimited
    ? null
    : (getRemainingAttempts(maxSubmissions, completedAttemptsCount) ?? Math.max(0, maxSubmissions - completedAttemptsCount));

  const modules = assignment?.modules;
  const skillsListText = useMemo(() => {
    if (!modules || modules.length === 0) {
      return 'Writing';
    }
    return modules
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
  }, [modules]);

  const handleStartSkill = async (targetSkill: string) => {
    if (isStarting) return;
    if (assignment?.status === 'CLOSED') {
      const subMod = inProgressSub?.modules?.find(
        (sm) => sm.skill?.toUpperCase() === targetSkill.toUpperCase()
      );
      if (!subMod || (subMod.status !== 'SUBMITTED' && subMod.status !== 'GRADED')) {
        setError('Bài tập này đã được giáo viên đóng. Không thể làm bài hoặc nộp bài.');
        return;
      }
    }
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

      const sLower = targetSkill.toLowerCase();
      const idParam = id || '1';
      const queryStr = submissionId ? `?submissionId=${submissionId}` : '';

      if (sLower === 'speaking') {
        navigate(`/student/assignments/speaking/${idParam}${queryStr}`);
      } else if (sLower === 'reading') {
        navigate(`/student/assignments/reading/${idParam}${queryStr}`);
      } else if (sLower === 'listening') {
        navigate(`/student/assignments/listening/${idParam}${queryStr}`);
      } else {
        navigate(`/student/assignments/${idParam}${queryStr}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo bài làm. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleFinalizeSubmission = async () => {
    if (!inProgressSub) return;
    if (assignment?.status === 'CLOSED') {
      setError('Bài tập này đã được giáo viên đóng. Không thể nộp toàn bộ bài tập.');
      return;
    }
    setIsStarting(true);
    try {
      await submissionService.submitSubmission(inProgressSub.id);
      navigate(`/student/submissions/${inProgressSub.id}`);
    } catch (err: unknown) {
      console.warn('Failed to finalize submission:', err);
      const errData = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errData?.response?.data?.message || errData?.message || 'Không thể hoàn tất nộp bài.';
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartAttempt = async () => {
    if (isStarting) return;
    if (assignment?.status === 'CLOSED') {
      setError('Bài tập này đã được giáo viên đóng. Không thể làm bài hoặc nộp bài.');
      return;
    }
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

      // Find first uncompleted module or first module
      let targetSkill = assignment?.modules?.[0]?.skill?.toLowerCase() || '';
      if (inProgressSub && inProgressSub.modules && assignment?.modules) {
        const uncompleted = assignment.modules.find((m) => {
          const sm = inProgressSub.modules?.find(
            (subM) => subM.skill?.toUpperCase() === m.skill?.toUpperCase() || subM.moduleId === m.id
          );
          return !sm || (sm.status !== 'SUBMITTED' && sm.status !== 'GRADED');
        });
        if (uncompleted) {
          targetSkill = uncompleted.skill.toLowerCase();
        }
      }

      const titleLower = (assignment?.title || id || '').toLowerCase();
      const idParam = id || '1';
      const queryStr = submissionId ? `?submissionId=${submissionId}` : '';

      if (targetSkill === 'speaking' || titleLower.includes('spk') || titleLower.includes('speaking') || titleLower.includes('nói')) {
        navigate(`/student/assignments/speaking/${idParam}${queryStr}`);
      } else if (targetSkill === 'reading' || titleLower.includes('rd') || titleLower.includes('reading') || titleLower.includes('đọc')) {
        navigate(`/student/assignments/reading/${idParam}${queryStr}`);
      } else if (targetSkill === 'listening' || titleLower.includes('ls') || titleLower.includes('listening') || titleLower.includes('nghe')) {
        navigate(`/student/assignments/listening/${idParam}${queryStr}`);
      } else {
        navigate(`/student/assignments/${idParam}${queryStr}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo bài làm. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  const isAllSubModulesCompleted = Boolean(
    inProgressSub &&
    inProgressSub.modules &&
    inProgressSub.modules.length > 0 &&
    inProgressSub.modules.every((m) => m.status === 'SUBMITTED' || m.status === 'GRADED')
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
                : assignment?.closeAt
                  ? new Date(assignment.closeAt).toLocaleDateString('vi-VN')
                  : 'Mở trực tuyến'}
            </div>
          </div>

          <div className="overview-rule-card">
            <div className="overview-rule-label">Số lượt nộp cho phép</div>
            <div className="overview-rule-val">
              {isUnlimited 
                ? `Không giới hạn (Đã nộp ${completedAttemptsCount} lần)` 
                : `Tối đa ${maxSubmissions} lần (Đã nộp ${completedAttemptsCount}/${maxSubmissions})`}
            </div>
          </div>
        </div>

        {/* Multi-skill Sections / Modules List */}
        {assignment?.modules && assignment.modules.length > 1 && (
          <div className="overview-sections-container">
            <div className="overview-sections-header">
              <h2 className="overview-section-title">
                Các phần thi trong bài tập ({assignment.modules.length} kỹ năng)
              </h2>
              <span className="overview-section-subtitle">
                Học viên có thể hoàn thành từng phần kỹ năng trước khi nộp toàn bộ bài tập
              </span>
            </div>

            <div className="overview-sections-grid">
              {assignment.modules.map((m, idx) => {
                const subMod = inProgressSub?.modules?.find(
                  (sm) => sm.skill?.toUpperCase() === m.skill?.toUpperCase() || sm.moduleId === m.id
                );
                const isCompleted = subMod?.status === 'SUBMITTED' || subMod?.status === 'GRADED';
                const skillName =
                  m.skill === 'WRITING'
                    ? 'Writing'
                    : m.skill === 'SPEAKING'
                    ? 'Speaking'
                    : m.skill === 'READING'
                    ? 'Reading'
                    : m.skill === 'LISTENING'
                    ? 'Listening'
                    : m.skill;

                return (
                  <div key={m.id || idx} className="overview-module-card">
                    <div className="overview-module-info">
                      <div className="overview-module-title">
                        Phần {idx + 1}: {skillName}
                      </div>
                      <div className={`overview-module-status ${isCompleted ? 'completed' : inProgressSub ? 'in-progress' : 'not-started'}`}>
                        {isCompleted ? 'Đã hoàn thành' : inProgressSub ? 'Chưa hoàn thành' : 'Chưa bắt đầu'}
                      </div>
                    </div>

                    <Button
                      variant={isCompleted ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleStartSkill(m.skill)}
                      disabled={isStarting || (assignment?.status === 'CLOSED' && !isCompleted)}
                    >
                      {isCompleted ? 'Xem lại' : assignment?.status === 'CLOSED' ? 'Đã đóng' : inProgressSub ? 'Làm phần này' : 'Bắt đầu'}
                    </Button>
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
                : isUnlimited
                  ? `Bắt đầu làm bài (Lần ${completedAttemptsCount + 1}).`
                  : remainingAttempts !== null && remainingAttempts > 0 
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
            {assignment?.status === 'CLOSED' ? (
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
                title={attempts.filter((a) => a.status !== 'in_progress').length === 0 ? 'Bài tập đã được giáo viên đóng' : 'Xem kết quả bài nộp'}
              >
                {attempts.filter((a) => a.status !== 'in_progress').length > 0 ? 'Xem kết quả bài nộp' : 'Bài tập đã đóng (Không thể làm bài)'}
              </button>
            ) : inProgressSub ? (
              isAllSubModulesCompleted ? (
                <button 
                  className="overview-cta-btn" 
                  onClick={handleFinalizeSubmission}
                  disabled={isStarting}
                  type="button"
                >
                  {isStarting ? 'Đang nộp toàn bộ bài tập...' : `Nộp toàn bộ bài tập (Lần ${inProgressSub.attemptNumber})`}
                </button>
              ) : (
                <button 
                  className="overview-cta-btn" 
                  onClick={handleStartAttempt}
                  disabled={isStarting}
                  type="button"
                >
                  {isStarting ? 'Đang mở bài làm...' : `Tiếp tục làm bài (Lần ${inProgressSub.attemptNumber})`}
                </button>
              )
            ) : isUnlimited || (remainingAttempts !== null && remainingAttempts > 0) ? (
              <button 
                className="overview-cta-btn" 
                onClick={handleStartAttempt}
                disabled={isStarting}
                type="button"
              >
                {isStarting ? 'Đang khởi tạo bài làm...' : `Bắt đầu làm bài (Lần ${completedAttemptsCount + 1})`}
              </button>
            ) : (
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
    </div>
  );
};

export default StudentAssignmentOverview;
