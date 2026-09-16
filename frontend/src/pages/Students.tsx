

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Students = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const data = [
    { id: 'HV-8801', name: 'Alice Johnson', class: 'ENG-IELTS-6.5A', target: 'Target: 7.0 (Đầu vào 5.5)', progress: '14/15 Bài', progressStatus: 'good' },
    { id: 'HV-8802', name: 'David Pham', class: 'ENG-IELTS-6.5A', target: 'Target: 6.5 (Đầu vào 5.0)', progress: '8/15 Bài', progressStatus: 'warning' },
    { id: 'HV-8803', name: 'Lê Bảo Trâm', class: 'ENG-TOEIC-750', target: 'Target: 800 (Đầu vào 600)', progress: '12/12 Bài', progressStatus: 'good' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('students.title')}</h1>
      </div>

      {/* Content Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header Section */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div>
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '4px' }}>{t('students.subtitle')}</h3>
            <p className="label-md text-on-surface-variant">{t('students.breadcrumb')}</p>
          </div>
          <button className="btn btn-secondary" style={{ backgroundColor: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)', border: 'none' }}>
            {t('students.importExcel')}
          </button>
        </div>

        {/* Filters & Actions */}
        <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
            <input type="text" className="input" placeholder={t('students.searchPlaceholder')} style={{ maxWidth: '400px' }} />
            <select className="input" style={{ maxWidth: '240px' }}>
              <option>{t('students.filterAllLevels')}</option>
              <option>IELTS</option>
              <option>TOEIC</option>
              <option>{t('students.filterGiaoTiep')}</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ backgroundColor: 'var(--primary)' }} onClick={() => navigate('/admin/students/create')}>
            {t('students.addStudent')}
          </button>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--surface-container-low)' }}>
              <tr>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{t('students.colId')}</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{t('students.colName')}</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{t('students.colClass')}</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{t('students.colTarget')}</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{t('students.colProgress')}</th>
                <th style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{t('students.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>{row.id}</td>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{row.name}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{row.class}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)' }}>{row.target}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span className={`badge ${row.progressStatus === 'good' ? 'badge-progress-good' : 'badge-progress-warning'}`}>
                      {row.progress}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button className="label-md text-primary" style={{ padding: 0, cursor: 'pointer' }}>{t('students.actionEdit')}</button>
                      <button className="label-md text-on-surface-variant" style={{ padding: 0, cursor: 'pointer' }}>{t('students.actionHistory')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards Fallback */}
          <div className="mobile-card-list" style={{ padding: '16px' }}>
            {data.map((row, i) => (
              <div key={i} className="card" style={{ padding: '16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '16px' }}>{row.name}</strong>
                    <div className="label-md text-on-surface-variant">{row.id}</div>
                  </div>
                  <span className={`badge ${row.progressStatus === 'good' ? 'badge-progress-good' : 'badge-progress-warning'}`}>{row.progress}</span>
                </div>
                <div className="body-md text-on-surface-variant" style={{ marginBottom: '4px' }}>{row.class}</div>
                <div className="label-md text-on-surface-variant" style={{ marginBottom: '16px' }}>{row.target}</div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', flex: 1 }}>{t('students.actionEdit')}</button>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', flex: 1 }}>{t('students.actionHistory')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;
