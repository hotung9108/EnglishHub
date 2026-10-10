import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, UserPlus, Search, 
  BookOpen, Clock, 
  ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
import type { UserListItem } from '../api/services/user.service';

interface TeacherItem {
  id: number;
  code: string;
  name: string;
  avatar: string;
  email: string;
  certs: string;
  activeClasses: number;
  status: 'Active' | 'Blocked';
}

export const Teachers: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpertise, setFilterExpertise] = useState<'All' | 'IELTS' | 'TOEIC' | 'Grammar'>('All');
  const [totalClassesCount, setTotalClassesCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchTeachersData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [teachersRes, classesRes] = await Promise.allSettled([
          userService.listUsers({ role: 'TEACHER', limit: 100 }),
          classService.list({ page: 1, limit: 100 })
        ]);

        if (!isMounted) return;

        const teacherList: UserListItem[] = teachersRes.status === 'fulfilled' ? teachersRes.value.data : [];
        const classes = classesRes.status === 'fulfilled' ? classesRes.value.data : [];
        setTotalClassesCount(classes.length);

        // Count classes per teacher
        const classCountByTeacher = new Map<number, number>();
        classes.forEach(c => {
          if (c.teacherId) {
            classCountByTeacher.set(c.teacherId, (classCountByTeacher.get(c.teacherId) || 0) + 1);
          }
        });

        const mapped: TeacherItem[] = teacherList.map(tc => {
          const initials = tc.fullName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();
          const assignedCount = classCountByTeacher.get(tc.id) || 0;

          return {
            id: tc.id,
            code: `GV-${String(tc.id).padStart(3, '0')}`,
            name: tc.fullName,
            avatar: initials || 'GV',
            email: tc.email,
            certs: 'TESOL / IELTS Standard',
            activeClasses: assignedCount,
            status: tc.status === 'LOCKED' ? 'Blocked' : 'Active'
          };
        });

        setTeachers(mapped);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải danh sách giảng viên.' : 'Failed to load teachers.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTeachersData();

    return () => {
      isMounted = false;
    };
  }, [isVi]);

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

  const activeTeachersCount = teachers.filter(t => t.status === 'Active').length;

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

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỔNG ĐỘI NGŨ GIẢNG VIÊN' : 'TOTAL FACULTY'}</div>
              <div className="adm-kpi-value">{teachers.length}</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <GraduationCap size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer text-on-surface-variant">
            <span>{activeTeachersCount} {isVi ? 'đang hoạt động' : 'active instructors'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'LỚP ĐANG GIẢNG DẠY' : 'ASSIGNED CLASSES'}</div>
              <div className="adm-kpi-value">{totalClassesCount}</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <BookOpen size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">
              {teachers.length > 0 ? (totalClassesCount / teachers.length).toFixed(1) : '0'} {isVi ? 'lớp/GV' : 'classes/teacher'}
            </span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'QUY CHUẨN ĐÀO TẠO' : 'ACADEMIC STANDARDS'}</div>
              <div className="adm-kpi-value" style={{ fontSize: '20px', fontWeight: 700 }}>100%</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Clock size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">{isVi ? 'Đạt chuẩn kiểm định SLA' : 'SLA Compliant'}</span>
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
            placeholder={isVi ? 'Tìm tên giáo viên, mã GV, email...' : 'Search teachers...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Modern Teacher Bento Cards Grid */}
      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tải danh sách giảng viên...' : 'Loading teachers...'}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '56px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <GraduationCap size={40} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--on-surface)' }}>
            {isVi ? 'Không tìm thấy giảng viên nào' : 'No teachers found'}
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px' }}>
            {searchQuery 
              ? (isVi ? 'Thử tìm với từ khóa khác.' : 'Try adjusting your search criteria.')
              : (isVi ? 'Chưa có giảng viên nào trong cơ sở dữ liệu.' : 'No faculty accounts created yet.')}
          </p>
          <div style={{ marginTop: '18px' }}>
            <button onClick={() => navigate('/admin/teachers/create')} className="btn btn-primary btn-sm">
              <UserPlus size={14} style={{ marginRight: '6px' }} />
              <span>{t('teachers.addTeacher')}</span>
            </button>
          </div>
        </div>
      ) : (
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

                  <span className={`badge ${tc.status === 'Active' ? 'badge-active' : 'badge-onleave'}`}>
                    {tc.status}
                  </span>
                </div>

                {/* Email */}
                <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginBottom: '12px' }}>
                  {tc.email}
                </div>

                {/* Workload Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)', fontSize: '12.5px' }}>
                  <div>
                    <span className="text-on-surface-variant">{isVi ? 'Lớp phụ trách: ' : 'Active Classes: '}</span>
                    <strong>{tc.activeClasses} {isVi ? 'lớp' : 'classes'}</strong>
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
      )}
    </div>
  );
};

export default Teachers;
