import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mail, Award, BookOpen, 
  Ban, Loader2, ArrowLeft, UserX, Pencil
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../components/common/ToastContext';
import { AdminUserProfileDrawer } from '../components/admin/AdminUserProfileDrawer';
import { Button, ConfirmModal, EmptyState } from '../components/common';
import { userService, type UserProfile } from '../api/services/user.service';
import { classService } from '../api/services/class.service';

interface ActiveClass {
  id: number;
  code: string;
  name: string;
  students: number;
  maxStudents: number;
  schedule: string;
  status: 'active' | 'completed';
}

type TeacherProfileState =
  | { state: 'loading' }
  | { state: 'ready'; user: UserProfile & { role: 'TEACHER' } }
  | { state: 'error'; message?: string };

export const TeacherDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const parsedId = id && /^\d+$/.test(id) ? Number(id) : 0;
  const teacherId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0;
  return <TeacherDetailsPage key={teacherId} teacherId={teacherId} />;
};

function TeacherDetailsPage({ teacherId }: { teacherId: number }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isVi = language === 'vi';
  const { success: toastSuccess, error: toastError } = useToast();

  const [profile, setProfile] = useState<TeacherProfileState>({ state: 'loading' });
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'gradings' | 'security'>('overview');
  const teacherUser = profile.state === 'ready' ? profile.user : null;
  const [teacherClasses, setTeacherClasses] = useState<ActiveClass[]>([]);

  const [newPassword, setNewPassword] = useState('');
  const isActive = teacherUser?.status === 'ACTIVE';
  const isLocked = teacherUser?.status === 'LOCKED';
  const canChangeStatus = isActive || isLocked;
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (teacherId === 0) return;
    const controller = new AbortController();
    const { signal } = controller;

    const loadProfile = async () => {
      try {
        const user = await userService.getAdminUserDetail(teacherId, { signal });
        if (signal.aborted) return;
        if (!user || user.id !== teacherId || user.role !== 'TEACHER') {
          setProfile({ state: 'error' });
          return;
        }
        setProfile({ state: 'ready', user: { ...user, role: user.role } });
      } catch (error: unknown) {
        if (!signal.aborted) {
          setProfile({ state: 'error', message: error instanceof Error ? error.message : undefined });
        }
      }
    };

    void loadProfile();
    return () => controller.abort();
  }, [teacherId, profileAttempt]);

  useEffect(() => {
    if (teacherId === 0) return;
    const controller = new AbortController();
    const { signal } = controller;

    const loadClasses = async () => {
      try {
        const { data } = await classService.list({ page: 1, limit: 100 }, { signal });
        if (signal.aborted) return;
        const teacherAssigned = data.filter(c => c.teacherId === teacherId);

        const mappedClasses: ActiveClass[] = await Promise.all(
          teacherAssigned.map(async (c) => {
            let membersCount = 0;
            let schedule = '';
            try {
              const det = await classService.getDetail(c.id, { signal });
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

        if (!signal.aborted) setTeacherClasses(mappedClasses);
      } catch {
        if (!signal.aborted) setTeacherClasses([]);
      }
    };

    void loadClasses();
    return () => controller.abort();
  }, [teacherId, isVi]);

  const retryProfile = () => {
    setProfile({ state: 'loading' });
    setProfileAttempt(attempt => attempt + 1);
  };

  const handleProfileSaved = () => {
    setHasSavedProfile(true);
    retryProfile();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !teacherUser) return;
    try {
      await userService.updateUser(teacherUser.id, {});
      toastSuccess(isVi ? 'Đổi mật khẩu thành công.' : 'Password updated successfully.');
      setNewPassword('');
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : isVi ? 'Không thể đổi mật khẩu.' : 'Failed to update password.');
    }
  };

  const handleToggleSuspend = async () => {
    if (!teacherUser || !canChangeStatus) return;
    const nextStatus = isLocked ? 'ACTIVE' : 'LOCKED';
    try {
      await userService.updateStatus(teacherUser.id, nextStatus);
      setProfile(current => current.state === 'ready'
        ? { state: 'ready', user: { ...current.user, status: nextStatus } }
        : current);
      const msg = nextStatus === 'LOCKED'
        ? (isVi ? 'Đã tạm khóa tài khoản giảng viên.' : 'Teacher account suspended.')
        : (isVi ? 'Đã mở khóa tài khoản giảng viên.' : 'Teacher account reactivated.');
      toastSuccess(msg);
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : isVi ? 'Không thể đổi trạng thái tài khoản.' : 'Failed to toggle status.');
    }
  };

  const teacherName = teacherUser?.fullName ?? '';
  const teacherCode = teacherUser ? `GV-${String(teacherUser.id).padStart(3, '0')}` : '';
  const teacherInitials = teacherName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();
  const teacherEmail = teacherUser?.email || '—';
  const specialization = teacherUser?.specialization?.trim() || (isVi ? 'Chưa cập nhật' : 'Not specified');
  const statusClass = isActive ? 'badge-active' : isLocked ? 'badge-blocked' : 'badge-neutral';
  const errorMessage = profile.state === 'error' ? profile.message : undefined;
  const errorTitle = hasSavedProfile
    ? (isVi ? 'Đã lưu, chưa tải lại được hồ sơ' : 'Saved, but the profile could not be reloaded')
    : (isVi ? 'Hồ sơ giáo viên không khả dụng' : 'Teacher profile unavailable');
  let errorDescription = errorMessage || (isVi
    ? 'Không thể xác minh hồ sơ giáo viên cho mã này.'
    : 'Teacher identity could not be verified for this ID.');
  if (teacherId === 0) {
    errorDescription = isVi ? 'Mã giáo viên không hợp lệ.' : 'Invalid teacher ID.';
  }

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



      {teacherId !== 0 && profile.state === 'loading' ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tải thông tin giảng viên...' : 'Loading teacher details...'}</div>
        </div>
      ) : teacherUser ? (
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
                  <span className={`badge ${statusClass}`}>
                    {isActive && (isVi ? 'Đang hoạt động' : 'Active')}
                    {isLocked && (isVi ? 'Đã khóa' : 'Locked')}
                    {!canChangeStatus && (
                      <>
                        <span aria-hidden="true">—</span>
                        <span className="sr-only">{isVi ? 'Chưa xác định' : 'Unknown'}</span>
                      </>
                    )}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '13.5px', color: 'var(--on-surface-variant)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} /> {teacherEmail}
                  </span>
                  <span className="flex items-center gap-2 min-w-0">
                    <Award size={15} color="var(--primary)" />
                    <span className="adm-rep-student-sub min-w-0" title={specialization}>{specialization}</span>
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon={<Pencil size={15} />}
                  disabled={showStatusConfirmModal}
                  onClick={() => setIsProfileDrawerOpen(true)}
                >
                  {isVi ? 'Sửa' : 'Edit'}
                </Button>
                {canChangeStatus && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus || isProfileDrawerOpen}
                    className={`btn ${isLocked ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setShowStatusConfirmModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Ban size={15} />
                    <span>{isLocked ? (isVi ? 'Mở khóa tài khoản' : 'Reactivate') : (isVi ? 'Khóa tài khoản' : 'Suspend')}</span>
                  </button>
                )}
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
                  {isVi ? 'Chuyên môn' : 'Specialization'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-container-low)' }}>
                    <div className="break-all font-semibold">{specialization}</div>
                  </div>
                  <dl className="m-0">
                    <dt className="text-on-surface-variant">{isVi ? 'Số điện thoại' : 'Phone'}</dt>
                    <dd className="m-0 font-semibold">{teacherUser.phone || '—'}</dd>
                  </dl>
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
                <div className="overflow-x-auto">
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
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Security */}
          {activeTab === 'security' && (
            <div className="card" style={{ maxWidth: '600px', padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '16px' }}>
                {isVi ? 'Cấp Lại Mật Khẩu' : 'Reset Teacher Password'}
              </h3>

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
          {/* Two-Step Confirmation Modal for Teacher Status Change */}
          <AdminUserProfileDrawer
            profile={teacherUser}
            isOpen={isProfileDrawerOpen}
            onClose={() => setIsProfileDrawerOpen(false)}
            onSaved={handleProfileSaved}
          />

          {showStatusConfirmModal && canChangeStatus && (
            <ConfirmModal
              isOpen={showStatusConfirmModal}
              title={
                !isLocked
                  ? (isVi ? 'Xác nhận khóa tài khoản giảng viên' : 'Suspend Teacher Account')
                  : (isVi ? 'Xác nhận mở khóa tài khoản' : 'Reactivate Teacher Account')
              }
              message={
                !isLocked
                  ? (isVi
                      ? `Bạn có chắc chắn muốn tạm khóa tài khoản giảng viên "${teacherName}" (${teacherCode})? Giảng viên này sẽ không thể đăng nhập hoặc chấm điểm các lớp học phụ trách.`
                      : `Are you sure you want to suspend teacher "${teacherName}" (${teacherCode})? The teacher will not be able to log in or grade assignments.`)
                  : (isVi
                      ? `Khôi phục quyền truy cập cho giảng viên "${teacherName}" (${teacherCode})?`
                      : `Restore system access for teacher "${teacherName}" (${teacherCode})?`)
              }
              confirmText={
                !isLocked
                  ? (isVi ? 'Khóa tài khoản' : 'Suspend Account')
                  : (isVi ? 'Mở khóa' : 'Reactivate')
              }
              cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}
              variant={!isLocked ? 'danger' : 'primary'}
              isLoading={isUpdatingStatus}
              onConfirm={async () => {
                setIsUpdatingStatus(true);
                try {
                  await handleToggleSuspend();
                  setShowStatusConfirmModal(false);
                } finally {
                  setIsUpdatingStatus(false);
                }
              }}
              onCancel={() => setShowStatusConfirmModal(false)}
            />
          )}
        </>
      ) : (
        <div role="alert">
          <EmptyState
            icon={<UserX size={48} />}
            title={errorTitle}
            description={errorDescription}
            action={teacherId !== 0 && (
              <Button variant="secondary" size="sm" onClick={retryProfile}>
                {isVi ? 'Thử lại' : 'Retry'}
              </Button>
            )}
          />
        </div>
      )}
    </div>
  );
}

export default TeacherDetails;
