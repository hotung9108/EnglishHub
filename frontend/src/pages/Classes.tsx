import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import type { ClassSummary } from '../api/services/class.service';
import { Button, EmptyState, Pagination, ConfirmModal, useToast } from '../components/common';

export const Classes: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [classesData, setClassesData] = useState<Array<{
    id: number;
    name: string;
    code: string;
    teacher: string;
    status: 'active' | 'completed' | 'cancelled';
    level: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();
  const [classToChangeStatus, setClassToChangeStatus] = useState<{ id: number; name: string; action: 'close' | 'reopen' } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await classService.list({ page: 1, limit: 100 });
        if (!isMounted) return;

        const mapped = (res.data || []).map((c: ClassSummary) => {
          const rawStatus = (c.status || '').toUpperCase();
          let status: 'active' | 'completed' | 'cancelled' = 'active';
          if (rawStatus === 'COMPLETED' || rawStatus === 'INACTIVE') {
            status = 'completed';
          } else if (rawStatus === 'CANCELLED') {
            status = 'cancelled';
          }

          return {
            id: c.id,
            name: c.name,
            code: `ENG-${c.id}`,
            teacher: (c as { teacherName?: string }).teacherName || (c.teacherId ? `GV #${c.teacherId}` : (isVi ? 'Chưa phân công' : 'Unassigned')),
            status,
            level: isVi ? 'Tiếng Anh Giao Tiếp' : 'Communication English'
          };
        });

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

  const handleStatusFilterChange = (status: 'all' | 'active' | 'completed' | 'cancelled') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleUpdateClassStatus = async () => {
    if (!classToChangeStatus) return;
    setIsUpdatingStatus(true);
    const targetStatus = classToChangeStatus.action === 'close' ? 'COMPLETED' : 'ACTIVE';
    try {
      await classService.update(classToChangeStatus.id, { status: targetStatus });
      setClassesData(prev => prev.map(c => {
        if (c.id === classToChangeStatus.id) {
          return {
            ...c,
            status: targetStatus === 'COMPLETED' ? 'completed' : 'active'
          };
        }
        return c;
      }));
      toastSuccess(
        classToChangeStatus.action === 'close'
          ? (isVi ? 'Đóng lớp học thành công.' : 'Class closed successfully.')
          : (isVi ? 'Mở lại lớp học thành công.' : 'Class reopened successfully.')
      );
      setClassToChangeStatus(null);
    } catch (err: unknown) {
      toastError(
        err instanceof Error
          ? err.message
          : (isVi ? 'Không thể cập nhật trạng thái lớp.' : 'Failed to update class status.')
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const filtered = useMemo(() => {
    return classesData.filter(cls => {
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
  }, [classesData, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedClasses = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            {t('adminClasses.title')}
          </h1>
        </div>

        <div className="adm-actions flex items-center gap-3">
          <Button 
            variant="secondary"
            onClick={() => navigate('/admin/classes/archive')}
          >
            {t('classArchive.title')}
          </Button>
          <Button 
            variant="primary"
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
              { key: 'all', label: isVi ? 'Tất cả lớp học' : 'All Classes' },
              { key: 'active', label: isVi ? 'Đang mở' : 'Active' },
              { key: 'completed', label: isVi ? 'Đã hoàn thành' : 'Completed' },
              { key: 'cancelled', label: isVi ? 'Đã hủy' : 'Cancelled' },
            ] as const
          ).map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => handleStatusFilterChange(p.key)}
              className={`adm-pill ${statusFilter === p.key ? 'active' : ''}`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="adm-search-wrap">
          <Search size={16} className="adm-search-icon" />
          <input 
            type="text" 
            className="adm-search-input"
            placeholder={isVi ? 'Tìm tên lớp, mã lớp, giảng viên...' : 'Search classes...'}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
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
          title={isVi ? 'Không tìm thấy lớp học nào' : 'No classes found'}
          description={searchQuery 
            ? (isVi ? 'Không có lớp học nào khớp với từ khóa tìm kiếm.' : 'No classes match your search query.')
            : (isVi ? 'Chưa có lớp học nào được tạo trên hệ thống.' : 'No classes created yet.')}
          action={
            <Button 
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/classes/create')}
            >
              {t('adminClasses.createClass')}
            </Button>
          }
        />
      ) : (
        <div className="adm-table-card">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                <th>{isVi ? 'GIẢNG VIÊN' : 'INSTRUCTOR'}</th>
                <th>{isVi ? 'TRÌNH ĐỘ' : 'LEVEL'}</th>
                <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                <th className="text-right">{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClasses.map(cls => (
                <tr key={cls.id} onClick={() => navigate(`/admin/classes/${cls.id}`)} className="cursor-pointer">
                  <td className="font-semibold text-primary font-mono">{cls.code}</td>
                  <td className="font-medium text-surface">{cls.name}</td>
                  <td>{cls.teacher}</td>
                  <td className="text-muted">{cls.level}</td>
                  <td>
                    {cls.status === 'active' 
                      ? (isVi ? 'Đang mở' : 'Active') 
                      : cls.status === 'completed' 
                      ? (isVi ? 'Đã hoàn thành' : 'Completed') 
                      : (isVi ? 'Đã hủy' : 'Cancelled')}
                  </td>
                  <td className="text-right">
                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
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
                      {cls.status === 'active' ? (
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClassToChangeStatus({ id: cls.id, name: cls.name, action: 'close' });
                          }}
                        >
                          {isVi ? 'Đóng lớp' : 'Close Class'}
                        </Button>
                      ) : cls.status === 'completed' ? (
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClassToChangeStatus({ id: cls.id, name: cls.name, action: 'reopen' });
                          }}
                        >
                          {isVi ? 'Mở lại lớp' : 'Reopen Class'}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
        </div>
      )}

      {/* Modal xác nhận Đóng / Mở lại lớp học (UC008 / Issue #367) */}
      <ConfirmModal
        isOpen={Boolean(classToChangeStatus)}
        title={
          classToChangeStatus?.action === 'close'
            ? (isVi ? 'Đóng lớp học' : 'Close Class')
            : (isVi ? 'Mở lại lớp học' : 'Reopen Class')
        }
        message={
          classToChangeStatus
            ? classToChangeStatus.action === 'close'
              ? (isVi
                  ? `Bạn có chắc chắn muốn đóng lớp học "${classToChangeStatus.name}" không?`
                  : `Are you sure you want to close class "${classToChangeStatus.name}"?`)
              : (isVi
                  ? `Bạn có chắc chắn muốn mở lại lớp học "${classToChangeStatus.name}" không?`
                  : `Are you sure you want to reopen class "${classToChangeStatus.name}"?`)
            : ''
        }
        confirmText={isVi ? 'Xác nhận' : 'Confirm'}
        cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}
        variant={classToChangeStatus?.action === 'close' ? 'warning' : 'primary'}
        isLoading={isUpdatingStatus}
        onConfirm={handleUpdateClassStatus}
        onCancel={() => setClassToChangeStatus(null)}
      />
    </div>
  );
};

export default Classes;
