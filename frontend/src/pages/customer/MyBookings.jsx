import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import StatusBadge from '../../components/StatusBadge';
import PdfReceiptModal from '../../components/PdfReceiptModal';
import { Calendar, Clock, Trophy, MapPin, ArrowRight, Download } from 'lucide-react';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [receiptBooking, setReceiptBooking] = useState(null);

  useEffect(() => {
    axios.get('/api/bookings/my-bookings')
      .then((res) => {
        if (res.data.success) {
          setBookings(res.data.bookings);
        }
      })
      .catch((err) => {
        console.error('MyBookings fetch error:', err);
        if (err.response?.status === 401) {
          setAuthError(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="space-y-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">My Reservations</h1>
            <p className="text-sm text-slate-600">View and manage your House of A's Pickleball Court bookings</p>
          </div>

          <Link
            to="/booking/wizard"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Book Court Slot
          </Link>
        </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading your bookings...</div>
      ) : authError ? (
        <div className="glass-card p-8 rounded-3xl text-center space-y-4 max-w-lg mx-auto border border-amber-200 bg-amber-50/50">
          <h3 className="text-lg font-extrabold text-amber-900">Session Expired or Login Required</h3>
          <p className="text-xs text-amber-800 leading-relaxed">
            Your login session is invalid or has expired (e.g. database re-seeded). Please sign in to view your court reservations.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-4">
          <Trophy className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">No Reservations Found</h3>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            You haven't reserved any pickleball court slots yet. Reserve your first court slot now!
          </p>
          <Link
            to="/booking/wizard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
          >
            Start Booking
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b._id} className="glass-card glass-card-hover p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-md">
                    {b.booking_code}
                  </span>
                  <StatusBadge status={b.status} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {b.facility_id?.name || "House of A's Pickleball Court"} — <span className="text-emerald-700">{b.court_id?.name || 'Main Court'}</span>
                </h3>

                <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {b.booking_date}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> {b.start_time} - {b.end_time}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {b.facility_id?.location || 'Purok-1, Linabo, Malaybalay City'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-200 pt-4 md:pt-0">
                <div className="text-left md:text-right">
                  <span className="text-xs text-slate-500 block">Total Amount</span>
                  <span className="text-lg font-extrabold text-emerald-700">₱{b.total_amount?.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => setReceiptBooking(b)}
                  className="px-3 py-2 rounded-xl text-xs font-extrabold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors flex items-center gap-1"
                  title="Preview & Download Official PDF Receipt"
                >
                  <Download className="w-3.5 h-3.5" /> PDF Receipt
                </button>

                <Link
                  to={`/my-bookings/${b._id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center gap-1"
                >
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      <PdfReceiptModal
        booking={receiptBooking}
        isOpen={!!receiptBooking}
        onClose={() => setReceiptBooking(null)}
      />
    </>
  );
}
