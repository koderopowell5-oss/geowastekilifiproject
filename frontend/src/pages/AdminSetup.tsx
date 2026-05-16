import React, { useState } from 'react';
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { buildApiUrl } from '../config/api';

interface AdminSetupProps {
  onBackToLogin: () => void;
}

const WARDS = ['Mombasa', 'Kilifi', 'Malindi', 'Lamu', 'Tanariver'];

export const AdminSetup: React.FC<AdminSetupProps> = ({ onBackToLogin }) => {
  const { showSuccess, showError } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<'registration' | 'verification'>('registration');
  const [verificationCode, setVerificationCode] = useState('');
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    ward: '',
    phone: '',
    projectName: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.projectName.trim()) return 'Project name is required';
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
    if (!formData.password) return 'Password is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    if (!formData.ward) return 'Ward is required';
    if (!formData.phone.trim()) return 'Phone is required';
    if (!/^\+?254[0-9]{9}$/.test(formData.phone.replace(/\s+/g, ''))) {
      return 'Invalid Kenyan phone number format (e.g., +254712345678)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      // Move to verification step
      setRegistrationEmail(formData.email);
      setStep('verification');
      setError(null);
      showSuccess('Verification code sent to your email');
    } catch (err: any) {
      const errMsg = err.message || 'Failed to create admin account';
      setError(errMsg);
      showError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      setVerificationError('Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/verify-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registrationEmail,
          verificationCode: verificationCode.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Verification failed');
      }

      showSuccess('Email verified! Logging in...');
      // Store token and redirect
      const token = result.data?.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      // Reload to let AuthContext handle redirect
      setTimeout(() => window.location.href = '/', 1500);
    } catch (err: any) {
      const errMsg = err.message || 'Verification failed';
      setVerificationError(errMsg);
      showError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

    :root {
      --teal:   #329D9C;
      --teal-d: #205072;
      --teal-l: #56C596;
      --foam:   #CFF4D2;
      --bg:     #f6fbf8;
      --border: #e2ede8;
      --text:   #1c3a2e;
      --muted:  #7a9a8a;
      --r:      10px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .admin-setup-root {
      min-height: 100vh;
      background: var(--bg);
      font-family: 'DM Sans', sans-serif;
      color: var(--text);
      display: flex;
      flex-direction: column;
    }

    .admin-setup-header {
      background: rgba(246,251,248,0.94);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--border);
    }

    .admin-setup-header-inner {
      max-width: 480px;
      margin: 0 auto;
      padding: 16px 24px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .admin-setup-back-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--teal);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .admin-setup-back-btn:hover {
      background: rgba(50,157,156,0.05);
    }

    .admin-setup-header-inner > div {
      flex: 1;
      min-width: 0;
    }

    .admin-setup-eyebrow {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--muted);
      margin-bottom: 2px;
      font-weight: 600;
    }

    .admin-setup-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--teal-d);
      letter-spacing: -0.3px;
    }

    .admin-setup-progress-rail {
      max-width: 480px;
      margin: 0 auto;
      height: 2px;
      background: var(--foam);
    }

    .admin-setup-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--teal), #56C596);
      width: 100%;
    }

    .admin-setup-body {
      flex: 1;
      max-width: 480px;
      margin: 0 auto;
      width: 100%;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
    }

    .admin-setup-section {
      margin-bottom: 28px;
    }

    .admin-setup-section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--teal-d);
      margin-bottom: 4px;
    }

    .admin-setup-section-sub {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.4;
    }

    .admin-setup-error {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #dc2626;
      margin-bottom: 16px;
      padding: 10px 12px;
      background: rgba(220,38,38,0.06);
      border-radius: 6px;
    }

    .admin-setup-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .admin-setup-fields {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border);
      border-radius: var(--r);
      overflow: hidden;
    }

    .admin-setup-field {
      display: flex;
      align-items: stretch;
      gap: 12px;
      padding: 14px 14px;
      border-bottom: 1px solid var(--border);
    }

    .admin-setup-fields > .admin-setup-field:last-child {
      border-bottom: none;
    }

    .admin-setup-field-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(50,157,156,0.07);
      border: 1px solid rgba(50,157,156,0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--teal);
    }

    .admin-setup-field-inner {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .admin-setup-field-label {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 4px;
    }

    .admin-setup-input,
    .admin-setup-select {
      width: 100%;
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      font-family: 'DM Sans', sans-serif;
      padding: 0;
    }

    .admin-setup-input::placeholder {
      color: #b4ccc0;
      font-weight: 400;
    }

    .admin-setup-input:disabled,
    .admin-setup-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .admin-setup-select {
      cursor: pointer;
      appearance: none;
      padding-right: 20px;
      position: relative;
      z-index: 1;
    }

    .admin-setup-field:has(.admin-setup-select)::after {
      content: '';
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 14px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%237a9a8a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: contain;
      pointer-events: none;
      z-index: 0;
    }

    .admin-setup-field-toggle {
      padding: 4px;
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: color 0.15s;
      flex-shrink: 0;
    }

    .admin-setup-field-toggle:hover {
      color: var(--teal-d);
    }

    .admin-setup-submit {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 11px 18px;
      border-radius: var(--r);
      border: 1.5px solid var(--teal);
      background: var(--teal);
      color: white;
      font-size: 13.5px;
      font-weight: 600;
      font-family: 'DM Sans', sans-serif;
      cursor: pointer;
      transition: all 0.15s;
    }

    .admin-setup-submit:hover:not(:disabled) {
      background: var(--teal-d);
      border-color: var(--teal-d);
    }

    .admin-setup-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .admin-setup-footer {
      text-align: center;
      font-size: 11px;
      color: var(--muted);
      margin-top: 16px;
    }

    @media (max-width: 600px) {
      .admin-setup-body {
        padding: 24px 16px;
      }

      .admin-setup-section-title {
        font-size: 13px;
      }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="admin-setup-root">
        <header className="admin-setup-header">
          <div className="admin-setup-header-inner">
            <button
              className="admin-setup-back-btn"
              onClick={() => {
                if (step === 'verification') {
                  setStep('registration');
                  setVerificationCode('');
                  setVerificationError(null);
                } else {
                  onBackToLogin();
                }
              }}
              disabled={isLoading}
            >
              <ArrowLeft size={13} /> Back
            </button>
            <div>
              <p className="admin-setup-eyebrow">Welcome</p>
              <h1 className="admin-setup-title">
                {step === 'registration' ? 'Admin Registration' : 'Verify Email'}
              </h1>
            </div>
          </div>
          <div className="admin-setup-progress-rail">
            <div className="admin-setup-progress-fill" style={{ width: step === 'verification' ? '100%' : '50%' }} />
          </div>
        </header>

        <main className="admin-setup-body">
          {step === 'registration' ? (
            <>
              <section className="admin-setup-section">
                <h2 className="admin-setup-section-title">Create Your Admin Account</h2>
                <p className="admin-setup-section-sub">
                  Register to access the admin dashboard where you can create enumerator accounts and manage projects.
                </p>
              </section>

              {error && (
                <div className="admin-setup-error">
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="admin-setup-form">
                <div className="admin-setup-fields">
              <div className="admin-setup-field">
                <div className="admin-setup-field-icon">
                  <MapPin size={14} />
                </div>
                <div className="admin-setup-field-inner">
                  <label className="admin-setup-field-label">Project Name</label>
                  <input
                    className="admin-setup-input"
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="GeoWaste Kilifi"
                  />
                </div>
              </div>

              <div className="admin-setup-field">
                <div className="admin-setup-field-icon">
                  <User size={14} />
                </div>
                <div className="admin-setup-field-inner">
                  <label className="admin-setup-field-label">Full Name</label>
                  <input
                    className="admin-setup-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="admin-setup-field">
                <div className="admin-setup-field-icon">
                  <Mail size={14} />
                </div>
                <div className="admin-setup-field-inner">
                  <label className="admin-setup-field-label">Email Address</label>
                  <input
                    className="admin-setup-input"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="admin@geowaste.com"
                  />
                </div>
              </div>

              <div className="admin-setup-field">
                <div className="admin-setup-field-icon">
                  <Lock size={14} />
                </div>
                <div className="admin-setup-field-inner">
                  <label className="admin-setup-field-label">Password</label>
                  <input
                    className="admin-setup-input"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="••••••••••••"
                  />
                </div>
                <button
                  type="button"
                  className="admin-setup-field-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="admin-setup-field">
                <div className="admin-setup-field-icon">
                  <Lock size={14} />
                </div>
                <div className="admin-setup-field-inner">
                  <label className="admin-setup-field-label">Confirm Password</label>
                  <input
                    className="admin-setup-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="••••••••••••"
                  />
                </div>
                <button
                  type="button"
                  className="admin-setup-field-toggle"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <div className="admin-setup-field">
                <div className="admin-setup-field-icon">
                  <MapPin size={14} />
                </div>
                <div className="admin-setup-field-inner">
                  <label className="admin-setup-field-label">Ward</label>
                  <select
                    className="admin-setup-select"
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">Select a ward</option>
                    {WARDS.map((ward) => (
                      <option key={ward} value={ward}>
                        {ward}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="admin-setup-field">
                <div className="admin-setup-field-icon">
                  <Phone size={14} />
                </div>
                <div className="admin-setup-field-inner">
                  <label className="admin-setup-field-label">Phone Number</label>
                  <input
                    className="admin-setup-input"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="+254712345678"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="admin-setup-submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={15} className="spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <User size={15} />
                  Create Admin Account
                </>
              )}
            </button>
              </form>
            </>
          ) : (
            <>
              <section className="admin-setup-section">
                <h2 className="admin-setup-section-title">Verify Your Email</h2>
                <p className="admin-setup-section-sub">
                  We've sent a 6-digit verification code to {registrationEmail}. Enter it below to complete registration.
                </p>
              </section>

              {verificationError && (
                <div className="admin-setup-error">
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{verificationError}</span>
                </div>
              )}

              <form onSubmit={handleVerificationSubmit} className="admin-setup-form">
                <div className="admin-setup-fields">
                  <div className="admin-setup-field">
                    <div className="admin-setup-field-icon">
                      <Lock size={14} />
                    </div>
                    <div className="admin-setup-field-inner">
                      <label className="admin-setup-field-label">Verification Code</label>
                      <input
                        className="admin-setup-input"
                        type="text"
                        value={verificationCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setVerificationCode(val);
                          setVerificationError(null);
                        }}
                        disabled={isLoading}
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="admin-setup-submit" disabled={isLoading || verificationCode.length !== 6}>
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <Mail size={15} />
                      Verify & Continue
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="admin-setup-footer">
            GeoWaste Kilifi · Administrators
          </p>
        </main>
      </div>
    </>
  );
};
