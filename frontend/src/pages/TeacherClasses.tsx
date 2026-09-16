import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
interface TeacherClassItem {
  code: string;
  name: string;
  teacher: string;
  room: string;
  schedule?: string;
  status: string;
  completedDate?: string;
  stats: {
    assigned: number;
    pending: number;
    avgScore: number;
  };
}

const TeacherClasses = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const activeClasses = [
    {
      code: 'ENG-IELTS-6.5A',
      name: 'IELTS Intensive Band 6.5 - 7.5',
      teacher: 'Cô Mai Lan',
      room: 'Online Room #04',
      schedule: 'T2 - T4 - T6 (18:00 - 20:00)',
      status: 'Đang diễn ra',
      stats: {
        assigned: 15,
        pending: 2,
        avgScore: 7.2
      }
    },
    {
      code: 'ENG-GRAM-ADV',
      name: 'Chuyên đề Ngữ pháp & Viết học thuật',
      teacher: 'Thầy Hoàng Minh Đức',
      room: 'Room 202',
      schedule: 'T3 - T5 - T7 (19:30 - 21:00)',
      status: 'Đang diễn ra',
      stats: {
        assigned: 8,
        pending: 0,
        avgScore: 8.0
      }
    },
    {
      code: 'ENG-TOEIC-750',
      name: 'Luyện thi TOEIC Cấp tốc Mục tiêu 750+',
      teacher: 'Cô Mai Lan',
      room: 'Online Room #02',
      schedule: 'T7 - CN (09:00 - 11:30)',
      status: 'Đang diễn ra',
      stats: {
        assigned: 12,
        pending: 5,
        avgScore: 7.8
      }
    }
  ];

  const pastClasses = [
    {
      code: 'ENG-IELTS-5.0',
      name: 'IELTS Pre-Intermediate Khóa 12',
      teacher: 'Cô Mai Lan',
      room: 'Room 101',
      completedDate: 'Đã hoàn thành 30/30 buổi',
      status: 'Đã kết thúc',
      stats: {
        assigned: 20,
        pending: 0,
        avgScore: 7.5
      }
    }
  ];

  const renderClassCard = (cls: TeacherClassItem, isPast = false) => {
    return (
      <div key={cls.code} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', border: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span className="badge" style={{ backgroundColor: '#0F172A', color: 'white', fontWeight: 600 }}>{cls.code}</span>
          {isPast ? (
            <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--on-surface-variant)', border: 'none' }}>
              {cls.status}
            </span>
          ) : (
            <span className="badge" style={{ backgroundColor: '#C3E9C8', color: '#006C49', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#006C49' }}></span>
              {cls.status}
            </span>
          )}
        </div>

        {/* Content */}
        <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px', lineHeight: 1.4 }}>{cls.name}</h3>

        <p className="body-md text-on-surface-variant" style={{ marginBottom: '4px' }}>
          {t('teacherClasses.teacherPrefix')}{cls.teacher}{t('teacherClasses.roomPrefix')}{cls.room}
        </p>

        {isPast ? (
          <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>📅</span> {cls.completedDate}
          </p>
        ) : (
          <p className="body-md text-on-surface-variant" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <span style={{ display: 'inline-block', width: '20px', textAlign: 'center' }}>🕒</span> Lịch: {cls.schedule}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', border: '1px solid var(--outline-variant)', borderRadius: 'var(--radius-lg)', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid var(--outline-variant)' }}>
            <span className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', fontSize: '11px', marginBottom: '4px' }}>{t('teacherClasses.statAssignments')}</span>
            <span className="headline-md text-on-surface">{cls.stats.assigned}{t('teacherClasses.statAssignedUnit')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid var(--outline-variant)' }}>
            <span className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', fontSize: '11px', marginBottom: '4px' }}>{t('teacherClasses.statPending')}</span>
            <span className="headline-md" style={{ color: cls.stats.pending > 0 ? 'var(--error)' : 'var(--on-surface-variant)' }}>{cls.stats.pending}{t('teacherClasses.statPendingUnit')}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', fontSize: '11px', marginBottom: '4px' }}>{t('teacherClasses.statAvgScore')}</span>
            <span className="headline-md" style={{ color: cls.stats.avgScore >= 7.0 ? '#006C49' : 'var(--on-surface)' }}>{cls.stats.avgScore.toFixed(1)}/10</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => !isPast && navigate(`/teacher/classes/${cls.code}/progress`)}
          className="btn" 
          style={{
          width: '100%',
          backgroundColor: isPast ? 'var(--surface-container-low)' : '#0F172A',
          color: isPast ? 'var(--on-surface)' : 'white',
          border: isPast ? '1px solid var(--outline-variant)' : 'none',
          marginTop: 'auto',
          padding: '12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          cursor: isPast ? 'default' : 'pointer'
        }}>
          {isPast ? t('teacherClasses.btnReviewPast') : t('teacherClasses.btnViewClass')}
        </button>
      </div>
    );
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', paddingBottom: '24px' }}>
        <div>
          <h2 className="page-title">{t('teacherClasses.title')}</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ backgroundColor: 'transparent', border: '1px solid var(--outline-variant)' }}>
            <span style={{ marginRight: '8px' }}></span>{t('teacherClasses.btnQuickJoin')}
          </button>
          <button className="btn btn-primary" style={{ backgroundColor: '#0F172A' }}>
            {t('teacherClasses.btnCreateClass')}
          </button>
        </div>
      </div>

      <hr style={{ borderTop: '1px solid var(--outline-variant)', borderBottom: 'none', margin: '0 0 24px 0', opacity: 0.5 }} />

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--outline-variant)' }}>
        <input type="text" className="input" placeholder={t('teacherClasses.searchPlaceholder')} style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--surface-container-lowest)' }} />
        <select className="input" style={{ width: '200px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <option>{t('teacherClasses.filterAllStatus')}</option>
          <option>{t('teacherClasses.statusOngoing')}</option>
          <option>{t('teacherClasses.statusCompleted')}</option>
        </select>
        <select className="input" style={{ width: '200px', backgroundColor: 'var(--surface-container-lowest)' }}>
          <option>{t('teacherClasses.filterCurrentSemester')}</option>
          <option>{t('teacherClasses.filterPreviousSemester')}</option>
        </select>
      </div>

      {/* Main Content Area */}
      <div className="card" style={{ padding: '32px', border: '1px solid var(--outline-variant)', boxShadow: 'none' }}>
        <h3 className="headline-md text-on-surface" style={{ marginBottom: '8px' }}>{t('teacherClasses.myClassesTitle')}</h3>
        <p className="label-md text-on-surface-variant" style={{ marginBottom: '32px' }}>{t('teacherClasses.myClassesSubtitle')}</p>

        {/* Grid container */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
          {activeClasses.map((cls: TeacherClassItem) => renderClassCard(cls, false))}
          {pastClasses.map((cls: TeacherClassItem) => renderClassCard(cls, true))}
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;
