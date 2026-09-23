import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  User, 
  BarChart3, 
  Settings, 
  LogOut,
  BookOpen,
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Layout
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

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

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Default to admin if no user is found for some reason
  const role = user?.role || 'admin';

  const portalLabels: Record<string, string> = {
    admin: t('adminPortal'),
    teacher: t('teacherPortal'),
    student: t('studentPortal'),
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
          { 
            path: '/admin/accounts', 
            label: t('menuAccounts'),
            icon: Users,
            children: [
              { path: '/admin/accounts/profile', label: t('menuProfile') },
              { path: '/admin/roles', label: t('menuRoles') }
            ]
          },
          { path: '/admin/classes', label: t('menuClasses'), icon: GraduationCap },
          { path: '/admin/teachers', label: t('menuTeachers'), icon: User },
          { path: '/admin/students', label: t('menuStudents'), icon: Users },
        ]
      },
      {
        title: t('sectionResults'),
        items: [
          { path: '/reports', label: t('menuReports'), icon: BarChart3 },
        ]
      }
    ],
    teacher: [
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
          { path: '/progress', label: t('menuProgress'), icon: TrendingUp },
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
          { path: '/student/assignments', label: t('menuStudentAssignments'), icon: ClipboardList, badge: '7' },
          { path: '/student/workspace', label: t('menuStudentWorkspace'), icon: Layout },
        ]
      },
      {
        title: t('sectionResults'),
        items: [
          { path: '/student/grades', label: t('menuStudentGrades'), icon: CheckCircle },
          { path: '/student/analytics', label: t('menuStudentAnalytics'), icon: BarChart3 },
          { path: '/student/feedback', label: t('menuStudentFeedback'), icon: TrendingUp },
        ]
      }
    ]
  };

  const currentSections = menuSections[role] || menuSections.admin;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <GraduationCap size={22} strokeWidth={2.3} />
        </div>
        <div className="sidebar-brand-info">
          <div className="sidebar-brand-name">{t('systemName')}</div>
          <div className="sidebar-brand-sub">{portalLabels[role] || portalLabels.student}</div>
        </div>
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
                >
                  {item.icon && <item.icon size={18} strokeWidth={2} />}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-link-badge">{item.badge}</span>
                  )}
                </NavLink>
                {item.children && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '22px', borderLeft: '1px solid #F1F5F9' }}>
                    {item.children.map((child: MenuChild, cIndex: number) => (
                      <NavLink
                        key={`child-${cIndex}`}
                        to={child.path}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                        style={{ fontSize: '13px', padding: '6px 14px', marginTop: '2px' }}
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

      {/* Footer Utility Links */}
      <div className="sidebar-footer">
        <div className="sidebar-divider"></div>
        <NavLink to="/settings" className="sidebar-link">
          <Settings size={18} strokeWidth={2} />
          <span>{t('settings')}</span>
        </NavLink>
        <NavLink to="/login" className="sidebar-link" style={{ color: '#EF4444' }}>
          <LogOut size={18} strokeWidth={2} />
          <span>{t('logout')}</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
