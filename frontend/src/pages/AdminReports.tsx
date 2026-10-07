import React, { useState } from 'react';
import { 
  GraduationCap, Sparkles, Users, 
  Download, Calendar, CheckCircle2, 
  AlertTriangle, FileSpreadsheet, Layers,
  TrendingUp, Award, Clock, ArrowUpRight,
  BookOpen, HelpCircle, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CalibrationItem {
  skill: string;
  totalGraded: number;
  avgAiScore: number;
  avgTeacherScore: number;
  mae: number;
  overrideRate: number;
  status: 'good' | 'warning' | 'excellent';
}

interface OutlierItem {
  id: string;
  assignmentTitle: string;
  studentName: string;
  skill: string;
  aiScore: number;
  teacherScore: number;
  delta: number;
  reason: string;
}

interface ClassPerformanceItem {
  code: string;
  name: string;
  teacher: string;
  students: number;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
  targetAttainment: number;
  submissionRate: number;
}

export const AdminReports: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'studentResults' | 'calibration' | 'teachers'>('studentResults');
  const [selectedPeriod, setSelectedPeriod] = useState('quarter');
  const [selectedClass, setSelectedClass] = useState('all');

  // Student Class Performance Data
  const classPerformances: ClassPerformanceItem[] = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive 6.5+ (Khóa A)',
      teacher: 'Cô Trần Thị Mai Lan',
      students: 24,
      listening: 7.2,
      reading: 7.0,
      writing: 6.6,
      speaking: 6.5,
      overall: 6.85,
      targetAttainment: 91.6,
      submissionRate: 96.0,
    },
    {
      code: 'ENG-IELTS-7.0B',
      name: 'IELTS Master 7.5+ Target',
      teacher: 'Thầy David Miller',
      students: 20,
      listening: 7.5,
      reading: 7.4,
      writing: 6.8,
      speaking: 6.8,
      overall: 7.15,
      targetAttainment: 90.0,
      submissionRate: 95.0,
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'TOEIC 4 Kỹ Năng Cấp Tốc',
      teacher: 'Thầy Nguyễn Văn Nam',
      students: 28,
      listening: 7.0,
      reading: 6.8,
      writing: 6.4,
      speaking: 6.2,
      overall: 6.60,
      targetAttainment: 85.7,
      submissionRate: 92.5,
    },
    {
      code: 'ENG-GRAM-PREP',
      name: 'Tiếng Anh Nền Tảng & Viết Câu',
      teacher: 'Cô Lê Hoàng Oanh',
      students: 22,
      listening: 6.5,
      reading: 6.6,
      writing: 6.0,
      speaking: 5.9,
      overall: 6.25,
      targetAttainment: 81.8,
      submissionRate: 91.0,
    },
    {
      code: 'ENG-IELTS-FAST',
      name: 'Luyện Đề IELTS Chuyên Sâu',
      teacher: 'Cô Trần Thị Mai Lan',
      students: 18,
      listening: 7.4,
      reading: 7.3,
      writing: 6.7,
      speaking: 6.6,
      overall: 7.00,
      targetAttainment: 94.4,
      submissionRate: 98.0,
    }
  ];

  // Top Performers & Students Needing Support
  const topStudents = [
    { name: 'Nguyễn Hoàng Long', classCode: 'ENG-IELTS-7.0B', overall: 8.5, growth: '+2.0 band', status: isVi ? 'Vượt chuẩn đầu ra' : 'Exceeded Target' },
    { name: 'Lê Bảo Trâm', classCode: 'ENG-IELTS-6.5A', overall: 8.0, growth: '+1.5 band', status: isVi ? 'Xuất sắc cả 4 kỹ năng' : 'Top 4-Skill Mastery' },
    { name: 'Alice Johnson', classCode: 'ENG-IELTS-7.0B', overall: 8.0, growth: '+1.5 band', status: isVi ? 'Writing Task 2: 8.5' : 'Writing Mastery' },
  ];

  const atRiskStudents = [
    { name: 'Đặng Minh Khôi', classCode: 'ENG-TOEIC-750', overall: 5.0, issue: isVi ? 'Thiếu 4 bài tập nộp' : 'Missing 4 assignments', action: isVi ? 'Cần nhắc nhở nộp bù' : 'Follow-up needed' },
    { name: 'Trần Văn Quân', classCode: 'ENG-GRAM-PREP', overall: 5.2, issue: isVi ? 'Điểm Viết 4.5 cần phụ đạo' : 'Writing 4.5 below target', action: isVi ? 'Gợi ý lớp trợ giảng' : 'Tutor session suggested' },
    { name: 'David Pham', classCode: 'ENG-IELTS-6.5A', overall: 5.5, issue: isVi ? 'Kỹ năng Nói 5.0 bị chậm' : 'Speaking 5.0 lagged', action: isVi ? 'Tăng cường luyện 1-1' : '1-on-1 drill needed' },
  ];

  // AI Calibration Data (Secondary)
  const calibrationData: CalibrationItem[] = [
    {
      skill: 'Writing Task 2 (Essay)',
      totalGraded: 520,
      avgAiScore: 6.6,
      avgTeacherScore: 6.8,
      mae: 0.35,
      overrideRate: 18.5,
      status: 'good'
    },
    {
      skill: 'Writing Task 1 (Report/Chart)',
      totalGraded: 480,
      avgAiScore: 6.4,
      avgTeacherScore: 6.5,
      mae: 0.28,
      overrideRate: 12.0,
      status: 'excellent'
    },
    {
      skill: 'Speaking Part 2 & 3 (Audio)',
      totalGraded: 390,
      avgAiScore: 6.2,
      avgTeacherScore: 6.6,
      mae: 0.45,
      overrideRate: 24.2,
      status: 'warning'
    },
    {
      skill: 'Reading Comprehension (Quiz)',
      totalGraded: 640,
      avgAiScore: 7.2,
      avgTeacherScore: 7.2,
      mae: 0.02,
      overrideRate: 1.5,
      status: 'excellent'
    },
    {
      skill: 'Listening Audio Test (Quiz)',
      totalGraded: 610,
      avgAiScore: 7.0,
      avgTeacherScore: 7.0,
      mae: 0.04,
      overrideRate: 1.8,
      status: 'excellent'
    }
  ];

  const outlierCases: OutlierItem[] = [
    {
      id: 'OUT-101',
      assignmentTitle: 'Writing Task 2: Artificial Intelligence & Workforce',
      studentName: 'Alice Johnson',
      skill: 'Writing',
      aiScore: 6.0,
      teacherScore: 7.5,
      delta: 1.5,
      reason: isVi ? 'AI đánh giá thấp phần Cohesion do cấu trúc Inversion hiếm gặp, GV nâng lại theo đúng band descriptor.' : 'AI penalized rare inverted syntax, teacher validated high-band lexical resource.'
    },
    {
      id: 'OUT-102',
      assignmentTitle: 'Speaking Part 2: Environmental Megacities',
      studentName: 'David Pham',
      skill: 'Speaking',
      aiScore: 7.0,
      teacherScore: 5.5,
      delta: -1.5,
      reason: isVi ? 'AI không nhận diện được tạp âm và hiện tượng đọc sẵn script; GV hạ điểm do vi phạm quy chế.' : 'AI missed background script reading; teacher flagged pre-prepared recitation.'
    },
    {
      id: 'OUT-103',
      assignmentTitle: 'Writing Task 1: Comparative Carbon Emissions',
      studentName: 'Lê Bảo Trâm',
      skill: 'Writing',
      aiScore: 6.5,
      teacherScore: 7.5,
      delta: 1.0,
      reason: isVi ? 'Dữ liệu số liệu phân tích chính xác, GV bổ sung điểm Task Achievement.' : 'Accurate complex data grouping acknowledged by teacher.'
    }
  ];

  // Teacher Stats
  const teacherStats = [
    { name: 'Cô Trần Thị Mai Lan', classes: 4, graded: 342, avgHours: 14.5, aiAcceptRate: 91 },
    { name: 'Thầy Nguyễn Văn Nam', classes: 3, graded: 218, avgHours: 19.2, aiAcceptRate: 86 },
    { name: 'Cô Lê Hoàng Oanh', classes: 3, graded: 195, avgHours: 16.8, aiAcceptRate: 89 },
    { name: 'Thầy David Miller', classes: 2, graded: 140, avgHours: 12.0, aiAcceptRate: 94 },
  ];

  const handleExport = (type: 'excel' | 'pdf') => {
    alert(isVi ? `Đang kết xuất báo cáo ${type.toUpperCase()}... File sẽ được tải xuống tự động.` : `Exporting ${type.toUpperCase()} report... Download will begin shortly.`);
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <div className="adm-rep-header-title-wrap">
            <h1 className="adm-title">
              <GraduationCap size={28} color="var(--primary)" />
              <span>{t('adminReports.title')}</span>
            </h1>
            <span className="adm-rep-header-badge">
              <Award size={13} />
              {isVi ? 'Khảo Thí & Chuẩn Đầu Ra' : 'Academic Attainment & Progress'}
            </span>
          </div>
          <p className="adm-subtitle">
            {t('adminReports.subtitle')}
          </p>
        </div>

        {/* Export Buttons */}
        <div className="adm-actions">
          <button 
            type="button"
            className="btn btn-secondary adm-rep-header-btn" 
            onClick={() => handleExport('excel')}
          >
            <FileSpreadsheet size={16} className="adm-rep-excel-icon" />
            <span>{t('adminReports.exportExcel')}</span>
          </button>
          <button 
            type="button"
            className="btn btn-primary adm-rep-header-btn" 
            onClick={() => handleExport('pdf')}
          >
            <Download size={16} />
            <span>{t('adminReports.exportPdf')}</span>
          </button>
        </div>
      </div>

      {/* Hero Banner: Centered on Student Outcomes */}
      <div className="adm-hero">
        <div className="adm-hero-content">
          <div>
            <div className="adm-rep-hero-meta">
              <span className="adm-rep-hero-tag">
                <Award size={13} />
                {isVi ? 'Tổng Quan Đào Tạo & Kết Quả Học Viên' : 'Center Academic Attainment'}
              </span>
              <span className="adm-rep-hero-subtitle">
                {isVi ? 'Đồng bộ kết quả từ hệ thống khảo thí & sổ điểm trung tâm' : 'Live synced from academic grading & exam records'}
              </span>
            </div>
            <h2 className="adm-rep-hero-title">
              {isVi ? 'Báo Cáo Kết Quả Học Tập & Tiến Độ Học Viên' : 'Student Learning Outcomes & Progress Report'}
            </h2>
            <p className="adm-rep-hero-desc">
              {isVi 
                ? 'Thống kê toàn diện về điểm số 4 kỹ năng (Nghe, Nói, Đọc, Viết), tỷ lệ đạt chuẩn cam kết đầu ra, tiến độ nộp bài và đánh giá mức độ tiến bộ của học viên toàn trung tâm.'
                : 'Comprehensive intelligence tracking 4-skill band progression (Listening, Reading, Writing, Speaking), target attainment rates, assignment completion, and student growth.'}
            </p>
          </div>
          <div className="adm-rep-hero-stats">
            <div className="adm-rep-hero-stat-card">
              <div className="adm-rep-hero-stat-label">{isVi ? 'Tổng học viên' : 'Tracked Students'}</div>
              <div className="adm-rep-hero-stat-val">318</div>
            </div>
            <div className="adm-rep-hero-stat-card">
              <div className="adm-rep-hero-stat-label">{isVi ? 'Đạt chuẩn đầu ra' : 'Target Attainment'}</div>
              <div className="adm-rep-hero-stat-val accent">88.4%</div>
            </div>
            <div className="adm-rep-hero-stat-card">
              <div className="adm-rep-hero-stat-label">{isVi ? 'Điểm TB toàn khóa' : 'Center Average'}</div>
              <div className="adm-rep-hero-stat-val primary">6.85</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar">
        <div className="adm-rep-filter-row">
          <div className="adm-rep-filter-item">
            <Calendar size={16} className="text-on-surface-variant" />
            <span className="adm-rep-filter-label">{t('adminReports.filterPeriod')}</span>
            <select 
              className="adm-rep-select" 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="month">{isVi ? '30 ngày qua' : 'Last 30 days'}</option>
              <option value="quarter">{isVi ? 'Học kỳ Q1-2026' : 'Q1-2026 Term'}</option>
              <option value="year">{isVi ? 'Toàn bộ năm học' : 'Full Academic Year'}</option>
            </select>
          </div>

          <div className="adm-rep-filter-item">
            <Layers size={16} className="text-on-surface-variant" />
            <span className="adm-rep-filter-label">{t('adminReports.filterClass')}</span>
            <select 
              className="adm-rep-select" 
              value={selectedClass} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              <option value="all">{isVi ? 'Tất cả các lớp' : 'All Classes'}</option>
              <option value="ENG-IELTS-6.5A">ENG-IELTS-6.5A</option>
              <option value="ENG-IELTS-7.0B">ENG-IELTS-7.0B</option>
              <option value="ENG-TOEIC-750">ENG-TOEIC-750</option>
              <option value="ENG-GRAM-PREP">ENG-GRAM-PREP</option>
              <option value="ENG-IELTS-FAST">ENG-IELTS-FAST</option>
            </select>
          </div>
        </div>

        <div className="adm-pills adm-rep-pills-wrap">
          {(
            [
              { key: 'studentResults', label: t('adminReports.tabStudentResults'), icon: GraduationCap },
              { key: 'calibration', label: t('adminReports.tabCalibration'), icon: Sparkles },
              { key: 'teachers', label: t('adminReports.tabTeacher'), icon: Users },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={`adm-pill ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: KẾT QUẢ HỌC VIÊN & LỚP HỌC (PRIMARY FOCUS) */}
      {activeTab === 'studentResults' && (
        <div className="adm-rep-content-stack">
          {/* Top Bento KPI Grid */}
          <div className="adm-kpi-grid">
            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <span className="adm-kpi-title">{isVi ? 'TỶ LỆ ĐẠT CHUẨN ĐẦU RA' : 'TARGET BAND ATTAINMENT'}</span>
                <div className="adm-kpi-icon-wrapper adm-rep-kpi-icon-green">
                  <Award size={18} />
                </div>
              </div>
              <div className="adm-kpi-value-row">
                <span className="adm-kpi-value">88.4%</span>
                <span className="adm-kpi-badge positive">
                  <ArrowUpRight size={12} />
                  +5.2%
                </span>
              </div>
              <div className="adm-kpi-footer">
                <span>{isVi ? '281/318 học viên đạt hoặc vượt target ban đầu' : '281/318 students achieved or exceeded entrance goal'}</span>
              </div>
            </div>

            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <span className="adm-kpi-title">{isVi ? 'ĐIỂM TRUNG BÌNH TOÀN KHÓA' : 'OVERALL CENTER BAND'}</span>
                <div className="adm-kpi-icon-wrapper adm-rep-kpi-icon-blue">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="adm-kpi-value-row">
                <span className="adm-kpi-value">6.85</span>
                <span className="adm-kpi-badge positive">
                  <ArrowUpRight size={12} />
                  +1.15 band
                </span>
              </div>
              <div className="adm-kpi-footer">
                <span>{isVi ? 'Tăng trưởng trung bình sau 12 tuần học' : 'Average band progression after 12-week syllabus'}</span>
              </div>
            </div>

            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <span className="adm-kpi-title">{isVi ? 'TỶ LỆ NỘP BÀI ĐÚNG HẠN' : 'ON-TIME SUBMISSION RATE'}</span>
                <div className="adm-kpi-icon-wrapper adm-rep-kpi-icon-purple">
                  <Clock size={18} />
                </div>
              </div>
              <div className="adm-kpi-value-row">
                <span className="adm-kpi-value">94.2%</span>
                <span className="adm-kpi-badge positive">
                  SLA High
                </span>
              </div>
              <div className="adm-kpi-footer">
                <span>{isVi ? 'Trung bình hoàn thành 14.1/15 bài tập được giao' : 'Average completed 14.1/15 assigned coursework'}</span>
              </div>
            </div>

            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <span className="adm-kpi-title">{isVi ? 'HỌC VIÊN CẦN HỖ TRỢ' : 'STUDENTS NEEDING SUPPORT'}</span>
                <div className="adm-kpi-icon-wrapper adm-rep-kpi-icon-amber">
                  <HelpCircle size={18} />
                </div>
              </div>
              <div className="adm-kpi-value-row">
                <span className="adm-kpi-value">18</span>
                <span className="adm-kpi-badge neutral">
                  5.8%
                </span>
              </div>
              <div className="adm-kpi-footer">
                <span>{isVi ? 'Điểm thi thử hoặc tiến độ nộp bài dưới 70%' : 'Exam simulation score or homework pace under 70%'}</span>
              </div>
            </div>
          </div>

          {/* 2-Column: Score Distribution & 4-Skill Band Performance */}
          <div className="adm-rep-grid-2col">
            {/* Phổ Điểm & Phân Bố Trình Độ */}
            <div className="adm-rep-card">
              <div className="adm-rep-card-header">
                <h3 className="adm-rep-card-title">
                  <BookOpen size={18} color="var(--primary)" />
                  <span>{isVi ? 'Phổ Điểm Toàn Khóa & Phân Bố Học Viên' : 'Center-wide Band Distribution'}</span>
                </h3>
                <p className="adm-rep-card-desc">
                  {isVi ? 'Tỷ lệ học viên đạt các mốc band điểm kiểm tra định kỳ gần nhất' : 'Breakdown of enrolled students across proficiency bands'}
                </p>
              </div>

              <div className="adm-rep-dist-list">
                <div className="adm-rep-dist-item">
                  <div className="adm-rep-dist-info">
                    <span className="adm-rep-dist-band-name">
                      <span className="adm-rep-dist-dot adm-rep-dot-expert"></span>
                      Band 8.0 - 9.0 (Xuất sắc / Vượt chuẩn)
                    </span>
                    <span className="adm-rep-dist-count"><strong>48</strong> {isVi ? 'học viên' : 'students'} (15%)</span>
                  </div>
                  <div className="adm-rep-dist-bar-track">
                    <div className="adm-rep-dist-bar-fill adm-rep-bar-expert"></div>
                  </div>
                </div>

                <div className="adm-rep-dist-item">
                  <div className="adm-rep-dist-info">
                    <span className="adm-rep-dist-band-name">
                      <span className="adm-rep-dist-dot adm-rep-dot-good"></span>
                      Band 7.0 - 7.5 (Giỏi / Đạt Target cao)
                    </span>
                    <span className="adm-rep-dist-count"><strong>142</strong> {isVi ? 'học viên' : 'students'} (45%)</span>
                  </div>
                  <div className="adm-rep-dist-bar-track">
                    <div className="adm-rep-dist-bar-fill adm-rep-bar-good"></div>
                  </div>
                </div>

                <div className="adm-rep-dist-item">
                  <div className="adm-rep-dist-info">
                    <span className="adm-rep-dist-band-name">
                      <span className="adm-rep-dist-dot adm-rep-dot-comp"></span>
                      Band 6.0 - 6.5 (Khá / Đạt Chuẩn)
                    </span>
                    <span className="adm-rep-dist-count"><strong>96</strong> {isVi ? 'học viên' : 'students'} (30%)</span>
                  </div>
                  <div className="adm-rep-dist-bar-track">
                    <div className="adm-rep-dist-bar-fill adm-rep-bar-comp"></div>
                  </div>
                </div>

                <div className="adm-rep-dist-item">
                  <div className="adm-rep-dist-info">
                    <span className="adm-rep-dist-band-name">
                      <span className="adm-rep-dist-dot adm-rep-dot-modest"></span>
                      {isVi ? 'Dưới Band 6.0 (Cần hỗ trợ phụ đạo)' : 'Below 6.0 (Requires tutoring)'}
                    </span>
                    <span className="adm-rep-dist-count"><strong>32</strong> {isVi ? 'học viên' : 'students'} (10%)</span>
                  </div>
                  <div className="adm-rep-dist-bar-track">
                    <div className="adm-rep-dist-bar-fill adm-rep-bar-modest"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tiến Bộ 4 Kỹ Năng */}
            <div className="adm-rep-card">
              <div className="adm-rep-card-header">
                <h3 className="adm-rep-card-title">
                  <TrendingUp size={18} color="#16a34a" />
                  <span>{isVi ? 'Tăng Trưởng Điểm TB Theo 4 Kỹ Năng' : '4-Skill Average & Progression'}</span>
                </h3>
                <p className="adm-rep-card-desc">
                  {isVi ? 'Điểm trung bình hiện tại so với bài test đầu vào toàn trung tâm' : 'Current center average vs entrance diagnostic test'}
                </p>
              </div>

              <div className="adm-rep-skill-grid">
                <div className="adm-rep-skill-card">
                  <div className="adm-rep-skill-header">
                    <span className="adm-rep-skill-name">Listening</span>
                  </div>
                  <span className="adm-rep-skill-score">7.2</span>
                  <div className="adm-rep-skill-bar-track">
                    <div className="adm-rep-skill-bar-fill"></div>
                  </div>
                  <div className="adm-rep-skill-footer">
                    <span className="adm-rep-skill-growth">
                      <ArrowUpRight size={12} /> +1.4
                    </span>
                    <span className="adm-rep-skill-baseline">{isVi ? 'Gốc 5.8' : 'Base 5.8'}</span>
                  </div>
                </div>

                <div className="adm-rep-skill-card">
                  <div className="adm-rep-skill-header">
                    <span className="adm-rep-skill-name">Reading</span>
                  </div>
                  <span className="adm-rep-skill-score">7.1</span>
                  <div className="adm-rep-skill-bar-track">
                    <div className="adm-rep-skill-bar-fill"></div>
                  </div>
                  <div className="adm-rep-skill-footer">
                    <span className="adm-rep-skill-growth">
                      <ArrowUpRight size={12} /> +1.1
                    </span>
                    <span className="adm-rep-skill-baseline">{isVi ? 'Gốc 6.0' : 'Base 6.0'}</span>
                  </div>
                </div>

                <div className="adm-rep-skill-card">
                  <div className="adm-rep-skill-header">
                    <span className="adm-rep-skill-name">Writing</span>
                  </div>
                  <span className="adm-rep-skill-score">6.5</span>
                  <div className="adm-rep-skill-bar-track">
                    <div className="adm-rep-skill-bar-fill"></div>
                  </div>
                  <div className="adm-rep-skill-footer">
                    <span className="adm-rep-skill-growth">
                      <ArrowUpRight size={12} /> +1.3
                    </span>
                    <span className="adm-rep-skill-baseline">{isVi ? 'Gốc 5.2' : 'Base 5.2'}</span>
                  </div>
                </div>

                <div className="adm-rep-skill-card">
                  <div className="adm-rep-skill-header">
                    <span className="adm-rep-skill-name">Speaking</span>
                  </div>
                  <span className="adm-rep-skill-score">6.4</span>
                  <div className="adm-rep-skill-bar-track">
                    <div className="adm-rep-skill-bar-fill"></div>
                  </div>
                  <div className="adm-rep-skill-footer">
                    <span className="adm-rep-skill-growth">
                      <ArrowUpRight size={12} /> +1.4
                    </span>
                    <span className="adm-rep-skill-baseline">{isVi ? 'Gốc 5.0' : 'Base 5.0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng Kết Quả Học Tập Theo Lớp */}
          <div className="adm-table-card">
            <div className="adm-table-header">
              <div>
                <h3 className="adm-table-title">
                  {isVi ? 'Bảng Thống Kê Kết Quả Học Tập Theo Lớp Học' : 'Cohort Academic Performance Matrix'}
                </h3>
                <p className="adm-subtitle">
                  {isVi ? 'Chi tiết điểm trung bình 4 kỹ năng, tỷ lệ đạt chuẩn và tiến độ nộp bài của từng lớp' : 'Per-class breakdown of 4-skill averages, syllabus completion, and target attainment'}
                </p>
              </div>
            </div>

            <div className="adm-rep-table-scroll">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>{isVi ? 'MÃ & TÊN LỚP' : 'CLASS'}</th>
                    <th>{isVi ? 'GIÁO VIÊN' : 'INSTRUCTOR'}</th>
                    <th>{isVi ? 'SĨ SỐ' : 'STUDENTS'}</th>
                    <th>LISTENING</th>
                    <th>READING</th>
                    <th>WRITING</th>
                    <th>SPEAKING</th>
                    <th>OVERALL</th>
                    <th>{isVi ? 'ĐẠT TARGET' : 'TARGET PASS'}</th>
                    <th>{isVi ? 'TIẾN ĐỘ NỘP BÀI' : 'COMPLETION'}</th>
                  </tr>
                </thead>
                <tbody>
                  {classPerformances.map((c) => (
                    <tr key={c.code}>
                      <td>
                        <div className="adm-rep-class-title">{c.code}</div>
                        <div className="adm-rep-class-sub">{c.name}</div>
                      </td>
                      <td>{c.teacher}</td>
                      <td className="font-semibold">{c.students}</td>
                      <td className="adm-rep-skill-cell">{c.listening}</td>
                      <td className="adm-rep-skill-cell">{c.reading}</td>
                      <td className="adm-rep-skill-cell">{c.writing}</td>
                      <td className="adm-rep-skill-cell">{c.speaking}</td>
                      <td className="text-center">
                        <span className="adm-rep-overall-pill">{c.overall}</span>
                      </td>
                      <td className="text-center">
                        <span className="adm-rep-target-pass-pill">
                          {c.targetAttainment}%
                        </span>
                      </td>
                      <td>
                        <div className="adm-rep-progress-track">
                          <div className="adm-rep-progress-fill"></div>
                        </div>
                        <span className="font-semibold text-on-surface">{c.submissionRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Spotlight: Top Performers & Students Needing Support */}
          <div className="adm-rep-spotlight-grid">
            {/* Top Performers */}
            <div className="adm-rep-card">
              <div className="adm-rep-card-header">
                <h3 className="adm-rep-card-title">
                  <Award size={18} color="#15803d" />
                  <span>{isVi ? 'Học Viên Tiêu Biểu & Tiến Bộ Vượt Bậc' : 'Top Performing Students'}</span>
                </h3>
                <p className="adm-rep-card-desc">
                  {isVi ? 'Học viên có điểm số cao nhất và đạt mức độ bứt phá band điểm ấn tượng' : 'Students demonstrating high band attainment and exceptional growth'}
                </p>
              </div>

              <div className="adm-rep-student-list">
                {topStudents.map((st, i) => {
                  const avatarClass = i === 0 ? 'adm-rep-av-blue' : i === 1 ? 'adm-rep-av-violet' : 'adm-rep-av-emerald';
                  const initials = st.name.split(' ').map(n => n[0]).slice(-2).join('');
                  return (
                    <div key={i} className="adm-rep-student-item">
                      <div className="adm-rep-student-left">
                        <div className={`adm-rep-student-avatar ${avatarClass}`}>
                          {initials}
                        </div>
                        <div className="adm-rep-student-meta">
                          <span className="adm-rep-student-name">{st.name}</span>
                          <span className="adm-rep-student-sub">{st.classCode} • {st.status}</span>
                        </div>
                      </div>
                      <span className="adm-rep-student-badge-pos">
                        Overall {st.overall} ({st.growth})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Students Needing Support */}
            <div className="adm-rep-card">
              <div className="adm-rep-card-header">
                <h3 className="adm-rep-card-title">
                  <AlertTriangle size={18} color="#d97706" />
                  <span>{isVi ? 'Học Viên Cần Quan Tâm & Hỗ Trợ Kịp Thời' : 'Students Requiring Academic Attention'}</span>
                </h3>
                <p className="adm-rep-card-desc">
                  {isVi ? 'Danh sách học viên có điểm dưới ngưỡng target hoặc thiếu nhiều bài tập' : 'Students flagged with sub-target results or missing homework submissions'}
                </p>
              </div>

              <div className="adm-rep-student-list">
                {atRiskStudents.map((st, i) => {
                  const avatarClass = i === 0 ? 'adm-rep-av-amber' : i === 1 ? 'adm-rep-av-rose' : 'adm-rep-av-orange';
                  const initials = st.name.split(' ').map(n => n[0]).slice(-2).join('');
                  return (
                    <div key={i} className="adm-rep-student-item">
                      <div className="adm-rep-student-left">
                        <div className={`adm-rep-student-avatar ${avatarClass}`}>
                          {initials}
                        </div>
                        <div className="adm-rep-student-meta">
                          <span className="adm-rep-student-name">{st.name}</span>
                          <span className="adm-rep-student-sub">{st.classCode} • {st.issue}</span>
                        </div>
                      </div>
                      <span className="adm-rep-student-badge-neg">
                        Band {st.overall} • {st.action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Compact AI Grading Performance Summary Callout (Secondary Role) */}
          <div className="adm-rep-ai-banner">
            <div className="adm-rep-ai-banner-left">
              <span className="adm-rep-ai-banner-badge">
                <Sparkles size={14} />
                {isVi ? 'Hỗ Trợ Chấm Điểm Bởi AI Engine' : 'AI-Assisted Grading Telemetry'}
              </span>
              <h4 className="adm-rep-ai-banner-title">
                {isVi ? 'Đánh Giá Sơ Bộ Hiệu Suất Chấm Điểm AI Trong Kỳ' : 'AI Assessment Support & Turnaround Telemetry'}
              </h4>
              <p className="adm-rep-ai-banner-desc">
                {isVi 
                  ? 'AI Engine đã đồng hành cùng giảng viên chấm 2,640 bài tập, đảm bảo độ sai lệch MAE trong ngưỡng an toàn ISO (±0.24 band) và tiết kiệm 880 giờ chấm bài để thầy cô tập trung hỗ trợ từng học viên.'
                  : 'AI Engine assisted in grading 2,640 submissions, maintaining ISO-compliant variance (MAE ±0.24 band) and saving 880 hours for personalized student feedback.'}
              </p>
            </div>

            <div className="adm-rep-ai-banner-right">
              <div className="adm-rep-ai-banner-metrics">
                <div className="adm-rep-ai-metric-box">
                  <div className="adm-rep-ai-metric-label">{isVi ? 'Lượt chấm' : 'Graded'}</div>
                  <div className="adm-rep-ai-metric-val">2,640</div>
                </div>
                <div className="adm-rep-ai-metric-box">
                  <div className="adm-rep-ai-metric-label">{isVi ? 'Sai số MAE' : 'MAE'}</div>
                  <div className="adm-rep-ai-metric-val">±0.24</div>
                </div>
                <div className="adm-rep-ai-metric-box">
                  <div className="adm-rep-ai-metric-label">{isVi ? 'GV đồng thuận' : 'Consensus'}</div>
                  <div className="adm-rep-ai-metric-val">85.8%</div>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-secondary adm-rep-header-btn"
                onClick={() => setActiveTab('calibration')}
              >
                <span>{isVi ? 'Xem bảng đối soát AI' : 'View AI Calibration'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ĐÁNH GIÁ HIỆU SUẤT AI (SECONDARY EVALUATION) */}
      {activeTab === 'calibration' && (
        <div className="adm-rep-content-stack">
          {/* AI Metrics KPIs */}
          <div className="adm-kpi-grid">
            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <span className="adm-kpi-title">{isVi ? 'ĐỘ LỆCH TRUNG BÌNH (MAE)' : 'MEAN ABSOLUTE ERROR'}</span>
                <div className="adm-kpi-icon-wrapper adm-rep-kpi-icon-blue">
                  <Sparkles size={18} />
                </div>
              </div>
              <div className="adm-kpi-value-row">
                <span className="adm-kpi-value">0.24</span>
                <span className="adm-kpi-badge positive">
                  <CheckCircle2 size={12} />
                  ISO Compliant
                </span>
              </div>
              <div className="adm-kpi-footer">
                <span>{isVi ? 'Đạt chuẩn ISO AI Assessment (< 0.5 band)' : 'Meets ISO AI Assessment standard (< 0.5 band)'}</span>
              </div>
            </div>

            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <span className="adm-kpi-title">{isVi ? 'TỶ LỆ GV ĐỒNG THUẬN AI' : 'TEACHER CONSENSUS RATE'}</span>
                <div className="adm-kpi-icon-wrapper adm-rep-kpi-icon-green">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="adm-kpi-value-row">
                <span className="adm-kpi-value">85.8%</span>
                <span className="adm-kpi-badge positive">
                  <ArrowUpRight size={12} />
                  +3.4%
                </span>
              </div>
              <div className="adm-kpi-footer">
                <span>{isVi ? '+3.4% so với học kỳ trước' : '+3.4% compared to previous semester'}</span>
              </div>
            </div>

            <div className="adm-kpi-card">
              <div className="adm-kpi-header">
                <span className="adm-kpi-title">{isVi ? 'TỔNG LƯỢT AI CHẤM (Q1)' : 'TOTAL AI GRADINGS'}</span>
                <div className="adm-kpi-icon-wrapper adm-rep-kpi-icon-purple">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="adm-kpi-value-row">
                <span className="adm-kpi-value">2,640</span>
                <span className="adm-kpi-badge neutral">
                  -880 hrs
                </span>
              </div>
              <div className="adm-kpi-footer">
                <span>{isVi ? 'Tiết kiệm ~880 giờ chấm của giảng viên' : 'Saved ~880 grading hours for faculty'}</span>
              </div>
            </div>
          </div>

          {/* AI vs Teacher Calibration Matrix */}
          <div className="adm-table-card">
            <div className="adm-table-header">
              <div>
                <h3 className="adm-table-title">
                  {isVi ? 'Bảng Đối Soát Hiệu Chuẩn AI Theo Kỹ Năng' : 'AI vs Faculty Calibration Breakdown by Skill'}
                </h3>
                <p className="adm-subtitle">
                  {isVi ? 'So sánh điểm số AI đề xuất và điểm chốt thực tế của Giáo viên để kiểm soát chất lượng' : 'Comparative variance between AI prediction and Teacher finalized band'}
                </p>
              </div>
            </div>

            <div className="adm-rep-table-scroll">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>{isVi ? 'PHÂN LOẠI KỸ NĂNG' : 'SKILL MODULE'}</th>
                    <th>{isVi ? 'LƯỢT CHẤM' : 'SAMPLES'}</th>
                    <th>{isVi ? 'ĐIỂM AI TB' : 'AVG AI SCORE'}</th>
                    <th>{isVi ? 'ĐIỂM GV TB' : 'AVG TEACHER'}</th>
                    <th>{isVi ? 'ĐỘ LỆCH (MAE)' : 'MAE DELTA'}</th>
                    <th>{isVi ? 'TỶ LỆ GV SỬA ĐIỂM' : 'OVERRIDE RATE'}</th>
                    <th>{isVi ? 'ĐÁNH GIÁ ĐỘ CHÍNH XÁC' : 'ACCURACY STATUS'}</th>
                  </tr>
                </thead>
                <tbody>
                  {calibrationData.map((item, i) => (
                    <tr key={i}>
                      <td className="font-semibold">{item.skill}</td>
                      <td>{item.totalGraded}</td>
                      <td className="font-semibold text-secondary">{item.avgAiScore}</td>
                      <td className="font-semibold text-primary">{item.avgTeacherScore}</td>
                      <td>
                        <span className={`adm-badge ${item.mae < 0.1 ? 'adm-rep-mae-excellent' : item.mae < 0.4 ? 'adm-rep-mae-good' : 'adm-rep-mae-warning'}`}>
                          ±{item.mae}
                        </span>
                      </td>
                      <td>{item.overrideRate}%</td>
                      <td>
                        <span className={`adm-badge ${item.status === 'excellent' ? 'badge-active' : item.status === 'good' ? 'badge-active' : 'badge-warning'}`}>
                          {item.status === 'excellent' ? (isVi ? 'Xuất sắc (>95%)' : 'Excellent') : item.status === 'good' ? (isVi ? 'Tốt (Ổn định)' : 'Good') : (isVi ? 'Cần hiệu chỉnh Prompt' : 'Needs Calibration')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Outliers Section */}
          <div className="adm-rep-card">
            <h3 className="adm-rep-card-title">
              <AlertTriangle size={18} className="adm-rep-alert-icon" />
              <span>{isVi ? 'Các Ca Lệch Điểm Lớn (> 1.0 Band) Cần Rà Soát' : 'High Variance Outlier Cases (> 1.0 Band Deviation)'}</span>
            </h3>
            <p className="adm-rep-card-desc">
              {isVi 
                ? 'Nhật ký các bài nộp mà giáo viên can thiệp sửa điểm chênh lệch nhiều so với AI để đội ngũ kỹ thuật hiệu chỉnh prompt.' 
                : 'Audited submissions where teacher score deviated significantly from AI prompt output.'}
            </p>

            <div className="adm-rep-outlier-list">
              {outlierCases.map((out) => (
                <div key={out.id} className="adm-rep-outlier-card">
                  <div className="adm-rep-outlier-header">
                    <span className="adm-rep-outlier-title">{out.assignmentTitle}</span>
                    <span className={out.delta > 0 ? 'adm-rep-outlier-badge-pos' : 'adm-rep-outlier-badge-neg'}>
                      AI: {out.aiScore} → GV: {out.teacherScore} ({out.delta > 0 ? `+${out.delta}` : out.delta})
                    </span>
                  </div>
                  <div className="adm-rep-outlier-meta">
                    {isVi ? 'Học viên: ' : 'Student: '}<strong>{out.studentName}</strong> • {isVi ? 'Kỹ năng: ' : 'Skill: '}<strong>{out.skill}</strong>
                  </div>
                  <div className="adm-rep-outlier-reason">
                    <strong>{isVi ? 'Lý do giáo viên ghi nhận: ' : 'Teacher Justification: '}</strong>{out.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HIỆU SUẤT GIẢNG VIÊN */}
      {activeTab === 'teachers' && (
        <div className="adm-table-card">
          <div className="adm-table-header">
            <div>
              <h3 className="adm-table-title">
                {isVi ? 'Chỉ Số Hiệu Suất Giảng Viên & Chấm Chữa' : 'Teacher Grading Turnaround & Operations'}
              </h3>
              <p className="adm-subtitle">
                {isVi ? 'Theo dõi thời gian trả bài và mức độ phối hợp chấm bài của từng giảng viên' : 'Turnaround SLA compliance and faculty grading turnaround times'}
              </p>
            </div>
          </div>
          <div className="adm-rep-table-scroll">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{isVi ? 'GIÁO VIÊN' : 'TEACHER'}</th>
                  <th>{isVi ? 'LỚP PHỤ TRÁCH' : 'CLASSES'}</th>
                  <th>{isVi ? 'BÀI ĐÃ CHẤM (Q1)' : 'GRADED SUBMISSIONS'}</th>
                  <th>{isVi ? 'THỜI GIAN TRẢ BÀI TB' : 'AVG TURNAROUND'}</th>
                  <th>{isVi ? 'ĐỒNG THUẬN ANNOTATION AI' : 'AI ANNOTATION ACCEPT'}</th>
                  <th>{isVi ? 'ĐÁNH GIÁ VẬN HÀNH' : 'SLA STATUS'}</th>
                </tr>
              </thead>
              <tbody>
                {teacherStats.map((tc, i) => (
                  <tr key={i}>
                    <td className="font-semibold">{tc.name}</td>
                    <td>{tc.classes} {isVi ? 'lớp' : 'classes'}</td>
                    <td className="font-semibold text-primary">{tc.graded} {isVi ? 'bài' : 'submissions'}</td>
                    <td>
                      <span className="adm-badge badge-active">{tc.avgHours}h (Đạt SLA &lt; 24h)</span>
                    </td>
                    <td>{tc.aiAcceptRate}%</td>
                    <td>
                      <span className="adm-badge badge-active adm-rep-badge-flex">
                        <CheckCircle2 size={12} /> {isVi ? 'Đạt chuẩn SLA' : 'Compliant'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
