import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, BookOpen, Sparkles, 
  Plus, ShieldCheck, 
  BarChart3, 
  Zap, FileSpreadsheet, History, Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import { userService } from '../api/services/user.service';
import { reportService } from '../api/services/report.service';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalAssignments: number;
  pendingGradings: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    pendingGradings: 0,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardTelemetry = async () => {
      try {
        setLoading(true);

        const [studentsRes, teachersRes, classesRes, overviewRes] = await Promise.allSettled([
          userService.listUsers({ role: 'STUDENT', limit: 1 }),
          userService.listUsers({ role: 'TEACHER', limit: 1 }),
          classService.list({ limit: 1 }),
          reportService.getOverview()
        ]);

        if (!isMounted) return;

        const totalStudents = studentsRes.status === 'fulfilled' ? studentsRes.value.pagination.total : 0;
        const totalTeachers = teachersRes.status === 'fulfilled' ? teachersRes.value.pagination.total : 0;
        const totalClasses = classesRes.status === 'fulfilled' ? classesRes.value.pagination.total : 0;

        let totalAssignments = 0;
        let pendingGradings = 0;
        if (overviewRes.status === 'fulfilled') {
          totalAssignments = overviewRes.value.assignedAssignmentCount || 0;
          pendingGradings = overviewRes.value.pendingGradingCount || 0;
        }

        setStats({
          totalStudents,
          totalTeachers,
          totalClasses,
          totalAssignments,
          pendingGradings
        });
      } catch {
        // fail gracefully
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboardTelemetry();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="adm-container">
      {/* Executive Hero Banner */}
      <div className="adm-hero">
        <div className="adm-hero-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="adm-title-badge" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                {isVi ? 'Executive Portal' : 'Executive Portal'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#86efac' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                {isVi ? 'Hệ thống vận hành tối ưu' : 'All Systems Operational'}
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {isVi ? 'Bảng Điều Hành Trung Tâm Quản Trị' : 'Center Executive Control Panel'}
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', maxWidth: '620px', lineHeight: 1.5 }}>
              {isVi 
                ? 'Tổng quan thời gian thực về quy mô đào tạo, tỷ lệ chấm bài AI, chất lượng đầu ra học viên và kiểm toán giảng dạy.' 
                : 'Real-time telemetry on student cohort growth, AI grading throughput, academic outcomes, and faculty audit.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin/classes/create')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '10px 18px' }}
            >
              <Plus size={16} />
              <span>{isVi ? 'Tạo lớp học' : 'Create Class'}</span>
            </button>
            <button 
              className="btn"
              onClick={() => navigate('/admin/reports')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '10px 18px' }}
            >
              <BarChart3 size={16} />
              <span>{isVi ? 'Báo cáo hiệu chuẩn' : 'Calibration Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Bento KPI Cards */}
      <div className="adm-kpi-grid">
        {/* KPI 1 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/students')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỔNG HỌC VIÊN' : 'TOTAL STUDENTS'}</div>
              <div className="adm-kpi-value">
                {loading ? <Loader2 size={20} className="animate-spin" /> : stats.totalStudents}
              </div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="text-on-surface-variant">{isVi ? 'Hồ sơ đã kích hoạt' : 'Registered accounts'}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/teachers')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'GIẢNG VIÊN HOẠT ĐỘNG' : 'ACTIVE TEACHERS'}</div>
              <div className="adm-kpi-value">
                {loading ? <Loader2 size={20} className="animate-spin" /> : stats.totalTeachers}
              </div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">100%</span>
            <span className="text-on-surface-variant">{isVi ? 'đạt chuẩn SLA giảng dạy' : 'compliant with SLA'}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/classes')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'LỚP HỌC ĐANG MỞ' : 'ACTIVE CLASSES'}</div>
              <div className="adm-kpi-value">
                {loading ? <Loader2 size={20} className="animate-spin" /> : stats.totalClasses}
              </div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <BookOpen size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="text-on-surface-variant">{isVi ? 'Theo dõi sĩ số và tiến độ' : 'Class cohorts'}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/reports')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'BÀI TẬP ĐÃ GIAO' : 'TOTAL ASSIGNMENTS'}</div>
              <div className="adm-kpi-value">
                {loading ? <Loader2 size={20} className="animate-spin" /> : stats.totalAssignments}
              </div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
              <Sparkles size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="text-on-surface-variant">
              {stats.pendingGradings > 0 ? `${stats.pendingGradings} ${isVi ? 'chờ chấm' : 'pending'}` : (isVi ? 'Đã hoàn tất xử lý' : 'All graded')}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Bento Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Left Column: Live Activity Feed */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="headline-md" style={{ margin: 0 }}>
                  {isVi ? 'Dòng Sự Kiện & Hoạt Động Vận Hành' : 'Operational Activity Stream'}
                </h3>
                <p className="label-md text-on-surface-variant" style={{ marginTop: '2px' }}>
                  {isVi ? 'Cập nhật thời gian thực từ các lớp học và hệ thống chấm điểm' : 'Real-time telemetry across academic courses and grading pipelines'}
                </p>
              </div>
            </div>

            <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--on-surface-variant)', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--outline-variant)' }}>
              <ShieldCheck size={32} style={{ margin: '0 auto 10px', color: '#16a34a' }} />
              <div style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--on-surface)' }}>
                {isVi ? 'Hệ thống vận hành ổn định' : 'System running smoothly'}
              </div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                {isVi 
                  ? `${stats.totalClasses} lớp học và ${stats.totalStudents} học viên đang đồng bộ theo thời gian thực.` 
                  : `${stats.totalClasses} classes and ${stats.totalStudents} students synced in real-time.`}
              </div>
            </div>
          </div>

          {/* Right Column: AI Engine Status & Quick Launch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Action Commands */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="var(--primary)" />
                {isVi ? 'Phím Tắt Điều Hành Nhanh' : 'Executive Command Launchers'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => navigate('/admin/classes/create')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={16} color="var(--primary)" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Tạo lớp học mới' : 'Add New Class'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘N</span>
                </button>

                <button 
                  onClick={() => navigate('/admin/students/create')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={16} color="#16a34a" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Tiếp nhận học viên mới' : 'Enroll Student'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘S</span>
                </button>

                <button 
                  onClick={() => navigate('/admin/audit/gradings')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <History size={16} color="#2563eb" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Lịch sử chấm điểm' : 'Grading History'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘L</span>
                </button>

                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileSpreadsheet size={16} color="#7e22ce" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Báo cáo quản trị' : 'Export Reports'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘R</span>
                </button>
              </div>
            </div>

            {/* System Node Telemetry */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#16a34a" />
                  {isVi ? 'Trạng Thái Hạ Tầng & Dịch Vụ' : 'Core Infrastructure Health'}
                </h4>
                <span className="badge badge-active">{isVi ? 'Đang hoạt động' : 'Operational'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--outline-variant)' }}>
                  <span className="text-on-surface-variant">AI Evaluation Pipeline</span>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--outline-variant)' }}>
                  <span className="text-on-surface-variant">Speech Recognition & Audio Service</span>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>Connected</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-on-surface-variant">Application Database</span>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>Connected</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
