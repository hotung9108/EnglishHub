import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Roles = ({ role = 'admin' }: { role?: string }) => {
  const [activeTab, setActiveTab] = useState(role);
  const { t } = useLanguage();

  const modules = [
    t('roles.mod1'),
    t('roles.mod2'),
    t('roles.mod3'),
    t('roles.mod4'),
    t('roles.mod5')
  ];

  const getPermissions = (role: string) => {
    // Mock permissions based on role
    if (role === 'admin') {
      return { read: true, write: true, approve: true };
    }
    if (role === 'teacher') {
      return { read: true, write: false, approve: false }; // Example
    }
    return { read: false, write: false, approve: false }; // Student
  };

  const perms = getPermissions(activeTab);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">{t('roles.title')}</h2>
      </div>

      {/* Main Container */}
      <div className="card" style={{ padding: '32px' }}>
        
        {/* Role Tabs */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'admin' ? 'btn-primary' : ''}`} 
            style={activeTab !== 'admin' ? { backgroundColor: 'transparent', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' } : {}}
            onClick={() => setActiveTab('admin')}
          >
            {t('roles.adminRole')}
          </button>
          <button 
            className={`btn ${activeTab === 'teacher' ? 'btn-primary' : ''}`}
            style={activeTab !== 'teacher' ? { backgroundColor: 'transparent', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' } : {}}
            onClick={() => setActiveTab('teacher')}
          >
            {t('roles.teacherRole')}
          </button>
          <button 
            className={`btn ${activeTab === 'student' ? 'btn-primary' : ''}`}
            style={activeTab !== 'student' ? { backgroundColor: 'transparent', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' } : {}}
            onClick={() => setActiveTab('student')}
          >
            {t('roles.studentRole')}
          </button>
        </div>

        <hr style={{ borderTop: '1px solid var(--outline-variant)', borderBottom: 'none', marginBottom: '32px', opacity: 0.5 }} />

        {/* Permissions Table Section */}
        <h3 className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
          {t('roles.permHeading')}
        </h3>

        <div className="data-table-wrapper" style={{ marginBottom: '40px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--on-surface-variant)' }}>{t('roles.colModule')}</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>{t('roles.colRead')}</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>{t('roles.colWrite')}</th>
                <th style={{ padding: '16px 24px', textAlign: 'center', color: 'var(--on-surface-variant)' }}>{t('roles.colApprove')}</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod, i) => (
                <tr key={i}>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>{mod}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <input type="checkbox" checked={perms.read} readOnly style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <input type="checkbox" checked={perms.write} readOnly style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                    <input type="checkbox" checked={perms.approve} readOnly style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr style={{ borderTop: '1px solid var(--outline-variant)', borderBottom: 'none', marginBottom: '24px', opacity: 0.5 }} />

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span className="body-md text-on-surface-variant" style={{ fontStyle: 'italic' }}>
            {t('roles.note')}
          </span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn" style={{ backgroundColor: 'transparent', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)' }}>
              {t('roles.restoreDefault')}
            </button>
            <button className="btn btn-primary">
              {t('roles.updatePerms')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Roles;
