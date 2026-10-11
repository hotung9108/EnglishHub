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
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => navigate('/admin/classes')}
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} />
            <span>{t('classArchive.btnBack')}</span>
          </button>
          <div className="adm-title-group">
            <h1 className="adm-title">
              <Archive size={26} color="var(--primary)" />
              <span>{t('classArchive.title')}</span>
              <span className="adm-title-badge">Historical Records</span>
            </h1>
            <p className="adm-subtitle">
              {t('classArchive.subtitle')}
            </p>
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
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'TỔNG LỚP ĐÃ KẾT KHÓA' : 'CONCLUDED COURSES'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
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
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <Award size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#16a34a' }}>{classes.length}</span>
            <span className="adm-kpi-badge positive">Archived</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Lưu trữ hồ sơ học tập an toàn' : 'Records stored securely'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <span className="adm-kpi-title">{isVi ? 'LỚP ĐÃ HỦY' : 'CANCELLED ENROLLMENTS'}</span>
            <div className="adm-kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
              <XCircle size={18} />
            </div>
          </div>
          <div className="adm-kpi-value-row">
            <span className="adm-kpi-value" style={{ color: '#dc2626' }}>{cancelledCount}</span>
            <span className="adm-kpi-badge neutral">Cancelled</span>
          </div>
          <div className="adm-kpi-footer">
            <span>{isVi ? 'Lớp dừng đào tạo hoặc đóng sớm' : 'Closed cohorts'}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="adm-filter-bar">
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} className="text-on-surface-variant" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input" 
              placeholder={t('classArchive.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '36px' }}
            />
          </div>
        </div>

        <div className="adm-pills" style={{ margin: 0 }}>
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
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--on-surface-variant)' }}>
              {isVi ? `Hiển thị ${filtered.length} lớp học trong kho lưu trữ` : `Showing ${filtered.length} archived classrooms`}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>{isVi ? 'Đang tải kho lưu trữ...' : 'Loading archive...'}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Archive size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <div style={{ fontSize: '15px', fontWeight: 600 }}>
              {isVi ? 'Kho lưu trữ hiện chưa có lớp học nào' : 'No archived classes found'}
            </div>
            <div style={{ fontSize: '13px', marginTop: '4px' }}>
              {isVi ? 'Các lớp học khi hoàn thành khóa hoặc đóng sẽ hiển thị tại đây.' : 'Classes will appear here once they conclude or are archived.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>{isVi ? 'MÃ LỚP' : 'CLASS CODE'}</th>
                  <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                  <th>{isVi ? 'GIÁO VIÊN PHỤ TRÁCH' : 'INSTRUCTOR'}</th>
                  <th>{isVi ? 'SĨ SỐ' : 'STUDENTS'}</th>
                  <th>{isVi ? 'NGÀY KẾT THÚC' : 'CONCLUDED DATE'}</th>
                  <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                  <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cls) => (
                  <tr key={cls.id}>
                    <td className="font-semibold text-primary font-mono">{cls.code}</td>
                    <td className="font-medium" style={{ fontSize: '14.5px' }}>{cls.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} className="text-on-surface-variant" />
                        <span>{cls.teacher}</span>
                      </div>
                    </td>
                    <td>
                      <span className="adm-badge" style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
                        <GraduationCap size={12} style={{ marginRight: '4px' }} />
                        {cls.enrolledStudents} {isVi ? 'học viên' : 'students'}
                      </span>
                    </td>
                    <td className="text-on-surface-variant font-mono" style={{ fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} />
                        <span>{cls.completedDate}</span>
                      </div>
                    </td>
                    <td>
                      {cls.status === 'COMPLETED' ? (
                        <span className="adm-badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={12} /> {isVi ? 'Đã hoàn thành' : 'Completed'}
                        </span>
                      ) : (
                        <span className="adm-badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <XCircle size={12} /> {isVi ? 'Đã hủy' : 'Cancelled'}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleExport(cls.code)}
                          title={t('classArchive.btnExport')}
                          style={{ padding: '6px 10px' }}
                        >
                          <Download size={14} />
                        </button>
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRestore(cls)}
                          title={t('classArchive.btnRestore')}
                          style={{ padding: '6px 10px' }}
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
