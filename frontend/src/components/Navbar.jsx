import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, LogOut, LayoutDashboard, UserCheck, Menu, X, User } from 'lucide-react';

import logoImg from '../images/Logo.jpg';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-slate-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-700/80 flex items-center justify-center shadow-sm overflow-hidden p-0.5">
                <img src={logoImg} alt="House of A's Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
              </div>
            </div>
            <div>
              <span className="text-base sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                House of A's
                <span className="px-2 py-0.5 rounded-md bg-lime-400 text-slate-950 text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-sm">
                  PICKLEBALL
                </span>
              </span>
              <span className="block text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-emerald-300">
                Linabo • Malaybalay City
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1.5 lg:space-x-2">
            <Link
              to="/"
              className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all ${
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
                  className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    isActive('/booking/wizard') 
                      ? 'text-white bg-emerald-600 border border-emerald-500 shadow-md shadow-emerald-600/20' 
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60 border border-emerald-900/40'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
                  Book Court Slot
                </Link>
                <Link
                  to="/my-bookings"
                  className={`px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all ${
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
                className="px-3 py-1.5 lg:px-4 lg:py-2 rounded-xl text-xs lg:text-sm font-semibold text-emerald-300 hover:text-emerald-100 transition-all flex items-center gap-1.5 bg-gradient-to-r from-emerald-950/90 to-teal-950/80 hover:from-emerald-900 hover:to-teal-900 border border-emerald-800/80 shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-400" />
                Management Portal
              </Link>
            )}
          </div>

          {/* User Auth Buttons & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Desktop User Section */}
            <div className="hidden sm:flex items-center space-x-2">
              {user ? (
                <>
                  <NotificationDropdown />

                  <Link
                    to={user.role === 'customer' ? '/profile' : '/admin/dashboard'}
                    className="flex items-center space-x-2 text-sm text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 transition-colors shadow-sm"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xs font-black text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-xs truncate max-w-[120px]">{user.name}</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase tracking-wide">
                      {user.role}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl border border-transparent hover:border-rose-950 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="gradient-btn-primary text-xs font-extrabold text-white px-4 py-2 rounded-xl shadow-md transition-all"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:bg-slate-800 transition-colors focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-emerald-400" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 backdrop-blur-2xl animate-in slide-in-from-top duration-200">
          <div className="px-4 pt-3 pb-6 space-y-3">
            
            {/* User Banner for Mobile */}
            {user ? (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm font-black text-white shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-white">{user.name}</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{user.role} Account</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <NotificationDropdown />
                  <Link
                    to={user.role === 'customer' ? '/profile' : '/admin/dashboard'}
                    className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-xl"
                    title="Profile"
                  >
                    <User className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  className="py-2.5 px-4 text-center rounded-xl bg-slate-900 text-slate-200 font-bold text-xs border border-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="gradient-btn-primary py-2.5 px-4 text-center rounded-xl text-white font-extrabold text-xs shadow-md"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Navigation Links List */}
            <div className="space-y-1 pt-2">
              <Link
                to="/"
                className={`block px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive('/') 
                    ? 'text-white bg-slate-800 border border-slate-700' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                }`}
              >
                Court Schedule & Info
              </Link>

              {user && user.role === 'customer' && (
                <>
                  <Link
                    to="/booking/wizard"
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
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
                    className={`block px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive('/my-bookings') 
                        ? 'text-white bg-slate-800 border border-slate-700' 
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
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold text-emerald-300 bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-800 shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                  Management Portal
                </Link>
              )}
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}


