import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import logoImg from '../images/Logo.jpg';

export default function Login() {
  const [email, setEmail] = useState(() => localStorage.getItem('remember_me_email') || '');
  const [password, setPassword] = useState(() => localStorage.getItem('remember_me_password') || '');
  const [rememberMe, setRememberMe] = useState(() => !!(localStorage.getItem('remember_me_email') && localStorage.getItem('remember_me_password')));
  const [otpCode, setOtpCode] = useState('');
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resending, setResending] = useState(false);

  const { login, verifyOTP, resendOTP, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const res = await login(email, password);
    if (res.success) {
      if (rememberMe) {
        localStorage.setItem('remember_me_email', email);
        localStorage.setItem('remember_me_password', password);
      } else {
        localStorage.removeItem('remember_me_email');
        localStorage.removeItem('remember_me_password');
      }
      if (res.user.role === 'admin' || res.user.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } else {
      if (res.requiresVerification) {
        setUnverifiedEmail(res.email || email);
        setRequiresOtp(true);
        setInfoMsg('Account not verified. A 6-digit verification code has been sent to your email.');
      } else {
        setError(res.message);
      }
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    const res = await verifyOTP(unverifiedEmail, otpCode.trim());
    if (res.success) {
      if (rememberMe) {
        localStorage.setItem('remember_me_email', email);
        localStorage.setItem('remember_me_password', password);
      } else {
        localStorage.removeItem('remember_me_email');
        localStorage.removeItem('remember_me_password');
      }
      if (res.user.role === 'admin' || res.user.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setInfoMsg('');
    setResending(true);

    const res = await resendOTP(unverifiedEmail);
    if (res.success) {
      setInfoMsg(res.message);
    } else {
      setError(res.message);
    }
    setResending(false);
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-6 sm:py-12 px-3 sm:px-0">
      <div className="w-full max-w-md glass-card p-5 sm:p-8 rounded-3xl space-y-6 shadow-md border border-slate-300">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center mx-auto shadow-md overflow-hidden">
            <img src={logoImg} alt="House of A's Logo" className="w-full h-full object-contain" />
          </div>

          {!requiresOtp ? (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900">Welcome Back</h1>
              <p className="text-sm text-slate-600">Sign in to your House of A's account</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900">Account Verification Required</h1>
              <p className="text-xs text-slate-600">
                Enter 6-digit code sent to <strong className="text-slate-900">{unverifiedEmail}</strong>
              </p>
            </>
          )}
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Login Form */}
        {!requiresOtp ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="player@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 slate-input rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 slate-input rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* OTP Form */
          <form onSubmit={handleVerifySubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block text-center uppercase tracking-wider">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 rounded-2xl border-2 border-emerald-600/50 bg-slate-50 focus:border-emerald-600 outline-none transition-all"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs leading-relaxed space-y-1">
              <p className="font-extrabold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /> Can't find the code in your Inbox?
              </p>
              <p className="text-[11px] text-slate-700">
                Please check your <strong>Spam / Junk</strong> or <strong>Promotions</strong> folder if the email is not in your primary inbox.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setRequiresOtp(false)}
                className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
              >
                Back to Sign In
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="text-emerald-700 hover:underline font-extrabold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} /> Resend Code
              </button>
            </div>
          </form>
        )}

        <div className="pt-4 border-t border-slate-200 text-center text-xs text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-700 font-bold hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
