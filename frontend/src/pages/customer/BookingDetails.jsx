import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import { Calendar, Clock, Trophy, MapPin, CreditCard, ArrowLeft, XCircle } from 'lucide-react';

export default function BookingDetails() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
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

        {booking.notes && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <strong className="text-slate-900">Notes:</strong> {booking.notes}
          </div>
        )}

        {['pending', 'approved'].includes(booking.status) && (
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Cancel Booking
            </button>
          </div>
        )}
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
  );
}
