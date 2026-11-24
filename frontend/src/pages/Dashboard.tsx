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
  const [activeVisualizer, setActiveVisualizer] = useState<'histogram' | 'gauge'>('histogram');

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

        {/* Biểu đồ 2: Phân bổ năng lực & Hoàn thành (Grand Prominent Academic Visualizer) */}
        <div className="adm-table-card flex flex-col justify-between">
          <div>
            {/* Table Card Header with View Switcher */}
            <div className="adm-table-card-header">
              <div className="flex items-center gap-2">
                <PieChartIcon size={18} style={{ color: palette.gold }} />
                <h2 className="adm-table-title">
                  {isVi ? 'Phân bổ năng lực & Hoàn thành' : 'Academic Outcomes & Completion'}
                </h2>
              </div>

              {/* View Toggle Pill */}
              <div className="flex items-center gap-2">
                <div className="adm-dash-view-toggle">
                  <button
                    type="button"
                    className={`adm-dash-view-btn ${activeVisualizer === 'histogram' ? 'active' : ''}`}
                    onClick={() => setActiveVisualizer('histogram')}
                  >
                    <BarChart3 size={13} />
                    <span>{isVi ? 'Phổ điểm' : 'Distribution'}</span>
                  </button>
                  <button
                    type="button"
                    className={`adm-dash-view-btn ${activeVisualizer === 'gauge' ? 'active' : ''}`}
                    onClick={() => setActiveVisualizer('gauge')}
                  >
                    <PieChartIcon size={13} />
                    <span>{isVi ? 'Vòng đo' : 'Gauge'}</span>
                  </button>
                </div>
                <span className="badge badge-warning font-mono text-xs font-bold px-2 py-0.5">
                  {stats.completionRate}%
                </span>
              </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="p-4 sm:p-5">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={26} className="animate-spin text-primary" />
                  <span className="text-xs text-on-surface-variant">{isVi ? 'Đang xử lý dữ liệu...' : 'Processing telemetry...'}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeVisualizer === 'histogram' ? (
                    /* HERO VIEW 1: Grand Prominent 4-Tier Column Histogram */
                    <div className="adm-dash-histogram-prominent">
                      {/* Pillar 1: Xuất sắc */}
                      <div className="adm-dash-histogram-col group">
                        <span className="adm-dash-histogram-val">
                          {distributionData.pctExcellent}%
                        </span>
                        <div className="adm-dash-histogram-bar-wrap">
                          <div 
                            className="adm-dash-histogram-bar" 
                            style={{ 
                              height: distributionData.pctExcellent > 0 ? `${Math.max(10, distributionData.pctExcellent)}%` : '0%',
                              background: `linear-gradient(180deg, ${palette.emerald} 0%, rgba(16, 185, 129, 0.35) 100%)`,
                              boxShadow: distributionData.pctExcellent > 0 ? `0 0 12px ${palette.emerald}50` : 'none'
                            }} 
                          />
                        </div>
                        <span className="adm-dash-histogram-sub">{distributionData.excellent} {isVi ? 'lớp' : 'cls'}</span>
                        <div className="adm-dash-histogram-footer">
                          <span className="adm-dash-histogram-tier-name">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: palette.emerald }} />
                            {isVi ? 'Xuất sắc' : 'Excellent'}
                          </span>
                          <span className="adm-dash-histogram-tier-range">≥80%</span>
                        </div>
                      </div>

                      {/* Pillar 2: Khá giỏi */}
                      <div className="adm-dash-histogram-col group">
                        <span className="adm-dash-histogram-val">
                          {distributionData.pctGood}%
                        </span>
                        <div className="adm-dash-histogram-bar-wrap">
                          <div 
                            className="adm-dash-histogram-bar" 
                            style={{ 
                              height: distributionData.pctGood > 0 ? `${Math.max(10, distributionData.pctGood)}%` : '0%',
                              background: `linear-gradient(180deg, ${palette.sky} 0%, rgba(56, 189, 248, 0.35) 100%)`,
                              boxShadow: distributionData.pctGood > 0 ? `0 0 12px ${palette.sky}50` : 'none'
                            }} 
                          />
                        </div>
                        <span className="adm-dash-histogram-sub">{distributionData.good} {isVi ? 'lớp' : 'cls'}</span>
                        <div className="adm-dash-histogram-footer">
                          <span className="adm-dash-histogram-tier-name">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: palette.sky }} />
                            {isVi ? 'Khá giỏi' : 'Good'}
                          </span>
                          <span className="adm-dash-histogram-tier-range">65–79%</span>
                        </div>
                      </div>

                      {/* Pillar 3: Tiêu chuẩn */}
                      <div className="adm-dash-histogram-col group">
                        <span className="adm-dash-histogram-val">
                          {distributionData.pctStandard}%
                        </span>
                        <div className="adm-dash-histogram-bar-wrap">
                          <div 
                            className="adm-dash-histogram-bar" 
                            style={{ 
                              height: distributionData.pctStandard > 0 ? `${Math.max(10, distributionData.pctStandard)}%` : '0%',
                              background: `linear-gradient(180deg, ${palette.gold} 0%, rgba(245, 158, 11, 0.35) 100%)`,
                              boxShadow: distributionData.pctStandard > 0 ? `0 0 12px ${palette.gold}50` : 'none'
                            }} 
                          />
                        </div>
                        <span className="adm-dash-histogram-sub">{distributionData.standard} {isVi ? 'lớp' : 'cls'}</span>
                        <div className="adm-dash-histogram-footer">
                          <span className="adm-dash-histogram-tier-name">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: palette.gold }} />
                            {isVi ? 'Tiêu chuẩn' : 'Standard'}
                          </span>
                          <span className="adm-dash-histogram-tier-range">50–64%</span>
                        </div>
                      </div>

                      {/* Pillar 4: Cần chú ý */}
                      <div className="adm-dash-histogram-col group">
                        <span className="adm-dash-histogram-val">
                          {distributionData.pctBelow}%
                        </span>
                        <div className="adm-dash-histogram-bar-wrap">
                          <div 
                            className="adm-dash-histogram-bar" 
                            style={{ 
                              height: distributionData.pctBelow > 0 ? `${Math.max(10, distributionData.pctBelow)}%` : '0%',
                              background: `linear-gradient(180deg, ${palette.rose} 0%, rgba(244, 63, 94, 0.35) 100%)`,
                              boxShadow: distributionData.pctBelow > 0 ? `0 0 12px ${palette.rose}50` : 'none'
                            }} 
                          />
                        </div>
                        <span className="adm-dash-histogram-sub">{distributionData.below} {isVi ? 'lớp' : 'cls'}</span>
                        <div className="adm-dash-histogram-footer">
                          <span className="adm-dash-histogram-tier-name">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: palette.rose }} />
                            {isVi ? 'Cần chú ý' : 'Focus'}
                          </span>
                          <span className="adm-dash-histogram-tier-range">&lt;50%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* HERO VIEW 2: Grand Prominent Arch Speedometer Gauge (Bán Nguyệt 180°) */
                    <div className="adm-dash-arch-gauge">
                      <div className="adm-dash-arch-wrap">
                        <svg className="w-full h-full" viewBox="0 0 280 145">
                          <defs>
                            <linearGradient id="completionArchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor={palette.gold} />
                            </linearGradient>
                            <linearGradient id="scoreArchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor={palette.emerald} />
                            </linearGradient>
                          </defs>

                          {/* Outer Arch Background (Completion Rate R=108) */}
                          <path
                            d="M 32,132 A 108,108 0 0,1 248,132"
                            strokeWidth="9"
                            strokeLinecap="round"
                            fill="none"
                            className="adm-dash-arch-bg"
                          />
                          {/* Outer Arch Active (Completion) */}
                          <path
                            d="M 32,132 A 108,108 0 0,1 248,132"
                            stroke="url(#completionArchGrad)"
                            strokeWidth="9"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={339.29}
                            strokeDashoffset={339.29 * (1 - Math.min(100, Math.max(0, stats.completionRate)) / 100)}
                            className="transition-all duration-1000 ease-out"
                          />

                          {/* Inner Arch Background (Average Score R=90) */}
                          <path
                            d="M 50,132 A 90,90 0 0,1 230,132"
                            strokeWidth="7"
                            strokeLinecap="round"
                            fill="none"
                            className="adm-dash-arch-bg"
                          />
                          {/* Inner Arch Active (Average Score) */}
                          <path
                            d="M 50,132 A 90,90 0 0,1 230,132"
                            stroke="url(#scoreArchGrad)"
                            strokeWidth="7"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={282.74}
                            strokeDashoffset={282.74 * (1 - Math.min(100, Math.max(0, stats.averageScore)) / 100)}
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>

                        {/* Center Readout with Grand Typography */}
                        <div className="adm-dash-arch-center">
                          <div className="adm-dash-arch-score font-mono">
                            {stats.completionRate}%
                          </div>
                          <div className="adm-dash-arch-label">
                            {isVi ? 'Tỷ lệ nộp bài toàn trường' : 'System Completion Rate'}
                          </div>
                          <div className="adm-dash-arch-sub">
                            <span className="adm-dash-arch-pill">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {isVi ? 'Điểm TB:' : 'Avg Score:'} <strong>{stats.averageScore}%</strong>
                            </span>
                          </div>
                        </div>

                        {/* Gauge Ticks */}
                        <div className="adm-dash-arch-ticks">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Operational Telemetry Strip - 3 Balanced Cards */}
                  <div className="adm-dash-telemetry-row">
                    <div className="adm-dash-telemetry-card">
                      <div className="adm-dash-telemetry-head">
                        <span className="adm-dash-telemetry-title">{isVi ? 'Hoàn thành' : 'Completion'}</span>
                        <Award size={14} style={{ color: palette.gold }} />
                      </div>
                      <div className="adm-dash-telemetry-value text-amber-500 font-mono">
                        {stats.completionRate}%
                      </div>
                      <span className="adm-dash-telemetry-sub">{isVi ? 'Tỷ lệ nộp bài' : 'Submission rate'}</span>
                    </div>

                    <div className="adm-dash-telemetry-card">
                      <div className="adm-dash-telemetry-head">
                        <span className="adm-dash-telemetry-title">{isVi ? 'Điểm TB' : 'Avg Score'}</span>
                        <BarChart3 size={14} style={{ color: palette.emerald }} />
                      </div>
                      <div className="adm-dash-telemetry-value text-emerald-500 font-mono">
                        {stats.averageScore}%
                      </div>
                      <span className="adm-dash-telemetry-sub">
                        {stats.averageScore >= 80 ? (isVi ? 'Xuất sắc' : 'Excellent') : stats.averageScore >= 50 ? (isVi ? 'Đạt chuẩn' : 'On Target') : (isVi ? 'Cần cải thiện' : 'Needs Focus')}
                      </span>
                    </div>

                    <div className="adm-dash-telemetry-card">
                      <div className="adm-dash-telemetry-head">
                        <span className="adm-dash-telemetry-title">{isVi ? 'Chờ chấm' : 'Pending'}</span>
                        <FileText size={14} style={{ color: palette.rose }} />
                      </div>
                      <div className="adm-dash-telemetry-value text-on-surface font-mono">
                        {stats.pendingGradings}
                      </div>
                      <span className="adm-dash-telemetry-sub flex items-center gap-1 text-amber-500 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {isVi ? 'Hàng đợi' : 'In queue'}
                      </span>
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
        <div className="adm-table-card-header">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-primary" />
            <h2 className="adm-table-title">
              {isVi ? 'Tiến độ lớp học trọng điểm' : 'Key Cohort Progress'}
            </h2>
            {recentClasses.length > 0 && (
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {recentClasses.length} {isVi ? 'lớp' : 'classes'}
              </span>
            )}
          </div>
          <button 
            type="button"
            onClick={() => navigate('/admin/classes')}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{isVi ? 'Xem tất cả lớp' : 'View all'}</span>
            <ChevronRight size={14} />
          </button>
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
                  <th style={{ width: '110px' }}>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                  <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                  <th className="text-center" style={{ width: '110px' }}>{isVi ? 'BÀI TẬP' : 'ASSIGNMENTS'}</th>
                  <th className="text-center" style={{ width: '130px' }}>{isVi ? 'ĐIỂM TB' : 'AVG SCORE'}</th>
                  <th style={{ width: '220px' }}>{isVi ? 'HOÀN THÀNH' : 'COMPLETION'}</th>
                  <th className="text-right" style={{ width: '110px' }}>{isVi ? 'THAO TÁC' : 'ACTION'}</th>
                </tr>
              </thead>
              <tbody>
                {recentClasses.map((cls) => {
                  const score = Math.round(cls.averageScorePercent || 0);
                  const completion = Math.round(cls.completionRatePercent || 0);
                  return (
                    <tr key={cls.classId}>
                      <td>
                        <span className="badge badge-primary font-mono text-xs font-bold py-0.5 px-2">
                          ENG-{cls.classId}
                        </span>
                      </td>
                      <td className="font-semibold text-on-surface">
                        <span 
                          onClick={() => navigate(`/admin/classes/${cls.classId}`)}
                          className="cursor-pointer hover:text-primary transition-colors"
                        >
                          {cls.className}
                        </span>
                      </td>
                      <td className="text-center font-mono font-bold text-on-surface">
                        {cls.assignedAssignmentCount}
                      </td>
                      <td className="text-center">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md inline-block" style={{
                          background: score >= 80 ? 'rgba(52, 211, 153, 0.12)' : score >= 65 ? 'rgba(56, 189, 248, 0.12)' : score >= 50 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 113, 133, 0.12)',
                          color: score >= 80 ? '#34d399' : score >= 65 ? '#38bdf8' : score >= 50 ? '#fbbf24' : '#fb7185',
                          border: `1px solid ${score >= 80 ? 'rgba(52, 211, 153, 0.3)' : score >= 65 ? 'rgba(56, 189, 248, 0.3)' : score >= 50 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 113, 133, 0.3)'}`
                        }}>
                          {cls.averageScorePercent}%
                        </span>
                      </td>
                      <td>
                        <div className="adm-table-progress-wrap">
                          <div className="adm-table-progress-track">
                            <div 
                              className="adm-table-progress-fill"
                              style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
                            />
                          </div>
                          <span className="adm-table-progress-val">
                            {completion}%
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
