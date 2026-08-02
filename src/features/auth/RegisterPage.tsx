import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from './api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.name.trim() || data.name.trim().length < 2)
    errors.name = 'Name kam se kam 2 characters ka hona chahiye';
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Valid email address daalein';
  if (!data.password || data.password.length < 6)
    errors.password = 'Password kam se kam 6 characters ka hona chahiye';
  if (data.password !== data.confirmPassword)
    errors.confirmPassword = 'Passwords match nahi kar rahe';
  return errors;
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '6+ characters', ok: password.length >= 6 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="flex gap-3 mt-2">
      {checks.map(c => (
        <span key={c.label} className={`flex items-center gap-1 text-[11px] ${c.ok ? 'text-green-600' : 'text-slate-400'}`}>
          <CheckCircle2 size={11} className={c.ok ? 'text-green-500' : 'text-slate-300'} />
          {c.label}
        </span>
      ))}
    </div>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
    if (fieldErrors[key]) setFieldErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    try {
      await authApi.register({ name: form.name.trim(), email: form.email, password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setApiError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-[#0F1923] p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#0F766E]/15 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#EA580C]/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#EA580C] flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Jhatpats</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Join Jhatpats<br />
            <span className="text-[#0F766E]">Admin Team</span>
          </h2>
          <p className="text-slate-400">
            Create your account and start managing your quick commerce operations.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            { icon: '⚡', text: '20 minute delivery management' },
            { icon: '📦', text: 'Real-time inventory tracking' },
            { icon: '🛵', text: 'Rider performance monitoring' },
          ].map(f => (
            <div key={f.text} className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-lg">{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#EA580C] flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Jhatpats Admin</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Create Account
          </h1>
          <p className="text-slate-500 text-sm mb-8">Register for the Jhatpats admin panel</p>

          {/* Success state */}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-4 mb-5">
              <CheckCircle2 size={20} className="shrink-0 text-green-500" />
              <div>
                <div className="font-semibold text-sm">Registration successful!</div>
                <div className="text-xs text-green-600 mt-0.5">Redirecting to login page...</div>
              </div>
            </div>
          )}

          {/* API error */}
          {apiError && !success && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  className={`pl-9 ${fieldErrors.name ? 'border-red-300 focus:ring-red-400' : ''}`}
                  placeholder="Rishi Dubey"
                  disabled={success}
                  autoFocus
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className={`pl-9 ${fieldErrors.email ? 'border-red-300 focus:ring-red-400' : ''}`}
                  placeholder="admin@jhatpats.app"
                  disabled={success}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className={`pl-9 pr-10 ${fieldErrors.password ? 'border-red-300 focus:ring-red-400' : ''}`}
                  placeholder="••••••••"
                  disabled={success}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {fieldErrors.password && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className={`pl-9 pr-10 ${fieldErrors.confirmPassword ? 'border-red-300 focus:ring-red-400' : ''}`}
                  placeholder="••••••••"
                  disabled={success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 size={11} />Passwords match</p>
              )}
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle size={11} />{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading || success}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#EA580C] font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-6">
            Jhatpats Admin · v1.0 · Secured with JWT
          </p>
        </div>
      </div>
    </div>
  );
}
