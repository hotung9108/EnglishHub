
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const TopBar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="topbar-search">
          <span className="topbar-search-label"><Search size={16} /></span>
          <input
            type="text"
            className="topbar-search-input"
            placeholder={t('search')}
          />
        </div>
      </div>

      <div className="topbar-actions">
        <span className="breadcrumb" style={{ marginRight: '8px' }}>
          <span>{t('heThong')}</span>
        </span>

        <button className="topbar-action-btn" onClick={toggleLanguage}>
          {language === 'vi' ? 'EN' : 'VI'}
        </button>

        <button className="topbar-action-btn" style={{ position: 'relative' }}>
          <Bell size={20} />
          <span className="topbar-action-dot"></span>
        </button>

        <button className="topbar-action-btn">
          <HelpCircle size={20} />
        </button>

        <div className="topbar-user">
          <div className="topbar-user-info">
            <div className="topbar-user-name">{user?.name || 'Guest'}</div>
            <div className="topbar-user-role" style={{ textTransform: 'capitalize' }}>
              {user?.role || ''}
            </div>
          </div>
          <div className="topbar-avatar">{user?.name?.substring(0, 2).toUpperCase() || 'G'}</div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
