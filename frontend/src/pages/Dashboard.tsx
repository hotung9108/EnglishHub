import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Loader2, Users, GraduationCap, School, 
  FileText, BarChart3, PlusCircle, ArrowUpRight, CheckCircle2,
  Clock, ChevronRight, BookOpen, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { userService, classService, reportService } from '../api/services';
import type { ReportClassSummary } from '../types/report.types';
import { Button, EmptyState } from '../components/common';

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
          reportService.listClasses({ limit: 6 }),
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
      {/* 1. Header Banner */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <div className="flex items-center gap-3">
            <h1 className="adm-title font-serif tracking-tight">
              {t('adminDashboard.title') || (isVi ? 'Tổng quan hệ thống' : 'System Overview')}
            </h1>
            <span className="adm-title-badge flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>LIVE</span>
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1 font-sans">
            {isVi 
              ? 'Theo dõi số liệu thời gian thực và quản trị các hoạt động đào tạo trên EnglishHub' 
              : 'Real-time telemetry and management across the entire EnglishHub academy'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            variant="primary"
            icon={<PlusCircle size={16} />}
            onClick={() => navigate('/admin/classes/create')}
          >
            {isVi ? 'Tạo lớp học mới' : 'Create Class'}
          </Button>
          <Button 
            variant="secondary"
            icon={<Users size={16} />}
            onClick={() => navigate('/admin/accounts')}
          >
            {isVi ? 'Quản lý tài khoản' : 'Accounts'}
          </Button>
          <Button 
            variant="secondary"
            icon={<BarChart3 size={16} />}
            onClick={() => navigate('/admin/reports')}
          >
            {isVi ? 'Báo cáo thống kê' : 'Analytics'}
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

      {/* 2. Primary 4 Bento KPI Cards - Quiet Academic & Royal Emerald/Gold Theme */}
      <div className="adm-kpi-grid mb-6">
        {/* Total Students */}
        <div 
          className="adm-kpi-card cursor-pointer hover:border-primary transition-all group"
          onClick={() => navigate('/admin/students')}
        >
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỔNG HỌC VIÊN' : 'TOTAL STUDENTS'}</div>
              <div className="adm-kpi-value text-2xl font-bold mt-1 text-on-surface font-mono">
                {loading ? '...' : stats.totalStudents.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <GraduationCap size={20} />
            </div>
          </div>
          <div className="adm-kpi-footer flex items-center justify-between text-xs text-on-surface-variant">
            <span>{isVi ? 'Học viên đã ghi danh' : 'Enrolled students'}</span>
            <span className="flex items-center text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
              {isVi ? 'Chi tiết' : 'View'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        {/* Active Teachers */}
        <div 
          className="adm-kpi-card cursor-pointer hover:border-primary transition-all group"
          onClick={() => navigate('/admin/teachers')}
        >
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'GIẢNG VIÊN HOẠT ĐỘNG' : 'ACTIVE TEACHERS'}</div>
              <div className="adm-kpi-value text-2xl font-bold mt-1 text-on-surface font-mono">
                {loading ? '...' : stats.totalTeachers.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-105">
              <Users size={20} />
            </div>
          </div>
          <div className="adm-kpi-footer flex items-center justify-between text-xs text-on-surface-variant">
            <span>{isVi ? 'Đội ngũ giảng dạy' : 'Teaching faculty'}</span>
            <span className="flex items-center text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
              {isVi ? 'Chi tiết' : 'View'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        {/* Active Classes */}
        <div 
          className="adm-kpi-card cursor-pointer hover:border-primary transition-all group"
          onClick={() => navigate('/admin/classes')}
        >
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'LỚP HỌC ĐANG MỞ' : 'ACTIVE CLASSES'}</div>
              <div className="adm-kpi-value text-2xl font-bold mt-1 text-on-surface font-mono">
                {loading ? '...' : stats.totalClasses.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center transition-transform group-hover:scale-105">
              <School size={20} />
            </div>
          </div>
          <div className="adm-kpi-footer flex items-center justify-between text-xs text-on-surface-variant">
            <span>{isVi ? 'Khóa học đang hoạt động' : 'Ongoing cohorts'}</span>
            <span className="flex items-center text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
              {isVi ? 'Quản lý' : 'Manage'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        {/* Total Assignments */}
        <div 
          className="adm-kpi-card cursor-pointer hover:border-primary transition-all group"
          onClick={() => navigate('/admin/reports')}
        >
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'BÀI TẬP ĐÃ GIAO' : 'TOTAL ASSIGNMENTS'}</div>
              <div className="adm-kpi-value text-2xl font-bold mt-1 text-on-surface font-mono">
                {loading ? '...' : stats.totalAssignments.toLocaleString()}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center transition-transform group-hover:scale-105">
              <FileText size={20} />
            </div>
          </div>
          <div className="adm-kpi-footer flex items-center justify-between text-xs text-on-surface-variant">
            <span>{isVi ? 'Quiz, Writing & Speaking' : '4-skill assignments'}</span>
            <span className="flex items-center text-primary font-semibold group-hover:translate-x-0.5 transition-transform">
              {isVi ? 'Báo cáo' : 'Report'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Asymmetric 8:4 Academic Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8/12): Main Cohorts Progress Table */}
        <div className="lg:col-span-8">
          <div className="adm-table-card">
            <div className="adm-table-header">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-primary" />
                <h2 className="adm-table-title">
                  {isVi ? 'Tiến độ lớp học trọng điểm' : 'Key Cohort Progress'}
                </h2>
                {recentClasses.length > 0 && (
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {recentClasses.length} {isVi ? 'lớp' : 'classes'}
                  </span>
                )}
              </div>
              <Button 
                variant="ghost"
                size="sm"
                icon={<ChevronRight size={14} />}
                onClick={() => navigate('/admin/classes')}
              >
                {isVi ? 'Xem tất cả lớp' : 'View all'}
              </Button>
            </div>

            {loading ? (
              <div className="adm-loading-state py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-primary" />
                <span className="text-sm text-on-surface-variant">{isVi ? 'Đang nạp dữ liệu tiến độ...' : 'Loading cohorts...'}</span>
              </div>
            ) : recentClasses.length === 0 ? (
              <EmptyState
                title={isVi ? 'Chưa có dữ liệu lớp học' : 'No cohort data available'}
                description={isVi ? 'Tạo lớp học mới để bắt đầu theo dõi tiến độ đào tạo.' : 'Create your first class to track progress.'}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                      <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                      <th className="text-center">{isVi ? 'BÀI TẬP' : 'ASSIGNMENTS'}</th>
                      <th className="text-center">{isVi ? 'ĐIỂM TB' : 'AVG SCORE'}</th>
                      <th>{isVi ? 'HOÀN THÀNH' : 'COMPLETION'}</th>
                      <th className="text-right">{isVi ? 'THAO TÁC' : 'ACTION'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClasses.map((cls) => (
                      <tr key={cls.classId} className="hover:bg-surface-hover/60 transition-colors">
                        <td>
                          <span className="badge badge-primary font-mono text-xs font-bold">
                            ENG-{cls.classId}
                          </span>
                        </td>
                        <td className="font-semibold text-on-surface">
                          {cls.className}
                        </td>
                        <td className="text-center font-mono font-medium">
                          {cls.assignedAssignmentCount}
                        </td>
                        <td className="text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                            cls.averageScorePercent >= 80 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : cls.averageScorePercent >= 65 
                              ? 'bg-gold/15 text-gold border border-gold/25' 
                              : 'bg-surface-variant text-on-surface-variant'
                          }`}>
                            {cls.averageScorePercent}%
                          </span>
                        </td>
                        <td style={{ minWidth: '150px' }}>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-surface-low overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(0, cls.completionRatePercent))}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-bold text-on-surface-variant w-10 text-right">
                              {cls.completionRatePercent}%
                            </span>
                          </div>
                        </td>
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

        {/* Right Column (4/12): Academic Telemetry & Quick Console */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Performance Telemetry Card */}
          <div className="adm-table-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4 flex items-center justify-between">
              <span>{isVi ? 'Chỉ số chất lượng học thuật' : 'Academic Quality Index'}</span>
              <BarChart3 size={15} className="text-primary" />
            </h3>

            {/* Completion Rate Item */}
            <div 
              className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 mb-3.5 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate('/admin/reports')}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-primary" />
                  {isVi ? 'Tỉ lệ nộp bài toàn khóa' : 'Avg Completion Rate'}
                </span>
                <span className="text-base font-extrabold text-on-surface font-mono">
                  {loading ? '...' : `${stats.completionRate}%`}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-variant/40 overflow-hidden mb-1">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, stats.completionRate))}%` }}
                />
              </div>
              <div className="text-[11px] text-on-surface-variant">
                {isVi ? 'Học viên nộp bài tập đúng hạn trên hệ thống' : 'On-time submissions across all cohorts'}
              </div>
            </div>

            {/* Average Score Item */}
            <div 
              className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 mb-3.5 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate('/admin/reports')}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Award size={14} className="text-gold" />
                  {isVi ? 'Điểm trung bình tích lũy' : 'Aggregated Grade Score'}
                </span>
                <span className="text-base font-extrabold text-on-surface font-mono">
                  {loading ? '...' : `${stats.averageScore}%`}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-variant/40 overflow-hidden mb-1">
                <div 
                  className="h-full bg-gold rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, stats.averageScore))}%` }}
                />
              </div>
              <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                <span>{isVi ? 'Quy đổi theo thang điểm chuẩn hóa' : 'Aggregated cohort grade average'}</span>
                <span className="font-semibold text-primary">
                  {stats.averageScore >= 80 ? (isVi ? 'Xuất sắc' : 'Band 8.0+') : stats.averageScore >= 65 ? (isVi ? 'Khá giỏi' : 'Band 6.5+') : (isVi ? 'Tiêu chuẩn' : 'Band 5.0+')}
                </span>
              </div>
            </div>

            {/* Pending Grading Item */}
            <div 
              className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate('/admin/reports')}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                  <Clock size={14} className="text-primary" />
                  {isVi ? 'Khối lượng bài chờ chấm' : 'Pending Grading Workload'}
                </span>
                <span className="text-base font-extrabold text-on-surface font-mono">
                  {loading ? '...' : stats.pendingGradings}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-variant/40 overflow-hidden mb-1">
                <div 
                  className="h-full bg-primary/80 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.pendingGradings > 0 ? Math.min(100, stats.pendingGradings * 10) : 0}%` }}
                />
              </div>
              <div className="text-[11px] text-on-surface-variant">
                {stats.pendingGradings > 0 
                  ? (isVi ? 'Bài luận & Speaking đang đợi giảng viên phản hồi' : 'Submissions awaiting faculty review') 
                  : (isVi ? 'Tất cả bài tập đã được chấm điểm hoàn tất' : 'All submissions evaluated')}
              </div>
            </div>
          </div>

          {/* Quick Operations Console */}
          <div className="adm-table-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center justify-between">
              <span>{isVi ? 'Lối tắt quản trị' : 'Operations Console'}</span>
            </h3>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="w-full text-left p-2.5 rounded-lg border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-hover transition-all flex items-center justify-between text-xs font-semibold text-on-surface"
                onClick={() => navigate('/admin/students')}
              >
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-primary" />
                  <span>{isVi ? 'Danh sách học viên toàn trường' : 'Student Registry'}</span>
                </span>
                <ChevronRight size={14} className="text-on-surface-variant" />
              </button>
              <button
                type="button"
                className="w-full text-left p-2.5 rounded-lg border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-hover transition-all flex items-center justify-between text-xs font-semibold text-on-surface"
                onClick={() => navigate('/admin/teachers')}
              >
                <span className="flex items-center gap-2">
                  <GraduationCap size={15} className="text-primary" />
                  <span>{isVi ? 'Quản lý đội ngũ giảng viên' : 'Faculty Management'}</span>
                </span>
                <ChevronRight size={14} className="text-on-surface-variant" />
              </button>
              <button
                type="button"
                className="w-full text-left p-2.5 rounded-lg border border-outline-variant/30 hover:border-primary/40 hover:bg-surface-hover transition-all flex items-center justify-between text-xs font-semibold text-on-surface"
                onClick={() => navigate('/admin/audit/gradings')}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 size={15} className="text-gold" />
                  <span>{isVi ? 'Nhật ký kiểm tra chấm điểm' : 'Grading Audit Trail'}</span>
                </span>
                <ChevronRight size={14} className="text-on-surface-variant" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
