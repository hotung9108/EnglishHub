

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
      <div className="card card-flush">
        {/* Header Section */}
        <div className="card-section-header flex-between flex-wrap gap-16">
          <div>
            <h3 className="headline-md text-on-surface card-section-header-title">{t('students.subtitle')}</h3>
            <p className="label-md text-on-surface-variant">{t('students.breadcrumb')}</p>
          </div>
          <button className="btn btn-dark">
            {t('students.importExcel')}
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="p-24 flex-between flex-wrap gap-16">
          <div className="flex gap-16 flex-1 flex-wrap">
            <input type="text" className="input" placeholder={t('students.searchPlaceholder')} style={{ maxWidth: '400px' }} />
            <select className="input" style={{ maxWidth: '240px' }}>
              <option>{t('students.filterAllLevels')}</option>
              <option>IELTS</option>
              <option>TOEIC</option>
              <option>{t('students.filterGiaoTiep')}</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/admin/students/create')}>
            {t('students.addStudent')}
          </button>
        </div>

        {/* Table */}
        <div className="data-table-wrapper">
          <table className="data-table data-table-enhanced">
            <thead>
              <tr>
                <th>{t('students.colId')}</th>
                <th>{t('students.colName')}</th>
                <th>{t('students.colClass')}</th>
                <th>{t('students.colTarget')}</th>
                <th>{t('students.colProgress')}</th>
                <th>{t('students.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td className="font-medium">{row.id}</td>
                  <td className="font-semibold">{row.name}</td>
                  <td className="text-on-surface-variant">{row.class}</td>
                  <td className="text-on-surface-variant">{row.target}</td>
                  <td>
                    <span className={`badge ${row.progressStatus === 'good' ? 'badge-progress-good' : 'badge-progress-warning'}`}>
                      {row.progress}
                    </span>
                  </td>
                  <td>
                    <div className="cell-actions-wide">
                      <button className="label-md text-primary action-link-reset">{t('students.actionEdit')}</button>
                      <button className="label-md text-on-surface-variant action-link-reset">{t('students.actionHistory')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Cards Fallback */}
          <div className="mobile-card-list p-16">
            {data.map((row, i) => (
              <div key={i} className="card p-16 border">
                <div className="flex-between mb-12">
                  <div>
                    <strong>{row.name}</strong>
                    <div className="label-md text-on-surface-variant">{row.id}</div>
                  </div>
                  <span className={`badge ${row.progressStatus === 'good' ? 'badge-progress-good' : 'badge-progress-warning'}`}>{row.progress}</span>
                </div>
                <div className="body-md text-on-surface-variant mb-4">{row.class}</div>
                <div className="label-md text-on-surface-variant mb-16">{row.target}</div>
                <div className="flex gap-12">
                  <button className="btn btn-secondary btn-sm flex-1">{t('students.actionEdit')}</button>
                  <button className="btn btn-secondary btn-sm flex-1">{t('students.actionHistory')}</button>
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
