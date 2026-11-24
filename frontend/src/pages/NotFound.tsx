import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/common/Button';

export const NotFound: React.FC = () => {
  const { language, t, toggleLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  useDocumentTitle(isVi ? 'Không tìm thấy trang' : 'Page Not Found');

  // Determine role-based home destination
  const getHomePath = (): string => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        return '/login';
    }
  };

  return (
    <div className="error-page-wrapper">
      {/* Top Bar with Brand & Language Switcher */}
      <header className="error-top-nav">
        <div 
          className="error-brand-link" 
          onClick={() => navigate(getHomePath())}
          role="button"
          tabIndex={0}
        >
          <img src="/logo-icon.png" alt="EnglishHub" className="error-brand-logo" />
          <span className="error-brand-name">EnglishHub</span>
        </div>

        <button
          type="button"
          className="error-lang-pill"
          onClick={toggleLanguage}
          title={isVi ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe size={13} />
          <span>{isVi ? 'Tiếng Việt' : 'English'}</span>
        </button>
      </header>

      {/* Main Screen Content - Direct on Screen, No Card */}
      <main className="error-content">
        <div className="error-huge-number">404</div>

        <h1 className="error-title">{t('error404Title')}</h1>
        <p className="error-desc">{t('error404Desc')}</p>

        {/* Action Buttons */}
        <div className="error-actions">
          <Button 
            variant="primary" 
            icon={Home}
            onClick={() => navigate(getHomePath())}
          >
            {t('error404BackHome')}
          </Button>
          <Button 
            variant="secondary" 
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            {t('error404BackPrev')}
          </Button>
        </div>

        {/* System Status Subtext */}
        <div className="error-subtext">
          {isVi ? 'Mã lỗi HTTP: 404 • Không tìm thấy tài nguyên' : 'HTTP Status: 404 • Resource Not Found'}
        </div>
      </main>
    </div>
  );
};

export default NotFound;
