

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

      <div className="flex-col gap-24">
        
        {/* Profile Info Card */}
        <div className="card card-flush">
          <div className="card-section-header">
            <h3 className="headline-md text-on-surface card-section-header-title">{t('profile.cardInfoTitle')}</h3>
            <p className="label-md text-on-surface-variant">{t('profile.cardInfoSubtitle')}</p>
          </div>
          
          <div className="flex flex-wrap p-32 gap-32">
            {/* Left Col - Avatar */}
            <div className="profile-sidebar">
              <div className="profile-avatar">
                TL
              </div>
              <h3 className="headline-md text-on-surface mb-8">Trần Thị Mai Lan</h3>
              <span className="badge badge-dark mb-32">
                GIÁO VIÊN TIẾNG ANH
              </span>
              
              <div className="w-full flex-col gap-12">
                <button className="btn btn-secondary w-full justify-center">{t('profile.btnChangeAvatar')}</button>
                <button className="btn btn-outline w-full justify-center">{t('profile.btnDeleteAvatar')}</button>
              </div>
            </div>

            {/* Right Col - Form */}
            <div className="profile-form-col">
              <div className="form-grid">
                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.fullName')} <span className="text-error">*</span></label>
                  <input type="text" className="input" defaultValue="Trần Thị Mai Lan" />
                </div>
                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.userId')}</label>
                  <input type="text" className="input input-readonly" defaultValue="GV-2026-088" readOnly />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.email')}</label>
                  <input type="email" className="input" defaultValue="teacher.lan@center.edu.vn" />
                </div>
                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.phone')}</label>
                  <input type="text" className="input" defaultValue="0987 654 321" />
                </div>
              </div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.role')} <span className="text-error">*</span></label>
                  <select className="input" defaultValue="gv">
                    <option value="gv">Giáo viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="profile-form-actions">
                <button className="btn btn-secondary">{t('profile.btnCancel')}</button>
                <button className="btn btn-primary" style={{ backgroundColor: '#0F172A' }}>{t('profile.btnSave')}</button>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="card card-flush">
          <div className="card-section-header flex-between">
            <div>
              <h3 className="headline-md text-on-surface card-section-header-title">{t('profile.cardSecurityTitle')}</h3>
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
            <div className="profile-password-section">
              
              {/* Form */}
              <div className="profile-password-form">
                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.currentPassword')} <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder={t('profile.currentPasswordPlaceholder')} />
                </div>
                
                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.newPassword')} <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder={t('profile.newPasswordPlaceholder')} />
                </div>

                <div className="form-field">
                  <label className="label-md text-on-surface font-semibold">{t('profile.confirmPassword')} <span className="text-error">*</span></label>
                  <input type="password" className="input" placeholder={t('profile.confirmPasswordPlaceholder')} />
                </div>

                <div className="flex pt-16">
                  <button className="btn btn-primary" style={{ backgroundColor: '#0F172A' }}>{t('profile.btnUpdatePassword')}</button>
                </div>
              </div>

              {/* Notification / Requirements Box */}
              <div className="profile-password-sidebar">
                <div className="profile-password-reqs">
                  <h4 className="headline-md">{t('profile.passwordRequirementsTitle')}</h4>
                  <ul className="body-md">
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqLength') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqUppercase') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqNumber') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqSpecial') }}></li>
                  </ul>
                  <div className="profile-hint-box">
                    <span className="profile-hint-icon">ℹ️</span>
                    <p className="label-md text-on-primary-container m-0" style={{ lineHeight: 1.5 }}>
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
