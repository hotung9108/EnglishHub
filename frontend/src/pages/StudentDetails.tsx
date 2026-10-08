import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, 
  Award, ShieldCheck, 
  CheckCircle2, FileText,
  KeyRound, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import { reportService } from '../api/services/report.service';
import { studentEvaluationService } from '../api/services/student-evaluation.service';
import type { UserListItem } from '../api/services/user.service';
import type { ReportStudentProgressResponse } from '../types/report.types';
import type { StudentEvaluationListItem } from '../types/student-evaluation.types';

export const StudentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'evaluations' | 'security'>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentUser, setStudentUser] = useState<UserListItem | null>(null);
  const [progressData, setProgressData] = useState<ReportStudentProgressResponse | null>(null);
  const [evaluations, setEvaluations] = useState<StudentEvaluationListItem[]>([]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const numericId = id ? parseInt(id.replace(/\D/g, ''), 10) || 1 : 1;

  useEffect(() => {
    let isMounted = true;

    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [usersRes, progressRes, evalRes] = await Promise.allSettled([
          userService.listUsers({ role: 'STUDENT', limit: 100 }),
          reportService.getStudentProgress(numericId),
          studentEvaluationService.list(numericId)
        ]);

        if (!isMounted) return;

        const users: UserListItem[] = usersRes.status === 'fulfilled' ? usersRes.value.data : [];
        const found = users.find(u => u.id === numericId) || (users.length > 0 ? users[0] : null);
        if (found) {
          setStudentUser(found);
        }

        if (progressRes.status === 'fulfilled') {
          setProgressData(progressRes.value);
        }

        if (evalRes.status === 'fulfilled') {
          setEvaluations(evalRes.value.data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : isVi ? 'Không thể tải hồ sơ học viên.' : 'Failed to load student details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStudentData();

    return () => {
      isMounted = false;
    };
  }, [numericId, isVi]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !studentUser) return;
    try {
      await userService.updateUser(studentUser.id, {});
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
        setNewPassword('');
      }, 1500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : isVi ? 'Không thể đổi mật khẩu.' : 'Failed to reset password.');
    }
  };

  const studentName = studentUser?.fullName || (isVi ? 'Học viên' : 'Student');
  const studentCode = studentUser ? `HV-${String(studentUser.id).padStart(4, '0')}` : `HV-${numericId}`;
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
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/admin/students')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>{isVi ? 'Quay lại danh sách' : 'Back to Students'}</span>
        </button>
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

      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>{isVi ? 'Đang tải hồ sơ học viên...' : 'Loading student profile...'}</div>
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
                backgroundColor: '#059669',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 700,
                boxShadow: 'var(--shadow-md)'
              }}>
                {studentInitials}
              </div>

              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--on-surface)', margin: 0 }}>
                    {studentName}
                  </h2>
                  <span className="badge badge-primary font-mono">{studentCode}</span>
                  <span className={`badge ${isActive ? 'badge-active' : 'badge-onleave'}`}>
                    {isActive ? (isVi ? 'Đang học' : 'Active') : (isVi ? 'Tạm khóa' : 'Locked')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '13.5px', color: 'var(--on-surface-variant)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={15} /> {studentEmail}
                  </span>
                </div>
              </div>

              {/* Progress Summary */}
              {progressData && (
                <div style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-lg, 12px)',
                  background: 'var(--surface-container-high)',
                  border: '1px solid var(--outline-variant)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  minWidth: '220px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span className="text-on-surface-variant">{isVi ? 'Bài đã hoàn thành:' : 'Completed Tests:'}</span>
                    <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
                      {completedTimelineCount} {isVi ? 'bài' : 'items'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                    <span>{isVi ? 'Điểm TB: ' : 'Avg Score: '}<strong>{avgSkillScore}%</strong></span>
                    <span>{progressData.skillAverages?.length ?? 0} {isVi ? 'kỹ năng' : 'skills'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--outline-variant)', marginBottom: '24px', overflowX: 'auto' }}>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    fontSize: '14px',
                    fontWeight: isTabActive ? 600 : 500,
                    color: isTabActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                    borderBottom: isTabActive ? '3px solid var(--primary)' : '3px solid transparent',
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
                <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="var(--primary)" />
                  {isVi ? 'Hồ Sơ CSDL (Student Profile)' : 'Database Student Profile'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                    <span className="text-on-surface-variant">{isVi ? 'Mã định danh hệ thống (ID)' : 'System User ID'}</span>
                    <span className="font-semibold">{studentCode}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--outline-variant)' }}>
                    <span className="text-on-surface-variant">Email</span>
                    <span className="font-semibold">{studentEmail}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-on-surface-variant">{isVi ? 'Trạng thái học vụ' : 'Academic Status'}</span>
                    <span className={`badge ${isActive ? 'badge-active' : 'badge-onleave'}`}>
                      {isActive ? (isVi ? 'Bình thường' : 'Good Standing') : (isVi ? 'Tạm khóa' : 'Locked')}
                    </span>
                  </div>
                </div>
              </div>

              {progressData && progressData.skillAverages && progressData.skillAverages.length > 0 && (
                <div className="card">
                  <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="var(--secondary)" />
                    {isVi ? 'Thống Kê Điểm Số 4 Kỹ Năng' : 'Skill Performance'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '14px' }}>
                    {progressData.skillAverages.map(sk => (
                      <div key={sk.skill} style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)', border: '1px solid var(--outline-variant)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>{sk.skill}</div>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
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
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
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
                          <td className="text-on-surface-variant font-mono">{item.submittedAt}</td>
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
                <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                  <FileText size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '15px', fontWeight: 600 }}>
                    {isVi ? 'Chưa có nhận xét hoặc đánh giá học tập nào' : 'No evaluations recorded'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {evaluations.map((ev) => (
                    <div key={ev.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '15px' }}>{ev.teacherName || (isVi ? 'Giảng viên phụ trách' : 'Instructor')}</strong>
                          <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', fontSize: '12px' }}>#{ev.id}</span>
                        </div>
                        <span className="label-md text-on-surface-variant">{ev.createdAt || '—'}</span>
                      </div>
                      <p className="body-md" style={{ color: 'var(--on-surface)', marginBottom: '8px', lineHeight: 1.6 }}>
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
              <h3 className="headline-md" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                {t('studentDetails.tabSecurity')}
              </h3>
              <p className="body-md text-on-surface-variant" style={{ marginBottom: '20px' }}>
                {isVi 
                  ? 'Quản trị viên có toàn quyền cấp lại mật khẩu mới hoặc khóa phiên đăng nhập đối với tài khoản học viên này.' 
                  : 'Administrators have full privilege to force-reset credentials or revoke active tokens for this student.'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowPasswordModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <KeyRound size={16} />
                  <span>{t('studentDetails.btnResetPassword')}</span>
                </button>
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
                <p className="body-sm text-on-surface-variant" style={{ marginBottom: '16px' }}>
                  {isVi ? `Đặt lại mật khẩu cho học viên ${studentName} (${studentCode})` : `Set new password for ${studentName}`}
                </p>
                {passwordSuccess ? (
                  <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', fontWeight: 600, textAlign: 'center' }}>
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
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={() => setShowPasswordModal(false)}
                      >
                        {isVi ? 'Hủy' : 'Cancel'}
                      </button>
                      <button type="submit" className="btn btn-primary">
                        {isVi ? 'Xác nhận' : 'Confirm'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDetails;
