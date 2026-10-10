import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, 
  FileSpreadsheet, CheckCircle2, Award, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import { reportService } from '../api/services/report.service';
import type { UserListItem } from '../api/services/user.service';

interface StudentDirectoryItem {
  id: number;
  code: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'LOCKED' | 'INACTIVE';
}

export const Students: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentsData, setStudentsData] = useState<StudentDirectoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'LOCKED'>('All');
  const [totalEnrolled, setTotalEnrolled] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersRes, reportRes] = await Promise.allSettled([
          userService.listUsers({ role: 'STUDENT', limit: 100 }),
          reportService.getOverview()
        ]);

        if (!isMounted) return;

        const rawList: UserListItem[] = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
        if (reportRes.status === 'fulfilled') {
          // overview stats if available
        }

        const items: StudentDirectoryItem[] = rawList.map(st => ({
          id: st.id,
          code: `HV-${String(st.id).padStart(4, '0')}`,
          name: st.fullName,
          email: st.email,
          role: st.role,
          status: st.status
        }));

        setStudentsData(items);
        setTotalEnrolled(items.length);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải danh sách học viên.' : 'Failed to load students.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [isVi]);

  const filtered = studentsData.filter(st => {
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

  const activeCount = studentsData.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <Users size={28} color="var(--primary)" />
            {t('students.title')}
            <span className="adm-title-badge">{studentsData.length} {isVi ? 'học viên' : 'students'}</span>
          </h1>
          <p className="adm-subtitle">
            {isVi 
              ? 'Danh bạ học viên toàn khóa, theo dõi mục tiêu điểm số và tiến độ hoàn thành bài tập.' 
              : 'Student directory, target band attainment tracking, and exercise submission completion.'}
          </p>
        </div>

        <div className="adm-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => alert(isVi ? 'Đang mở hộp thoại nhập file Excel...' : 'Opening Excel file dialog...')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FileSpreadsheet size={16} color="#16a34a" />
            <span>{t('students.importExcel')}</span>
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/students/create')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={16} />
            <span>{t('students.addStudent')}</span>
          </button>
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

      {/* KPI Stats Strip */}
      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TỔNG SỐ HỌC VIÊN' : 'TOTAL COHORT'}</div>
              <div className="adm-kpi-value">{totalEnrolled}</div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <Users size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="text-on-surface-variant">
              {activeCount} {isVi ? 'tài khoản đang hoạt động' : 'active accounts'}
            </span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TRẠNG THÁI HỆ THỐNG' : 'ACCOUNT STATUS'}</div>
              <div className="adm-kpi-value" style={{ color: '#16a34a' }}>
                {totalEnrolled > 0 ? `${Math.round((activeCount / totalEnrolled) * 100)}%` : '100%'}
              </div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="adm-kpi-delta pos">{isVi ? 'Tỷ lệ kích hoạt' : 'Activation rate'}</span>
          </div>
        </div>

        <div className="adm-kpi-card">
          <div className="adm-kpi-header">
            <div>
              <div className="adm-kpi-label">{isVi ? 'TÀI KHOẢN TẠM KHÓA' : 'LOCKED USERS'}</div>
              <div className="adm-kpi-value">
                {studentsData.filter(s => s.status === 'LOCKED').length}
              </div>
            </div>
            <div className="adm-kpi-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
              <Award size={22} />
            </div>
          </div>
          <div className="adm-kpi-footer">
            <span className="text-on-surface-variant">{isVi ? 'Cần hỗ trợ học vụ' : 'Needs attention'}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="adm-filter-bar">
        <div className="adm-pills">
          {(['All', 'ACTIVE', 'LOCKED'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Modern Student Directory Table */}
      <div className="adm-table-card">
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            <div>{isVi ? 'Đang tải danh sách học viên...' : 'Loading students...'}</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
            <Users size={40} style={{ margin: '0 auto 14px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--on-surface)' }}>
              {isVi ? 'Không tìm thấy học viên nào' : 'No students found'}
            </h3>
            <p style={{ margin: 0, fontSize: '13.5px' }}>
              {searchQuery 
                ? (isVi ? 'Thử tìm với từ khóa khác.' : 'Try adjusting your search criteria.')
                : (isVi ? 'Chưa có tài khoản học viên nào trong hệ thống.' : 'No student accounts exist yet.')}
            </p>
            <div style={{ marginTop: '18px' }}>
              <button onClick={() => navigate('/admin/students/create')} className="btn btn-primary btn-sm">
                <UserPlus size={14} style={{ marginRight: '6px' }} />
                <span>{t('students.addStudent')}</span>
              </button>
            </div>
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>{t('students.colId')}</th>
                <th>{t('students.colName')}</th>
                <th>Email</th>
                <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTIONS'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(st => (
                <tr 
                  key={st.id} 
                  className="adm-table-row-clickable"
                  onClick={() => navigate(`/admin/students/${st.id}`)}
                >
                  <td className="font-mono font-semibold text-primary">{st.code}</td>
                  <td>
                    <div className="font-semibold text-on-surface">{st.name}</div>
                  </td>
                  <td className="font-mono text-on-surface-variant">{st.email}</td>
                  <td>
                    <span className={`badge ${st.status === 'ACTIVE' ? 'badge-active' : 'badge-onleave'}`}>
                      {st.status === 'ACTIVE' ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Blocked')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-sm"
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
                        {st.status === 'ACTIVE' ? (isVi ? 'Khóa' : 'Lock') : (isVi ? 'Mở' : 'Unlock')}
                      </button>
                      <button 
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/students/${st.id}`);
                        }}
                      >
                        {isVi ? 'Chi tiết' : 'Profile'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Students;
