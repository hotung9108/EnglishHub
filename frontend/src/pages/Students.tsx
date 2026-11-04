import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, Search, 
  Loader2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import type { UserListItem } from '../api/services/user.service';
import { Button, MetricCard, EmptyState, Pagination } from '../components/common';

export const Students: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'LOCKED'>('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [studentsData, setStudentsData] = useState<Array<{
    id: number;
    name: string;
    code: string;
    email: string;
    status: 'ACTIVE' | 'LOCKED';
    enrolledClasses: number;
  }>>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await userService.listUsers({ role: 'STUDENT', limit: 100 });
        if (!isMounted) return;

        const mapped = (res.data || []).map((st: UserListItem) => ({
          id: st.id,
          name: st.fullName,
          code: `HV-${String(st.id).padStart(4, '0')}`,
          email: st.email,
          status: (st.status === 'LOCKED' ? 'LOCKED' : 'ACTIVE') as 'ACTIVE' | 'LOCKED',
          enrolledClasses: 1
        }));

        setStudentsData(mapped);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : isVi ? 'Không thể tải danh sách học viên.' : 'Failed to fetch students.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [isVi]);

  const filtered = useMemo(() => {
    return studentsData.filter(st => {
      if (statusFilter !== 'All' && st.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          st.name.toLowerCase().includes(q) ||
          st.code.toLowerCase().includes(q) ||
          st.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [studentsData, statusFilter, searchQuery]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedStudents = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safeCurrentPage, pageSize]);

  const handleStatusFilterChange = (status: 'All' | 'ACTIVE' | 'LOCKED') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalEnrolled = studentsData.length;
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
          <span>{error}</span>
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
          value={totalEnrolled > 0 ? `${Math.round((activeCount / totalEnrolled) * 100)}%` : '100%'}
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
        ) : filtered.length === 0 ? (
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
                {paginatedStudents.map(st => (
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
                          onClick={async (e) => {
                            e.stopPropagation();
                            const nextStatus = st.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
                            try {
                              await userService.updateStatus(st.id, nextStatus);
                              setStudentsData(prev => prev.map(item => item.id === st.id ? { ...item, status: nextStatus } : item));
                            } catch {
                              alert(isVi ? 'Không thể cập nhật trạng thái học viên.' : 'Failed to update student status.');
                            }
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
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={handlePageSizeChange}
              itemLabel={isVi ? 'học viên' : 'students'}
              isVi={isVi}
              variant="table"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Students;
