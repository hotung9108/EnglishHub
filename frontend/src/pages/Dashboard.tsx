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
      <div className="dashboard-stat-grid">
        {/* Stat 1 */}
        <div className="glass-card">
          <div className="dashboard-glow dashboard-glow-primary"></div>
          <div className="dashboard-stat-header">
            <div>
              <p className="label-md text-on-surface-variant dashboard-stat-label">{t('adminDashboard.totalStudents')}</p>
              <h3 className="display-lg text-on-surface">1,248</h3>
            </div>
            <div className="dashboard-stat-icon" style={{ color: 'var(--primary)' }}>{t('adminDashboard.studentUnit')}</div>
          </div>
          <div className="dashboard-stat-footer" style={{ color: 'var(--secondary)' }}>
            <span className="label-md">{t('adminDashboard.studentGrowth')}</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="glass-card">
          <div className="dashboard-glow dashboard-glow-secondary"></div>
          <div className="dashboard-stat-header">
            <div>
              <p className="label-md text-on-surface-variant dashboard-stat-label">{t('adminDashboard.totalTeachers')}</p>
              <h3 className="display-lg text-on-surface">45</h3>
            </div>
            <div className="dashboard-stat-icon" style={{ color: 'var(--secondary)' }}>{t('adminDashboard.teacherUnit')}</div>
          </div>
          <div className="dashboard-stat-footer text-on-surface-variant">
            <span className="label-md">{t('adminDashboard.teacherGrowth')}</span>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="glass-card">
          <div className="dashboard-glow dashboard-glow-tertiary"></div>
          <div className="dashboard-stat-header">
            <div>
              <p className="label-md text-on-surface-variant dashboard-stat-label">{t('adminDashboard.activeClasses')}</p>
              <h3 className="display-lg text-on-surface">32</h3>
            </div>
            <div className="dashboard-stat-icon" style={{ color: 'var(--tertiary)' }}>{t('adminDashboard.classUnit')}</div>
          </div>
          <div className="dashboard-stat-footer text-on-surface-variant">
            <span className="label-md">{t('adminDashboard.classGrowth')}</span>
          </div>
        </div>
      </div>

      {/* Complex Layout: Activities + Quick Actions */}
      <div className="dashboard-layout-2-1">
        {/* Recent Activities */}
        <div className="card">
          <div className="dashboard-section-header">
            <h3 className="headline-md text-on-surface">{t('adminDashboard.recentActivities')}</h3>
            <a href="#" className="label-md text-primary no-decoration">{t('adminDashboard.viewAll')}</a>
          </div>
          <div className="dashboard-activity-list">
            {/* Activity 1 */}
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-avatar" style={{ background: 'var(--surface-container-highest)', color: 'var(--primary)' }}>+HV</div>
              <div>
                <p className="body-md"><strong>Trần Thị Mai Lan</strong> {t('adminDashboard.activity1')} <span className="text-primary cursor-pointer">ENG-IELTS-6.5A</span>.</p>
                <p className="label-md text-on-surface-variant mt-4">{t('adminDashboard.time1')}</p>
              </div>
            </div>
            {/* Activity 2 */}
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-avatar" style={{ background: 'var(--error-container)', color: 'var(--on-error-container)' }}>!!</div>
              <div>
                <p className="body-md">{t('adminDashboard.activity2Start')} <span className="text-primary cursor-pointer">ENG-TOEIC-750</span> {t('adminDashboard.activity2End')}</p>
                <p className="label-md text-on-surface-variant mt-4">{t('adminDashboard.time2')}</p>
              </div>
            </div>
            {/* Activity 3 */}
            <div className="dashboard-activity-item">
              <div className="dashboard-activity-avatar" style={{ background: 'var(--secondary-container)', color: 'var(--on-secondary-container)' }}>OK</div>
              <div>
                <p className="body-md">{t('adminDashboard.activity3Start')} <span className="text-primary cursor-pointer">IELTS Pre-Intermediate Khóa 12</span> {t('adminDashboard.activity3End')}</p>
                <p className="label-md text-on-surface-variant mt-4">{t('adminDashboard.time3')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Column */}
        <div className="flex-col gap-gutter">
          {/* Create Quick */}
          <div className="dashboard-quick-create">
            <h3 className="headline-md dashboard-quick-create-title">{t('adminDashboard.quickCreate')}</h3>
            <p className="body-md dashboard-quick-create-desc">{t('adminDashboard.quickCreateDesc')}</p>
            <div className="flex-col gap-12">
              <button onClick={() => navigate('/admin/classes/create')} className="dashboard-quick-action-btn">
                <span className="label-md flex-1 text-left">{t('adminDashboard.addClass')}</span>
                <span className="dashboard-quick-action-arrow">&rarr;</span>
              </button>
              <button onClick={() => navigate('/admin/students/create')} className="dashboard-quick-action-btn">
                <span className="label-md flex-1 text-left">{t('adminDashboard.addStudent')}</span>
                <span className="dashboard-quick-action-arrow">&rarr;</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <h3 className="headline-md text-on-surface mb-16">{t('adminDashboard.systemStatus')}</h3>
            <div className="flex items-center gap-12 mb-8">
              <div className="dashboard-status-dot"></div>
              <span className="label-md text-on-surface">{t('adminDashboard.serverOnline')}</span>
            </div>
            <p className="body-md text-on-surface-variant">{t('adminDashboard.lastUpdated')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
