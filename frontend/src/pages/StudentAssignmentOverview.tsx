import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronRight, 
  Calendar, 
  Clock, 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  Play, 
  FileText,
  HelpCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, getRemainingAttempts, findInProgressAttempt } from '../api/services/submission.service';
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
              const sc = item.modules?.[0]?.grading?.finalScore ?? 0;
              if (sc > maxVal) maxVal = sc;
            });

            const records: AttemptRecord[] = list.map((item) => {
              const rawScore = item.modules?.[0]?.grading?.finalScore ?? null;
              const isGraded = item.status === 'GRADED';
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

  const maxSubmissions = 3;
  const remainingAttempts = getRemainingAttempts(maxSubmissions, attempts.filter(a => a.status !== 'in_progress').length) ?? 3;

  const handleStartAttempt = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setError(null);
    try {
      let submissionId = inProgressSub?.id;
      if (!submissionId) {
        try {
          const startRes = await submissionService.startAttempt(numericAssignmentId);
          submissionId = startRes.id;
        } catch {
          // If startAttempt fails (e.g. mock ID), proceed with default
          submissionId = undefined;
        }
      }

      // Determine skill from module or id or title
      const skill = assignment?.modules?.[0]?.skill?.toLowerCase() || '';
      const titleLower = (assignment?.title || id || '').toLowerCase();
      const idParam = id || '1';
      const queryStr = submissionId ? `?submissionId=${submissionId}` : '';

      if (skill === 'speaking' || titleLower.includes('spk') || titleLower.includes('speaking') || titleLower.includes('nói')) {
        navigate(`/student/assignments/speaking/${idParam}${queryStr}`);
      } else if (skill === 'reading' || titleLower.includes('rd') || titleLower.includes('reading') || titleLower.includes('đọc')) {
        navigate(`/student/assignments/reading/${idParam}${queryStr}`);
      } else if (skill === 'listening' || titleLower.includes('ls') || titleLower.includes('listening') || titleLower.includes('nghe')) {
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

  const bestAttempt = attempts.find(a => a.isBest);

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
        <span className="text-slate-300">/</span>
        <span>Hệ thống</span>
        <ChevronRight size={12} className="text-slate-300" />
        <span 
          className="text-primary font-medium cursor-pointer"
          onClick={() => navigate('/student/classes')}
          role="button"
          tabIndex={0}
        >
          Lớp học của tôi
        </span>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="text-primary font-medium">Lớp học</span>
        <ChevronRight size={12} className="text-slate-300" />
        <span className="font-semibold text-slate-900">
          Tổng quan bài tập ({assignment?.title || id || 'HW-01'})
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
          <div>
            <div className="overview-badge-row mb-2">
              <span className={`overview-skill-badge ${assignment?.modules?.[0]?.skill?.toLowerCase() || 'writing'}`}>
                {assignment?.modules?.[0]?.skill ? `${assignment.modules[0].skill} Practice` : 'Skill Practice'}
              </span>
              <span className={`overview-status-badge ${assignment?.status === 'PUBLISHED' ? '' : 'closed'}`}>
                ● {assignment?.status === 'PUBLISHED' ? 'Đang mở nhận bài' : 'Đang đóng'}
              </span>
            </div>
            <h1 className="overview-title">
              {isLoading ? 'Đang tải bài tập...' : (assignment?.title || `Bài tập ${id || 'HW-01'}`)}
            </h1>
            <p className="overview-code-text">
              Mã bài tập: <strong>#{numericAssignmentId}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="overview-best-score-label">Điểm cao nhất hiện tại</span>
            <div className="overview-best-score-val">
              {bestAttempt ? `${bestAttempt.score10} / 10` : 'Chưa có điểm'}
            </div>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="overview-rules-grid">
          <div className="overview-rule-item">
            <div className="overview-rule-icon">
              <Clock size={20} />
            </div>
            <div>
              <div className="overview-rule-label">Thời lượng làm bài</div>
              <div className="overview-rule-val">40 Phút</div>
            </div>
          </div>

          <div className="overview-rule-item">
            <div className="overview-rule-icon">
              <RotateCcw size={20} />
            </div>
            <div>
              <div className="overview-rule-label">Số lượt nộp cho phép</div>
              <div className="overview-rule-val">{attempts.length} / {maxSubmissions} lần (Còn {remainingAttempts} lượt)</div>
            </div>
          </div>

          <div className="overview-rule-item">
            <div className="overview-rule-icon">
              <Calendar size={20} />
            </div>
            <div>
              <div className="overview-rule-label">Thời hạn nộp</div>
              <div className="overview-rule-val">Mở trực tuyến</div>
            </div>
          </div>

          <div className="overview-rule-item">
            <div className="overview-rule-icon">
              <Award size={20} />
            </div>
            <div>
              <div className="overview-rule-label">Phương thức tính điểm</div>
              <div className="overview-rule-val">Lấy điểm cao nhất (Best)</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="overview-instructions-box">
          <h3 className="overview-instructions-title">
            <HelpCircle size={16} color="var(--primary)" />
            Hướng dẫn &amp; Yêu cầu bài làm:
          </h3>
          <p className="overview-instructions-content">
            1. Đọc kỹ yêu cầu từng phần câu hỏi và hoàn thành tất cả các mục trước khi nhấn Nộp bài.<br />
            2. Trả lời đầy đủ, hệ thống sẽ tự động lưu bài nháp (Draft) định kỳ để bảo vệ dữ liệu khi làm.<br />
            3. Sau khi nộp bài, hệ thống AI và Giảng viên sẽ tiến hành phân tích, chấm điểm và highlight nhận xét chi tiết.<br />
            4. Bạn có thể xem lại kết quả bài làm và feedback bất kỳ lúc nào trong danh sách Lịch sử các lần làm bài.
          </p>
        </div>

        {/* Attempts Table */}
        <div className="overview-attempts-section">
          <div className="overview-attempts-title">
            <span>Lịch sử các lần làm bài (Attempts History)</span>
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
                    <td colSpan={5} className="text-center p-6 text-slate-500">
                      Đang tải lịch sử các lần nộp bài...
                    </td>
                  </tr>
                ) : attempts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-6 text-slate-500">
                      Chưa có lần nộp bài nào. Nhấn &quot;Bắt đầu làm bài&quot; bên dưới để làm lần đầu tiên.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att) => (
                    <tr key={att.id}>
                      <td className="font-bold">
                        Lần {att.attemptNumber}
                        {att.isBest && (
                          <span className="overview-best-tag">
                            <Award size={12} className="inline mr-1" />
                            Điểm cao nhất
                          </span>
                        )}
                      </td>
                      <td className="text-slate-500">{att.submittedAt}</td>
                      <td>
                        <span className="overview-score-cell">
                          {att.score10 !== '--' ? `${att.score10} / 10` : '--'}
                        </span>
                      </td>
                      <td>
                        {att.status === 'graded' ? (
                          <span className="overview-status-chip graded">
                            <CheckCircle2 size={13} />
                            Đã có điểm
                          </span>
                        ) : att.status === 'in_progress' ? (
                          <span className="overview-status-chip in-progress">
                            <Clock size={13} />
                            Đang làm dở
                          </span>
                        ) : (
                          <span className="overview-status-chip pending">
                            <Clock size={13} />
                            Chờ chấm điểm
                          </span>
                        )}
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
          <div>
            <div className="overview-cta-title">
              {inProgressSub
                ? `Bạn đang có bài làm dở (Lần ${inProgressSub.attemptNumber}). Bạn có thể tiếp tục hoàn thành.`
                : remainingAttempts > 0 
                  ? `Bạn còn ${remainingAttempts} lượt nộp bài nữa cho đề thi này.`
                  : 'Bạn đã sử dụng hết số lần nộp bài cho phép.'}
            </div>
            <div className="overview-cta-desc">
              Điểm số tổng kết môn học sẽ ghi nhận lần làm bài có kết quả tốt nhất của bạn.
            </div>
          </div>

          {inProgressSub ? (
            <button 
              className="overview-cta-btn" 
              onClick={handleStartAttempt}
              disabled={isStarting}
              type="button"
            >
              <Play size={16} />
              {isStarting ? 'Đang mở bài làm...' : `Tiếp tục làm bài (Lần ${inProgressSub.attemptNumber})`}
            </button>
          ) : remainingAttempts > 0 ? (
            <button 
              className="overview-cta-btn" 
              onClick={handleStartAttempt}
              disabled={isStarting}
              type="button"
            >
              <Play size={16} />
              {isStarting ? 'Đang khởi tạo bài làm...' : `Bắt đầu làm bài (Lần ${attempts.length + 1})`}
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
              <FileText size={16} />
              Xem kết quả bài nộp tốt nhất
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentAssignmentOverview;
