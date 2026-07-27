import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import {
  Download,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  Trophy,
  XCircle,
  Search,
  TrendingUp,
  PieChart,
  ArrowUpRight,
  FileSpreadsheet,
  Users,
  Filter
} from 'lucide-react';

export default function ReportsAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    axios.get('/api/reports/full')
      .then((res) => {
        if (res.data.success) setData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = () => {
    const token = localStorage.getItem('sc_token') || localStorage.getItem('token') || '';
    window.open(`/api/reports/export/csv?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-64 bg-slate-200 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 glass-card rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const { totalRevenue = 0, totalBookings = 0, statusCounts = {}, bookings = [] } = data || {};

  const approvedCount = statusCounts.approved || 0;
  const pendingCount = statusCounts.pending || 0;
  const completedCount = statusCounts.completed || 0;
  const cancelledCount = (statusCounts.cancelled || 0) + (statusCounts.rejected || 0);

  // Filter bookings list
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      (b.booking_code && b.booking_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.user_id?.name && b.user_id.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.booking_date && b.booking_date.includes(searchTerm));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate percentages for distribution bar
  const getPct = (val) => (totalBookings > 0 ? ((val / totalBookings) * 100).toFixed(1) : 0);

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider border border-emerald-200">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Executive Financial Overview
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Real-time revenue metrics, booking status breakdown, and exportable financial data
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="gradient-btn-primary px-6 py-3 rounded-2xl text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-100" /> Export CSV Spreadsheet
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Gross Revenue */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-emerald-500/20 bg-gradient-to-br from-white via-emerald-50/30 to-white shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200">
              Gross Revenue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              ₱{totalRevenue.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Total collected from paid court bookings</p>
          </div>
        </div>

        {/* Total Reservations */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-slate-200 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Total Reservations
            </span>
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
              {totalBookings}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">All time court slot booking requests</p>
          </div>
        </div>

        {/* Approved Sessions */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-emerald-200 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-300">
              Approved Sessions
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
              {approvedCount}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {getPct(approvedCount)}% of total bookings approved
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-amber-200 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
              Pending Verification
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-amber-600 font-mono tracking-tight">
              {pendingCount}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Awaiting GCash proof review or payment</p>
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-blue-200 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-800 bg-blue-100 px-3 py-1 rounded-lg border border-blue-300">
              Completed Games
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-blue-700 font-mono tracking-tight">
              {completedCount}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Successfully fulfilled match sessions</p>
          </div>
        </div>

        {/* Cancelled / Rejected */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-rose-200 shadow-xl hover:shadow-2xl transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-3 py-1 rounded-lg border border-rose-300">
              Cancelled / Rejected
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-rose-600 font-mono tracking-tight">
              {cancelledCount}
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Cancelled by user or staff rejected</p>
          </div>
        </div>
      </div>

      {/* Visual Status Distribution Bar */}
      <div className="glass-card p-6 rounded-3xl space-y-4 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-600" /> Booking Status Distribution
          </h2>
          <span className="text-xs font-extrabold text-slate-500">Total: {totalBookings}</span>
        </div>

        {/* Progress bar container */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: `${getPct(approvedCount)}%` }} className="bg-emerald-500 transition-all duration-500" title={`Approved: ${getPct(approvedCount)}%`}></div>
          <div style={{ width: `${getPct(pendingCount)}%` }} className="bg-amber-400 transition-all duration-500" title={`Pending: ${getPct(pendingCount)}%`}></div>
          <div style={{ width: `${getPct(completedCount)}%` }} className="bg-blue-500 transition-all duration-500" title={`Completed: ${getPct(completedCount)}%`}></div>
          <div style={{ width: `${getPct(cancelledCount)}%` }} className="bg-rose-500 transition-all duration-500" title={`Cancelled: ${getPct(cancelledCount)}%`}></div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-extrabold text-slate-700 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
            <span>Approved ({getPct(approvedCount)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span>Pending ({getPct(pendingCount)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
            <span>Completed ({getPct(completedCount)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
            <span>Cancelled ({getPct(cancelledCount)}%)</span>
          </div>
        </div>
      </div>

      {/* Detailed Reservations Breakdown Table */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Reservations Breakdown</h2>
            <p className="text-xs text-slate-500">Filter and review all system booking logs</p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search code, name, date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
            <thead className="bg-slate-100/90 text-slate-600 uppercase text-[10px] font-black">
              <tr>
                <th className="p-3.5 rounded-l-xl">Booking Code</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Court</th>
                <th className="p-3.5">Date & Slot</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right rounded-r-xl">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    No booking records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-black text-emerald-800">{b.booking_code}</td>
                    <td className="p-3.5">
                      <div className="font-extrabold text-slate-900">{b.user_id?.name || 'Guest'}</div>
                      <div className="text-[10px] text-slate-500">{b.user_id?.email || '-'}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-800">{b.court_id?.name || 'Main Court'}</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      <div>{b.booking_date}</div>
                      <div className="text-[11px] text-slate-500 font-sans">{b.start_time} - {b.end_time}</div>
                    </td>
                    <td className="p-3.5 font-black text-slate-900 font-mono">
                      ₱{b.total_amount?.toFixed(2)}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <a
                        href={`/api/bookings/${b._id}/receipt?token=${localStorage.getItem('sc_token') || localStorage.getItem('token') || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[11px] border border-emerald-200 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
