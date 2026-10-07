import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Sparkles, AlertTriangle, 
  CheckCircle2, ArrowRight, Target,
  PenTool, Mic, BookOpen, Headphones, Zap,
  RotateCcw, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../api/services/report.service';
import { submissionService, type SubmissionListItem } from '../api/services/submission.service';
import type { ReportStudentProgressResponse, SkillAverage } from '../types/report.types';

interface SkillScore {
  skill: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  current: number;
  target: number;
  max: number;
  status: 'strong' | 'average' | 'needs_work';
  percentile: number;
  testsCompleted: number;
  subCriteria: { name: string; score: number }[];
}

function convertScoreToBand(score: number): number {
  if (score >= 92) return 8.5;
  if (score >= 84) return 8.0;
  if (score >= 76) return 7.5;
  if (score >= 68) return 7.0;
  if (score >= 60) return 6.5;
  if (score >= 50) return 6.0;
  if (score >= 40) return 5.5;
  return 5.0;
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

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [progressRes, submissionsRes] = await Promise.allSettled([
        user?.id ? reportService.getStudentProgress(Number(user.id)) : Promise.reject('No user'),
        submissionService.listSubmissions({ studentId: user?.id })
      ]);

      if (progressRes.status === 'fulfilled' && progressRes.value) {
        setProgressData(progressRes.value);
      }

      if (submissionsRes.status === 'fulfilled' && submissionsRes.value) {
        const rawSubs = submissionsRes.value?.data || (Array.isArray(submissionsRes.value) ? submissionsRes.value : []);
        setSubmissions(rawSubs);
      }
    } catch (err) {
      console.error('Failed to load student analytics', err);
      setError(isVi ? 'Không thể tải dữ liệu phân tích năng lực.' : 'Failed to fetch student analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user?.id, timeRange]);


  const skillsData: SkillScore[] = useMemo(() => {
    const skillList: ('Listening' | 'Reading' | 'Writing' | 'Speaking')[] = ['Listening', 'Reading', 'Writing', 'Speaking'];
    const skillMap = new Map<string, number>();
    progressData?.skillAverages?.forEach((s: SkillAverage) => {
      skillMap.set(s.skill.toUpperCase(), s.averageScorePercent);
    });

    return skillList.map(skill => {
      const apiScore = skillMap.get(skill.toUpperCase());
      const hasSkill = apiScore !== undefined;
      const band = hasSkill ? convertScoreToBand(apiScore) : 0;
      const status: 'strong' | 'average' | 'needs_work' = band >= 7.5 ? 'strong' : band >= 6.5 ? 'average' : 'needs_work';
      const testsCompleted = submissions.filter(s => s.status === 'GRADED').length;

      return {
        skill,
        current: band,
        target: 8.0,
        max: 9.0,
        status,
        percentile: band > 0 ? Math.min(98, Math.round(band * 11)) : 0,
        testsCompleted: hasSkill ? Math.max(1, testsCompleted) : 0,
        subCriteria: []
      };
    });
  }, [progressData, submissions]);

  const currentOverallBand = useMemo(() => {
    if (progressData?.skillAverages && progressData.skillAverages.length > 0) {
      const avgPercent = progressData.skillAverages.reduce((acc, curr) => acc + curr.averageScorePercent, 0) / progressData.skillAverages.length;
      return convertScoreToBand(avgPercent);
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
        <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
          {isVi ? 'Vững chắc' : 'Mastered'}
        </span>
      );
    }
    if (status === 'average') {
      return (
        <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
          {isVi ? 'Đang tiến bộ' : 'Developing'}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '12px', backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
        {isVi ? 'Cần tập trung' : 'Needs Focus'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="std-eco-container p-24">
        <div className="skeleton mb-24" style={{ height: '40px', width: '320px', borderRadius: '8px' }}></div>
        <div className="skeleton mb-28" style={{ height: '160px', borderRadius: '16px' }}></div>
        <div className="grid gap-20 mb-28" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '220px', borderRadius: '14px' }}></div>
          ))}
        </div>
        <div className="skeleton" style={{ height: '180px', borderRadius: '14px' }}></div>
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
            {isVi ? 'Phân Tích Năng Lực & Lộ Trình AI' : 'Competency Analytics & AI Diagnosis'}
          </h1>
          <p className="std-eco-subtitle">
            {isVi 
              ? 'Chẩn đoán đa chiều 4 kỹ năng chuẩn IELTS, phát hiện lỗ hổng kiến thức và đề xuất bài tập cá nhân hóa.' 
              : 'Holistic 4-skill diagnostic, rubric component analysis, and adaptive remediation plan.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'month' | 'quarter' | 'all')}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--outline-variant)',
              backgroundColor: 'var(--surface)',
              color: 'var(--on-surface)',
              outline: 'none'
            }}
          >
            <option value="month">{isVi ? '30 ngày gần nhất' : 'Last 30 days'}</option>
            <option value="quarter">{isVi ? 'Học kỳ hiện tại' : 'Current Term'}</option>
            <option value="all">{isVi ? 'Toàn bộ khóa học' : 'All-time History'}</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-16 mb-24 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
          <div className="flex items-center gap-12">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
          <button onClick={fetchAnalytics} className="btn btn-sm btn-secondary flex items-center gap-6">
            <RotateCcw size={14} />
            <span>{isVi ? 'Thử lại' : 'Retry'}</span>
          </button>
        </div>
      )}

      {/* Target vs Current Hero Card */}
      <div className="std-eco-hero">
        <div className="std-eco-hero-content">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.18)', padding: '5px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700, marginBottom: '12px' }}>
              <Target size={15} />
              <span>{isVi ? 'Mục tiêu chứng chỉ: IELTS Academic 7.5 - 8.0' : 'Target Goal: IELTS Academic 7.5 - 8.0'}</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              {currentOverallBand !== null ? (
                isVi 
                  ? `Bạn đã đạt ${Math.min(100, Math.round((currentOverallBand / 8.0) * 100))}% chặng đường đến Band 8.0 🎉` 
                  : `You have completed ${Math.min(100, Math.round((currentOverallBand / 8.0) * 100))}% of your target milestone 🎉`
              ) : (
                isVi
                  ? 'Bắt đầu làm bài tập để theo dõi tiến độ đến Band 8.0 🎯'
                  : 'Start completing assignments to track progress toward Band 8.0 🎯'
              )}
            </h2>
            <p style={{ fontSize: '14px', opacity: 0.88, margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              {currentOverallBand !== null ? (
                isVi 
                  ? `Kỹ năng ${highestSkill.skill} của bạn đang ở phong độ tốt (Band ${highestSkill.current.toFixed(1)}). Tập trung rèn luyện thêm ${lowestSkill.skill} để bứt phá điểm tổng!`
                  : `Your ${highestSkill.skill} skill is performing well (Band ${highestSkill.current.toFixed(1)}). Channel focused practice into ${lowestSkill.skill} to elevate your overall band!`
              ) : (
                isVi
                  ? 'Khi hoàn thành các bài tập và được chấm điểm, bảng phân tích năng lực chi tiết cho từng kỹ năng sẽ hiển thị tại đây.'
                  : 'As you complete and receive grades for assignments, detailed analytics for each skill will be displayed here.'
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '18px 24px', borderRadius: '14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
                {currentOverallBand !== null ? currentOverallBand.toFixed(1) : '--'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', marginTop: '4px' }}>
                {isVi ? 'Overall Hiện Tại' : 'Current Band'}
              </div>
            </div>
            <div style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#fde047', lineHeight: 1 }}>8.0</div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', marginTop: '4px' }}>
                {isVi ? 'Mục Tiêu' : 'Target Band'}
              </div>
            </div>
            <div style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#86efac', lineHeight: 1 }}>
                {currentOverallBand !== null ? `Top ${Math.max(5, Math.round((1 - currentOverallBand / 9.0) * 100))}%` : '--'}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', marginTop: '4px' }}>
                {isVi ? 'Thứ hạng ước tính' : 'Percentile'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Skill Analysis Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {skillsData.map((item) => (
          <div key={item.skill} className="analytics-skill-block">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getSkillIcon(item.skill)}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--on-surface)' }}>
                    {item.skill}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                    {item.testsCompleted} {isVi ? 'bài đã làm' : 'tests completed'}
                  </div>
                </div>
              </div>
              {getStatusBadge(item.status)}
            </div>

            {/* Score Comparison */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
                {isVi ? 'Điểm hiện tại' : 'Current Band'}
              </span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)' }}>
                {item.current > 0 ? (
                  <>
                    {item.current.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>/ {item.max.toFixed(1)}</span>
                  </>
                ) : (
                  <span style={{ fontSize: '15px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>{isVi ? 'Chưa có điểm' : 'Not graded'}</span>
                )}
              </span>
            </div>

            {/* Radar / Progress Bar */}
            <div className="analytics-radar-bar" style={{ marginBottom: '16px' }}>
              <div 
                style={{ 
                  height: '100%', 
                  borderRadius: 6,
                  width: item.current > 0 ? `${(item.current / item.max) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)'
                }}
              ></div>
            </div>

            {/* Sub criteria */}
            {item.subCriteria.length > 0 && (
              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.03em' }}>
                  {isVi ? 'Tiêu chí đánh giá chi tiết' : 'Sub-skill Breakdown'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {item.subCriteria.map((sub, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                      <span style={{ color: 'var(--on-surface)' }}>{sub.name}</span>
                      <span style={{ fontWeight: 700, color: sub.score >= 8.0 ? '#16a34a' : sub.score >= 7.0 ? '#2563eb' : '#d97706' }}>
                        Band {sub.score.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          <span style={{ fontSize: '12px', backgroundColor: '#faf5ff', color: '#9333ea', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, border: '1px solid #e9d5ff' }}>
            Auto-Diagnostic v2.4
          </span>
        </div>

        <div className="std-eco-card-body">
          {highestSkill.current > 0 ? (
            <>
              {/* Diagnostic 1: Strength */}
              <div className="analytics-diagnostic-card strength">
                <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                    {isVi ? `Điểm mạnh nổi bật: ${highestSkill.skill} (Band ${highestSkill.current.toFixed(1)})` : `Key Strength: ${highestSkill.skill} (Band ${highestSkill.current.toFixed(1)})`}
                  </div>
                  <div style={{ opacity: 0.9 }}>
                    {isVi 
                      ? `Khả năng làm chủ kỹ năng ${highestSkill.skill} của bạn đạt mức tốt so với mục tiêu đề ra.`
                      : `Your mastery of ${highestSkill.skill} is performing solidly relative to target benchmarks.`}
                  </div>
                </div>
              </div>

              {/* Diagnostic 2: Weakness */}
              <div className="analytics-diagnostic-card weakness">
                <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                    {isVi ? `Trọng tâm cần bồi dưỡng: ${lowestSkill.skill} (Band ${lowestSkill.current.toFixed(1)})` : `Focus Area: ${lowestSkill.skill} (Band ${lowestSkill.current.toFixed(1)})`}
                  </div>
                  <div style={{ opacity: 0.9 }}>
                    {isVi 
                      ? `Điểm trung bình kỹ năng ${lowestSkill.skill} đang ở mức Band ${lowestSkill.current.toFixed(1)}. Bổ sung thêm các bài tập rèn luyện sẽ giúp nâng điểm nhanh chóng.`
                      : `Average score in ${lowestSkill.skill} currently stands at Band ${lowestSkill.current.toFixed(1)}. Completing targeted drills will bring noticeable progress.`}
                  </div>
                </div>
              </div>

              {/* Recommended Practice Action */}
              <div className="analytics-diagnostic-card recommendation" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Zap size={22} color="#2563eb" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {isVi ? `Bộ bài tập tăng tốc kỹ năng ${lowestSkill.skill}` : `Accelerated Drills for ${lowestSkill.skill}`}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: '13px' }}>
                      {isVi ? 'Được đề xuất tự động dựa trên kết quả các bài kiểm tra gần nhất' : 'Adaptive curriculum generated from your latest assignment results'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/student/assignments')}
                  style={{ padding: '8px 18px', fontSize: '13px' }}
                >
                  <span>{isVi ? 'Bắt đầu luyện tập ngay' : 'Start Practice Drills'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--on-surface-variant)' }}>
              <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, color: 'var(--on-surface)', marginBottom: '4px' }}>
                {isVi ? 'Chưa có đủ dữ liệu bài nộp để chẩn đoán AI' : 'Not enough submission data for AI diagnostics'}
              </p>
              <span style={{ fontSize: '13px' }}>
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
