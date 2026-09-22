import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
interface ClassItem {
  code: string;
  name: string;
  teacher: string;
  students?: number;
  schedule?: string;
  status: string;
  completedDate?: string;
}

const Classes = () => {
  const { t } = useLanguage();
  const activeClasses = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5',
      teacher: 'Trần Thị Mai Lan',
      students: 24,
      schedule: 'T2-T4-T6 (18:00 - 20:00)',
      status: 'Đang mở'
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc 750+',
      teacher: 'Nguyễn Thu Trang',
      students: 18,
      schedule: 'T3-T5-T7 (19:30 - 21:00)',
      status: 'Đang mở'
    },
    {
      code: 'ENG-COMM-B2',
      name: 'Tiếng Anh Giao tiếp Chuyên sâu',
      teacher: 'Mark Reynolds',
      students: 12,
      schedule: 'T7-CN (09:00 - 11:30)',
      status: 'Đang mở'
    }
  ];

  const pastClasses = [
    {
      code: 'ENG-IELTS-5.0',
      name: 'IELTS Pre-Intermediate Khóa 12',
      teacher: 'Hoàng Minh Đức',
      students: 20,
      completedDate: '08/2023',
      status: 'Đã kết thúc'
    }
  ];

  const renderClassCard = (cls: ClassItem, isPast = false) => {
    return (
      <div key={cls.code} className={`card class-card ${isPast ? 'past' : 'active-class'}`}>
        {/* Top Badges */}
        <div className="class-card-badges">
          <span className={`badge badge-primary ${isPast ? 'badge-status-ended' : ''}`}>{cls.code}</span>
          {isPast ? (
            <span className="badge badge-status-ended">
              <span className="status-dot status-dot-ended"></span>
              {cls.status}
            </span>
          ) : (
            <span className="badge badge-status-active">
              <span className="status-dot status-dot-active"></span>
              {cls.status}
            </span>
          )}
        </div>

        {/* Content */}
        <h3 className="headline-md text-on-surface mb-16" style={{ lineHeight: 1.4, flex: 1 }}>{cls.name}</h3>
        
        <p className="body-md text-on-surface-variant mb-16">
          {t('adminClasses.teacherPrefix')}{cls.teacher}
        </p>
        
        <div className="class-card-meta">
          <p className="body-md text-on-surface-variant class-card-meta-item">
            <span className="class-card-meta-icon">👥</span> {t('adminClasses.studentsPrefix')}{cls.students}{t('adminClasses.studentsSuffix')}
          </p>
          {isPast ? (
            <p className="body-md text-on-surface-variant class-card-meta-item">
              <span className="class-card-meta-icon">📅</span> {t('adminClasses.completedPrefix')}{cls.completedDate}
            </p>
          ) : (
            <p className="body-md text-on-surface-variant class-card-meta-item">
              <span className="class-card-meta-icon">🕒</span> {t('adminClasses.schedulePrefix')}{cls.schedule}
            </p>
          )}
        </div>

        {/* Action Button */}
        <Link 
          to={`/admin/classes/${cls.code}`}
          className={`btn class-card-action ${isPast ? 'past' : ''}`}
        >
          {isPast ? t('adminClasses.viewDetails') : t('adminClasses.manageClass')}
        </Link>
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header flex-between-start flex-wrap gap-16">
        <div>
          <h2 className="page-title">{t('adminClasses.title')}</h2>
        </div>
        <Link to="/admin/classes/create" className="btn btn-primary no-decoration" style={{ padding: '10px 24px' }}>
          {t('adminClasses.createClass')}
        </Link>
      </div>

      <hr className="section-divider" />

      {/* Grid container */}
      <div className="grid grid-auto-fill-320 gap-24">
        {activeClasses.map((cls: ClassItem) => renderClassCard(cls, false))}
        {pastClasses.map((cls: ClassItem) => renderClassCard(cls, true))}
      </div>
    </div>
  );
};

export default Classes;
