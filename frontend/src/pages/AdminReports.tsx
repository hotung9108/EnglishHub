import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Loader2, Calendar,
  Filter, RotateCcw, AlertCircle, X,
  TrendingDown, User, ChevronDown, Clock
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { reportService } from '../api/services/report.service';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
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

export const AdminReports: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

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

  // Available classes for dropdown based on selected teacher
  const availableClasses = filterAvailableClasses(allClasses, selectedTeacherId);

  // Filtered report classes based on selected class cohort
  const filteredClasses = filterReportClasses(reportClasses, selectedClassId);

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

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <span>{t('adminReports.title')}</span>
          </h1>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="eh-card p-5 mb-6 border border-border shadow-sm rounded-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pb-3 border-b border-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Filter size={16} />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>{isVi ? 'Bộ Lọc Phân Tích & Thời Gian' : 'Analytical Filters & Date Range'}</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/15 text-primary">
                    {activeFilterCount} {isVi ? 'đang áp dụng' : 'active'}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted">
                {isVi ? 'Tùy chỉnh khoảng thời gian, giảng viên hoặc lớp học để tổng hợp chỉ số' : 'Filter telemetry metrics by date interval, instructor or class cohort'}
              </p>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw size={14} />}
              onClick={handleResetFilters}
            >
              {isVi ? 'Xóa bộ lọc' : 'Reset Filters'}
            </Button>
          )}
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-medium text-text-muted flex items-center gap-1.5 mr-1">
            <Clock size={13} className="text-primary" />
            {isVi ? 'Chọn nhanh:' : 'Quick Presets:'}
          </span>
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !fromDate && !toDate
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant border border-outline-variant/50'
            }`}
            onClick={() => handleApplyPreset('all')}
          >
            {isVi ? 'Toàn thời gian' : 'All time'}
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              fromDate === getPresetDates('today').from && toDate === getPresetDates('today').to
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant border border-outline-variant/50'
            }`}
            onClick={() => handleApplyPreset('today')}
          >
            {isVi ? 'Hôm nay' : 'Today'}
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              fromDate === getPresetDates('7days').from && toDate === getPresetDates('7days').to
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant border border-outline-variant/50'
            }`}
            onClick={() => handleApplyPreset('7days')}
          >
            {isVi ? '7 ngày qua' : 'Last 7 days'}
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              fromDate === getPresetDates('30days').from && toDate === getPresetDates('30days').to
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant border border-outline-variant/50'
            }`}
            onClick={() => handleApplyPreset('30days')}
          >
            {isVi ? '30 ngày qua' : 'Last 30 days'}
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              fromDate === getPresetDates('thisMonth').from && toDate === getPresetDates('thisMonth').to
                ? 'bg-primary text-white shadow-xs font-semibold'
                : 'bg-surface-variant/40 text-on-surface-variant hover:bg-surface-variant border border-outline-variant/50'
            }`}
            onClick={() => handleApplyPreset('thisMonth')}
          >
            {isVi ? 'Tháng này' : 'This month'}
          </button>
        </div>

        {/* Filter Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* From Date */}
          <div className="adm-filter-group">
            <label className="adm-filter-label">
              <Calendar size={13} className="text-primary" />
              <span>{isVi ? 'Từ ngày' : 'From Date'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <Calendar size={15} />
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
              <Calendar size={13} className="text-primary" />
              <span>{isVi ? 'Đến ngày' : 'To Date'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <Calendar size={15} />
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
              <User size={13} className="text-primary" />
              <span>{isVi ? 'Giáo viên phụ trách' : 'Instructor'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <User size={15} />
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
                <ChevronDown size={14} />
              </span>
            </div>
          </div>

          {/* Class Filter */}
          <div className="adm-filter-group">
            <label className="adm-filter-label">
              <BookOpen size={13} className="text-primary" />
              <span>{isVi ? 'Lớp học' : 'Class Cohort'}</span>
            </label>
            <div className="adm-filter-control-wrap">
              <span className="adm-filter-control-icon">
                <BookOpen size={15} />
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
                <ChevronDown size={14} />
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
      </div>

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
            <EmptyState
              icon={<BookOpen size={36} />}
              title={isVi ? 'Chưa có dữ liệu thống kê lớp học' : 'No class performance data recorded'}
              description={
                selectedClassId !== undefined || selectedTeacherId !== undefined || fromDate || toDate
                  ? (isVi ? 'Không tìm thấy dữ liệu thống kê phù hợp với bộ lọc hiện tại.' : 'No performance data matching the active filters.')
                  : (isVi ? 'Thử mở rộng khoảng thời gian hoặc chọn lớp học khác.' : 'Try adjusting the date range or selecting another class.')
              }
            />
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
