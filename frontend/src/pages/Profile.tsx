import React, { useState } from 'react';
import { 
  User, Shield, Laptop, 
  Upload, Check, Eye, EyeOff, 
  CheckCircle2, Copy
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const isVi = language === 'vi';

  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'sessions'>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('Trần Thị Mai Lan');
  const [email, setEmail] = useState('teacher.lan@center.edu.vn');
  const [phone, setPhone] = useState('0987 654 321');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText('GV-2026-088');
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert(isVi ? 'Mật khẩu xác nhận không khớp!' : 'Passwords do not match!');
      return;
    }
    setSaveSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSaveSuccess(false), 2000);
  };

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

      {/* Tab 1: General Info */}
      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Avatar & Summary Card */}
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              fontWeight: 700,
              marginBottom: '16px',
              boxShadow: 'var(--shadow-md)',
              border: '4px solid var(--surface-container-low)'
            }}>
              TL
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>{fullName}</h3>
            <span className="badge" style={{ backgroundColor: '#0f172a', color: 'white', marginBottom: '16px', fontSize: '12px' }}>
              {isVi ? 'GIÁO VIÊN TIẾNG ANH' : 'ENGLISH INSTRUCTOR'}
            </span>

            <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '240px' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Upload size={14} />
                <span>{t('profile.btnChangeAvatar')}</span>
              </button>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, color: 'var(--error)' }}>
                {t('profile.btnDeleteAvatar')}
              </button>
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
                      onChange={(e) => setFullName(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{t('profile.userId')}</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type="text" 
                        className="input" 
                        value="GV-2026-088" 
                        readOnly 
                        style={{ backgroundColor: 'var(--surface-container-low)', paddingRight: '40px', fontFamily: 'monospace' }} 
                      />
                      <button 
                        type="button" 
                        onClick={handleCopyId}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
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
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="adm-form-group">
                    <label className="adm-form-label">{t('profile.phone')}</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check size={16} />
                    <span>{t('profile.btnSave')}</span>
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

            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="adm-form-group">
                <label className="adm-form-label">{isVi ? 'Mật khẩu hiện tại' : 'Current Password'}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="input" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    style={{ width: '100%', paddingRight: '40px' }} 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">{isVi ? 'Mật khẩu mới' : 'New Password'}</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="input" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  placeholder="Tối thiểu 8 ký tự..."
                />
              </div>

              <div className="adm-form-group">
                <label className="adm-form-label">{isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="input" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary">
                  {isVi ? 'Cập nhật mật khẩu' : 'Update Password'}
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
            {isVi ? 'Được đồng bộ trực tiếp với bảng refresh_tokens trong CSDL.' : 'Synchronized with DB refresh_tokens table.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Laptop size={22} color="var(--primary)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Google Chrome • Windows 11 (Thiết bị này)</div>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Hà Nội, VN • IP: 118.70.12.8 • Đang hoạt động</div>
                </div>
              </div>
              <span className="badge badge-active">{isVi ? 'Thiết bị hiện tại' : 'Current Session'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Laptop size={22} color="var(--on-surface-variant)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>Safari Mobile • iPhone 15 Pro</div>
                  <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>Hà Nội, VN • IP: 14.162.24.10 • 3 giờ trước</div>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => alert(isVi ? 'Đã thu hồi phiên đăng nhập trên iPhone thành công.' : 'Session revoked.')}
                style={{ color: 'var(--error)' }}
              >
                {isVi ? 'Đăng xuất' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
