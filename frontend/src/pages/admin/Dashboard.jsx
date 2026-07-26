import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import { BookOpen, Clock, CheckCircle2, DollarSign, Building2, Users } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/dashboard-stats')
      .then((res) => {
        if (res.data.success) {
          setData(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading dashboard metrics...</div>;
  }

  const { stats, recentBookings } = data || {};

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Dashboard</h1>
        <p className="text-sm text-slate-600">House of A's Pickleball Court operational overview</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats?.totalBookings || 0}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approval</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600">{stats?.pendingBookings || 0}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Approved Bookings</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">{stats?.approvedBookings || 0}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900">₱{stats?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Recent Court Reservations</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
              <tr>
                <th className="p-3 rounded-l-xl">Code</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Court</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Amount</th>
                <th className="p-3 rounded-r-xl">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings?.map((b) => (
                <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-800">{b.booking_code}</td>
                  <td className="p-3 font-semibold text-slate-900">{b.user_id?.name || 'Guest'}</td>
                  <td className="p-3">{b.court_id?.name || 'Main Court'}</td>
                  <td className="p-3">{b.booking_date} ({b.start_time}-{b.end_time})</td>
                  <td className="p-3 font-bold text-slate-900">₱{b.total_amount?.toFixed(2)}</td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
