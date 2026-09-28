import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, 
  ArrowLeft, CheckCircle2, ShieldCheck, 
  AlertCircle, Globe, KeyRound, Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { ForgotPasswordStep, PasswordStrength } from '../types/auth-flow.types';
import '../styles/login.css';
import '../styles/forgot-password.css';

export const ForgotPassword: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const isVi = language === 'vi';
  const navigate = useNavigate();

  // State
  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('849201');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendSeconds, setResendSeconds] = useState(60);
  const [redirectSeconds, setRedirectSeconds] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // OTP Input refs
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'verify' && resendSeconds > 0) {
      interval = setInterval(() => {
        setResendSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendSeconds]);

  // Timer countdown for redirect on success
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'success') {
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
  }, [step, navigate]);

  // Quick select accounts for rapid testing
  const handleQuickSelectEmail = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setErrorMessage('');
  };

  // Step 1: Submit email to request OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !email.includes('@')) {
      setErrorMessage(isVi ? 'Vui lòng nhập địa chỉ email hợp lệ' : 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Generate a mock 6-digit OTP
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(newOtp);
      setIsLoading(false);
      setStep('verify');
      setResendSeconds(60);
    }, 600);
  };

  // Step 2: Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMessage('');

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleAutofillOtp = () => {
    setOtp(generatedOtp.split(''));
    setErrorMessage('');
    otpInputRefs.current[5]?.focus();
  };

  const handleResendOtp = () => {
    if (resendSeconds > 0) return;
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setResendSeconds(60);
    setOtp(['', '', '', '', '', '']);
    setErrorMessage('');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setErrorMessage(isVi ? 'Vui lòng nhập đủ 6 chữ số mã xác thực' : 'Please enter the complete 6-digit OTP code');
      return;
    }

    if (fullOtp !== generatedOtp) {
      setErrorMessage(isVi ? 'Mã xác minh không chính xác. Vui lòng kiểm tra lại.' : 'Invalid verification code. Please check again.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('reset');
    }, 500);
  };

  // Step 3: Password strength calculation
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

  const handleResetPassword = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setIsLoading(false);
      setStep('success');
      setRedirectSeconds(5);
    }, 800);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-ambient-orb-1"></div>
      <div className="login-ambient-orb-2"></div>

      <main className="auth-single-card-container">
        {/* Top Actions Row: Back Navigation & Language Toggle */}
        <div className="fp-top-actions">
          {step === 'request' && (
            <Link to="/login" className="fp-back-btn">
              <ArrowLeft size={14} />
              <span>{isVi ? 'Quay lại đăng nhập' : 'Back to login'}</span>
            </Link>
          )}
          {step === 'verify' && (
            <button 
              type="button" 
              className="fp-back-btn" 
              onClick={() => setStep('request')}
            >
              <ArrowLeft size={14} />
              <span>{isVi ? 'Đổi email khác' : 'Change email'}</span>
            </button>
          )}
          {step === 'reset' && (
            <button 
              type="button" 
              className="fp-back-btn" 
              onClick={() => setStep('verify')}
            >
              <ArrowLeft size={14} />
              <span>{isVi ? 'Quay lại bước OTP' : 'Back to OTP'}</span>
            </button>
          )}
          {step === 'success' && <div />}

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

        {/* Step Indicator Progress Bar */}
        <div className="fp-step-indicator">
          <div className={`fp-step-item ${step === 'request' ? 'active' : 'completed'}`}>
            <div className="fp-step-circle">
              {step !== 'request' ? <Check size={14} /> : '1'}
            </div>
            <span className="fp-step-label">{isVi ? 'Nhập Email' : 'Email'}</span>
          </div>

          <div className={`fp-step-item ${step === 'verify' ? 'active' : ['reset', 'success'].includes(step) ? 'completed' : ''}`}>
            <div className="fp-step-circle">
              {['reset', 'success'].includes(step) ? <Check size={14} /> : '2'}
            </div>
            <span className="fp-step-label">{isVi ? 'Xác thực OTP' : 'Verify'}</span>
          </div>

          <div className={`fp-step-item ${step === 'reset' ? 'active' : step === 'success' ? 'completed' : ''}`}>
            <div className="fp-step-circle">
              {step === 'success' ? <Check size={14} /> : '3'}
            </div>
            <span className="fp-step-label">{isVi ? 'Mật khẩu mới' : 'Reset'}</span>
          </div>

          <div className={`fp-step-item ${step === 'success' ? 'active' : ''}`}>
            <div className="fp-step-circle">
              {step === 'success' ? <Check size={14} /> : '4'}
            </div>
            <span className="fp-step-label">{isVi ? 'Hoàn tất' : 'Done'}</span>
          </div>
        </div>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="login-error-alert login-error-alert-spaced">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: REQUEST EMAIL ================= */}
        {step === 'request' && (
          <div>

              <div className="login-header-group">
                <h2 className="login-form-title">
                  {isVi ? 'Quên mật khẩu?' : 'Forgot Password?'}
                </h2>
              </div>

              {/* Quick Select Testing Accounts */}
              <div className="fp-quick-accounts">
                <span className="fp-quick-label">
                  {isVi ? 'Tài khoản mẫu để thử nghiệm nhanh:' : 'Quick demo accounts:'}
                </span>
                <div className="fp-quick-pills">
                  <button 
                    type="button" 
                    className="fp-quick-pill-btn"
                    onClick={() => handleQuickSelectEmail('admin@eh.com')}
                  >
                    admin@eh.com (Admin)
                  </button>
                  <button 
                    type="button" 
                    className="fp-quick-pill-btn"
                    onClick={() => handleQuickSelectEmail('teacher@eh.com')}
                  >
                    teacher@eh.com (Teacher)
                  </button>
                  <button 
                    type="button" 
                    className="fp-quick-pill-btn"
                    onClick={() => handleQuickSelectEmail('student@eh.com')}
                  >
                    student@eh.com (Student)
                  </button>
                </div>
              </div>

              <form onSubmit={handleRequestOtp}>
                <div className="login-input-group">
                  <label className="login-input-label">
                    <span>{isVi ? 'Địa chỉ Email' : 'Email Address'}</span>
                  </label>
                  <div className="login-input-wrapper">
                    <Mail size={16} className="login-input-icon" />
                    <input 
                      type="email"
                      className="login-input-field"
                      placeholder="yourname@eh.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="login-submit-btn" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>{isVi ? 'Đang gửi mã...' : 'Sending code...'}</span>
                  ) : (
                    <>
                      <span>{isVi ? 'Gửi mã xác nhận' : 'Send Recovery Code'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 2: VERIFY OTP ================= */}
          {step === 'verify' && (
            <div>
              <div className="login-header-group">
                <h2 className="login-form-title">
                  {isVi ? 'Xác thực mã OTP' : 'Enter Verification Code'}
                </h2>
                <p className="login-form-desc">
                  {isVi 
                    ? `Mã bảo mật 6 số đã được gửi tới: ${email}` 
                    : `A 6-digit verification code has been dispatched to: ${email}`}
                </p>
              </div>

              {/* Realistic Simulated Email Card for Demo & QA */}
              <div className="fp-simulated-email-card">
                <div className="fp-simulated-email-head">
                  <div className="fp-simulated-email-title">
                    <Mail size={14} />
                    <span>{isVi ? 'Hòm thư mô phỏng (Test Box)' : 'Simulated Inbox (Test Box)'}</span>
                  </div>
                  <span className="fp-simulated-email-badge">EnglishHub Security</span>
                </div>
                <div className="fp-simulated-email-body">
                  <div>
                    <div className="fp-simulated-label">
                      {isVi ? 'Mã OTP của bạn là:' : 'Your OTP Code:'}
                    </div>
                    <span className="fp-simulated-otp-code">{generatedOtp}</span>
                  </div>
                  <button 
                    type="button" 
                    className="fp-btn-autofill-otp"
                    onClick={handleAutofillOtp}
                  >
                    <span>{isVi ? 'Tự động điền mã' : 'Auto-fill Code'}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp}>
                {/* 6 Digit Inputs */}
                <div className="fp-otp-grid" onPaste={handlePasteOtp}>
                  {otp.map((digit, idx) => (
                    <input 
                      key={idx}
                      ref={el => { otpInputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="fp-otp-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <div className="fp-resend-row">
                  <span>{isVi ? 'Chưa nhận được mã?' : "Didn't receive code?"}</span>
                  <button 
                    type="button" 
                    className="fp-resend-btn"
                    disabled={resendSeconds > 0}
                    onClick={handleResendOtp}
                  >
                    {resendSeconds > 0 
                      ? `${isVi ? 'Gửi lại sau' : 'Resend in'} ${resendSeconds}s` 
                      : (isVi ? 'Gửi lại mã OTP' : 'Resend OTP Code')}
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="login-submit-btn" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span>{isVi ? 'Đang xác thực...' : 'Verifying...'}</span>
                  ) : (
                    <>
                      <span>{isVi ? 'Xác thực mã OTP' : 'Verify Code'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 3: RESET PASSWORD ================= */}
          {step === 'reset' && (
            <div>
              <div className="login-header-group">
                <h2 className="login-form-title">
                  {isVi ? 'Đặt lại mật khẩu' : 'Reset Password'}
                </h2>
              </div>

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

                {/* Password Criteria Checklist */}
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
                      <span>{isVi ? 'Cập nhật mật khẩu' : 'Update Password'}</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* ================= STEP 4: SUCCESS CELEBRATION ================= */}
          {step === 'success' && (
            <div className="fp-success-box">
              <div className="fp-success-icon-wrap">
                <CheckCircle2 size={42} strokeWidth={2.4} />
              </div>

              <h2 className="fp-success-title">
                {isVi ? 'Đặt lại mật khẩu thành công!' : 'Password Reset Successfully!'}
              </h2>

              <p className="fp-success-desc">
                {isVi 
                  ? 'Mật khẩu tài khoản của bạn đã được cập nhật thành công. Tất cả các phiên đăng nhập cũ trên các thiết bị khác đã được đăng xuất an toàn.' 
                  : 'Your account password has been updated securely. All legacy sessions on other devices have been safely revoked.'}
              </p>

              <div className="fp-redirect-bar-track">
                <div 
                  className="fp-redirect-bar-fill" 
                  style={{ width: `${((5 - redirectSeconds) / 5) * 100}%` }}
                />
              </div>

              <p className="fp-redirect-hint">
                {isVi ? `Tự động chuyển về trang đăng nhập sau ${redirectSeconds} giây...` : `Auto redirecting to login in ${redirectSeconds} seconds...`}
              </p>

              <button 
                type="button" 
                className="login-submit-btn fp-success-btn"
                onClick={() => navigate('/login')}
              >
                <span>{isVi ? 'Đăng nhập ngay bây giờ' : 'Login Now'}</span>
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

export default ForgotPassword;
