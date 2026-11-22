import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  BookOpen, Loader2, Calendar,
  Filter, RotateCcw, AlertCircle, X,
  TrendingDown, User, ChevronDown, Clock, Download, Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { reportService } from '../api/services/report.service';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
import { submissionService } from '../api/services/submission.service';
import type { 
  ReportOverviewResponse, 
  ReportClassSummary, 
  ReportClassProgressResponse 
} from '../types/report.types';
import type { UserListItem } from '../api/services/user.service';
import type { ClassSummary } from '../api/services/class.service';
import { Button, MetricCard, EmptyState, Pagination } from '../components/common';
import {
  filterReportClasses,
  filterAvailableClasses,
  reconcileSelectedClass,
  computeReportPagination,
} from '../utils/reportFilters.utils';

type TotalState = 'loading' | 'error' | number;

const totalRequests = {
  users: (signal: AbortSignal) => userService.listUsers({ page: 1, limit: 1 }, { signal }),
  submitted: (signal: AbortSignal) =>
    submissionService.listSubmissions({ page: 1, limit: 1, status: 'SUBMITTED' }, { signal }),
  graded: (signal: AbortSignal) =>
    submissionService.listSubmissions({ page: 1, limit: 1, status: 'GRADED' }, { signal }),
};
type TotalSource = keyof typeof totalRequests;

function getSubmissionTotal(submitted: TotalState, graded: TotalState): TotalState {
  if (submitted === 'error' || graded === 'error') return 'error';
  if (submitted === 'loading' || graded === 'loading') return 'loading';
  return submitted + graded;
}

