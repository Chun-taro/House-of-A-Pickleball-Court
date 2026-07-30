import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, KeyRound, Lock, ArrowRight, ShieldCheck, CheckCircle2, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
import logoImg from '../images/Logo.jpg';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Wizard Steps: 1 = Enter Email, 2 = Enter Verification Code, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Step 1: Send Verification Code to Email
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        setStep(2);
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send verification code. Please check your email address.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 6-digit Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit verification code.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post('/api/auth/verify-reset-code', { email, code: code.trim() });
      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        setStep(3);
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Invalid or expired verification code.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend Code
  const handleResendCode = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'A new 6-digit verification code has been sent to your email.' });
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to resend code.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match. Please verify.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await axios.post('/api/auth/reset-password', {
        email,
        code: code.trim(),
        new_password: newPassword,
      });

      if (res.data.success) {
        setMessage({ type: 'success', text: res.data.message });
        setStep(4);
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reset password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Top Header Card */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block transition-transform hover:scale-105">
            <img src={logoImg} alt="House of A Logo" className="w-16 h-16 mx-auto rounded-2xl shadow-lg object-cover" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password</h1>
            <p className="text-xs text-slate-600 font-medium">House of A's Account Recovery Wizard</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i ? 'w-8 bg-emerald-600' : step > i ? 'w-4 bg-emerald-400' : 'w-4 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl border border-slate-200">
          {message && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                  : 'bg-rose-50 text-rose-950 border border-rose-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-snug">{message.text}</span>
            </div>
          )}

          {/* STEP 1: Enter Registered Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" /> Enter Your Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. player@example.com"
                  className="w-full px-4 py-3 slate-input text-xs font-semibold text-slate-900"
                />
                <p className="text-[11px] text-slate-500">
                  We'll dispatch a 6-digit verification code to your email inbox for account security.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-btn-primary text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending Verification Code...' : 'Send Verification Code'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Enter Verification Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-[11px]">
                Verification code sent to <strong>{email}</strong>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-600" /> Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 482915"
                  className="w-full px-4 py-3 slate-input text-center text-lg tracking-[8px] font-mono font-bold text-slate-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-btn-primary text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Verifying Code...' : 'Verify Code'} <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-emerald-700 hover:text-emerald-900 font-extrabold flex items-center gap-1 disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" /> Resend Code
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-4 pr-10 py-3 slate-input text-xs font-semibold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-4 pr-10 py-3 slate-input text-xs font-semibold text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 cursor-pointer"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-emerald-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-btn-primary text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Resetting Password...' : 'Reset Password & Save'} <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
            <div className="text-center space-y-4 py-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Password Reset Complete!</h3>
                <p className="text-xs text-slate-600 mt-1">Your password has been successfully updated.</p>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl gradient-btn-primary text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Sign In to Your Account
              </button>
            </div>
          )}
        </div>

        {/* Bottom Back Link */}
        <div className="text-center">
          <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
