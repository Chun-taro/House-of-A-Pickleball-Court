import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  Building2,
  Trophy,
  Clock,
  CreditCard,
  BarChart3,
  Users,
  X,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Bookings', icon: BookOpen, path: '/admin/bookings' },
    { label: 'Calendar View', icon: Calendar, path: '/admin/calendar' },
    { label: 'Schedules', icon: Clock, path: '/admin/schedules' },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ];

  if (isAdmin) {
    navItems.splice(3, 0,
      { label: 'Facilities', icon: Building2, path: '/admin/facilities' },
      { label: 'Courts', icon: Trophy, path: '/admin/courts' }
    );
    navItems.push({ label: 'Users', icon: Users, path: '/admin/users' });
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-x-0 top-16 sm:top-20 bottom-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 sm:top-20 bottom-0 left-0 z-45 lg:z-30 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)] lg:self-start p-4 flex flex-col justify-between shadow-xl lg:shadow-none overflow-y-auto transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Management Portal
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <h3 className="hidden lg:block px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Management Portal
            </h3>
            <div className="mt-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-300">
          <p className="font-bold text-white truncate">{user?.name}</p>
          <p className="capitalize text-emerald-400 font-semibold mt-0.5">{user?.role} Account</p>
        </div>
      </aside>
    </>
  );
}

