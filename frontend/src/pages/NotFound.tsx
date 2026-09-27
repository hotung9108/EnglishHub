import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';

export const NotFound: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
      <main className="error-card">
        {/* Visual 404 Presentation */}
        <div className="error-visual-container" aria-hidden="true">
          <span className="error-big-number error-big-number-accent-404">4</span>
          <div className="error-visual-center error-center-404">
            <div className="error-center-ring" />
            <Compass size={44} className="error-center-icon-animated" />
          </div>
          <span className="error-big-number error-big-number-accent-404">4</span>
        </div>

        {/* Title & Description */}
        <h1 className="error-title">{t('error404Title')}</h1>
        <p className="error-desc">{t('error404Desc')}</p>

        {/* Action Button: Return to Homepage */}
        <button 
          type="button" 
          className="btn-error-primary" 
          onClick={() => navigate(getHomePath())}
        >
          <Home size={18} />
          <span>{t('error404BackHome')}</span>
        </button>
      </main>
    </div>
  );
};

export default NotFound;
