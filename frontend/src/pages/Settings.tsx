import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User as UserIcon, 
  ShieldCheck, 
  Bell, 
  Sliders, 
  Copy, 
  Check, 
  Camera, 
  Trash2, 
  Eye, 
  EyeOff, 
  Monitor, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  AlertCircle,
  Clock,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  XCircle,
  Moon,
  Sun,
  Globe,
  Mail,
  Phone,
  Calendar,
  Award
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import type { Role } from '../types/auth';
import type { SettingsTab, ActiveSession, NotificationSettings, PreferenceSettings } from '../types/settings.types';
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

const INITIAL_SESSIONS: ActiveSession[] = [
  {
    id: 'sess-1',
    device: 'Desktop PC (Windows 11)',
    browser: 'Chrome 122.0',
    os: 'Windows 11',
    ip: '118.69.182.44',
    location: 'Hà Nội, Việt Nam',
    lastActive: 'Đang hoạt động',
    isCurrent: true,
  },
  {
    id: 'sess-2',
    device: 'iPhone 15 Pro',
    browser: 'Mobile Safari 17.2',
    os: 'iOS 17',
    ip: '118.69.182.89',
    location: 'Hà Nội, Việt Nam',
    lastActive: '3 giờ trước',
    isCurrent: false,
  },
  {
    id: 'sess-3',
    device: 'MacBook Air M2',
    browser: 'Firefox 123.0',
    os: 'macOS Sonoma',
    ip: '171.244.38.12',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    lastActive: '2 ngày trước',
    isCurrent: false,
  },
];

