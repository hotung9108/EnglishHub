
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  User, 
  BarChart3, 
  Settings, 
  LogOut,
  Plus,
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
  children?: MenuChild[];
}

export interface MenuChild {
  path: string;
  label: string;
}

const Sidebar = ({ isOpen }: { isOpen: boolean }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Default to admin if no user is found for some reason
  const role = user?.role || 'admin';

  const portalLabels = {
    admin: t('adminPortal'),
    teacher: t('teacherPortal'),
    student: t('studentPortal'),
  };

  const menus: Record<string, MenuItem[]> = {
    admin: [
      { path: '/admin/dashboard', label: t('menuDashboard'), icon: LayoutDashboard },
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
      { path: '/reports', label: t('menuReports'), icon: BarChart3 },
    ],
    teacher: [
      { path: '/teacher/classes', label: t('menuMyClasses'), icon: BookOpen },
      { path: '/teacher/assignments', label: t('menuAssignments'), icon: ClipboardList },
      { path: '/progress', label: t('menuProgress'), icon: TrendingUp },
    ],
    student: [
      { path: '/student/my-classes', label: t('menuMyClasses'), icon: BookOpen },
      { path: '/student/assignments', label: t('menuStudentAssignments'), icon: ClipboardList },
      { path: '/student/workspace', label: t('menuStudentWorkspace'), icon: Layout },
      { path: '/student/grades', label: t('menuStudentGrades'), icon: CheckCircle },
      { path: '/student/analytics', label: t('menuStudentAnalytics'), icon: BarChart3 },
      { path: '/student/feedback', label: t('menuStudentFeedback'), icon: TrendingUp },
    ]
  };

  const currentMenu = menus[role as keyof typeof menus] || menus.admin;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'var(--primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
          <GraduationCap size={24} />
        </div>
        <div>
          <div className="sidebar-brand-name">{t('systemName')}</div>
          <div className="sidebar-brand-sub">{portalLabels[role]}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {currentMenu.map((item, index) => (
          <div key={index}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              {item.icon && <item.icon size={20} />}
              {item.label}
            </NavLink>
            {item.children && (
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '16px', borderLeft: '1px solid var(--outline-variant)' }}>
                {item.children.map((child: MenuChild, cIndex: number) => (
                  <NavLink
                    key={`child-${cIndex}`}
                    to={child.path}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    style={{ fontSize: '13px', paddingLeft: '16px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', marginTop: '4px' }}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-footer-btn">
          <Plus size={18} />
          {t('createNew')}
        </button>
        <div className="sidebar-divider"></div>
        <NavLink to="/settings" className="sidebar-link">
          <Settings size={20} />
          {t('settings')}
        </NavLink>
        <NavLink to="/login" className="sidebar-link">
          <LogOut size={20} />
          {t('logout')}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
