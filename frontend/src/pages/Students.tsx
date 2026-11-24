import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, UserPlus, Search, 
  Loader2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useUsers } from '../hooks/useUsers';
import { useDebounce } from '../hooks/useDebounce';
import { userService } from '../api/services/user.service';
import type { UserListItem } from '../api/services/user.service';
import { Button, MetricCard, EmptyState, Pagination, ConfirmModal } from '../components/common';
import { useToast } from '../components/common/ToastContext';

interface StudentRow {
  id: number;
  name: string;
  code: string;
  email: string;
  status: 'ACTIVE' | 'LOCKED';
  enrolledClasses: number;
}

export const Students: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'LOCKED'>('All');
  const [statusModalStudent, setStatusModalStudent] = useState<StudentRow | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const {
    users,
    pagination,
    isLoading: loading,
    error,
    setQuery,
    setPage,
    setLimit,
    refetch,
  } = useUsers({
    initialRole: 'STUDENT',
    initialPage: 1,
    initialLimit: 10,
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 350);
  const isFirstSearchEffect = React.useRef(true);

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      if (!debouncedSearchQuery.trim()) return;
    }
    setQuery(debouncedSearchQuery.trim());
  }, [debouncedSearchQuery, setQuery]);

  const studentsData = useMemo(() => {
    return users.map((st: UserListItem) => ({
      id: st.id,
      name: st.fullName,
      code: `HV-${String(st.id).padStart(4, '0')}`,
      email: st.email,
      status: (st.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE') as 'ACTIVE' | 'LOCKED',
      enrolledClasses: 1
    }));
  }, [users]);

  const displayedStudents = useMemo(() => {
    if (statusFilter === 'All') return studentsData;
    return studentsData.filter(st => st.status === statusFilter);
  }, [studentsData, statusFilter]);

  const handleStatusFilterChange = (status: 'All' | 'ACTIVE' | 'LOCKED') => {
    setStatusFilter(status);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageSizeChange = (size: number) => {
    setLimit(size);
  };

  const totalEnrolled = pagination.total;
  const activeCount = studentsData.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header mb-6">
        <div className="adm-title-group">
          <h1 className="adm-title">
            {t('students.title')}
          </h1>
        </div>

        <div className="adm-actions flex items-center gap-3">
          <Button 
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={() => navigate('/admin/students/create')}
          >
            {t('students.addStudent')}
          </Button>
        </div>
      </div>

      {error && (
        <div className="adm-alert-error mb-6">
          <AlertCircle size={18} />
          <span>{error.message || (isVi ? 'Không thể tải danh sách học viên.' : 'Failed to fetch students.')}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="adm-kpi-grid mb-6">
        <MetricCard
          title={isVi ? 'TỔNG SỐ HỌC VIÊN' : 'TOTAL COHORT'}
          value={totalEnrolled}
          footerText={`${activeCount} ${isVi ? 'tài khoản đang hoạt động' : 'active accounts'}`}
        />

        <MetricCard
          title={isVi ? 'TRẠNG THÁI HỆ THỐNG' : 'ACCOUNT STATUS'}
          value={totalEnrolled > 0 ? `${Math.round((activeCount / Math.max(1, studentsData.length)) * 100)}%` : '100%'}
          footerText={isVi ? 'Tỷ lệ kích hoạt' : 'Activation rate'}
        />

        <MetricCard
          title={isVi ? 'TÀI KHOẢN TẠM KHÓA' : 'LOCKED USERS'}
          value={studentsData.filter(s => s.status === 'LOCKED').length}
          footerText={isVi ? 'Cần hỗ trợ học vụ' : 'Needs attention'}
        />
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar mb-6">
        <div className="adm-pills">
          {(['All', 'ACTIVE', 'LOCKED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => handleStatusFilterChange(st)}
              className={`adm-pill ${statusFilter === st ? 'active' : ''}`}
            >
              <span>{st === 'All' ? (isVi ? 'Tất cả trạng thái' : 'All') : st === 'ACTIVE' ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Blocked')}</span>
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
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Modern Student Directory Table */}
      <div className="adm-table-card">
        {loading ? (
          <div className="p-8 text-center text-muted">
            <Loader2 size={32} className="animate-spin mx-auto mb-3" />
            <div>{isVi ? 'Đang tải danh sách học viên...' : 'Loading students...'}</div>
          </div>
        ) : displayedStudents.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title={isVi ? 'Không tìm thấy học viên nào' : 'No students found'}
            description={searchQuery 
              ? (isVi ? 'Thử tìm với từ khóa khác.' : 'Try adjusting your search criteria.')
              : (isVi ? 'Chưa có tài khoản học viên nào trong hệ thống.' : 'No student accounts exist yet.')}
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<UserPlus size={14} />}
                onClick={() => navigate('/admin/students/create')}
              >
                {t('students.addStudent')}
              </Button>
            }
          />
        ) : (
          <>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{t('students.colId')}</th>
                  <th>{t('students.colName')}</th>
                  <th>Email</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                  <th className="text-right">{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody>
                {displayedStudents.map(st => (
                  <tr 
                    key={st.id} 
                    className="adm-table-row-clickable cursor-pointer"
                    onClick={() => navigate(`/admin/students/${st.id}`, {
                      state: {
                        studentId: st.id,
                        fullName: st.name,
                        email: st.email,
                        studentCode: st.code,
                      }
                    })}
                  >
                    <td className="font-mono font-semibold text-primary">{st.code}</td>
                    <td>
                      <div className="font-semibold text-surface">{st.name}</div>
                    </td>
                    <td className="font-mono text-muted">{st.email}</td>
                    <td>
                      <span className={`badge ${st.status === 'ACTIVE' ? 'badge-active' : 'badge-onleave'}`}>
                        {st.status === 'ACTIVE' ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Blocked')}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex gap-2 justify-end">
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusModalStudent(st);
                          }}
                        >
                          {st.status === 'ACTIVE' ? t('students.actionLock') : t('students.actionUnlock')}
                        </Button>
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/students/${st.id}`, {
                              state: {
                                studentId: st.id,
                                fullName: st.name,
                                email: st.email,
                                studentCode: st.code,
                              }
                            });
                          }}
                        >
                          {t('students.actionViewDetails')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={(page) => setPage(page)}
              onPageSizeChange={handlePageSizeChange}
              itemLabel={isVi ? 'học viên' : 'students'}
              isVi={isVi}
              variant="table"
            />
          </>
        )}
      </div>

      {/* Two-Step Confirmation Modal for Student Status Change */}
      {statusModalStudent && (
        <ConfirmModal
          isOpen={Boolean(statusModalStudent)}
          title={
            statusModalStudent.status === 'ACTIVE'
              ? (isVi ? 'Xác nhận khóa tài khoản học viên' : 'Lock Student Account')
              : (isVi ? 'Xác nhận mở khóa tài khoản' : 'Unlock Student Account')
          }
          message={
            statusModalStudent.status === 'ACTIVE'
              ? (isVi
                  ? `Bạn có chắc chắn muốn khóa tài khoản học viên "${statusModalStudent.name}"? Học viên này sẽ không thể đăng nhập hoặc nộp bài tập.`
                  : `Are you sure you want to lock student account "${statusModalStudent.name}"? The student will lose access to assignments and classes.`)
              : (isVi
                  ? `Khôi phục quyền truy cập cho học viên "${statusModalStudent.name}"?`
                  : `Restore system access for student "${statusModalStudent.name}"?`)
          }
          confirmText={
            statusModalStudent.status === 'ACTIVE'
              ? (isVi ? 'Khóa tài khoản' : 'Lock Account')
              : (isVi ? 'Mở khóa' : 'Unlock Account')
          }
          cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}
          variant={statusModalStudent.status === 'ACTIVE' ? 'danger' : 'primary'}
          isLoading={isUpdatingStatus}
          onConfirm={async () => {
            if (!statusModalStudent) return;
            const nextStatus = statusModalStudent.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
            setIsUpdatingStatus(true);
            try {
              await userService.updateStatus(statusModalStudent.id, nextStatus);
              await refetch();
              toastSuccess(
                isVi
                  ? `Đã ${nextStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${statusModalStudent.name} thành công.`
                  : `Successfully ${nextStatus === 'ACTIVE' ? 'activated' : 'locked'} student ${statusModalStudent.name}.`
              );
              setStatusModalStudent(null);
            } catch {
              toastError(isVi ? 'Không thể cập nhật trạng thái học viên.' : 'Failed to update student status.');
            } finally {
              setIsUpdatingStatus(false);
            }
          }}
          onCancel={() => setStatusModalStudent(null)}
        />
      )}
    </div>
  );
};

export default Students;