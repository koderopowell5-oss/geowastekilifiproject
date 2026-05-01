import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildApiUrl } from '../config/api';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();
  
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      showError('Invalid reset link');
      navigate('/login');
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(buildApiUrl('/auth/verify-reset-token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        setIsTokenValid(true);
      } else {
        showError('Reset link is invalid or expired');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to verify reset link');
      setTimeout(() => navigate('/login'), 2000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResetSuccess(true);
        showSuccess('Password reset successfully!');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        showError(result.message || 'Failed to reset password');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Loader size={48} color="#329D9C" className="spinner" />
            <p style={{ marginTop: '16px', color: '#666' }}>Verifying your reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <AlertCircle size={48} color="#D32F2F" />
            <p style={{ marginTop: '16px', color: '#D32F2F', fontWeight: 600 }}>
              Invalid or expired reset link
            </p>
            <p style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
              Please request a new password reset link
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="reset-button"
              style={{ marginTop: '24px' }}
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="reset-container">
        <div className="reset-card">
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CheckCircle size={64} color="#329D9C" />
            <h1 style={{ marginTop: '16px', color: '#205072', fontSize: '24px', fontWeight: 600 }}>
              Password Reset Successfully
            </h1>
            <p style={{ marginTop: '8px', color: '#666', marginBottom: '24px' }}>
              Your password has been updated. Redirecting to login...
            </p>
            <button
              onClick={() => navigate('/login')}
              className="reset-button"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header">
          <button onClick={() => navigate('/login')} className="reset-back-btn">
            <ArrowLeft size={18} />
          </button>
          <h1>Reset Password</h1>
          <p className="reset-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrapper">
              <Lock size={18} />
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <Lock size={18} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="password-requirements">
            <p style={{ margin: '0', fontSize: '13px', color: '#666' }}>
              <strong>Password requirements:</strong>
            </p>
            <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px', color: '#666' }}>
              <li>At least 6 characters</li>
              <li>Passwords must match</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="reset-button"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="spinner" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <button onClick={() => navigate('/login')} className="reset-link-button">
          Back to Login
        </button>
      </div>

      <style>{`
        .reset-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #E8F5F3 0%, #FFF 100%);
          padding: 16px;
        }

        .reset-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .reset-header {
          padding: 32px 24px 24px;
          border-bottom: 1px solid #E0E0E0;
        }

        .reset-header h1 {
          margin: 8px 0 4px;
          font-size: 24px;
          color: #205072;
          font-weight: 600;
        }

        .reset-subtitle {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .reset-back-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          color: #329D9C;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .reset-form {
          padding: 32px 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .password-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          background: #FAFAFA;
          transition: all 0.2s;
        }

        .password-input-wrapper:focus-within {
          border-color: #329D9C;
          background: white;
          box-shadow: 0 0 0 3px rgba(50, 157, 156, 0.1);
        }

        .password-input-wrapper input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          color: #333;
          font-family: inherit;
        }

        .password-input-wrapper input::placeholder {
          color: #999;
        }

        .password-toggle {
          background: none;
          border: none;
          cursor: pointer;
          color: #999;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #329D9C;
        }

        .password-requirements {
          padding: 12px 16px;
          border-radius: 6px;
          background: #E8F5F3;
          border-left: 4px solid #329D9C;
          margin-bottom: 24px;
        }

        .reset-button {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 6px;
          background: #329D9C;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        .reset-button:hover:not(:disabled) {
          background: #2A8481;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(50, 157, 156, 0.3);
        }

        .reset-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .reset-link-button {
          width: 100%;
          padding: 12px;
          border: none;
          background: none;
          color: #329D9C;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin: 12px 0;
          font-size: 14px;
        }

        .reset-link-button:hover {
          color: #2A8481;
          text-decoration: underline;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;
