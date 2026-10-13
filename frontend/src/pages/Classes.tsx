import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, 
  User, Clock, ArrowRight,
  LayoutGrid, List,
  Archive, Loader2, AlertCircle, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import type { ClassSummary } from '../api/services/class.service';
import { Button, EmptyState } from '../components/common';

export const Classes: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [classesData, setClassesData] = useState<Array<{
    id: number;
    name: string;
    code: string;
    teacher: string;
    students: number;
    maxStudents: number;
    schedule: string;
    status: 'active' | 'completed';
    level: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await classService.list({ page: 1, limit: 100 });
        if (!isMounted) return;

        const mapped = (res.data || []).map((c: ClassSummary) => ({
          id: c.id,
          name: c.name,
          code: `ENG-${c.id}`,
          teacher: (c as { teacherName?: string }).teacherName || (c.teacherId ? `GV #${c.teacherId}` : (isVi ? 'Chưa phân công' : 'Unassigned')),
          students: (c as { studentCount?: number }).studentCount || 0,
          maxStudents: 30,
          schedule: isVi ? 'Thứ 2, 4, 6 (18:00 - 19:30)' : 'Mon, Wed, Fri (18:00 - 19:30)',
          status: (c.status?.toLowerCase() === 'inactive' || c.status?.toLowerCase() === 'completed') ? 'completed' as const : 'active' as const,
          level: isVi ? 'Tiếng Anh Giao Tiếp' : 'Communication English'
        }));

        setClassesData(mapped);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : isVi ? 'Không thể tải danh sách lớp học.' : 'Failed to fetch classes.');
      } finally {
        if (isMounted) setLoading(false);
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
        cls.name.toLowerCase().includes(q) ||
        cls.code.toLowerCase().includes(q) ||
        cls.teacher.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <GraduationCap size={28} className="text-primary" />
            {t('adminClasses.title')}
          </h1>
        </div>

        <div className="adm-actions flex items-center gap-3">
          <Button 
            variant="secondary"
            icon={<Archive size={16} />}
            onClick={() => navigate('/admin/classes/archive')}
          >
            {t('classArchive.title')}
          </Button>
          <Button 
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/admin/classes/create')}
          >
            {t('adminClasses.createClass')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar mb-6">
        {/* Status Pills */}
        <div className="adm-pills">
          {(
            [
              { key: 'all', label: isVi ? 'Tất cả lớp học' : 'All Classes', count: classesData.length },
              { key: 'active', label: isVi ? 'Đang mở' : 'Active', count: classesData.filter(c => c.status === 'active').length },
              { key: 'completed', label: isVi ? 'Đã hoàn thành' : 'Completed', count: classesData.filter(c => c.status === 'completed').length },
            ] as const
          ).map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setStatusFilter(p.key)}
              className={`adm-pill ${statusFilter === p.key ? 'active' : ''}`}
            >
              <span>{p.label}</span>
              <span className="adm-pill-badge">{p.count}</span>
            </button>
          ))}
        </div>

        {/* Search & View Toggle */}
        <div className="flex items-center gap-3">
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

          <div className="flex border-subtle rounded-md overflow-hidden bg-surface">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 cursor-pointer border-none ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-surface text-muted'}`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 cursor-pointer border-none ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-surface text-muted'}`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="adm-alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-muted">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" />
          <div>{isVi ? 'Đang tải danh sách lớp học...' : 'Loading classes...'}</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={40} />}
          title={isVi ? 'Không tìm thấy lớp học nào' : 'No classes found'}
          description={searchQuery 
            ? (isVi ? 'Không có lớp học nào khớp với từ khóa tìm kiếm.' : 'No classes match your search query.')
            : (isVi ? 'Chưa có lớp học nào được tạo trên hệ thống.' : 'No classes created yet.')}
          action={
            <Button 
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => navigate('/admin/classes/create')}
            >
              {t('adminClasses.createClass')}
            </Button>
          }
        />
      ) : (
        <>
          {/* Grid View Mode */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
              {filtered.map(cls => {
                const occupancyPct = Math.min(100, Math.round((cls.students / cls.maxStudents) * 100));
                return (
                  <div 
                    key={cls.id} 
                    className="eh-card p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex gap-2 items-center">
                          <span className="font-mono text-xs font-bold text-muted">{cls.code}</span>
                          <span className="badge badge-neutral text-xs">{cls.level}</span>
                        </div>
                        <span className={`badge ${cls.status === 'active' ? 'badge-active' : 'badge-onleave'}`}>
                          {cls.status === 'active' ? t('adminClasses.statusActive') : t('adminClasses.statusCompleted')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold m-0 mb-3 leading-snug text-surface">
                        {cls.name}
                      </h3>

                      {/* Instructor & Meta */}
                      <div className="flex flex-col gap-2 text-sm text-muted mb-4">
                        <div className="flex items-center gap-2">
                          <User size={15} className="text-primary" />
                          <span>{t('adminClasses.teacherPrefix')}<strong>{cls.teacher}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={15} />
                          <span>{cls.schedule}</span>
                        </div>
                      </div>

                      {/* Enrollment Progress Bar */}
                      <div className="p-3 rounded-md bg-surface-low border-subtle mb-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted">
                            {isVi ? 'Sĩ số' : 'Class Capacity'}: <strong>{cls.students}/{cls.maxStudents}</strong>
                          </span>
                          <span className="font-semibold text-primary">{occupancyPct}%</span>
                        </div>
                        <div className="w-full bg-surface-container rounded-sm overflow-hidden" style={{ height: '6px' }}>
                          <div 
                            className={`h-full rounded-sm ${occupancyPct > 90 ? 'bg-primary' : 'bg-secondary'}`}
                            style={{ width: `${occupancyPct}%` }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="flex gap-2 pt-3 border-t-subtle">
                      <Button
                        variant="secondary"
                        className="flex-1 text-sm justify-between"
                        onClick={() => navigate(`/admin/classes/${cls.id}`)}
                      >
                        <span>{t('adminClasses.manageClass')}</span>
                        <ArrowRight size={14} />
                      </Button>
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
                    <th className="text-right">{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(cls => (
                    <tr key={cls.id} onClick={() => navigate(`/admin/classes/${cls.id}`)} className="cursor-pointer">
                      <td className="font-semibold text-primary font-mono">{cls.code}</td>
                      <td className="font-medium text-surface">{cls.name}</td>
                      <td>{cls.teacher}</td>
                      <td>
                        <span className="font-semibold">{cls.students}/{cls.maxStudents}</span>
                      </td>
                      <td className="text-muted">{cls.schedule}</td>
                      <td>
                        <span className={`badge ${cls.status === 'active' ? 'badge-active' : 'badge-onleave'}`}>
                          {cls.status === 'active' ? t('adminClasses.statusActive') : t('adminClasses.statusCompleted')}
                        </span>
                      </td>
                      <td className="text-right">
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/classes/${cls.id}`);
                          }}
                        >
                          {t('adminClasses.viewDetails')}
                        </Button>
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
