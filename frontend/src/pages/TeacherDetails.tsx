import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const TeacherDetails = () => {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  // Giả lập dữ liệu giáo viên dựa theo ID
  const teacher = {
    id: id || '1',
    name: 'Trần Thị Mai Lan',
    code: 'GV-2026-088',
    email: 'teacher.lan@center.edu.vn',
    phone: '0987 654 321',
    role: 'teacher',
    status: 'Active',
    certs: 'IELTS 8.5 / TESOL Certified',
    classesCount: 4,
    pendingGrades: 24,
  };

  const activeClasses = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5',
      students: 24,
      schedule: 'T2-T4-T6 (18:00 - 20:00)',
      status: 'Đang mở'
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc 750+',
      students: 18,
      schedule: 'T3-T5-T7 (19:30 - 21:00)',
      status: 'Đang mở'
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/admin/teachers')}
          style={{ padding: '8px 12px' }}
        >
          &larr; {t('teacherDetails.btnBack')}
        </button>
        <h1 className="page-title">{t('teacherDetails.titlePrefix')}{teacher.name}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Profile Info Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>{t('teacherDetails.infoRoleTitle')}</h3>
              <p className="label-md text-on-surface-variant">{t('teacherDetails.infoRoleSubtitle')}</p>
            </div>
            <div>
              <span className={`badge ${teacher.status === 'Active' ? 'badge-active' : 'badge-onleave'}`} style={{ border: '1px solid var(--outline-variant)', padding: '6px 12px', fontSize: '14px' }}>
                {t('teacherDetails.statusPrefix')}{teacher.status === 'Active' ? t('active') : teacher.status}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', padding: '32px', gap: '32px' }}>
            {/* Left Col - Avatar & Danger Actions */}
            <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '32px 24px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
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
                  {teacher.name.split(' ').map(n => n[0]).slice(-2).join('')}
                </div>
                <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', textAlign: 'center' }}>{teacher.name}</h3>
                <span className="badge" style={{ backgroundColor: '#0F172A', color: 'white', borderRadius: 'var(--radius-full)', padding: '4px 12px', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {t('profile.role').toUpperCase()}
                </span>
                <p className="body-sm text-on-surface-variant" style={{ textAlign: 'center' }}>{teacher.certs}</p>
              </div>


            </div>

            {/* Right Col - Form */}
            <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.fullName')} <span className="text-error">*</span></label>
                  <input type="text" className="input" defaultValue={teacher.name} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.userId')}</label>
                  <input type="text" className="input" defaultValue={teacher.code} readOnly style={{ backgroundColor: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.email')}</label>
                  <input type="email" className="input" defaultValue={teacher.email} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.phone')}</label>
                  <input type="text" className="input" defaultValue={teacher.phone} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('profile.role')} <span className="text-error">*</span></label>
                  <select className="input" defaultValue={teacher.role}>
                    <option value="student">Học viên</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="label-md text-on-surface" style={{ fontWeight: 600 }}>{t('teacherDetails.statusPrefix').replace(': ', '')} <span className="text-error">*</span></label>
                  <select className="input" defaultValue="active">
                    <option value="active">{t('active')}</option>
                    <option value="onleave">Nghỉ phép</option>
                    <option value="disabled">Vô hiệu hóa</option>
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

        {/* Classes Taught Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>{t('teacherDetails.classesTitle')}</h3>
              <p className="label-md text-on-surface-variant">{t('teacherDetails.classesSubtitle')}</p>
            </div>
            <button className="btn btn-secondary">{t('teacherDetails.btnAssignClass')}</button>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {activeClasses.map((cls) => (
                <div key={cls.code} style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="badge badge-primary">{cls.code}</span>
                    <span className="badge" style={{ backgroundColor: '#C3E9C8', color: '#006C49', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#006C49' }}></span>
                      {t('active')}
                    </span>
                  </div>
                  <h4 className="headline-md text-on-surface" style={{ marginBottom: '12px', fontSize: '16px' }}>{cls.name}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px' }}>👥</span> {t('teacherDetails.classSizePrefix')} {cls.students}
                    </p>
                    <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px' }}>🕒</span> {cls.schedule}
                    </p>
                  </div>
                  <button className="btn" style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid var(--outline-variant)', marginTop: 'auto' }}>
                    {t('teacherDetails.btnViewClass')}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>{t('teacherDetails.passwordChangeTitle')}</h3>
              <p className="label-md text-on-surface-variant">{t('teacherDetails.passwordChangeSubtitle')}</p>
            </div>
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              {showPasswordChange ? t('profile.btnClose') : t('teacherDetails.btnChangePassword')}
            </button>
          </div>
          
          {showPasswordChange && (
            <div style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px', backgroundColor: 'var(--surface-container-lowest)' }}>
              
              <div style={{ flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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

              <div style={{ flex: '1', minWidth: '250px' }}>
                <div style={{ backgroundColor: 'var(--primary-container)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--primary-fixed-dim)' }}>
                  <h4 className="headline-md" style={{ marginBottom: '16px', color: '#FFFFFF' }}>{t('profile.passwordRequirementsTitle')}</h4>
                  <ul className="body-md" style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', color: '#FFFFFF' }}>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqLength') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqUppercase') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqNumber') }}></li>
                    <li dangerouslySetInnerHTML={{ __html: t('profile.reqSpecial') }}></li>
                  </ul>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Danger Zone Card */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #DC2626', backgroundColor: '#FFFFFF' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>{t('teacherDetails.dangerZoneTitle')}</h3>
              <p className="label-md text-on-surface-variant">{t('teacherDetails.dangerZoneSubtitle')}</p>
            </div>
            <button 
              className="btn btn-danger" 
              onClick={() => setShowDangerZone(!showDangerZone)}
            >
              {showDangerZone ? t('profile.btnClose') : t('teacherDetails.btnManageAccount')}
            </button>
          </div>
          
          {showDangerZone && (
            <div style={{ padding: '32px', display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
              <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h4 className="headline-md text-on-surface" style={{ marginBottom: '8px' }}>{t('teacherDetails.disableTitle')}</h4>
                <p className="body-md text-on-surface-variant" style={{ marginBottom: '16px' }}>{t('teacherDetails.disableDesc')}</p>
                <button className="btn btn-danger">
                  {t('teacherDetails.btnDisable')}
                </button>
              </div>
              <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', borderLeft: '1px solid var(--outline-variant)', paddingLeft: '32px' }}>
                <h4 className="headline-md text-on-surface" style={{ marginBottom: '8px' }}>{t('teacherDetails.deleteTitle')}</h4>
                <p className="body-md text-on-surface-variant" style={{ marginBottom: '16px' }}>{t('teacherDetails.deleteDesc')}</p>
                <button className="btn btn-danger">
                  {t('teacherDetails.btnDelete')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDetails;
