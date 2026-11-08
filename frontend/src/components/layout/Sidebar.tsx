import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  User as UserIcon, 
  BarChart3, 
  Settings, 
  LogOut,
  BookOpen,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  History,
  Shield,
  Globe,
  ShieldCheck,
  ChevronsUpDown,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useStudentAssignmentBadge } from '../../hooks';

export interface MenuItem {
  path: string;
  label: string;
  icon?: React.ElementType;
  badge?: string;
  children?: MenuChild[];
}

export interface MenuChild {
  path: string;
  label: string;
}

export interface MenuSection {
  title?: string;
  items: MenuItem[];
}

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
}

const Sidebar = ({ isOpen, onCloseMobile }: SidebarProps) => {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, setTheme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close flyout popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleLinkClick = () => {
    if (onCloseMobile && window.innerWidth <= 768) {
      onCloseMobile();
    }
  };
  
  // Default to admin if no user is found
  const role = user?.role || 'admin';
  const normalizedRole = role.toLowerCase();

  const { badge: studentAssignmentBadge } = useStudentAssignmentBadge(
    role === 'student' ? user?.id : undefined,
    role
  );

  const roleLabels: Record<string, { vi: string; en: string }> = {
    admin: { vi: 'Quản trị viên', en: 'Admin' },
    teacher: { vi: 'Giáo viên', en: 'Teacher' },
    student: { vi: 'Học viên', en: 'Student' },
  };

  const currentRoleLabel = language === 'vi'
    ? (roleLabels[normalizedRole]?.vi || 'Học viên')
    : (roleLabels[normalizedRole]?.en || 'Student');

  const profileBasePath = normalizedRole === 'admin' 
    ? '/admin/profile' 
    : normalizedRole === 'teacher' 
      ? '/teacher/profile' 
      : '/student/profile';

  const settingsBasePath = normalizedRole === 'admin'
    ? '/admin/settings'
    : normalizedRole === 'teacher'
      ? '/teacher/settings'
      : '/student/settings';

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const cleanName = name.replace(/\(.*?\)/g, '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const menuSections: Record<string, MenuSection[]> = {
    admin: [
      {
        title: t('sectionOverview'),
        items: [
          { path: '/admin/dashboard', label: t('menuDashboard'), icon: LayoutDashboard },
        ]
      },
      {
        title: t('sectionManagement'),
        items: [
          { path: '/admin/accounts', label: t('menuAccounts'), icon: Users },
          { path: '/admin/roles', label: language === 'vi' ? 'Phân quyền' : 'Roles', icon: Shield },
          { path: '/admin/classes', label: t('menuClasses'), icon: GraduationCap },
          { path: '/admin/teachers', label: t('menuTeachers'), icon: UserIcon },
          { path: '/admin/students', label: t('menuStudents'), icon: Users },
        ]
      },
      {
        title: t('sectionResults'),
        items: [
          { path: '/admin/reports', label: t('menuReports'), icon: BarChart3 },
          { path: '/admin/audit/gradings', label: t('auditLogs.title'), icon: History },
        ]
      }
    ],
    teacher: [
      {
        title: t('sectionOverview'),
        items: [
          { path: '/teacher/dashboard', label: t('menuDashboard'), icon: LayoutDashboard },
        ]
      },
      {
        title: t('sectionTeaching'),
        items: [
          { path: '/teacher/classes', label: t('menuMyClasses'), icon: BookOpen },
          { path: '/teacher/assignments', label: t('menuAssignments'), icon: ClipboardList },
        ]
      },
      {
        title: t('sectionResults'),
        items: [
          { path: '/teacher/progress', label: t('menuProgress'), icon: TrendingUp },
        ]
      }
    ],
    student: [
      {
        title: t('sectionOverview'),
        items: [
          { path: '/student/dashboard', label: t('menuDashboard'), icon: LayoutDashboard },
        ]
      },
      {
        title: t('sectionLearning'),
        items: [
          { path: '/student/classes', label: t('menuMyClasses'), icon: BookOpen },
          { path: '/student/assignments', label: t('menuStudentAssignments'), icon: ClipboardList, badge: studentAssignmentBadge },
        ]
      },
      {
        title: t('sectionResults'),
        items: [
          { path: '/student/grades', label: t('menuStudentGrades'), icon: CheckCircle },
          { path: '/student/feedback', label: t('menuStudentFeedback'), icon: TrendingUp },
        ]
      }
    ]
  };

  const currentSections = menuSections[normalizedRole] || menuSections.admin;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <img src="/logo-icon.png" alt="EnglishHub" className="sidebar-brand-img" />
        </div>
        <div className="sidebar-brand-info">
          <div className="sidebar-brand-name">{t('systemName')}</div>
          <div className="sidebar-brand-sub">{currentRoleLabel}</div>
        </div>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button 
            type="button" 
            className="sidebar-mobile-close-btn" 
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {currentSections.map((section, sIndex) => (
          <div key={`sec-${sIndex}`}>
            {section.title && (
              <div className="sidebar-section-title">
                {section.title}
              </div>
            )}
            {section.items.map((item, itemIndex) => (
              <div key={`item-${itemIndex}`}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={handleLinkClick}
                >
                  {item.icon && <item.icon size={18} strokeWidth={2} />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-link-badge">{item.badge}</span>
                  )}
                </NavLink>
                {item.children && (
                  <div className="sidebar-submenu">
                    {item.children.map((child: MenuChild, cIndex: number) => (
                      <NavLink
                        key={`child-${cIndex}`}
                        to={child.path}
                        className={({ isActive }) => `sidebar-link sidebar-submenu-link ${isActive ? 'active' : ''}`}
                        onClick={handleLinkClick}
                      >
                        <span>{child.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </nav>

      {/* Consolidated Footer: Language, Admin System Settings & Floating User Profile */}
      <div className="sidebar-footer" ref={userMenuRef}>
        <div className="sidebar-divider" />

        {/* 1. Admin System Settings Link (Only visible for Admin; Teachers & Students access Profile/Security via User Card) */}
        {normalizedRole === 'admin' && (
          <NavLink
            to={settingsBasePath}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <Settings size={18} strokeWidth={2} />
            <span>{language === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'}</span>
          </NavLink>
        )}

        {/* 2. Language & Theme Switcher Rows */}
        <div className="sidebar-lang-row">
          <span className="sidebar-lang-label">
            <Globe size={14} />
            <span>{language === 'vi' ? 'Ngôn ngữ' : 'Language'}</span>
          </span>
          <div className="sidebar-lang-segmented">
            <button
              type="button"
              className={`sidebar-lang-seg-btn ${language === 'vi' ? 'active' : ''}`}
              onClick={() => { if (language !== 'vi') toggleLanguage(); }}
              title="Tiếng Việt"
            >
              VI
            </button>
            <button
              type="button"
              className={`sidebar-lang-seg-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => { if (language !== 'en') toggleLanguage(); }}
              title="English"
            >
              EN
            </button>
          </div>
        </div>

        <div className="sidebar-lang-row" style={{ marginTop: '8px' }}>
          <span className="sidebar-lang-label">
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{language === 'vi' ? 'Giao diện' : 'Theme'}</span>
          </span>
          <div className="sidebar-lang-segmented">
            <button
              type="button"
              className={`sidebar-lang-seg-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={() => setTheme('light')}
              title={language === 'vi' ? 'Giao diện Sáng (Alabaster)' : 'Light Mode'}
            >
              <Sun size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
              {language === 'vi' ? 'Sáng' : 'Light'}
            </button>
            <button
              type="button"
              className={`sidebar-lang-seg-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => setTheme('dark')}
              title={language === 'vi' ? 'Giao diện Tối (Obsidian)' : 'Dark Mode'}
            >
              <Moon size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: -1 }} />
              {language === 'vi' ? 'Tối' : 'Dark'}
            </button>
          </div>
        </div>

        <div className="sidebar-divider-subtle" />

        {/* 3. User Profile Card (Click to open floating menu on the right) */}
        <button 
          type="button"
          className={`sidebar-user-card ${isUserMenuOpen ? 'active' : ''}`}
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          aria-expanded={isUserMenuOpen}
          aria-haspopup="true"
        >
          <div className="sidebar-user-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} />
            ) : (
              getInitials(user?.fullName)
            )}
          </div>
          <div className="sidebar-user-details">
            <span className="sidebar-user-name" title={user?.fullName}>{user?.fullName || 'User'}</span>
            <span className="sidebar-user-role">{currentRoleLabel}</span>
          </div>
          <ChevronsUpDown size={14} className="sidebar-user-chevron" />
        </button>

        {/* 4. Floating User Flyout Popover (Floats to the right outside sidebar on Desktop) */}
        {isUserMenuOpen && (
          <div className="sidebar-user-popover-floating">
            <div className="sidebar-popover-header">
              <div className="sidebar-popover-user-row">
                <div className="sidebar-popover-avatar">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.fullName} />
                  ) : (
                    getInitials(user?.fullName)
                  )}
                </div>
                <div className="sidebar-popover-info">
                  <div className="sidebar-popover-name">{user?.fullName || 'User'}</div>
                  <div className="sidebar-popover-email">{user?.email || 'user@eh.com'}</div>
                </div>
              </div>
              <span className="sidebar-popover-role-badge">{currentRoleLabel}</span>
            </div>

            <div className="sidebar-popover-body">
              <Link 
                to={`${profileBasePath}?tab=general`}
                className="sidebar-popover-item"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleLinkClick();
                }}
              >
                <UserIcon size={15} />
                <span>{t('settings.tabProfile')}</span>
              </Link>

              <Link 
                to={`${profileBasePath}?tab=security`}
                className="sidebar-popover-item"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleLinkClick();
                }}
              >
                <ShieldCheck size={15} />
                <span>{t('settings.tabSecurity')}</span>
              </Link>

              {normalizedRole === 'admin' && (
                <Link 
                  to={settingsBasePath}
                  className="sidebar-popover-item"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLinkClick();
                  }}
                >
                  <Settings size={15} />
                  <span>{language === 'vi' ? 'Cài đặt hệ thống' : 'System Settings'}</span>
                </Link>
              )}

              <button
                type="button"
                className="sidebar-popover-item"
                onClick={() => {
                  toggleTheme();
                }}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                <span>
                  {theme === 'dark'
                    ? (language === 'vi' ? 'Giao diện Sáng' : 'Light Mode')
                    : (language === 'vi' ? 'Giao diện Tối' : 'Dark Mode')}
                </span>
              </button>
            </div>

            <div className="sidebar-popover-divider" />

            <div className="sidebar-popover-footer">
              <button 
                type="button"
                className="sidebar-popover-item danger"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
