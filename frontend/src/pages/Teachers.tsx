import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  GraduationCap, UserPlus, Search, 
  ArrowRight, Loader2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
import type { UserListItem } from '../api/services/user.service';
import type { ClassSummary } from '../api/services/class.service';
import { Button, MetricCard, EmptyState, Pagination } from '../components/common';

const SPECIALIZATION_REQUEST_LIMIT = 4;

type SpecializationResult =
  | { state: 'ready'; value: string }
  | { state: 'missing' }
  | { state: 'error' };

async function readSpecialization(id: number, signal: AbortSignal): Promise<SpecializationResult> {
  try {
    const profile = await userService.getAdminUserDetail(id, { signal });
    if (profile?.id !== id || profile.role !== 'TEACHER') return { state: 'error' };
    const value = profile.specialization?.trim();
    return value ? { state: 'ready', value } : { state: 'missing' };
  } catch {
    return { state: 'error' };
  }
}

export const Teachers: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [teachers, setTeachers] = useState<Array<{
    id: number;
    name: string;
    code: string;
    avatar: string;
    email: string;
    status: UserListItem['status'];
    activeClasses: number;
    rating: number;
  }>>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClassesCount, setTotalClassesCount] = useState(0);
  const [specializations, setSpecializations] = useState(new Map<number, SpecializationResult>());
  const specializationCache = useRef(new Map<number, SpecializationResult>());
  const inFlightDetails = useRef(new Set<Promise<void>>());

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
            status: tc.status,
            activeClasses: teacherClasses.length,
            rating: 4.8,
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

  const filtered = useMemo(() => {
    return teachers.filter(tc => {
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
  }, [teachers, searchQuery]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTeachers = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  const visibleIds = [...new Set(paginatedTeachers.map(teacher => teacher.id))];
  const visibleIdsKey = visibleIds.sort((a, b) => a - b).join(',');

  useEffect(() => {
    if (!visibleIdsKey) return;
    const cache = specializationCache.current;
    const inFlight = inFlightDetails.current;
    const currentIds = visibleIdsKey.split(',').map(Number);
    const pendingIds = currentIds.filter(id => !cache.has(id));
    if (pendingIds.length === 0) return;

    const controller = new AbortController();
    const { signal } = controller;

    const load = async (id: number) => {
      const result = await readSpecialization(id, signal);
      if (signal.aborted) return;
      cache.set(id, result);
      setSpecializations(new Map(cache));
    };

    const schedule = async () => {
      let index = 0;
      while (!signal.aborted && index < pendingIds.length) {
        // Aborted requests keep their slots until they settle.
        if (inFlight.size >= SPECIALIZATION_REQUEST_LIMIT) {
          await Promise.race(inFlight);
          continue;
        }

        const request = load(pendingIds[index]);
        inFlight.add(request);
        void request.then(() => inFlight.delete(request));
        index += 1;
      }
    };

    void schedule();
    return () => controller.abort();
  }, [visibleIdsKey]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const activeTeachersCount = teachers.filter(teacher => teacher.status === 'ACTIVE').length;

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
          footerText={`${activeTeachersCount} ${isVi ? 'đang hoạt động' : 'active instructors'}`}
        />

        <MetricCard
          title={isVi ? 'LỚP ĐANG GIẢNG DẠY' : 'ASSIGNED CLASSES'}
          value={totalClassesCount}
          footerText={`${teachers.length > 0 ? (totalClassesCount / teachers.length).toFixed(1) : '0'} ${isVi ? 'lớp/GV' : 'classes/teacher'}`}
        />

        <MetricCard
          title={isVi ? 'QUY CHUẨN ĐÀO TẠO' : 'ACADEMIC STANDARDS'}
          value="100%"
          footerText={isVi ? 'Đạt chuẩn đào tạo' : 'Standard Compliant'}
        />
      </div>

      {/* Search */}
      <div className="adm-filter-bar mb-6">
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input 
            type="text" 
            className="adm-search-input"
            placeholder={isVi ? 'Tìm tên giáo viên, mã GV, email...' : 'Search teachers...'}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
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
        <div className="flex flex-col gap-6">
          <div className="adm-cards-grid">
            {paginatedTeachers.map(tc => {
              const isActive = tc.status === 'ACTIVE';
              const isLocked = tc.status === 'LOCKED';
              const statusClass = isActive ? 'badge-active' : isLocked ? 'badge-blocked' : 'badge-neutral';
              const specialization = specializations.get(tc.id);

              let specializationText = isVi ? 'Đang tải chuyên môn...' : 'Loading specialization...';
              if (specialization?.state === 'ready') {
                specializationText = specialization.value;
              } else if (specialization?.state === 'missing') {
                specializationText = isVi ? 'Chưa cập nhật' : 'Not specified';
              } else if (specialization?.state === 'error') {
                specializationText = isVi ? 'Không thể tải chuyên môn' : 'Could not load specialization';
              }

              return (
                <div
                  key={tc.id}
                  className="eh-card min-w-0 p-6 flex flex-col justify-between gap-4"
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

                      <span className={`badge ${statusClass}`}>
                        {isActive && (isVi ? 'Đang hoạt động' : 'Active')}
                        {isLocked && (isVi ? 'Bị khóa' : 'Locked')}
                        {!isActive && !isLocked && (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">{isVi ? 'Chưa xác định' : 'Unknown'}</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="text-sm text-muted mb-3">
                      {tc.email}
                    </div>

                    <div className="mb-3">
                      <span className="text-xs text-muted">{isVi ? 'Chuyên môn' : 'Specialization'}</span>
                      <div className="adm-rep-student-sub" title={specializationText}>
                        {specializationText}
                      </div>
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
              );
            })}
          </div>

          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            pageSizeOptions={[9, 18, 27, 45]}
            onPageChange={(page) => setCurrentPage(page)}
            onPageSizeChange={handlePageSizeChange}
            itemLabel={isVi ? 'giảng viên' : 'teachers'}
            isVi={isVi}
            variant="standalone"
          />
        </div>
      )}
    </div>
  );
};

export default Teachers;
