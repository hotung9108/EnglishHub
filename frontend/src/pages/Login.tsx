import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage, LanguageProvider } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth';
import { 
  Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight, 
  ShieldCheck, GraduationCap, Users, BookOpen, 
  CheckCircle2, Globe, AlertCircle, Award, Star
} from 'lucide-react';

const MOCK_ACCOUNTS: Record<string, User> = {
  'admin@eh.com': { id: '1', name: 'Nguyễn Văn Hùng (Admin)', email: 'admin@eh.com', role: 'admin' },
  'teacher@eh.com': { id: '2', name: 'Cô Trần Thị Mai Lan (Teacher)', email: 'teacher@eh.com', role: 'teacher' },
  'student@eh.com': { id: '3', name: 'Alice Johnson (Student)', email: 'student@eh.com', role: 'student' },
};

const LoginForm: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const isVi = language === 'vi';
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@eh.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student'>('admin');

  const handleRoleSelect = (role: 'admin' | 'teacher' | 'student') => {
    setSelectedRole(role);
    if (role === 'admin') setEmail('admin@eh.com');
    if (role === 'teacher') setEmail('teacher@eh.com');
    if (role === 'student') setEmail('student@eh.com');
    setError('');
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const user = MOCK_ACCOUNTS[email];
    if (user) {
      login(user);
      const from = location.state?.from?.pathname || '/';
      if (from === '/') {
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'teacher') navigate('/teacher', { replace: true });
        else if (user.role === 'student') navigate('/student', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError(isVi ? 'Tài khoản hoặc mật khẩu không chính xác' : 'Invalid email or password credentials');
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Background ambient lighting effects */}
      <div className="login-ambient-orb-1"></div>
      <div className="login-ambient-orb-2"></div>

      <main className="login-card-container">
        {/* Left Side: Brand Showcase & Features */}
        <div className="login-left-showcase">
          <div>
            {/* Logo */}
            <div className="login-brand-logo">
              <div className="login-logo-icon">
                <GraduationCap size={26} strokeWidth={2.4} />
              </div>
              <div>
                <div className="login-brand-name">EnglishHub</div>
                <div className="login-brand-tag">IELTS & Academic Platform</div>
              </div>
            </div>

            {/* Hero Copy */}
            <h1 className="login-hero-title">
              {isVi ? (
                <>
                  Học tập & Đánh giá Tiếng Anh <span>chuẩn Quốc tế cùng AI</span>
                </>
              ) : (
                <>
                  Next-Generation <span>AI-Assisted</span> English Assessment
                </>
              )}
            </h1>
            <p className="login-hero-desc">
              {isVi
                ? 'Nền tảng đồng bộ dành cho Nhà trường, Giảng viên và Học viên với công nghệ chấm thi AI 4 kỹ năng Listening - Speaking - Reading - Writing.'
                : 'Comprehensive educational ecosystem powering automated rubric evaluation, real-time acoustics, and targeted remediation.'}
            </p>

            {/* Feature Badges */}
            <div className="login-features-list">
              <div className="login-feature-item">
                <div className="login-feature-icon">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="login-feature-text-title">
                    {isVi ? 'AI Chấm Điểm 4 Kỹ Năng' : 'AI Multi-Skill Evaluation'}
                  </h2>
                  <p className="login-feature-text-sub">
                    {isVi ? 'Đánh giá tự động theo chuẩn tiêu chí Band Descriptors của British Council & IDP.' : 'Automated grading calibrated with official IELTS descriptors.'}
                  </p>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon login-feature-icon-purple">
                  <Award size={18} />
                </div>
                <div>
                  <h2 className="login-feature-text-title">
                    {isVi ? 'Phân Tích Âm Vị & Ngữ Điệu Thời Gian Thực' : 'Real-Time Acoustic Diagnostic'}
                  </h2>
                  <p className="login-feature-text-sub">
                    {isVi ? 'Nhận diện phát âm sai, nối âm và độ ngắt nghỉ trôi chảy của bài nói Speaking.' : 'Speech-to-text phoneme precision and fluency rhythm tracking.'}
                  </p>
                </div>
              </div>

              <div className="login-feature-item">
                <div className="login-feature-icon login-feature-icon-green">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h2 className="login-feature-text-title">
                    {isVi ? 'Lộ Trình Ôn Luyện Cá Nhân Hóa' : 'Adaptive Diagnostic Roadmap'}
                  </h2>
                  <p className="login-feature-text-sub">
                    {isVi ? 'Phát hiện lỗ hổng kiến thức và đề xuất bài tập khắc phục trực tiếp.' : 'Pinpoint cognitive traps and generate customized remedial drills.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="login-testimonial">
            <div className="login-testimonial-stars">
              <Star size={13} fill="#facc15" />
              <Star size={13} fill="#facc15" />
              <Star size={13} fill="#facc15" />
              <Star size={13} fill="#facc15" />
              <Star size={13} fill="#facc15" />
              <span className="login-testimonial-rating">5.0 Rating</span>
            </div>
            <p className="login-testimonial-quote">
              {isVi 
                ? '"Hệ thống gợi ý sửa lỗi phát âm và bài viết IELTS giúp em tăng từ Band 6.5 lên 7.5 chỉ sau 2 tháng luyện tập!"' 
                : '"The AI sentence annotation and teacher feedback helped me advance from Band 6.5 to 7.5 in 2 months!"'}
            </p>
            <div className="login-testimonial-author">
              — Alice Johnson (IELTS 8.0 Candidate)
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="login-right-form-wrap">
          <div>
            {/* Top Bar: Language Switcher */}
            <div className="login-top-bar">
              <button
                type="button"
                className="login-lang-btn"
                onClick={toggleLanguage}
              >
                <Globe size={14} color="#2563eb" />
                <span>{isVi ? 'Tiếng Việt (VN)' : 'English (US)'}</span>
              </button>
            </div>

            {/* Form Title */}
            <div className="login-form-title">
              <h2>
                {isVi ? 'Đăng Nhập Tài Khoản' : 'Welcome to EnglishHub'}
              </h2>
              <p>
                {isVi 
                  ? 'Chọn vai trò demo hoặc nhập thông tin đăng nhập của bạn.' 
                  : 'Select a demo role or enter your credentials to access the portal.'}
              </p>
            </div>

            {/* Quick Demo Role Tabs */}
            <div className="login-role-tabs">
              <button
                type="button"
                className={`login-role-tab ${selectedRole === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('admin')}
              >
                <ShieldCheck size={15} />
                <span>Admin</span>
              </button>
              <button
                type="button"
                className={`login-role-tab ${selectedRole === 'teacher' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('teacher')}
              >
                <Users size={15} />
                <span>{isVi ? 'Giáo viên' : 'Teacher'}</span>
              </button>
              <button
                type="button"
                className={`login-role-tab ${selectedRole === 'student' ? 'active' : ''}`}
                onClick={() => handleRoleSelect('student')}
              >
                <BookOpen size={15} />
                <span>{isVi ? 'Học viên' : 'Student'}</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error-box">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleLogin}>
              {/* Email */}
              <div className="login-input-group">
                <label className="login-input-label">
                  <span>{isVi ? 'Địa chỉ Email' : 'Email Address'}</span>
                  <span className="login-role-hint">
                    {selectedRole === 'admin' && (isVi ? 'Quyền: Quản trị viên' : 'Role: Administrator')}
                    {selectedRole === 'teacher' && (isVi ? 'Quyền: Giảng viên' : 'Role: Teacher')}
                    {selectedRole === 'student' && (isVi ? 'Quyền: Học viên' : 'Role: Student')}
                  </span>
                </label>
                <div className="login-input-wrapper">
                  <Mail size={16} className="login-input-icon" />
                  <input
                    type="email"
                    className="login-input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@eh.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="login-input-group">
                <div className="login-input-label">
                  <span>{isVi ? 'Mật khẩu' : 'Password'}</span>
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); alert(isVi ? 'Vui lòng liên hệ Admin để khôi phục mật khẩu.' : 'Please contact your administrator to reset password.'); }}
                    className="login-forgot-link"
                  >
                    {isVi ? 'Quên mật khẩu?' : 'Forgot password?'}
                  </a>
                </div>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="login-pwd-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? (isVi ? 'Ẩn mật khẩu' : 'Hide password') : (isVi ? 'Hiện mật khẩu' : 'Show password')}
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
                  <span>{isVi ? 'Ghi nhớ đăng nhập trên thiết bị này' : 'Remember me on this device'}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button type="submit" className="login-submit-btn">
                <span>{isVi ? 'ĐĂNG NHẬP HỆ THỐNG' : 'SIGN IN TO PORTAL'}</span>
                <ArrowRight size={17} />
              </button>
            </form>
          </div>

          {/* Footer Security Badge */}
          <div className="login-footer">
            <ShieldCheck size={14} color="#10b981" />
            <span>{isVi ? 'Bảo mật chuẩn SSL 256-Bit • Tích hợp AI Chấm Thi EnglishHub' : '256-Bit SSL Encrypted • Powered by EnglishHub AI Engine'}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function LoginPage() {
  return (
    <LanguageProvider>
      <LoginForm />
    </LanguageProvider>
  );
}
