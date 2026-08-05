import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import ManualBookingModal from '../../components/ManualBookingModal';
import PdfReceiptModal from '../../components/PdfReceiptModal';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { Filter, Check, X, LogIn, Plus, CalendarCheck, User, Download, Eye, FileImage, Clock, ShieldAlert, Banknote, Smartphone, Trash2 } from 'lucide-react';

export default function BookingsList() {
  const confirm = useConfirm();
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedProof, setSelectedProof] = useState(null);
  const [activeProofIdx, setActiveProofIdx] = useState(0);
  const [proofImgError, setProofImgError] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);

  const fetchBookings = () => {
    let url = '/api/bookings/admin/all';
    if (statusFilter) url += `?status=${statusFilter}`;

    axios.get(url)
      .then((res) => {
        if (res.data.success) {
          setBookings(res.data.bookings);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleDeleteBooking = async (bookingId, bookingCode) => {
    const isConfirmed = await confirm({
      title: 'Move Booking to Archive?',
      message: `Are you sure you want to move reservation "${bookingCode}" to the Archive? It will no longer block court time slots or appear in active bookings, but can be restored at any time.`,
      confirmText: 'Move to Archive',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (!isConfirmed) return;

    try {
      const res = await axios.delete(`/api/bookings/${bookingId}`);
      if (res.data.success) {
        toast.success(res.data.message || `Booking ${bookingCode} moved to Archive.`);
        fetchBookings();
        window.dispatchEvent(new Event('app:data-updated'));
      } else {
        toast.error(res.data.message || 'Failed to archive booking.');
      }
    } catch (err) {
      console.error('Archive booking error:', err);
      toast.error(err.response?.data?.message || 'Error moving booking to archive.');
    }
  };

  useEffect(() => {
    fetchBookings();

    // Auto-refresh callback polling interval (every 60 seconds)
    const interval = setInterval(fetchBookings, 60000);

    // Auto-refresh when tab gains focus or global data event fires
    const handleAutoRefresh = () => fetchBookings();
    window.addEventListener('focus', handleAutoRefresh);
    window.addEventListener('app:data-updated', handleAutoRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleAutoRefresh);
      window.removeEventListener('app:data-updated', handleAutoRefresh);
    };
  }, [statusFilter]);

  const handleUpdateStatus = (id, newStatus) => {
    setErrorMessage('');
    axios.patch(`/api/bookings/admin/${id}/status`, { status: newStatus })
      .then((res) => {
        if (res.data.success) {
          const finalStatus = res.data.booking?.status || newStatus;
          setAlertMessage(`Booking status updated to [${finalStatus.toUpperCase()}]`);
          setTimeout(() => setAlertMessage(''), 4000);
          fetchBookings();
          window.dispatchEvent(new Event('app:data-updated'));
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Failed to update booking status.';
        setErrorMessage(msg);
      });
  };

  const handleManualSuccess = (msg) => {
    setAlertMessage(msg || 'Schedule occupied successfully!');
    fetchBookings();
    window.dispatchEvent(new Event('app:data-updated'));
    setTimeout(() => setAlertMessage(''), 5000);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Reservations Management</h1>
          <p className="text-xs sm:text-sm text-slate-600">View customer schedules, filter reservations, and manage court slots</p>
        </div>

        <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 w-full sm:w-auto">
          {/* Create Manual Schedule / Occupy Slot Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Manually Occupy Time Slot
          </button>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-300 rounded-xl">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 focus:outline-none font-semibold cursor-pointer py-1"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: '', label: 'All Statuses' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'checked_in', label: 'Checked In' },
          { id: 'completed', label: 'Completed' },
          { id: 'cancelled', label: 'Cancelled' },
          { id: 'rejected', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === f.id
                ? f.id === 'rejected'
                  ? 'bg-pink-700 text-white shadow-md'
                  : 'bg-slate-900 text-white shadow-md'
                : f.id === 'rejected'
                ? 'bg-pink-50 text-pink-800 border border-pink-200 hover:bg-pink-100'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {alertMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{alertMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs font-extrabold text-rose-700 hover:text-rose-900 underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-4">
        {loading ? (
          <div className="py-8 text-center text-slate-500">Loading bookings list...</div>
        ) : bookings.length === 0 ? (
          <div className="py-8 text-center text-slate-500">No bookings match the filter criteria.</div>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs text-slate-700 min-w-[750px]">
              <thead className="bg-slate-100/80 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Code</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Court</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Paid / Remaining</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const paid = b.paid_amount || 0;
                  const remaining = Math.max(0, (b.total_amount || 0) - paid);
                  const method = b.payment_method || b.payment?.payment_method || 'cash';
                  const isCash = method === 'cash';
                  const isWalkIn = 
                    !b.user_id?.email ||
                    b.user_id?.email?.includes('walkin_') ||
                    b.user_id?.email?.endsWith('@houseofas.com') ||
                    b.user_id?.name?.toLowerCase().includes('walk-in') ||
                    b.user_id?.name?.toLowerCase().includes('walkin') ||
                    b.notes?.toLowerCase().includes('walk-in') ||
                    b.notes?.toLowerCase().includes('walkin') ||
                    b.booking_code?.includes('MANUAL');

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-mono font-bold text-emerald-800">{b.booking_code}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {b.user_id?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">{b.user_id?.name || 'Walk-in Customer'}</div>
                            {b.user_id?.email && <div className="text-[10px] text-slate-500">{b.user_id.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-800">{b.court_id?.name || 'Main Court'}</td>
                      <td className="p-3 font-mono">{b.booking_date} ({b.start_time}-{b.end_time})</td>
                      <td className="p-3">
                        {isCash ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-[10px]">
                            <Banknote className="w-3 h-3 text-emerald-600" /> Cash
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-extrabold text-[10px]">
                            <Smartphone className="w-3 h-3 text-blue-600" /> GCash
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">₱{b.total_amount?.toFixed(2)}</td>
                      <td className="p-3 font-mono text-[11px]">
                        <div className="font-extrabold text-emerald-700">Paid: ₱{paid.toFixed(2)}</div>
                        <div className={remaining > 0 ? 'font-bold text-amber-700' : 'text-slate-400'}>
                          Rem: ₱{remaining.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-3"><StatusBadge status={b.status} /></td>
                      <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isCash && !isWalkIn && b.payment?.proof_of_payment_url && (
                          <button
                            onClick={() => {
                              setProofImgError(false);
                              setActiveProofIdx(0);
                              setSelectedProof(b);
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-extrabold rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                            title="View GCash Proof Screenshot"
                          >
                            <Eye className="w-3 h-3 text-blue-600" /> Proof
                          </button>
                        )}

                        <button
                          onClick={() => setReceiptBooking(b)}
                          className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 rounded-lg text-[10px] font-bold transition-colors border border-transparent hover:border-emerald-200"
                          title="Preview & Download PDF Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteBooking(b._id, b.booking_code)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg text-[10px] font-bold transition-colors border border-rose-200"
                          title="Permanently Delete Booking Record from Database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(b._id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                              title="Approve Booking"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(b._id, 'rejected')}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                              title="Reject"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'checked_in')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                            title="Check in customer"
                          >
                            <LogIn className="w-3 h-3" /> Check In
                          </button>
                        )}
                        {b.status === 'checked_in' && (
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'completed')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-[10px]"
                          >
                            Complete
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

      {/* Proof Viewer Modal */}
      {selectedProof && (() => {
        const proofList = selectedProof.payments && selectedProof.payments.length > 0
          ? selectedProof.payments.filter(p => p.proof_of_payment_url)
          : selectedProof.payment?.proof_of_payment_url ? [selectedProof.payment] : [];

        const currentItem = proofList[activeProofIdx] || selectedProof.payment || selectedProof;

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
                  Booking Ref: <strong className="font-mono text-emerald-800">{selectedProof.booking_code}</strong>
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
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto">This image file has either expired (purged after 72 hours) or is unavailable.</p>
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
                {selectedProof.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedProof._id, 'approved');
                      setSelectedProof(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Approve Booking
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

      {/* Manual Booking Modal */}
      <ManualBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleManualSuccess}
      />

      {/* PDF Receipt Preview Modal */}
      <PdfReceiptModal
        booking={receiptBooking}
        isOpen={!!receiptBooking}
        onClose={() => setReceiptBooking(null)}
      />
    </div>
  );
}
