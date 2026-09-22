import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Teachers = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const teachers = [
    {
      id: 1,
      name: 'Trần Thị Mai Lan',
      status: 'Active',
      certs: 'IELTS 8.5 / TESOL Certified',
      classesCount: 4,
      pendingGrades: 24
    },
    {
      id: 2,
      name: 'Mark Reynolds',
      status: 'Active',
      certs: 'Native Speaker / CELTA',
      classesCount: 3,
      pendingGrades: 8
    },
    {
      id: 3,
      name: 'Nguyễn Thu Trang',
      status: 'Active',
      certs: 'TOEIC 990 / MA Linguistics',
      classesCount: 5,
      pendingGrades: 19
    },
    {
      id: 4,
      name: 'Hoàng Minh Đức',
      status: 'On Leave',
      certs: 'IELTS 8.0 / Writing Specialist',
      classesCount: 2,
      pendingGrades: 0
    }
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">{t('teachers.title')}</h1>
      </div>

      {/* Main Container */}
      <div className="card p-32">
        {/* Header Section */}
        <div className="flex-between flex-wrap gap-16 mb-32">
          <div>
            <h3 className="headline-md text-on-surface mb-4">{t('teachers.subtitle')}</h3>
            <p className="label-md text-on-surface-variant">{t('teachers.breadcrumb')}</p>
          </div>
          <button className="btn btn-dark" onClick={() => navigate('/admin/teachers/create')}>
            {t('teachers.addTeacher')}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-auto-fit-240 gap-24 mb-32">
          <div className="stat-card">
            <p className="label-md text-on-surface-variant stat-card-label">{t('teachers.statTotal')}</p>
            <div className="stat-card-value">
              <span className="display-lg text-primary">18</span>
              <span className="headline-md text-on-surface">{t('teachers.statTotalUnit')}</span>
            </div>
          </div>
          <div className="stat-card">
            <p className="label-md text-on-surface-variant stat-card-label">{t('teachers.statClasses')}</p>
            <div className="stat-card-value">
              <span className="display-lg text-on-surface">32</span>
              <span className="headline-md text-on-surface">{t('teachers.statClassesUnit')}</span>
            </div>
          </div>
          <div className="stat-card">
            <p className="label-md text-on-surface-variant stat-card-label">{t('teachers.statAvgGrades')}</p>
            <div className="stat-card-value">
              <span className="display-lg text-on-surface">145</span>
              <span className="headline-md text-on-surface">{t('teachers.statAvgGradesUnit')}</span>
            </div>
          </div>
        </div>

        {/* Teacher Cards Grid */}
        <div className="grid grid-auto-fit-360 gap-24">
          {teachers.map(teacher => (
            <div key={teacher.id} className="teacher-card-admin">
              {/* Card Header */}
              <div className="teacher-card-admin-header">
                <h4 className="headline-md text-on-surface">{teacher.name}</h4>
                <span className={`badge ${teacher.status === 'Active' ? 'badge-active' : 'badge-onleave'} border`}>
                  {teacher.status}
                </span>
              </div>
              <p className="body-md text-on-surface-variant mb-24">{teacher.certs}</p>

              {/* Divider */}
              <hr className="divider mb-24" />

              {/* Stats */}
              <div className="teacher-card-admin-stats">
                <p className="body-md text-on-surface-variant">{teacher.classesCount}{t('teachers.classesCountSuffix')}</p>
                <p className="body-md text-on-surface-variant">{teacher.pendingGrades}{t('teachers.pendingGradesSuffix')}</p>
              </div>

              {/* Actions */}
              <div className="teacher-card-admin-actions">
                <button className="btn btn-secondary" onClick={() => navigate(`/admin/teachers/${teacher.id}`)}>{t('teachers.viewProfile')}</button>
                <button className="btn btn-secondary">{t('teachers.assignClass')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Teachers;
