import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { userService, classService, reportService } from '../api/services';
import type { ReportClassSummary } from '../types/report.types';
import { Button, MetricCard, EmptyState } from '../components/common';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalAssignments: 0,
    completionRate: 0,
    averageScore: 0,
    pendingGradings: 0,
  });

  const [recentClasses, setRecentClasses] = useState<ReportClassSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRetry = () => {
    setReloadKey((prev) => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardTelemetry = async () => {
      try {
        setLoading(true);
        setError(null);

        const [studentsRes, teachersRes, classesRes, overviewRes, reportClassesRes] = await Promise.allSettled([
          userService.listUsers({ role: 'STUDENT', limit: 1 }),
          userService.listUsers({ role: 'TEACHER', limit: 1 }),
          classService.list({ limit: 1 }),
          reportService.getOverview(),
          reportService.listClasses({ limit: 5 }),
        ]);

        const allFailed = [studentsRes, teachersRes, classesRes, overviewRes, reportClassesRes].every(
          (res) => res.status === 'rejected'
        );

        if (allFailed) {
          throw new Error(
            isVi 
              ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại.' 
              : 'Failed to connect to server. Please try again.'
          );
        }

        let totalStudents = 0;
        let totalTeachers = 0;
        let totalClasses = 0;
        let totalAssignments = 0;
        let completionRate = 0;
        let averageScore = 0;
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
          completionRate = overviewRes.value.completionRatePercent || 0;
          averageScore = overviewRes.value.averageScorePercent || 0;
          pendingGradings = overviewRes.value.pendingGradingCount || 0;
        }

        if (isMounted) {
          setStats({
            totalStudents,
            totalTeachers,
            totalClasses,
            totalAssignments,
            completionRate,
            averageScore,
            pendingGradings,
          });

          if (reportClassesRes.status === 'fulfilled' && reportClassesRes.value) {
            setRecentClasses(reportClassesRes.value.data || []);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : (isVi ? 'Đã xảy ra lỗi khi tải dữ liệu' : 'An error occurred while loading data');
          setError(message);
        }
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
  }, [isVi, reloadKey]);

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            {t('adminDashboard.title') || (isVi ? 'Bảng điều khiển quản trị' : 'Admin Dashboard')}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="primary"
            onClick={() => navigate('/admin/classes/create')}
          >
            {isVi ? 'Tạo lớp học' : 'Create Class'}
          </Button>
          <Button 
            variant="secondary"
            onClick={() => navigate('/admin/reports')}
          >
            {isVi ? 'Báo cáo thống kê' : 'Analytics Report'}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="adm-alert-error justify-between mb-6 flex items-center">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Button 
            variant="secondary"
            size="sm"
            onClick={handleRetry}
          >
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* 4 KPI Cards */}
      <div className="adm-kpi-grid mb-6">
        <MetricCard
          title={isVi ? 'TỔNG HỌC VIÊN' : 'TOTAL STUDENTS'}
          value={loading ? '...' : stats.totalStudents}
          onClick={() => navigate('/admin/students')}
        />

        <MetricCard
          title={isVi ? 'GIẢNG VIÊN HOẠT ĐỘNG' : 'ACTIVE TEACHERS'}
          value={loading ? '...' : stats.totalTeachers}
          onClick={() => navigate('/admin/teachers')}
        />

        <MetricCard
          title={isVi ? 'LỚP HỌC ĐANG MỞ' : 'ACTIVE CLASSES'}
          value={loading ? '...' : stats.totalClasses}
          onClick={() => navigate('/admin/classes')}
        />

        <MetricCard
          title={isVi ? 'BÀI TẬP ĐÃ GIAO' : 'TOTAL ASSIGNMENTS'}
          value={loading ? '...' : stats.totalAssignments}
          onClick={() => navigate('/admin/reports')}
        />
      </div>

      {/* 3 Stats Cards on 1 row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title={isVi ? 'Tỉ lệ nộp bài trung bình' : 'Average Completion Rate'}
          value={loading ? '...' : `${stats.completionRate}%`}
          onClick={() => navigate('/admin/reports')}
        />

        <MetricCard
          title={isVi ? 'Điểm trung bình toàn khóa' : 'Average Score'}
          value={loading ? '...' : `${stats.averageScore}%`}
          onClick={() => navigate('/admin/reports')}
        />

        <MetricCard
          title={isVi ? 'Bài tập chờ chấm' : 'Pending Grading'}
          value={loading ? '...' : stats.pendingGradings}
          onClick={() => navigate('/admin/reports')}
        />
      </div>

      {/* Recent Cohort Table */}
      <div className="adm-table-card">
        <div className="adm-table-header">
          <h2 className="adm-table-title">
            {isVi ? 'Tiến độ lớp học gần đây' : 'Recent Cohort Progress'}
          </h2>
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/classes')}
          >
            {isVi ? 'Xem tất cả' : 'View all'}
          </Button>
        </div>

        {loading ? (
          <div className="adm-loading-state">
            <Loader2 size={24} className="animate-spin adm-loading-state-icon" />
          </div>
        ) : recentClasses.length === 0 ? (
          <EmptyState
            title={isVi ? 'Chưa có dữ liệu' : 'No data available'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                  <th>{isVi ? 'TÊN LỚP' : 'CLASS NAME'}</th>
                  <th>{isVi ? 'BÀI TẬP' : 'ASSIGNMENTS'}</th>
                  <th>{isVi ? 'ĐIỂM TB' : 'AVG SCORE'}</th>
                  <th>{isVi ? 'HOÀN THÀNH' : 'COMPLETION'}</th>
                  <th className="text-right">{isVi ? 'THAO TÁC' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody>
                {recentClasses.map((cls) => (
                  <tr key={cls.classId}>
                    <td className="font-semibold text-primary font-mono">ENG-{cls.classId}</td>
                    <td className="font-medium">{cls.className}</td>
                    <td>{cls.assignedAssignmentCount}</td>
                    <td className="font-bold font-mono">{cls.averageScorePercent}%</td>
                    <td className="font-bold font-mono">{cls.completionRatePercent}%</td>
                    <td className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/admin/classes/${cls.classId}`)}
                      >
                        {isVi ? 'Chi tiết' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
