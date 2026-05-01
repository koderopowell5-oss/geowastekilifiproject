import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { buildApiUrl } from '../config/api';

const WARDS = ['Mombasa', 'Kilifi', 'Malindi', 'Lamu', 'Tanariver'];

export const OTPSignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  
  // Step 1: User enters registration details
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [ward, setWard] = useState('');
  const [phone, setPhone] = useState('');
  
  // Step 2: User enters OTP
  const [otp, setOtp] = useState('');
  const [otpResendCountdown, setOtpResendCountdown] = useState(0);
  const [otpAttempts, setOtpAttempts] = useState(0);

  // Handle OTP resend countdown
  useEffect(() => {
    if (otpResendCountdown > 0) {
      const timer = setTimeout(() => setOtpResendCountdown(otpResendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendCountdown]);

  const validateDetailsForm = (): boolean => {
    if (!email || !password || !confirmPassword || !name || !ward || !phone) {
      showError('All fields are required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return false;
    }

    if (!/^\+254\d{9}$/.test(phone)) {
      showError('Please enter a valid phone number (+254XXXXXXXXX)');
      return false;
    }

    return true;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateDetailsForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/otp/request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, ward, phone }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to request OTP');
      }

      showSuccess('OTP sent to your email! Check your inbox.');
      setStep('otp');
      setOtpResendCountdown(60);
      setOtpAttempts(0);
    } catch (error: any) {
      showError(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/otp/verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const result = await response.json();
        setOtpAttempts(otpAttempts + 1);
        throw new Error(result.message || 'Invalid OTP');
      }

      const result = await response.json();
      localStorage.setItem('token', result.data.id.toString());
      localStorage.setItem('user', JSON.stringify(result.data));
      
      showSuccess('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      showError(error.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/otp/resend'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to resend OTP');
      }

      showSuccess('OTP resent to your email');
      setOtpResendCountdown(60);
      setOtp('');
    } catch (error: any) {
      showError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="otp-signup-container">
        <div className="otp-signup-card">
          <div className="otp-signup-header">
            <h1>Create Your Account</h1>
            <p>Join GeoWaste Kilifi to start collecting data</p>
          </div>

          {step === 'details' ? (
            <form onSubmit={handleRequestOTP} className="otp-signup-form">
              <div className="otp-form-group">
                <label htmlFor="name">Full Name</label>
                <div className="otp-input-wrapper">
                  <User size={18} className="otp-input-icon" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="otp-form-group">
                <label htmlFor="email">Email Address</label>
                <div className="otp-input-wrapper">
                  <Mail size={18} className="otp-input-icon" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="otp-form-group">
                <label htmlFor="ward">Ward</label>
                <div className="otp-input-wrapper">
                  <MapPin size={18} className="otp-input-icon" />
                  <select
                    id="ward"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="">Select a ward</option>
                    {WARDS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="otp-form-group">
                <label htmlFor="phone">Phone Number</label>
                <div className="otp-input-wrapper">
                  <Phone size={18} className="otp-input-icon" />
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254XXXXXXXXX"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="otp-form-group">
                <label htmlFor="password">Password</label>
                <div className="otp-input-wrapper">
                  <Lock size={18} className="otp-input-icon" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="otp-form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="otp-input-wrapper">
                  <Lock size={18} className="otp-input-icon" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="otp-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending OTP...
                  </>
                ) : (
                  'Continue with OTP'
                )}
              </button>

              <p className="otp-login-link">
                Already have an account? <a href="/login">Login here</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="otp-signup-form">
              <div className="otp-verify-info">
                <CheckCircle size={32} color="#329D9C" />
                <p>We've sent a 6-digit OTP to</p>
                <p className="otp-email-display">{email}</p>
              </div>

              <div className="otp-form-group">
                <label htmlFor="otp">Enter OTP Code</label>
                <div className="otp-input-wrapper">
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    disabled={isLoading}
                    className="otp-code-input"
                  />
                </div>
              </div>

              {otpAttempts > 0 && otpAttempts < 5 && (
                <div className="otp-warning">
                  <AlertCircle size={16} />
                  <span>Attempts remaining: {5 - otpAttempts}</span>
                </div>
              )}

              <button
                type="submit"
                className="otp-submit-btn"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="otp-resend-section">
                {otpResendCountdown > 0 ? (
                  <p>Resend OTP in {otpResendCountdown}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="otp-resend-btn"
                  >
                    Didn't receive the code? Resend OTP
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('details');
                  setOtp('');
                  setOtpAttempts(0);
                }}
                className="otp-back-btn"
                disabled={isLoading}
              >
                ← Back to Details
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .otp-signup-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f6fbf8 0%, #e8f5f2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'DM Sans', sans-serif;
  }

  .otp-signup-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(32, 80, 114, 0.1);
    width: 100%;
    max-width: 420px;
    padding: 40px 32px;
  }

  .otp-signup-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .otp-signup-header h1 {
    font-size: 24px;
    font-weight: 600;
    color: #205072;
    margin: 0 0 8px 0;
    letter-spacing: -0.3px;
  }

  .otp-signup-header p {
    font-size: 14px;
    color: #7a9a8a;
    margin: 0;
  }

  .otp-signup-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .otp-form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .otp-form-group label {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #205072;
  }

  .otp-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .otp-input-icon {
    position: absolute;
    left: 12px;
    color: #329D9C;
    pointer-events: none;
  }

  .otp-input-wrapper input,
  .otp-input-wrapper select {
    width: 100%;
    padding: 11px 12px 11px 40px;
    border: 1.5px solid #e2ede8;
    border-radius: 8px;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    color: #1c3a2e;
    background: #f6fbf8;
    transition: all 0.2s;
  }

  .otp-input-wrapper input:focus,
  .otp-input-wrapper select:focus {
    outline: none;
    border-color: #329D9C;
    background: white;
  }

  .otp-input-wrapper input:disabled,
  .otp-input-wrapper select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .otp-code-input {
    font-size: 24px !important;
    font-weight: 700;
    letter-spacing: 6px;
    text-align: center;
    font-family: 'DM Mono', monospace !important;
  }

  .otp-submit-btn {
    padding: 12px 16px;
    background: linear-gradient(135deg, #329D9C 0%, #56C596 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: 'DM Sans', sans-serif;
  }

  .otp-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(50, 157, 156, 0.3);
  }

  .otp-submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .otp-resend-btn {
    background: none;
    border: none;
    color: #329D9C;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    text-decoration: underline;
    font-family: 'DM Sans', sans-serif;
    transition: opacity 0.2s;
  }

  .otp-resend-btn:hover:not(:disabled) {
    opacity: 0.8;
  }

  .otp-resend-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .otp-back-btn {
    padding: 10px 16px;
    background: #f6fbf8;
    border: 1.5px solid #e2ede8;
    color: #205072;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    font-family: 'DM Sans', sans-serif;
  }

  .otp-back-btn:hover:not(:disabled) {
    background: #e8f5f2;
    border-color: #329D9C;
  }

  .otp-back-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .otp-verify-info {
    text-align: center;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .otp-verify-info p {
    font-size: 14px;
    color: #1c3a2e;
    margin: 0;
  }

  .otp-email-display {
    font-weight: 600;
    color: #329D9C;
  }

  .otp-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: #fff5f5;
    border: 1px solid #fca5a5;
    border-radius: 6px;
    color: #dc2626;
    font-size: 13px;
    font-weight: 500;
  }

  .otp-resend-section {
    text-align: center;
    padding: 12px 0;
  }

  .otp-resend-section p {
    font-size: 13px;
    color: #7a9a8a;
    margin: 0;
  }

  .otp-login-link {
    text-align: center;
    font-size: 13px;
    color: #7a9a8a;
    margin: 12px 0 0 0;
  }

  .otp-login-link a {
    color: #329D9C;
    text-decoration: none;
    font-weight: 600;
    transition: opacity 0.2s;
  }

  .otp-login-link a:hover {
    opacity: 0.8;
  }

  @media (max-width: 480px) {
    .otp-signup-card {
      padding: 24px 20px;
    }

    .otp-signup-header h1 {
      font-size: 20px;
    }

    .otp-signup-header p {
      font-size: 12px;
    }

    .otp-form-group label {
      font-size: 12px;
    }

    .otp-input-wrapper input,
    .otp-input-wrapper select {
      font-size: 13px;
      padding: 10px 12px 10px 36px;
    }

    .otp-input-icon {
      width: 16px;
      height: 16px;
    }

    .otp-submit-btn {
      font-size: 13px;
      padding: 10px 14px;
    }

    .otp-code-input {
      font-size: 20px !important;
      letter-spacing: 4px;
    }
  }
`;
