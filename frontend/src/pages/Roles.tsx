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
      <div className="card p-32">
        
        {/* Role Tabs */}
        <div className="flex gap-16 mb-32 flex-wrap">
          <button 
            className={`btn ${activeTab === 'admin' ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setActiveTab('admin')}
          >
            {t('roles.adminRole')}
          </button>
          <button 
            className={`btn ${activeTab === 'teacher' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('teacher')}
          >
            {t('roles.teacherRole')}
          </button>
          <button 
            className={`btn ${activeTab === 'student' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('student')}
          >
            {t('roles.studentRole')}
          </button>
        </div>

        <hr className="divider mb-32" />

        {/* Permissions Table Section */}
        <h3 className="label-md text-on-surface-variant text-uppercase mb-16 tracking-md">
          {t('roles.permHeading')}
        </h3>

        <div className="data-table-wrapper roles-table-wrapper">
          <table className="data-table data-table-enhanced">
            <thead>
              <tr>
                <th className="text-left">{t('roles.colModule')}</th>
                <th className="text-center">{t('roles.colRead')}</th>
                <th className="text-center">{t('roles.colWrite')}</th>
                <th className="text-center">{t('roles.colApprove')}</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((mod, i) => (
                <tr key={i}>
                  <td className="font-medium">{mod}</td>
                  <td className="text-center">
                    <input type="checkbox" checked={perms.read} readOnly className="roles-checkbox" />
                  </td>
                  <td className="text-center">
                    <input type="checkbox" checked={perms.write} readOnly className="roles-checkbox" />
                  </td>
                  <td className="text-center">
                    <input type="checkbox" checked={perms.approve} readOnly className="roles-checkbox" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="divider mb-24" />

        {/* Footer Actions */}
        <div className="flex-between flex-wrap gap-16">
          <span className="body-md text-on-surface-variant text-italic">
            {t('roles.note')}
          </span>
          <div className="flex gap-16">
            <button className="btn btn-outline">
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
