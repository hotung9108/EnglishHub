import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, Mail, 
  Award, ShieldCheck, 
  CheckCircle2, FileText,
  KeyRound, ArrowLeft, Loader2, UserX
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStudentDetails, type StudentIdentityHint } from '../hooks/useStudentDetails';
import { Button, EmptyState } from '../components/common';

export const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const routeState = (location.state as StudentIdentityHint) || null;
  const numericId = id ? parseInt(id.replace(/\D/g, ''), 10) || 0 : 0;

  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'evaluations' | 'security'>('overview');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const {
    studentUser,
    progressData,
    evaluations,
    isLoading,
    isError,
    errorMessage,
    statusMessage,
    isTogglingStatus,
    toggleSuspend,
    resetPassword,
  } = useStudentDetails({
    studentId: numericId,
    initialHint: routeState,
    isVi,
  });

  const handleToggleSuspend = async () => {
    await toggleSuspend();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    const ok = await resetPassword(newPassword);
    if (ok) {
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setNewPassword('');
      }, 1500);
    }
  };

  const studentName = studentUser?.fullName || (isVi ? 'Học viên' : 'Student');
  const studentCode = studentUser?.id ? `HV-${String(studentUser.id).padStart(4, '0')}` : `HV-${numericId}`;
  const studentInitials = studentName.trim().split(/\s+/).map(n => n[0]).slice(-2).join('').toUpperCase();
  const studentEmail = studentUser?.email || '—';
  const isActive = studentUser?.status === 'ACTIVE';
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

      {statusMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md, 8px)',
          backgroundColor: 'var(--secondary-container, #e7f3ec)',
          border: '1px solid var(--border-color, #e6dfd5)',
          color: 'var(--on-secondary-container, #17523f)',
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

      {isError && !studentUser && !isLoading && (
        <EmptyState
          icon={<UserX size={48} />}
          title={isVi ? 'Không tìm thấy học viên' : 'Student Not Found'}
          description={errorMessage || (isVi ? 'Không tìm thấy thông tin học viên cho mã định danh này.' : 'Student identity could not be verified.')}
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate('/admin/students')}>
              {isVi ? 'Quay lại danh sách' : 'Back to Students'}
            </Button>
          }
        />
      )}

      {isLoading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-secondary, #736b63)' }}>
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
                  backgroundColor: 'var(--primary, #1b4d3e)',
                  color: '#ffffff',
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
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary, #262320)', margin: 0 }}>
                    {studentName}
                  </h2>
                  <span className="badge badge-primary font-mono">{studentCode}</span>
                  <span className={`badge ${isActive ? 'badge-active' : 'badge-blocked'}`}>
                    {isActive ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Locked')}
                  </span>
                  <button 
                    type="button"
                    disabled={isTogglingStatus}
                    className={`btn ${!isActive ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={handleToggleSuspend}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{isActive ? (isVi ? 'Khóa tài khoản' : 'Lock Account') : (isVi ? 'Mở khóa' : 'Unlock')}</span>
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '13.5px', color: 'var(--text-secondary, #736b63)' }}>
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
                  background: 'var(--surface-dim, #f4efe6)',
                  border: '1px solid var(--border-color, #e6dfd5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '220px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-secondary, #736b63)' }}>{isVi ? 'Bài đã hoàn thành:' : 'Completed Tests:'}</span>
                    <span style={{ color: 'var(--primary, #1b4d3e)', fontWeight: 700 }}>
                      {completedTimelineCount} {isVi ? 'bài' : 'items'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary, #736b63)' }}>
                    <span>{isVi ? 'Điểm TB: ' : 'Avg Score: '}<strong>{avgSkillScore}%</strong></span>
                    <span>{progressData.skillAverages?.length ?? 0} {isVi ? 'kỹ năng' : 'skills'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color, #e6dfd5)', marginBottom: '24px', overflowX: 'auto' }}>
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
                    color: isTabActive ? 'var(--primary, #1b4d3e)' : 'var(--text-secondary, #736b63)',
                    borderBottom: isTabActive ? '3px solid var(--primary, #1b4d3e)' : '3px solid transparent',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color, #e6dfd5)' }}>
                    <span style={{ color: 'var(--text-secondary, #736b63)' }}>{isVi ? 'Mã định danh hệ thống (ID)' : 'System User ID'}</span>
                    <span className="font-semibold">{studentCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color, #e6dfd5)' }}>
                    <span style={{ color: 'var(--text-secondary, #736b63)' }}>Email</span>
                    <span className="font-semibold">{studentEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary, #736b63)' }}>{isVi ? 'Trạng thái học vụ' : 'Academic Status'}</span>
                    <span className={`badge ${isActive ? 'badge-active' : 'badge-blocked'}`}>
                      {isActive ? (isVi ? 'Hoạt động' : 'Active') : (isVi ? 'Bị khóa' : 'Locked')}
                    </span>
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
                      <div key={sk.skill} style={{ padding: '14px', borderRadius: 'var(--radius-md, 8px)', background: 'var(--surface-dim, #f4efe6)', border: '1px solid var(--border-color, #e6dfd5)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #736b63)' }}>{sk.skill}</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary, #1b4d3e)', marginTop: '4px' }}>
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
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary, #736b63)' }}>
                  <Award size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có kết quả bài nộp nào cho học viên này' : 'No submission timeline available'}
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
                <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary, #736b63)' }}>
                  <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có nhận xét hoặc đánh giá học tập nào' : 'No evaluations recorded'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {evaluations.map((ev) => (
                    <div key={ev.id} className="card" style={{ borderLeft: '4px solid var(--primary, #1b4d3e)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '15px' }}>{ev.teacherName || (isVi ? 'Giảng viên phụ trách' : 'Instructor')}</strong>
                          <span className="badge" style={{ backgroundColor: 'var(--surface-dim, #f4efe6)', fontSize: '12px' }}>#{ev.id}</span>
                        </div>
                        <span className="label-md text-muted">{ev.createdAt || '—'}</span>
                      </div>
                      <p className="body-md" style={{ color: 'var(--text-primary, #262320)', marginBottom: '8px', lineHeight: 1.6 }}>
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
                  onClick={() => setShowPasswordModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  {t('studentDetails.btnResetPassword')}
                </Button>
              </div>
            </div>
          )}

          {/* Reset Password Modal */}
          {showPasswordModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '24px' }}>
                <h3 className="headline-md" style={{ marginBottom: '8px' }}>{t('studentDetails.btnResetPassword')}</h3>
                <p className="body-sm text-muted" style={{ marginBottom: '16px' }}>
                  {isVi ? `Đặt lại mật khẩu cho học viên ${studentName} (${studentCode})` : `Set new password for ${studentName}`}
                </p>
                {passwordSuccess ? (
                  <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--secondary-container, #e7f3ec)', color: 'var(--on-secondary-container, #17523f)', fontWeight: 600, textAlign: 'center' }}>
                    <CheckCircle2 size={24} style={{ margin: '0 auto 8px' }} />
                    {isVi ? 'Đổi mật khẩu thành công!' : 'Password reset successfully!'}
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword}>
                    <div style={{ marginBottom: '16px' }}>
                      <label className="label-md" style={{ display: 'block', marginBottom: '6px' }}>
                        {isVi ? 'Mật khẩu mới' : 'New Password'}
                      </label>
                      <input
                        type="password"
                        className="input"
                        placeholder={isVi ? 'Tối thiểu 6 ký tự...' : 'Min 6 characters...'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => setShowPasswordModal(false)}
                      >
                        {isVi ? 'Hủy' : 'Cancel'}
                      </Button>
                      <Button type="submit" variant="primary">
                        {isVi ? 'Xác nhận' : 'Confirm'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default StudentDetails;
