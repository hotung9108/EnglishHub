import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Plus, Search, 
  Archive, LayoutGrid, List,
  Clock, User, ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import { userService } from '../api/services/user.service';
import type { ClassSummary } from '../api/services/class.service';
import type { UserListItem } from '../api/services/user.service';

interface EnrichedClass {
  id: number;
  code: string;
  name: string;
  level: string;
  teacher: string;
  students: number;
  maxStudents: number;
  schedule: string;
  status: 'active' | 'completed';
}

export const Classes: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classesData, setClassesData] = useState<EnrichedClass[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    let isMounted = true;
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);

        const [classRes, teacherRes] = await Promise.allSettled([
          classService.list({ page: 1, limit: 100 }),
          userService.listUsers({ role: 'TEACHER', limit: 100 })
        ]);

        if (!isMounted) return;

        const rawClasses: ClassSummary[] = classRes.status === 'fulfilled' ? classRes.value.data : [];
        const teachers: UserListItem[] = teacherRes.status === 'fulfilled' ? teacherRes.value.data : [];
        const teacherMap = new Map<number, string>();
        teachers.forEach(tc => teacherMap.set(tc.id, tc.fullName));

        // Attempt to fetch extra details for first batch of classes
        const enriched: EnrichedClass[] = await Promise.all(
          rawClasses.map(async (c) => {
            let memberCount = 0;
            let level = 'General';
            let description = '';
            try {
              const detail = await classService.getDetail(c.id);
              level = detail.level || 'General';
              description = detail.description || '';
              if (typeof detail.memberCount === 'number') {
                memberCount = detail.memberCount;
              } else {
                const members = await classService.listMembers(c.id);
                memberCount = members.length;
              }
            } catch {
              // fallback gracefully
            }

            const teacherName = c.teacherId && teacherMap.has(c.teacherId)
              ? teacherMap.get(c.teacherId)!
              : (isVi ? 'Chưa phân công' : 'Unassigned');

            const isCompleted = c.status === 'COMPLETED' || c.status === 'CANCELLED';

            return {
              id: c.id,
              code: `ENG-${c.id}`,
              name: c.name,
              level,
              teacher: teacherName,
              students: memberCount,
              maxStudents: 25,
              schedule: description || (isVi ? 'Theo lịch phân công' : 'Scheduled sessions'),
              status: isCompleted ? 'completed' : 'active'
            };
          })
        );

        if (isMounted) {
          setClassesData(enriched);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải danh sách lớp học.' : 'Failed to load classes.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchClasses();

    return () => {
      isMounted = false;
    };
  }, [isVi]);

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
          marginBottom: '16px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tải danh sách lớp học...' : 'Loading classes...'}</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '56px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <GraduationCap size={40} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--on-surface)' }}>
            {isVi ? 'Không tìm thấy lớp học nào' : 'No classes found'}
          </h3>
          <p style={{ margin: 0, fontSize: '13.5px' }}>
            {searchQuery 
              ? (isVi ? 'Không có lớp học nào khớp với từ khóa tìm kiếm.' : 'No classes match your search query.')
              : (isVi ? 'Chưa có lớp học nào được tạo trên hệ thống.' : 'No classes created yet.')}
          </p>
          <div style={{ marginTop: '18px' }}>
            <Link to="/admin/classes/create" className="btn btn-primary btn-sm">
              <Plus size={14} style={{ marginRight: '6px' }} />
              <span>{t('adminClasses.createClass')}</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Grid View Mode */}
          {viewMode === 'grid' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
              {filtered.map(cls => {
                const occupancyPct = Math.min(100, Math.round((cls.students / cls.maxStudents) * 100));
                return (
                  <div 
                    key={cls.id} 
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
                            {isVi ? 'Sĩ số' : 'Class Capacity'}: <strong>{cls.students}/{cls.maxStudents}</strong>
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
                        onClick={() => navigate(`/admin/classes/${cls.id}`)}
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
                    <tr key={cls.id} onClick={() => navigate(`/admin/classes/${cls.id}`)} style={{ cursor: 'pointer' }}>
                      <td className="font-semibold text-primary font-mono">{cls.code}</td>
                      <td className="font-medium">{cls.name}</td>
                      <td>{cls.teacher}</td>
                      <td>
                        <span className="font-semibold">{cls.students}/{cls.maxStudents}</span>
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
                            navigate(`/admin/classes/${cls.id}`);
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
        </>
      )}
    </div>
  );
};

export default Classes;
