import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { AdminSetup } from './AdminSetup';

// ─── Shared CSS ───────────────────────────────────────────────────────────────

const authCss = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --teal:   #329D9C;
    --teal-d: #205072;
    --teal-l: #56C596;
    --mint:   #7BE495;
    --foam:   #CFF4D2;
    --bg:     #f6fbf8;
    --border: #e2ede8;
    --text:   #1c3a2e;
    --muted:  #7a9a8a;
    --r:      10px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .auth-root {
    min-height: 100vh;
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text);
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  .auth-header {
    background: rgba(246,251,248,0.94);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--border);
  }
  .auth-header-inner {
    max-width: 480px; margin: 0 auto;
    padding: 16px 24px 12px;
    display: flex; align-items: center; gap: 12px;
  }
  .auth-back-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 12px; border-radius: 20px;
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--muted); font-size: 12.5px; font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
  }
  .auth-back-btn:hover:not(:disabled) { border-color: var(--teal-d); color: var(--teal-d); }
  .auth-back-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .auth-eyebrow {
    font-size: 11px; font-weight: 500; letter-spacing: 0.6px;
    text-transform: uppercase; color: var(--teal); margin-bottom: 3px;
  }
  .auth-title {
    font-size: 19px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.3px;
  }
  .auth-progress-rail {
    max-width: 480px; margin: 0 auto;
    height: 2px; background: var(--foam);
  }
  .auth-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--teal), var(--teal-l));
  }

  /* ── Body ── */
  .auth-body {
    max-width: 480px; margin: 0 auto; width: 100%;
    padding: 40px 24px 80px;
    display: flex; flex-direction: column; gap: 28px;
    flex: 1;
  }

  .auth-section-title {
    font-size: 24px; font-weight: 600;
    color: var(--teal-d); letter-spacing: -0.5px;
    line-height: 1.2; margin-bottom: 6px;
  }
  .auth-section-sub {
    font-size: 14px; color: var(--muted); line-height: 1.5;
  }
  .auth-divider { border: none; border-top: 1px solid var(--border); }

  /* ── Form fields ── */
  .auth-fields { display: flex; flex-direction: column; gap: 0; }
  .auth-field {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0; border-bottom: 1px solid var(--border);
    position: relative;
  }
  .auth-fields > .auth-field:first-child {
    border-top: 1px solid var(--border);
  }
  .auth-icon-wrap {
    width: 32px; height: 32px; border-radius: 8px;
    background: rgba(50,157,156,0.07);
    border: 1px solid rgba(50,157,156,0.12);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--teal);
  }
  .auth-field-inner { flex: 1; min-width: 0; }
  .auth-field-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.5px;
    text-transform: uppercase; color: var(--muted);
    display: block; margin-bottom: 4px;
  }
  .auth-input {
    width: 100%; border: none; outline: none;
    background: transparent;
    font-size: 14px; font-weight: 500; color: var(--text);
    font-family: 'DM Sans', sans-serif;
    padding: 0;
  }
  .auth-input::placeholder { color: #b4ccc0; font-weight: 400; }
  .auth-input:disabled { opacity: 0.5; cursor: not-allowed; }
  
  /* ── Select dropdown styling ── */
  .auth-field:has(.auth-select) {
    position: relative;
  }
  .auth-select {
    width: 100%; border: none; outline: none;
    background: transparent; appearance: none;
    font-size: 14px; font-weight: 500; color: var(--text);
    font-family: 'DM Sans', sans-serif;
    padding: 0 28px 0 0; cursor: pointer;
    position: relative; z-index: 1;
  }
  .auth-select:disabled { opacity: 0.5; cursor: not-allowed; }
  .auth-field:has(.auth-select)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237a9a8a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: center;
    background-size: contain;
    pointer-events: none;
    z-index: 0;
  }
  .auth-field:has(.auth-select:focus) {
    border-color: var(--teal);
  }
  
  .auth-field-hint {
    font-size: 11px; color: var(--muted); margin-top: 3px;
    font-family: 'DM Mono', monospace;
  }
  .auth-toggle-btn {
    padding: 4px; background: none; border: none;
    color: var(--muted); cursor: pointer;
    display: flex; align-items: center;
    transition: color 0.15s; flex-shrink: 0;
  }
  .auth-toggle-btn:hover { color: var(--teal-d); }

  /* ── Error ── */
  .auth-error {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500; color: #dc2626;
  }

  /* ── Submit button ── */
  .auth-submit {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 11px 18px;
    border-radius: var(--r);
    border: 1.5px solid var(--teal);
    background: var(--teal);
    color: white;
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .auth-submit:hover:not(:disabled) { background: var(--teal-d); border-color: var(--teal-d); }
  .auth-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .auth-submit--danger {
    border-color: var(--teal-d); background: var(--teal-d);
  }
  .auth-submit--danger:hover:not(:disabled) { background: #163d5c; border-color: #163d5c; }

  /* ── Secondary actions ── */
  .auth-actions { display: flex; flex-direction: column; gap: 10px; }
  .auth-action-btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; padding: 11px 18px;
    border-radius: var(--r);
    border: 1.5px solid var(--border);
    background: transparent;
    color: var(--text);
    font-size: 13.5px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.15s;
  }
  .auth-action-btn:hover:not(:disabled) { border-color: var(--teal); color: var(--teal); }
  .auth-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Success screen ── */
  .auth-success {
    min-height: 100vh; background: var(--bg);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 12px; font-family: 'DM Sans', sans-serif;
    padding: 24px;
  }
  @keyframes auth-pop { from { opacity:0; transform: scale(0.75); } to { opacity:1; transform: scale(1); } }
  .auth-success-icon {
    color: var(--teal);
    animation: auth-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .auth-success-title {
    font-size: 22px; font-weight: 600; color: var(--teal-d);
    letter-spacing: -0.3px;
  }
  .auth-success-sub { font-size: 14px; color: var(--muted); text-align: center; }

  /* ── Footer ── */
  .auth-footer {
    text-align: center; font-size: 11px; color: var(--muted);
    font-weight: 500; letter-spacing: 0.3px;
    font-family: 'DM Mono', monospace;
  }

  /* ── Spin util ── */
  .spin { animation: _spin 0.7s linear infinite; }
  @keyframes _spin { to { transform: rotate(360deg); } }
`;

// ─── FieldRow Component ───────────────────────────────────────────────────────

const FieldRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  first?: boolean;
}> = ({ icon, label, hint, trailing, children, first }) => (
  <div className="auth-field" style={first ? { borderTop: '1px solid var(--border)' } : {}}>
    <div className="auth-icon-wrap">{icon}</div>
    <div className="auth-field-inner">
      <span className="auth-field-label">{label}</span>
      {children}
      {hint && <p className="auth-field-hint">{hint}</p>}
    </div>
    {trailing}
  </div>
);

// ─── Main Auth Component ──────────────────────────────────────────────────────

type AuthPage = 'login' | 'signup' | 'admin' | 'forgot-password' | 'reset-password';

interface AuthProps {
  initialPage?: AuthPage;
}

export const Auth: React.FC<AuthProps> = ({ initialPage = 'login' }) => {
  const { login, adminLogin, isLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [currentPage, setCurrentPage] = useState<AuthPage>(initialPage);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // ─── Login handlers ───
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      const msg = 'Please enter both email and password.';
      setError(msg);
      showError(msg);
      return;
    }
    try {
      await login(email, password);
      showSuccess('Welcome back! 👋');
    } catch (err: any) {
      const errMsg = err.message || 'Login failed. Please try again.';
      setError(errMsg);
      showError(errMsg, 5000);
    }
  };

  // ─── Signup handlers ───
  // ─── Admin login handlers ───
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!adminEmail || !adminPassword) {
      const msg = 'Please enter both email and password.';
      setAdminError(msg);
      showError(msg);
      return;
    }
    try {
      await adminLogin(adminEmail, adminPassword);
      showSuccess('Admin login successful! 🎉');
    } catch (err: any) {
      const errMsg = err.message || 'Authentication failed. Please check your credentials.';
      setAdminError(errMsg);
      showError(errMsg, 5000);
    }
  };

  // ─── Render login page ───
  if (currentPage === 'login') {
    return (
      <>
        <style>{authCss}</style>
        <div className="auth-root">
          <header className="auth-header">
            <div className="auth-header-inner">
              <div>
                <p className="auth-eyebrow">Welcome back</p>
                <h1 className="auth-title">Sign In</h1>
              </div>
            </div>
            <div className="auth-progress-rail">
              <div className="auth-progress-fill" style={{ width: '100%' }} />
            </div>
          </header>

          <main className="auth-body">
            <section>
              <h2 className="auth-section-title">Enumerator Portal</h2>
              <p className="auth-section-sub">Sign in to your account to start collecting waste survey data</p>
            </section>

            <hr className="auth-divider" />

            {error && <div className="auth-error"><AlertCircle size={14} />{error}</div>}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div className="auth-fields">
                <FieldRow icon={<Mail size={14} />} label="Email Address" first>
                  <input
                    className="auth-input"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading}
                    placeholder="enumerator@geowaste.com"
                  />
                </FieldRow>
                <FieldRow
                  icon={<Lock size={14} />}
                  label="Password"
                  trailing={
                    <button
                      type="button"
                      className="auth-toggle-btn"
                      onClick={() => setShowPassword((p) => !p)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                >
                  <input
                    className="auth-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    disabled={isLoading}
                    placeholder="••••••••••••"
                  />
                </FieldRow>
              </div>

              <button type="submit" className="auth-submit" disabled={isLoading}>
                {isLoading ? <><Loader2 size={15} className="spin" />Signing in…</> : <><LogIn size={15} />Sign In</>}
              </button>
            </form>

            <hr className="auth-divider" />

            <div className="auth-actions">
              <button 
                className="auth-action-btn" 
                onClick={() => setCurrentPage('forgot-password')} 
                disabled={isLoading}
                style={{ fontSize: '13px' }}
              >
                Forgot Password?
              </button>
              <button className="auth-action-btn" onClick={() => setCurrentPage('signup')} disabled={isLoading}>
                <ShieldCheck size={15} /> Register as Admin
              </button>
              <button className="auth-action-btn" onClick={() => setCurrentPage('admin')} disabled={isLoading}>
                <ShieldCheck size={15} /> Admin Login
              </button>
            </div>

            <p className="auth-footer">GeoKollect · Enumerators Only</p>
          </main>
        </div>
      </>
    );
  }

  // ─── Render forgot password page ───
  if (currentPage === 'forgot-password') {
    return <ForgotPasswordPage onBack={() => setCurrentPage('login')} />;
  }

  // ─── Render reset password page ───
  if (currentPage === 'reset-password') {
    return <ResetPasswordPage onBack={() => setCurrentPage('login')} />;
  }

  // ─── Render admin login page ───
  if (currentPage === 'admin') {
    return (
      <>
        <style>{authCss}</style>
        <div className="auth-root">
          <header className="auth-header">
            <div className="auth-header-inner">
              <button
                className="auth-back-btn"
                onClick={() => {
                  setCurrentPage('login');
                  setAdminError(null);
                  setAdminEmail('');
                  setAdminPassword('');
                }}
                disabled={isLoading}
              >
                <ArrowLeft size={13} /> Back
              </button>
              <div>
                <p className="auth-eyebrow">Restricted access</p>
                <h1 className="auth-title">Admin Portal</h1>
              </div>
            </div>
            <div className="auth-progress-rail">
              <div className="auth-progress-fill" style={{ width: '100%' }} />
            </div>
          </header>

          <main className="auth-body">
            <section>
              <h2 className="auth-section-title">Administrator Sign In</h2>
              <p className="auth-section-sub">Restricted to authorized administrators only</p>
            </section>

            <hr className="auth-divider" />

            {adminError && <div className="auth-error"><AlertCircle size={14} />{adminError}</div>}

            <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div className="auth-fields">
                <FieldRow icon={<Mail size={14} />} label="Email Address" first>
                  <input
                    className="auth-input"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => {
                      setAdminEmail(e.target.value);
                      setAdminError(null);
                    }}
                    disabled={isLoading}
                    placeholder="admin@geowaste.com"
                  />
                </FieldRow>
                <FieldRow
                  icon={<Lock size={14} />}
                  label="Password"
                  trailing={
                    <button
                      type="button"
                      className="auth-toggle-btn"
                      onClick={() => setShowAdminPassword((p) => !p)}
                      tabIndex={-1}
                    >
                      {showAdminPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                >
                  <input
                    className="auth-input"
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setAdminError(null);
                    }}
                    disabled={isLoading}
                    placeholder="••••••••••••"
                  />
                </FieldRow>
              </div>

              <button type="submit" className="auth-submit auth-submit--danger" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    Sign in as Admin
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">GeoKollect · Administrators Only</p>
          </main>
        </div>
      </>
    );
  }

  // ─── Render admin setup page ───
  if (currentPage === 'signup') {
    return <AdminSetup onBackToLogin={() => setCurrentPage('login')} />;
  }

  return null;
};

export default Auth;
