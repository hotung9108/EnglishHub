import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, 
  FileSpreadsheet, CheckCircle2, Award
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface StudentDirectoryItem {
  id: string;
  name: string;
  avatar: string;
  class: string;
  entry: string;
  target: string;
  progress: string;
  progressPct: number;
  progressStatus: 'good' | 'warning';
  email: string;
  phone: string;
  parentPhone: string;
  dob: string;
}

export const Students: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'All' | 'IELTS' | 'TOEIC'>('All');

  const studentsData: StudentDirectoryItem[] = [
    {
      id: 'HV-8801',
      name: 'Alice Johnson',
      avatar: 'AJ',
      class: 'ENG-IELTS-6.5A',
      entry: '5.5',
      target: '7.0',
      progress: '14/15 Bài',
      progressPct: 93,
      progressStatus: 'good',
      email: 'alice.j@student.edu.vn',
      phone: '0912 345 678',
      parentPhone: '0988 776 655',
      dob: '2005-08-14'
    },
    {
      id: 'HV-8802',
      name: 'David Pham',
      avatar: 'DP',
      class: 'ENG-IELTS-6.5A',
      entry: '5.0',
      target: '6.5',
      progress: '8/15 Bài',
      progressPct: 53,
      progressStatus: 'warning',
      email: 'david.p@student.edu.vn',
      phone: '0933 111 222',
      parentPhone: '0977 444 333',
      dob: '2005-11-20'
    },
    {
      id: 'HV-8803',
      name: 'Lê Bảo Trâm',
      avatar: 'BT',
      class: 'ENG-TOEIC-750',
      entry: '600',
      target: '800',
      progress: '12/12 Bài',
      progressPct: 100,
      progressStatus: 'good',
      email: 'tram.lb@student.edu.vn',
      phone: '0944 555 666',
      parentPhone: '0911 222 333',
      dob: '2004-03-05'
    }
  ];

  const filtered = studentsData.filter(st => {
    if (levelFilter === 'IELTS' && !st.class.includes('IELTS')) return false;
    if (levelFilter === 'TOEIC' && !st.class.includes('TOEIC')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.id.toLowerCase().includes(q) ||
        st.class.toLowerCase().includes(q)
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
            <Users size={28} color="var(--primary)" />
            {t('students.title')}
            <span className="adm-title-badge">{studentsData.length} {isVi ? 'học viên' : 'students'}</span>
          </h1>
          <p className="adm-subtitle">
            {isVi 
              ? 'Danh bạ học viên toàn khóa, theo dõi mục tiêu điểm số và tiến độ hoàn thành bài tập.' 
              : 'Student directory, target band attainment tracking, and exercise submission completion.'}
          </p>
        </div>

        <div className="adm-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => alert(isVi ? 'Đang mở hộp thoại nhập file Excel...' : 'Opening Excel file dialog...')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} color="#16a34a" />
            <span>{t('students.importExcel')}</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/students/create')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={16} />
            <span>{t('students.addStudent')}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỔNG SỐ HỌC VIÊN' : 'TOTAL COHORT'}</div>
              <div className="adm-kpi-value">1,248</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">+12%</span>
            <span className="text-on-surface-variant">{isVi ? 'tăng trưởng tháng này' : 'growth this month'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỶ LỆ NỘP ĐỦ BÀI TẬP' : 'HOMEWORK COMPLIANCE'}</div>
              <div className="adm-kpi-value">94.2%</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">92.6%</span>
            <span className="text-on-surface-variant">{isVi ? 'nộp đúng hạn SLA' : 'on-time submissions'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỶ LỆ ĐẠT TARGET' : 'TARGET ATTAINMENT'}</div>
              <div className="adm-kpi-value">84.2%</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Award size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">+5.1%</span>
            <span className="text-on-surface-variant">{isVi ? 'vượt chuẩn đầu ra' : 'above baseline'}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar">
        <div className="adm-pills">
          {(['All', 'IELTS', 'TOEIC'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`adm-pill ${levelFilter === lvl ? 'active' : ''}`}
            >
              <span>{lvl === 'All' ? t('students.filterAllLevels') : lvl}</span>
            </button>
          ))}
        </div>

        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input 
            type="text" 
            className="adm-search-input"
            placeholder={t('students.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Modern Student Directory Table */}
      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>{t('students.colId')}</th>
              <th>{t('students.colName')}</th>
              <th>{t('students.colClass')}</th>
              <th>{t('students.colTarget')}</th>
              <th>{t('students.colProgress')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(st => (
              <tr 
                key={st.id} 
                className="adm-table-row-clickable"
                onClick={() => navigate(`/admin/students/${st.id}`)}
              >
                <td className="font-mono font-semibold text-primary">{st.id}</td>
                <td>
                  <div className="adm-avatar-info">
                    <div className="adm-avatar-name">{st.name}</div>
                    <div className="adm-avatar-meta">{st.email}</div>
                  </div>
                </td>
                <td className="font-mono text-on-surface-variant">{st.class}</td>
                <td>
                  <span className="text-on-surface-variant">{st.entry}</span>
                  <span className="adm-score-arrow">&rarr;</span>
                  <strong className="text-primary font-bold">{st.target}</strong>
                </td>
                <td>
                  <div className="adm-progress-cell">
                    <div className="adm-progress-text-row">
                      <span className="font-semibold">{st.progress}</span>
                      <span className="text-on-surface-variant">{st.progressPct}%</span>
                    </div>
                    <div className="adm-progress-track">
                      <div 
                        className={st.progressStatus === 'good' ? 'adm-progress-fill-good' : 'adm-progress-fill-warning'}
                        style={{ width: `${st.progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Students;
