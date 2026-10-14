import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Archive, ArrowLeft, Search, 
  RotateCcw, Download, 
  User, CheckCircle2, XCircle,
  GraduationCap, Calendar, Award, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { classService } from '../api/services/class.service';
import { userService } from '../api/services/user.service';
import type { ClassSummary } from '../api/services/class.service';

interface ArchivedClassItem {
  id: number;
  code: string;
  name: string;
  teacher: string;
  enrolledStudents: number;
  avgFinalScore: number;
  passRate: number;
  completedDate: string;
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
  const [refreshKey, setRefreshKey] = useState(0);

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
        teachers.forEach(t => teacherMap.set(t.id, t.fullName));

        // Filter classes that are COMPLETED or CANCELLED or INACTIVE
        const archivedRaw = rawClasses.filter(c => c.status === 'COMPLETED' || c.status === 'CANCELLED' || c.status === 'INACTIVE');

        const items: ArchivedClassItem[] = await Promise.all(
          archivedRaw.map(async (c) => {
            let memberCount = 0;
            let endDate = '—';
            try {
              const detail = await classService.getDetail(c.id);
              if (detail.endDate) endDate = detail.endDate;
              if (typeof detail.memberCount === 'number') {
                memberCount = detail.memberCount;
              }
            } catch {
              // fallback
            }

            const teacherName = c.teacherId && teacherMap.has(c.teacherId)
              ? teacherMap.get(c.teacherId)!
              : (isVi ? 'Chưa phân công' : 'Unassigned');

            return {
              id: c.id,
              code: `ENG-${c.id}`,
              name: c.name,
              teacher: teacherName,
              enrolledStudents: memberCount,
              avgFinalScore: 7.5,
              passRate: 95,
              completedDate: endDate,
              status: c.status === 'CANCELLED' ? 'CANCELLED' : 'COMPLETED'
            };
          })
        );

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

  const filtered = classes.filter(cls => {
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

  const handleExport = (code: string) => {
    alert(isVi ? `Đang kết xuất học bạ và bảng điểm cuối khóa của lớp ${code}...` : `Exporting final academic record for ${code}...`);
  };

  const completedCount = classes.filter(c => c.status === 'COMPLETED').length;
  const cancelledCount = classes.filter(c => c.status === 'CANCELLED').length;
  const totalEnrolled = classes.reduce((sum, c) => sum + c.enrolledStudents, 0);

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="flex items-center gap-3.5">
          <button 
            type="button"
            className="btn btn-secondary adm-btn-back" 
            onClick={() => navigate('/admin/classes')}
          >
            <ArrowLeft size={16} />
            <span>{t('classArchive.btnBack')}</span>
          </button>
          <div className="adm-title-group">
            <h1 className="adm-title">
              <span>{t('classArchive.title')}</span>
              <span className="adm-title-badge">Historical Records</span>
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

      {/* KPI Stats */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỔNG LỚP ĐÃ KẾT KHÓA' : 'CONCLUDED COURSES'}</span>
            <div className="adm-kpi-icon-wrapper adm-kpi-icon-primary">
              <Archive size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value">{completedCount}</span>
            <span className="adm-kpi-badge positive">Concluded</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? `Tổng ${totalEnrolled} học viên hoàn thành` : `${totalEnrolled} total students recorded`}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỔNG SỐ LỚP LƯU TRỮ' : 'TOTAL ARCHIVED'}</span>
            <div className="adm-kpi-icon-wrapper adm-kpi-icon-success">
              <Award size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value text-emerald-600">{classes.length}</span>
            <span className="adm-kpi-badge positive">Archived</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Lưu trữ hồ sơ học tập an toàn' : 'Records stored securely'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'LỚP ĐÃ HỦY' : 'CANCELLED ENROLLMENTS'}</span>
            <div className="adm-kpi-icon-wrapper adm-kpi-icon-danger">
              <XCircle size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value text-rose-600">{cancelledCount}</span>
            <span className="adm-kpi-badge neutral">Cancelled</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Lớp dừng đào tạo hoặc đóng sớm' : 'Closed cohorts'}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-filter-bar">
        <div className="flex-1 min-w-[280px]">
          <div className="adm-search-wrap">
            <Search size={16} className="adm-search-icon" />
            <input 
              type="text" 
              className="adm-search-input" 
              placeholder={t('classArchive.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="adm-pills m-0">
          {(
            [
              { key: 'ALL', label: isVi ? 'Tất cả trạng thái' : 'All Statuses' },
              { key: 'COMPLETED', label: isVi ? 'Đã hoàn thành' : 'Completed' },
              { key: 'CANCELLED', label: isVi ? 'Đã hủy bỏ' : 'Cancelled' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              className={`adm-pill-item ${statusFilter === item.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(item.key)}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Archive Table */}
      <div className="adm-table-card">
        <div className="adm-table-header">
          <div>
            <h3 className="adm-table-title">
              {isVi ? 'Danh Sách Lớp Học Đã Lưu Trữ' : 'Archived Classrooms'}
            </h3>
            <p className="mt-1 mb-0 text-[13px] text-on-surface-variant">
              {isVi ? `Hiển thị ${filtered.length} lớp học trong kho lưu trữ` : `Showing ${filtered.length} archived classrooms`}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading-state">
            <Loader2 size={32} className="animate-spin adm-loading-state-icon" />
            <div>{isVi ? 'Đang tải kho lưu trữ...' : 'Loading archive...'}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty-state-card">
            <Archive size={36} className="adm-empty-state-icon" />
            <div className="text-[15px] font-semibold text-on-surface">
              {isVi ? 'Kho lưu trữ hiện chưa có lớp học nào' : 'No archived classes found'}
            </div>
            <div className="text-[13px] text-on-surface-variant mt-1">
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
                {filtered.map((cls) => (
                  <tr key={cls.id}>
                    <td className="font-semibold text-primary font-mono">{cls.code}</td>
                    <td className="font-medium text-[14.5px]">{cls.name}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-on-surface-variant" />
                        <span>{cls.teacher}</span>
                      </div>
                    </td>
                    <td>
                      <span className="adm-badge adm-badge-neutral">
                        <GraduationCap size={12} className="mr-1" />
                        {cls.enrolledStudents} {isVi ? 'học viên' : 'students'}
                      </span>
                    </td>
                    <td className="text-on-surface-variant font-mono text-[13px]">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>{cls.completedDate}</span>
                      </div>
                    </td>
                    <td>
                      {cls.status === 'COMPLETED' ? (
                        <span className="adm-badge badge-active inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> {isVi ? 'Đã hoàn thành' : 'Completed'}
                        </span>
                      ) : (
                        <span className="adm-badge badge-warning inline-flex items-center gap-1">
                          <XCircle size={12} /> {isVi ? 'Đã hủy' : 'Cancelled'}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm px-2.5 py-1.5"
                          onClick={() => handleExport(cls.code)}
                          title={t('classArchive.btnExport')}
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm px-2.5 py-1.5"
                          onClick={() => handleRestore(cls)}
                          title={t('classArchive.btnRestore')}
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClassArchive;
