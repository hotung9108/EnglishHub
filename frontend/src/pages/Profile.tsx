import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  User, Shield, Laptop, 
  Check, Eye, EyeOff, 
  CheckCircle2, Copy, AlertCircle, Loader2,
  Calendar, Phone, BookOpen, Building
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../api/services/user.service';
import type { UserProfile } from '../api/services/user.service';
import { validateFullName } from '../utils/nameValidation';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as 'general' | 'security' | 'sessions' | null;
  const activeTab = tabParam && ['general', 'security', 'sessions'].includes(tabParam) 
    ? tabParam 
    : 'general';

  const setActiveTab = (tab: 'general' | 'security' | 'sessions') => {
    setSearchParams({ tab });
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [nameError, setNameError] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [userCode, setUserCode] = useState('');
  const [currentRole, setCurrentRole] = useState<'admin' | 'teacher' | 'student'>('student');

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data: UserProfile = await userService.getMyProfile();
        if (!isMounted) return;

        const role = data.role.toLowerCase() as 'admin' | 'teacher' | 'student';
        setCurrentRole(role);
        setFullName(data.fullName || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAvatarUrl(data.avatarUrl || '');
        setSpecialization(data.specialization || '');
        setDateOfBirth(data.dateOfBirth || '');
        setParentPhone(data.parentPhone || '');

        const computedCode = data.studentCode || (
          role === 'teacher' ? `GV-${String(data.id).padStart(3, '0')}` :
          role === 'admin' ? `AD-${String(data.id).padStart(3, '0')}` :
          `HV-${String(data.id).padStart(3, '0')}`
        );
        setUserCode(computedCode);
      } catch {
        if (!isMounted) return;
        // Fallback to local AuthContext user if API call encounters error
        if (user) {
          setCurrentRole(user.role);
          setFullName(user.fullName || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
          setAvatarUrl(user.avatar || '');
          setSpecialization(user.specialization || '');
          const fallbackCode = user.code || (user.id ? (
            user.role === 'teacher' ? `GV-${String(user.id).padStart(3, '0')}` :
            user.role === 'admin' ? `AD-${String(user.id).padStart(3, '0')}` :
            `HV-${String(user.id).padStart(3, '0')}`
          ) : '');
          setUserCode(fallbackCode);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleCopyId = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const valResult = validateFullName(fullName, isVi);
    if (!valResult.isValid) {
      setNameError(valResult.errorMessage || '');
      setErrorMessage(valResult.errorMessage || '');
      return;
    }

    setSaving(true);
    setNameError('');
    try {
      const cleanName = valResult.normalized;
      await userService.updateMyProfile({
        fullName: cleanName,
        phone,
        avatarUrl,
      });

      updateUser({
        fullName: cleanName,
        phone,
        avatar: avatarUrl,
      });

      setFullName(cleanName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVi ? 'Không thể lưu hồ sơ' : 'Failed to update profile');
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(isVi ? 'Mật khẩu mới phải có tối thiểu 8 ký tự.' : 'Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isVi ? 'Mật khẩu xác nhận không khớp!' : 'Passwords do not match!');
      return;
    }

    setChangingPassword(true);
    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
      });

      setSaveSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVi ? 'Mật khẩu hiện tại không chính xác' : 'Current password is incorrect');
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSelectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
  };

  const handleLogoutCurrentSession = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const cleanName = name.replace(/\(.*?\)/g, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Detect current client device info
  const getDeviceName = () => {
    const ua = navigator.userAgent;
    let browser = 'Web Browser';
    if (ua.includes('Chrome')) browser = 'Google Chrome';
    else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';

    let os = 'Desktop';
    if (ua.includes('Windows')) os = 'Windows 11 / 10';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('iPhone')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';

    return `${browser} • ${os} (${isVi ? 'Thiết bị này' : 'This device'})`;
  };

  const getRoleBadge = () => {
    if (currentRole === 'admin') {
      return {
        label: isVi ? 'QUẢN TRỊ VIÊN HỆ THỐNG' : 'SYSTEM ADMINISTRATOR',
        bg: '#0f172a',
      };
    }
    if (currentRole === 'teacher') {
      return {
        label: isVi ? 'GIÁO VIÊN TIẾNG ANH' : 'ENGLISH INSTRUCTOR',
        bg: '#059669',
      };
    }
    return {
      label: isVi ? 'HỌC VIÊN CHÍNH THỨC' : 'STUDENT MEMBER',
      bg: '#2563eb',
    };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="adm-container">
      {/* Header */}
      <div className="adm-header">
        <div className="adm-title-group">
          <h1 className="adm-title">
            <User size={28} color="var(--primary)" />
            {t('profile.title')}
          </h1>
          <p className="adm-subtitle">
            {isVi 
              ? 'Quản lý thông tin tài khoản cá nhân, thông tin xác thực bảo mật và thiết bị đăng nhập.' 
              : 'Manage personal identity, security credentials, and active device sessions.'}
          </p>
        </div>
      </div>

      {saveSuccess && (
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
          <span>{isVi ? 'Đã cập nhật thông tin thành công!' : 'Profile updated successfully!'}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#b91c1c',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="adm-filter-bar" style={{ padding: '8px 12px', marginBottom: '24px' }}>
        <div className="adm-pills">
          {(
            [
              { key: 'general', label: isVi ? 'Thông tin cá nhân' : 'General Profile', icon: User },
              { key: 'security', label: isVi ? 'Bảo mật & Mật khẩu' : 'Security & Password', icon: Shield },
              { key: 'sessions', label: isVi ? 'Phiên & Thiết bị' : 'Active Sessions', icon: Laptop },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`adm-pill ${isActive ? 'active' : ''}`}
                style={{ padding: '8px 16px', fontSize: '13.5px' }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', gap: '10px' }}>
          <Loader2 size={24} className="animate-spin" color="var(--primary)" />
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
            {isVi ? 'Đang tải thông tin hồ sơ...' : 'Loading profile data...'}
          </span>
        </div>
      ) : (
        <>
          {/* Tab 1: General Info */}
          {activeTab === 'general' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Avatar & Summary Card */}
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <div style={{
                  width: '108px',
                  height: '108px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 700,
                  marginBottom: '16px',
                  boxShadow: 'var(--shadow-md)',
                  border: '4px solid var(--surface-container-low)',
                  overflow: 'hidden'
                }}>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={fullName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    getInitials(fullName)
                  )}
                </div>

                <h3 style={{ fontSize: '19px', fontWeight: 700, margin: '0 0 6px 0' }}>{fullName || user?.fullName || 'User'}</h3>
                <span className="badge" style={{ backgroundColor: roleBadge.bg, color: 'white', marginBottom: '16px', fontSize: '12px', padding: '4px 10px' }}>
                  {roleBadge.label}
                </span>

                {/* Preset Avatar Selection */}
                <div style={{ width: '100%', marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginBottom: '8px', fontWeight: 600 }}>
                    {isVi ? 'Chọn ảnh đại diện mẫu' : 'Choose Preset Avatar'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(url)}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          border: avatarUrl === url ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                          padding: 0,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          background: 'none'
                        }}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '240px' }}>
                  {avatarUrl && (
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setAvatarUrl('')}
                      style={{ flex: 1, color: 'var(--error)' }}
                    >
                      {t('profile.btnDeleteAvatar')}
                    </button>
                  )}
                </div>
              </div>

              {/* Form Card */}
              <div className="card" style={{ padding: '24px' }}>
                <form onSubmit={handleSaveGeneral}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div className="adm-form-grid">
                      <div className="adm-form-group">
                        <label className="adm-form-label">{t('profile.fullName')} *</label>
                        <input 
                          type="text" 
                          className="input" 
                          value={fullName}
                          onChange={(e) => {
                            setFullName(e.target.value);
                            if (nameError) setNameError('');
                          }}
                          onBlur={() => {
                            const res = validateFullName(fullName, isVi);
                            if (!res.isValid) {
                              setNameError(res.errorMessage || '');
                            } else {
                              setNameError('');
                            }
                          }}
                          style={nameError ? { borderColor: 'var(--error, #ef4444)' } : undefined}
                          required 
                        />
                        {nameError ? (
                          <span style={{ color: 'var(--error, #ef4444)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            {nameError}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--on-surface-variant, #64748b)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            {t('profile.fullNameHint')}
                          </span>
                        )}
                      </div>

                      <div className="adm-form-group">
                        <label className="adm-form-label">{t('profile.userId')}</label>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            className="input" 
                            value={userCode} 
                            readOnly 
                            style={{ backgroundColor: 'var(--surface-container-low)', paddingRight: '40px', fontFamily: 'monospace' }} 
                          />
                          <button 
                            type="button" 
                            onClick={handleCopyId}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                            title={isVi ? 'Sao chép mã' : 'Copy ID'}
                          >
                            {copiedId ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="adm-form-grid">
                      <div className="adm-form-group">
                        <label className="adm-form-label">{t('profile.email')} *</label>
                        <input 
                          type="email" 
                          className="input" 
                          value={email}
                          readOnly
                          style={{ backgroundColor: 'var(--surface-container-low)' }}
                          title={isVi ? 'Email tài khoản do quản trị viên quản lý' : 'Account email managed by administrator'}
                        />
                      </div>

                      <div className="adm-form-group">
                        <label className="adm-form-label">{t('profile.phone')}</label>
                        <input 
                          type="text" 
                          className="input" 
                          value={phone}
                          placeholder="0987 654 321"
                          onChange={(e) => setPhone(e.target.value)} 
                        />
                      </div>
                    </div>

                    {/* Role-Specific Attributes */}
                    {currentRole === 'teacher' && (
                      <div className="adm-form-group">
                        <label className="adm-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookOpen size={15} color="var(--primary)" />
                          <span>{isVi ? 'Chuyên môn giảng dạy' : 'Specialization'}</span>
                        </label>
                        <input 
                          type="text" 
                          className="input" 
                          value={specialization || (isVi ? 'Chưa cập nhật' : 'Not specified')}
                          readOnly
                          style={{ backgroundColor: 'var(--surface-container-low)' }}
                        />
                      </div>
                    )}

                    {currentRole === 'student' && (
                      <div className="adm-form-grid">
                        <div className="adm-form-group">
                          <label className="adm-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={15} color="var(--primary)" />
                            <span>{isVi ? 'Ngày sinh' : 'Date of Birth'}</span>
                          </label>
                          <input 
                            type="text" 
                            className="input" 
                            value={dateOfBirth || (isVi ? 'Chưa cập nhật' : 'Not set')}
                            readOnly
                            style={{ backgroundColor: 'var(--surface-container-low)' }}
                          />
                        </div>

                        <div className="adm-form-group">
                          <label className="adm-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={15} color="var(--primary)" />
                            <span>{isVi ? 'SĐT Phụ huynh' : 'Parent Phone'}</span>
                          </label>
                          <input 
                            type="text" 
                            className="input" 
                            value={parentPhone || (isVi ? 'Chưa cập nhật' : 'Not set')}
                            readOnly
                            style={{ backgroundColor: 'var(--surface-container-low)' }}
                          />
                        </div>
                      </div>
                    )}

                    {currentRole === 'admin' && (
                      <div className="adm-form-group">
                        <label className="adm-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building size={15} color="var(--primary)" />
                          <span>{isVi ? 'Đơn vị / Phòng ban' : 'Department'}</span>
                        </label>
                        <input 
                          type="text" 
                          className="input" 
                          value={isVi ? 'Ban Quản trị & Vận hành Hệ thống EnglishHub' : 'System Administration Board'}
                          readOnly
                          style={{ backgroundColor: 'var(--surface-container-low)' }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                      <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        <span>{saving ? (isVi ? 'Đang lưu...' : 'Saving...') : t('profile.btnSave')}</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Tab 2: Security & Password */}
          {activeTab === 'security' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Password Update */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 className="headline-md" style={{ marginBottom: '6px' }}>{t('profile.btnChangePassword')}</h3>
                <p className="body-sm text-on-surface-variant" style={{ marginBottom: '20px' }}>
                  {isVi ? 'Đổi mật khẩu định kỳ giúp bảo vệ tài khoản khỏi truy cập trái phép.' : 'Update your password regularly to prevent unauthorized access.'}
                </p>

                {passwordError && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    fontSize: '13px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={15} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mật khẩu hiện tại' : 'Current Password'} *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showCurrentPw ? 'text' : 'password'} 
                        className="input" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        style={{ width: '100%', paddingRight: '40px' }} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                      >
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mật khẩu mới' : 'New Password'} *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showNewPw ? 'text' : 'password'} 
                        className="input" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                        placeholder={isVi ? 'Tối thiểu 8 ký tự...' : 'Minimum 8 characters...'}
                        style={{ width: '100%', paddingRight: '40px' }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'} *</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showConfirmPw ? 'text' : 'password'} 
                        className="input" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                        style={{ width: '100%', paddingRight: '40px' }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={changingPassword}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>{changingPassword ? (isVi ? 'Đang cập nhật...' : 'Updating...') : (isVi ? 'Cập nhật mật khẩu' : 'Update Password')}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* 2FA Toggle */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 className="headline-md" style={{ marginBottom: '6px' }}>{isVi ? 'Xác Thực Hai Yếu Tố (2FA)' : 'Two-Factor Authentication'}</h3>
                <p className="body-sm text-on-surface-variant" style={{ marginBottom: '20px' }}>
                  {isVi ? 'Tăng cường bảo mật với mã OTP qua ứng dụng Google Authenticator.' : 'Secure account with an Authenticator OTP challenge.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--surface-container-low)', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{isVi ? 'Bật mã xác thực 2FA' : 'Enable 2FA OTP'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                      {twoFactorEnabled ? (isVi ? 'Đang bảo vệ tài khoản' : 'Account is protected') : (isVi ? 'Đang tắt' : 'Disabled')}
                    </div>
                  </div>
                  <label className="adm-switch">
                    <input 
                      type="checkbox" 
                      checked={twoFactorEnabled} 
                      onChange={() => setTwoFactorEnabled(!twoFactorEnabled)} 
                    />
                    <span className="adm-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Active Sessions */}
          {activeTab === 'sessions' && (
            <div className="card" style={{ padding: '24px' }}>
              <h3 className="headline-md" style={{ marginBottom: '6px' }}>{isVi ? 'Các Thiết Bị Đang Đăng Nhập (Active Sessions)' : 'Active Login Sessions'}</h3>
              <p className="body-sm text-on-surface-variant" style={{ marginBottom: '20px' }}>
                {isVi ? 'Được đồng bộ trực tiếp với token bảo mật của hệ thống EnglishHub.' : 'Synchronized with system authentication credentials.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Laptop size={22} color="var(--primary)" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{getDeviceName()}</div>
                      <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                        {email} • {isVi ? 'Phiên làm việc hiện tại' : 'Current active session'}
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleLogoutCurrentSession}
                    style={{ color: 'var(--error)' }}
                  >
                    {isVi ? 'Đăng xuất' : 'Logout'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
