import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2 className="page-title">{t('adminDashboard.title')}</h2>
      </div>

      {/* Stat Cards - Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--gutter)', marginBottom: 'var(--section-gap)' }}>
        {/* Stat 1 */}
        <div className="glass-card">
          <div style={{ position: 'absolute', right: '-16px', top: '-16px', width: '96px', height: '96px', background: 'var(--primary-fixed)', opacity: 0.5, borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <p className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{t('adminDashboard.totalStudents')}</p>
              <h3 className="display-lg text-on-surface">1,248</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-default)', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>{t('adminDashboard.studentUnit')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
            <span className="label-md">{t('adminDashboard.studentGrowth')}</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-card">
          <div style={{ position: 'absolute', right: '-16px', top: '-16px', width: '96px', height: '96px', background: 'var(--secondary-fixed)', opacity: 0.5, borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <p className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{t('adminDashboard.totalTeachers')}</p>
              <h3 className="display-lg text-on-surface">45</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-default)', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)', fontWeight: 700, fontSize: '14px' }}>{t('adminDashboard.teacherUnit')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)' }}>
            <span className="label-md">{t('adminDashboard.teacherGrowth')}</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-card">
          <div style={{ position: 'absolute', right: '-16px', top: '-16px', width: '96px', height: '96px', background: 'var(--tertiary-fixed)', opacity: 0.5, borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <p className="label-md text-on-surface-variant" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{t('adminDashboard.activeClasses')}</p>
              <h3 className="display-lg text-on-surface">32</h3>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-default)', background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tertiary)', fontWeight: 700, fontSize: '14px' }}>{t('adminDashboard.classUnit')}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)' }}>
            <span className="label-md">{t('adminDashboard.classGrowth')}</span>
          </div>
        </div>
      </div>

      {/* Complex Layout: Activities + Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gutter)' }}>
        {/* Recent Activities */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="headline-md text-on-surface">{t('adminDashboard.recentActivities')}</h3>
            <a href="#" className="label-md text-primary" style={{ textDecoration: 'none' }}>{t('adminDashboard.viewAll')}</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Activity 1 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>+HV</div>
              <div>
                <p className="body-md"><strong>Trần Thị Mai Lan</strong> {t('adminDashboard.activity1')} <span className="text-primary" style={{ cursor: 'pointer' }}>ENG-IELTS-6.5A</span>.</p>
                <p className="label-md text-on-surface-variant" style={{ marginTop: '4px' }}>{t('adminDashboard.time1')}</p>
              </div>
            </div>
            {/* Activity 2 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'var(--error-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-error-container)', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>!!</div>
              <div>
                <p className="body-md">{t('adminDashboard.activity2Start')} <span className="text-primary" style={{ cursor: 'pointer' }}>ENG-TOEIC-750</span> {t('adminDashboard.activity2End')}</p>
                <p className="label-md text-on-surface-variant" style={{ marginTop: '4px' }}>{t('adminDashboard.time2')}</p>
              </div>
            </div>
            {/* Activity 3 */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', background: 'var(--secondary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-secondary-container)', fontWeight: 600, fontSize: '12px', flexShrink: 0 }}>OK</div>
              <div>
                <p className="body-md">{t('adminDashboard.activity3Start')} <span className="text-primary" style={{ cursor: 'pointer' }}>IELTS Pre-Intermediate Khóa 12</span> {t('adminDashboard.activity3End')}</p>
                <p className="label-md text-on-surface-variant" style={{ marginTop: '4px' }}>{t('adminDashboard.time3')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
          {/* Create Quick */}
          <div style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderRadius: 'var(--radius-xl)', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <h3 className="headline-md" style={{ fontWeight: 700, marginBottom: '8px' }}>{t('adminDashboard.quickCreate')}</h3>
            <p className="body-md" style={{ color: 'var(--primary-fixed-dim)', marginBottom: '24px' }}>{t('adminDashboard.quickCreateDesc')}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate('/admin/classes/create')} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-default)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--on-primary)', transition: 'background 0.2s', cursor: 'pointer' }}>
                <span className="label-md" style={{ flex: 1, textAlign: 'left' }}>{t('adminDashboard.addClass')}</span>
                <span style={{ fontSize: '14px' }}>&rarr;</span>
              </button>
              <button onClick={() => navigate('/admin/students/create')} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 'var(--radius-default)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--on-primary)', transition: 'background 0.2s', cursor: 'pointer' }}>
                <span className="label-md" style={{ flex: 1, textAlign: 'left' }}>{t('adminDashboard.addStudent')}</span>
                <span style={{ fontSize: '14px' }}>&rarr;</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <h3 className="headline-md text-on-surface" style={{ marginBottom: '16px' }}>{t('adminDashboard.systemStatus')}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: 'var(--radius-full)', background: 'var(--secondary)' }}></div>
              <span className="label-md text-on-surface">{t('adminDashboard.serverOnline')}</span>
            </div>
            <p className="body-md text-on-surface-variant" style={{ fontSize: '14px' }}>{t('adminDashboard.lastUpdated')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
