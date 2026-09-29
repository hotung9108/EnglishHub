import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  Menu, 
  Globe, 
  User as UserIcon, 
  ShieldCheck, 
  Sliders, 
  LogOut, 
  ChevronDown 
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const TopBar = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = user?.role || 'student';
  const isStudent = location.pathname.startsWith('/student') || role === 'student';
  const settingsBasePath = role === 'admin' 
    ? '/admin/settings' 
    : role === 'teacher' 
      ? '/teacher/settings' 
      : '/student/settings';

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const cleanName = name.replace(/\(.*?\)/g, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="topbar">
      {/* Left: Mobile Menu & Global Search */}
      <div className="topbar-left flex items-center gap-16 flex-1">
        <button 
          type="button" 
          className="mobile-menu-btn" 
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-search">
          <span className="topbar-search-label"><Search size={16} /></span>
          <input
            type="text"
            className={`topbar-search-input ${isStudent ? 'student-pad' : ''}`}
            placeholder={t('search')}
          />
          {!isStudent && <kbd className="topbar-search-kbd">⌘K</kbd>}
        </div>
      </div>

      {/* Right: Actions & User Chip */}
      <div className="topbar-actions">
        {/* Language Switcher Pill */}
        <button 
          type="button"
          className="topbar-lang-pill" 
          onClick={toggleLanguage}
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe size={14} color="#64748B" />
          <span>{language === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* Notification Bell */}
        <button 
          type="button" 
          className="topbar-icon-btn relative" 
          title="Thông báo"
        >
          <Bell size={18} />
          <span className="topbar-action-dot"></span>
        </button>

        {/* Help Circle */}
        <button 
          type="button" 
          className="topbar-icon-btn" 
          title="Trợ giúp & Tài liệu"
        >
          <HelpCircle size={18} />
        </button>

        {/* Interactive User Profile Chip & Dropdown */}
        <div className="topbar-user-menu-container" ref={menuRef}>
          <button 
            type="button" 
            className="topbar-user-chip" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <div className="topbar-user-avatar">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.fullName} 
                />
              ) : (
                getInitials(user?.fullName)
              )}
            </div>
            <div className="topbar-user-details">
              <span className="topbar-user-name">{user?.fullName || 'User'}</span>
              <span className="topbar-user-role">{user?.role || 'Student'}</span>
            </div>
            <ChevronDown size={14} color="#64748B" />
          </button>

          {isMenuOpen && (
            <div className="topbar-dropdown-menu">
              <div className="topbar-dropdown-header">
                <div className="topbar-dropdown-name">{user?.fullName || 'User'}</div>
                <div className="topbar-dropdown-email">{user?.email || 'user@eh.com'}</div>
              </div>

              <Link 
                to={`${settingsBasePath}?tab=profile`} 
                className="topbar-dropdown-item"
                onClick={() => setIsMenuOpen(false)}
              >
                <UserIcon size={16} color="var(--primary)" />
                <span>{t('settings.tabProfile')}</span>
              </Link>

              <Link 
                to={`${settingsBasePath}?tab=security`} 
                className="topbar-dropdown-item"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShieldCheck size={16} color="#059669" />
                <span>{t('settings.tabSecurity')}</span>
              </Link>

              <Link 
                to={`${settingsBasePath}?tab=preferences`} 
                className="topbar-dropdown-item"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sliders size={16} color="#4F46E5" />
                <span>{t('settings.tabPreferences')}</span>
              </Link>

              <div className="topbar-dropdown-divider"></div>

              <button 
                type="button" 
                className="topbar-dropdown-item danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
