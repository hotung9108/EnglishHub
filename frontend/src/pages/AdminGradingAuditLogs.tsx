import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, Search, Download, 
  X, 
  Loader2, AlertCircle,
  RotateCcw, CheckCircle2, FileText
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
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'SCORED' | 'UNSCORED'>('ALL');

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
  }, [refreshKey, isVi]);

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

  const countCompleted = useMemo(() => gradings.filter(i => i.status === 'COMPLETED').length, [gradings]);
  const countAiGraded = useMemo(() => gradings.filter(i => i.status === 'AI_GRADED').length, [gradings]);
  const countPending = useMemo(() => gradings.filter(i => i.status === 'PENDING').length, [gradings]);
  const countFailed = useMemo(() => gradings.filter(i => i.status === 'FAILED').length, [gradings]);

  const filteredGradings = useMemo(() => {
    return gradings.filter(item => {
      // 1. Status segment filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 2. Score filter
      if (scoreFilter === 'SCORED' && (item.finalScore === null || item.finalScore === undefined)) {
        return false;
      }
      if (scoreFilter === 'UNSCORED' && item.finalScore !== null && item.finalScore !== undefined) {
        return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const code = `gr-${item.id}`.toLowerCase();
        const idStr = String(item.id);
        const rawStatus = item.status.toLowerCase();
        const scoreStr = item.finalScore !== null && item.finalScore !== undefined ? String(item.finalScore) : '';

        // Friendly keyword matching for status
        let statusMatches = rawStatus.includes(q);
        if (item.status === 'COMPLETED' && (q.includes('hoàn tất') || q.includes('hoàn thành') || q.includes('xong') || q.includes('complete'))) {
          statusMatches = true;
        } else if (item.status === 'AI_GRADED' && (q.includes('ai') || q.includes('máy chấm') || q.includes('tự động'))) {
          statusMatches = true;
        } else if (item.status === 'PENDING' && (q.includes('chờ') || q.includes('duyệt') || q.includes('pend'))) {
          statusMatches = true;
        } else if (item.status === 'FAILED' && (q.includes('thất bại') || q.includes('lỗi') || q.includes('fail'))) {
          statusMatches = true;
        }

        // Score keyword matching
        let scoreMatches = scoreStr.includes(q);
        if ((item.finalScore === null || item.finalScore === undefined) && (q.includes('chưa') || q.includes('unscored') || q.includes('null'))) {
          scoreMatches = true;
        }

        return (
          code.includes(q) ||
          idStr === q ||
          statusMatches ||
          scoreMatches
        );
      }

      return true;
    });
  }, [gradings, statusFilter, scoreFilter, searchQuery]);

  const handleExportCsv = () => {
    alert(isVi ? 'Đang trích xuất nhật ký kiểm toán chấm điểm ra tập tin CSV...' : 'Exporting grading audit records to CSV...');
  };

  const formatStatusBadge = (status: GradingStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-active">{isVi ? 'Đã hoàn thành' : 'Completed'}</span>;
      case 'AI_GRADED':
        return <span className="badge badge-secondary">{isVi ? 'AI Đã Chấm' : 'AI Graded'}</span>;
      case 'PENDING':
        return <span className="badge badge-onleave">{isVi ? 'Đang chờ duyệt' : 'Pending'}</span>;
      case 'FAILED':
        return <span className="badge badge-blocked">{isVi ? 'Thất bại' : 'Failed'}</span>;
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

      {/* Filter and Search Bar */}
      <div className="adm-filter-bar mb-6">
        {/* Status Segment Filter Pills */}
        <div className="adm-pills">
          <button
            type="button"
            className={`adm-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>{isVi ? 'Tất cả bài chấm' : 'All Gradings'}</span>
            <span className="adm-pill-badge">{gradings.length}</span>
          </button>
          <button
            type="button"
            className={`adm-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            <span>{isVi ? 'Đã hoàn tất' : 'Completed'}</span>
            <span className="adm-pill-badge">{countCompleted}</span>
          </button>
          <button
            type="button"
            className={`adm-pill ${statusFilter === 'AI_GRADED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('AI_GRADED')}
          >
            <span>{isVi ? 'AI Đã chấm' : 'AI Graded'}</span>
            <span className="adm-pill-badge">{countAiGraded}</span>
          </button>
          <button
            type="button"
            className={`adm-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            <span>{isVi ? 'Chờ duyệt' : 'Pending'}</span>
            <span className="adm-pill-badge">{countPending}</span>
          </button>
          {countFailed > 0 && (
            <button
              type="button"
              className={`adm-pill ${statusFilter === 'FAILED' ? 'active' : ''}`}
              onClick={() => setStatusFilter('FAILED')}
            >
              <span>{isVi ? 'Thất bại' : 'Failed'}</span>
              <span className="adm-pill-badge">{countFailed}</span>
            </button>
          )}
        </div>

        {/* Filter Controls: Score dropdown & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="adm-gh-select"
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as 'ALL' | 'SCORED' | 'UNSCORED')}
            aria-label={isVi ? 'Lọc theo mức điểm' : 'Filter by score'}
          >
            <option value="ALL">{isVi ? 'Tất cả mức điểm' : 'All Scores'}</option>
            <option value="SCORED">{isVi ? 'Đã có điểm chốt' : 'Has Final Score'}</option>
            <option value="UNSCORED">{isVi ? 'Chưa có điểm chốt' : 'No Final Score'}</option>
          </select>

          {/* Search Input */}
          <div className="adm-search-wrap">
            <Search size={16} className="adm-search-icon" />
            <input 
              type="text" 
              className="adm-search-input"
              placeholder={isVi ? 'Tìm mã GR-..., điểm, trạng thái...' : 'Search GR-... ID, score, status...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                title={isVi ? 'Xóa tìm kiếm' : 'Clear search'}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--on-surface-variant)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
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
              {isVi ? 'Không tìm thấy hồ sơ chấm điểm nào' : 'No grading records found'}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>
              {searchQuery || statusFilter !== 'ALL' || scoreFilter !== 'ALL'
                ? (isVi ? 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.' : 'No entries match your current search criteria or filters.')
                : (isVi ? 'Nhật ký sẽ hiển thị khi học sinh nộp bài và bài làm được xử lý chấm.' : 'Entries will appear here as submissions are processed.')}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || scoreFilter !== 'ALL') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setScoreFilter('ALL');
                }}
                style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>{isVi ? 'Đặt lại bộ lọc' : 'Reset Filters'}</span>
              </button>
            )}
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
