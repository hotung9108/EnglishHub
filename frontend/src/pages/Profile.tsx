import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Shield, 
  Check, Eye, EyeOff, 
  CheckCircle2, Copy, AlertCircle, Loader2,
  Calendar, Phone, BookOpen
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../api/services/user.service';
import type { UserProfile } from '../api/services/user.service';
import { validateFullName } from '../utils/nameValidation';
import '../styles/settings.css';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

export const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';
  const { user, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') as 'general' | 'security' | null;
  const activeTab = tabParam && ['general', 'security'].includes(tabParam) 
    ? tabParam 
    : 'general';

  const setActiveTab = (tab: 'general' | 'security') => {
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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVi ? 'Không thể cập nhật hồ sơ' : 'Failed to update profile');
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError(isVi ? 'Mật khẩu mới phải có ít nhất 8 ký tự.' : 'New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(isVi ? 'Xác nhận mật khẩu mới không khớp.' : 'New passwords do not match.');
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
      const msg = err instanceof Error ? err.message : (isVi ? 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.' : 'Failed to change password. Please check your current password.');
      setPasswordError(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSelectPresetAvatar = (url: string) => {
    setAvatarUrl(url);
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getRoleBadge = (role: 'admin' | 'teacher' | 'student') => {
    switch (role) {
      case 'admin':
        return { label: isVi ? 'Quản trị viên' : 'Administrator', bg: '#262320' };
      case 'teacher':
        return { label: isVi ? 'Giảng viên' : 'Teacher', bg: '#1B4D3E' };
      case 'student':
      default:
        return { label: isVi ? 'Học viên' : 'Student', bg: '#C5A880' };
    }
  };

  const roleBadge = getRoleBadge(currentRole);

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="adm-header">
        <div className="adm-header-left">
          <h1 className="adm-title">
            {t('profile.title')}
          </h1>
          <p className="adm-subtitle">
            {isVi 
              ? 'Thông tin tài khoản cá nhân và mật khẩu.' 
              : 'Personal account details and password.'}
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="settings-alert-success">
          <CheckCircle2 size={18} />
          <span>{isVi ? 'Đã cập nhật thông tin thành công!' : 'Profile updated successfully!'}</span>
        </div>
      )}

      {errorMessage && (
        <div className="settings-alert-error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="adm-filter-bar">
        <div className="adm-pills">
          {(
            [
              { key: 'general', label: isVi ? 'Thông tin cá nhân' : 'General Profile', icon: User },
              { key: 'security', label: isVi ? 'Bảo mật & Mật khẩu' : 'Security & Password', icon: Shield },
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
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="profile-loading-state">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="profile-loading-text">
            {isVi ? 'Đang tải thông tin hồ sơ...' : 'Loading profile data...'}
          </span>
        </div>
      ) : (
        <>
          {/* Tab 1: General Info */}
          {activeTab === 'general' && (
            <div className="profile-layout-grid">
              {/* Avatar & Summary Card */}
              <div className="card profile-avatar-card">
                <div className="profile-avatar-circle">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt={fullName} 
                      className="profile-avatar-img"
                    />
                  ) : (
                    getInitials(fullName)
                  )}
                </div>

                <h3 className="profile-avatar-name">{fullName || user?.fullName || 'User'}</h3>
                <span className={`profile-role-badge ${currentRole}`}>
                  {roleBadge.label}
                </span>

                {/* Preset Avatar Selection */}
                <div className="profile-preset-section">
                  <div className="profile-preset-title">
                    {isVi ? 'Chọn ảnh đại diện mẫu' : 'Choose Preset Avatar'}
                  </div>
                  <div className="profile-preset-list">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(url)}
                        className={`profile-preset-btn ${avatarUrl === url ? 'is-active' : ''}`}
                        aria-label={`Preset avatar ${idx + 1}`}
                      >
                        <img src={url} alt={`Preset ${idx + 1}`} className="profile-preset-img" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="profile-avatar-actions">
                  {avatarUrl && (
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm profile-btn-delete-avatar" 
                      onClick={() => setAvatarUrl('')}
                    >
                      {t('profile.btnDeleteAvatar')}
                    </button>
                  )}
                </div>
              </div>

              {/* Form Card */}
              <div className="card profile-form-card">
                <form onSubmit={handleSaveGeneral}>
                  <div className="profile-form-body">
                    <div className="adm-form-grid">
                      <div className="adm-form-group">
                        <label className="adm-form-label">{t('profile.fullName')} *</label>
                        <input 
                          type="text" 
                          className={`input ${nameError ? 'has-error' : ''}`}
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
                          required 
                        />
                        {nameError ? (
                          <span className="settings-field-error">
                            {nameError}
                          </span>
                        ) : (
                          <span className="settings-field-hint">
                            {t('profile.fullNameHint')}
                          </span>
                        )}
                      </div>

                      <div className="adm-form-group">
                        <label className="adm-form-label">{t('profile.userId')}</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            className="input profile-input-code"
                            value={userCode} 
                            readOnly 
                          />
                          <button 
                            type="button" 
                            onClick={handleCopyId}
                            className="profile-copy-btn"
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
                          className="input profile-input-readonly"
                          value={email}
                          readOnly
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
                        <label className="adm-form-label profile-label-icon">
                          <BookOpen size={15} className="text-primary" />
                          <span>{isVi ? 'Chuyên môn giảng dạy' : 'Specialization'}</span>
                        </label>
                        <input 
                          type="text" 
                          className="input profile-input-readonly"
                          value={specialization || (isVi ? 'Chưa cập nhật' : 'Not specified')}
                          readOnly
                        />
                      </div>
                    )}

                    {currentRole === 'student' && (
                      <div className="adm-form-grid">
                        <div className="adm-form-group">
                          <label className="adm-form-label profile-label-icon">
                            <Calendar size={15} className="text-primary" />
                            <span>{isVi ? 'Ngày sinh' : 'Date of Birth'}</span>
                          </label>
                          <input 
                            type="text" 
                            className="input profile-input-readonly"
                            value={dateOfBirth || (isVi ? 'Chưa cập nhật' : 'Not set')}
                            readOnly
                          />
                        </div>

                        <div className="adm-form-group">
                          <label className="adm-form-label profile-label-icon">
                            <Phone size={15} className="text-primary" />
                            <span>{isVi ? 'SĐT Phụ huynh' : 'Parent Phone'}</span>
                          </label>
                          <input 
                            type="text" 
                            className="input profile-input-readonly"
                            value={parentPhone || (isVi ? 'Chưa cập nhật' : 'Not set')}
                            readOnly
                          />
                        </div>
                      </div>
                    )}

                    {currentRole === 'admin' && (
                      <div className="adm-form-group">
                        <label className="adm-form-label profile-label-icon">
                          <span>{isVi ? 'Đơn vị / Phòng ban' : 'Department'}</span>
                        </label>
                        <input 
                          type="text" 
                          className="input profile-input-readonly"
                          value={isVi ? 'Ban Quản trị & Vận hành Hệ thống EnglishHub' : 'System Administration Board'}
                          readOnly
                        />
                      </div>
                    )}

                    <div className="profile-actions-row">
                      <button 
                        type="submit" 
                        className="btn btn-primary inline-flex items-center gap-2" 
                        disabled={saving}
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
            <div className="profile-layout-grid">
              {/* Password Update */}
              <div className="card profile-form-card">
                <h3 className="headline-md mb-2">{t('profile.btnChangePassword')}</h3>
                <p className="body-sm text-on-surface-variant mb-5">
                  {isVi ? 'Đổi mật khẩu định kỳ giúp bảo vệ tài khoản khỏi truy cập trái phép.' : 'Update your password regularly to prevent unauthorized access.'}
                </p>

                {passwordError && (
                  <div className="settings-alert-error">
                    <AlertCircle size={15} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="profile-password-form">
                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mật khẩu hiện tại' : 'Current Password'} *</label>
                    <div className="relative">
                      <input 
                        type={showCurrentPw ? 'text' : 'password'} 
                        className="input profile-input-pw"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="profile-toggle-pw-btn"
                        aria-label={showCurrentPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Mật khẩu mới' : 'New Password'} *</label>
                    <div className="relative">
                      <input 
                        type={showNewPw ? 'text' : 'password'} 
                        className="input profile-input-pw"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required 
                        placeholder={isVi ? 'Tối thiểu 8 ký tự...' : 'Minimum 8 characters...'}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="profile-toggle-pw-btn"
                        aria-label={showNewPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'} *</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPw ? 'text' : 'password'} 
                        className="input profile-input-pw"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="profile-toggle-pw-btn"
                        aria-label={showConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="profile-actions-row">
                    <button 
                      type="submit" 
                      className="btn btn-primary inline-flex items-center gap-2"
                      disabled={changingPassword}
                    >
                      {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      <span>{changingPassword ? (isVi ? 'Đang cập nhật...' : 'Updating...') : (isVi ? 'Cập nhật mật khẩu' : 'Update Password')}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
