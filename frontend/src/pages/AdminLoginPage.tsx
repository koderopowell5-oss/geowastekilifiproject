import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface AdminLoginPageProps {
  onBackToLogin: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onBackToLogin }) => {
  const { adminLogin, isLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      const msg = 'Please enter both username and password.';
      setError(msg);
      showError(msg);
      return;
    }

    try {
      await adminLogin(username, password);
      showSuccess('Admin login successful! 🎉');
    } catch (err: any) {
      const errMsg = err.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      showError(errMsg, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0faf5] font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Back button */}
        <button
          onClick={onBackToLogin}
          disabled={isLoading}
          className="flex items-center gap-1.5 mb-8 text-[12px] font-semibold text-[#329D9C] hover:text-[#205072] transition-colors disabled:opacity-40 group"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back to enumerator login
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#205072] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#205072]/20">
            <ShieldCheck size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#205072]">Admin Portal</h1>
          <p className="text-[13px] text-[#56C596] mt-1 font-medium">GeoWaste Kilifi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#CFF4D2]/60 p-7 shadow-sm shadow-[#CFF4D2]/40">

          {/* Restricted notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#205072]/5 border border-[#205072]/10 mb-6">
            <ShieldCheck size={15} className="text-[#205072] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#205072] font-medium leading-relaxed">
              Restricted to authorized administrators only.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-100 mb-5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-500 leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-[11px] font-bold text-[#205072] mb-2 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#329D9C]">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(null); }}
                  disabled={isLoading}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CFF4D2] bg-[#f0faf5] text-[#205072] text-[13px] font-medium placeholder-gray-300 focus:outline-none focus:border-[#329D9C] focus:ring-2 focus:ring-[#329D9C]/15 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-[#205072] mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#329D9C]">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#CFF4D2] bg-[#f0faf5] text-[#205072] text-[13px] placeholder-gray-300 focus:outline-none focus:border-[#329D9C] focus:ring-2 focus:ring-[#329D9C]/15 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#329D9C] hover:bg-[#329D9C]/5 transition-all duration-200 p-1 rounded-lg"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#205072] to-[#329D9C] hover:from-[#329D9C] hover:to-[#1f7b7a] text-white text-[13px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#205072]/30 hover:shadow-[#329D9C]/40 hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
            <span className="text-[10px] text-gray-300 font-medium">Need help?</span>
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
          </div>

          {/* Hint toggle */}
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="w-full text-center text-[12px] font-semibold text-[#329D9C] hover:text-[#205072] transition-all duration-200 py-2 rounded-lg hover:bg-[#f0faf5]"
          >
            {showHint ? 'Hide credentials hint' : 'Show credentials hint'}
          </button>

          {showHint && (
            <div className="mt-3 p-4 bg-[#f0faf5] rounded-2xl border border-[#CFF4D2]/60">
              <p className="text-[10px] font-bold text-[#205072] uppercase tracking-wider mb-3">Default credentials</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Username</span>
                  <code className="text-[11px] font-mono font-bold text-[#329D9C] bg-[#329D9C]/10 px-2 py-0.5 rounded-lg">kodero_admin</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">Password</span>
                  <code className="text-[10px] font-mono font-bold text-[#329D9C] bg-[#329D9C]/10 px-2 py-0.5 rounded-lg">*Powell123!</code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 mt-6 font-medium">
          Restricted Access &mdash; Administrators Only
        </p>
      </div>
    </div>
  );
};