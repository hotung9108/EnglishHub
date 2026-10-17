import React, { useState, useEffect, useMemo } from 'react';
import { Button, Skeleton } from '../components/common';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../api/services/report.service';
import type { ReportStudentProgressResponse, SkillAverage, ScoreTimeline } from '../types/report.types';
import '../styles/student-ecosystem.css';

interface SkillScore {
  skill: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';
  label: string;
  current: number;
}

function convertScoreTo10(scorePercent: number): number {
  return parseFloat((scorePercent / 10).toFixed(1));
}

export const StudentAnalytics: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ReportStudentProgressResponse | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleReload = () => setReloadKey(k => k + 1);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const data = await reportService.getStudentProgress(Number(user.id));
        if (!isMounted) return;

        setProgressData(data);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : isVi ? 'Không thể tải dữ liệu phân tích tiến độ.' : 'Failed to fetch student analytics.');
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
  }, [user?.id, isVi, reloadKey]);

  const skillsData: SkillScore[] = useMemo(() => {
    const skillConfigs: { key: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING'; labelVi: string; labelEn: string }[] = [
      { key: 'LISTENING', labelVi: 'Listening (Nghe)', labelEn: 'Listening' },
      { key: 'READING', labelVi: 'Reading (Đọc)', labelEn: 'Reading' },
      { key: 'WRITING', labelVi: 'Writing (Viết)', labelEn: 'Writing' },
      { key: 'SPEAKING', labelVi: 'Speaking (Nói)', labelEn: 'Speaking' }
    ];

    const skillMap = new Map<string, number>();
    progressData?.skillAverages?.forEach((s: SkillAverage) => {
      skillMap.set(s.skill.toUpperCase(), s.averageScorePercent);
    });

    return skillConfigs.map(cfg => {
      const apiScore = skillMap.get(cfg.key);
      const score10 = apiScore !== undefined ? convertScoreTo10(apiScore) : 0;

      return {
        skill: cfg.key,
        label: isVi ? cfg.labelVi : cfg.labelEn,
        current: score10
      };
    });
  }, [progressData, isVi]);

  const currentOverallBand = useMemo(() => {
    if (progressData?.skillAverages && progressData.skillAverages.length > 0) {
      const avgPercent = progressData.skillAverages.reduce((acc, curr) => acc + curr.averageScorePercent, 0) / progressData.skillAverages.length;
      return convertScoreTo10(avgPercent);
    }
    return null;
  }, [progressData]);

  const timeline: ScoreTimeline[] = useMemo(() => {
    return progressData?.scoreTimeline || [];
  }, [progressData]);

  if (loading) {
    return (
      <div className="std-eco-container pb-48">
        <Skeleton height="36px" width="260px" borderRadius="8px" className="mb-24" />
        <Skeleton height="90px" borderRadius="12px" className="mb-28" />
        <div className="analytics-grid">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} height="110px" borderRadius="12px" />
          ))}
        </div>
        <Skeleton height="180px" borderRadius="12px" />
      </div>
    );
  }

  return (
    <div className="std-eco-container pb-48">
      {/* Header */}
      <div className="std-eco-header">
        <h1 className="std-eco-title">
          {isVi ? 'Phân tích tiến độ học tập' : 'Progress Analytics'}
        </h1>
      </div>

      {error && (
        <div className="analytics-error-banner">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={handleReload}>
            {isVi ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Overview Card */}
      <div className="eh-card p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase text-muted font-semibold tracking-wider mb-1">
              {isVi ? 'Điểm trung bình tích lũy' : 'Cumulative Average Score'}
            </div>
            <div className="text-2xl font-bold text-surface">
              {currentOverallBand !== null ? `${currentOverallBand.toFixed(1)} / 10` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-muted font-semibold tracking-wider mb-1">
              {isVi ? 'Số bài tập đã chấm' : 'Graded Assignments'}
            </div>
            <div className="text-2xl font-bold text-surface">
              {timeline.length}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Skill Analysis Grid */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-surface mb-3">
          {isVi ? 'Điểm trung bình theo kỹ năng' : 'Skill Averages'}
        </h2>
        <div className="analytics-grid">
          {skillsData.map(item => (
            <div key={item.skill} className="analytics-skill-block">
              <div className="mb-2">
                <h3 className="analytics-skill-name">
                  {item.label}
                </h3>
              </div>

              <div className="analytics-score-row">
                <span className="analytics-score-label">
                  {isVi ? 'Điểm trung bình' : 'Average Score'}
                </span>
                <span className="analytics-score-val">
                  {item.current > 0 ? (
                    <>
                      {item.current.toFixed(1)} <span className="analytics-score-max">/ 10</span>
                    </>
                  ) : (
                    <span className="analytics-score-max">{isVi ? 'Chưa có điểm' : 'Not graded'}</span>
                  )}
                </span>
              </div>

              <div className="analytics-radar-bar">
                <div 
                  className="analytics-radar-fill"
                  style={{ 
                    width: item.current > 0 ? `${(item.current / 10) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score Timeline Table */}
      <div className="mb-8">
        <h2 className="text-base font-bold text-surface mb-3">
          {isVi ? 'Lịch sử điểm số theo bài tập' : 'Assignment Score Timeline'}
        </h2>
        {timeline.length === 0 ? (
          <div className="p-8 text-center text-muted bg-surface rounded-lg border-subtle">
            {isVi ? 'Chưa có bài tập nào được chấm điểm.' : 'No graded assignments recorded yet.'}
          </div>
        ) : (
          <div className="grades-table-responsive">
            <table className="grades-table">
              <thead>
                <tr>
                  <th className="text-left">{isVi ? 'BÀI TẬP' : 'ASSIGNMENT'}</th>
                  <th className="text-left">{isVi ? 'THỜI GIAN NỘP' : 'SUBMITTED AT'}</th>
                  <th className="text-right">{isVi ? 'ĐIỂM SỐ' : 'SCORE'}</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((item, idx) => {
                  const score10 = (item.scorePercent / 10).toFixed(1);
                  const formattedDate = item.submittedAt
                    ? new Date(item.submittedAt).toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={item.assignmentId || idx}>
                      <td className="text-left font-medium text-surface">{item.title}</td>
                      <td className="text-left text-muted font-mono">{formattedDate}</td>
                      <td className="text-right font-semibold text-surface">
                        {score10} / 10
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

export default StudentAnalytics;
