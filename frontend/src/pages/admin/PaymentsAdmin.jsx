import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import PdfReceiptModal from '../../components/PdfReceiptModal';
import { CreditCard, CheckCircle2, XCircle, FileImage, Download, X, Eye, ShieldAlert, Clock } from 'lucide-react';

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState(null);
  const [activeProofIdx, setActiveProofIdx] = useState(0);
  const [proofImgError, setProofImgError] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);

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
    <>
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
                  <th className="p-3">Type</th>
                  <th className="p-3">Paid Amount</th>
                  <th className="p-3">Remaining Bal.</th>
                  <th className="p-3">Reference No.</th>
                  <th className="p-3">Proof Screenshot</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const isWalkIn = 
                    !p.user_id?.email ||
                    p.user_id?.email?.includes('walkin_') ||
                    p.user_id?.email?.endsWith('@houseofas.com') ||
                    p.user_id?.name?.toLowerCase().includes('walk-in') ||
                    p.user_id?.name?.toLowerCase().includes('walkin') ||
                    p.booking_id?.booking_code?.includes('MANUAL');

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-800">
                        {p.booking_id?.booking_code || '-'}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.user_id?.name || 'Guest'}</div>
                        <div className="text-[10px] text-slate-500">{p.user_id?.phone || p.user_id?.email}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border bg-slate-100 text-slate-800">
                          {p.transaction_type === 'partial_initial'
                            ? '1st Deposit'
                            : p.transaction_type === 'partial_balance'
                            ? '2nd Balance'
                            : 'Full Pay'}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-slate-900">₱{p.amount?.toFixed(2)}</td>
                      <td className="p-3 font-bold font-mono">
                        {p.booking_id ? (
                          <span className={p.booking_id.remaining_balance > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                            ₱{p.booking_id.remaining_balance?.toFixed(2)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600">{p.reference_number || '-'}</td>
                      
                      {/* Proof of Payment Cell */}
                      <td className="p-3">
                        {isWalkIn ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1">
                            Walk-in (No Proof Needed)
                          </span>
                        ) : p.proof_of_payment_url ? (
                          <button
                            onClick={() => {
                              setProofImgError(false);
                              setActiveProofIdx(0);
                              setSelectedProof(p);
                            }}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold rounded-lg text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-blue-600" /> View Proof
                          </button>
                        ) : p.proof_status === 'expired_deleted' ? (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            Purged (2-3d Retention)
                          </span>
                        ) : p.payment_method === 'cash' ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                            Cash (No Proof Needed)
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            No Proof Uploaded
                          </span>
                        )}
                      </td>

                    <td className="p-3">
                      <StatusBadge status={p.verification_status === 'verified' ? 'paid' : p.verification_status === 'rejected' ? 'failed' : 'pending_verification'} />
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.booking_id?._id && (
                          <button
                            onClick={() => setReceiptBooking({ _id: p.booking_id._id, booking_code: p.booking_id.booking_code, status: p.booking_id.status })}
                            className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-[10px] font-bold transition-colors border border-transparent hover:border-emerald-200 cursor-pointer"
                            title="Preview & Download PDF Receipt"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {p.verification_status !== 'verified' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(p._id, 'paid')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Verify
                          </button>
                        )}

                        {p.verification_status === 'pending' && (
                          <button
                            onClick={() => handleUpdatePaymentStatus(p._id, 'failed')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-[10px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Proof Viewer Modal */}
      {selectedProof && (() => {
        const proofList = selectedProof.all_payments && selectedProof.all_payments.length > 0
          ? selectedProof.all_payments.filter(p => p.proof_of_payment_url)
          : [selectedProof];

        const currentItem = proofList[activeProofIdx] || selectedProof;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="glass-card p-6 rounded-3xl max-w-xl w-full space-y-4 shadow-2xl relative bg-white">
              <button
                onClick={() => setSelectedProof(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FileImage className="w-5 h-5 text-blue-600" /> GCash Proof of Payment Viewer
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Booking: <strong className="font-mono text-emerald-800">{selectedProof.booking_id?.booking_code || selectedProof.booking_code}</strong>
                </p>
              </div>

              {/* Multi-Proof Tabs (Deposit vs Balance) */}
              {proofList.length > 1 && (
                <div className="flex border-b border-slate-200 gap-2 text-xs">
                  {proofList.map((pItem, idx) => (
                    <button
                      key={pItem._id || idx}
                      onClick={() => {
                        setProofImgError(false);
                        setActiveProofIdx(idx);
                      }}
                      className={`pb-2.5 px-3 font-extrabold border-b-2 transition-all flex items-center gap-1.5 ${
                        activeProofIdx === idx
                          ? 'border-blue-600 text-blue-700'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {pItem.transaction_type === 'partial_initial'
                          ? 'Proof 1: Deposit'
                          : pItem.transaction_type === 'partial_balance'
                          ? 'Proof 2: Balance'
                          : `Proof #${idx + 1}`}
                      </span>
                      <span className="font-mono text-[11px] font-black">₱{pItem.amount?.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Current Proof Info Bar */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-slate-900 block">
                    {currentItem.transaction_type === 'partial_initial'
                      ? '1st Payment Proof (Initial Deposit)'
                      : currentItem.transaction_type === 'partial_balance'
                      ? '2nd Payment Proof (Remaining Balance)'
                      : 'Full Payment Proof'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Ref: <strong className="font-mono text-slate-700">{currentItem.reference_number || 'N/A'}</strong> • Amount: <strong className="text-emerald-700 font-bold">₱{currentItem.amount?.toFixed(2)}</strong>
                  </span>
                </div>
                <StatusBadge status={currentItem.verification_status === 'verified' ? 'paid' : currentItem.verification_status === 'rejected' ? 'failed' : 'pending_verification'} />
              </div>

              {/* Image Preview Container */}
              <div className="rounded-2xl border border-slate-200 bg-slate-950/90 overflow-hidden max-h-[50vh] flex items-center justify-center p-2 min-h-[180px]">
                {proofImgError ? (
                  <div className="py-8 text-center text-slate-400 space-y-2">
                    <ShieldAlert className="w-8 h-8 mx-auto text-amber-500/90 mb-1" />
                    <p className="font-semibold text-xs text-slate-200">Proof Screenshot Unavailable</p>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">This image file is unavailable on the server.</p>
                  </div>
                ) : (
                  <img
                    src={currentItem.proof_of_payment_url}
                    alt="GCash Proof Screenshot"
                    onError={() => setProofImgError(true)}
                    className="max-h-[45vh] w-auto object-contain rounded-xl"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                {currentItem.verification_status !== 'verified' && (
                  <button
                    onClick={() => {
                      handleUpdatePaymentStatus(currentItem._id, 'paid');
                      setSelectedProof(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Verify {currentItem.transaction_type === 'partial_initial' ? '1st Deposit' : '2nd Balance'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedProof(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </div>

      {/* PDF Receipt Preview Modal */}
      <PdfReceiptModal
        booking={receiptBooking}
        isOpen={!!receiptBooking}
        onClose={() => setReceiptBooking(null)}
      />
    </>
  );
}
