
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

  const menus = {
    admin: [
      { path: '/', label: t('dashboard'), icon: LayoutDashboard },
      { 
        path: '/admin/accounts', 
        label: t('accounts'),
        icon: Users,
        children: [
          { path: '/admin/accounts/profile', label: 'Hồ sơ cá nhân' },
          { path: '/admin/roles', label: 'Phân quyền & Vai trò' }
        ]
      },
      { path: '/admin/classes', label: t('classes'), icon: GraduationCap },
      { path: '/admin/teachers', label: t('teachers'), icon: User },
      { path: '/admin/students', label: t('students'), icon: Users },
      { path: '/reports', label: t('reports'), icon: BarChart3 },
    ],
    teacher: [
      { path: '/teacher/classes', label: t('myClasses'), icon: BookOpen },
      { path: '/teacher/assignments', label: t('assignments'), icon: ClipboardList },
      { path: '/progress', label: t('progress'), icon: TrendingUp },
    ],
    student: [
      { path: '/student/my-classes', label: t('myClasses'), icon: BookOpen },
      { path: '/student/assignments', label: t('studentAssignments'), icon: ClipboardList },
      { path: '/student/workspace', label: t('studentWorkspace'), icon: Layout },
      { path: '/student/grades', label: t('studentGrades'), icon: CheckCircle },
      { path: '/student/analytics', label: t('studentAnalytics'), icon: BarChart3 },
      { path: '/student/feedback', label: t('studentFeedback'), icon: TrendingUp },
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
            {(item as any).children && (
              <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '16px', borderLeft: '1px solid var(--outline-variant)' }}>
                {(item as any).children.map((child: any, cIndex: any) => (
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
