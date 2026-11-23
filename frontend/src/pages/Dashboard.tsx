import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, Loader2, Users, GraduationCap, School, 
  FileText, BarChart3, PlusCircle, ArrowUpRight,
  BookOpen, Award, PieChart as PieChartIcon, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { userService, classService, reportService } from '../api/services';
import type { ReportClassSummary } from '../types/report.types';
import { Button, EmptyState } from '../components/common';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const isVi = language === 'vi';
  const isDark = theme === 'dark';

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

  // Phân bổ năng lực học thuật
  const distributionData = useMemo(() => {
    let excellent = 0; // >= 80%
    let good = 0;      // 65 - 79%
    let standard = 0;  // 50 - 64%
    let below = 0;     // < 50%

    recentClasses.forEach((c) => {
      const score = c.averageScorePercent || 0;
      if (score >= 80) excellent++;
      else if (score >= 65) good++;
      else if (score >= 50) standard++;
      else below++;
    });

    const total = recentClasses.length || 1;
    return {
      excellent,
      good,
      standard,
      below,
      total: recentClasses.length,
      pctExcellent: Math.round((excellent / total) * 100),
      pctGood: Math.round((good / total) * 100),
      pctStandard: Math.round((standard / total) * 100),
      pctBelow: Math.round((below / total) * 100),
    };
  }, [recentClasses]);

  // Luxury theme palette constants
  const palette = {
    emerald: isDark ? '#34d399' : '#059669',
    gold: isDark ? '#fbbf24' : '#d97706',
    sky: isDark ? '#38bdf8' : '#0284c7',
    rose: isDark ? '#fb7185' : '#e11d48',
  };

  return (
    <div className="adm-container space-y-6">
      {/* 1. Header Banner - Clean Minimalist Academic Design */}
      <div className="adm-header mb-3">
        <div className="adm-title-group">
          <h1 className="adm-title font-serif tracking-tight">
            {t('adminDashboard.title') || (isVi ? 'Tổng quan hệ thống' : 'System Overview')}
          </h1>
        </div>

        {/* Action Group: Generously Spaced buttons */}
        <div className="adm-header-actions">
          <Button 
            variant="primary" 
            size="md" 
            icon={<PlusCircle size={16} />}
            onClick={() => navigate('/admin/classes?action=create')}
          >
            {isVi ? 'Tạo lớp học mới' : 'New Cohort'}
          </Button>

          <Button 
            variant="secondary" 
            size="md" 
            icon={<Users size={16} />}
            onClick={() => navigate('/admin/users')}
          >
            {isVi ? 'Quản lý tài khoản' : 'Accounts'}
          </Button>

          <Button 
            variant="secondary" 
            size="md" 
            icon={<BarChart3 size={16} />}
            onClick={() => navigate('/admin/reports')}
          >
            {isVi ? 'Báo cáo thống kê' : 'Analytics'}
          </Button>
        </div>
      </div>

      {/* Error alert with retry */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={handleRetry}>
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* 2. Bento 4 KPI Cards - Minimalist & Focused */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card group cursor-pointer" onClick={() => navigate('/admin/students')}>
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'TỔNG HỌC VIÊN' : 'TOTAL STUDENTS'}</span>
            <div className="adm-kpi-icon">
              <GraduationCap size={16} />
            </div>
          </div>
          <div className="adm-kpi-val font-mono">{loading ? '...' : stats.totalStudents.toLocaleString()}</div>
          <div className="adm-kpi-footer" style={{ justifyContent: 'flex-end' }}>
            <span className="adm-kpi-sub flex items-center gap-0.5 group-hover:underline">
              {isVi ? 'Chi tiết' : 'Details'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        <div className="adm-kpi-card group cursor-pointer" onClick={() => navigate('/admin/teachers')}>
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'GIẢNG VIÊN HOẠT ĐỘNG' : 'ACTIVE TEACHERS'}</span>
            <div className="adm-kpi-icon">
              <Users size={16} />
            </div>
          </div>
          <div className="adm-kpi-val font-mono">{loading ? '...' : stats.totalTeachers.toLocaleString()}</div>
          <div className="adm-kpi-footer" style={{ justifyContent: 'flex-end' }}>
            <span className="adm-kpi-sub flex items-center gap-0.5 group-hover:underline">
              {isVi ? 'Chi tiết' : 'Details'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        <div className="adm-kpi-card group cursor-pointer" onClick={() => navigate('/admin/classes')}>
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'LỚP HỌC ĐANG MỞ' : 'ACTIVE CLASSES'}</span>
            <div className="adm-kpi-icon">
              <School size={16} />
            </div>
          </div>
          <div className="adm-kpi-val font-mono">{loading ? '...' : stats.totalClasses.toLocaleString()}</div>
          <div className="adm-kpi-footer" style={{ justifyContent: 'flex-end' }}>
            <span className="adm-kpi-sub flex items-center gap-0.5 group-hover:underline">
              {isVi ? 'Quản lý' : 'Manage'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

        <div className="adm-kpi-card group cursor-pointer" onClick={() => navigate('/admin/reports')}>
          <div className="adm-kpi-header">
            <span className="adm-kpi-label">{isVi ? 'BÀI TẬP ĐÃ GIAO' : 'ASSIGNMENTS'}</span>
            <div className="adm-kpi-icon">
              <FileText size={16} />
            </div>
          </div>
          <div className="adm-kpi-val font-mono">{loading ? '...' : stats.totalAssignments.toLocaleString()}</div>
          <div className="adm-kpi-footer" style={{ justifyContent: 'flex-end' }}>
            <span className="adm-kpi-sub flex items-center gap-0.5 group-hover:underline">
              {isVi ? 'Báo cáo' : 'Reports'} <ArrowUpRight size={13} />
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Bento Visualizations (Minimalist & Luxury Academic Charts) */}
      <div className="adm-dashboard-bento-grid">
        
        {/* Biểu đồ 1: So sánh hiệu suất & Hoàn thành theo lớp học */}
        <div className="adm-table-card flex flex-col justify-between">
          <div>
            {/* Standard Table Card Header */}
            <div className="adm-table-card-header">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-primary" />
                <h2 className="adm-table-title">
                  {isVi ? 'So sánh hiệu suất & Hoàn thành theo lớp học' : 'Cohort Performance & Completion'}
                </h2>
              </div>

              {/* Legend Indicators */}
              <div className="flex items-center gap-2 text-xs font-medium shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-mono text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{isVi ? 'Điểm TB' : 'Avg Score'}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{isVi ? 'Hoàn thành' : 'Completion'}</span>
                </div>
              </div>
            </div>

            {/* Comparative Cohorts View */}
            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="text-xs text-on-surface-variant">{isVi ? 'Đang nạp dữ liệu phân tích...' : 'Loading analytics...'}</span>
                </div>
              ) : recentClasses.length === 0 ? (
                <div className="py-14 text-center text-xs text-on-surface-variant">
                  {isVi ? 'Chưa có đủ dữ liệu lớp học để hiển thị' : 'No cohort data for comparative display'}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentClasses.slice(0, 6).map((c) => {
                    const score = Math.round(c.averageScorePercent || 0);
                    const completion = Math.round(c.completionRatePercent || 0);
                    return (
                      <div 
                        key={c.classId}
                        onClick={() => navigate(`/admin/classes/${c.classId}`)}
                        className="adm-dash-cohort-item group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="badge badge-primary font-mono text-[10px] font-bold py-0.5 px-2">
                              ENG-{c.classId}
                            </span>
                            <span className="text-xs font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                              {c.className}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-xs font-mono font-bold">
                            <span className="text-emerald-500" title={isVi ? 'Điểm trung bình' : 'Average score'}>
                              {score}%
                            </span>
                            <span className="text-on-surface-variant/30">/</span>
                            <span className="text-amber-500" title={isVi ? 'Tỷ lệ hoàn thành' : 'Completion rate'}>
                              {completion}%
                            </span>
                          </div>
                        </div>

                        {/* Dual Progress Track */}
                        <div className="space-y-1">
                          <div className="adm-dash-track">
                            <div 
                              className="adm-dash-bar-emerald"
                              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                          </div>
                          <div className="adm-dash-track">
                            <div 
                              className="adm-dash-bar-gold"
                              style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="adm-table-card-footer flex items-center justify-end">
            <button 
              type="button"
              onClick={() => navigate('/admin/reports')}
              className="text-primary font-semibold hover:underline flex items-center gap-0.5"
            >
              {isVi ? 'Báo cáo chi tiết' : 'Detailed analytics'} <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Biểu đồ 2: Donut Chart & Tier Breakdown */}
        <div className="adm-table-card flex flex-col justify-between">
          <div>
            {/* Standard Table Card Header */}
            <div className="adm-table-card-header">
              <div className="flex items-center gap-2">
                <PieChartIcon size={18} style={{ color: palette.gold }} />
                <h2 className="adm-table-title">
                  {isVi ? 'Phân bổ năng lực & Hoàn thành' : 'Academic Outcomes & Completion'}
                </h2>
              </div>
              <span className="badge badge-warning font-mono text-xs font-bold px-2.5 py-0.5">
                {stats.completionRate}%
              </span>
            </div>

            {/* Main Content Area */}
            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="text-xs text-on-surface-variant">{isVi ? 'Đang xử lý dữ liệu...' : 'Processing telemetry...'}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Donut and Center Summary */}
                  <div className="flex items-center justify-between gap-4 py-1">
                    {/* SVG Radial Gauge */}
                    <div className="adm-dash-gauge-container">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-surface-variant/40"
                        />
                        <defs>
                          <linearGradient id="academicGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={palette.emerald} />
                            <stop offset="100%" stopColor={palette.gold} />
                          </linearGradient>
                        </defs>
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="url(#academicGaugeGrad)"
                          strokeWidth="8"
                          strokeDasharray={238.76}
                          strokeDashoffset={238.76 * (1 - Math.min(100, Math.max(0, stats.completionRate)) / 100)}
                          strokeLinecap="round"
                          fill="none"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      {/* Centered Typography */}
                      <div className="adm-dash-gauge-center">
                        <span className="text-base font-mono font-bold text-on-surface leading-none tracking-tight">
                          {stats.completionRate}%
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">
                          {isVi ? 'Hoàn tất' : 'Done'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Metric Pills */}
                    <div className="flex-1 space-y-2">
                      <div className="adm-dash-metric-tile">
                        <div className="flex items-center gap-2 text-xs">
                          <Award size={15} style={{ color: palette.gold }} />
                          <span className="text-on-surface-variant font-medium">{isVi ? 'Điểm TB toàn khóa' : 'Avg Score'}</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-on-surface">{stats.averageScore}%</span>
                      </div>

                      <div className="adm-dash-metric-tile">
                        <div className="flex items-center gap-2 text-xs">
                          <FileText size={15} style={{ color: palette.emerald }} />
                          <span className="text-on-surface-variant font-medium">{isVi ? 'Bài đợi chấm' : 'Pending'}</span>
                        </div>
                        <span className="text-sm font-bold font-mono text-on-surface">{stats.pendingGradings}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tier Progress Bars */}
                  <div className="space-y-2.5 pt-2 border-t border-outline-variant/30">
                    {/* Xuất sắc */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-on-surface font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.emerald }} />
                          <span>{isVi ? 'Xuất sắc (≥ 80%)' : 'Excellent (≥ 80%)'}</span>
                        </span>
                        <span className="font-mono font-bold" style={{ color: palette.emerald }}>
                          {distributionData.excellent} {isVi ? 'lớp' : 'cohorts'} ({distributionData.pctExcellent}%)
                        </span>
                      </div>
                      <div className="adm-dash-track" style={{ height: '5px' }}>
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${distributionData.pctExcellent}%`,
                            backgroundColor: palette.emerald 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Khá giỏi */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-on-surface font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.sky }} />
                          <span>{isVi ? 'Khá giỏi (65% - 79%)' : 'Good (65% - 79%)'}</span>
                        </span>
                        <span className="font-mono font-bold" style={{ color: palette.sky }}>
                          {distributionData.good} {isVi ? 'lớp' : 'cohorts'} ({distributionData.pctGood}%)
                        </span>
                      </div>
                      <div className="adm-dash-track" style={{ height: '5px' }}>
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${distributionData.pctGood}%`,
                            backgroundColor: palette.sky 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Tiêu chuẩn */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-on-surface font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.gold }} />
                          <span>{isVi ? 'Tiêu chuẩn (50% - 64%)' : 'Standard (50% - 64%)'}</span>
                        </span>
                        <span className="font-mono font-bold" style={{ color: palette.gold }}>
                          {distributionData.standard} {isVi ? 'lớp' : 'cohorts'} ({distributionData.pctStandard}%)
                        </span>
                      </div>
                      <div className="adm-dash-track" style={{ height: '5px' }}>
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${distributionData.pctStandard}%`,
                            backgroundColor: palette.gold 
                          }} 
                        />
                      </div>
                    </div>

                    {/* Cần chú ý */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-on-surface font-medium">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: palette.rose }} />
                          <span>{isVi ? 'Cần cải thiện (< 50%)' : 'Needs Focus (< 50%)'}</span>
                        </span>
                        <span className="font-mono font-bold" style={{ color: palette.rose }}>
                          {distributionData.below} {isVi ? 'lớp' : 'cohorts'} ({distributionData.pctBelow}%)
                        </span>
                      </div>
                      <div className="adm-dash-track" style={{ height: '5px' }}>
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${distributionData.pctBelow}%`,
                            backgroundColor: palette.rose 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="adm-table-card-footer flex items-center justify-end">
            <button 
              type="button"
              onClick={() => navigate('/admin/audit/gradings')}
              className="text-primary font-semibold hover:underline flex items-center gap-0.5"
            >
              {isVi ? 'Kiểm toán bài thi' : 'Audit logs'} <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Full-Width Key Cohort Progress Table - Rộng rãi, thoáng đãng, sắc nét */}
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
                    <td style={{ minWidth: '180px' }}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
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
  );
};

export default Dashboard;
