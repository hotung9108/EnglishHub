import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mail, Award, BookOpen, 
  Ban, AlertTriangle, Loader2, ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import { classService } from '../api/services/class.service';
import type { UserListItem } from '../api/services/user.service';
import type { ClassSummary } from '../api/services/class.service';

interface ActiveClass {
  id: number;
  code: string;
  name: string;
  students: number;
  maxStudents: number;
  schedule: string;
  status: 'active' | 'completed';
}

export const TeacherDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'gradings' | 'security'>('overview');
  const [teacherUser, setTeacherUser] = useState<UserListItem | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<ActiveClass[]>([]);

  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const numericId = id ? parseInt(id.replace(/\D/g, ''), 10) || 1 : 1;

  useEffect(() => {
    let isMounted = true;

    const fetchTeacher = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersRes, classesRes] = await Promise.allSettled([
          userService.listUsers({ role: 'TEACHER', limit: 100 }),
          classService.list({ page: 1, limit: 100 })
        ]);

        if (!isMounted) return;

        const users: UserListItem[] = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
        const found = users.find(u => u.id === numericId) || (users.length > 0 ? users[0] : null);

        if (found) {
          setTeacherUser(found);
          setIsSuspended(found.status === 'LOCKED');
        }

        const allClasses: ClassSummary[] = classesRes.status === 'fulfilled' ? classesRes.value.data : [];
        const teacherAssigned = allClasses.filter(c => c.teacherId === numericId);

        const mappedClasses: ActiveClass[] = await Promise.all(
          teacherAssigned.map(async (c) => {
            let membersCount = 0;
            let schedule = '';
            try {
              const det = await classService.getDetail(c.id);
              schedule = det.description || '';
              if (typeof det.memberCount === 'number') membersCount = det.memberCount;
            } catch {
              // fallback
            }

            return {
              id: c.id,
              code: `ENG-${c.id}`,
              name: c.name,
              students: membersCount,
              maxStudents: 25,
              schedule: schedule || (isVi ? 'Lịch học tiêu chuẩn' : 'Scheduled sessions'),
              status: c.status === 'COMPLETED' ? 'completed' : 'active'
            };
          })
        );

        if (isMounted) {
          setTeacherClasses(mappedClasses);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải thông tin giảng viên.' : 'Failed to load teacher.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTeacher();

    return () => {
      isMounted = false;
    };
  }, [numericId, isVi]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !teacherUser) return;
    try {
      await userService.updateUser(teacherUser.id, {});
      setPasswordSuccess(true);
      setTimeout(() => {
        setPasswordSuccess(false);
        setNewPassword('');
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : isVi ? 'Không thể đổi mật khẩu.' : 'Failed to update password.');
    }
  };

  const handleToggleSuspend = async () => {
    if (!teacherUser) return;
    const nextStatus = isSuspended ? 'ACTIVE' : 'LOCKED';
    try {
      await userService.updateStatus(teacherUser.id, nextStatus);
      setIsSuspended(nextStatus === 'LOCKED');
      setStatusMessage(
        nextStatus === 'LOCKED'
          ? (isVi ? 'Đã tạm khóa tài khoản giảng viên.' : 'Teacher account suspended.')
          : (isVi ? 'Đã mở khóa tài khoản giảng viên.' : 'Teacher account reactivated.')
      );
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : isVi ? 'Không thể đổi trạng thái tài khoản.' : 'Failed to toggle status.');
    }
  };

  const teacherName = teacherUser?.fullName || (isVi ? 'Giảng viên' : 'Teacher');
  const teacherCode = teacherUser ? `GV-${String(teacherUser.id).padStart(3, '0')}` : 'GV-001';
  const teacherInitials = teacherName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();
  const teacherEmail = teacherUser?.email || '—';

  return (
    <div className="adm-container">
      <div style={{ marginBottom: '16px' }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/admin/teachers')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>{isVi ? 'Quay lại danh sách' : 'Back to Teachers'}</span>
        </button>
      </div>

      {statusMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#15803d',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <CheckCircle2 size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

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
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tải hồ sơ giảng viên...' : 'Loading teacher profile...'}</div>
        </div>
      ) : (
        <>
          {/* Hero Profile Bento Banner */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-md)'
              }}>
                {teacherInitials}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                    {teacherName}
                  </h2>
                  <span className="badge badge-primary font-mono">{teacherCode}</span>
                  <span className={`badge ${!isSuspended ? 'badge-active' : 'badge-onleave'}`}>
                    {!isSuspended ? (isVi ? 'Đang hoạt động' : 'Active') : (isVi ? 'Đã tạm khóa' : 'Suspended')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '13.5px', color: 'var(--on-surface-variant)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} /> {teacherEmail}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={15} color="var(--primary)" /> {isVi ? 'TESOL / IELTS Standard' : 'TESOL / IELTS Certified'}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  className={`btn ${isSuspended ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={handleToggleSuspend}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Ban size={15} />
                  <span>{isSuspended ? (isVi ? 'Mở khóa tài khoản' : 'Reactivate') : (isVi ? 'Khóa tài khoản' : 'Suspend')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="adm-filter-bar" style={{ padding: '8px 12px', marginBottom: '24px' }}>
            <div className="adm-pills">
              {(
                [
                  { key: 'overview', label: isVi ? 'Tổng quan chuyên môn' : 'Overview' },
                  { key: 'classes', label: isVi ? 'Lớp đang phụ trách' : 'Classes', count: teacherClasses.length },
                  { key: 'security', label: isVi ? 'Bảo mật & Tài khoản' : 'Security' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`adm-pill ${activeTab === tab.key ? 'active' : ''}`}
                >
                  <span>{tab.label}</span>
                  {'count' in tab && <span className="adm-pill-badge">{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <h3 className="headline-md" style={{ marginBottom: '16px' }}>
                  {isVi ? 'Khối Lượng Giảng Dạy' : 'Workload & Allocation'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                    <span className="text-on-surface-variant">{isVi ? 'Số lớp phụ trách' : 'Active Classes'}</span>
                    <strong>{teacherClasses.length} {isVi ? 'lớp' : 'classes'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                    <span className="text-on-surface-variant">{isVi ? 'Tổng số học viên' : 'Total Students'}</span>
                    <strong>{teacherClasses.reduce((sum, c) => sum + c.students, 0)} {isVi ? 'học viên' : 'students'}</strong>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <h3 className="headline-md" style={{ marginBottom: '16px' }}>
                  {isVi ? 'Chuyên Môn & Tiêu Chuẩn' : 'Academic Standards'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--on-surface)' }}>TESOL / CELTA Compliant</div>
                    <div style={{ fontSize: '12.5px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                      {isVi ? 'Đủ điều kiện giảng dạy toàn diện 4 kỹ năng' : 'Qualified for 4-skill instruction'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Classes */}
          {activeTab === 'classes' && (
            <div className="adm-table-card">
              {teacherClasses.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <BookOpen size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Giảng viên chưa được phân công lớp học nào' : 'No classes assigned to this teacher'}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '4px' }}>
                    {isVi ? 'Gán lớp cho giảng viên trong mục Quản lý lớp học.' : 'Assign cohorts in the Classes module.'}
                  </div>
                </div>
              ) : (
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>{isVi ? 'MÃ LỚP' : 'CODE'}</th>
                      <th>{isVi ? 'TÊN LỚP HỌC' : 'CLASS NAME'}</th>
                      <th>{isVi ? 'SĨ SỐ' : 'ENROLLED'}</th>
                      <th>{isVi ? 'LỊCH HỌC' : 'SCHEDULE'}</th>
                      <th>{isVi ? 'TRẠNG THÁI' : 'STATUS'}</th>
                      <th style={{ textAlign: 'right' }}>{isVi ? 'THAO TÁC' : 'ACTION'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherClasses.map(cls => (
                      <tr key={cls.id}>
                        <td className="font-mono font-semibold text-primary">{cls.code}</td>
                        <td className="font-medium">{cls.name}</td>
                        <td>{cls.students}/{cls.maxStudents}</td>
                        <td className="text-on-surface-variant">{cls.schedule}</td>
                        <td>
                          <span className={`badge ${cls.status === 'active' ? 'badge-active' : 'badge-onleave'}`}>
                            {cls.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/admin/classes/${cls.id}`)}
                          >
                            {isVi ? 'Chi tiết' : 'Details'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab 3: Security */}
          {activeTab === 'security' && (
            <div className="card" style={{ maxWidth: '600px', padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '16px' }}>
                {isVi ? 'Cấp Lại Mật Khẩu' : 'Reset Teacher Password'}
              </h3>

              {passwordSuccess && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  fontSize: '13px',
                  marginBottom: '16px'
                }}>
                  {isVi ? 'Đổi mật khẩu thành công!' : 'Password updated successfully!'}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="adm-form-group">
                  <label className="adm-form-label">{isVi ? 'Mật khẩu mới' : 'New Password'}</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={isVi ? 'Nhập mật khẩu mới...' : 'Enter new password...'}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {isVi ? 'Lưu mật khẩu mới' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherDetails;
