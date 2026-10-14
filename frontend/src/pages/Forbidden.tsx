import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Button } from '../components/common/Button';

export const Forbidden: React.FC = () => {
  const { language, t, toggleLanguage } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  useDocumentTitle(isVi ? 'Truy cập bị từ chối' : 'Access Denied');

  // Determine authorized home destination
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
        <div className="error-huge-number">403</div>

        <h1 className="error-title">{t('error403Title')}</h1>
        <p className="error-desc">{t('error403Desc')}</p>

        {/* Action Buttons */}
        <div className="error-actions">
          <Button 
            variant="primary" 
            icon={Home}
            onClick={() => navigate(getHomePath())}
          >
            {t('error403BackHome')}
          </Button>
          <Button 
            variant="secondary" 
            icon={ArrowLeft}
            onClick={() => navigate(-1)}
          >
            {t('error403BackPrev')}
          </Button>
        </div>

        {/* System Status Subtext */}
        <div className="error-subtext">
          {isVi ? 'Mã lỗi HTTP: 403 • Không có quyền truy cập' : 'HTTP Status: 403 • Access Forbidden'}
        </div>
      </main>
    </div>
  );
};

export default Forbidden;
