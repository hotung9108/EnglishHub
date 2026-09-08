import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage, LanguageProvider } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types/auth';

const MOCK_ACCOUNTS: Record<string, User> = {
  'admin@eh.com': { id: '1', name: 'Nguyễn Văn Hùng (Admin)', email: 'admin@eh.com', role: 'admin' },
  'teacher@eh.com': { id: '2', name: 'Cô Lan (Teacher)', email: 'teacher@eh.com', role: 'teacher' },
  'student@eh.com': { id: '3', name: 'Bé Na (Student)', email: 'student@eh.com', role: 'student' },
};

const LoginForm = () => {
  const { t, toggleLanguage } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('admin@eh.com');
  const [error, setError] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const user = MOCK_ACCOUNTS[email];
    if (user) {
      login(user);
      
      // Where did they come from?
      const from = location.state?.from?.pathname || '/';
      
      if (from === '/') {
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role === 'teacher') navigate('/teacher', { replace: true });
        else if (user.role === 'student') navigate('/student', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError('Email không tồn tại. Hãy dùng admin@eh.com, teacher@eh.com, hoặc student@eh.com');
    }
  };

  const quickLogin = (mockEmail: string) => {
    setEmail(mockEmail);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'var(--background)' }}>
      <main style={{
        width: '100%',
        maxWidth: 'var(--container-max-width)',
        display: 'flex',
        flexDirection: 'row',
        background: 'var(--surface-container-lowest)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        minHeight: '600px',
        border: '1px solid rgba(197, 197, 211, 0.3)'
      }}>
        {/* Left Side: Illustrative Area */}
        <div style={{
          width: '50%',
          position: 'relative',
          background: 'var(--surface-container)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '48px'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0, 35, 111, 0.8), transparent)',
            zIndex: 1
          }}></div>
          <div style={{ position: 'relative', zIndex: 2, color: 'var(--on-primary)' }}>
            <h2 className="headline-lg" style={{ marginBottom: '16px' }}>Focus on Growth</h2>
            <p className="body-lg" style={{ opacity: 0.9, maxWidth: '400px' }}>
              Enter your digital sanctuary. A frictionless environment designed for academic achievement.
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div style={{
          width: '50%',
          padding: '64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'var(--surface-container-lowest)'
        }}>
          <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'var(--primary)',
                borderRadius: 'var(--radius-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '24px',
                boxShadow: 'var(--shadow-btn)',
                color: 'var(--on-primary)',
                fontWeight: 700,
                fontSize: '24px'
              }}>
                EH
              </div>
              <h1 className="headline-lg text-primary" style={{ textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                {t('login')}
              </h1>
              <p className="body-md text-on-surface-variant">
                {t('systemSub')}
              </p>
            </div>

            {/* Quick Login Buttons (Mock) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
              <button onClick={() => quickLogin('admin@eh.com')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '12px', background: email === 'admin@eh.com' ? 'var(--primary-container)' : 'transparent' }}>Admin</button>
              <button onClick={() => quickLogin('teacher@eh.com')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '12px', background: email === 'teacher@eh.com' ? 'var(--primary-container)' : 'transparent' }}>Teacher</button>
              <button onClick={() => quickLogin('student@eh.com')} style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--outline-variant)', fontSize: '12px', background: email === 'student@eh.com' ? 'var(--primary-container)' : 'transparent' }}>Student</button>
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid rgba(197, 197, 211, 0.5)', marginBottom: '32px' }} />

            {/* Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {error && <div style={{ color: 'var(--error)', fontSize: '14px', background: 'var(--error-container)', padding: '12px', borderRadius: '8px' }}>{error}</div>}
              
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="label-md text-on-surface" style={{ textTransform: 'uppercase' }}>
                  {t('email')} *
                </label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eh.com"
                  required
                />
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="label-md text-on-surface" style={{ textTransform: 'uppercase' }}>
                  {t('password')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="input"
                    defaultValue="password123"
                  />
                  <button
                    type="button"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--outline)',
                      fontSize: '14px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {t('show')}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                  <span className="body-md text-on-surface-variant">{t('remember')}</span>
                </label>
                <a href="#" className="label-md text-primary" style={{ textDecoration: 'none' }}>
                  {t('forgot')}
                </a>
              </div>

              {/* Submit */}
              <div style={{ paddingTop: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', textTransform: 'uppercase', fontWeight: 700 }}>
                  {t('loginBtn')} &rarr;
                </button>
              </div>
            </form>

            {/* Language Switcher */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                onClick={toggleLanguage}
                className="label-md text-primary"
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-default)', border: '1px solid var(--outline-variant)' }}
              >
                {t('switchLang')}
              </button>
            </div>
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
