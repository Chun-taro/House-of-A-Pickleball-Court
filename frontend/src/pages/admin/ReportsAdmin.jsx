import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, BarChart3 } from 'lucide-react';

export default function ReportsAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/reports/full')
      .then((res) => {
        if (res.data.success) setData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleExportCsv = () => {
    window.open('/api/reports/export/csv', '_blank');
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Analytics & Reports</h1>
          <p className="text-sm text-slate-600">Export financial summary and booking analytics</p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Gross Revenue</span>
          <p className="text-3xl font-extrabold text-slate-900">₱{data?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Reservations</span>
          <p className="text-3xl font-extrabold text-slate-900">{data?.totalBookings || 0}</p>
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Approved Sessions</span>
          <p className="text-3xl font-extrabold text-emerald-600">{data?.statusCounts?.approved || 0}</p>
        </div>
      </div>
    </div>
  );
}
