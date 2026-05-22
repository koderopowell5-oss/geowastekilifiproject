import React, { useState } from 'react';
import { LogIn, AlertCircle, Loader2, UserPlus, ShieldCheck, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface LoginPageProps {
  onNavigateToSignup: () => void;
  onNavigateToAdminLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToSignup, onNavigateToAdminLogin }) => {
  const { login, isLoading } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      const msg = 'Please enter both email and password';
      setError(msg);
      showError(msg);
      return;
    }

    try {
      await login(email, password);
      showSuccess('Welcome back!');
    } catch (err: any) {
      const errMsg = err.message || 'Login failed. Please try again.';
      setError(errMsg);
      showError(errMsg, 5000);
    }
  };

  const demoAccounts = [
    { email: 'enumerator1@geowaste.com', name: 'John Kamau', ward: 'Mombasa' },
    { email: 'enumerator2@geowaste.com', name: 'Mary Kipchoge', ward: 'Kilifi' },
    { email: 'enumerator3@geowaste.com', name: 'David Omondi', ward: 'Malindi' },
  ];

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#f0faf5] font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#56C596] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#56C596]/20">
            <LogIn size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#205072]">GeoKollect</h1>
          <p className="text-[13px] text-[#329D9C] mt-1 font-medium">Enumerator Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#CFF4D2]/60 p-7 shadow-sm shadow-[#CFF4D2]/40">

          {/* Info notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#56C596]/5 border border-[#56C596]/10 mb-6">
            <LogIn size={15} className="text-[#56C596] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#205072] font-medium leading-relaxed">
              Sign in with your enumerator account to start collecting waste data.
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
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-[#205072] mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#329D9C]">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  disabled={isLoading}
                  placeholder="enumerator@geowaste.com"
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
              className="w-full mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#56C596] to-[#329D9C] hover:from-[#329D9C] hover:to-[#1f7b7a] text-white text-[13px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#56C596]/30 hover:shadow-[#329D9C]/40 hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
            <span className="text-[10px] text-gray-300 font-medium">Demo accounts</span>
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
          </div>

          {/* Toggle Demo Accounts */}
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="w-full text-center text-[12px] font-semibold text-[#329D9C] hover:text-[#205072] transition-all duration-200 py-2 rounded-lg hover:bg-[#f0faf5]"
          >
            {showDemo ? 'Hide Demo Accounts' : 'Show Demo Accounts'}
          </button>

          {/* Demo Accounts Section */}
          {showDemo && (
            <div className="mt-4 space-y-2.5">
              <p className="text-[10px] font-bold text-[#205072] uppercase tracking-wider mb-3">
                Click any account to auto-fill the form (password: <code className="font-mono text-[#329D9C]">password123</code>)
              </p>
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => quickLogin(account.email)}
                  disabled={isLoading}
                  className="w-full px-3.5 py-3 bg-[#f0faf5] border border-[#CFF4D2] hover:border-[#329D9C] hover:bg-[#56C596]/10 hover:shadow-md hover:shadow-[#329D9C]/10 rounded-2xl text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-102"
                >
                  <p className="font-semibold text-[#205072] text-[12px]">{account.name}</p>
                  <p className="text-[#329D9C] text-[10px]">{account.email}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">Ward: {account.ward}</p>
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
            <span className="text-[10px] text-gray-300 font-medium">Sign up or admin</span>
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onNavigateToSignup}
              disabled={isLoading}
              className="w-full px-4 py-3.5 bg-[#56C596]/10 hover:bg-[#56C596]/20 border border-[#56C596]/30 hover:border-[#56C596] text-[#56C596] font-bold rounded-xl transition-all duration-200 text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-[#56C596]/20 hover:scale-105"
            >
              <UserPlus size={15} />
              Create New Account
            </button>

            <button
              onClick={onNavigateToAdminLogin}
              disabled={isLoading}
              className="w-full px-4 py-3.5 bg-[#205072]/10 hover:bg-[#205072]/20 border border-[#205072]/30 hover:border-[#205072] text-[#205072] font-bold rounded-xl transition-all duration-200 text-[13px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md hover:shadow-[#205072]/20 hover:scale-105"
            >
              <ShieldCheck size={15} />
              Admin Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 mt-6 font-medium">
          Protected System &mdash; Enumerators Only
        </p>
      </div>
    </div>
  );
};