const SettingsView: React.FC<SettingsProps> = ({ defaultTab = 'profile' }) => {
  const { user, updateUser } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab state derived directly from URL search params
  const tabParam = searchParams.get('tab') as SettingsTab | null;
  const isValidTab = (tab: string | null): tab is SettingsTab =>
    Boolean(tab && ['profile', 'security', 'notifications', 'preferences'].includes(tab));

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
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    code: user?.code || (currentRole === 'admin' ? 'AD-2026-001' : currentRole === 'teacher' ? 'GV-2026-088' : 'HV-2026-402'),
    avatar: user?.avatar || '',
    joinedDate: user?.joinedDate || (currentRole === 'admin' ? '15/01/2025' : currentRole === 'teacher' ? '01/08/2024' : '10/02/2026'),
    department: user?.department || 'Ban Quản trị Hệ thống',
    specialization: user?.specialization || 'IELTS Academic & Speaking/Writing',
    bio: user?.bio || '8.5 IELTS Overall (Speaking 8.5, Writing 8.0). Hơn 7 năm kinh nghiệm giảng dạy IELTS chuyên sâu tại EnglishHub.',
    meetingUrl: user?.meetingUrl || 'https://meet.google.com/eh-lan-ielts',
    currentClass: user?.currentClass || 'IELTS Intensive K24',
    targetBand: user?.targetBand || '7.5+ IELTS',
    school: user?.school || 'Đại học Quốc Gia Hà Nội',
    dateOfBirth: user?.dateOfBirth || '2005-06-15',
  });

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

  const handlePasswordSubmit = (e: React.FormEvent) => {
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

    if (validRulesCount < 3) {
      setPasswordError(t('profile.passwordRequirementsTitle'));
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast(t('settings.passwordUpdated'));
  };

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    showToast(
      !twoFactorEnabled 
        ? t('settings.twoFactorEnabled') 
        : t('settings.twoFactorDisabled')
    );
  };

  // Active sessions state
  const [sessions, setSessions] = useState<ActiveSession[]>(INITIAL_SESSIONS);
  const handleRevokeSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    showToast(t('settings.sessionsRevoked'));
  };

  // Notification settings state
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>({
    securityAlerts: true,
    systemErrorAlerts: true,
    weeklyReports: true,
    userRegistrationApprovals: false,
    submissionAlerts: true,
    deadlineApproachingAlerts: true,
    weeklyClassDigest: true,
    studentInquiries: true,
    newAssignmentAlerts: true,
    gradingResultAlerts: true,
    dueReminder24h: true,
    studyStreakReminder: true,
  });

  const handleToggleNotif = (key: keyof NotificationSettings) => {
    setNotifSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Preferences settings state
  const [prefSettings, setPrefSettings] = useState<PreferenceSettings>({
    theme: 'light',
    fontSize: 'normal',
    simulateMaintenance: false,
    autoBackupDaily: true,
    idleSessionTimeout: '30m',
    autoAiGradingAssist: true,
    anonymousGrading: false,
    autoPublishScores: false,
    defaultGradingScale: 'ielts',
    dailyStudyGoalMinutes: 30,
    autoPlayListeningAudio: true,
    displayIpaPhonetics: true,
    defaultAudioSpeed: '1.0x',
  });

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateUser({
      name: formData.name,
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
    showToast(t('settings.savedSuccess'));
  };

  const handleRoleSwitch = async (newRole: Role) => {
    const roleEmails: Record<Role, string> = {
      admin: 'admin@eh.com',
      teacher: 'teacher@eh.com',
      student: 'student@eh.com',
    };

    try {
      await authService.login({ email: roleEmails[newRole], password: 'password123' });
      setUser(authService.getSavedUser() || null);
    } catch {
      // Login failed, keep current user
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

      {/* Role Switcher Sandbox Toolbar for Pairing & QA Test */}
      <div className="settings-role-sandbox">
        <div className="settings-role-sandbox-text">
          <Sparkles size={16} />
          <span>{t('settings.roleSwitcherNotice')} <strong>{currentRole.toUpperCase()}</strong></span>
        </div>
        <div className="settings-role-sandbox-actions">
          <button 
            type="button" 
            className={`settings-role-sandbox-btn ${currentRole === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('admin')}
          >
            Admin
          </button>
          <button 
            type="button" 
            className={`settings-role-sandbox-btn ${currentRole === 'teacher' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('teacher')}
          >
            Teacher
          </button>
          <button 
            type="button" 
            className={`settings-role-sandbox-btn ${currentRole === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('student')}
          >
            Student
          </button>
        </div>
      </div>

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
              {currentRole === 'admin' && `${formData.department || 'Ban Quản trị Hệ thống'} • Quản trị viên cấp cao`}
              {currentRole === 'teacher' && `${formData.specialization || 'Giảng viên Tiếng Anh'} • EnglishHub Academic`}
              {currentRole === 'student' && `${formData.currentClass || 'Học viên'} • Mục tiêu ${formData.targetBand || 'IELTS'}`}
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

        {/* Right side: Highlights & Status */}
        <div className="settings-hero-right">
          <div className="settings-hero-status-pill">
            <span className="badge badge-active">
              <span className="status-badge-dot settings-dot-active"></span>
              {t('settings.activeBadge')}
            </span>
          </div>

          <div className="settings-hero-stats-box">
            {currentRole === 'admin' && (
              <>
                <div className="settings-hero-stat-cell">
                  <span className="settings-hero-stat-label">Bảo mật 2FA</span>
                  <span className="settings-hero-stat-value text-success">
                    <ShieldCheck size={14} />
                    {twoFactorEnabled ? 'Đã bật' : 'Chưa bật'}
                  </span>
                </div>
                <div className="settings-hero-stat-divider"></div>
                <div className="settings-hero-stat-cell">
                  <span className="settings-hero-stat-label">Phiên kết nối</span>
                  <span className="settings-hero-stat-value">
                    <Monitor size={14} />
                    {sessions.length} thiết bị
                  </span>
                </div>
              </>
            )}

            {currentRole === 'teacher' && (
              <>
                <div className="settings-hero-stat-cell">
                  <span className="settings-hero-stat-label">Trợ lý AI</span>
                  <span className="settings-hero-stat-value text-primary">
                    <Sparkles size={14} />
                    {prefSettings.autoAiGradingAssist ? 'Tự động' : 'Thủ công'}
                  </span>
                </div>
                <div className="settings-hero-stat-divider"></div>
                <div className="settings-hero-stat-cell">
                  <span className="settings-hero-stat-label">Thang điểm</span>
                  <span className="settings-hero-stat-value">
                    IELTS Band 9
                  </span>
                </div>
              </>
            )}

            {currentRole === 'student' && (
              <>
                <div className="settings-hero-stat-cell">
                  <span className="settings-hero-stat-label">Target Band</span>
                  <span className="settings-hero-stat-value text-primary">
                    <Award size={14} />
                    {formData.targetBand}
                  </span>
                </div>
                <div className="settings-hero-stat-divider"></div>
                <div className="settings-hero-stat-cell">
                  <span className="settings-hero-stat-label">Mục tiêu ngày</span>
                  <span className="settings-hero-stat-value">
                    <Clock size={14} />
                    {prefSettings.dailyStudyGoalMinutes} phút
                  </span>
                </div>
              </>
            )}
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
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => handleTabChange('notifications')}
        >
          <Bell size={16} />
          <span>{t('settings.tabNotifications')}</span>
        </button>
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => handleTabChange('preferences')}
        >
          <Sliders size={16} />
          <span>{t('settings.tabPreferences')}</span>
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
                  className="settings-input" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required 
                />
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

            {/* Admin Fields */}
            {currentRole === 'admin' && (
              <div className="settings-grid-2">
                <div className="settings-field">
                  <label className="settings-label">{t('settings.department')}</label>
                  <select 
                    className="settings-select"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="Ban Quản trị Hệ thống">Ban Quản trị Hệ thống (System Admin)</option>
                    <option value="Phòng Đào tạo">Phòng Đào tạo (Academic Affairs)</option>
                    <option value="Trung tâm Khảo thí">Trung tâm Khảo thí & Chấm thi (Testing Center)</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label className="settings-label">{t('settings.joinedDate')}</label>
                  <input 
                    type="text" 
                    className="settings-input" 
                    value={formData.joinedDate}
                    readOnly 
                  />
                </div>
              </div>
            )}

            {/* Teacher Fields */}
            {currentRole === 'teacher' && (
              <>
                <div className="settings-grid-2">
                  <div className="settings-field">
                    <label className="settings-label">{t('settings.specialization')}</label>
                    <input 
                      type="text" 
                      className="settings-input" 
                      value={formData.specialization}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                      placeholder="IELTS, TOEIC, Speaking & Writing" 
                    />
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">{t('settings.meetingUrl')}</label>
                    <input 
                      type="url" 
                      className="settings-input" 
                      value={formData.meetingUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingUrl: e.target.value }))}
                      placeholder="https://meet.google.com/..." 
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">{t('settings.bio')}</label>
                  <textarea 
                    className="settings-textarea" 
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Mô tả kinh nghiệm và triết lý giảng dạy..."
                  ></textarea>
                </div>
              </>
            )}

            {/* Student Fields */}
            {currentRole === 'student' && (
              <div className="settings-grid-2">
                <div className="settings-field">
                  <label className="settings-label">{t('settings.currentClass')}</label>
                  <input 
                    type="text" 
                    className="settings-input" 
                    value={formData.currentClass}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentClass: e.target.value }))}
                    placeholder="IELTS Intensive K24" 
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">{t('settings.targetBand')}</label>
                  <select 
                    className="settings-select"
                    value={formData.targetBand}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetBand: e.target.value }))}
                  >
                    <option value="6.5+ IELTS">6.5+ IELTS</option>
                    <option value="7.0+ IELTS">7.0+ IELTS</option>
                    <option value="7.5+ IELTS">7.5+ IELTS</option>
                    <option value="8.0+ IELTS">8.0+ IELTS</option>
                    <option value="TOEIC 750+">TOEIC 750+</option>
                    <option value="TOEIC 900+">TOEIC 900+</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label className="settings-label">{t('settings.school')}</label>
                  <input 
                    type="text" 
                    className="settings-input" 
                    value={formData.school}
                    onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                    placeholder="Trường / Đơn vị theo học" 
                  />
                </div>

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
                      name: user.name,
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

            <div className="settings-divider"></div>

            {/* Two-Factor Authentication */}
            <div className="settings-2fa-box">
              <div className="settings-2fa-left">
                <div className="settings-2fa-icon">
                  <ShieldCheck size={24} />
                </div>
                <div className="settings-2fa-info">
                  <h4 className="settings-2fa-title">
                    {t('settings.twoFactorTitle')}
                    <span className={`badge ${twoFactorEnabled ? 'badge-active' : 'badge-onleave'}`}>
                      {twoFactorEnabled ? t('settings.twoFactorEnabled') : t('settings.twoFactorDisabled')}
                    </span>
                  </h4>
                  <p className="settings-2fa-desc">{t('settings.twoFactorSubtitle')}</p>
                </div>
              </div>
              <label className="settings-switch">
                <input 
                  type="checkbox" 
                  checked={twoFactorEnabled} 
                  onChange={handleToggle2FA} 
                />
                <span className="settings-switch-slider"></span>
              </label>
            </div>

            <div className="settings-divider"></div>

            {/* Active Sessions */}
            <div className="settings-sessions-wrapper">
              <div className="settings-sessions-header">
                <div>
                  <h4 className="headline-md settings-sub-title">
                    {t('settings.sessionsTitle')}
                  </h4>
                  <p className="label-md text-on-surface-variant settings-sub-desc">
                    {t('settings.sessionsSubtitle')}
                  </p>
                </div>
                {sessions.length > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={handleRevokeSessions}
                  >
                    {t('settings.btnRevokeOtherSessions')}
                  </button>
                )}
              </div>

              <div className="settings-sessions-list">
                {sessions.map(session => (
                  <div 
                    key={session.id} 
                    className={`settings-session-item ${session.isCurrent ? 'current' : ''}`}
                  >
                    <div className="settings-session-left">
                      <div className="settings-session-icon">
                        {session.device.includes('iPhone') ? <Smartphone size={18} /> : session.device.includes('MacBook') ? <Laptop size={18} /> : <Monitor size={18} />}
                      </div>
                      <div className="settings-session-details">
                        <div className="settings-session-title">
                          {session.device} • {session.browser}
                          {session.isCurrent && (
                            <span className="badge badge-primary">{t('settings.thisDevice')}</span>
                          )}
                        </div>
                        <div className="settings-session-meta">
                          {session.location} • IP: {session.ip} • {session.lastActive}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3 className="settings-card-title">
                <Bell size={20} color="var(--primary)" />
                {t('settings.notifTitle')}
              </h3>
              <p className="settings-card-subtitle">{t('settings.notifSubtitle')}</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-toggles-list">
              {/* ADMIN NOTIFICATIONS */}
              {currentRole === 'admin' && (
                <>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifSecurity')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifSecurityDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.securityAlerts} 
                        onChange={() => handleToggleNotif('securityAlerts')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifErrors')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifErrorsDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.systemErrorAlerts} 
                        onChange={() => handleToggleNotif('systemErrorAlerts')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifWeeklyReports')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifWeeklyReportsDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.weeklyReports} 
                        onChange={() => handleToggleNotif('weeklyReports')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifRegistrations')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifRegistrationsDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.userRegistrationApprovals} 
                        onChange={() => handleToggleNotif('userRegistrationApprovals')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>
                </>
              )}

              {/* TEACHER NOTIFICATIONS */}
              {currentRole === 'teacher' && (
                <>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifSubmissions')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifSubmissionsDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.submissionAlerts} 
                        onChange={() => handleToggleNotif('submissionAlerts')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifDeadlines')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifDeadlinesDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.deadlineApproachingAlerts} 
                        onChange={() => handleToggleNotif('deadlineApproachingAlerts')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifWeeklyDigest')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifWeeklyDigestDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.weeklyClassDigest} 
                        onChange={() => handleToggleNotif('weeklyClassDigest')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifInquiries')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifInquiriesDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.studentInquiries} 
                        onChange={() => handleToggleNotif('studentInquiries')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>
                </>
              )}

              {/* STUDENT NOTIFICATIONS */}
              {currentRole === 'student' && (
                <>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifNewAssignment')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifNewAssignmentDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.newAssignmentAlerts} 
                        onChange={() => handleToggleNotif('newAssignmentAlerts')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifGradingReady')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifGradingReadyDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.gradingResultAlerts} 
                        onChange={() => handleToggleNotif('gradingResultAlerts')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifDue24h')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifDue24hDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.dueReminder24h} 
                        onChange={() => handleToggleNotif('dueReminder24h')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-text">
                      <h4 className="settings-toggle-title">{t('settings.notifStreak')}</h4>
                      <p className="settings-toggle-desc">{t('settings.notifStreakDesc')}</p>
                    </div>
                    <label className="settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notifSettings.studyStreakReminder} 
                        onChange={() => handleToggleNotif('studyStreakReminder')} 
                      />
                      <span className="settings-switch-slider"></span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="settings-bottom-actions">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => showToast(t('settings.savedSuccess'))}
              >
                {t('settings.btnSave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREFERENCES TAB */}
      {activeTab === 'preferences' && (
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-header-left">
              <h3 className="settings-card-title">
                <Sliders size={20} color="var(--primary)" />
                {t('settings.prefTitle')}
              </h3>
              <p className="settings-card-subtitle">{t('settings.prefSubtitle')}</p>
            </div>
          </div>

          <div className="settings-card-body">
            {/* Language Selector */}
            <div className="settings-field">
              <label className="settings-label">{t('settings.langTitle')}</label>
              <p className="settings-field-hint settings-lang-desc">{t('settings.langDesc')}</p>
              <div className="settings-btn-group">
                <button
                  type="button"
                  className={`btn ${language === 'vi' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => language !== 'vi' && toggleLanguage()}
                >
                  <Globe size={16} />
                  {t('settings.langVi')}
                </button>
                <button
                  type="button"
                  className={`btn ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => language !== 'en' && toggleLanguage()}
                >
                  <Globe size={16} />
                  {t('settings.langEn')}
                </button>
              </div>
            </div>

            <div className="settings-divider"></div>

            {/* Display Theme */}
            <div className="settings-field">
              <label className="settings-label">{t('settings.themeTitle')}</label>
              <div className="settings-pref-options-grid settings-mt-8">
                <div 
                  className={`settings-pref-option-card ${prefSettings.theme === 'light' ? 'active' : ''}`}
                  onClick={() => setPrefSettings(prev => ({ ...prev, theme: 'light' }))}
                >
                  <div className="settings-pref-option-icon">
                    <Sun size={22} />
                  </div>
                  <span className="settings-pref-option-title">{t('settings.themeLight')}</span>
                </div>
                <div 
                  className={`settings-pref-option-card ${prefSettings.theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setPrefSettings(prev => ({ ...prev, theme: 'dark' }))}
                >
                  <div className="settings-pref-option-icon">
                    <Moon size={22} />
                  </div>
                  <span className="settings-pref-option-title">{t('settings.themeDark')}</span>
                </div>
                <div 
                  className={`settings-pref-option-card ${prefSettings.theme === 'system' ? 'active' : ''}`}
                  onClick={() => setPrefSettings(prev => ({ ...prev, theme: 'system' }))}
                >
                  <div className="settings-pref-option-icon">
                    <Monitor size={22} />
                  </div>
                  <span className="settings-pref-option-title">{t('settings.themeSystem')}</span>
                </div>
              </div>
            </div>

            <div className="settings-divider"></div>

            {/* Font Size */}
            <div className="settings-field">
              <label className="settings-label">{t('settings.fontSizeTitle')}</label>
              <div className="settings-btn-group settings-mt-8">
                <button
                  type="button"
                  className={`btn ${prefSettings.fontSize === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPrefSettings(prev => ({ ...prev, fontSize: 'normal' }))}
                >
                  {t('settings.fontNormal')}
                </button>
                <button
                  type="button"
                  className={`btn ${prefSettings.fontSize === 'large' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPrefSettings(prev => ({ ...prev, fontSize: 'large' }))}
                >
                  {t('settings.fontLarge')}
                </button>
                <button
                  type="button"
                  className={`btn ${prefSettings.fontSize === 'extra-large' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPrefSettings(prev => ({ ...prev, fontSize: 'extra-large' }))}
                >
                  {t('settings.fontExtraLarge')}
                </button>
              </div>
            </div>

            <div className="settings-divider"></div>

            {/* ROLE-SPECIFIC OPERATIONAL PREFERENCES */}

            {/* Admin Preferences */}
            {currentRole === 'admin' && (
              <div className="settings-toggles-list">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-text">
                    <h4 className="settings-toggle-title">{t('settings.prefSimulateMaintenance')}</h4>
                    <p className="settings-toggle-desc">{t('settings.prefSimulateMaintenanceDesc')}</p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox" 
                      checked={prefSettings.simulateMaintenance} 
                      onChange={() => setPrefSettings(prev => ({ ...prev, simulateMaintenance: !prev.simulateMaintenance }))} 
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-text">
                    <h4 className="settings-toggle-title">{t('settings.prefAutoBackup')}</h4>
                    <p className="settings-toggle-desc">Tự động nén và tải dữ liệu lên hạ tầng lưu trữ đám mây an toàn.</p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox" 
                      checked={prefSettings.autoBackupDaily} 
                      onChange={() => setPrefSettings(prev => ({ ...prev, autoBackupDaily: !prev.autoBackupDaily }))} 
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>

                <div className="settings-grid-2 settings-mt-8">
                  <div className="settings-field">
                    <label className="settings-label">{t('settings.prefTimeout')}</label>
                    <select 
                      className="settings-select"
                      value={prefSettings.idleSessionTimeout}
                      onChange={(e) => setPrefSettings(prev => ({ ...prev, idleSessionTimeout: e.target.value }))}
                    >
                      <option value="15m">15 phút</option>
                      <option value="30m">30 phút (Mặc định)</option>
                      <option value="60m">1 giờ</option>
                      <option value="120m">2 giờ</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Teacher Preferences */}
            {currentRole === 'teacher' && (
              <div className="settings-toggles-list">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-text">
                    <h4 className="settings-toggle-title">{t('settings.prefAiAssist')}</h4>
                    <p className="settings-toggle-desc">{t('settings.prefAiAssistDesc')}</p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox" 
                      checked={prefSettings.autoAiGradingAssist} 
                      onChange={() => setPrefSettings(prev => ({ ...prev, autoAiGradingAssist: !prev.autoAiGradingAssist }))} 
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-text">
                    <h4 className="settings-toggle-title">{t('settings.prefAnonymous')}</h4>
                    <p className="settings-toggle-desc">{t('settings.prefAnonymousDesc')}</p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox" 
                      checked={prefSettings.anonymousGrading} 
                      onChange={() => setPrefSettings(prev => ({ ...prev, anonymousGrading: !prev.anonymousGrading }))} 
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-text">
                    <h4 className="settings-toggle-title">{t('settings.prefAutoPublish')}</h4>
                    <p className="settings-toggle-desc">Tự động gửi thông báo điểm và nhận xét ngay sau khi bạn xác nhận chấm xong.</p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox" 
                      checked={prefSettings.autoPublishScores} 
                      onChange={() => setPrefSettings(prev => ({ ...prev, autoPublishScores: !prev.autoPublishScores }))} 
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>

                <div className="settings-grid-2 settings-mt-8">
                  <div className="settings-field">
                    <label className="settings-label">{t('settings.prefGradingScale')}</label>
                    <select 
                      className="settings-select"
                      value={prefSettings.defaultGradingScale}
                      onChange={(e) => setPrefSettings(prev => ({ ...prev, defaultGradingScale: e.target.value }))}
                    >
                      <option value="ielts">IELTS Band 0 - 9.0 (Mặc định)</option>
                      <option value="score10">Thang điểm 10 (Chuẩn Việt Nam)</option>
                      <option value="score100">Thang điểm 100%</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Student Preferences */}
            {currentRole === 'student' && (
              <div className="settings-toggles-list">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-text">
                    <h4 className="settings-toggle-title">{t('settings.prefAutoPlayAudio')}</h4>
                    <p className="settings-toggle-desc">Tự động phát audio khi vào bài thi Listening để mô phỏng thi thật.</p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox" 
                      checked={prefSettings.autoPlayListeningAudio} 
                      onChange={() => setPrefSettings(prev => ({ ...prev, autoPlayListeningAudio: !prev.autoPlayListeningAudio }))} 
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-text">
                    <h4 className="settings-toggle-title">{t('settings.prefDisplayIpa')}</h4>
                    <p className="settings-toggle-desc">{t('settings.prefDisplayIpa')}</p>
                  </div>
                  <label className="settings-switch">
                    <input 
                      type="checkbox" 
                      checked={prefSettings.displayIpaPhonetics} 
                      onChange={() => setPrefSettings(prev => ({ ...prev, displayIpaPhonetics: !prev.displayIpaPhonetics }))} 
                    />
                    <span className="settings-switch-slider"></span>
                  </label>
                </div>

                <div className="settings-grid-2 settings-mt-8">
                  <div className="settings-field">
                    <label className="settings-label">{t('settings.prefDailyGoal')}</label>
                    <select 
                      className="settings-select"
                      value={prefSettings.dailyStudyGoalMinutes}
                      onChange={(e) => setPrefSettings(prev => ({ ...prev, dailyStudyGoalMinutes: Number(e.target.value) }))}
                    >
                      <option value={15}>15 phút / ngày (Cơ bản)</option>
                      <option value={30}>30 phút / ngày (Khuyến nghị)</option>
                      <option value={45}>45 phút / ngày (Chuyên sâu)</option>
                      <option value={60}>60 phút / ngày (Cường độ cao)</option>
                    </select>
                    <span className="settings-field-hint">{t('settings.prefDailyGoalDesc')}</span>
                  </div>

                  <div className="settings-field">
                    <label className="settings-label">{t('settings.prefAudioSpeed')}</label>
                    <select 
                      className="settings-select"
                      value={prefSettings.defaultAudioSpeed}
                      onChange={(e) => setPrefSettings(prev => ({ ...prev, defaultAudioSpeed: e.target.value }))}
                    >
                      <option value="0.8x">0.8x (Chậm - Dành cho luyện tập ban đầu)</option>
                      <option value="1.0x">1.0x (Tốc độ chuẩn - Mặc định)</option>
                      <option value="1.25x">1.25x (Nhanh - Thử thách phản xạ)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="settings-bottom-actions">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => showToast(t('settings.savedSuccess'))}
              >
                {t('settings.btnSave')}
              </button>
            </div>
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
