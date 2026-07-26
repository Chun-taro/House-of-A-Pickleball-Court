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
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Bookings', icon: BookOpen, path: '/admin/bookings' },
    { label: 'Calendar View', icon: Calendar, path: '/admin/calendar' },
    { label: 'Facilities', icon: Building2, path: '/admin/facilities' },
    { label: 'Courts', icon: Trophy, path: '/admin/courts' },
    { label: 'Schedules', icon: Clock, path: '/admin/schedules' },
    { label: 'Payments', icon: CreditCard, path: '/admin/payments' },
    { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Users', icon: Users, path: '/admin/users' });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shadow-md">
      <div className="space-y-6">
        <div>
          <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Management Portal
          </h3>
          <div className="mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800/80 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-300">
        <p className="font-bold text-white">{user?.name}</p>
        <p className="capitalize text-emerald-400 font-semibold mt-0.5">{user?.role} Account</p>
      </div>
    </aside>
  );
}
