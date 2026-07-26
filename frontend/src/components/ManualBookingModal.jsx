import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Trophy, User, CreditCard, ShieldAlert, X } from 'lucide-react';

export default function ManualBookingModal({ isOpen, onClose, onSuccess }) {
  const [facilities, setFacilities] = useState([]);
  const [courts, setCourts] = useState([]);

  const [facilityId, setFacilityId] = useState('');
  const [courtId, setCourtId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('16:00');
  const [customerName, setCustomerName] = useState('Walk-in Player');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('Manual Walk-in Reservation');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    axios.get('/api/facilities')
      .then((res) => {
        if (res.data.success && res.data.facilities.length > 0) {
          setFacilities(res.data.facilities);
          const fac = res.data.facilities[0];
          setFacilityId(fac._id);
          return axios.get(`/api/facilities/${fac._id}/courts`);
        }
      })
      .then((res) => {
        if (res?.data?.success && res.data.courts.length > 0) {
          setCourts(res.data.courts);
          setCourtId(res.data.courts[0]._id);
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  const handleFacilityChange = (facId) => {
    setFacilityId(facId);
    axios.get(`/api/facilities/${facId}/courts`)
      .then((res) => {
        if (res.data.success && res.data.courts.length > 0) {
          setCourts(res.data.courts);
          setCourtId(res.data.courts[0]._id);
        } else {
          setCourts([]);
          setCourtId('');
        }
      })
      .catch((err) => console.error(err));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!facilityId || !courtId || !bookingDate || !startTime || !endTime) {
      setError('Please fill in all required fields.');
      return;
    }

    if (startTime >= endTime) {
      setError('End time must be after start time.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('/api/bookings/admin/manual-booking', {
        facility_id: facilityId,
        court_id: courtId,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        customer_name: customerName,
        customer_email: customerEmail,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes,
      });

      if (res.data.success) {
        onSuccess && onSuccess(res.data.message);
        onClose();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to manually block schedule.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="glass-card p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" /> Manually Occupy Time Schedule
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Reserve custom hours for walk-in players, coaching, or maintenance. This automatically locks out the time slot for customer online bookings.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Facility & Court */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Facility</label>
              <select
                value={facilityId}
                onChange={(e) => handleFacilityChange(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {facilities.map((fac) => (
                  <option key={fac._id} value={fac._id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Court</label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                {courts.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Date</label>
              <input
                type="date"
                required
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Customer / Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Player / Title</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Player / Tournament"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="paid">Paid Cash</option>
                <option value="unpaid">Unpaid / Pay Later</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700">Notes / Purpose</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Walk-in doubles match"
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Occupying Time Slot...' : 'Occupy & Reserve Time Slot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
