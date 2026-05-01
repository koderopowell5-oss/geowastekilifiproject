import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { buildApiUrl } from '../config/api';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBack }) => {
  const { showSuccess, showError } = useNotification();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        showSuccess('Password reset link has been sent to your email');
      } else {
        showError(result.message || 'Failed to process request');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to process request');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <button onClick={onBack} className="auth-back-btn">
              <ArrowLeft size={18} />
            </button>
            <h1>Check Your Email</h1>
          </div>

          <div className="auth-content">
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <CheckCircle size={64} color="#329D9C" />
            </div>

            <p style={{ textAlign: 'center', marginBottom: '16px', color: '#333' }}>
              We've sent a password reset link to:
            </p>
            <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: '24px', color: '#205072' }}>
              {email}
            </p>

            <div className="auth-info-box" style={{ backgroundColor: '#E8F5F3', borderLeft: '4px solid #329D9C' }}>
              <p style={{ margin: '0', fontSize: '14px', color: '#333' }}>
                <strong>The link will expire in 30 minutes.</strong> Click it to reset your password.
              </p>
            </div>

            <p style={{ textAlign: 'center', marginTop: '24px', color: '#666', fontSize: '14px' }}>
              Didn't receive it? Check your spam folder or request a new link below.
            </p>

            <button
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="auth-button"
              style={{ marginTop: '24px' }}
            >
              Request Another Link
            </button>

            <button onClick={onBack} className="auth-link-button">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <button onClick={onBack} className="auth-back-btn">
            <ArrowLeft size={18} />
          </button>
          <h1>Forgot Password?</h1>
          <p className="auth-subtitle">Enter your email to reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="auth-info-box">
            <AlertCircle size={16} />
            <span>We'll send a password reset link to your email address</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="auth-button"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="spinner" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <button onClick={onBack} className="auth-link-button">
          Back to Login
        </button>
      </div>

      <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #E8F5F3 0%, #FFF 100%);
          padding: 16px;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .auth-header {
          padding: 32px 24px 24px;
          border-bottom: 1px solid #E0E0E0;
        }

        .auth-header h1 {
          margin: 8px 0 4px;
          font-size: 24px;
          color: #205072;
          font-weight: 600;
        }

        .auth-subtitle {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .auth-back-btn {
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

        .auth-content {
          padding: 32px 24px;
        }

        .auth-form {
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

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: 1px solid #E0E0E0;
          border-radius: 6px;
          background: #FAFAFA;
          transition: all 0.2s;
        }

        .input-wrapper:focus-within {
          border-color: #329D9C;
          background: white;
          box-shadow: 0 0 0 3px rgba(50, 157, 156, 0.1);
        }

        .input-wrapper input {
          flex: 1;
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          color: #333;
          font-family: inherit;
        }

        .input-wrapper input::placeholder {
          color: #999;
        }

        .auth-info-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 6px;
          background: #FFF3CD;
          border-left: 4px solid #FFC107;
          margin-bottom: 24px;
          font-size: 13px;
          color: #333;
        }

        .auth-button {
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

        .auth-button:hover:not(:disabled) {
          background: #2A8481;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(50, 157, 156, 0.3);
        }

        .auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-link-button {
          width: 100%;
          padding: 12px;
          border: none;
          background: none;
          color: #329D9C;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 12px;
          font-size: 14px;
        }

        .auth-link-button:hover {
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

export default ForgotPasswordPage;
