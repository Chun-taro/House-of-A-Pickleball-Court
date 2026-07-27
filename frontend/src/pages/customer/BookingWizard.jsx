import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, Trophy, CreditCard, AlertCircle, ShieldCheck, Timer, Upload, FileImage, Info, X, CheckCircle, QrCode, Smartphone, ZoomIn } from 'lucide-react';
import gcashQrImg from '../../images/Gcash.jpg';

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
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [notes, setNotes] = useState('');
  
  // GCash Proof Upload & QR Modal State
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  
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

  // File selection handler with type & size validation
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setMessage({ type: 'error', text: 'Invalid file type. Please upload a JPG, JPEG, or PNG screenshot image.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size exceeds maximum 5 MB limit. Please select a smaller screenshot image.' });
      return;
    }

    setMessage(null);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const removeSelectedFile = () => {
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
      setProofPreview(null);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setMessage({ type: 'warning', text: 'Please select a time slot.' });
      return;
    }

    if (paymentMethod === 'gcash' && !proofFile) {
      setMessage({ type: 'error', text: 'Please upload a proof of payment screenshot for GCash transfer before submitting.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('facility_id', selectedFacilityId);
      formData.append('court_id', selectedCourtId);
      formData.append('booking_date', bookingDate);
      formData.append('start_time', selectedSlot.start_time);
      formData.append('end_time', selectedSlot.end_time);
      formData.append('payment_method', paymentMethod);
      formData.append('notes', notes);
      if (referenceNumber) formData.append('reference_number', referenceNumber);
      if (proofFile) formData.append('proof_image', proofFile);

      const res = await axios.post('/api/bookings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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

      <form onSubmit={handleSubmitBooking} className="space-y-6 sm:space-y-8">
        {/* Step 1: Select Facility & Court */}
        <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Trophy className="w-5 h-5 text-emerald-600 shrink-0" /> Step 1: Select Facility & Court
          </h2>

          {/* Rates Info Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="font-bold flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-md">Court Rates</span>
              <span>5:00 AM - 5:00 PM: <strong>₱150/hr</strong> | 5:00 PM - 11:00 PM: <strong>₱200/hr</strong></span>
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Automatic time-tier pricing applied</span>
          </div>

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
                    {fac.name} - {fac.location}
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
        <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <Calendar className="w-5 h-5 text-emerald-600 shrink-0" /> Step 2: Booking Duration & Time Slot
          </h2>

          {/* Duration Selector with Presets & Manual Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-emerald-600" /> Select Duration (Hours)
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
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
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-50 p-2 px-3 rounded-xl border border-slate-300">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Custom Hours:</span>
                <div className="flex items-center gap-1">
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
          </div>

          <div className="space-y-1.5 max-w-full sm:max-w-xs">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm">{slot.label}</span>
                        {slot.price && (
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${isSelected ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                            ₱{slot.price}
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] mt-1 font-semibold flex items-center justify-between gap-1 ${isSelected ? 'text-emerald-100' : slot.available ? 'text-emerald-700' : 'text-rose-600'}`}>
                        <span>{slot.available ? `✓ Available (${durationHours} hrs)` : slot.reason}</span>
                        {slot.rate_label && slot.available && <span className="opacity-85 text-[10px]">{slot.rate_label}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Payment Method & Notes */}
        <div className="glass-card p-4 sm:p-6 rounded-3xl space-y-5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-3">
            <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" /> Step 3: Payment & Summary
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Payment Option</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2.5 slate-input rounded-xl text-sm font-semibold"
              >
                <option value="cash">Cash (Pay at Court Counter)</option>
                <option value="gcash">GCash Transfer (Upload Proof Required)</option>
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

          {/* GCash Upload & Transfer Container */}
          {paymentMethod === 'gcash' && (
            <div className="p-5 rounded-2xl bg-blue-50/90 border border-blue-200 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-200/80 pb-3">
                <div>
                  <h3 className="font-extrabold text-blue-950 text-sm flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-700" /> GCash Scan QR & Payment Instructions
                  </h3>
                  <p className="text-blue-800 text-[11px]">Send exact booking amount via GCash QR scan or Express Send before uploading proof screenshot.</p>
                </div>
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-extrabold text-[10px] uppercase tracking-wider shadow-xs">
                  Official Account
                </div>
              </div>

              {/* QR & Account Card */}
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm">
                <div 
                  onClick={() => setShowQrModal(true)}
                  className="relative group shrink-0 cursor-pointer"
                  title="Click to zoom in QR code"
                >
                  <img
                    src={gcashQrImg}
                    alt="Official GCash QR Code - Alleen Jhane S. Doydora"
                    className="w-36 h-36 sm:w-40 sm:h-40 object-cover rounded-2xl border-2 border-blue-400 shadow-md transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-blue-950/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1 p-2 text-center">
                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md animate-bounce" />
                    <span className="bg-blue-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-sm">Click to Zoom</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider text-blue-800 bg-blue-100/90 border border-blue-200 px-2.5 py-0.5 rounded-md inline-block">
                      Official GCash QR Code
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 hover:underline"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Zoom In
                    </button>
                  </div>
                  <h4 className="font-black text-slate-900 text-lg">Alleen Jhane S. Doydora</h4>
                  <p className="font-mono font-black text-emerald-600 text-xl flex items-center justify-center sm:justify-start gap-1">
                    0960 423 2677
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-md">
                    Scan the official QR code using your GCash app or send payment via Express Send to the account above. Please upload your payment screenshot below to confirm your court reservation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">GCash Reference No. (Optional)</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. 1002 9983 4451"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>Upload Proof of Payment (Screenshot) <span className="text-rose-600">*</span></span>
                    <span className="text-[10px] text-slate-500 font-normal">Max: 5 MB</span>
                  </label>
                  
                  {!proofFile ? (
                    <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all text-slate-700">
                      <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-xs">Choose Screenshot (JPG, PNG)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-2.5 bg-white border border-emerald-300 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {proofPreview && (
                          <img src={proofPreview} alt="Proof Preview" className="w-9 h-9 object-cover rounded-lg border shrink-0" />
                        )}
                        <div className="truncate">
                          <p className="font-extrabold text-xs text-slate-900 truncate">{proofFile.name}</p>
                          <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> {(proofFile.size / (1024 * 1024)).toFixed(2)} MB • Ready
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement #5: Mandatory Temporary Retention Warning Alert */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-start gap-2.5 text-[11px] leading-relaxed">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-amber-900 block mb-0.5">Important Notice: Proof of Payment Retention Policy</strong>
                  <span>
                    Your uploaded proof of payment screenshot is stored temporarily and will be permanently deleted after 2–3 days to conserve storage space. Please download and keep your PDF receipt for your records, as the uploaded screenshot will no longer be available after the retention period.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Breakdown Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm border border-slate-800 shadow-sm">
            <div>
              <span className="text-slate-400 text-xs font-medium">Selected Duration:</span>
              <p className="font-extrabold text-white text-base">{durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium">Rate Tier:</span>
              <p className="font-bold text-emerald-300">
                {selectedSlot ? (selectedSlot.rate_label || `₱${(selectedSlot.price / durationHours).toFixed(2)}/hr`) : '5am-5pm: ₱150/hr | 5pm-11pm: ₱200/hr'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-medium">Total Amount Due:</span>
              <p className="text-2xl font-extrabold text-emerald-400">
                ₱{(selectedSlot?.price ?? (hourlyRate * durationHours)).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedSlot || submitting}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
        >
          <ShieldCheck className="w-5 h-5 shrink-0" /> {submitting ? 'Processing Reservation...' : `Confirm Court Reservation (₱${(selectedSlot?.price ?? (hourlyRate * durationHours)).toFixed(2)})`}
        </button>

      </form>

      {/* QR Lightbox / Zoom Modal */}
      {showQrModal && (
        <div 
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="glass-card p-6 rounded-3xl max-w-sm sm:max-w-md w-full space-y-4 shadow-2xl relative text-center border border-blue-200 cursor-default"
          >
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md inline-block">
                Official GCash QR Code
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg mt-1">Alleen Jhane S. Doydora</h3>
              <p className="font-mono font-black text-emerald-600 text-xl">0960 423 2677</p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
              <img
                src={gcashQrImg}
                alt="Zoomed GCash QR Code"
                className="w-full h-auto max-h-[65vh] object-contain rounded-xl shadow-xs"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium">Scan this QR code using your GCash app to pay</p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs transition-colors shadow-md shadow-blue-600/20"
            >
              Close QR Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
