import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Sparkles, AlertTriangle, 
  CheckCircle2, ArrowRight, Target,
  PenTool, Mic, BookOpen, Headphones, Zap
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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

export const StudentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'all'>('month');

  const skillsData: SkillScore[] = [
    {
      skill: 'Listening',
      current: 8.0,
      target: 8.5,
      max: 9.0,
      status: 'strong',
      percentile: 88,
      testsCompleted: 6,
      subCriteria: [
        { name: isVi ? 'Section 1 & 2 (Đời sống & Thủ tục)' : 'Section 1 & 2 (General)', score: 8.5 },
        { name: isVi ? 'Section 3 & 4 (Hội thảo & Học thuật)' : 'Section 3 & 4 (Academic)', score: 7.5 },
        { name: isVi ? 'Bẫy số liệu & chính tả' : 'Numerals & Spelling accuracy', score: 8.0 }
      ]
    },
    {
      skill: 'Reading',
      current: 7.5,
      target: 8.0,
      max: 9.0,
      status: 'strong',
      percentile: 82,
      testsCompleted: 8,
      subCriteria: [
        { name: isVi ? 'Matching Headings (Nối tiêu đề)' : 'Matching Headings', score: 8.5 },
        { name: isVi ? 'Multiple Choice (Trắc nghiệm)' : 'Multiple Choice', score: 7.5 },
        { name: isVi ? 'True / False / Not Given' : 'True / False / Not Given', score: 6.5 }
      ]
    },
    {
      skill: 'Writing',
      current: 7.0,
      target: 7.5,
      max: 9.0,
      status: 'average',
      percentile: 74,
      testsCompleted: 5,
      subCriteria: [
        { name: 'Task Achievement / Response', score: 7.5 },
        { name: 'Coherence & Cohesion', score: 7.0 },
        { name: 'Lexical Resource (Từ vựng)', score: 7.5 },
        { name: 'Grammatical Range & Accuracy', score: 6.5 }
      ]
    },
    {
      skill: 'Speaking',
      current: 7.0,
      target: 8.0,
      max: 9.0,
      status: 'needs_work',
      percentile: 69,
      testsCompleted: 4,
      subCriteria: [
        { name: 'Fluency & Coherence', score: 7.5 },
        { name: 'Lexical Resource', score: 7.0 },
        { name: 'Grammatical Range', score: 7.0 },
        { name: 'Pronunciation & Intonation', score: 6.5 }
      ]
    }
  ];

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
            onChange={(e) => setTimeRange(e.target.value as any)}
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

      {/* Target vs Current Hero Card */}
      <div className="std-eco-hero">
        <div className="std-eco-hero-content">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.18)', padding: '5px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700, marginBottom: '12px' }}>
              <Target size={15} />
              <span>{isVi ? 'Mục tiêu chứng chỉ: IELTS Academic 7.5 - 8.0' : 'Target Goal: IELTS Academic 7.5 - 8.0'}</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.01em' }}>
              {isVi ? 'Bạn đã đạt 82% chặng đường đến Band 7.5+ 🎉' : 'You have completed 82% of your target milestone 🎉'}
            </h2>
            <p style={{ fontSize: '14px', opacity: 0.88, margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              {isVi 
                ? 'Kỹ năng Listening và Reading của bạn đang ở phong độ xuất sắc (Band 7.5 - 8.0). Tập trung bồi dưỡng Speaking Part 3 và Ngữ pháp Writing để bức phá điểm tổng!'
                : 'Listening & Reading are excelling at Band 7.5 - 8.0. Channel focused effort into Speaking Part 3 and Writing grammatical range.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '18px 24px', borderRadius: '14px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>7.5</div>
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
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#86efac', lineHeight: 1 }}>Top 15%</div>
              <div style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', marginTop: '4px' }}>
                {isVi ? 'Thứ hạng lớp' : 'Percentile'}
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
                {item.current.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>/ {item.max.toFixed(1)}</span>
              </span>
            </div>

            {/* Radar / Progress Bar */}
            <div className="analytics-radar-bar" style={{ marginBottom: '16px' }}>
              <div 
                style={{ 
                  height: '100%', 
                  borderRadius: 6,
                  width: `${(item.current / item.max) * 100}%`,
                  background: 'linear-gradient(90deg, #2563eb 0%, #38bdf8 100%)'
                }}
              ></div>
            </div>

            {/* Sub criteria */}
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
          {/* Diagnostic 1: Strength */}
          <div className="analytics-diagnostic-card strength">
            <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                {isVi ? 'Điểm mạnh nổi bật: Skimming & Kỹ năng Đọc hiểu Ý chính (Band 8.5)' : 'Key Strength: Skimming & Global Meaning Comprehension (Band 8.5)'}
              </div>
              <div style={{ opacity: 0.9 }}>
                {isVi 
                  ? 'Tốc độ đọc của bạn đạt 245 từ/phút với độ chính xác 100% ở dạng bài Matching Headings. Khả năng tóm lược chủ đề đoạn văn đã đạt mức thành thạo.'
                  : 'Reading speed reached 245 wpm with 100% accuracy in Matching Headings. Paragraph main idea synthesis is firmly mastered.'}
              </div>
            </div>
          </div>

          {/* Diagnostic 2: Weakness */}
          <div className="analytics-diagnostic-card weakness">
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                {isVi ? 'Lỗ hổng cần xử lý: Bẫy suy luận True / False / Not Given (Tỷ lệ sai 38%)' : 'Critical Weakness: Distractor Trap in True / False / Not Given (38% Error Rate)'}
              </div>
              <div style={{ opacity: 0.9 }}>
                {isVi 
                  ? 'Bạn thường có xu hướng suy diễn thêm từ kiến thức thực tế bên ngoài thay vì bám sát ngữ cảnh văn bản đối với các câu Not Given.'
                  : 'Tendency to extrapolate assumptions beyond the passage boundaries instead of strictly adhering to text evidence for Not Given statements.'}
              </div>
            </div>
          </div>

          {/* Diagnostic 3: Speaking Intonation */}
          <div className="analytics-diagnostic-card weakness">
            <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: '3px' }}>
                {isVi ? 'Lỗi phát âm: Thiếu âm đuôi /s/, /z/ và nối âm phụ âm - nguyên âm' : 'Pronunciation Alert: Ending sibilants /s/, /z/ omission & Consonant-Vowel Linking'}
              </div>
              <div style={{ opacity: 0.9 }}>
                {isVi 
                  ? 'Phân tích âm vị AI phát hiện 14 lần ngắt quãng giữa các từ có thể nối liền. Việc cải thiện nối âm sẽ nâng điểm Fluency lên Band 7.5+.'
                  : 'AI acoustic model flagged 14 hesitation breaks where connected speech could apply. Practicing linking sounds will elevate Fluency to 7.5+.'}
              </div>
            </div>
          </div>

          {/* Recommended Practice Action */}
          <div className="analytics-diagnostic-card recommendation" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={22} color="#2563eb" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700 }}>
                  {isVi ? 'Bộ bài tập luyện bẫy True / False / Not Given & Shadowing Speaking' : 'Recommended Practice: TFNG Diagnostic Drills & Speaking Shadowing'}
                </div>
                <div style={{ opacity: 0.9, fontSize: '13px' }}>
                  {isVi ? 'Được đề xuất tự động dựa trên kết quả 3 bài làm gần nhất' : 'Adaptive curriculum generated from your latest 3 assignment submissions'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="std-eco-btn-primary"
              onClick={() => navigate('/student/assignments')}
            >
              <span>{isVi ? 'Luyện tập ngay' : 'Start Remedial Drill'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;
