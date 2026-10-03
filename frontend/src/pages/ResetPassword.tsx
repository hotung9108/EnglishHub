import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  Lock, Eye, EyeOff, ArrowRight, 
  ArrowLeft, CheckCircle2, ShieldCheck, KeyRound, 
  AlertCircle, Globe, Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '@/api';
import type { PasswordStrength } from '../types/auth-flow.types';
import '../styles/login.css';
import '../styles/forgot-password.css';

export const ResetPassword: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectSeconds, setRedirectSeconds] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Auto redirect timer on success
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isSuccess) {
      interval = setInterval(() => {
        setRedirectSeconds(prev => {
          if (prev <= 1) {
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSuccess, navigate]);

  // Password strength calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumberOrSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isPasswordMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  const calculatePasswordStrength = (): PasswordStrength => {
    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasNumberOrSymbol) score++;

    if (score >= 3) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  };

  const strength = calculatePasswordStrength();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasMinLength) {
      setErrorMessage(isVi ? 'Mật khẩu phải có tối thiểu 8 ký tự' : 'Password must be at least 8 characters');
      return;
    }

    if (!hasUppercase) {
      setErrorMessage(isVi ? 'Mật khẩu phải chứa ít nhất 1 chữ in hoa (A-Z)' : 'Password must contain at least 1 uppercase letter');
      return;
    }

    if (!hasNumberOrSymbol) {
      setErrorMessage(isVi ? 'Mật khẩu phải chứa ít nhất 1 số hoặc ký tự đặc biệt' : 'Password must contain at least 1 number or special character');
      return;
    }

    if (!isPasswordMatch) {
      setErrorMessage(isVi ? 'Mật khẩu xác nhận không trùng khớp' : 'Password confirmation does not match');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email,
        token,
        newPassword,
      });
      setIsSuccess(true);
      setRedirectSeconds(5);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVi ? 'Không thể đặt lại mật khẩu' : 'Failed to reset password');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-ambient-orb-1"></div>
      <div className="login-ambient-orb-2"></div>

      <main className="auth-single-card-container">
        {!isSuccess ? (
          <div>
            <div className="fp-top-actions">
              <Link to="/login" className="fp-back-btn">
                <ArrowLeft size={14} />
                <span>{isVi ? 'Quay lại đăng nhập' : 'Back to login'}</span>
              </Link>

              <button 
                type="button" 
                className="login-lang-btn"
                onClick={toggleLanguage}
                title={isVi ? 'Chuyển sang Tiếng Anh' : 'Switch to Vietnamese'}
              >
                <Globe size={14} />
                <span>{isVi ? 'English' : 'Tiếng Việt'}</span>
              </button>
            </div>

            <div className="login-header-group">
              <h2 className="login-form-title">
                {isVi ? 'Đặt lại mật khẩu' : 'Reset Password'}
              </h2>
              {email && (
                <p className="login-form-desc">
                  {isVi ? `Đang đặt lại mật khẩu cho tài khoản: ` : `Resetting password for: `}
                  <strong style={{ color: 'var(--primary)' }}>{email}</strong>
                </p>
              )}
            </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="login-error-alert login-error-alert-spaced">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword}>
                {/* New Password */}
                <div className="login-input-group">
                  <label className="login-input-label">
                    <span>{isVi ? 'Mật khẩu mới' : 'New Password'}</span>
                  </label>
                  <div className="login-input-wrapper">
                    <Lock size={16} className="login-input-icon" />
                    <input 
                      type={showNewPassword ? 'text' : 'password'}
                      className="login-input-field"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button 
                      type="button" 
                      className="login-pwd-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <div className="fp-strength-wrap">
                    <div className="fp-strength-bars">
                      <div className={`fp-strength-bar ${strength}`} />
                      <div className={`fp-strength-bar ${strength === 'medium' || strength === 'strong' ? strength : ''}`} />
                      <div className={`fp-strength-bar ${strength === 'strong' ? 'strong' : ''}`} />
                    </div>
                    <div className="fp-strength-meta">
                      <span className="fp-strength-title">{isVi ? 'Độ an toàn:' : 'Strength:'}</span>
                      <span className={`fp-strength-label ${strength}`}>
                        {strength === 'weak' && (isVi ? 'Yếu' : 'Weak')}
                        {strength === 'medium' && (isVi ? 'Trung bình' : 'Medium')}
                        {strength === 'strong' && (isVi ? 'Mạnh & An toàn' : 'Strong & Secure')}
                      </span>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="login-input-group">
                  <label className="login-input-label">
                    <span>{isVi ? 'Xác nhận mật khẩu mới' : 'Confirm New Password'}</span>
                  </label>
                  <div className="login-input-wrapper">
                    <KeyRound size={16} className="login-input-icon" />
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="login-input-field"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      className="login-pwd-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Criteria Checklist */}
                <div className="fp-criteria-list">
                  <div className={`fp-criteria-item ${hasMinLength ? 'met' : ''}`}>
                    <div className="fp-criteria-icon">
                      {hasMinLength ? <Check size={12} strokeWidth={3} /> : <div className="fp-criteria-bullet" />}
                    </div>
                    <span>{isVi ? 'Tối thiểu 8 ký tự' : 'At least 8 characters'}</span>
                  </div>
                  <div className={`fp-criteria-item ${hasUppercase ? 'met' : ''}`}>
                    <div className="fp-criteria-icon">
                      {hasUppercase ? <Check size={12} strokeWidth={3} /> : <div className="fp-criteria-bullet" />}
                    </div>
                    <span>{isVi ? 'Có ít nhất 1 chữ in hoa (A-Z)' : 'At least 1 uppercase letter'}</span>
                  </div>
                  <div className={`fp-criteria-item ${hasNumberOrSymbol ? 'met' : ''}`}>
                    <div className="fp-criteria-icon">
                      {hasNumberOrSymbol ? <Check size={12} strokeWidth={3} /> : <div className="fp-criteria-bullet" />}
                    </div>
                    <span>{isVi ? 'Có ít nhất 1 số hoặc ký tự đặc biệt' : 'At least 1 number or special character'}</span>
                  </div>
                  <div className={`fp-criteria-item ${isPasswordMatch ? 'met' : ''}`}>
                    <div className="fp-criteria-icon">
                      {isPasswordMatch ? <Check size={12} strokeWidth={3} /> : <div className="fp-criteria-bullet" />}
                    </div>
                    <span>{isVi ? 'Mật khẩu xác nhận trùng khớp' : 'Passwords match'}</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="login-submit-btn" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>{isVi ? 'Đang cập nhật...' : 'Updating password...'}</span>
                  ) : (
                    <>
                      <span>{isVi ? 'Cập nhật mật khẩu mới' : 'Update Password'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="fp-success-box">
              <div className="fp-success-icon-wrap">
                <CheckCircle2 size={42} strokeWidth={2.4} />
              </div>

              <h2 className="fp-success-title">
                {isVi ? 'Mật khẩu đã được thay đổi!' : 'Password Changed Successfully!'}
              </h2>

              <p className="fp-success-desc">
                {isVi 
                  ? 'Mật khẩu của bạn đã được cập nhật thành công. Vui lòng sử dụng mật khẩu mới để đăng nhập vào tài khoản EnglishHub.' 
                  : 'Your account password has been updated securely. Please use your new password to sign into EnglishHub.'}
              </p>

              <div className="fp-redirect-bar-track">
                <div 
                  className="fp-redirect-bar-fill" 
                  style={{ width: `${((5 - redirectSeconds) / 5) * 100}%` }}
                />
              </div>

              <p className="fp-redirect-hint">
                {isVi ? `Đang chuyển hướng về trang đăng nhập sau ${redirectSeconds} giây...` : `Redirecting to login in ${redirectSeconds} seconds...`}
              </p>

              <button 
                type="button" 
                className="login-submit-btn fp-success-btn"
                onClick={() => navigate('/login')}
              >
                <span>{isVi ? 'Đăng nhập ngay' : 'Login Now'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Trust Footer */}
          <div className="auth-single-trust-footer">
            <ShieldCheck size={14} />
            <span>
              {isVi 
                ? 'Mã hóa AES-256 • Bảo vệ tài khoản và kết quả học tập an toàn' 
                : 'AES-256 Encryption • Safe & Secure Education Identity'}
            </span>
          </div>
      </main>
    </div>
  );
};

export default ResetPassword;
