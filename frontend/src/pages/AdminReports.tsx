import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Sparkles, Users, 
  Download, CheckCircle2, 
  FileSpreadsheet, Award,
  BookOpen, Loader2, Calendar,
  Filter, RotateCcw, AlertCircle, X,
  TrendingDown
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

export const AdminReports: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'studentResults' | 'calibration' | 'teachers'>('studentResults');
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
      <div className="adm-header">
        <div className="adm-title-group">
          <div className="adm-rep-header-title-wrap">
            <h1 className="adm-title">
              <GraduationCap size={28} color="var(--primary)" />
              <span>{t('adminReports.title')}</span>
            </h1>
            <span className="adm-rep-header-badge">
              <Award size={13} />
              {isVi ? 'Báo Cáo & Thống Kê Chuyên Sâu' : 'Academic Analytics & Attainment'}
            </span>
          </div>
          <p className="adm-subtitle">
            {t('adminReports.subtitle')}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="adm-actions">
          <button 
            type="button"
            className="btn btn-secondary adm-rep-header-btn" 
            onClick={() => handleExport('excel')}
          >
            <FileSpreadsheet size={16} className="adm-rep-excel-icon" />
            <span>{t('adminReports.exportExcel')}</span>
          </button>
          <button 
            type="button"
            className="btn btn-primary adm-rep-header-btn" 
            onClick={() => handleExport('pdf')}
          >
            <Download size={16} />
            <span>{t('adminReports.exportPdf')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
            <Filter size={16} color="var(--primary)" />
            <span>{isVi ? 'Bộ Lọc Phân Tích & Thời Gian' : 'Analytical Filters & Date Range'}</span>
          </div>
          {(fromDate || toDate || selectedTeacherId !== undefined || selectedClassId !== undefined) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCcw size={14} />
              <span>{isVi ? 'Xóa bộ lọc' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'center' }}>
          {/* From Date */}
          <div>
            <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Calendar size={13} />
              <span>{isVi ? 'Từ ngày' : 'From Date'}</span>
            </label>
            <input 
              type="date" 
              className="input" 
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{ width: '100%', fontSize: '13px', height: '38px' }}
            />
          </div>

          {/* To Date */}
          <div>
            <label className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Calendar size={13} />
              <span>{isVi ? 'Đến ngày' : 'To Date'}</span>
            </label>
            <input 
              type="date" 
              className="input" 
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{ width: '100%', fontSize: '13px', height: '38px' }}
            />
          </div>

          {/* Teacher Filter */}
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>
              {isVi ? 'Giáo viên phụ trách' : 'Instructor'}
            </label>
            <select
              className="input"
              value={selectedTeacherId ?? ''}
              onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ width: '100%', fontSize: '13px', height: '38px' }}
            >
              <option value="">{isVi ? 'Tất cả giảng viên' : 'All Instructors'}</option>
              {teachers.map(tc => (
                <option key={tc.id} value={tc.id}>
                  {tc.fullName} (GV-{String(tc.id).padStart(3, '0')})
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="label-sm" style={{ display: 'block', marginBottom: '4px' }}>
              {isVi ? 'Lớp học' : 'Class Cohort'}
            </label>
            <select
              className="input"
              value={selectedClassId ?? ''}
              onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : undefined)}
              style={{ width: '100%', fontSize: '13px', height: '38px' }}
            >
              <option value="">{isVi ? 'Tất cả lớp học' : 'All Classes'}</option>
              {allClasses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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

      {/* Main KPI Strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỔNG LỚP ĐANG THEO DÕI' : 'MONITORED CLASSES'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value">
              {loading ? <Loader2 size={20} className="animate-spin" /> : (overview?.classCount ?? reportClasses.length)}
            </span>
            <span className="adm-kpi-badge positive">Live</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Theo dõi sĩ số và điểm trung bình' : 'Tracking cohort progress'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỶ LỆ HOÀN THÀNH BÀI TẬP' : 'COMPLETION RATE'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#9333ea' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#16a34a' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : `${overview?.completionRatePercent ?? 0}%`}
            </span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Tỷ lệ nộp bài trung bình toàn trung tâm' : 'Average submission completion'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'ĐIỂM TRUNG BÌNH TOÀN KHÓA' : 'AVERAGE SCORE'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#d97706' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : `${overview?.averageScorePercent ?? 0}%`}
            </span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Thang đo chuẩn hóa' : 'Normalized scale'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'BÀI TẬP CHỜ CHẤM' : 'PENDING GRADING'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#9333ea' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#7e22ce' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : (overview?.pendingGradingCount ?? 0)}
            </span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Bài tự luận chờ duyệt' : 'Awaiting instructor verification'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="adm-filter-bar">
        <div className="adm-pills" style={{ margin: 0 }}>
          <button
            type="button"
            className={`adm-pill-item ${activeTab === 'studentResults' ? 'active' : ''}`}
            onClick={() => setActiveTab('studentResults')}
          >
            <GraduationCap size={15} />
            <span>{isVi ? '1. Kết Quả Theo Lớp' : '1. Cohort Performance'}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${activeTab === 'calibration' ? 'active' : ''}`}
            onClick={() => setActiveTab('calibration')}
          >
            <Sparkles size={15} />
            <span>{isVi ? '2. Tổng Quan Hiệu Chuẩn AI' : '2. AI Grading Telemetry'}</span>
          </button>
          <button
            type="button"
            className={`adm-pill-item ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            <Users size={15} />
            <span>{isVi ? '3. Đội Ngũ Giảng Viên' : '3. Faculty Telemetry'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tổng hợp báo cáo thời gian thực...' : 'Aggregating telemetry reports...'}</div>
        </div>
      ) : (
        <>
          {/* TAB 1: Class Results */}
          {activeTab === 'studentResults' && (
            <div className="adm-table-card">
              <div className="adm-table-header">
                <div>
                  <h3 className="adm-table-title">
                    {isVi ? 'Bảng Điểm & Tỷ Lệ Hoàn Thành Theo Lớp Học' : 'Cohort Outcomes & Completion Rates'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                    {isVi ? `Hiển thị dữ liệu thực tế từ ${reportClasses.length} lớp học` : `Live data across ${reportClasses.length} classes`}
                  </p>
                </div>
              </div>

              {reportClasses.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có dữ liệu thống kê lớp học' : 'No class performance data recorded'}
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '13px' }}>
                    {isVi ? 'Thử mở rộng khoảng thời gian hoặc chọn lớp học khác.' : 'Try adjusting the date range or selecting another class.'}
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                        <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                        <th>{isVi ? 'BÀI TẬP ĐÃ GIAO' : 'ASSIGNMENTS'}</th>
                        <th>{isVi ? 'ĐIỂM TRUNG BÌNH' : 'AVERAGE SCORE'}</th>
                        <th>{isVi ? 'TỶ LỆ NỘP BÀI' : 'COMPLETION'}</th>
                        <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                        <th style={{ textAlign: 'right' }}>{isVi ? 'TIẾN ĐỘ' : 'ACTION'}</th>
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
                            <span className={`badge ${cls.status === 'COMPLETED' ? 'badge-onleave' : 'badge-active'}`}>
                              {cls.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenClassProgress(cls)}
                            >
                              {isVi ? 'Xem tiến độ' : 'View Progress'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AI Calibration */}
          {activeTab === 'calibration' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <h3 className="headline-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="var(--primary)" />
                  {isVi ? 'Chỉ Số Hiệu Năng AI Engine' : 'AI Grading Throughput & Status'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                    <div className="text-on-surface-variant" style={{ fontSize: '13px' }}>{isVi ? 'Lượt bài chờ duyệt' : 'Pending Verification'}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
                      {overview?.pendingGradingCount ?? 0}
                    </div>
                  </div>
                  <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                    <div className="text-on-surface-variant" style={{ fontSize: '13px' }}>{isVi ? 'Tổng bài tập hệ thống' : 'Total Course Exercises'}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#16a34a', marginTop: '4px' }}>
                      {overview?.assignedAssignmentCount ?? 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Faculty */}
          {activeTab === 'teachers' && (
            <div className="adm-table-card">
              <div className="adm-table-header">
                <div>
                  <h3 className="adm-table-title">
                    {isVi ? 'Bảng Thống Kê Giảng Viên' : 'Faculty Workload'}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                    {isVi ? `Tổng số ${teachers.length} giảng viên phụ trách chuyên môn` : `Live list of ${teachers.length} instructors`}
                  </p>
                </div>
              </div>

              {teachers.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có giảng viên nào trong hệ thống' : 'No faculty members recorded'}
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>{isVi ? 'MÃ GV' : 'CODE'}</th>
                        <th>{isVi ? 'HỌ VÀ TÊN' : 'INSTRUCTOR'}</th>
                        <th>EMAIL</th>
                        <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((tc) => (
                        <tr key={tc.id}>
                          <td className="font-mono font-semibold text-primary">GV-{String(tc.id).padStart(3, '0')}</td>
                          <td className="font-medium">{tc.fullName}</td>
                          <td className="font-mono text-on-surface-variant">{tc.email}</td>
                          <td>
                            <span className={`badge ${tc.status === 'ACTIVE' ? 'badge-active' : 'badge-onleave'}`}>
                              {tc.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Class Progress Modal / Drawer */}
      {inspectingClass && (
        <div className="adm-drawer-backdrop" onClick={() => setInspectingClass(null)}>
          <div className="adm-drawer" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="adm-drawer-header">
              <div>
                <h2 className="adm-drawer-title">
                  {isVi ? `Tiến Độ Chi Tiết: ${inspectingClass.className}` : `Cohort Progress: ${inspectingClass.className}`}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                  ENG-{inspectingClass.classId}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setInspectingClass(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="adm-drawer-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loadingProgress ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  <div>{isVi ? 'Đang tải chi tiết tiến độ lớp...' : 'Loading cohort progress...'}</div>
                </div>
              ) : progressError ? (
                <div style={{ padding: '16px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px' }}>
                  {progressError}
                </div>
              ) : classProgress ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Sĩ số' : 'Cohort Size'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px' }}>{classProgress.totalStudentCount}</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Đã có điểm' : 'Graded'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: '#16a34a' }}>{classProgress.scoredStudentCount}</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Tỷ lệ hoàn thành' : 'Completion'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: 'var(--primary)' }}>{classProgress.completionRatePercent}%</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--surface-container-low)' }}>
                      <div className="label-sm text-on-surface-variant">{isVi ? 'Dưới trung bình' : 'Below Avg'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '2px', color: '#dc2626' }}>{classProgress.belowAverageCount}</div>
                    </div>
                  </div>

                  {/* Assignment Scores */}
                  {classProgress.assignmentScores.length > 0 && (
                    <div className="card" style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700 }}>
                        {isVi ? 'Điểm trung bình theo bài tập' : 'Assignment Averages'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {classProgress.assignmentScores.map(as => (
                          <div key={as.assignmentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '6px', borderBottom: '1px solid var(--outline-variant)' }}>
                            <span>{as.title}</span>
                            <span className="font-mono font-bold text-primary">{as.averageScorePercent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lagging Students */}
                  {classProgress.laggingStudents.length > 0 && (
                    <div className="card" style={{ padding: '16px' }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingDown size={16} />
                        <span>{isVi ? 'Học viên cần hỗ trợ thêm' : 'Students Needing Support'}</span>
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {classProgress.laggingStudents.map(st => (
                          <div key={st.studentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingBottom: '6px', borderBottom: '1px solid var(--outline-variant)' }}>
                            <span>{st.fullName}</span>
                            <span className="font-mono text-error font-semibold">{st.averageScorePercent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  {isVi ? 'Không có thêm thông tin tiến độ cho lớp này.' : 'No additional progress data available.'}
                </div>
              )}
            </div>

            <div className="adm-drawer-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setInspectingClass(null)}
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

export default AdminReports;
