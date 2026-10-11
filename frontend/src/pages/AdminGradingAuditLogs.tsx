import React, { useState, useEffect } from 'react';
import { 
  History, Search, Download, 
  X, 
  Award, Loader2, AlertCircle,
  RotateCcw, CheckCircle2, Clock, FileText
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { gradingService } from '../api/services/grading.service';
import { gradingChangeLogService } from '../api/services/grading-change-log.service';
import type { 
  GradingSummaryResponse, 
  GradingStatus, 
  GradingDetailResponse 
} from '../api/services/grading.service';
import type { GradingChangeLog } from '../api/services/grading-change-log.service';

export const AdminGradingAuditLogs: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradings, setGradings] = useState<GradingSummaryResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GradingStatus>('ALL');

  // Drawer / Inspection
  const [selectedGradingId, setSelectedGradingId] = useState<number | null>(null);
  const [gradingDetail, setGradingDetail] = useState<GradingDetailResponse | null>(null);
  const [changeLogs, setChangeLogs] = useState<GradingChangeLog[]>([]);
  const [loadingDrawer, setLoadingDrawer] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadGradings = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          page: 1,
          limit: 100,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        };

        const res = await gradingService.listGradings(params);
        if (isMounted) {
          setGradings(res.data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải nhật ký chấm điểm.' : 'Failed to load grading audit records.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadGradings();

    return () => {
      isMounted = false;
    };
  }, [statusFilter, refreshKey, isVi]);

  // Open inspection drawer
  const handleOpenDetail = async (gradingId: number) => {
    setSelectedGradingId(gradingId);
    setGradingDetail(null);
    setChangeLogs([]);
    setDrawerError(null);
    setLoadingDrawer(true);

    try {
      const [detailRes, logsRes] = await Promise.allSettled([
        gradingService.getById(gradingId),
        gradingChangeLogService.getChangeLogs(gradingId)
      ]);

      if (detailRes.status === 'fulfilled') {
        setGradingDetail(detailRes.value);
      } else {
        throw detailRes.reason;
      }

      if (logsRes.status === 'fulfilled') {
        setChangeLogs(logsRes.value.data || []);
      }
    } catch (err: unknown) {
      setDrawerError(err instanceof Error ? err.message : isVi ? 'Không thể tải chi tiết bài chấm và lịch sử sửa điểm.' : 'Failed to load grading details and change logs.');
    } finally {
      setLoadingDrawer(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedGradingId(null);
    setGradingDetail(null);
    setChangeLogs([]);
  };

  const filteredGradings = gradings.filter(item => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = `GR-${item.id}`.toLowerCase();
      return (
        code.includes(q) ||
        item.status.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countCompleted = gradings.filter(i => i.status === 'COMPLETED').length;
  const countAiGraded = gradings.filter(i => i.status === 'AI_GRADED').length;
  const countPending = gradings.filter(i => i.status === 'PENDING').length;

  const handleExportCsv = () => {
    alert(isVi ? 'Đang trích xuất nhật ký kiểm toán chấm điểm ra tập tin CSV...' : 'Exporting grading audit records to CSV...');
  };

  const formatStatusBadge = (status: GradingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-active">{isVi ? 'Đã hoàn thành' : 'Completed'}</span>;
      case 'AI_GRADED':
        return <span className="badge" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce' }}>{isVi ? 'AI Đã Chấm' : 'AI Graded'}</span>;
      case 'PENDING':
        return <span className="badge badge-onleave">{isVi ? 'Đang chờ duyệt' : 'Pending'}</span>;
      case 'FAILED':
        return <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>{isVi ? 'Thất bại' : 'Failed'}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="adm-container">
      {/* Page Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <div className="adm-gh-header-icon">
              <History size={24} />
            </div>
            <span>{t('auditLogs.title')}</span>
            <span className="adm-gh-count-badge">
              {filteredGradings.length} {isVi ? 'hồ sơ chấm điểm' : 'grading records'}
            </span>
          </h1>
          <p className="adm-subtitle">
            {t('auditLogs.subtitle')}
          </p>
        </div>

        <div className="adm-gh-header-actions">
          <button 
            type="button"
            className="adm-gh-btn-export"
            onClick={handleExportCsv}
          >
            <Download size={16} />
            <span>{t('auditLogs.exportCsv')}</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}

      {/* Filter and Quick Chips Bar */}
      <div className="adm-filter-bar" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <div className="adm-search-wrap" style={{ flex: 1, minWidth: '260px' }}>
            <Search size={16} className="adm-search-icon" />
            <input 
              type="text" 
              className="adm-search-input"
              placeholder={isVi ? 'Tìm theo mã chấm (GR-...) hoặc trạng thái...' : 'Search by grading ID (GR-...) or status...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {searchQuery && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchQuery('')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '40px' }}
            >
              <RotateCcw size={14} />
              <span>{isVi ? 'Xóa tìm kiếm' : 'Clear Search'}</span>
            </button>
          )}
        </div>

        {/* Status Segment Filter Pills */}
        <div className="adm-pills" style={{ margin: 0 }}>
          <button
            type="button"
            className={`adm-pill-item ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>{isVi ? 'Tất cả bài chấm' : 'All Gradings'}</span>
            <span className="adm-pill-badge">{gradings.length}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            <CheckCircle2 size={13} color="#16a34a" />
            <span>{isVi ? 'Đã hoàn tất' : 'Completed'}</span>
            <span className="adm-pill-badge">{countCompleted}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${statusFilter === 'AI_GRADED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('AI_GRADED')}
          >
            <Award size={13} color="#7e22ce" />
            <span>{isVi ? 'AI Đã chấm' : 'AI Graded'}</span>
            <span className="adm-pill-badge">{countAiGraded}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            <Clock size={13} color="#d97706" />
            <span>{isVi ? 'Chờ duyệt' : 'Pending'}</span>
            <span className="adm-pill-badge">{countPending}</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="adm-table-card">
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>{isVi ? 'Đang tải danh sách hồ sơ chấm điểm từ máy chủ...' : 'Loading grading records from server...'}</div>
          </div>
        ) : filteredGradings.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <History size={40} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--on-surface)' }}>
              {isVi ? 'Chưa có hồ sơ chấm điểm nào' : 'No grading records found'}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>
              {searchQuery 
                ? (isVi ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'No entries match your search criteria.')
                : (isVi ? 'Nhật ký sẽ hiển thị khi học sinh nộp bài và bài làm được xử lý chấm.' : 'Entries will appear here as submissions are processed.')}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ CHẤM' : 'GRADING ID'}</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                  <th>{isVi ? 'ĐIỂM CHỐT' : 'FINAL SCORE'}</th>
                  <th style={{ textAlign: 'right' }}>{isVi ? 'NHẬT KÝ SỬA ĐIỂM' : 'AUDIT ACTION'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredGradings.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => handleOpenDetail(item.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="font-mono font-semibold text-primary">GR-{item.id}</td>
                    <td>{formatStatusBadge(item.status)}</td>
                    <td>
                      <span className="font-bold font-mono" style={{ fontSize: '15px', color: item.finalScore !== null ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                        {item.finalScore !== null ? item.finalScore : (isVi ? 'Chưa có điểm' : 'Unscored')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(item.id);
                        }}
                      >
                        {isVi ? 'Xem lịch sử sửa điểm' : 'Audit Logs'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer: Detailed Inspection and Change Logs */}
      {selectedGradingId !== null && (
        <div className="adm-drawer-backdrop" onClick={handleCloseDrawer}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="adm-drawer-header">
              <div>
                <h2 className="adm-drawer-title">
                  {isVi ? `Chi Tiết Kiểm Toán & Lịch Sử Sửa Điểm: GR-${selectedGradingId}` : `Grading Audit & Change Logs: GR-${selectedGradingId}`}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  Hồ sơ chấm điểm #GR-{selectedGradingId}
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseDrawer}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="adm-drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {loadingDrawer ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                  <div>{isVi ? 'Đang truy xuất thông tin chấm và nhật ký chỉnh sửa...' : 'Fetching grading context and change history...'}</div>
                </div>
              ) : drawerError ? (
                <div style={{ padding: '16px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px' }}>
                  {drawerError}
                </div>
              ) : gradingDetail ? (
                <>
                  {/* Status & Scores Strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Trạng thái' : 'Status'}</div>
                      <div style={{ marginTop: '4px' }}>{formatStatusBadge(gradingDetail.status)}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Phương thức' : 'Method'}</div>
                      <div className="font-semibold" style={{ fontSize: '14px', marginTop: '4px' }}>{gradingDetail.method}</div>
                    </div>
                    <div style={{ padding: '14px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Điểm chốt hiện tại' : 'Final Score'}</div>
                      <div className="font-bold text-primary font-mono" style={{ fontSize: '20px', marginTop: '2px' }}>
                        {gradingDetail.finalScore !== null ? gradingDetail.finalScore : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Notes */}
                  {gradingDetail.finalFeedback && (
                    <div className="card" style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FileText size={15} color="var(--primary)" />
                        <span>{isVi ? 'Lời phê chính thức' : 'Official Instructor Feedback'}</span>
                      </div>
                      <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--on-surface)' }}>
                        {gradingDetail.finalFeedback}
                      </div>
                    </div>
                  )}

                  {gradingDetail.aiFeedback && (
                    <div className="card" style={{ padding: '16px', background: 'rgba(126, 34, 206, 0.04)', borderColor: 'rgba(126, 34, 206, 0.15)' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#7e22ce' }}>
                        {isVi ? 'Nhận xét từ AI Engine' : 'AI Engine Feedback'}
                      </div>
                      <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
                        {gradingDetail.aiFeedback}
                      </div>
                    </div>
                  )}

                  {/* REAL CHANGE LOGS SECTION */}
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <History size={16} color="var(--primary)" />
                      <span>{isVi ? 'Nhật Ký Các Lần Sửa Điểm (Change Logs Audit)' : 'Grading Adjustment History'}</span>
                    </h3>

                    {changeLogs.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', background: 'var(--surface-container-low)', borderRadius: '8px', color: 'var(--on-surface-variant)' }}>
                        <CheckCircle2 size={28} style={{ margin: '0 auto 8px', color: '#16a34a', opacity: 0.8 }} />
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>
                          {isVi ? 'Chưa có lượt sửa điểm nào' : 'No grade changes recorded'}
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '12.5px' }}>
                          {isVi 
                            ? 'Điểm số của bài làm này vẫn giữ nguyên vẹn từ lần chấm đầu tiên.' 
                            : 'The score for this submission remains unchanged from the initial evaluation.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto', border: '1px solid var(--outline-variant)', borderRadius: '8px' }}>
                        <table className="adm-table" style={{ margin: 0 }}>
                          <thead>
                            <tr>
                              <th>{isVi ? 'NGƯỜI ĐIỀU CHỈNH' : 'CHANGED BY'}</th>
                              <th>{isVi ? 'ĐIỂM CŨ' : 'OLD'}</th>
                              <th>{isVi ? 'ĐIỂM MỚI' : 'NEW'}</th>
                              <th>{isVi ? 'LÝ DO / GHI CHÚ' : 'REASON / NOTE'}</th>
                              <th>{isVi ? 'THỜI GIAN' : 'TIMESTAMP'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {changeLogs.map((log, idx) => (
                              <tr key={idx}>
                                <td className="font-medium">{log.changedBy}</td>
                                <td className="font-mono text-on-surface-variant">{log.oldScore ?? '-'}</td>
                                <td className="font-mono font-bold text-primary">{log.newScore ?? '-'}</td>
                                <td style={{ maxWidth: '200px', fontSize: '13px' }}>
                                  {log.note || <span className="text-on-surface-variant italic">{isVi ? 'Không có ghi chú' : 'No note provided'}</span>}
                                </td>
                                <td className="font-mono text-on-surface-variant" style={{ fontSize: '12px' }}>
                                  {log.changedAt}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="adm-drawer-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleCloseDrawer}
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGradingAuditLogs;
