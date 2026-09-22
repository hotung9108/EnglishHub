import { useLanguage } from '../contexts/LanguageContext';

const Accounts = () => {
  const { t } = useLanguage();
  const data = [
    { id: 'HV-8801', avatar: 'AJ', name: 'Alice Johnson', email: 'alice@center.edu.vn', phone: '0987-654-321', role: 'Student', status: 'Active' },
    { id: 'GV-001', avatar: 'TL', name: 'Trần Thị Mai Lan', email: 'mailan@center.edu.vn', phone: '0912-345-678', role: 'Teacher', status: 'Active' },
    { id: 'HV-8802', avatar: 'DP', name: 'David Pham', email: 'david@center.edu.vn', phone: '0933-111-222', role: 'Student', status: 'Blocked' },
    { id: 'AD-001', avatar: 'NV', name: 'Nguyễn Văn Hùng', email: 'hung@center.edu.vn', phone: '0944-555-666', role: 'Admin', status: 'Active' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">{t('accounts.title')}</h2>
      </div>

      {/* Content Card */}
      <div className="card">
        <div className="flex-between flex-wrap gap-16 mb-24">
          <div>
            <h3 className="headline-md text-on-surface mb-4">{t('accounts.subtitle')}</h3>
            <p className="label-md text-on-surface-variant">{t('accounts.breadcrumb')}</p>
          </div>
          <button className="btn btn-primary">
            {t('accounts.addAccount')}
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <input type="text" className="input" placeholder={t('accounts.searchPlaceholder')} style={{ maxWidth: '320px' }} />
          <select className="input" style={{ maxWidth: '200px' }}>
            <option>{t('accounts.filterAllRoles')}</option>
            <option>Student</option>
            <option>Teacher</option>
            <option>Admin</option>
          </select>
          <select className="input" style={{ maxWidth: '200px' }}>
            <option>{t('accounts.filterAllStatuses')}</option>
            <option>Active</option>
            <option>Blocked</option>
          </select>
          <span className="label-md text-on-surface-variant items-center" style={{ alignSelf: 'center' }}>{t('accounts.totalAccounts')}{data.length}{t('accounts.totalAccountsSuffix')}</span>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('accounts.colIdAvatar')}</th>
                <th>{t('accounts.colName')}</th>
                <th>{t('accounts.colEmailPhone')}</th>
                <th>{t('accounts.colRole')}</th>
                <th>{t('accounts.colStatus')}</th>
                <th>{t('accounts.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>
                    <div className="avatar-cell">
                      <div className="topbar-avatar">{row.avatar}</div>
                      <span className="label-md text-on-surface-variant">{row.id}</span>
                    </div>
                  </td>
                  <td><strong>{row.name}</strong></td>
                  <td>
                    <div>{row.email}</div>
                    <div className="label-md text-on-surface-variant">{row.phone}</div>
                  </td>
                  <td>
                    <span className={row.role === 'Admin' ? 'badge badge-primary' : 'badge badge-role'}>
                      {row.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${row.status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button className="label-md text-primary action-link">{t('accounts.actionEdit')}</button>
                      <button className="label-md text-error action-link">
                        {row.status === 'Active' ? t('accounts.actionLock') : t('accounts.actionUnlock')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="mobile-card-list">
            {data.map((row, i) => (
              <div key={i} className="card p-16">
                <div className="flex-between mb-12">
                  <div className="flex items-center gap-12">
                    <div className="topbar-avatar">{row.avatar}</div>
                    <div>
                      <strong>{row.name}</strong>
                      <div className="label-md text-on-surface-variant">{row.id}</div>
                    </div>
                  </div>
                  <span className={`badge ${row.status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>{row.status}</span>
                </div>
                <div className="label-md text-on-surface-variant mb-8">{row.email} - {row.phone}</div>
                <div className="flex-between">
                  <span className={row.role === 'Admin' ? 'badge badge-primary' : 'badge badge-role'}>{row.role}</span>
                  <div className="cell-actions">
                    <button className="btn btn-secondary btn-sm">{t('accounts.actionEdit')}</button>
                    <button className="btn btn-error btn-sm">{row.status === 'Active' ? t('accounts.actionLock') : t('accounts.actionUnlock')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span className="label-md text-on-surface-variant">{t('accounts.paginationText1')}1 - 4{t('accounts.paginationText2')}{data.length}{t('accounts.paginationText3')}</span>
          <div className="pagination-buttons">
            <button className="btn btn-secondary btn-page">&lt;</button>
            <button className="btn btn-primary btn-page">1</button>
            <button className="btn btn-secondary btn-page">2</button>
            <button className="btn btn-secondary btn-page">3</button>
            <button className="btn btn-secondary btn-page">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;
