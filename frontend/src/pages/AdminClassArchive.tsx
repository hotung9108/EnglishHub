import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import { userService } from '../api/services/user.service';
import type { ClassSummary } from '../api/services/class.service';
import { Button, Pagination } from '../components/common';

interface ArchivedClassItem {
  id: number;
  code: string;
  name: string;
  teacher: string;
  status: 'COMPLETED' | 'CANCELLED';
}

export const AdminClassArchive: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [classes, setClasses] = useState<ArchivedClassItem[]>([]);
  const [detailsMap, setDetailsMap] = useState<Record<number, { memberCount: number; endDate: string }>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: 'ALL' | 'COMPLETED' | 'CANCELLED') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  useEffect(() => {
    let isMounted = true;

    const loadArchivedClasses = async () => {
      try {
        setLoading(true);
        setError(null);

        const [classRes, teacherRes] = await Promise.allSettled([
          classService.list({ page: 1, limit: 100 }),
          userService.listUsers({ role: 'TEACHER', limit: 100 })
        ]);

        if (!isMounted) return;

        const rawClasses: ClassSummary[] = classRes.status === 'fulfilled' ? classRes.value.data : [];
        const teachers = teacherRes.status === 'fulfilled' ? teacherRes.value.data : [];
        const teacherMap = new Map<number, string>();
        teachers.forEach(teacher => teacherMap.set(teacher.id, teacher.fullName));

        // Filter classes that are COMPLETED, CANCELLED or INACTIVE
        const archivedRaw = rawClasses.filter(c => {
          const st = (c.status || '').toUpperCase();
          return st === 'COMPLETED' || st === 'CANCELLED' || st === 'INACTIVE';
        });

        const items: ArchivedClassItem[] = archivedRaw.map(c => {
          const teacherName = c.teacherId && teacherMap.has(c.teacherId)
            ? teacherMap.get(c.teacherId)!
            : (isVi ? 'Chưa phân công' : 'Unassigned');

          return {
            id: c.id,
            code: `ENG-${c.id}`,
            name: c.name,
            teacher: teacherName,
            status: (c.status || '').toUpperCase() === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED'
          };
        });

        if (!isMounted) return;
        setClasses(items);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : isVi ? 'Không thể tải kho lưu trữ lớp học.' : 'Failed to load archived classes.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadArchivedClasses();

    return () => {
      isMounted = false;
    };
  }, [isVi, refreshKey]);

  const filtered = useMemo(() => {
    return classes.filter(cls => {
      if (statusFilter !== 'ALL' && cls.status !== statusFilter) return false;
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
  }, [classes, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedClasses = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  // Lazy-load details only for the visible classes on the current page (solves N+1 query issue)
  useEffect(() => {
    let isMounted = true;
    const missingIds = paginatedClasses
      .map(c => c.id)
      .filter(id => !detailsMap[id]);

    if (missingIds.length === 0) return;

    const fetchPageDetails = async () => {
      const fetched: Record<number, { memberCount: number; endDate: string }> = {};
      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const det = await classService.getDetail(id);
            fetched[id] = {
              memberCount: typeof det.memberCount === 'number' ? det.memberCount : 0,
              endDate: det.endDate || '—'
            };
          } catch {
            fetched[id] = { memberCount: 0, endDate: '—' };
          }
        })
      );

      if (!isMounted) return;
      setDetailsMap(prev => ({ ...prev, ...fetched }));
    };

    void fetchPageDetails();

    return () => {
      isMounted = false;
    };
  }, [paginatedClasses, detailsMap]);

  const handleRestore = async (cls: ArchivedClassItem) => {
    if (confirm(isVi ? `Xác nhận mở lại lớp ${cls.name} (${cls.code}) về trạng thái ACTIVE?` : `Restore class ${cls.name} to ACTIVE status?`)) {
      try {
        await classService.update(cls.id, { status: 'ACTIVE' });
        setRefreshKey(prev => prev + 1);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : isVi ? 'Không thể khôi phục lớp học.' : 'Failed to restore class.');
      }
    }
  };

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6">
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary"
            onClick={() => navigate('/admin/classes')}
          >
            ← {t('classArchive.btnBack')}
          </Button>
          <div className="adm-title-group">
            <h1 className="adm-title">
              {t('classArchive.title')}
            </h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="adm-alert-error mb-5">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="adm-filter-bar mb-6">
        <div className="adm-pills m-0">
          {(
            [
              { key: 'ALL', label: isVi ? 'Tất cả trạng thái' : 'All Statuses' },
              { key: 'COMPLETED', label: isVi ? 'Đã hoàn thành' : 'Completed' },
              { key: 'CANCELLED', label: isVi ? 'Đã hủy' : 'Cancelled' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`adm-pill ${statusFilter === item.key ? 'active' : ''}`}
              onClick={() => handleStatusFilterChange(item.key)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input 
            type="text" 
            className="adm-search-input" 
            placeholder={t('classArchive.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Archive Table */}
      <div className="adm-table-card">
        <div className="adm-table-header">
          <div>
            <h3 className="adm-table-title">
              {isVi ? 'Danh Sách Lớp Học Đã Lưu Trữ' : 'Archived Classrooms'}
            </h3>
            <p className="mt-1 mb-0 text-[13px] text-muted">
              {isVi ? `Hiển thị ${filtered.length} lớp học trong kho lưu trữ` : `Showing ${filtered.length} archived classrooms`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted">
            <Loader2 size={32} className="animate-spin mx-auto mb-3" />
            <div>{isVi ? 'Đang tải kho lưu trữ...' : 'Loading archive...'}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <div className="text-[15px] font-semibold text-surface">
              {isVi ? 'Kho lưu trữ hiện chưa có lớp học nào' : 'No archived classes found'}
            </div>
            <div className="text-[13px] text-muted mt-1">
              {isVi ? 'Các lớp học khi hoàn thành khóa hoặc đóng sẽ hiển thị tại đây.' : 'Classes will appear here once they conclude or are archived.'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ LỚP' : 'CLASS CODE'}</th>
                  <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                  <th>{isVi ? 'GIÁO VIÊN PHỤ TRÁCH' : 'INSTRUCTOR'}</th>
                  <th>{isVi ? 'SĨ SỐ' : 'STUDENTS'}</th>
                  <th>{isVi ? 'NGÀY KẾT THÚC' : 'CONCLUDED DATE'}</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                  <th className="text-right">{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClasses.map((cls) => {
                  const detail = detailsMap[cls.id];
                  const memberCount = detail ? `${detail.memberCount} ${isVi ? 'học viên' : 'students'}` : '...';
                  const endDate = detail ? detail.endDate : '...';

                  return (
                    <tr key={cls.id}>
                      <td className="font-semibold text-primary font-mono">{cls.code}</td>
                      <td className="font-medium text-surface">{cls.name}</td>
                      <td>{cls.teacher}</td>
                      <td>{memberCount}</td>
                      <td className="font-mono text-[13px]">{endDate}</td>
                      <td>
                        {cls.status === 'COMPLETED' 
                          ? (isVi ? 'Đã hoàn thành' : 'Completed') 
                          : (isVi ? 'Đã hủy' : 'Cancelled')}
                      </td>
                      <td className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/admin/classes/${cls.id}`)}
                          >
                            {isVi ? 'Xem chi tiết' : 'View Details'}
                          </Button>
                          <Button 
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRestore(cls)}
                          >
                            {isVi ? 'Mở lại' : 'Restore'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setCurrentPage(1);
            }}
            pageSizeOptions={[10, 20, 50]}
            itemLabel={isVi ? 'lớp học' : 'classes'}
            isVi={isVi}
            variant="table"
          />
        )}
      </div>
    </div>
  );
};

export default AdminClassArchive;
