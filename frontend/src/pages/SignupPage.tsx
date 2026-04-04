import React, { useState } from 'react';
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, CheckCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignupPageProps {
  onBackToLogin: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onBackToLogin }) => {
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    ward: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const wards = ['Mombasa', 'Kilifi', 'Malindi', 'Lamu', 'Tanariver'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): string | null => {
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

    try {
      await signup(formData.name, formData.email, formData.password, formData.ward, formData.phone);
      setSuccess(true);
      setError(null);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', ward: '', phone: '' });
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f0faf5] font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl border border-[#CFF4D2]/60 p-7 shadow-sm shadow-[#CFF4D2]/40 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#56C596] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#56C596]/20">
              <CheckCircle size={30} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#205072] mb-3">Account Created!</h2>
            <p className="text-[13px] text-[#329D9C] mb-6 leading-relaxed">
              Welcome, <span className="font-bold">{formData.name}</span>! Your account has been successfully created.
            </p>
            <p className="text-[12px] text-gray-500 mb-6 leading-relaxed">
              You can now sign in with your credentials to start collecting waste data.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#56C596] hover:bg-[#329D9C] text-white text-[13px] font-bold transition-all duration-200 shadow-sm shadow-[#56C596]/20 hover:shadow-[#329D9C]/20"
            >
              <ArrowLeft size={15} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          Back to login
        </button>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#56C596] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#56C596]/20">
            <User size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#205072]">Create Account</h1>
          <p className="text-[13px] text-[#329D9C] mt-1 font-medium">Join as an Enumerator</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-[#CFF4D2]/60 p-7 shadow-sm shadow-[#CFF4D2]/40">

          {/* Info notice */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#56C596]/5 border border-[#56C596]/10 mb-6">
            <User size={15} className="text-[#56C596] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#205072] font-medium leading-relaxed">
              Register your enumerator account to start collecting geospatial waste data.
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
            {/* Full Name */}
            <div>
              <label className="block text-[11px] font-bold text-[#205072] mb-2 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#329D9C]">
                  <User size={15} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="John Kamau"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CFF4D2] bg-[#f0faf5] text-[#205072] text-[13px] font-medium placeholder-gray-300 focus:outline-none focus:border-[#329D9C] focus:ring-2 focus:ring-[#329D9C]/15 transition-all disabled:opacity-50"
                />
              </div>
            </div>

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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="john@geowaste.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CFF4D2] bg-[#f0faf5] text-[#205072] text-[13px] font-medium placeholder-gray-300 focus:outline-none focus:border-[#329D9C] focus:ring-2 focus:ring-[#329D9C]/15 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Ward Select */}
            <div>
              <label className="block text-[11px] font-bold text-[#205072] mb-2 uppercase tracking-wider">
                Assigned Ward
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#329D9C] pointer-events-none">
                  <MapPin size={15} />
                </div>
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#CFF4D2] bg-[#f0faf5] text-[#205072] text-[13px] font-medium focus:outline-none focus:border-[#329D9C] focus:ring-2 focus:ring-[#329D9C]/15 transition-all disabled:opacity-50 appearance-none cursor-pointer hover:border-[#329D9C]"
                >
                  <option value="">Select a ward</option>
                  {wards.map((ward) => (
                    <option key={ward} value={ward}>
                      {ward}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#329D9C] pointer-events-none">
                  <ChevronDown size={15} />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold text-[#205072] mb-2 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#329D9C]">
                  <Phone size={15} />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="+254712345678"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#CFF4D2] bg-[#f0faf5] text-[#205072] text-[13px] font-medium placeholder-gray-300 focus:outline-none focus:border-[#329D9C] focus:ring-2 focus:ring-[#329D9C]/15 transition-all disabled:opacity-50"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Format: +254712345678</p>
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
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
              <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Minimum 6 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[11px] font-bold text-[#205072] mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#329D9C]">
                  <Lock size={15} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-[#CFF4D2] bg-[#f0faf5] text-[#205072] text-[13px] placeholder-gray-300 focus:outline-none focus:border-[#329D9C] focus:ring-2 focus:ring-[#329D9C]/15 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#329D9C] hover:bg-[#329D9C]/5 transition-all duration-200 p-1 rounded-lg"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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
                  Creating Account…
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
            <span className="text-[10px] text-gray-300 font-medium">Already registered?</span>
            <div className="flex-1 h-px bg-[#CFF4D2]/60" />
          </div>

          {/* Back to Login */}
          <button
            onClick={onBackToLogin}
            disabled={isLoading}
            className="w-full text-center text-[12px] font-semibold text-[#329D9C] hover:text-[#205072] transition-all duration-200 disabled:opacity-50 py-2 rounded-lg hover:bg-[#f0faf5]"
          >
            Back to Sign In
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-300 mt-6 font-medium">
          Enumerator Registration &mdash; GeoWaste Kilifi
        </p>
      </div>
    </div>
  );
};
