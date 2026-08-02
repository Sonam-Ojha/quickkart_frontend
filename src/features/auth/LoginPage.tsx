import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { authApi } from './api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0F1923] p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#EA580C]/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#0F766E]/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#EA580C] flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Jhatpats
            </span>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Manage your<br />
            <span className="text-[#EA580C]">quick commerce</span><br />
            operations
          </h2>
          <p className="text-slate-400 text-lg">
            Real-time orders, riders, inventory and customer insights — all in one panel.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Active Stores', value: '24' },
            { label: 'Orders Today', value: '1,847' },
            { label: 'Avg Delivery', value: '18 min' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#EA580C] flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Jhatpats Admin</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Welcome back
          </h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your admin account</p>

          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="admin@jhatpats.app"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input type="checkbox" className="rounded accent-[#EA580C]" defaultChecked />
                Remember me
              </label>
              <button type="button" className="text-[#EA580C] hover:underline font-medium">
                Forgot password?
              </button>
            </div>
            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#EA580C] font-semibold hover:underline">
              Register
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
