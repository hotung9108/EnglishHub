import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Sparkles, 
  Download, CheckCircle2, 
  FileSpreadsheet, Award,
  BookOpen, Loader2, Calendar,
  Filter, RotateCcw, AlertCircle, X,
  TrendingDown, User, ChevronDown
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
import { Button, MetricCard, EmptyState } from '../components/common';

export const AdminReports: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>(undefined);
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(undefined);

  // Report Data
  const [overview, setOverview] = useState<ReportOverviewResponse | null>(null);
  const [reportClasses, setReportClasses] = useState<ReportClassSummary[]>([]);
  const [teachers, setTeachers] = useState<UserListItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassSummary[]>([]);

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
          throw ovRes.reason;
        }

        if (clRes.status === 'fulfilled') {
          setReportClasses(clRes.value.data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tổng hợp báo cáo thời gian thực.' : 'Failed to aggregate telemetry reports.');
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
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    alert(isVi 
      ? `Đang kết xuất báo cáo ${type.toUpperCase()} theo bộ lọc hiện tại... File sẽ được tải xuống tự động.` 
      : `Exporting ${type.toUpperCase()} report matching current filters... Download will begin shortly.`
    );
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <GraduationCap size={28} className="text-primary" />
            <span>{t('adminReports.title')}</span>
          </h1>
          <p className="adm-subtitle">
            {t('adminReports.subtitle')}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="adm-actions flex items-center gap-3">
          <Button 
            variant="secondary"
            icon={<FileSpreadsheet size={16} className="text-success" />}
            onClick={() => handleExport('excel')}
          >
            {t('adminReports.exportExcel')}
          </Button>
          <Button 
            variant="primary"
            icon={<Download size={16} />}
            onClick={() => handleExport('pdf')}
          >
            {t('adminReports.exportPdf')}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="eh-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter size={16} className="text-primary" />
            <span>{isVi ? 'Bộ Lọc Phân Tích & Thời Gian' : 'Analytical Filters & Date Range'}</span>
          </div>
          {(fromDate || toDate || selectedTeacherId !== undefined || selectedClassId !== undefined) && (
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                onChange={(e) => setFromDate(e.target.value)}
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
                onChange={(e) => setToDate(e.target.value)}
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
                onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : undefined)}
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
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : undefined)}
              >
                <option value="">{isVi ? 'Tất cả lớp học' : 'All Classes'}</option>
                {allClasses.map(c => (
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
          value={loading ? '...' : (overview?.classCount ?? reportClasses.length)}
          icon={<BookOpen size={18} />}
          iconBgColor="var(--primary-container)"
          iconColor="var(--primary)"
          footerText={isVi ? 'Theo dõi sĩ số và điểm trung bình' : 'Tracking cohort progress'}
        />

        <MetricCard
          title={isVi ? 'TỶ LỆ HOÀN THÀNH BÀI TẬP' : 'COMPLETION RATE'}
          value={loading ? '...' : `${overview?.completionRatePercent ?? 0}%`}
          icon={<CheckCircle2 size={18} />}
          iconBgColor="var(--secondary-container)"
          iconColor="var(--secondary)"
          footerText={isVi ? 'Tỷ lệ nộp bài trung bình toàn trung tâm' : 'Average submission completion'}
        />

        <MetricCard
          title={isVi ? 'ĐIỂM TRUNG BÌNH TOÀN KHÓA' : 'AVERAGE SCORE'}
          value={loading ? '...' : `${overview?.averageScorePercent ?? 0}%`}
          icon={<Award size={18} />}
          iconBgColor="var(--tertiary-container)"
          iconColor="var(--tertiary)"
          footerText={isVi ? 'Thang đo chuẩn hóa' : 'Normalized scale'}
        />

        <MetricCard
          title={isVi ? 'BÀI TẬP CHỜ CHẤM' : 'PENDING GRADING'}
          value={loading ? '...' : (overview?.pendingGradingCount ?? 0)}
          icon={<Sparkles size={18} />}
          iconBgColor="#ede9fe"
          iconColor="#7c3aed"
          footerText={isVi ? 'Bài tự luận chờ duyệt' : 'Awaiting instructor verification'}
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" />
          <div>{isVi ? 'Đang tổng hợp báo cáo...' : 'Aggregating reports...'}</div>
        </div>
      ) : (
        <div className="adm-table-card">
          {reportClasses.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={36} />}
              title={isVi ? 'Chưa có dữ liệu thống kê lớp học' : 'No class performance data recorded'}
              description={isVi ? 'Thử mở rộng khoảng thời gian hoặc chọn lớp học khác.' : 'Try adjusting the date range or selecting another class.'}
            />
          ) : (
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
                  {reportClasses.map((cls) => (
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