export const AdminReports: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [totals, setTotals] = useState<Record<TotalSource, TotalState>>({
    users: 'loading', submitted: 'loading', graded: 'loading',
  });
  const totalsRequest = useRef<AbortController | null>(null);

  const loadTotal = useCallback(async (source: TotalSource, signal: AbortSignal) => {
    let result: TotalState;
    try {
      const response = await totalRequests[source](signal);
      const total = response.pagination?.total;
      result = typeof total === 'number' && Number.isFinite(total) && total >= 0 ? total : 'error';
    } catch {
      result = 'error';
    }
    if (!signal.aborted) setTotals(previous => ({ ...previous, [source]: result }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    totalsRequest.current = controller;
    // StrictMode can clean up the first effect before starting its replacement.
    queueMicrotask(() => {
      if (controller.signal.aborted) return;
      void loadTotal('users', controller.signal);
      void loadTotal('submitted', controller.signal);
      void loadTotal('graded', controller.signal);
    });
    return () => controller.abort();
  }, [loadTotal]);

  const retryTotal = (...sources: TotalSource[]) => {
    const controller = totalsRequest.current;
    if (!controller) return;
    for (const source of sources) {
      if (totals[source] !== 'error') continue;
      setTotals(previous => ({ ...previous, [source]: 'loading' }));
      void loadTotal(source, controller.signal);
    }
  };

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setCurrentPage(1);
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setCurrentPage(1);
  };

  const handleTeacherChange = (id: number | undefined) => {
    setSelectedTeacherId(id);
    setSelectedClassId(reconcileSelectedClass(selectedClassId, id, allClasses));
    setInspectingClass(null);
    setClassProgress(null);
    setCurrentPage(1);
  };

  const handleClassChange = (id: number | undefined) => {
    setSelectedClassId(id);
    setInspectingClass(null);
    setClassProgress(null);
    setCurrentPage(1);
  };

  // Quick date presets helper
  const getPresetDates = (preset: 'today' | '7days' | '30days' | 'thisMonth') => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const toStr = formatDate(today);
    let fromStr = '';

    if (preset === 'today') {
      fromStr = toStr;
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      fromStr = formatDate(d);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      fromStr = formatDate(d);
    } else if (preset === 'thisMonth') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      fromStr = formatDate(d);
    }
    return { from: fromStr, to: toStr };
  };

  const handleApplyPreset = (preset: 'today' | '7days' | '30days' | 'thisMonth' | 'all') => {
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
    } else {
      const { from, to } = getPresetDates(preset);
      setFromDate(from);
      setToDate(to);
    }
    setCurrentPage(1);
  };

  const activeFilterCount = 
    (fromDate ? 1 : 0) + 
    (toDate ? 1 : 0) + 
    (selectedTeacherId !== undefined ? 1 : 0) + 
    (selectedClassId !== undefined ? 1 : 0);

  // Report Data
  const [overview, setOverview] = useState<ReportOverviewResponse | null>(null);
  const [reportClasses, setReportClasses] = useState<ReportClassSummary[]>([]);
  const [teachers, setTeachers] = useState<UserListItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassSummary[]>([]);
  const showOverview = !loading && !error && overview;
  const noMatchingClasses = showOverview && overview.classCount === 0;
  const noAssignedWork = showOverview
    && overview.classCount > 0
    && overview.assignedAssignmentCount === 0
    && overview.pendingGradingCount === 0
    && (overview.averageScorePercent ?? 0) === 0;

  // Available classes for dropdown based on selected teacher
  const availableClasses = filterAvailableClasses(allClasses, selectedTeacherId);

  // Filtered report classes based on selected class cohort
  const filteredClasses = filterReportClasses(reportClasses, selectedClassId);

  // Score distribution calculation across filtered classes (Issue #374)
  const scoreDistribution = useMemo(() => {
    let excellent = 0; // >= 85%
    let good = 0;      // 70 - 84%
    let average = 0;   // 50 - 69%
    let poor = 0;      // < 50%

    filteredClasses.forEach((cls) => {
      const score = cls.averageScorePercent;
      if (score >= 85) excellent++;
      else if (score >= 70) good++;
      else if (score >= 50) average++;
      else poor++;
    });

    const total = filteredClasses.length;
    return {
      excellent,
      good,
      average,
      poor,
      total,
      pctExcellent: total > 0 ? Math.round((excellent / total) * 100) : 0,
      pctGood: total > 0 ? Math.round((good / total) * 100) : 0,
      pctAverage: total > 0 ? Math.round((average / total) * 100) : 0,
      pctPoor: total > 0 ? Math.round((poor / total) * 100) : 0,
    };
  }, [filteredClasses]);

  // Class Progress Modal
  const [inspectingClass, setInspectingClass] = useState<ReportClassSummary | null>(null);
  const [classProgress, setClassProgress] = useState<ReportClassProgressResponse | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Initial load of teacher and class options
  useEffect(() => {
    let isMounted = true;
    const loadFilterOptions = async () => {
      try {
        const [tcRes, clRes] = await Promise.allSettled([
          userService.listUsers({ role: 'TEACHER', limit: 100 }),
          classService.list({ page: 1, limit: 100 })
        ]);

        if (!isMounted) return;

        if (tcRes.status === 'fulfilled') {
          setTeachers(tcRes.value.data || []);
        }
        if (clRes.status === 'fulfilled') {
          setAllClasses(clRes.value.data || []);
        }
      } catch {
        // filter options fallback
      }
    };

    loadFilterOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch report metrics
  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        setTableError(null);

        const [ovRes, clRes] = await Promise.allSettled([
          reportService.getOverview({
            from: fromDate || undefined,
            to: toDate || undefined,
            teacherId: selectedTeacherId,
            classId: selectedClassId,
          }),
          reportService.listClasses({
            from: fromDate || undefined,
            to: toDate || undefined,
            teacherId: selectedTeacherId,
            page: 1,
            limit: 100,
          })
        ]);

        if (!isMounted) return;

        if (ovRes.status === 'fulfilled') {
          setOverview(ovRes.value);
        } else {
          setOverview(null);
          setError(ovRes.reason instanceof Error && ovRes.reason.message ? ovRes.reason.message : isVi ? 'Không thể tổng hợp báo cáo thời gian thực.' : 'Failed to aggregate telemetry reports.');
        }

        if (clRes.status === 'fulfilled') {
          setReportClasses(clRes.value.data || []);
        } else {
          setReportClasses([]);
          setTableError(clRes.reason instanceof Error && clRes.reason.message ? clRes.reason.message : isVi ? 'Không thể tải bảng báo cáo lớp học.' : 'Failed to load class reports.');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setOverview(null);
          setReportClasses([]);
          setError(err instanceof Error && err.message ? err.message : isVi ? 'Không thể tổng hợp báo cáo thời gian thực.' : 'Failed to aggregate telemetry reports.');
          setTableError(err instanceof Error && err.message ? err.message : isVi ? 'Không thể tải bảng báo cáo lớp học.' : 'Failed to load class reports.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [fromDate, toDate, selectedTeacherId, selectedClassId, refreshKey, isVi]);

  // Inspect class details
  const handleOpenClassProgress = async (cls: ReportClassSummary) => {
    setInspectingClass(cls);
    setClassProgress(null);
    setProgressError(null);
    setLoadingProgress(true);

    try {
      const res = await reportService.getClassProgress(cls.classId, {
        from: fromDate || undefined,
        to: toDate || undefined,
      });
      setClassProgress(res);
    } catch (err: unknown) {
      setProgressError(err instanceof Error ? err.message : isVi ? 'Không thể tải chi tiết tiến độ lớp.' : 'Failed to load cohort progress.');
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setSelectedTeacherId(undefined);
    setSelectedClassId(undefined);
    setCurrentPage(1);
    setInspectingClass(null);
    setClassProgress(null);
  };

  const handleExportCSV = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `bao_cao_thong_ke_${timestamp}.csv`;

    const headers = [
      isVi ? 'Mã lớp' : 'Class ID',
      isVi ? 'Tên lớp học' : 'Class Name',
      isVi ? 'Trạng thái' : 'Status',
      isVi ? 'Bài tập đã giao' : 'Assignments Assigned',
      isVi ? 'Tỷ lệ hoàn thành (%)' : 'Completion Rate (%)',
      isVi ? 'Điểm trung bình (%)' : 'Average Score (%)',
    ];

    const escapeCsv = (str: string | number) => {
      const s = String(str);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows: string[][] = [
      [isVi ? 'BÁO CÁO THỐNG KÊ HỆ THỐNG ENGLIS开放' : 'SYSTEM REPORTS EXPORT'],
      [isVi ? 'Thời gian xuất' : 'Exported At', new Date().toLocaleString()],
      [isVi ? 'Khoảng thời gian' : 'Time Interval', `${fromDate || (isVi ? 'Tất cả' : 'All')} - ${toDate || (isVi ? 'Hiện tại' : 'Now')}`],
      [],
      [isVi ? 'TỔNG QUAN HỆ THỐNG' : 'SYSTEM OVERVIEW'],
      [isVi ? 'Tổng số lớp' : 'Total Classes', String(overview?.classCount ?? 0)],
      [isVi ? 'Tổng bài tập đã giao' : 'Total Assignments Assigned', String(overview?.assignedAssignmentCount ?? 0)],
      [isVi ? 'Tỷ lệ hoàn thành trung bình' : 'Avg Completion Rate', `${overview?.completionRatePercent ?? 0}%`],
      [isVi ? 'Điểm trung bình toàn hệ thống' : 'Avg System Score', `${overview?.averageScorePercent ?? 0}%`],
      [isVi ? 'Bài tập chờ chấm' : 'Pending Grading', String(overview?.pendingGradingCount ?? 0)],
      [],
      [isVi ? 'CHI TIẾT CÁC LỚP HỌC' : 'CLASS COHORTS BREAKDOWN'],
      headers,
    ];

    for (const cls of filteredClasses) {
      const statusLabel = cls.status === 'ACTIVE'
        ? (isVi ? 'Đang hoạt động' : 'Active')
        : (isVi ? 'Đã hoàn thành' : 'Completed');

      rows.push([
        String(cls.classId),
        cls.className,
        statusLabel,
        String(cls.assignedAssignmentCount),
        `${cls.completionRatePercent}%`,
        `${cls.averageScorePercent}%`,
      ]);
    }

    const csvContent = '\uFEFF' + rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalCard = (title: string, value: TotalState, retryLabel: string, ...sources: TotalSource[]) => (
    <MetricCard
      title={title}
      value={typeof value === 'number' ? value : t(`adminReports.total.${value}`)}
      footerText={value === 'error' && (
        <Button variant="secondary" size="sm" aria-label={retryLabel} onClick={() => retryTotal(...sources)}>
          {t('adminReports.totalRetry')}
        </Button>
      )}
    />
  );

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <span>{t('adminReports.title')}</span>
          </h1>
        </div>
        <div>
          <Button
            variant="secondary"
            icon={Download}
            onClick={handleExportCSV}
            disabled={loading || filteredClasses.length === 0}
            title={isVi ? 'Xuất toàn bộ dữ liệu báo cáo ra định dạng CSV (Excel)' : 'Export analytics data to CSV'}
          >
            {isVi ? 'Xuất báo cáo (CSV)' : 'Export CSV Report'}
          </Button>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="eh-card p-6 mb-6 border border-border shadow-xs rounded-xl bg-surface">
        {/* Top Header Row: Title & Active Count on Left, Quick Presets & Reset on Right */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-5 border-b border-border-light">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Filter size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-text-primary flex items-center gap-2.5">
                <span>{isVi ? 'Bộ lọc dữ liệu báo cáo' : 'Report Analytics Filters'}</span>
                {activeFilterCount > 0 && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary/15 text-primary">
                    {activeFilterCount} {isVi ? 'đang áp dụng' : 'active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {isVi ? 'Tùy chỉnh khoảng thời gian, giảng viên hoặc lớp học' : 'Filter telemetry metrics by date interval, instructor or class cohort'}
              </p>
            </div>
          </div>

          {/* Quick Date Presets & Reset Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mr-1">
              <Clock size={14} className="text-primary" />
              {isVi ? 'Mốc nhanh:' : 'Quick Range:'}
            </span>
            <div className="inline-flex items-center gap-1 bg-surface-variant/30 p-1 rounded-lg border border-border-light">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  !fromDate && !toDate
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                onClick={() => handleApplyPreset('all')}
              >
                {isVi ? 'Toàn thời gian' : 'All time'}
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  fromDate === getPresetDates('today').from && toDate === getPresetDates('today').to
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                onClick={() => handleApplyPreset('today')}
              >
                {isVi ? 'Hôm nay' : 'Today'}
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  fromDate === getPresetDates('7days').from && toDate === getPresetDates('7days').to
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                onClick={() => handleApplyPreset('7days')}
              >
                {isVi ? '7 ngày qua' : 'Last 7 days'}
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  fromDate === getPresetDates('30days').from && toDate === getPresetDates('30days').to
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                onClick={() => handleApplyPreset('30days')}
              >
                {isVi ? '30 ngày qua' : 'Last 30 days'}
              </button>
              <button
                type="button"
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  fromDate === getPresetDates('thisMonth').from && toDate === getPresetDates('thisMonth').to
                    ? 'bg-primary text-white shadow-xs font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`}
                onClick={() => handleApplyPreset('thisMonth')}
              >
                {isVi ? 'Tháng này' : 'This month'}
              </button>
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={handleResetFilters}
                className="h-8 text-xs font-medium px-3 ml-1"
              >
                {isVi ? 'Xóa bộ lọc' : 'Reset Filters'}
              </Button>
            )}
          </div>
        </div>

        {/* Filter Input Grid - Roomy, clearly labeled, standard readable typography */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* From Date */}
          <div className="adm-filter-group">
            <label className="adm-filter-label">
              <Calendar size={15} className="text-primary" />
              <span>{isVi ? 'Từ ngày' : 'From Date'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <Calendar size={16} />
              </span>
              <input 
                type="date" 
                className={`adm-filter-input ${fromDate ? 'has-value' : ''}`}
                value={fromDate}
                onChange={(e) => handleFromDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* To Date */}
          <div className="adm-filter-group">
            <label className="adm-filter-label">
              <Calendar size={15} className="text-primary" />
              <span>{isVi ? 'Đến ngày' : 'To Date'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <Calendar size={16} />
              </span>
              <input 
                type="date" 
                className={`adm-filter-input ${toDate ? 'has-value' : ''}`}
                value={toDate}
                onChange={(e) => handleToDateChange(e.target.value)}
              />
            </div>
          </div>

          {/* Teacher Filter */}
          <div className="adm-filter-group">
            <label className="adm-filter-label">
              <User size={15} className="text-primary" />
              <span>{isVi ? 'Giáo viên phụ trách' : 'Instructor'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <User size={16} />
              </span>
              <select
                className={`adm-filter-select ${selectedTeacherId !== undefined ? 'has-value' : ''}`}
                value={selectedTeacherId ?? ''}
                onChange={(e) => handleTeacherChange(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{isVi ? 'Tất cả giảng viên' : 'All Instructors'}</option>
                {teachers.map(tc => (
                  <option key={tc.id} value={tc.id}>
                    {tc.fullName} (GV-{String(tc.id).padStart(3, '0')})
                  </option>
                ))}
              </select>
              <span className="adm-filter-control-arrow">
                <ChevronDown size={15} />
              </span>
            </div>
          </div>

          {/* Class Filter */}
          <div className="adm-filter-group">
            <label className="adm-filter-label">
              <BookOpen size={15} className="text-primary" />
              <span>{isVi ? 'Lớp học' : 'Class Cohort'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <BookOpen size={16} />
              </span>
              <select
                className={`adm-filter-select ${selectedClassId !== undefined ? 'has-value' : ''}`}
                value={selectedClassId ?? ''}
                onChange={(e) => handleClassChange(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{isVi ? 'Tất cả lớp học' : 'All Classes'}</option>
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="adm-filter-control-arrow">
                <ChevronDown size={15} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="adm-alert-error justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Button 
            variant="secondary"
            size="sm"
            onClick={() => setRefreshKey(prev => prev + 1)}
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Main KPI Strip */}
      <div className="adm-kpi-grid mb-6">
        <MetricCard
          title={isVi ? 'TỔNG LỚP ĐANG THEO DÕI' : 'MONITORED CLASSES'}
          value={loading ? '...' : error ? '—' : (overview?.classCount ?? filteredClasses.length)}
        />

        <MetricCard
          title={isVi ? 'TỶ LỆ HOÀN THÀNH BÀI TẬP' : 'COMPLETION RATE'}
          value={loading ? '...' : error ? '—' : `${overview?.completionRatePercent ?? 0}%`}
        />

        <MetricCard
          title={isVi ? 'ĐIỂM TRUNG BÌNH TOÀN KHÓA' : 'AVERAGE SCORE'}
          value={loading ? '...' : error ? '—' : `${overview?.averageScorePercent ?? 0}%`}
        />

        <MetricCard
          title={isVi ? 'BÀI TẬP CHỜ CHẤM' : 'PENDING GRADING'}
          value={loading ? '...' : error ? '—' : (overview?.pendingGradingCount ?? 0)}
        />
        {totalCard(t('adminReports.totalUsers'), totals.users, t('adminReports.retryTotalUsers'), 'users')}
        {totalCard(
          t('adminReports.totalSubmissions'),
          getSubmissionTotal(totals.submitted, totals.graded),
          t('adminReports.retryTotalSubmissions'),
          'submitted', 'graded',
        )}
        <MetricCard
          title={isVi ? 'TỔNG BÀI TẬP ĐÃ GIAO' : 'TOTAL ASSIGNMENTS'}
          value={loading ? '...' : error ? '—' : (overview?.assignedAssignmentCount ?? 0)}
        />
      </div>

      {/* Phổ Điểm Hệ Thống Theo Lớp Học (Score Distribution - Issue #374) */}
      {!loading && !error && filteredClasses.length > 0 && (
        <div className="eh-card p-5 mb-6 border border-border shadow-xs rounded-xl bg-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="font-bold text-sm text-text-primary flex items-center gap-2">
              <Award size={18} className="text-primary" />
              <span>{isVi ? 'Phổ Điểm Thống Kê Theo Lớp Học' : 'Cohort Score Distribution'}</span>
            </div>
            <div className="text-xs text-text-muted">
              {isVi ? `Dựa trên ${scoreDistribution.total} lớp học trong phạm vi lọc` : `Based on ${scoreDistribution.total} filtered class cohorts`}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="font-medium text-emerald-700 dark:text-emerald-300">
                {isVi ? 'Xuất sắc (≥ 85%)' : 'Excellent (≥ 85%)'}
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                {scoreDistribution.excellent} <span className="text-xs font-normal">({scoreDistribution.pctExcellent}%)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="font-medium text-blue-700 dark:text-blue-300">
                {isVi ? 'Khá - Giỏi (70% - 84%)' : 'Good (70% - 84%)'}
              </div>
              <div className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300 mt-0.5">
                {scoreDistribution.good} <span className="text-xs font-normal">({scoreDistribution.pctGood}%)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="font-medium text-amber-700 dark:text-amber-300">
                {isVi ? 'Trung bình (50% - 69%)' : 'Average (50% - 69%)'}
              </div>
              <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                {scoreDistribution.average} <span className="text-xs font-normal">({scoreDistribution.pctAverage}%)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
              <div className="font-medium text-rose-700 dark:text-rose-300">
                {isVi ? 'Cần cải thiện (< 50%)' : 'Needs Focus (< 50%)'}
              </div>
              <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                {scoreDistribution.poor} <span className="text-xs font-normal">({scoreDistribution.pctPoor}%)</span>
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-surface-variant/30">
            {scoreDistribution.pctExcellent > 0 && (
              <div style={{ width: `${scoreDistribution.pctExcellent}%` }} className="bg-emerald-500 transition-all" title={`Xuất sắc: ${scoreDistribution.pctExcellent}%`} />
            )}
            {scoreDistribution.pctGood > 0 && (
              <div style={{ width: `${scoreDistribution.pctGood}%` }} className="bg-blue-500 transition-all" title={`Khá: ${scoreDistribution.pctGood}%`} />
            )}
            {scoreDistribution.pctAverage > 0 && (
              <div style={{ width: `${scoreDistribution.pctAverage}%` }} className="bg-amber-500 transition-all" title={`Trung bình: ${scoreDistribution.pctAverage}%`} />
            )}
            {scoreDistribution.pctPoor > 0 && (
              <div style={{ width: `${scoreDistribution.pctPoor}%` }} className="bg-rose-500 transition-all" title={`Cần cải thiện: ${scoreDistribution.pctPoor}%`} />
            )}
          </div>
        </div>
      )}

      {noMatchingClasses && (
        <EmptyState
          icon={<BookOpen size={36} />}
          title={t('adminReports.noMatchingClasses')}
          description={t('adminReports.noMatchingClassesDescription')}
        />
      )}
      {noAssignedWork && (
        <EmptyState
          icon={<BookOpen size={36} />}
          title={t('adminReports.noAssignedWork')}
          description={t('adminReports.noAssignedWorkDescription')}
        />
      )}

      {loading ? (
        <div className="p-8 text-center text-muted">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" />
          <div>{isVi ? 'Đang tổng hợp báo cáo...' : 'Aggregating reports...'}</div>
        </div>
      ) : (
        <div className="adm-table-card">
          {tableError ? (
            <div className="adm-alert-error justify-between" role="alert">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{tableError}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRefreshKey(prev => prev + 1)}
              >
                {isVi ? 'Thử lại' : 'Retry'}
              </Button>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="flex flex-col items-center">
              <EmptyState
                icon={<BookOpen size={36} />}
                title={isVi ? 'Chưa có dữ liệu thống kê lớp học' : 'No class performance data recorded'}
                description={
                  selectedClassId !== undefined || selectedTeacherId !== undefined || fromDate || toDate
                    ? (isVi ? 'Không tìm thấy dữ liệu thống kê phù hợp với bộ lọc hiện tại.' : 'No performance data matching the active filters.')
                    : (isVi ? 'Thử mở rộng khoảng thời gian hoặc chọn lớp học khác.' : 'Try adjusting the date range or selecting another class.')
                }
              />
              {(fromDate || toDate) && (
                <div className="flex items-center gap-2 pb-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApplyPreset('30days')}
                  >
                    {isVi ? 'Xem 30 ngày qua' : 'View Last 30 Days'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleApplyPreset('all')}
                  >
                    {isVi ? 'Xem toàn thời gian' : 'View All Time'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleResetFilters}
                  >
                    {isVi ? 'Xóa bộ lọc' : 'Reset Filters'}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            (() => {
              const { totalPages, safeCurrentPage, startIndex, endIndex } = computeReportPagination(
                filteredClasses.length,
                currentPage,
                pageSize
              );

              const paginatedClasses = filteredClasses.slice(startIndex, endIndex);

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                          <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                          <th>{isVi ? 'BÀI TẬP ĐÃ GIAO' : 'ASSIGNMENTS'}</th>
                          <th>{isVi ? 'ĐIỂM TRUNG BÌNH' : 'AVERAGE SCORE'}</th>
                          <th>{isVi ? 'TỶ LỆ NỘP BÀI' : 'COMPLETION'}</th>
                          <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                          <th className="text-right">{isVi ? 'TIẾN ĐỘ' : 'ACTION'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedClasses.map((cls) => (
                          <tr key={cls.classId}>
                            <td className="font-semibold text-primary font-mono">ENG-{cls.classId}</td>
                            <td className="font-medium">{cls.className}</td>
                            <td>{cls.assignedAssignmentCount} {isVi ? 'bài' : 'hw'}</td>
                            <td className="font-bold text-primary font-mono">{cls.averageScorePercent}%</td>
                            <td>
                              <span className="badge badge-active">{cls.completionRatePercent}%</span>
                            </td>
                            <td>
                              <span className={`badge ${cls.completionRatePercent >= 70 ? 'badge-active' : 'badge-onleave'}`}>
                                {cls.completionRatePercent >= 70 ? (isVi ? 'Đạt mục tiêu' : 'On Target') : (isVi ? 'Cần cải thiện' : 'Needs Focus')}
                              </span>
                            </td>
                            <td className="text-right">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleOpenClassProgress(cls)}
                              >
                                {isVi ? 'Chi tiết' : 'Progress'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredClasses.length > 0 && (
                    <Pagination
                      currentPage={safeCurrentPage}
                      totalPages={totalPages}
                      totalItems={filteredClasses.length}
                      itemLabel={isVi ? 'lớp học' : 'classes'}
                      isVi={isVi}
                      onPageChange={setCurrentPage}
                      pageSize={pageSize}
                      onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                      }}
                      pageSizeOptions={[5, 10, 20]}
                      variant="table"
                    />
                  )}
                </>
              );

            })()
          )}
        </div>
      )}

      {/* Class Progress Modal / Drawer */}
      {inspectingClass && (
        <div className="adm-drawer-backdrop" onClick={() => setInspectingClass(null)}>
          <div className="adm-drawer max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="adm-drawer-header">
              <div>
                <h2 className="adm-drawer-title">
                  {isVi ? `Tiến Độ Chi Tiết: ${inspectingClass.className}` : `Cohort Progress: ${inspectingClass.className}`}
                </h2>
                <div className="text-xs text-muted mt-1 font-mono">
                  ENG-{inspectingClass.classId}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setInspectingClass(null)}
                className="btn-ghost p-1 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="adm-drawer-body flex flex-col gap-4">
              {loadingProgress ? (
                <div className="p-8 text-center text-muted">
                  <Loader2 size={28} className="animate-spin mx-auto mb-2" />
                  <div>{isVi ? 'Đang tải chi tiết tiến độ lớp...' : 'Loading cohort progress...'}</div>
                </div>
              ) : progressError ? (
                <div className="adm-alert-error">
                  {progressError}
                </div>
              ) : classProgress ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-md bg-surface-low border-subtle">
                      <div className="label-sm text-muted">{isVi ? 'Sĩ số' : 'Cohort Size'}</div>
                      <div className="text-lg font-bold mt-1 text-surface">{classProgress.totalStudentCount}</div>
                    </div>
                    <div className="p-3 rounded-md bg-surface-low border-subtle">
                      <div className="label-sm text-muted">{isVi ? 'Đã có điểm' : 'Graded'}</div>
                      <div className="text-lg font-bold mt-1 text-success">{classProgress.scoredStudentCount}</div>
                    </div>
                    <div className="p-3 rounded-md bg-surface-low border-subtle">
                      <div className="label-sm text-muted">{isVi ? 'Tỷ lệ hoàn thành' : 'Completion'}</div>
                      <div className="text-lg font-bold mt-1 text-primary">{classProgress.completionRatePercent}%</div>
                    </div>
                    <div className="p-3 rounded-md bg-surface-low border-subtle">
                      <div className="label-sm text-muted">{isVi ? 'Dưới trung bình' : 'Below Avg'}</div>
                      <div className="text-lg font-bold mt-1 text-error">{classProgress.belowAverageCount}</div>
                    </div>
                  </div>

                  {/* Assignment Scores */}
                  {classProgress.assignmentScores.length > 0 && (
                    <div className="eh-card p-4">
                      <h4 className="m-0 mb-3 text-sm font-bold text-surface">
                        {isVi ? 'Điểm trung bình theo bài tập' : 'Assignment Averages'}
                      </h4>
                      <div className="flex flex-col gap-2">
                        {classProgress.assignmentScores.map(as => (
                          <div key={as.assignmentId} className="flex justify-between items-center text-sm pb-2 border-b-subtle">
                            <span>{as.title}</span>
                            <span className="font-mono font-bold text-primary">{as.averageScorePercent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lagging Students */}
                  {classProgress.laggingStudents.length > 0 && (
                    <div className="eh-card p-4">
                      <h4 className="m-0 mb-3 text-sm font-bold text-error flex items-center gap-2">
                        <TrendingDown size={16} />
                        <span>{isVi ? 'Học viên cần hỗ trợ thêm' : 'Students Needing Support'}</span>
                      </h4>
                      <div className="flex flex-col gap-2">
                        {classProgress.laggingStudents.map(st => (
                          <div key={st.studentId} className="flex justify-between items-center text-sm pb-2 border-b-subtle">
                            <span>{st.fullName}</span>
                            <span className="font-mono text-error font-semibold">{st.averageScorePercent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 text-center text-muted">
                  {isVi ? 'Không có thêm thông tin tiến độ cho lớp này.' : 'No additional progress data available.'}
                </div>
              )}
            </div>

            <div className="adm-drawer-footer">
              <Button 
                variant="secondary"
                type="button" 
                onClick={() => setInspectingClass(null)}
              >
                {isVi ? 'Đóng' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
