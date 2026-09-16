

import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Profile = () => {
  const { t } = useLanguage();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('profile.title')}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Info Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)' }}>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>{t('profile.cardInfoTitle')}</h3>
            <p className="label-md text-on-surface-variant">{t('profile.cardInfoSubtitle')}</p>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '32px', gap: '32px' }}>
            {/* Left Col - Avatar */}
            <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '32px 24px' }}>
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--surface-container-high)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: '600',
                color: 'var(--primary)',
                marginBottom: '24px',
                border: '4px solid var(--surface-container-lowest)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                TL
              </div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px' }}>Trần Thị Mai Lan</h3>
              <span className="badge" style={{ backgroundColor: '#0F172A', color: 'white', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '32px' }}>
                GIÁO VIÊN TIẾNG ANH
              </span>
              
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>{t('profile.btnChangeAvatar')}</button>
                <button className="btn" style={{ width: '100%', justifyContent: 'center', backgroundColor: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)', color: 'var(--on-surface-variant)' }}>{t('profile.btnDeleteAvatar')}</button>
              </div>
            </div>

            {/* Right Col - Form */}
            <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.fullName')} <span className="text-error">*</span></label>
                  <input type="text" className="input" defaultValue="Trần Thị Mai Lan" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.userId')}</label>
                  <input type="text" className="input" defaultValue="GV-2026-088" readOnly style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.email')}</label>
                  <input type="email" className="input" defaultValue="teacher.lan@center.edu.vn" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.phone')}</label>
                  <input type="text" className="input" defaultValue="0987 654 321" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.role')} <span className="text-error">*</span></label>
                  <select className="input" defaultValue="gv">
                    <option value="gv">Giáo viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: 'auto', paddingTop: '24px' }}>
                <button className="btn btn-secondary">{t('profile.btnCancel')}</button>
                <button className="btn btn-primary" style={{ backgroundColor: '#0F172A' }}>{t('profile.btnSave')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>{t('profile.cardSecurityTitle')}</h3>
              <p className="label-md text-on-surface-variant">{t('profile.cardSecuritySubtitle')}</p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              {showPasswordChange ? t('profile.btnClose') : t('profile.btnChangePassword')}
            </button>
          </div>
          
          {showPasswordChange && (
            <div style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px', backgroundColor: 'var(--surface-container-lowest)' }}>
              
              {/* Form */}
              <div style={{ flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.currentPassword')} <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder={t('profile.currentPasswordPlaceholder')} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.newPassword')} <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder={t('profile.newPasswordPlaceholder')} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.confirmPassword')} <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder={t('profile.confirmPasswordPlaceholder')} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '16px' }}>
                  <button className="btn btn-primary" style={{ backgroundColor: '#0F172A' }}>{t('profile.btnUpdatePassword')}</button>
                </div>
              </div>

              {/* Notification / Requirements Box */}
              <div style={{ flex: '1', minWidth: '250px' }}>
                <div style={{ backgroundColor: 'var(--primary-container)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--primary-fixed-dim)' }}>
                  <h4 className="headline-md" style={{ marginBottom: '16px', color: '#FFFFFF' }}>{t('profile.passwordRequirementsTitle')}</h4>
                  <ul className="body-md" style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#FFFFFF' }}>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqLength') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqUppercase') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqNumber') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqSpecial') }}></li>
                  </ul>
                  <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '16px' }}>ℹ️</span>
                    <p className="label-md text-on-primary-container" style={{ margin: 0, lineHeight: 1.5 }}>
                      {t('profile.passwordHint')}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
