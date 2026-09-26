import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, BookOpen, Sparkles, 
  ArrowUpRight, Plus, ShieldCheck, 
  BarChart3, CheckCircle2, Clock, 
  ChevronRight, Zap, FileSpreadsheet, History
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [activityFilter, setActivityFilter] = useState<'all' | 'enrollment' | 'grading' | 'alert'>('all');

  const activities = [
    {
      id: 'act-1',
      type: 'enrollment',
      title: isVi ? 'Cô Trần Thị Mai Lan đã thêm 2 học viên mới' : 'Trần Thị Mai Lan enrolled 2 new students',
      target: 'ENG-IELTS-6.5A',
      time: isVi ? '8 phút trước' : '8 mins ago',
      icon: Users,
      iconBg: '#eff6ff',
      iconColor: '#2563eb'
    },
    {
      id: 'act-2',
      type: 'grading',
      title: isVi ? 'AI Engine hoàn thành chấm 24 bài Writing Task 2' : 'AI Engine graded 24 Writing Task 2 essays',
      target: 'ENG-IELTS-6.5A',
      time: isVi ? '25 phút trước' : '25 mins ago',
      icon: Sparkles,
      iconBg: '#faf5ff',
      iconColor: '#7e22ce'
    },
    {
      id: 'act-3',
      type: 'alert',
      title: isVi ? 'Cảnh báo: Học viên David Pham vắng 2 buổi liên tiếp' : 'Alert: David Pham missed 2 consecutive sessions',
      target: 'ENG-TOEIC-750',
      time: isVi ? '1 giờ trước' : '1 hour ago',
      icon: Clock,
      iconBg: '#fef2f2',
      iconColor: '#dc2626'
    },
    {
      id: 'act-4',
      type: 'grading',
      title: isVi ? 'Thầy Nguyễn Văn Nam đã duyệt và trả bài chấm nói' : 'Nguyễn Văn Nam finalized Speaking reviews',
      target: 'ENG-GRAM-PREP',
      time: isVi ? '3 giờ trước' : '3 hours ago',
      icon: CheckCircle2,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a'
    }
  ];

  const filteredActivities = activities.filter(act => {
    if (activityFilter === 'all') return true;
    return act.type === activityFilter;
  });

  return (
    <div className="adm-container">
      {/* Executive Hero Banner */}
      <div className="adm-hero">
        <div className="adm-hero-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="adm-title-badge" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
                {isVi ? 'Học kỳ Q1-2026 • Executive Portal' : 'Term Q1-2026 • Executive Portal'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#86efac' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }}></span>
                {isVi ? 'Hệ thống vận hành tối ưu' : 'All Systems Operational'}
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
              {isVi ? 'Bảng Điều Hành Trung Tâm Quản Trị' : 'Center Executive Control Panel'}
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', maxWidth: '620px', lineHeight: 1.5 }}>
              {isVi 
                ? 'Tổng quan thời gian thực về quy mô đào tạo, tỷ lệ chấm bài AI, chất lượng đầu ra học viên và kiểm toán giảng dạy.' 
                : 'Real-time telemetry on student cohort growth, AI grading throughput, academic outcomes, and faculty audit.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/admin/classes/create')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '10px 18px' }}
            >
              <Plus size={16} />
              <span>{isVi ? 'Tạo lớp học' : 'Create Class'}</span>
            </button>
            <button 
              className="btn"
              onClick={() => navigate('/admin/reports')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.12)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '10px 18px' }}
            >
              <BarChart3 size={16} />
              <span>{isVi ? 'Báo cáo hiệu chuẩn' : 'Calibration Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Bento KPI Cards */}
      <div className="adm-kpi-grid">
        {/* KPI 1 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/students')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỔNG HỌC VIÊN' : 'TOTAL STUDENTS'}</div>
              <div className="adm-kpi-value">1,248</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">
              <ArrowUpRight size={13} /> +12.4%
            </span>
            <span className="text-on-surface-variant">{isVi ? 'so với tháng trước' : 'vs last month'}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/teachers')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'GIẢNG VIÊN HOẠT ĐỘNG' : 'ACTIVE TEACHERS'}</div>
              <div className="adm-kpi-value">45</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">100%</span>
            <span className="text-on-surface-variant">{isVi ? 'đạt chuẩn SLA chấm bài' : 'compliant with SLA'}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/classes')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'LỚP HỌC ĐANG MỞ' : 'ACTIVE CLASSES'}</div>
              <div className="adm-kpi-value">32</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <BookOpen size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">94.2%</span>
            <span className="text-on-surface-variant">{isVi ? 'tỷ lệ lấp đầy sĩ số' : 'capacity utilization'}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="adm-kpi-card" onClick={() => navigate('/admin/reports')} style={{ cursor: 'pointer' }}>
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'LƯỢT CHẤM AI (Q1)' : 'AI GRADINGS (Q1)'}</div>
              <div className="adm-kpi-value">2,640</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#faf5ff', color: '#7e22ce' }}>
              <Sparkles size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">+880h</span>
            <span className="text-on-surface-variant">{isVi ? 'tiết kiệm cho giáo viên' : 'faculty hours saved'}</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Bento Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Left Column: Live Activity Feed */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 className="headline-md" style={{ margin: 0 }}>
                  {isVi ? 'Dòng Sự Kiện & Hoạt Động Vận Hành' : 'Operational Activity Stream'}
                </h3>
                <p className="label-md text-on-surface-variant" style={{ marginTop: '2px' }}>
                  {isVi ? 'Cập nhật thời gian thực từ các lớp học và hệ thống chấm điểm' : 'Real-time telemetry across academic courses and grading pipelines'}
                </p>
              </div>

              {/* Segmented Filter Pills */}
              <div className="adm-pills">
                {(
                  [
                    { key: 'all', label: isVi ? 'Tất cả' : 'All' },
                    { key: 'enrollment', label: isVi ? 'Ghi danh' : 'Enrollments' },
                    { key: 'grading', label: isVi ? 'Chấm bài' : 'Grading' },
                    { key: 'alert', label: isVi ? 'Cảnh báo' : 'Alerts' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setActivityFilter(p.key)}
                    className={`adm-pill ${activityFilter === p.key ? 'active' : ''}`}
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredActivities.map((act) => {
                const Icon = act.icon;
                return (
                  <div 
                    key={act.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md, 10px)',
                      background: 'var(--surface)',
                      border: '1px solid var(--outline-variant)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: act.iconBg,
                      color: act.iconColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={18} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--on-surface)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {act.title}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                        <span className="font-semibold text-primary">{act.target}</span>
                        <span>•</span>
                        <span>{act.time}</span>
                      </div>
                    </div>

                    <ChevronRight size={16} className="text-on-surface-variant" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: AI Engine Status & Quick Launch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Quick Action Commands (Linear Launcher Style) */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} color="var(--primary)" />
                {isVi ? 'Phím Tắt Điều Hành Nhanh' : 'Executive Command Launchers'}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  onClick={() => navigate('/admin/classes/create')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BookOpen size={16} color="var(--primary)" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Tạo lớp học mới' : 'Add New Class'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘N</span>
                </button>

                <button 
                  onClick={() => navigate('/admin/students/create')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Users size={16} color="#16a34a" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Tiếp nhận học viên mới' : 'Enroll Student'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘S</span>
                </button>

                <button 
                  onClick={() => navigate('/admin/audit/gradings')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <History size={16} color="#2563eb" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Lịch sử chấm điểm' : 'Grading History'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘L</span>
                </button>

                <button 
                  onClick={() => navigate('/admin/reports')}
                  className="dashboard-quick-action-btn"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '10px', background: 'var(--surface)', border: '1px solid var(--outline-variant)', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileSpreadsheet size={16} color="#7e22ce" />
                    <span className="font-semibold" style={{ fontSize: '13.5px' }}>{isVi ? 'Xuất báo cáo chất lượng' : 'Export Reports'}</span>
                  </div>
                  <span className="adm-search-shortcut">⌘R</span>
                </button>
              </div>
            </div>

            {/* System Node Telemetry */}
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={16} color="#16a34a" />
                  {isVi ? 'Trạng Thái Hạ Tầng & Dịch Vụ' : 'Core Infrastructure Health'}
                </h4>
                <span className="badge badge-active">{isVi ? 'Tất cả Online' : 'All Healthy'}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--outline-variant)' }}>
                  <span className="text-on-surface-variant">AI Evaluation Engine (Gemini 1.5 Pro)</span>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>99.98% • 1.2s avg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--outline-variant)' }}>
                  <span className="text-on-surface-variant">Audio STT & Phonetics (Whisper v3)</span>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>100% Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="text-on-surface-variant">Database (PostgreSQL V2 + V4 jsonb)</span>
                  <span className="font-semibold" style={{ color: '#16a34a' }}>Connected (24ms)</span>
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
