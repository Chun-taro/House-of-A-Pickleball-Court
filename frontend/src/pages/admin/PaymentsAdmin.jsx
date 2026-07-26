import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    axios.get('/api/payments')
      .then((res) => {
        if (res.data.success) setPayments(res.data.payments);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleUpdatePaymentStatus = (id, newStatus) => {
    axios.patch(`/api/payments/${id}/status`, { payment_status: newStatus })
      .then((res) => {
        if (res.data.success) fetchPayments();
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Payments & Transactions</h1>
        <p className="text-sm text-slate-600">Track court reservation payments and mark cash / GCash transactions</p>
      </div>

      <div className="glass-card p-6 rounded-3xl space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading payments list...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Booking Code</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reference No.</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-800">{p.booking_id?.booking_code || '-'}</td>
                    <td className="p-3 font-semibold text-slate-900">{p.user_id?.name || 'Guest'}</td>
                    <td className="p-3 uppercase font-bold text-slate-700">{p.payment_method}</td>
                    <td className="p-3 font-extrabold text-slate-900">₱{p.amount?.toFixed(2)}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{p.reference_number || '-'}</td>
                    <td className="p-3"><StatusBadge status={p.payment_status} /></td>
                    <td className="p-3 text-right">
                      {p.payment_status !== 'paid' && (
                        <button
                          onClick={() => handleUpdatePaymentStatus(p._id, 'paid')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
