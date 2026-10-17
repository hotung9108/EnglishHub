import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, Search, Download, 
  X, 
  Loader2, AlertCircle,
  RotateCcw, CheckCircle2, FileText,
  Award, ChevronDown
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
import { Pagination } from '../components/common';

export const AdminGradingAuditLogs: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradings, setGradings] = useState<GradingSummaryResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GradingStatus>('ALL');
  const [scoreFilter, setScoreFilter] = useState<'ALL' | 'SCORED' | 'UNSCORED'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: 'ALL' | 'COMPLETED' | 'AI_GRADED' | 'PENDING' | 'FAILED') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleScoreFilterChange = (score: 'ALL' | 'SCORED' | 'UNSCORED') => {
    setScoreFilter(score);
    setCurrentPage(1);
  };

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

  const totalPages = Math.max(1, Math.ceil(filteredGradings.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedGradings = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredGradings.slice(start, start + pageSize);
  }, [filteredGradings, safeCurrentPage, pageSize]);

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
            <span>{t('auditLogs.title')}</span>
          </h1>
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
        <div className="adm-alert-error justify-between mb-6">
          <div className="flex items-center gap-2">
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
            onClick={() => handleStatusFilterChange('ALL')}
          >
            <span>{isVi ? 'Tất cả bài chấm' : 'All Gradings'}</span>
            <span className="adm-pill-badge">{gradings.length}</span>
          </button>
          <button
            type="button"
            className={`adm-pill ${statusFilter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('COMPLETED')}
          >
            <span>{isVi ? 'Đã hoàn tất' : 'Completed'}</span>
            <span className="adm-pill-badge">{countCompleted}</span>
          </button>
          <button
            type="button"
            className={`adm-pill ${statusFilter === 'AI_GRADED' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('AI_GRADED')}
          >
            <span>{isVi ? 'AI Đã chấm' : 'AI Graded'}</span>
            <span className="adm-pill-badge">{countAiGraded}</span>
          </button>
          <button
            type="button"
            className={`adm-pill ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => handleStatusFilterChange('PENDING')}
          >
            <span>{isVi ? 'Chờ duyệt' : 'Pending'}</span>
            <span className="adm-pill-badge">{countPending}</span>
          </button>
          {countFailed > 0 && (
            <button
              type="button"
              className={`adm-pill ${statusFilter === 'FAILED' ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange('FAILED')}
            >
              <span>{isVi ? 'Thất bại' : 'Failed'}</span>
              <span className="adm-pill-badge">{countFailed}</span>
            </button>
          )}
        </div>

        {/* Filter Controls: Score dropdown & Search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className={`adm-gh-select-wrap ${scoreFilter !== 'ALL' ? 'has-value' : ''}`}>
            <Award size={15} className="adm-gh-select-icon" />
            <select
              className={`adm-gh-select ${scoreFilter !== 'ALL' ? 'has-value' : ''}`}
              value={scoreFilter}
              onChange={(e) => handleScoreFilterChange(e.target.value as 'ALL' | 'SCORED' | 'UNSCORED')}
              aria-label={isVi ? 'Lọc theo mức điểm' : 'Filter by score'}
            >
              <option value="ALL">{isVi ? 'Tất cả mức điểm' : 'All Scores'}</option>
              <option value="SCORED">{isVi ? 'Đã có điểm chốt' : 'Has Final Score'}</option>
              <option value="UNSCORED">{isVi ? 'Chưa có điểm chốt' : 'No Final Score'}</option>
            </select>
            <ChevronDown size={14} className="adm-gh-select-arrow" />
          </div>

          {/* Search Input */}
          <div className="adm-search-wrap">
            <Search size={16} className="adm-search-icon" />
            <input 
              type="text" 
              className="adm-search-input"
              placeholder={isVi ? 'Tìm mã GR-..., điểm, trạng thái...' : 'Search GR-... ID, score, status...'}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button"
                className="adm-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title={isVi ? 'Xóa tìm kiếm' : 'Clear search'}
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
          <div className="adm-loading-state">
            <Loader2 size={32} className="animate-spin adm-loading-state-icon" />
            <div>{isVi ? 'Đang tải danh sách hồ sơ chấm điểm từ máy chủ...' : 'Loading grading records from server...'}</div>
          </div>
        ) : filteredGradings.length === 0 ? (
          <div className="adm-empty-state-card">
            <History size={40} className="adm-empty-state-icon" />
            <h3 className="adm-empty-state-title">
              {isVi ? 'Không tìm thấy hồ sơ chấm điểm nào' : 'No grading records found'}
            </h3>
            <p className="adm-empty-state-desc">
              {searchQuery || statusFilter !== 'ALL' || scoreFilter !== 'ALL'
                ? (isVi ? 'Không tìm thấy kết quả phù hợp với bộ lọc hiện tại.' : 'No entries match your current search criteria or filters.')
                : (isVi ? 'Nhật ký sẽ hiển thị khi học sinh nộp bài và bài làm được xử lý chấm.' : 'Entries will appear here as submissions are processed.')}
            </p>
            {(searchQuery || statusFilter !== 'ALL' || scoreFilter !== 'ALL') && (
              <button
                type="button"
                className="btn btn-secondary btn-sm mt-4 inline-flex items-center gap-1.5"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setScoreFilter('ALL');
                }}
              >
                <RotateCcw size={14} />
                <span>{isVi ? 'Đặt lại bộ lọc' : 'Reset Filters'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ CHẤM' : 'GRADING ID'}</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                  <th>{isVi ? 'ĐIỂM CHỐT' : 'FINAL SCORE'}</th>
                  <th className="text-right">{isVi ? 'NHẬT KÝ SỬA ĐIỂM' : 'AUDIT ACTION'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGradings.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => handleOpenDetail(item.id)}
                    className="cursor-pointer"
                  >
                    <td className="font-mono font-semibold text-primary">GR-{item.id}</td>
                    <td>{formatStatusBadge(item.status)}</td>
                    <td>
                      <span className={`font-bold font-mono text-[15px] ${item.finalScore !== null ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {item.finalScore !== null ? item.finalScore : (isVi ? 'Chưa có điểm' : 'Unscored')}
                      </span>
                    </td>
                    <td className="text-right">
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

        {/* Pagination */}
        {!loading && filteredGradings.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredGradings.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            itemLabel={isVi ? 'lượt chấm' : 'audit logs'}
            isVi={isVi}
            variant="table"
          />
        )}
      </div>

      {/* Drawer: Detailed Inspection and Change Logs */}
      {selectedGradingId !== null && (
        <div className="adm-drawer-backdrop" onClick={handleCloseDrawer}>
          <div className="adm-drawer adm-drawer-wide" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div>
                <h2 className="adm-drawer-title">
                  {isVi ? `Chi Tiết Kiểm Toán & Lịch Sử Sửa Điểm: GR-${selectedGradingId}` : `Grading Audit & Change Logs: GR-${selectedGradingId}`}
                </h2>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  Hồ sơ chấm điểm #GR-{selectedGradingId}
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCloseDrawer}
                className="adm-btn-ghost p-1 text-on-surface-variant"
                aria-label={isVi ? 'Đóng' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="adm-drawer-body flex flex-col gap-5">
              {loadingDrawer ? (
                <div className="adm-loading-state">
                  <Loader2 size={32} className="animate-spin adm-loading-state-icon" />
                  <div>{isVi ? 'Đang truy xuất thông tin chấm và nhật ký chỉnh sửa...' : 'Fetching grading context and change history...'}</div>
                </div>
              ) : drawerError ? (
                <div className="adm-alert-error">
                  {drawerError}
                </div>
              ) : gradingDetail ? (
                <>
                  {/* Status & Scores Strip */}
                  <div className="adm-drawer-metrics-grid">
                    <div className="adm-drawer-metric-item">
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Trạng thái' : 'Status'}</div>
                      <div className="mt-1">{formatStatusBadge(gradingDetail.status)}</div>
                    </div>
                    <div className="adm-drawer-metric-item">
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Phương thức' : 'Method'}</div>
                      <div className="font-semibold text-sm mt-1">{gradingDetail.method}</div>
                    </div>
                    <div className="adm-drawer-metric-item">
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Điểm chốt hiện tại' : 'Final Score'}</div>
                      <div className="adm-drawer-metric-val font-mono text-primary">
                        {gradingDetail.finalScore !== null ? gradingDetail.finalScore : '-'}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Notes */}
                  {gradingDetail.finalFeedback && (
                    <div className="card adm-drawer-feedback-card">
                      <div className="text-[13px] font-bold mb-1.5 flex items-center gap-1.5">
                        <FileText size={15} className="text-primary" />
                        <span>{isVi ? 'Lời phê chính thức' : 'Official Instructor Feedback'}</span>
                      </div>
                      <div className="text-[13.5px] leading-relaxed text-on-surface">
                        {gradingDetail.finalFeedback}
                      </div>
                    </div>
                  )}

                  {gradingDetail.aiFeedback && (
                    <div className="card adm-ai-feedback-card">
                      <div className="adm-ai-feedback-title">
                        {isVi ? 'Nhận xét từ AI Engine' : 'AI Engine Feedback'}
                      </div>
                      <div className="text-[13px] leading-relaxed">
                        {gradingDetail.aiFeedback}
                      </div>
                    </div>
                  )}

                  {/* REAL CHANGE LOGS SECTION */}
                  <div>
                    <h3 className="text-[15px] font-bold mb-2.5">
                      <span>{isVi ? 'Nhật Ký Các Lần Sửa Điểm (Change Logs Audit)' : 'Grading Adjustment History'}</span>
                    </h3>

                    {changeLogs.length === 0 ? (
                      <div className="p-6 text-center bg-surface-container-low rounded-lg text-on-surface-variant">
                        <CheckCircle2 size={28} className="mx-auto mb-2 text-emerald-600 opacity-80" />
                        <div className="font-semibold text-sm">
                          {isVi ? 'Chưa có lượt sửa điểm nào' : 'No grade changes recorded'}
                        </div>
                        <p className="mt-1 mb-0 text-[12.5px]">
                          {isVi 
                            ? 'Điểm số của bài làm này vẫn giữ nguyên vẹn từ lần chấm đầu tiên.' 
                            : 'The score for this submission remains unchanged from the initial evaluation.'}
                        </p>
                      </div>
                    ) : (
                      <div className="adm-audit-table-wrap">
                        <table className="adm-table m-0">
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
                                <td className="max-w-[200px] text-[13px]">
                                  {log.note || <span className="text-on-surface-variant italic">{isVi ? 'Không có ghi chú' : 'No note provided'}</span>}
                                </td>
                                <td className="font-mono text-on-surface-variant text-xs">
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
