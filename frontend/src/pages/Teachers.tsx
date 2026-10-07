import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, UserPlus, Search, 
  Award, BookOpen, Clock, 
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface TeacherItem {
  id: string;
  code: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  certs: string;
  activeClasses: number;
  pendingGradings: number;
  avgTurnaround: number; // in hours
  status: 'Active' | 'OnLeave';
}

export const Teachers: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpertise, setFilterExpertise] = useState<'All' | 'IELTS' | 'TOEIC' | 'Grammar'>('All');

  const teachers: TeacherItem[] = [
    {
      id: '1',
      code: 'GV-088',
      name: 'Cô Trần Thị Mai Lan',
      avatar: 'TL',
      email: 'teacher.lan@center.edu.vn',
      phone: '0987 654 321',
      certs: 'IELTS 8.5 • TESOL Certified',
      activeClasses: 4,
      pendingGradings: 2,
      avgTurnaround: 14.5,
      status: 'Active'
    },
    {
      id: '2',
      code: 'GV-042',
      name: 'Thầy Nguyễn Văn Nam',
      avatar: 'VN',
      email: 'nam.nv@center.edu.vn',
      phone: '0912 888 999',
      certs: 'IELTS 8.0 • MA Applied Linguistics',
      activeClasses: 3,
      pendingGradings: 0,
      avgTurnaround: 18.2,
      status: 'Active'
    },
    {
      id: '3',
      code: 'GV-019',
      name: 'Thầy David Miller',
      avatar: 'DM',
      email: 'david.miller@center.edu.vn',
      phone: '0933 777 666',
      certs: 'Native Speaker • CELTA Certified',
      activeClasses: 2,
      pendingGradings: 1,
      avgTurnaround: 12.0,
      status: 'Active'
    },
    {
      id: '4',
      code: 'GV-033',
      name: 'Cô Nguyễn Thu Trang',
      avatar: 'TT',
      email: 'trang.nt@center.edu.vn',
      phone: '0944 333 222',
      certs: 'TOEIC 990/990 • 6 năm luyện thi',
      activeClasses: 3,
      pendingGradings: 3,
      avgTurnaround: 20.4,
      status: 'Active'
    }
  ];

  const filtered = teachers.filter(tc => {
    if (filterExpertise !== 'All' && !tc.certs.toLowerCase().includes(filterExpertise.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        tc.name.toLowerCase().includes(q) ||
        tc.code.toLowerCase().includes(q) ||
        tc.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <GraduationCap size={28} color="var(--primary)" />
            {t('teachers.title')}
            <span className="adm-title-badge">{teachers.length} {isVi ? 'giảng viên' : 'faculty'}</span>
          </h1>
          <p className="adm-subtitle">
            {isVi 
              ? 'Hồ sơ chuyên môn đội ngũ giảng viên, phân công lớp học và theo dõi hiệu suất chấm chữa bài tập.' 
              : 'Faculty directory, academic qualifications, classroom workload, and grading SLA telemetry.'}
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => navigate('/admin/teachers/create')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={16} />
          <span>{t('teachers.addTeacher')}</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỔNG ĐỘI NGŨ GIẢNG VIÊN' : 'TOTAL FACULTY'}</div>
              <div className="adm-kpi-value">45</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer text-on-surface-variant">
            <span>100% đạt chuẩn TESOL / CELTA</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'LỚP ĐANG GIẢNG DẠY' : 'ASSIGNED CLASSES'}</div>
              <div className="adm-kpi-value">32</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <BookOpen size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">TB 2.4 lớp/GV</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỐC ĐỘ TRẢ BÀI TB' : 'AVG TURNAROUND'}</div>
              <div className="adm-kpi-value">15.8 <span style={{ fontSize: '16px', fontWeight: 500 }}>giờ</span></div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Clock size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">Đạt chuẩn SLA &lt; 24h</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar">
        <div className="adm-pills">
          {(['All', 'IELTS', 'TOEIC', 'Grammar'] as const).map(exp => (
            <button
              key={exp}
              onClick={() => setFilterExpertise(exp)}
              className={`adm-pill ${filterExpertise === exp ? 'active' : ''}`}
            >
              <span>{exp === 'All' ? (isVi ? 'Tất cả chuyên môn' : 'All Qualifications') : exp}</span>
            </button>
          ))}
        </div>

        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input 
            type="text" 
            className="adm-search-input"
            placeholder={isVi ? 'Tìm tên giáo viên, mã GV, chứng chỉ...' : 'Search teachers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Modern Teacher Bento Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '22px' }}>
        {filtered.map(tc => (
          <div 
            key={tc.id} 
            className="card"
            style={{ 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              gap: '16px',
              border: '1px solid var(--outline-variant)'
            }}
          >
            <div>
              {/* Header with Avatar and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="adm-avatar" style={{ width: '48px', height: '48px', fontSize: '18px', backgroundColor: '#2563eb' }}>
                    {tc.avatar}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 2px 0' }}>{tc.name}</h3>
                    <span className="font-mono text-primary font-semibold" style={{ fontSize: '12px' }}>{tc.code}</span>
                  </div>
                </div>

                <span className="badge badge-active">{tc.status}</span>
              </div>

              {/* Certs Pill */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-high)', fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)', marginBottom: '16px' }}>
                <Award size={14} color="var(--primary)" />
                <span>{tc.certs}</span>
              </div>

              {/* Workload Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)', fontSize: '12.5px' }}>
                <div>
                  <span className="text-on-surface-variant">{isVi ? 'Lớp phụ trách: ' : 'Active Classes: '}</span>
                  <strong>{tc.activeClasses} {isVi ? 'lớp' : 'classes'}</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant">{isVi ? 'Tốc độ chấm: ' : 'SLA Speed: '}</span>
                  <strong className="text-primary">{tc.avgTurnaround}h</strong>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '14px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => navigate(`/admin/teachers/${tc.id}`)}
                className="btn btn-secondary flex-1"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
              >
                <span>{t('teachers.viewProfile')}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teachers;
