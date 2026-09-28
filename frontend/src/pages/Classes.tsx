import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Plus, Search, 
  Archive, LayoutGrid, List,
  Clock, User, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ClassItem {
  code: string;
  name: string;
  level: string;
  teacher: string;
  teacherAvatar: string;
  students: number;
  maxStudents: number;
  schedule: string;
  room: string;
  status: 'active' | 'completed';
  assignedExercises: number;
  avgScore: number;
}

export const Classes: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const classesData: ClassItem[] = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5 (Target Master)',
      level: 'IELTS 6.5+',
      teacher: 'Cô Trần Thị Mai Lan',
      teacherAvatar: 'TL',
      students: 24,
      maxStudents: 25,
      schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
      room: 'Online Room #04 (Zoom HD)',
      status: 'active',
      assignedExercises: 15,
      avgScore: 7.2
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc Mục tiêu 750+',
      level: 'TOEIC 750+',
      teacher: 'Cô Nguyễn Thu Trang',
      teacherAvatar: 'TT',
      students: 18,
      maxStudents: 20,
      schedule: 'T3 - T5 - T7 (19:30 - 21:00)',
      room: 'Phòng 202 - Tòa A2',
      status: 'active',
      assignedExercises: 12,
      avgScore: 7.8
    },
    {
      code: 'ENG-COMM-B2',
      name: 'Tiếng Anh Giao tiếp & Thuyết trình Chuyên sâu B2',
      level: 'CEFR B2',
      teacher: 'Thầy Mark Reynolds',
      teacherAvatar: 'MR',
      students: 12,
      maxStudents: 15,
      schedule: 'T7 - CN (09:00 - 11:30)',
      room: 'Online Room #02 (Teams)',
      status: 'active',
      assignedExercises: 8,
      avgScore: 8.0
    },
    {
      code: 'ENG-IELTS-5.0',
      name: 'IELTS Pre-Intermediate Khóa 12',
      level: 'IELTS 5.0',
      teacher: 'Thầy Hoàng Minh Đức',
      teacherAvatar: 'MD',
      students: 20,
      maxStudents: 20,
      schedule: 'Đã hoàn thành 30/30 buổi',
      room: 'Phòng 101 - Tòa B1',
      status: 'completed',
      assignedExercises: 20,
      avgScore: 7.5
    }
  ];

  const filtered = classesData.filter(cls => {
    if (statusFilter !== 'all' && cls.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        cls.code.toLowerCase().includes(q) ||
        cls.name.toLowerCase().includes(q) ||
        cls.teacher.toLowerCase().includes(q)
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
            {t('adminClasses.title')}
            <span className="adm-title-badge">{classesData.length} {isVi ? 'lớp học' : 'classes'}</span>
          </h1>
          <p className="adm-subtitle">
            {isVi 
              ? 'Quản lý thông tin khóa học, phân công giảng viên, sĩ số phòng học và tiến độ đào tạo.' 
              : 'Cohort management, instructor assignments, student capacity, and course syllabus progress.'}
          </p>
        </div>

        <div className="adm-actions">
          <Link 
            to="/admin/classes/archive" 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Archive size={16} />
            <span>{t('classArchive.title')}</span>
          </Link>
          <Link 
            to="/admin/classes/create" 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} />
            <span>{t('adminClasses.createClass')}</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar">
        {/* Status Pills */}
        <div className="adm-pills">
          {(
            [
              { key: 'all', label: isVi ? 'Tất cả lớp học' : 'All Classes', count: classesData.length },
              { key: 'active', label: isVi ? 'Đang mở (Active)' : 'Active', count: classesData.filter(c => c.status === 'active').length },
              { key: 'completed', label: isVi ? 'Đã hoàn thành' : 'Completed', count: classesData.filter(c => c.status === 'completed').length },
            ] as const
          ).map(p => (
            <button
              key={p.key}
              onClick={() => setStatusFilter(p.key)}
              className={`adm-pill ${statusFilter === p.key ? 'active' : ''}`}
            >
              <span>{p.label}</span>
              <span className="adm-pill-badge">{p.count}</span>
            </button>
          ))}
        </div>

        {/* Search & View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="adm-search-wrap">
            <Search size={16} className="adm-search-icon" />
            <input 
              type="text" 
              className="adm-search-input"
              placeholder={isVi ? 'Tìm tên lớp, mã lớp, giảng viên...' : 'Search classes...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', border: '1px solid var(--outline-variant)', borderRadius: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--primary)' : 'var(--surface)',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--on-surface-variant)',
                cursor: 'pointer'
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '6px 10px',
                border: 'none',
                background: viewMode === 'list' ? 'var(--primary)' : 'var(--surface)',
                color: viewMode === 'list' ? '#ffffff' : 'var(--on-surface-variant)',
                cursor: 'pointer'
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View Mode */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
          {filtered.map(cls => {
            const occupancyPct = Math.round((cls.students / cls.maxStudents) * 100);
            return (
              <div 
                key={cls.code} 
                className="card"
                style={{ 
                  padding: '22px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  gap: '16px',
                  transition: 'all 0.25s ease',
                  border: '1px solid var(--outline-variant)'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge badge-primary font-mono">{cls.code}</span>
                      <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', fontSize: '11.5px' }}>{cls.level}</span>
                    </div>
                    <span className={`badge ${cls.status === 'active' ? 'badge-active' : 'badge-onleave'}`}>
                      {cls.status === 'active' ? t('adminClasses.statusActive') : t('adminClasses.statusCompleted')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '16.5px', fontWeight: 700, margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    {cls.name}
                  </h3>

                  {/* Instructor & Meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={15} color="var(--primary)" />
                      <span>{t('adminClasses.teacherPrefix')}<strong>{cls.teacher}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} />
                      <span>{cls.schedule}</span>
                    </div>
                  </div>

                  {/* Enrollment Progress Bar */}
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span className="text-on-surface-variant">
                        {isVi ? 'Sĩ số lấp đầy' : 'Class Capacity'}: <strong>{cls.students}/{cls.maxStudents}</strong>
                      </span>
                      <span className="font-semibold text-primary">{occupancyPct}%</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: 'var(--surface-container-high)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${occupancyPct}%`, 
                          height: '100%', 
                          backgroundColor: occupancyPct > 90 ? '#2563eb' : '#059669', 
                          borderRadius: '3px' 
                        }} 
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--outline-variant)', paddingTop: '14px' }}>
                  <button
                    onClick={() => navigate(`/admin/classes/${cls.code}`)}
                    className="btn btn-secondary flex-1"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                  >
                    <span>{t('adminClasses.manageClass')}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View Mode */}
      {viewMode === 'list' && (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                <th>{isVi ? 'GIẢNG VIÊN' : 'INSTRUCTOR'}</th>
                <th>{isVi ? 'SĨ SỐ' : 'ENROLLED'}</th>
                <th>{isVi ? 'LỊCH HỌC' : 'SCHEDULE'}</th>
                <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(cls => (
                <tr key={cls.code} onClick={() => navigate(`/admin/classes/${cls.code}`)} style={{ cursor: 'pointer' }}>
                  <td className="font-semibold text-primary font-mono">{cls.code}</td>
                  <td className="font-medium">{cls.name}</td>
                  <td>{cls.teacher}</td>
                  <td>
                    <span className="font-semibold">{cls.students}/{cls.maxStudents}</span>
                    <span className="label-md text-on-surface-variant"> ({Math.round((cls.students / cls.maxStudents) * 100)}%)</span>
                  </td>
                  <td className="text-on-surface-variant">{cls.schedule}</td>
                  <td>
                    <span className={`badge ${cls.status === 'active' ? 'badge-active' : 'badge-onleave'}`}>
                      {cls.status === 'active' ? t('adminClasses.statusActive') : t('adminClasses.statusCompleted')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/classes/${cls.code}`);
                      }}
                    >
                      {t('adminClasses.viewDetails')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Classes;
