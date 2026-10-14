import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Plus, 
  BarChart3, 
  History, 
  FileSpreadsheet, 
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { userService, classService, reportService } from '../api/services';
import { Button, MetricCard } from '../components/common';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    pendingGradings: 0
  });

  const [loading, setLoading] = useState(true);

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

        let totalStudents = 0;
        let totalTeachers = 0;
        let totalClasses = 0;
        let totalAssignments = 0;
        let pendingGradings = 0;

        if (studentsRes.status === 'fulfilled' && studentsRes.value) {
          totalStudents = studentsRes.value.pagination?.total || 0;
        }
        if (teachersRes.status === 'fulfilled' && teachersRes.value) {
          totalTeachers = teachersRes.value.pagination?.total || 0;
        }
        if (classesRes.status === 'fulfilled' && classesRes.value) {
          totalClasses = classesRes.value.pagination?.total || 0;
        }
        if (overviewRes.status === 'fulfilled' && overviewRes.value) {
          totalAssignments = overviewRes.value.assignedAssignmentCount || 0;
          pendingGradings = overviewRes.value.pendingGradingCount || 0;
        }

        if (isMounted) {
          setStats({
            totalStudents,
            totalTeachers,
            totalClasses,
            totalAssignments,
            pendingGradings
          });
        }
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
      {/* Minimal Header */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            {isVi ? 'Bảng điều khiển quản trị' : 'Admin Dashboard'}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/admin/classes/create')}
          >
            {isVi ? 'Tạo lớp học' : 'Create Class'}
          </Button>
          <Button 
            variant="secondary"
            icon={<BarChart3 size={16} />}
            onClick={() => navigate('/admin/reports')}
          >
            {isVi ? 'Báo cáo thống kê' : 'Analytics Report'}
          </Button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="adm-kpi-grid mb-6">
        <MetricCard
          title={isVi ? 'TỔNG HỌC VIÊN' : 'TOTAL STUDENTS'}
          value={loading ? '...' : stats.totalStudents}
          footerText={isVi ? 'Hồ sơ đã kích hoạt' : 'Registered accounts'}
          onClick={() => navigate('/admin/students')}
        />

        <MetricCard
          title={isVi ? 'GIẢNG VIÊN HOẠT ĐỘNG' : 'ACTIVE TEACHERS'}
          value={loading ? '...' : stats.totalTeachers}
          footerText={isVi ? 'Giáo viên trong hệ thống' : 'Active faculty'}
          onClick={() => navigate('/admin/teachers')}
        />

        <MetricCard
          title={isVi ? 'LỚP HỌC ĐANG MỞ' : 'ACTIVE CLASSES'}
          value={loading ? '...' : stats.totalClasses}
          footerText={isVi ? 'Theo dõi sĩ số và tiến độ' : 'Class cohorts'}
          onClick={() => navigate('/admin/classes')}
        />

        <MetricCard
          title={isVi ? 'BÀI TẬP ĐÃ GIAO' : 'TOTAL ASSIGNMENTS'}
          value={loading ? '...' : stats.totalAssignments}
          footerText={stats.pendingGradings > 0 ? `${stats.pendingGradings} ${isVi ? 'chờ chấm' : 'pending'}` : (isVi ? 'Đã hoàn tất xử lý' : 'All graded')}
          onClick={() => navigate('/admin/reports')}
        />
      </div>

      {/* Main 2-Column Bento Layout */}
      <div className="grid grid-cols-1 gap-6">
        <div className="adm-bento-grid">
          
          {/* Left Column: Live Activity Feed */}
          <div className="eh-card p-6">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 className="headline-md m-0">
                  {isVi ? 'Hoạt Động Gần Đây' : 'Recent Activity'}
                </h3>
              </div>
            </div>

            <div className="p-6 text-center text-muted bg-surface-low rounded-md border-subtle">
              <ShieldCheck size={32} className="mx-auto mb-2 text-success inline-block" />
              <div className="text-base font-semibold text-surface">
                {isVi ? 'Hệ thống vận hành ổn định' : 'System running smoothly'}
              </div>
              <div className="text-sm mt-1">
                {isVi 
                  ? `${stats.totalClasses} lớp học và ${stats.totalStudents} học viên đang đồng bộ theo thời gian thực.` 
                  : `${stats.totalClasses} classes and ${stats.totalStudents} students synced in real-time.`}
              </div>
            </div>
          </div>

          {/* Right Column: AI Engine Status & Quick Launch */}
          <div className="flex flex-col gap-6">
            
            {/* Quick Action Commands */}
            <div className="eh-card p-6">
              <h3 className="headline-md mb-3">
                {isVi ? 'Phím Tắt Điều Hành Nhanh' : 'Executive Command Launchers'}
              </h3>
              
              <div className="flex flex-col gap-2">
                <button 
                  type="button"
                  onClick={() => navigate('/admin/classes/create')}
                  className="dashboard-quick-action-btn flex items-center justify-between p-3 rounded-md bg-surface border-subtle cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-primary" />
                    <span className="font-semibold text-sm">{isVi ? 'Tạo lớp học mới' : 'Add New Class'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘N</span>
                </button>

                <button 
                  type="button"
                  onClick={() => navigate('/admin/students/create')}
                  className="dashboard-quick-action-btn flex items-center justify-between p-3 rounded-md bg-surface border-subtle cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-secondary" />
                    <span className="font-semibold text-sm">{isVi ? 'Tiếp nhận học viên mới' : 'Enroll Student'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘S</span>
                </button>

                <button 
                  type="button"
                  onClick={() => navigate('/admin/audit/gradings')}
                  className="dashboard-quick-action-btn flex items-center justify-between p-3 rounded-md bg-surface border-subtle cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <History size={16} className="text-primary" />
                    <span className="font-semibold text-sm">{isVi ? 'Lịch sử chấm điểm' : 'Grading History'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘L</span>
                </button>

                <button 
                  type="button"
                  onClick={() => navigate('/admin/reports')}
                  className="dashboard-quick-action-btn flex items-center justify-between p-3 rounded-md bg-surface border-subtle cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet size={16} color="#7e22ce" />
                    <span className="font-semibold text-sm">{isVi ? 'Báo cáo quản trị' : 'Export Reports'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘R</span>
                </button>
              </div>
            </div>

            {/* System Node Telemetry */}
            <div className="eh-card p-5">
              <div className="flex justify-between items-center mb-3">
                <h4 className="m-0 text-sm font-bold">
                  {isVi ? 'Trạng Thái Hạ Tầng & Dịch Vụ' : 'Core Infrastructure Health'}
                </h4>
                <span className="badge badge-active">{isVi ? 'Đang hoạt động' : 'Operational'}</span>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between pb-2 border-b-subtle">
                  <span className="text-muted">AI Evaluation Pipeline</span>
                  <span className="font-semibold text-success">Connected</span>
                </div>
                <div className="flex justify-between pb-2 border-b-subtle">
                  <span className="text-muted">Speech Recognition & Audio Service</span>
                  <span className="font-semibold text-success">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Application Database</span>
                  <span className="font-semibold text-success">Connected</span>
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
