import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Sparkles, AlertTriangle, 
  CheckCircle2, ArrowRight, Target,
  PenTool, Mic, BookOpen, Headphones, Zap,
  RotateCcw, AlertCircle
} from 'lucide-react';
import { Button, Skeleton } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../api/services/report.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import type { ReportStudentProgressResponse, SkillAverage } from '../types/report.types';
import '../styles/student-ecosystem.css';

interface SkillScore {
  skill: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  current: number;
  target: number;
  max: number;
  status: 'strong' | 'average' | 'needs_work';
  testsCompleted: number;
}

function convertScoreTo10(score: number): number {
  return parseFloat((score / 10).toFixed(1));
}

export const StudentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isVi = language === 'vi';

  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'all'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ReportStudentProgressResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);

  const [reloadKey, setReloadKey] = useState(0);
  const handleReload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const [progressRes, submissionsRes] = await Promise.allSettled([
          user?.id ? reportService.getStudentProgress(Number(user.id)) : Promise.reject('No user'),
          submissionService.listSubmissions({ studentId: user?.id })
        ]);

        if (!isMounted) return;

        if (progressRes.status === 'fulfilled' && progressRes.value) {
          setProgressData(progressRes.value);
        }

        if (submissionsRes.status === 'fulfilled' && submissionsRes.value) {
          const rawSubs = submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : []);
          setSubmissions(rawSubs);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load student analytics', err);
        setError(isVi ? 'Không thể tải dữ liệu phân tích năng lực.' : 'Failed to fetch student analytics.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [user?.id, timeRange, isVi, reloadKey]);


  const skillsData: SkillScore[] = useMemo(() => {
    const skillList: ('Listening' | 'Reading' | 'Writing' | 'Speaking')[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
    const skillMap = new Map<string, number>();
    progressData?.skillAverages?.forEach((s: SkillAverage) => {
      skillMap.set(s.skill.toUpperCase(), s.averageScorePercent);
    });

    return skillList.map(skill => {
      const apiScore = skillMap.get(skill.toUpperCase());
      const hasSkill = apiScore !== undefined;
      const score10 = hasSkill ? convertScoreTo10(apiScore) : 0;
      const status: 'strong' | 'average' | 'needs_work' = score10 >= 8.0 ? 'strong' : score10 >= 6.5 ? 'average' : 'needs_work';
      const testsCompleted = submissions.filter(s => s.status === 'GRADED').length;

      return {
        skill,
        current: score10,
        target: 8.5,
        max: 10.0,
        status,
        testsCompleted: hasSkill ? Math.max(1, testsCompleted) : 0,
      };
    });
  }, [progressData, submissions]);

  const currentOverallBand = useMemo(() => {
    if (progressData?.skillAverages && progressData.skillAverages.length > 0) {
      const avgPercent = progressData.skillAverages.reduce((acc, curr) => acc + curr.averageScorePercent, 0) / progressData.skillAverages.length;
      return convertScoreTo10(avgPercent);
    }
    const gradedSkills = skillsData.filter(s => s.current > 0);
    if (gradedSkills.length > 0) {
      const avg = gradedSkills.reduce((acc, curr) => acc + curr.current, 0) / gradedSkills.length;
      return parseFloat(avg.toFixed(1));
    }
    return null;
  }, [progressData, skillsData]);

  const highestSkill = useMemo(() => {
    return [...skillsData].sort((a, b) => b.current - a.current)[0];
  }, [skillsData]);

  const lowestSkill = useMemo(() => {
    return [...skillsData].sort((a, b) => a.current - b.current)[0];
  }, [skillsData]);

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'Writing': return <PenTool size={18} />;
      case 'Speaking': return <Mic size={18} />;
      case 'Reading': return <BookOpen size={18} />;
      default: return <Headphones size={18} />;
    }
  };

  const getStatusBadge = (status: SkillScore['status']) => {
    if (status === 'strong') {
      return (
        <span className="analytics-badge-good">
          {isVi ? 'Vững chắc' : 'Mastered'}
        </span>
      );
    }
    if (status === 'average') {
      return (
        <span className="analytics-badge-avg">
          {isVi ? 'Đang tiến bộ' : 'Developing'}
        </span>
      );
    }
    return (
      <span className="analytics-badge-weak">
        {isVi ? 'Cần tập trung' : 'Needs Focus'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="std-eco-container p-24">
        <Skeleton height="40px" width="320px" borderRadius="8px" className="mb-24" />
        <Skeleton height="160px" borderRadius="16px" className="mb-28" />
        <div className="analytics-grid">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="220px" borderRadius="14px" />
          ))}
        </div>
        <Skeleton height="180px" borderRadius="14px" />
      </div>
    );
  }

  return (
    <div className="std-eco-container">
      {/* Header */}
      <div className="std-eco-header">
        <div>
          <h1 className="std-eco-title">
            <BarChart3 size={28} color="var(--primary)" />
            {isVi ? 'Phân tích tiến độ' : 'Progress Analytics'}
          </h1>
          <p className="std-eco-subtitle">
            {isVi 
              ? 'Thống kê kết quả học tập và mức độ hoàn thành bài tập.' 
              : 'Learning progress and assignment completion statistics.'}
          </p>
        </div>

        <div className="flex gap-8">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter' | 'all')}
            className="analytics-select"
          >
            <option value="month">{isVi ? '30 ngày gần nhất' : 'Last 30 days'}</option>
            <option value="quarter">{isVi ? 'Học kỳ hiện tại' : 'Current Term'}</option>
            <option value="all">{isVi ? 'Toàn bộ khóa học' : 'All-time History'}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="analytics-error-banner">
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={<RotateCcw size={14} />} onClick={handleReload}>
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Target vs Current Hero Card */}
      <div className="std-eco-hero">
        <div className="std-eco-hero-content">
          <div>
            <div className="analytics-hero-target-pill">
              <Target size={15} />
              <span>{isVi ? 'Mục tiêu học tập: 8.5 / 10' : 'Target Goal: 8.5 / 10'}</span>
            </div>
            <h2 className="analytics-hero-title">
              {currentOverallBand !== null ? (
                isVi 
                  ? `Bạn đã đạt ${Math.min(100, Math.round((currentOverallBand / 8.5) * 100))}% chặng đường đến mục tiêu 8.5 điểm` 
                  : `You have completed ${Math.min(100, Math.round((currentOverallBand / 8.5) * 100))}% of your target milestone`
              ) : (
                isVi
                  ? 'Bắt đầu làm bài tập để theo dõi tiến độ điểm số'
                  : 'Start completing assignments to track progress toward your goal'
              )}
            </h2>
            <p className="analytics-hero-desc">
              {currentOverallBand !== null ? (
                isVi 
                  ? `Kỹ năng ${highestSkill.skill} của bạn đang ở phong độ tốt (${highestSkill.current.toFixed(1)} / 10). Tập trung rèn luyện thêm ${lowestSkill.skill} để bứt phá điểm tổng!`
                  : `Your ${highestSkill.skill} skill is performing well (${highestSkill.current.toFixed(1)} / 10). Channel focused practice into ${lowestSkill.skill} to elevate your overall score!`
              ) : (
                isVi
                  ? 'Khi hoàn thành các bài tập và được chấm điểm, bảng phân tích năng lực chi tiết cho từng kỹ năng sẽ hiển thị tại đây.'
                  : 'As you complete and receive grades for assignments, detailed analytics for each skill will be displayed here.'
              )}
            </p>
          </div>

          <div className="analytics-hero-kpis">
            <div className="text-center">
              <div className="analytics-hero-kpi-val">
                {currentOverallBand !== null ? currentOverallBand.toFixed(1) : '--'}
              </div>
              <div className="analytics-hero-kpi-label">
                {isVi ? 'Điểm TB Hiện Tại' : 'Current Score'}
              </div>
            </div>
            <div className="analytics-hero-divider"></div>
            <div className="text-center">
              <div className="analytics-hero-kpi-val kpi-target">8.5</div>
              <div className="analytics-hero-kpi-label">
                {isVi ? 'Mục Tiêu' : 'Target'}
              </div>
            </div>
            <div className="analytics-hero-divider"></div>
            <div className="text-center">
              <div className="analytics-hero-kpi-val kpi-graded">
                {submissions.filter(s => s.status === 'GRADED').length}
              </div>
              <div className="analytics-hero-kpi-label">
                {isVi ? 'Bài Đã Chấm' : 'Graded Tests'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Skill Analysis Grid */}
      <div className="analytics-grid">
        {skillsData.map((item) => (
          <div key={item.skill} className="analytics-skill-block">
            <div className="analytics-skill-header">
              <div className="flex items-center gap-10">
                <div className="analytics-skill-icon">
                  {getSkillIcon(item.skill)}
                </div>
                <div>
                  <h3 className="analytics-skill-name">
                    {item.skill}
                  </h3>
                  <div className="analytics-skill-tests">
                    {item.testsCompleted} {isVi ? 'bài đã làm' : 'tests completed'}
                  </div>
                </div>
              </div>
              {getStatusBadge(item.status)}
            </div>

            {/* Score Comparison */}
            <div className="analytics-score-row">
              <span className="analytics-score-label">
                {isVi ? 'Điểm hiện tại' : 'Current Band'}
              </span>
              <span className="analytics-score-val">
                {item.current > 0 ? (
                  <>
                    {item.current.toFixed(1)} <span className="analytics-score-max">/ {item.max.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="analytics-score-max">{isVi ? 'Chưa có điểm' : 'Not graded'}</span>
                )}
              </span>
            </div>

            {/* Radar / Progress Bar */}
            <div className="analytics-radar-bar mb-16">
              <div 
                className="analytics-radar-fill"
                style={{ 
                  width: item.current > 0 ? `${(item.current / item.max) * 100}%` : '0%'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Diagnostic Center & Remedial Recommendations */}
      <div className="std-eco-card">
        <div className="std-eco-card-header">
          <h2 className="std-eco-card-title">
            <Sparkles size={18} color="#9333ea" />
            {isVi ? 'Trung Tâm Chẩn Đoán AI & Lộ Trình Khắc Phục Lỗ Hổng' : 'AI Diagnostic Engine & Targeted Remedial Plan'}
          </h2>
          <span className="analytics-version-badge">
            Auto-Diagnostic v2.4
          </span>
        </div>

        <div className="std-eco-card-body">
          {highestSkill.current > 0 ? (
            <>
              {/* Diagnostic 1: Strength */}
              <div className="analytics-diagnostic-card strength">
                <CheckCircle2 size={20} color="#16a34a" className="shrink-0 mt-2" />
                <div>
                  <div className="font-bold mb-4">
                    {isVi ? `Điểm mạnh nổi bật: ${highestSkill.skill} (${highestSkill.current.toFixed(1)} / 10)` : `Key Strength: ${highestSkill.skill} (${highestSkill.current.toFixed(1)} / 10)`}
                  </div>
                  <div className="opacity-90">
                    {isVi 
                      ? `Khả năng làm chủ kỹ năng ${highestSkill.skill} của bạn đạt mức tốt so với mục tiêu đề ra.`
                      : `Your mastery of ${highestSkill.skill} is performing solidly relative to target benchmarks.`}
                  </div>
                </div>
              </div>

              {/* Diagnostic 2: Weakness */}
              <div className="analytics-diagnostic-card weakness">
                <AlertTriangle size={20} color="#dc2626" className="shrink-0 mt-2" />
                <div>
                  <div className="font-bold mb-4">
                    {isVi ? `Trọng tâm cần bồi dưỡng: ${lowestSkill.skill} (${lowestSkill.current.toFixed(1)} / 10)` : `Focus Area: ${lowestSkill.skill} (${lowestSkill.current.toFixed(1)} / 10)`}
                  </div>
                  <div className="opacity-90">
                    {isVi 
                      ? `Điểm trung bình kỹ năng ${lowestSkill.skill} đang ở mức ${lowestSkill.current.toFixed(1)} / 10. Bổ sung thêm các bài tập rèn luyện sẽ giúp nâng điểm nhanh chóng.`
                      : `Average score in ${lowestSkill.skill} currently stands at ${lowestSkill.current.toFixed(1)} / 10. Completing targeted drills will bring noticeable progress.`}
                  </div>
                </div>
              </div>

              {/* Recommended Practice Action */}
              <div className="analytics-diagnostic-card recommendation mt-16 flex items-center justify-between flex-wrap gap-12">
                <div className="flex items-center gap-12">
                  <Zap size={22} color="#2563eb" className="shrink-0" />
                  <div>
                    <div className="font-bold">
                      {isVi ? `Bộ bài tập tăng tốc kỹ năng ${lowestSkill.skill}` : `Accelerated Drills for ${lowestSkill.skill}`}
                    </div>
                    <div className="opacity-90 text-sm">
                      {isVi ? 'Được đề xuất tự động dựa trên kết quả các bài kiểm tra gần nhất' : 'Adaptive curriculum generated from your latest assignment results'}
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<ArrowRight size={14} />}
                  onClick={() => navigate('/student/assignments')}
                >
                  {isVi ? 'Bắt đầu luyện tập ngay' : 'Start Practice Drills'}
                </Button>
              </div>
            </>
          ) : (
            <div className="analytics-empty-diagnostic">
              <AlertCircle size={32} className="analytics-empty-icon" />
              <p className="analytics-empty-title">
                {isVi ? 'Chưa có đủ dữ liệu bài nộp để chẩn đoán AI' : 'Not enough submission data for AI diagnostics'}
              </p>
              <span className="text-sm">
                {isVi ? 'Hãy hoàn thành các bài tập được giao để AI phân tích điểm mạnh và điểm yếu của bạn.' : 'Complete assigned tasks so the AI can diagnose your strengths and improvement areas.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
