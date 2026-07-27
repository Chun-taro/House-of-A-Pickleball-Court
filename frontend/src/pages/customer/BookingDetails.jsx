import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import PdfReceiptModal from '../../components/PdfReceiptModal';
import { Calendar, Clock, Trophy, MapPin, CreditCard, ArrowLeft, XCircle, Download, Info, FileText } from 'lucide-react';

export default function BookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = () => {
    axios.get(`/api/bookings/${id}`)
      .then((res) => {
        if (res.data.success) {
          setBooking(res.data.booking);
          setPayment(res.data.payment);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

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
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading booking receipt...</div>;
  }

  if (!booking) {
    return <div className="py-12 text-center text-rose-600 font-semibold">Booking record not found.</div>;
  }

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
            <span className="text-xs text-slate-500 font-medium">Payment Summary</span>
            <p className="font-extrabold text-emerald-700 text-lg">₱{booking.total_amount?.toFixed(2)}</p>
            <p className="text-xs text-slate-700 flex items-center gap-1 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Option: {payment?.payment_method?.toUpperCase() || 'CASH'}
            </p>
          </div>
        </div>

        {payment?.notes && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong className="text-slate-900">Notes:</strong> {booking.notes}
          </div>
        )}

        {/* GCash Proof of Payment Details & Retention Notice */}
        {payment?.payment_method === 'gcash' && (
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-200 pb-3">
              <div>
                <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-700" /> GCash Proof of Payment Status
                </h3>
                <p className="text-blue-700 text-[11px]">Transaction Reference: <strong className="text-blue-950">{payment.reference_number || 'Pending verification'}</strong></p>
              </div>

              {payment.proof_of_payment_url ? (
                <a
                  href={payment.proof_of_payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" /> View Uploaded Screenshot
                </a>
              ) : payment.proof_status === 'expired_deleted' ? (
                <span className="px-3 py-1 rounded-xl bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-300">
                  Proof Purged (Retention Expired)
                </span>
              ) : (
                <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                  No Proof Uploaded
                </span>
              )}
            </div>

            {/* Retention Warning Notice */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 text-[11px] leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-amber-900 block mb-0.5">Retention Policy Notice:</strong>
                <span>
                  Uploaded proof of payment screenshots are stored temporarily and permanently deleted after 2–3 days to conserve storage space. Please download and keep your PDF receipt for your records, as the uploaded screenshot will no longer be available after the retention period.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons: PDF Receipt Download & Cancellation */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setReceiptOpen(true)}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> View & Download PDF Receipt
          </button>

          {['pending', 'approved'].includes(booking.status) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Cancel Booking
            </button>
          )}
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
