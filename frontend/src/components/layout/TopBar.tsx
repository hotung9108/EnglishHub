
import { Search, Bell, HelpCircle, Menu } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const TopBar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { language, toggleLanguage, t } = useLanguage();

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
            <div className="topbar-user-name">Nguyễn Văn Hùng</div>
            <div className="topbar-user-role">Quản trị viên</div>
          </div>
          <div className="topbar-avatar">NV</div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
