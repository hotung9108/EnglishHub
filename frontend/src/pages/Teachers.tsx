import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, UserPlus, Search, 
  ArrowRight, BookOpen, Clock, Loader2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
import type { UserListItem } from '../api/services/user.service';
import type { ClassSummary } from '../api/services/class.service';
import { Button, MetricCard, EmptyState } from '../components/common';

export const Teachers: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpertise, setFilterExpertise] = useState<'All' | 'TESOL' | 'Writing' | 'Speaking'>('All');

  const [teachers, setTeachers] = useState<Array<{
    id: number;
    name: string;
    code: string;
    avatar: string;
    email: string;
    status: 'Active' | 'On Leave';
    activeClasses: number;
    rating: number;
    qualifications: string[];
  }>>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClassesCount, setTotalClassesCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchTeacherEcosystem = async () => {
      try {
        setLoading(true);
        setError(null);

        const [teachersRes, classesRes] = await Promise.allSettled([
          userService.listUsers({ role: 'TEACHER', limit: 100 }),
          classService.list({ page: 1, limit: 100 })
        ]);

        if (!isMounted) return;

        let rawTeachers: UserListItem[] = [];
        let rawClasses: ClassSummary[] = [];

        if (teachersRes.status === 'fulfilled') {
          rawTeachers = teachersRes.value.data || [];
        } else {
          throw teachersRes.reason;
        }

        if (classesRes.status === 'fulfilled') {
          rawClasses = classesRes.value.data || [];
          setTotalClassesCount(rawClasses.length);
        }

        const mapped = rawTeachers.map(tc => {
          const teacherClasses = rawClasses.filter(c => (c as { teacherName?: string }).teacherName?.toLowerCase() === tc.fullName.toLowerCase() || c.teacherId === tc.id);
          const initials = tc.fullName
            .trim()
            .split(/\s+/)
            .map(w => w[0])
            .slice(-2)
            .join('')
            .toUpperCase() || 'GV';

          return {
            id: tc.id,
            name: tc.fullName,
            code: `GV-${String(tc.id).padStart(3, '0')}`,
            avatar: initials,
            email: tc.email,
            status: (tc.status === 'ACTIVE' ? 'Active' : 'On Leave') as 'Active' | 'On Leave',
            activeClasses: teacherClasses.length,
            rating: 4.8,
            qualifications: ['TESOL', 'IELTS 8.0+']
          };
        });

        setTeachers(mapped);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : isVi ? 'Không thể tải danh sách giảng viên.' : 'Failed to fetch faculty.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTeacherEcosystem();

    return () => {
      isMounted = false;
    };
  }, [isVi]);

  const filtered = teachers.filter(tc => {
    if (filterExpertise !== 'All' && !tc.qualifications.includes(filterExpertise)) return false;
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
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            {t('teachers.title')}
          </h1>
        </div>

        <Button 
          variant="primary"
          icon={<UserPlus size={16} />}
          onClick={() => navigate('/admin/teachers/create')}
        >
          {t('teachers.addTeacher')}
        </Button>
      </div>

      {error && (
        <div className="adm-alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="adm-kpi-grid mb-6">
        <MetricCard
          title={isVi ? 'TỔNG ĐỘI NGŨ GIẢNG VIÊN' : 'TOTAL FACULTY'}
          value={teachers.length}
          icon={<GraduationCap size={20} />}
          iconBgColor="var(--primary-container)"
          iconColor="var(--primary)"
          footerText={`${activeTeachersCount} ${isVi ? 'đang hoạt động' : 'active instructors'}`}
        />

        <MetricCard
          title={isVi ? 'LỚP ĐANG GIẢNG DẠY' : 'ASSIGNED CLASSES'}
          value={totalClassesCount}
          icon={<BookOpen size={20} />}
          iconBgColor="var(--tertiary-container)"
          iconColor="var(--tertiary)"
          footerText={`${teachers.length > 0 ? (totalClassesCount / teachers.length).toFixed(1) : '0'} ${isVi ? 'lớp/GV' : 'classes/teacher'}`}
        />

        <MetricCard
          title={isVi ? 'QUY CHUẨN ĐÀO TẠO' : 'ACADEMIC STANDARDS'}
          value="100%"
          icon={<Clock size={20} />}
          iconBgColor="var(--secondary-container)"
          iconColor="var(--secondary)"
          footerText={isVi ? 'Đạt chuẩn đào tạo' : 'Standard Compliant'}
        />
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar mb-6">
        <div className="adm-pills">
          {(['All', 'TESOL', 'Writing', 'Speaking'] as const).map(exp => (
            <button
              key={exp}
              type="button"
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
        <div className="p-8 text-center text-muted">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" />
          <div>{isVi ? 'Đang tải danh sách giảng viên...' : 'Loading teachers...'}</div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={40} />}
          title={isVi ? 'Không tìm thấy giảng viên nào' : 'No teachers found'}
          description={searchQuery 
            ? (isVi ? 'Thử tìm với từ khóa khác.' : 'Try adjusting your search criteria.')
            : (isVi ? 'Chưa có giảng viên nào trong cơ sở dữ liệu.' : 'No faculty accounts created yet.')}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlus size={14} />}
              onClick={() => navigate('/admin/teachers/create')}
            >
              {t('teachers.addTeacher')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {filtered.map(tc => (
            <div 
              key={tc.id} 
              className="eh-card p-6 flex flex-col justify-between gap-4"
            >
              <div>
                {/* Header with Avatar and Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="adm-avatar role-teacher w-12 h-12 text-lg">
                      {tc.avatar}
                    </div>
                    <div>
                      <h3 className="text-base font-bold m-0 mb-1 text-surface">{tc.name}</h3>
                      <span className="font-mono text-primary font-semibold text-xs">{tc.code}</span>
                    </div>
                  </div>

                  <span className={`badge ${tc.status === 'Active' ? 'badge-active' : 'badge-onleave'}`}>
                    {tc.status === 'Active' 
                      ? (isVi ? 'Đang hoạt động' : 'Active') 
                      : (isVi ? 'Nghỉ phép' : 'On Leave')}
                  </span>
                </div>

                {/* Email */}
                <div className="text-sm text-muted mb-3">
                  {tc.email}
                </div>

                {/* Workload Stats */}
                <div className="p-3 rounded-md bg-surface-low border-subtle text-xs">
                  <div>
                    <span className="text-muted">{isVi ? 'Lớp phụ trách: ' : 'Active Classes: '}</span>
                    <strong className="text-surface">{tc.activeClasses} {isVi ? 'lớp' : 'classes'}</strong>
                  </div>
                </div>
              </div>

              {/* Footer Action */}
              <div className="pt-3 border-t-subtle flex gap-2">
                <Button 
                  variant="secondary"
                  className="flex-1 text-sm justify-between"
                  onClick={() => navigate(`/admin/teachers/${tc.id}`)}
                >
                  <span>{t('teachers.viewProfile')}</span>
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Teachers;
