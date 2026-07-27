import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import { CreditCard, CheckCircle2, XCircle, FileImage, Download, X, Eye, ShieldAlert, Clock } from 'lucide-react';

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState(null);
  const [proofImgError, setProofImgError] = useState(false);

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
    axios.put(`/api/payments/${id}/status`, { payment_status: newStatus })
      .then((res) => {
        if (res.data.success) fetchPayments();
      })
      .catch((err) => {
        // Fallback to patch if put fails
        axios.patch(`/api/payments/${id}/status`, { payment_status: newStatus })
          .then(() => fetchPayments())
          .catch((e) => console.error(e));
      });
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Payments & Verification</h1>
          <p className="text-xs sm:text-sm text-slate-600">Review GCash screenshots, verify transactions, and download receipts</p>
        </div>
      </div>

      <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading payments list...</div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Booking Code</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Reference No.</th>
                  <th className="p-3">Proof Screenshot</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-emerald-800">
                      {p.booking_id?.booking_code || '-'}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{p.user_id?.name || 'Guest'}</div>
                      <div className="text-[10px] text-slate-500">{p.user_id?.phone || p.user_id?.email}</div>
                    </td>
                    <td className="p-3 uppercase font-bold text-slate-700">{p.payment_method}</td>
                    <td className="p-3 font-extrabold text-slate-900">₱{p.amount?.toFixed(2)}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-600">{p.reference_number || '-'}</td>
                    
                    {/* Proof of Payment Cell */}
                    <td className="p-3">
                      {p.proof_of_payment_url ? (
                        <button
                          onClick={() => {
                            setProofImgError(false);
                            setSelectedProof(p);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold rounded-lg text-[10px] inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-blue-600" /> View Proof
                        </button>
                      ) : p.proof_status === 'expired_deleted' ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          Purged (2-3d Retention)
                        </span>
                      ) : p.payment_method === 'gcash' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          No Proof Uploaded
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>

                    <td className="p-3">
                      <StatusBadge status={p.payment_status} />
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.booking_id?._id && (
                          <a
                            href={`/api/bookings/${p.booking_id._id}/receipt?token=${localStorage.getItem('sc_token') || localStorage.getItem('token') || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                            title="Download PDF Receipt"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {p.payment_status !== 'paid' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(p._id, 'paid')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-xs transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Approve
                          </button>
                        )}

                        {p.payment_status === 'unpaid' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(p._id, 'failed')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[10px] inline-flex items-center gap-1 transition-colors"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Proof Viewer Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedProof(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-blue-600" /> GCash Proof of Payment
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Booking: <strong className="font-mono text-emerald-800">{selectedProof.booking_id?.booking_code}</strong> • Ref: <strong className="text-slate-800">{selectedProof.reference_number || 'N/A'}</strong>
              </p>
            </div>

            {/* Image Preview Container */}
            <div className="rounded-2xl border border-slate-200 bg-slate-950/90 overflow-hidden max-h-[60vh] flex items-center justify-center p-2 min-h-[160px]">
              {proofImgError ? (
                <div className="py-8 text-center text-slate-400 space-y-2">
                  <ShieldAlert className="w-8 h-8 mx-auto text-amber-500/90 mb-1" />
                  <p className="font-semibold text-xs text-slate-200">Proof Screenshot Unavailable</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">This image file has either expired (purged after 72 hours) or is unavailable.</p>
                </div>
              ) : (
                <img
                  src={selectedProof.proof_of_payment_url}
                  alt="GCash Proof Screenshot"
                  onError={() => setProofImgError(true)}
                  className="max-h-[55vh] w-auto object-contain rounded-xl"
                />
              )}
            </div>

            {/* Retention Notice */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Uploaded screenshot will be automatically purged after 2–3 days to conserve storage space.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedProof.payment_status !== 'paid' && (
                <button
                  onClick={() => {
                    handleUpdatePaymentStatus(selectedProof._id, 'paid');
                    setSelectedProof(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" /> Verify & Approve Payment
                </button>
              )}
              <button
                onClick={() => setSelectedProof(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
