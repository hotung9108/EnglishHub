import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Copy, 
  Check, 
  Camera, 
  Trash2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2, 
  XCircle,
  Sliders,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { userService } from '../api/services/user.service';
import type { Role } from '../types/auth';
import type { SettingsTab } from '../types/settings.types';
import { validateFullName } from '../utils/nameValidation';
import '../styles/settings.css';

interface SettingsProps {
  defaultTab?: SettingsTab;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
];

const SettingsView: React.FC<SettingsProps> = ({ defaultTab = 'profile' }) => {
  const { user, updateUser } = useAuth();
  const { language, t } = useLanguage();
  const isVi = language === 'vi';
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab state derived directly from URL search params
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const isValidTab = (tab: string | null): tab is SettingsTab =>
    Boolean(tab && ['profile', 'security'].includes(tab));

  const activeTab: SettingsTab = isValidTab(tabParam) ? tabParam : defaultTab;

  const handleTabChange = (newTab: SettingsTab) => {
    setSearchParams({ tab: newTab });
  };

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // User form state
  const currentRole: Role = user?.role || 'admin';
  const computedUserCode = user?.code || (user?.id ? (
    currentRole === 'admin' ? `AD-${String(user.id).padStart(3, '0')}` :
    currentRole === 'teacher' ? `GV-${String(user.id).padStart(3, '0')}` :
    `HV-${String(user.id).padStart(3, '0')}`
  ) : '');

  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    code: computedUserCode,
    avatar: user?.avatar || '',
    joinedDate: user?.joinedDate || '',
    department: user?.department || 'Ban Quản trị Hệ thống',
    specialization: user?.specialization || '',
    bio: user?.bio || '',
    meetingUrl: user?.meetingUrl || '',
    currentClass: user?.currentClass || '',
    targetBand: user?.targetBand || '',
    school: user?.school || '',
    dateOfBirth: user?.dateOfBirth || '',
  });
  const [nameError, setNameError] = useState('');



  // Code badge copy state
  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopyCode = () => {
    navigator.clipboard.writeText(formData.code);
    setCopiedCode(true);
    showToast(t('settings.codeCopied'));
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password rules validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const validRulesCount = [hasMinLength, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length;
  let strengthLabel = t('settings.strengthWeak');
  let strengthClass = 'weak';
  if (validRulesCount === 2) {
    strengthLabel = t('settings.strengthFair');
    strengthClass = 'fair';
  } else if (validRulesCount === 3) {
    strengthLabel = t('settings.strengthGood');
    strengthClass = 'good';
  } else if (validRulesCount === 4) {
    strengthLabel = t('settings.strengthStrong');
    strengthClass = 'strong';
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError(t('settings.passwordRequired'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError(isVi ? 'Mật khẩu mới phải có ít nhất 8 ký tự' : 'Password must be at least 8 characters');
      return;
    }

    try {
      await userService.changePassword({
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('settings.passwordUpdated'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('settings.passwordMismatch');
      setPasswordError(msg);
    }
  };


  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const valResult = validateFullName(formData.name, isVi);
    if (!valResult.isValid) {
      setNameError(valResult.errorMessage || '');
      showToast(valResult.errorMessage || '');
      return;
    }

    setNameError('');
    const cleanName = valResult.normalized;

    try {
      await userService.updateMyProfile({
        fullName: cleanName,
        phone: formData.phone,
        avatarUrl: formData.avatar,
      });

      updateUser({
        fullName: cleanName,
        email: formData.email,
        phone: formData.phone,
        code: formData.code,
        avatar: formData.avatar,
        department: formData.department,
        specialization: formData.specialization,
        bio: formData.bio,
        meetingUrl: formData.meetingUrl,
        currentClass: formData.currentClass,
        targetBand: formData.targetBand,
        school: formData.school,
        dateOfBirth: formData.dateOfBirth,
      });
      setFormData(prev => ({ ...prev, name: cleanName }));
      showToast(t('settings.savedSuccess'));
    } catch {
      showToast(isVi ? 'Không thể lưu hồ sơ' : 'Failed to update profile');
    }
  };

  const getRoleTitle = () => {
    if (currentRole === 'admin') return t('settings.titleAdmin');
    if (currentRole === 'teacher') return t('settings.titleTeacher');
    return t('settings.titleStudent');
  };

  const getRoleBadgeText = () => {
    if (currentRole === 'admin') return t('settings.roleAdminBadge');
    if (currentRole === 'teacher') return t('settings.roleTeacherBadge');
    return t('settings.roleStudentBadge');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const cleanName = name.replace(/\(.*?\)/g, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="settings-page">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="settings-toast">
          <CheckCircle2 size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}


      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-info">
          <h1 className="settings-header-title">
            <Sliders size={26} color="var(--primary)" />
            {getRoleTitle()}
          </h1>
          <p className="settings-header-subtitle">
            {t('settings.subtitle')}
          </p>
        </div>
        <span className={`settings-role-badge ${currentRole}`}>
          {currentRole === 'admin' && <ShieldCheck size={14} />}
          {currentRole === 'teacher' && <Briefcase size={14} />}
          {currentRole === 'student' && <GraduationCap size={14} />}
          {getRoleBadgeText()}
        </span>
      </div>

      {/* User Identity Hero Card (Modern Clean SaaS Design) */}
      <div className={`settings-hero-card ${currentRole}`}>
        <div className="settings-hero-left">
          <div className={`settings-avatar-wrapper ${currentRole}`}>
            {formData.avatar ? (
              <img 
                src={formData.avatar} 
                alt={formData.name} 
                className="settings-avatar-img" 
              />
            ) : (
              <div className="settings-avatar-initials">
                {getInitials(formData.name)}
              </div>
            )}
            <div className="settings-avatar-dot" title={t('settings.activeBadge')}></div>
          </div>

          <div className="settings-hero-details">
            <div className="settings-hero-topline">
              <h2 className="settings-hero-name">{formData.name || 'EnglishHub User'}</h2>
              <span className={`settings-role-badge ${currentRole}`}>
                {currentRole === 'admin' && <ShieldCheck size={13} />}
                {currentRole === 'teacher' && <Briefcase size={13} />}
                {currentRole === 'student' && <GraduationCap size={13} />}
                {getRoleBadgeText()}
              </span>
              <button 
                type="button" 
                className="settings-code-badge" 
                onClick={handleCopyCode}
                title="Sao chép mã định danh"
              >
                {copiedCode ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                <span>{formData.code}</span>
              </button>
            </div>

            <div className="settings-hero-role-desc">
              {currentRole === 'admin' && (isVi ? 'Ban Quản trị Hệ thống • Quản trị viên cấp cao' : 'System Administration • Senior Administrator')}
              {currentRole === 'teacher' && (isVi ? 'Giảng viên Tiếng Anh • EnglishHub Academic' : 'English Instructor • EnglishHub Academic')}
              {currentRole === 'student' && (isVi ? 'Học viên EnglishHub' : 'EnglishHub Student')}
            </div>

            <div className="settings-hero-meta-row">
              <span className="settings-hero-meta-item">
                <Mail size={13} />
                {formData.email}
              </span>
              {formData.phone && (
                <span className="settings-hero-meta-item">
                  <Phone size={13} />
                  {formData.phone}
                </span>
              )}
              <span className="settings-hero-meta-item">
                <Calendar size={13} />
                {t('settings.joinedDate')}: {formData.joinedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Status */}
        <div className="settings-hero-right">
          <div className="settings-hero-status-pill">
            <span className="badge badge-active">
              <span className="status-badge-dot settings-dot-active"></span>
              {t('settings.activeBadge')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <nav className="settings-tabs-nav" aria-label="Settings Tabs">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          <UserIcon size={16} />
          <span>{t('settings.tabProfile')}</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => handleTabChange('security')}
        >
          <ShieldCheck size={16} />
          <span>{t('settings.tabSecurity')}</span>
        </button>
      </nav>

      {/* TAB 1: PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3 className="settings-card-title">
                <UserIcon size={20} color="var(--primary)" />
                {t('settings.tabProfile')}
              </h3>
              <p className="settings-card-subtitle">{t('profile.cardInfoSubtitle')}</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-card-body">
            {/* Avatar management panel */}
            <div className="settings-avatar-panel">
              <div className="settings-avatar-wrapper panel">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="settings-avatar-img" />
                ) : (
                  <div className="settings-avatar-initials panel">
                    {getInitials(formData.name)}
                  </div>
                )}
              </div>
              <div className="settings-avatar-panel-actions">
                <div className="settings-label">{t('settings.avatarTitle')}</div>
                <div className="settings-field-hint">{t('settings.avatarDesc')}</div>
                <div className="settings-avatar-panel-buttons">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      const nextAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
                      setFormData(prev => ({ ...prev, avatar: nextAvatar }));
                    }}
                  >
                    <Camera size={15} />
                    {t('settings.btnPresets')}
                  </button>
                  {formData.avatar && (
                    <button 
                      type="button" 
                      className="btn btn-error"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: '' }))}
                    >
                      <Trash2 size={15} />
                      {t('settings.btnRemove')}
                    </button>
                  )}
                </div>
                {/* Presets row */}
                <div className="settings-presets-row">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={`preset-${idx}`}
                      type="button"
                      className={`settings-preset-btn ${formData.avatar === url ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, avatar: url }))}
                      title={`Preset ${idx + 1}`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* General Fields */}
            <div className="settings-grid-2">
              <div className="settings-field">
                <label className="settings-label">
                  {t('settings.fullName')} <span className="settings-label-required">*</span>
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                    if (nameError) setNameError('');
                  }}
                  onBlur={() => {
                    const res = validateFullName(formData.name, isVi);
                    if (!res.isValid) {
                      setNameError(res.errorMessage || '');
                    } else {
                      setNameError('');
                    }
                  }}
                  className={`settings-input ${nameError ? 'has-error' : ''}`}
                  required 
                />
                {nameError ? (
                  <span className="settings-field-error">
                    {nameError}
                  </span>
                ) : (
                  <span className="settings-field-hint">
                    {t('settings.fullNameHint')}
                  </span>
                )}
              </div>

              <div className="settings-field">
                <label className="settings-label">{t('settings.userId')}</label>
                <div className="settings-input-wrapper">
                  <input 
                    type="text" 
                    className="settings-input" 
                    value={formData.code}
                    readOnly 
                  />
                  <button 
                    type="button" 
                    className="settings-input-toggle" 
                    onClick={handleCopyCode}
                    title="Sao chép"
                  >
                    {copiedCode ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">
                  {t('settings.email')} <span className="settings-label-required">*</span>
                </label>
                <input 
                  type="email" 
                  className="settings-input" 
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required 
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">{t('settings.phone')}</label>
                <input 
                  type="tel" 
                  className="settings-input" 
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="09xx xxx xxx" 
                />
              </div>
            </div>

            {/* ROLE-SPECIFIC FIELDS */}

            {/* Teacher Fields */}
            {currentRole === 'teacher' && (
              <div className="settings-grid-2">
                <div className="settings-field">
                  <label className="settings-label">{t('settings.specialization')}</label>
                  <input 
                    type="text" 
                    className="settings-input" 
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="4 Kỹ năng (Writing, Reading, Listening, Speaking)" 
                  />
                </div>
              </div>
            )}

            {/* Student Fields */}
            {currentRole === 'student' && (
              <div className="settings-grid-2">
                <div className="settings-field">
                  <label className="settings-label">{t('settings.dateOfBirth')}</label>
                  <input 
                    type="date" 
                    className="settings-input" 
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} 
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="settings-bottom-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  if (user) {
                    setFormData({
                      name: user.fullName,
                      email: user.email,
                      phone: user.phone || '',
                      code: user.code || '',
                      avatar: user.avatar || '',
                      joinedDate: user.joinedDate || '',
                      department: user.department || '',
                      specialization: user.specialization || '',
                      bio: user.bio || '',
                      meetingUrl: user.meetingUrl || '',
                      currentClass: user.currentClass || '',
                      targetBand: user.targetBand || '',
                      school: user.school || '',
                      dateOfBirth: user.dateOfBirth || '',
                    });
                  }
                }}
              >
                {t('settings.btnCancel')}
              </button>
              <button type="submit" className="btn btn-primary">
                {t('settings.btnSave')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3 className="settings-card-title">
                <ShieldCheck size={20} color="var(--primary)" />
                {t('settings.tabSecurity')}
              </h3>
              <p className="settings-card-subtitle">{t('settings.passwordSubtitle')}</p>
            </div>
          </div>

          <div className="settings-card-body">
            {/* Change Password Sub-form */}
            <form onSubmit={handlePasswordSubmit}>
              <div className="settings-field settings-section-heading">
                <h4 className="headline-md settings-sub-title">
                  {t('settings.passwordTitle')}
                </h4>
                <p className="label-md text-on-surface-variant settings-sub-desc">
                  {t('profile.passwordHint')}
                </p>
              </div>

              {passwordError && (
                <div className="settings-alert-error">
                  <AlertCircle size={16} />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="settings-grid-3">
                <div className="settings-field">
                  <label className="settings-label">
                    {t('settings.currentPassword')} <span className="settings-label-required">*</span>
                  </label>
                  <div className="settings-input-wrapper">
                    <input 
                      type={showCurrentPw ? 'text' : 'password'}
                      className="settings-input"
                      placeholder={t('settings.currentPasswordPlaceholder')}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="settings-input-toggle" 
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                    >
                      {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">
                    {t('settings.newPassword')} <span className="settings-label-required">*</span>
                  </label>
                  <div className="settings-input-wrapper">
                    <input 
                      type={showNewPw ? 'text' : 'password'}
                      className="settings-input"
                      placeholder={t('settings.newPasswordPlaceholder')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="settings-input-toggle" 
                      onClick={() => setShowNewPw(!showNewPw)}
                    >
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="settings-strength-wrapper">
                      <div className="settings-strength-bar">
                        <div className={`settings-strength-fill ${strengthClass}`}></div>
                      </div>
                      <div className={`settings-strength-text ${strengthClass}`}>
                        <span>{t('settings.passwordStrength')}: {strengthLabel}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="settings-field">
                  <label className="settings-label">
                    {t('settings.confirmPassword')} <span className="settings-label-required">*</span>
                  </label>
                  <div className="settings-input-wrapper">
                    <input 
                      type={showConfirmPw ? 'text' : 'password'}
                      className="settings-input"
                      placeholder={t('settings.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="settings-input-toggle" 
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Checklist Criteria */}
              <div className="settings-rules-checklist">
                <div className={`settings-rule-item ${hasMinLength ? 'valid' : ''}`}>
                  {hasMinLength ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#94A3B8" />}
                  <span>{t('settings.reqLength')}</span>
                </div>
                <div className={`settings-rule-item ${hasUppercase ? 'valid' : ''}`}>
                  {hasUppercase ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#94A3B8" />}
                  <span>{t('settings.reqUpper')}</span>
                </div>
                <div className={`settings-rule-item ${hasNumber ? 'valid' : ''}`}>
                  {hasNumber ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#94A3B8" />}
                  <span>{t('settings.reqNumber')}</span>
                </div>
                <div className={`settings-rule-item ${hasSpecial ? 'valid' : ''}`}>
                  {hasSpecial ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#94A3B8" />}
                  <span>{t('settings.reqSpecial')}</span>
                </div>
                <div className={`settings-rule-item span-2 ${passwordsMatch ? 'valid' : ''}`}>
                  {passwordsMatch ? <CheckCircle2 size={14} color="#059669" /> : <XCircle size={14} color="#94A3B8" />}
                  <span>{t('settings.reqMatch')}</span>
                </div>
              </div>

              <div className="settings-mt-16">
                <button type="submit" className="btn btn-primary">
                  {t('settings.btnUpdatePassword')}
                </button>
              </div>
            </form>


          </div>
        </div>
      )}

    </div>
  );
};

const Settings: React.FC<SettingsProps> = (props) => {
  const { user } = useAuth();
  return <SettingsView key={`${user?.id || 'guest'}-${user?.role || 'admin'}`} {...props} />;
};

export default Settings;
