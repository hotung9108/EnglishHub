import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, 
  Award, ShieldCheck, 
  CheckCircle2, FileText,
  KeyRound, ArrowLeft, Loader2, UserX, Pencil,
  Copy, Check, X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStudentDetails } from '../hooks/useStudentDetails';
import { AdminUserProfileDrawer } from '../components/admin/AdminUserProfileDrawer';
import { Button, EmptyState, ConfirmModal, useToast } from '../components/common';

export const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const parsedId = id && /^\d+$/.test(id) ? Number(id) : 0;
  const studentId = Number.isSafeInteger(parsedId) && parsedId > 0 ? parsedId : 0;
  return <StudentDetailsPage key={studentId} studentId={studentId} />;
};

function StudentDetailsPage({ studentId }: { studentId: number }) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'evaluations' | 'security'>('overview');
  const [showConfirmResetModal, setShowConfirmResetModal] = useState(false);
  const [resetResultPassword, setResetResultPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showStatusConfirmModal, setShowStatusConfirmModal] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [hasSavedProfile, setHasSavedProfile] = useState(false);
  const toast = useToast();

  const {
    studentUser,
    progressData,
    evaluations,
    isLoading,
    isError,
    errorMessage,
    isTogglingStatus,
    isResettingPassword,
    toggleSuspend,
    resetPassword,
    refetch,
  } = useStudentDetails({
    studentId,
    isVi,
  });

  const handleToggleSuspend = async () => {
    const success = await toggleSuspend();
    if (success) {
      toast.success(
        isActive
          ? (isVi ? 'Đã tạm khóa tài khoản học viên.' : 'Student account suspended.')
          : (isVi ? 'Đã kích hoạt lại tài khoản học viên.' : 'Student account reactivated.')
      );
    } else {
      toast.error(isVi ? 'Không thể đổi trạng thái tài khoản.' : 'Failed to toggle status.');
    }
  };

  const handleProfileSaved = () => {
    setHasSavedProfile(true);
    toast.success(isVi ? 'Cập nhật thông tin học viên thành công!' : 'Student profile updated successfully!');
    void refetch();
  };

  const handleConfirmResetPassword = async () => {
    setShowConfirmResetModal(false);
    const newPass = await resetPassword();
    if (newPass) {
      setResetResultPassword(newPass);
      toast.success(isVi ? 'Đặt lại mật khẩu thành công!' : 'Password reset successfully!');
    }
  };

  const handleCopyPassword = async () => {
    if (!resetResultPassword) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(resetResultPassword);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = resetResultPassword;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const studentName = studentUser?.fullName ?? '';
  const studentCode = studentUser ? `HV-${String(studentUser.id).padStart(4, '0')}` : '';
  const studentInitials = studentName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();
  const studentEmail = studentUser?.email || '—';
  const errorTitle = hasSavedProfile
    ? (isVi ? 'Đã lưu, chưa tải lại được hồ sơ' : 'Saved, but the profile could not be reloaded')
    : (isVi ? 'Hồ sơ học viên không khả dụng' : 'Student profile unavailable');
  const isActive = studentUser?.status === 'ACTIVE';
  const isLocked = studentUser?.status === 'LOCKED';
  const canChangeStatus = isActive || isLocked;
  const statusClass = isActive ? 'badge-active' : isLocked ? 'badge-blocked' : 'badge-neutral';
  const statusBadge = (
    <span className={`badge ${statusClass}`}>
      {isActive && (isVi ? 'Hoạt động' : 'Active')}
      {isLocked && (isVi ? 'Đã khóa' : 'Locked')}
      {!canChangeStatus && (
        <>
          <span aria-hidden="true">—</span>
          <span className="sr-only">{isVi ? 'Chưa xác định' : 'Unknown'}</span>
        </>
      )}
    </span>
  );
  const completedTimelineCount = progressData?.scoreTimeline?.length ?? 0;
  const avgSkillScore = progressData?.skillAverages?.length
    ? Math.round(progressData.skillAverages.reduce((acc, s) => acc + s.averageScorePercent, 0) / progressData.skillAverages.length)
    : 0;

  return (
    <div className="adm-container">
      <div style={{ marginBottom: '16px' }}>
        <Button 
          variant="secondary"
          size="sm"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate('/admin/students')}
        >
          {isVi ? 'Quay lại danh sách' : 'Back to Students'}
        </Button>
      </div>



      {isError && !studentUser && !isLoading && (
        <div role="alert">
          <EmptyState
            icon={<UserX size={48} />}
            title={errorTitle}
            description={errorMessage ?? undefined}
            action={studentId !== 0 && (
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                {isVi ? 'Thử lại' : 'Retry'}
              </Button>
            )}
          />
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--eh-text-secondary)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tải thông tin học viên...' : 'Loading student details...'}</div>
        </div>
      ) : studentUser ? (
        <>
          {/* Hero Profile Bento Banner */}
          <div className="card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div 
                className="adm-avatar"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--eh-primary)',
                  color: 'var(--eh-on-primary, #ffffff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  fontWeight: 700,
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                {studentInitials}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--eh-text-primary)', margin: 0 }}>
                    {studentName}
                  </h2>
                  <span className="badge badge-primary font-mono">{studentCode}</span>
                  {statusBadge}
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil size={14} />}
                    disabled={showStatusConfirmModal || showConfirmResetModal || Boolean(resetResultPassword)}
                    onClick={() => setIsProfileDrawerOpen(true)}
                  >
                    {isVi ? 'Sửa' : 'Edit'}
                  </Button>
                  {canChangeStatus && (
                    <button
                      type="button"
                      disabled={isTogglingStatus || isProfileDrawerOpen}
                      className={`btn ${isLocked ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                      onClick={() => setShowStatusConfirmModal(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span>{isActive ? (isVi ? 'Khóa tài khoản' : 'Lock Account') : (isVi ? 'Mở khóa' : 'Unlock')}</span>
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '13.5px', color: 'var(--eh-text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} /> {studentEmail}
                  </span>
                </div>
              </div>

              {/* Progress Summary */}
              {progressData && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg, 12px)',
                  background: 'var(--eh-surface-dim)',
                  border: '1px solid var(--eh-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '220px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--eh-text-secondary)' }}>{isVi ? 'Bài đã hoàn thành:' : 'Completed Tests:'}</span>
                    <span style={{ color: 'var(--eh-primary)', fontWeight: 700 }}>
                      {completedTimelineCount} {isVi ? 'bài' : 'items'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--eh-text-secondary)' }}>
                    <span>{isVi ? 'Điểm TB: ' : 'Avg Score: '}<strong>{avgSkillScore}%</strong></span>
                    <span>{progressData.skillAverages?.length ?? 0} {isVi ? 'kỹ năng' : 'skills'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--eh-border)', marginBottom: '24px', overflowX: 'auto' }}>
            {(
              [
                { key: 'overview', label: t('studentDetails.infoTitle'), icon: User },
                { key: 'progress', label: isVi ? 'Tiến độ học tập' : 'Progress & Scores', icon: Award },
                { key: 'evaluations', label: t('studentDetails.tabEvaluations'), icon: FileText, count: evaluations.length },
                { key: 'security', label: t('studentDetails.tabSecurity'), icon: ShieldCheck },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isTabActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    fontSize: '14px',
                    fontWeight: isTabActive ? 600 : 500,
                    color: isTabActive ? 'var(--eh-primary)' : 'var(--eh-text-secondary)',
                    borderBottom: isTabActive ? '3px solid var(--eh-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={17} />
                  <span>{tab.label}</span>
                  {'count' in tab && tab.count !== undefined && <span className="adm-pill-badge">{tab.count}</span>}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              <div className="card">
                <h3 className="headline-md" style={{ marginBottom: '16px' }}>
                  {isVi ? 'Hồ Sơ CSDL (Student Profile)' : 'Database Student Profile'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--eh-border)' }}>
                    <span style={{ color: 'var(--eh-text-secondary)' }}>{isVi ? 'Mã định danh hệ thống (ID)' : 'System User ID'}</span>
                    <span className="font-semibold">{studentCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--eh-border)' }}>
                    <span style={{ color: 'var(--eh-text-secondary)' }}>Email</span>
                    <span className="font-semibold">{studentEmail}</span>
                  </div>
                  <dl className="adm-form-grid m-0">
                    <div>
                      <dt className="text-muted">{isVi ? 'Số điện thoại' : 'Phone'}</dt>
                      <dd className="m-0 font-semibold">{studentUser.phone || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">{isVi ? 'Ngày sinh' : 'Date of birth'}</dt>
                      <dd className="m-0 font-semibold">{studentUser.dateOfBirth || '—'}</dd>
                    </div>
                  </dl>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--eh-text-secondary)' }}>{isVi ? 'Trạng thái học vụ' : 'Academic Status'}</span>
                    {statusBadge}
                  </div>
                </div>
              </div>

              {progressData && progressData.skillAverages && progressData.skillAverages.length > 0 && (
                <div className="card">
                  <h3 className="headline-md" style={{ marginBottom: '16px' }}>
                    {isVi ? 'Thống Kê Điểm Số 4 Kỹ Năng' : 'Skill Performance'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                    {progressData.skillAverages.map(sk => (
                      <div key={sk.skill} style={{ padding: '14px', borderRadius: 'var(--radius-md, 8px)', background: 'var(--eh-surface-dim)', border: '1px solid var(--eh-border)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--eh-text-secondary)' }}>{sk.skill}</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--eh-primary)', marginTop: '4px' }}>
                          {sk.averageScorePercent}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Progress & Scores */}
          {activeTab === 'progress' && (
            <div className="card card-flush">
              <div className="card-section-header">
                <h3 className="headline-md card-section-header-title">{isVi ? 'Dòng Thời Gian Điểm Số Bài Tập' : 'Score Timeline'}</h3>
              </div>
              {!progressData || !progressData.scoreTimeline || progressData.scoreTimeline.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--eh-text-secondary)' }}>
                  <Award size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có kết quả bài nộp nào cho học viên này' : 'No submission timeline available'}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--eh-text-muted, #736B63)' }}>
                    {isVi ? 'Học viên chưa có dữ liệu bài nộp để tổng hợp đánh giá năng lực.' : 'Student has no submission data to aggregate performance evaluation.'}
                  </div>
                </div>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{isVi ? 'MÃ BÀI' : 'ID'}</th>
                        <th>{isVi ? 'TIÊU ĐỀ BÀI TẬP' : 'ASSIGNMENT'}</th>
                        <th>{isVi ? 'NGÀY NỘP' : 'SUBMITTED AT'}</th>
                        <th>{isVi ? 'ĐIỂM ĐẠT' : 'SCORE'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progressData.scoreTimeline.map((item) => (
                        <tr key={item.assignmentId}>
                          <td className="font-mono font-semibold text-primary">#{item.assignmentId}</td>
                          <td className="font-medium">{item.title}</td>
                          <td className="font-mono text-muted">{item.submittedAt}</td>
                          <td className="font-bold text-primary">{item.scorePercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Evaluations */}
          {activeTab === 'evaluations' && (
            <div>
              {evaluations.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--eh-text-secondary)' }}>
                  <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có nhận xét hoặc đánh giá học tập nào' : 'No evaluations recorded'}
                  </div>
                  <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--eh-text-muted, #736B63)' }}>
                    {isVi ? 'Học viên chưa có dữ liệu bài nộp để tổng hợp đánh giá năng lực.' : 'Student has no submission data to aggregate performance evaluation.'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {evaluations.map((ev) => (
                    <div key={ev.id} className="card" style={{ borderLeft: '4px solid var(--eh-primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '15px' }}>{ev.teacherName || (isVi ? 'Giảng viên phụ trách' : 'Instructor')}</strong>
                          <span className="badge" style={{ backgroundColor: 'var(--eh-surface-dim)', fontSize: '12px' }}>#{ev.id}</span>
                        </div>
                        <span className="label-md text-muted">{ev.createdAt || '—'}</span>
                      </div>
                      <p className="body-md" style={{ color: 'var(--eh-text-primary)', marginBottom: '8px', lineHeight: 1.6 }}>
                        "{ev.content}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Security */}
          {activeTab === 'security' && (
            <div className="card" style={{ maxWidth: '640px' }}>
              <h3 className="headline-md" style={{ marginBottom: '16px' }}>
                {t('studentDetails.tabSecurity')}
              </h3>
              <p className="body-md text-muted" style={{ marginBottom: '20px' }}>
                {isVi 
                  ? 'Quản trị viên có toàn quyền cấp lại mật khẩu mới hoặc khóa phiên đăng nhập đối với tài khoản học viên này.' 
                  : 'Administrators have full privilege to force-reset credentials or revoke active tokens for this student.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Button 
                  variant="primary"
                  icon={<KeyRound size={16} />}
                  onClick={() => setShowConfirmResetModal(true)}
                  disabled={isResettingPassword}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{isVi ? 'Đang xử lý...' : 'Resetting...'}</span>
                    </>
                  ) : (
                    t('studentDetails.btnResetPassword')
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Confirm Reset Password Modal */}
          {showConfirmResetModal && (
            <ConfirmModal
              isOpen={showConfirmResetModal}
              title={isVi ? 'Xác nhận đặt lại mật khẩu' : 'Confirm Password Reset'}
              message={
                isVi
                  ? `Bạn có chắc chắn muốn đặt lại mật khẩu cho học viên "${studentName}" (${studentCode})? Một mật khẩu ngẫu nhiên mới sẽ được hệ thống tạo tự động và hiển thị để bạn sao chép gửi cho học viên.`
                  : `Are you sure you want to reset password for "${studentName}" (${studentCode})? A new random password will be generated and displayed for you to copy and send to the student.`
              }
              confirmText={isVi ? 'Xác nhận đặt lại' : 'Reset Password'}
              cancelText={isVi ? 'Hủy' : 'Cancel'}
              variant="primary"
              onConfirm={handleConfirmResetPassword}
              onCancel={() => setShowConfirmResetModal(false)}
            />
          )}

          {/* Modal hiển thị mật khẩu ngẫu nhiên tạm thời vừa sinh ra */}
          {resetResultPassword && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px',
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="student-reset-password-success-title"
            >
              <div
                className="card"
                style={{
                  width: '100%',
                  maxWidth: '440px',
                  padding: '24px',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  background: 'var(--surface, #FFFFFF)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
                      <CheckCircle2 size={18} />
                    </div>
                    <h3 id="student-reset-password-success-title" style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--text-primary, #171412)' }}>
                      {isVi ? 'Đặt lại mật khẩu thành công' : 'Password Reset Successful'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetResultPassword(null);
                      setCopied(false);
                    }}
                    className="btn-ghost"
                    style={{ padding: '4px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--text-secondary, #736B63)' }}
                    aria-label={isVi ? 'Đóng' : 'Close'}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, #736B63)', lineHeight: 1.5 }}>
                    {isVi
                      ? 'Vui lòng sao chép mật khẩu mới này và gửi cho học viên. Mật khẩu này chỉ hiển thị một lần duy nhất tại đây.'
                      : 'Please copy this new password and send it to the student. This password will only be displayed once here.'}
                  </p>

                  <div style={{ padding: '12px', background: 'var(--surface-dim, #F5F5F4)', borderRadius: '8px', border: '1px solid var(--border-color, #EAE6DF)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary, #736B63)', marginBottom: '8px', fontWeight: 500 }}>
                      {isVi ? 'Học viên:' : 'Student:'} {studentName} ({studentUser?.email || studentCode})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'var(--surface, #FFFFFF)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color, #EAE6DF)' }}>
                      <code style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 600, color: 'var(--color-primary, #0284C7)', userSelect: 'all', letterSpacing: '0.5px' }}>
                        {resetResultPassword}
                      </code>
                      <Button
                        variant={copied ? 'primary' : 'secondary'}
                        size="sm"
                        icon={copied ? <Check size={14} /> : <Copy size={14} />}
                        onClick={handleCopyPassword}
                        title={copied ? (isVi ? 'Đã sao chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}
                      >
                        {copied ? (isVi ? 'Đã sao chép' : 'Copied') : (isVi ? 'Sao chép' : 'Copy')}
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setResetResultPassword(null);
                      setCopied(false);
                    }}
                  >
                    {isVi ? 'Đã hiểu' : 'Got it'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          <AdminUserProfileDrawer
            profile={studentUser}
            isOpen={isProfileDrawerOpen}
            onClose={() => setIsProfileDrawerOpen(false)}
            onSaved={handleProfileSaved}
          />

          {/* Two-Step Confirmation Modal for Student Status Change */}
          {showStatusConfirmModal && canChangeStatus && (
            <ConfirmModal
              isOpen={showStatusConfirmModal}
              title={
                isActive
                  ? (isVi ? 'Xác nhận khóa tài khoản học viên' : 'Lock Student Account')
                  : (isVi ? 'Xác nhận mở khóa tài khoản' : 'Unlock Student Account')
              }
              message={
                isActive
                  ? (isVi
                      ? `Bạn có chắc chắn muốn khóa tài khoản học viên "${studentName}" (${studentCode})? Học viên này sẽ không thể đăng nhập hoặc làm bài tập.`
                      : `Are you sure you want to lock student account "${studentName}" (${studentCode})? The student will lose access to assignments and classes.`)
                  : (isVi
                      ? `Khôi phục quyền truy cập cho học viên "${studentName}" (${studentCode})?`
                      : `Restore system access for student "${studentName}" (${studentCode})?`)
              }
              confirmText={
                isActive
                  ? (isVi ? 'Khóa tài khoản' : 'Lock Account')
                  : (isVi ? 'Mở khóa' : 'Unlock Account')
              }
              cancelText={isVi ? 'Hủy bỏ' : 'Cancel'}
              variant={isActive ? 'danger' : 'primary'}
              isLoading={isTogglingStatus}
              onConfirm={async () => {
                await handleToggleSuspend();
                setShowStatusConfirmModal(false);
              }}
              onCancel={() => setShowStatusConfirmModal(false)}
            />
          )}
        </>
      ) : null}
    </div>
  );
}

export default StudentDetails;
