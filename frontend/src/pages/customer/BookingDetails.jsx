import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import PdfReceiptModal from '../../components/PdfReceiptModal';
import { useConfirm } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { Calendar, Clock, Trophy, MapPin, CreditCard, ArrowLeft, XCircle, Download, Info, FileText, Trash2 } from 'lucide-react';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [error, setError] = useState('');

  const [payments, setPayments] = useState([]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);

  // Balance Payment Form State
  const [balancePayAmount, setBalancePayAmount] = useState('');
  const [balanceRefNum, setBalanceRefNum] = useState('');
  const [balancePaymentMethod, setBalancePaymentMethod] = useState('gcash');
  const [balanceProofFile, setBalanceProofFile] = useState(null);
  const [balanceProofPreview, setBalanceProofPreview] = useState(null);
  const [submittingBalance, setSubmittingBalance] = useState(false);
  const [balanceMsg, setBalanceMsg] = useState(null);

  const fetchDetails = () => {
    axios.get(`/api/bookings/${id}`)
      .then((res) => {
        if (res.data.success) {
          setBooking(res.data.booking);
          setPayment(res.data.payment);
          setPayments(res.data.payments || []);
          const paid = res.data.paid_amount || res.data.booking?.paid_amount || 0;
          const remaining = res.data.remaining_balance !== undefined ? res.data.remaining_balance : Math.max(0, (res.data.booking?.total_amount || 0) - paid);
          setPaidAmount(paid);
          setRemainingBalance(remaining);
          setBalancePayAmount(remaining > 0 ? remaining.toString() : '');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();

    const timer = setInterval(fetchDetails, 5000);
    const handleRefetch = () => fetchDetails();
    window.addEventListener('focus', handleRefetch);
    window.addEventListener('app:data-updated', handleRefetch);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', handleRefetch);
      window.removeEventListener('app:data-updated', handleRefetch);
    };
  }, [id]);

  const handleDeletePermanentBooking = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Booking Record?',
      message: `Are you sure you want to permanently delete reservation "${booking?.booking_code || id}"? This will remove the booking and all related payment records from the database.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      type: 'danger',
    });

    if (!isConfirmed) return;

    try {
      const res = await axios.delete(`/api/bookings/${id}`);
      if (res.data.success) {
        toast.success(res.data.message || `Booking deleted permanently from database.`);
        window.dispatchEvent(new Event('app:data-updated'));
        navigate(-1);
      } else {
        toast.error(res.data.message || 'Failed to delete booking.');
      }
    } catch (err) {
      console.error('Delete booking error:', err);
      toast.error(err.response?.data?.message || 'Error deleting booking from database.');
    }
  };

  const handleBalanceFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBalanceProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBalanceProofPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleCancelBooking = async (e) => {
    e.preventDefault();
    if (!cancelReason) return;
    setCancelling(true);
    setError('');

    try {
      const res = await axios.post(`/api/bookings/${id}/cancel`, { reason: cancelReason });
      if (res.data.success) {
        setShowCancelModal(false);
        fetchDetails();
        window.dispatchEvent(new Event('app:data-updated'));
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitBalancePayment = async (e) => {
    e.preventDefault();
    if (balancePaymentMethod === 'gcash' && !balanceProofFile) {
      setBalanceMsg({ type: 'error', text: 'Please select a GCash screenshot as proof of payment.' });
      return;
    }

    const payAmt = parseFloat(balancePayAmount);
    if (isNaN(payAmt) || payAmt <= 0 || payAmt > remainingBalance + 0.01) {
      setBalanceMsg({
        type: 'error',
        text: `Please enter a valid amount between ₱1 and ₱${remainingBalance.toFixed(2)}.`,
      });
      return;
    }

    setSubmittingBalance(true);
    setBalanceMsg(null);

    try {
      const formData = new FormData();
      formData.append('amount', payAmt);
      formData.append('payment_method', balancePaymentMethod);
      if (balanceRefNum) formData.append('reference_number', balanceRefNum);
      if (balanceProofFile) formData.append('proof_image', balanceProofFile);

      const res = await axios.post(`/api/bookings/${id}/pay-balance`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setBalanceMsg({ type: 'success', text: res.data.message });
        setBalanceProofFile(null);
        setBalanceProofPreview(null);
        setBalanceRefNum('');
        fetchDetails();
      } else {
        setBalanceMsg({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setBalanceMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit balance payment.' });
    } finally {
      setSubmittingBalance(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading booking receipt...</div>;
  }

  if (!booking) {
    return <div className="py-12 text-center text-rose-600 font-semibold">Booking record not found.</div>;
  }

  const progressPercent = Math.min(100, Math.round((paidAmount / (booking.total_amount || 1)) * 100));

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6 py-6">
      <Link to="/my-bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700">
        <ArrowLeft className="w-4 h-4" /> Back to My Bookings
      </Link>

      <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-xs text-slate-500 uppercase font-bold">Booking Code</span>
            <h1 className="text-2xl font-extrabold text-emerald-800 font-mono mt-0.5">{booking.booking_code}</h1>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Payment Progress Showcase */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">Payment Progress & Summary</span>
            <span className="text-xs font-mono font-bold text-slate-300">
              Paid {progressPercent}% ({paidAmount >= booking.total_amount ? 'Fully Paid' : 'Partial Deposit'})
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Required</span>
              <span className="text-base sm:text-lg font-black text-white font-mono">₱{booking.total_amount?.toFixed(2)}</span>
            </div>
            <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800/80">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">Verified Paid</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">₱{paidAmount?.toFixed(2)}</span>
            </div>
            <div className="bg-amber-950/80 p-3 rounded-xl border border-amber-800/80">
              <span className="text-[10px] text-amber-300 uppercase font-bold block">Remaining Balance</span>
              <span className="text-base sm:text-lg font-black text-amber-400 font-mono">₱{remainingBalance?.toFixed(2)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 transition-all duration-500 rounded-full ${
                progressPercent >= 100 ? 'bg-emerald-500' : progressPercent > 0 ? 'bg-teal-400' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Venue</span>
            <p className="font-bold text-slate-900 text-base">{booking.facility_id?.name || "House of A's Pickleball Court"}</p>
            <p className="text-xs text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {booking.facility_id?.location || 'Purok-1, Linabo, Malaybalay City'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Court</span>
            <p className="font-bold text-emerald-700 text-base">{booking.court_id?.name || 'Main Court'}</p>
            <p className="text-xs text-slate-600">Type: {booking.court_id?.court_type || 'Pickleball'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Date & Time</span>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" /> {booking.booking_date}
            </p>
            <p className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> {booking.start_time} - {booking.end_time} ({booking.duration_hours} hour)
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium">Payment Option</span>
            <p className="font-extrabold text-slate-800 text-base">Full Payment</p>
            <p className="text-xs text-slate-700 flex items-center gap-1 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Method: {payment?.payment_method?.toUpperCase() || 'CASH'}
            </p>
          </div>
        </div>

        {booking.notes && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong className="text-slate-900">Notes:</strong> {booking.notes}
          </div>
        )}

        {/* Payment History Log */}
        {payments.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Transaction History
            </h3>

            <div className="space-y-2.5">
              {payments.map((p, idx) => (
                <div key={p._id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">
                        {p.transaction_type === 'partial_initial'
                          ? '1st Payment (Deposit)'
                          : p.transaction_type === 'partial_balance'
                          ? '2nd Payment (Balance)'
                          : 'Full Payment'}
                      </span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">₱{p.amount?.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Date: {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'N/A'} • Ref: <strong className="font-mono text-slate-700">{p.reference_number || 'N/A'}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.verification_status === 'verified' ? 'paid' : p.verification_status === 'rejected' ? 'failed' : 'pending_verification'} />
                    {p.proof_of_payment_url && (
                      <a
                        href={p.proof_of_payment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 text-[10px] inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> View Proof
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: PDF Receipt Download, Cancellation & Permanent Deletion */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setReceiptOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> View & Download PDF Receipt
          </button>

          <div className="flex items-center gap-2">
            {['pending', 'partially_paid', 'approved'].includes(booking.status) && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" /> Cancel Booking
              </button>
            )}

            <button
              onClick={handleDeletePermanentBooking}
              className="px-4 py-2.5 rounded-xl text-xs font-extrabold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Permanently Delete Booking Record from Database"
            >
              <Trash2 className="w-4 h-4" /> Delete Record
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Cancel Reservation</h3>
            <p className="text-xs text-slate-600">Please provide a reason for cancelling your court reservation.</p>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

            <form onSubmit={handleCancelBooking} className="space-y-4">
              <textarea
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-rose-500 h-24"
              ></textarea>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      <PdfReceiptModal
        booking={booking}
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
      />
    </>
  );
}
