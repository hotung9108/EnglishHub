import { createContext, useState, useContext } from 'react'; import type { ReactNode } from 'react';

type LanguageContextType = {
  language: string;
  toggleLanguage: () => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi'));
  };

  const t = (key: string) => {
    const dict = {
      vi: {
        search: 'Tìm kiếm nhanh...',
        notifications: 'Thông báo',
        profile: 'Hồ sơ',
        dashboard: 'Tổng quan',
        accounts: 'Quản lý tài khoản',
        roles: 'Phân quyền vai trò',
        teachers: 'Hồ sơ Giáo viên',
        students: 'Hồ sơ Học viên',
        classes: 'Quản lý Lớp học',
        reports: 'Báo cáo & Thống kê',
        myClasses: 'Lớp học của tôi',
        assignments: 'Quản lý bài tập',
        createAssignment: 'Soạn đề & Giao bài',
        progress: 'Tiến độ học tập lớp',
        studentAssignments: 'Danh sách bài tập',
        studentWorkspace: 'Không gian làm bài',
        studentGrades: 'Trạng thái & Bảng điểm',
        studentAnalytics: 'Phân tích năng lực 4KN',
        studentFeedback: 'Xem bài chữa & Feedback',
        login: 'ĐĂNG NHẬP HỆ THỐNG',
        email: 'TÊN ĐĂNG NHẬP / EMAIL',
        password: 'MẬT KHẨU',
        remember: 'Ghi nhớ đăng nhập',
        forgot: 'Quên mật khẩu?',
        loginBtn: 'ĐĂNG NHẬP',
        logout: 'Đăng xuất',
        menu: 'MENU',
        settings: 'Cài đặt',
        createNew: '+ Tạo mới',
        systemName: 'EnglishHub',
        systemSub: 'Hệ thống Quản lý & Chấm chữa bài tập Tiếng Anh',
        adminPortal: 'Cổng Quản trị',
        teacherPortal: 'Cổng Giáo viên',
        studentPortal: 'Cổng Học viên',
        switchLang: 'Switch to English',
        show: 'Hiện',
        hide: 'Ẩn',
        heThong: 'Hệ thống',
      },
      en: {
        search: 'Quick search...',
        notifications: 'Notifications',
        profile: 'Profile',
        dashboard: 'Dashboard',
        accounts: 'Manage Accounts',
        roles: 'Role Permissions',
        teachers: 'Teacher Profiles',
        students: 'Student Profiles',
        classes: 'Manage Classes',
        reports: 'Reports & Analytics',
        myClasses: 'My Classes',
        assignments: 'Manage Assignments',
        createAssignment: 'Create Assignment',
        progress: 'Class Progress',
        studentAssignments: 'My Assignments',
        studentWorkspace: 'Workspace',
        studentGrades: 'Status & Grades',
        studentAnalytics: 'Skills Analytics',
        studentFeedback: 'Feedback & Corrections',
        login: 'SYSTEM LOGIN',
        email: 'USERNAME / EMAIL',
        password: 'PASSWORD',
        remember: 'Remember me',
        forgot: 'Forgot password?',
        loginBtn: 'LOGIN',
        logout: 'Logout',
        menu: 'MENU',
        settings: 'Settings',
        createNew: '+ Create New',
        systemName: 'EnglishHub',
        systemSub: 'English Assignment Management & Smart Grading System',
        adminPortal: 'Admin Portal',
        teacherPortal: 'Teacher Portal',
        studentPortal: 'Student Portal',
        switchLang: 'Chuyển sang Tiếng Việt',
        show: 'Show',
        hide: 'Hide',
        heThong: 'System',
      }
    };
    return (dict[language] as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
