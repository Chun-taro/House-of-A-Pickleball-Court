import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, UserPlus, AlertCircle, ShieldCheck, RefreshCw, ArrowLeft } from 'lucide-react';
import logoImg from '../images/Logo.jpg';

export default function Register() {
  const [step, setStep] = useState(1); // Step 1: Sign up details, Step 2: Verification Code
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP Verification state
  const [otpCode, setOtpCode] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [resending, setResending] = useState(false);

  const { register, verifyOTP, resendOTP, loading } = useAuth();
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const res = await register(name, email, password, phone);
    if (res.success) {
      if (res.requiresVerification) {
        setRegisteredEmail(res.email || email);
        setStep(2);
        setInfoMsg('A 6-digit verification code has been sent to your email address.');
      } else {
        navigate('/');
      }
    } else {
      setError(res.message);
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

    const res = await verifyOTP(registeredEmail, otpCode.trim());
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setInfoMsg('');
    setResending(true);

    const res = await resendOTP(registeredEmail);
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

          {step === 1 ? (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900">Create Account</h1>
              <p className="text-sm text-slate-600">Join House of A's to reserve court slots online</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900">Enter Verification Code</h1>
              <p className="text-xs text-slate-600">
                We sent a 6-digit code to <strong className="text-slate-900">{registeredEmail}</strong>
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

        {/* STEP 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="w-full pl-10 pr-4 py-2.5 slate-input rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 slate-input rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 917 000 0000"
                  className="w-full pl-10 pr-4 py-2.5 slate-input rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-md shadow-emerald-600/20 flex items-center justify-center transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Sending Code...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* STEP 2: Enter 6-Digit OTP Code */}
        {step === 2 && (
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
              <p className="text-[11px] text-slate-600 text-center">Enter the code sent to your registered Gmail address.</p>
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
              <ShieldCheck className="w-4 h-4" /> {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Change Email
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
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-700 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
