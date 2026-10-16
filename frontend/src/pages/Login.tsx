import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { authService } from '@/api';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, 
  Globe, AlertCircle 
} from 'lucide-react';

const LoginForm: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const isVi = language === 'vi';
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedUser = await login({ email, password });
      const actualRole = loggedUser?.role || authService.getSavedUser()?.role || 'student';
      const from = location.state?.from?.pathname || '/';
      const isAuthorizedDestination =
        (actualRole === 'admin' && from.startsWith('/admin')) ||
        (actualRole === 'teacher' && from.startsWith('/teacher')) ||
        (actualRole === 'student' && from.startsWith('/student'));

      if (from === '/' || !isAuthorizedDestination) {
        if (actualRole === 'admin') navigate('/admin', { replace: true });
        else if (actualRole === 'teacher') navigate('/teacher', { replace: true });
        else navigate('/student', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch {
      setError(isVi ? 'Tài khoản hoặc mật khẩu không chính xác.' : 'Invalid email or password credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Top Navigation: Language Toggle */}
      <nav className="login-top-nav">
        <button
          type="button"
          className="login-lang-pill"
          onClick={toggleLanguage}
          title={isVi ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe size={14} />
          <span>{isVi ? 'Tiếng Việt' : 'English'}</span>
        </button>
      </nav>

      {/* Main Centered Academic Focus Card */}
      <main className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-logo-emblem">
            <img src="/logo-icon.png" alt="EnglishHub Logo" className="login-logo-img" />
          </div>
          <h1 className="login-brand-name">EnglishHub</h1>
          <p className="login-form-subtitle">
            {isVi ? 'Đăng nhập vào tài khoản của bạn' : 'Sign in to your account'}
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="login-error-box" role="alert">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Email */}
          <div className="login-input-group">
            <label className="login-input-label" htmlFor="login-email">
              Email
            </label>
            <div className="login-input-wrapper">
              <Mail size={16} className="login-input-icon" />
              <input
                id="login-email"
                type="email"
                className="login-input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@eh.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-input-group">
            <div className="login-label-row">
              <label className="login-input-label" htmlFor="login-password">
                {isVi ? 'Mật khẩu' : 'Password'}
              </label>
              <Link 
                to="/forgot-password" 
                className="login-forgot-link"
              >
                {isVi ? 'Quên mật khẩu?' : 'Forgot password?'}
              </Link>
            </div>
            <div className="login-input-wrapper">
              <Lock size={16} className="login-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? (isVi ? 'Ẩn mật khẩu' : 'Hide password') : (isVi ? 'Hiện mật khẩu' : 'Show password')}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="login-remember-row">
            <label className="login-remember-label">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="login-remember-checkbox"
              />
              <span>{isVi ? 'Ghi nhớ đăng nhập' : 'Remember me'}</span>
            </label>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="login-submit-btn" 
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? (isVi ? 'Đang xác thực...' : 'Authenticating...') : (isVi ? 'Đăng nhập' : 'Sign in')}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </main>

      {/* Page Footer */}
      <footer className="login-page-footer">
        <span>© 2026 EnglishHub</span>
      </footer>
    </div>
  );
};

export default function LoginPage() {
  return <LoginForm />;
}
