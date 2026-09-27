import { useLocation } from 'react-router-dom';
import { Search, Bell, HelpCircle, Menu, Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const TopBar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();

  const isStudent = location.pathname.startsWith('/student') || user?.role === 'student';

  return (
    <header className="topbar">
      {/* Left: Mobile Menu & Global Search */}
      <div className="flex items-center gap-16 flex-1">
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="topbar-search">
          <span className="topbar-search-label"><Search size={16} /></span>
          <input
            type="text"
            className="topbar-search-input"
            placeholder={t('search')}
            style={isStudent ? { paddingRight: '16px' } : undefined}
          />
          {!isStudent && <kbd className="topbar-search-kbd">⌘K</kbd>}
        </div>
      </div>

      {/* Right: Actions & User Chip */}
      <div className="topbar-actions">
        {/* Language Switcher Pill */}
        <button 
          className="topbar-lang-pill" 
          onClick={toggleLanguage}
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe size={14} color="#64748B" />
          <span>{language === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* Notification Bell */}
        <button className="topbar-icon-btn relative" title="Thông báo">
          <Bell size={18} />
          <span className="topbar-action-dot"></span>
        </button>

        {/* Help Circle */}
        <button className="topbar-icon-btn" title="Trợ giúp & Tài liệu">
          <HelpCircle size={18} />
        </button>

        {/* Modern User Profile Chip */}
        <div className="topbar-user-chip">
          <div className="topbar-user-avatar">
            {user?.name?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="topbar-user-details">
            <span className="topbar-user-name">{user?.name || 'User'}</span>
            <span className="topbar-user-role">{user?.role || 'Student'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
