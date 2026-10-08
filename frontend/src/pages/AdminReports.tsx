import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Sparkles, Users, 
  Download, CheckCircle2, 
  FileSpreadsheet, Award,
  BookOpen, Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { reportService } from '../api/services/report.service';
import { userService } from '../api/services/user.service';
import type { ReportOverviewResponse, ReportClassSummary } from '../types/report.types';
import type { UserListItem } from '../api/services/user.service';

export const AdminReports: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'studentResults' | 'calibration' | 'teachers'>('studentResults');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<ReportOverviewResponse | null>(null);
  const [reportClasses, setReportClasses] = useState<ReportClassSummary[]>([]);
  const [teachers, setTeachers] = useState<UserListItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchReports = async () => {
      try {
        setLoading(true);

        const [ovRes, clRes, tcRes] = await Promise.allSettled([
          reportService.getOverview(),
          reportService.listClasses({ limit: 50 }),
          userService.listUsers({ role: 'TEACHER', limit: 50 })
        ]);

        if (!isMounted) return;

        if (ovRes.status === 'fulfilled') {
          setOverview(ovRes.value);
        }
        if (clRes.status === 'fulfilled') {
          setReportClasses(clRes.value.data || []);
        }
        if (tcRes.status === 'fulfilled') {
          setTeachers(tcRes.value.data || []);
        }
      } catch {
        // fail gracefully
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExport = (type: 'excel' | 'pdf') => {
    alert(isVi ? `Đang kết xuất báo cáo ${type.toUpperCase()}... File sẽ được tải xuống tự động.` : `Exporting ${type.toUpperCase()} report... Download will begin shortly.`);
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
              {isVi ? 'Khảo Thí & Chuẩn Đầu Ra' : 'Academic Attainment & Progress'}
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
            <span className="adm-kpi-value">{overview?.classCount ?? reportClasses.length}</span>
            <span className="adm-kpi-badge positive">Live</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Theo dõi sĩ số và điểm trung bình' : 'Tracking cohort progress'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỶ LỆ HOÀN THÀNH BÀI TẬP' : 'COMPLETION RATE'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#16a34a' }}>
              {overview?.completionRatePercent ?? 0}%
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
              {overview?.averageScorePercent ?? 0}%
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
              {overview?.pendingGradingCount ?? 0}
            </span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Bài tự luận chờ duyệt' : 'Awaiting instructor verification'}</span>
          </div>
        </div>
      </div>

      {/* Modern Navigation Pills */}
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
                            <span className="badge badge-active">{cls.status}</span>
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
    </div>
  );
};

export default AdminReports;
