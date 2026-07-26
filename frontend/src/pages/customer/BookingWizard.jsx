import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, Trophy, CreditCard, AlertCircle, ShieldCheck, Timer } from 'lucide-react';

export default function BookingWizard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState([]);
  const [courts, setCourts] = useState([]);
  
  const [selectedFacilityId, setSelectedFacilityId] = useState(searchParams.get('facility_id') || '');
  const [selectedCourtId, setSelectedCourtId] = useState(searchParams.get('court_id') || '');
  const [bookingDate, setBookingDate] = useState(() => {
    const urlDate = searchParams.get('date');
    if (urlDate) return urlDate;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  
  const [durationHours, setDurationHours] = useState(1);
  const [slots, setSlots] = useState([]);
  const [hourlyRate, setHourlyRate] = useState(150);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [checkingSlots, setCheckingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch facilities list
  useEffect(() => {
    axios.get('/api/facilities')
      .then((res) => {
        if (res.data.success) {
          setFacilities(res.data.facilities);
          if (!selectedFacilityId && res.data.facilities.length > 0) {
            setSelectedFacilityId(res.data.facilities[0]._id);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingFacilities(false));
  }, []);

  // Fetch courts when facility changes
  useEffect(() => {
    if (!selectedFacilityId) return;
    axios.get(`/api/facilities/${selectedFacilityId}/courts`)
      .then((res) => {
        if (res.data.success) {
          setCourts(res.data.courts);
          if (res.data.courts.length > 0) {
            setSelectedCourtId(res.data.courts[0]._id);
          } else {
            setSelectedCourtId('');
          }
        }
      })
      .catch((err) => console.error(err));
  }, [selectedFacilityId]);

  // Check slot availability when facility, court, date, or duration changes
  useEffect(() => {
    if (!selectedFacilityId || !selectedCourtId || !bookingDate) return;

    setCheckingSlots(true);
    setMessage(null);
    setSelectedSlot(null);

    axios.post('/api/bookings/check-availability', {
      facility_id: selectedFacilityId,
      court_id: selectedCourtId,
      date: bookingDate,
      duration_hours: durationHours,
    })
      .then((res) => {
        if (res.data.success) {
          setSlots(res.data.slots);
          setHourlyRate(res.data.hourly_rate);
        } else {
          setSlots([]);
          setMessage({ type: 'warning', text: res.data.message });
        }
      })
      .catch((err) => {
        setSlots([]);
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to check slot availability.' });
      })
      .finally(() => setCheckingSlots(false));
  }, [selectedFacilityId, selectedCourtId, bookingDate, durationHours]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setMessage({ type: 'warning', text: 'Please select a time slot.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await axios.post('/api/bookings', {
        facility_id: selectedFacilityId,
        court_id: selectedCourtId,
        booking_date: bookingDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        payment_method: paymentMethod,
        notes,
      });

      if (res.data.success) {
        navigate(`/my-bookings/${res.data.booking._id}`);
      } else {
        setMessage({ type: 'error', text: res.data.message });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to complete reservation.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingFacilities) {
    return <div className="py-12 text-center text-slate-500">Loading booking wizard...</div>;
  }

  const totalAmountDue = hourlyRate * durationHours;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Court Reservation Wizard</h1>
        <p className="text-sm text-slate-600">Choose your court, select booking duration (1-18 hours), and pick your time slot.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center gap-2 ${
          message.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          message.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmitBooking} className="space-y-8">
        {/* Step 1: Select Facility & Court */}
        <div className="glass-card p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Trophy className="w-5 h-5 text-emerald-600" /> Step 1: Select Facility & Court
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Facility</label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full px-4 py-2.5 slate-input rounded-xl text-sm"
              >
                {facilities.map((fac) => (
                  <option key={fac._id} value={fac._id}>
                    {fac.name} - {fac.location} (₱{fac.hourly_rate}/hr)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Court</label>
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                disabled={courts.length === 0}
                className="w-full px-4 py-2.5 slate-input rounded-xl text-sm disabled:opacity-50"
              >
                {courts.map((court) => (
                  <option key={court._id} value={court._id}>
                    {court.name} ({court.court_type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Choose Duration, Date & Time Slot */}
        <div className="glass-card p-6 rounded-3xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Calendar className="w-5 h-5 text-emerald-600" /> Step 2: Booking Duration & Time Slot
          </h2>

          {/* Duration Selector with Presets & Manual Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-600" /> Select Duration (Hours)
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
                {[1, 2, 3, 4].map((hrs) => (
                  <button
                    type="button"
                    key={hrs}
                    onClick={() => setDurationHours(hrs)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      durationHours === hrs
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {hrs} {hrs === 1 ? 'Hour' : 'Hours'}
                  </button>
                ))}
              </div>

              {/* Manual Input for Custom Hours */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 px-3 rounded-xl border border-slate-300">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Custom Hours:</span>
                <input
                  type="number"
                  min="1"
                  max="18"
                  value={durationHours}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      setDurationHours(Math.max(1, Math.min(18, val)));
                    } else {
                      setDurationHours(1);
                    }
                  }}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-extrabold text-center text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-500">hrs</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <label className="text-xs font-bold text-slate-700">Booking Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full px-4 py-2.5 slate-input rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Select Starting Time Slot ({durationHours} {durationHours === 1 ? 'Hour' : 'Hours'} block)
            </label>
            
            {checkingSlots ? (
              <p className="text-xs text-slate-500 py-4">Checking slot availability for {durationHours} hour(s)...</p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-amber-700 py-4">No available consecutive {durationHours}-hour slots for the selected date.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {slots.map((slot, idx) => {
                  const isSelected = selectedSlot?.start_time === slot.start_time;
                  return (
                    <button
                      type="button"
                      key={idx}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3.5 rounded-xl border text-xs text-left transition-all ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md font-bold'
                          : slot.available
                          ? 'bg-slate-50 border-slate-300 text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50'
                          : 'bg-slate-200 border-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="font-bold text-sm">{slot.label}</div>
                      <div className={`text-[11px] mt-1 font-semibold ${isSelected ? 'text-emerald-100' : slot.available ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {slot.available ? `✓ Available (${durationHours} hrs)` : slot.reason}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Payment Method & Notes */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-600" /> Step 3: Payment & Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Payment Option</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2.5 slate-input rounded-xl text-sm"
              >
                <option value="cash">Cash (Pay at Court Counter)</option>
                <option value="gcash">GCash Transfer</option>
                <option value="maya">Maya Wallet</option>
                <option value="credit_card">Credit / Debit Card</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Special Requests / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Request extra pickleball balls"
                className="w-full px-4 py-2.5 slate-input rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Pricing Breakdown Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 text-sm border border-slate-800 shadow-sm">
            <div>
              <span className="text-slate-400 text-xs font-medium">Selected Duration:</span>
              <p className="font-extrabold text-white text-base">{durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium">Court Hourly Rate:</span>
              <p className="font-bold text-slate-200">₱{hourlyRate.toFixed(2)} / hr</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium">Total Amount Due:</span>
              <p className="text-2xl font-extrabold text-emerald-400">₱{totalAmountDue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedSlot || submitting}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        >
          <ShieldCheck className="w-5 h-5" /> {submitting ? 'Processing Reservation...' : `Confirm Court Reservation (₱${totalAmountDue.toFixed(2)})`}
        </button>

      </form>
    </div>
  );
}
