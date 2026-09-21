import React from 'react';
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
  HelpCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface AttemptRecord {
  attemptNumber: number;
  submittedAt: string;
  score: number;
  maxScore: number;
  bandScore: number;
  status: 'graded' | 'pending';
  isBest: boolean;
}

const StudentAssignmentOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const maxSubmissions = 3;
  const attempts: AttemptRecord[] = [
    {
      attemptNumber: 1,
      submittedAt: '02/09/2026 15:30',
      score: 72,
      maxScore: 100,
      bandScore: 6.5,
      status: 'graded',
      isBest: false
    },
    {
      attemptNumber: 2,
      submittedAt: '04/09/2026 10:15',
      score: 86,
      maxScore: 100,
      bandScore: 7.5,
      status: 'graded',
      isBest: true
    }
  ];

  const remainingAttempts = maxSubmissions - attempts.length;

  const handleStartAttempt = () => {
    // Navigate to actual exercise workspace based on type
    if (id?.toLowerCase().includes('spk') || id?.toLowerCase().includes('speaking')) {
      navigate(`/student/assignments/speaking/${id}`);
    } else if (id?.toLowerCase().includes('rd') || id?.toLowerCase().includes('reading')) {
      navigate(`/student/assignments/reading/${id}`);
    } else if (id?.toLowerCase().includes('ls') || id?.toLowerCase().includes('listening')) {
      navigate(`/student/assignments/listening/${id}`);
    } else {
      navigate(`/student/assignments/${id || 'HW-01'}`);
    }
  };

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
        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>ENG-IELTS-6.5A</span>
        <ChevronRight size={12} style={{ color: 'var(--outline-variant)' }} />
        <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>
          Tổng quan bài tập ({id || 'HW-01'})
        </span>
      </div>

      {/* Main Card */}
      <div className="overview-card">
        {/* Header */}
        <div className="overview-header">
          <div>
            <div className="overview-badge-row" style={{ marginBottom: '8px' }}>
              <span className="overview-skill-badge writing">Academic Writing Task 2</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 4 }}>
                ● Đang mở nhận bài
              </span>
            </div>
            <h1 className="overview-title">
              HW-01: Renewable Energy Essay &amp; Climate Solutions
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              Khóa học: <strong>IELTS Intensive Band 6.5 - 7.5</strong> • Giảng viên phụ trách: <strong>ThS. Trần Thị Mai Lan</strong>
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Điểm cao nhất hiện tại</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary)' }}>Band 7.5</div>
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
              <div className="overview-rule-label">Thời hạn nộp (Deadline)</div>
              <div className="overview-rule-val">23:59 - 05/09/2026</div>
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
            1. Bài viết phải có dung lượng <strong>tối thiểu 250 từ</strong>, trình bày bố cục chuẩn 4 đoạn (Introduction, 2 Body paragraphs, Conclusion).<br />
            2. Trả lời cả hai vế của đề bài và đưa ra các luận điểm bảo vệ quan điểm cá nhân có ví dụ thực tế.<br />
            3. Hệ thống sẽ tự động lưu bài nháp (Draft) mỗi 30 giây để tránh mất dữ liệu khi mất kết nối mạng.<br />
            4. Sau khi nộp bài, hệ thống AI sẽ tiến hành chấm sơ bộ và trả kết quả highlight sau khoảng 1-2 phút. Giảng viên sẽ thẩm định lại và phê duyệt điểm số chính thức.
          </p>
        </div>

        {/* Attempts Table */}
        <div className="overview-attempts-section">
          <div className="overview-attempts-title">
            <span>Lịch sử các lần làm bài (Attempts History)</span>
            <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
              Đã nộp {attempts.length} lần
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
                {attempts.map((att) => (
                  <tr key={att.attemptNumber}>
                    <td style={{ fontWeight: 700 }}>
                      Lần {att.attemptNumber}
                      {att.isBest && (
                        <span style={{ marginLeft: 8, fontSize: '11px', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: 4 }}>
                          ★ Điểm cao nhất
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--on-surface-variant)' }}>{att.submittedAt}</td>
                    <td style={{ fontWeight: 600 }}>{att.score} / {att.maxScore}</td>
                    <td>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>
                        Band {att.bandScore}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontWeight: 600, fontSize: '12px' }}>
                        <CheckCircle2 size={13} />
                        Đã có điểm
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                        onClick={() => navigate(`/student/assignments/${id || 'HW-01'}/result`)}
                      >
                        Xem kết quả &amp; Bài chữa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Start Attempt */}
        <div className="overview-cta-box">
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a' }}>
              {remainingAttempts > 0 
                ? `Bạn còn ${remainingAttempts} lượt nộp bài nữa cho đề thi này.`
                : 'Bạn đã sử dụng hết số lần nộp bài cho phép.'}
            </div>
            <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: 2 }}>
              Điểm số tổng kết môn học sẽ ghi nhận lần làm bài có điểm số cao nhất của bạn.
            </div>
          </div>

          {remainingAttempts > 0 ? (
            <button 
              className="overview-cta-btn" 
              onClick={handleStartAttempt}
              type="button"
            >
              <Play size={16} />
              Bắt đầu làm bài (Lần {attempts.length + 1})
            </button>
          ) : (
            <button 
              className="overview-cta-btn" 
              onClick={() => navigate(`/student/assignments/${id || 'HW-01'}/result`)}
              type="button"
            >
              <FileText size={16} />
              Xem lại bài làm tốt nhất (Band 7.5)
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentAssignmentOverview;
