import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, LogOut, LayoutDashboard, Sparkles, UserCheck } from 'lucide-react';

import logoImg from '../images/Logo.jpg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-slate-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-700/80 flex items-center justify-center shadow-md overflow-hidden p-0.5">
                <img src={logoImg} alt="House of A's Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                House of A's
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest font-bold text-emerald-400/90">
                Pickleball Venue • Malaybalay
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive('/') 
                  ? 'text-white bg-slate-800/90 border border-slate-700' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Court Schedule & Info
            </Link>

            {user && user.role === 'customer' && (
              <>
                <Link
                  to="/booking/wizard"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    isActive('/booking/wizard') 
                      ? 'text-white bg-emerald-600 border border-emerald-500 shadow-md shadow-emerald-600/20' 
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60 border border-emerald-900/40'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Book Court Slot
                </Link>
                <Link
                  to="/my-bookings"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive('/my-bookings') 
                      ? 'text-white bg-slate-800/90 border border-slate-700' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  My Bookings
                </Link>
              </>
            )}

            {(user?.role === 'admin' || user?.role === 'staff') && (
              <Link
                to="/admin/dashboard"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-emerald-300 hover:text-emerald-100 transition-all flex items-center gap-2 bg-gradient-to-r from-emerald-950/90 to-teal-950/80 hover:from-emerald-900 hover:to-teal-900 border border-emerald-800/80 shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                Management Portal
              </Link>
            )}
          </div>

          {/* User Auth Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={user.role === 'customer' ? '/profile' : '/admin/dashboard'}
                  className="flex items-center space-x-2.5 text-sm text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 transition-colors shadow-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-black text-white shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold hidden sm:inline">{user.name}</span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wide">
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl border border-transparent hover:border-rose-950 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-bold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="gradient-btn-primary text-sm font-extrabold text-white px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

