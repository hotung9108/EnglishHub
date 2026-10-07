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
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { assignmentService, type AssignmentDetail } from '../api/services/assignment.service';
import { submissionService, type SubmissionListItem, getRemainingAttempts, findInProgressAttempt } from '../api/services/submission.service';

interface AttemptRecord {
  id: number;
  attemptNumber: number;
  submittedAt: string;
  score: number | null;
  maxScore: number;
  bandScore: string;
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
              const band = rawScore !== null ? (rawScore / 100 * 9).toFixed(1) : '--';
              return {
                id: item.id,
                attemptNumber: item.attemptNumber,
                submittedAt: item.submittedAt ? new Date(item.submittedAt).toLocaleString('vi-VN') : 'Đang thực hiện',
                score: rawScore,
                maxScore: 100,
                bandScore: band,
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

      // Determine skill from module or id
      const skill = assignment?.modules?.[0]?.skill?.toLowerCase() || '';
      const idParam = id || '1';
      const queryStr = submissionId ? `?submissionId=${submissionId}` : '';

      if (skill === 'speaking' || id?.toLowerCase().includes('spk') || id?.toLowerCase().includes('speaking')) {
        navigate(`/student/assignments/speaking/${idParam}${queryStr}`);
      } else if (skill === 'reading' || id?.toLowerCase().includes('rd') || id?.toLowerCase().includes('reading')) {
        navigate(`/student/assignments/reading/${idParam}${queryStr}`);
      } else if (skill === 'listening' || id?.toLowerCase().includes('ls') || id?.toLowerCase().includes('listening')) {
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
        <span style={{ color: 'var(--outline-variant)' }}>/</span>
        <span>Hệ thống</span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span 
          style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => navigate('/student/classes')}
          role="button"
          tabIndex={0}
        >
          Lớp học của tôi
        </span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Lớp học</span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
          Tổng quan bài tập ({assignment?.title || id || 'HW-01'})
        </span>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '6px', backgroundColor: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            <RefreshCw size={13} /> Thử lại
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="overview-card">
        {/* Header */}
        <div className="overview-header">
          <div>
            <div className="overview-badge-row" style={{ marginBottom: '8px' }}>
              <span className="overview-skill-badge writing">
                {assignment?.modules?.[0]?.skill || 'IELTS Skill Practice'}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>
                ● {assignment?.status === 'PUBLISHED' ? 'Đang mở nhận bài' : 'Đang đóng'}
              </span>
            </div>
            <h1 className="overview-title">
              {isLoading ? 'Đang tải bài tập...' : (assignment?.title || `Bài tập ${id || 'HW-01'}`)}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              Mã bài tập: <strong>#{numericAssignmentId}</strong> • Hệ thống chấm điểm tự động &amp; Giảng viên phê duyệt
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Điểm cao nhất hiện tại</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>
              {bestAttempt ? `Band ${bestAttempt.bandScore}` : 'Chưa có điểm'}
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
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
              Đã làm {attempts.length} lần
            </span>
          </div>

          <div className="overview-table-wrapper">
            <table className="overview-table">
              <thead>
                <tr>
                  <th>Lần nộp</th>
                  <th>Thời gian nộp</th>
                  <th>Điểm số (Hệ 100)</th>
                  <th>IELTS Band</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                      Đang tải lịch sử các lần nộp bài...
                    </td>
                  </tr>
                ) : attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>
                      Chưa có lần nộp bài nào. Nhấn &quot;Bắt đầu làm bài&quot; bên dưới để làm lần đầu tiên.
                    </td>
                  </tr>
                ) : (
                  attempts.map((att) => (
                    <tr key={att.id}>
                      <td style={{ fontWeight: 700 }}>
                        Lần {att.attemptNumber}
                        {att.isBest && (
                          <span style={{ marginLeft: 8, fontSize: '11px', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: 4 }}>
                            ★ Điểm cao nhất
                          </span>
                        )}
                      </td>
                      <td style={{ color: 'var(--on-surface-variant)' }}>{att.submittedAt}</td>
                      <td style={{ fontWeight: 600 }}>{att.score !== null ? `${att.score} / ${att.maxScore}` : '--'}</td>
                      <td>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                          Band {att.bandScore}
                        </span>
                      </td>
                      <td>
                        {att.status === 'graded' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600, fontSize: '12px' }}>
                            <CheckCircle2 size={13} />
                            Đã có điểm
                          </span>
                        ) : att.status === 'in_progress' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563EB', fontWeight: 600, fontSize: '12px' }}>
                            <Clock size={13} />
                            Đang làm dở
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#D97706', fontWeight: 600, fontSize: '12px' }}>
                            <Clock size={13} />
                            Chờ chấm điểm
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {att.status === 'graded' || att.status === 'pending' ? (
                          <button 
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
                            onClick={() => navigate(`/student/submissions/${att.id}`)}
                          >
                            Xem kết quả bài nộp
                          </button>
                        ) : (
                          <button 
                            type="button"
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
                            onClick={handleStartAttempt}
                          >
                            Tiếp tục làm bài
                          </button>
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
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
              {inProgressSub
                ? `Bạn đang có bài làm dở (Lần ${inProgressSub.attemptNumber}). Bạn có thể tiếp tục hoàn thành.`
                : remainingAttempts > 0 
                  ? `Bạn còn ${remainingAttempts} lượt nộp bài nữa cho đề thi này.`
                  : 'Bạn đã sử dụng hết số lần nộp bài cho phép.'}
            </div>
            <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: 2 }}>
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
