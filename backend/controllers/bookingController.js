import fs from 'node:fs';
import path from 'node:path';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Facility from '../models/Facility.js';
import Court from '../models/Court.js';
import OperatingHour from '../models/OperatingHour.js';
import Holiday from '../models/Holiday.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendBookingConfirmationEmail, sendPaymentReceiptEmail } from '../utils/mailer.js';
import { generatePdfReceipt } from '../utils/pdfReceiptGenerator.js';

// Helper to convert "HH:MM" string to total minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

// Helper to calculate tiered court rates:
// 5:00 AM - 5:00 PM (05:00 - 17:00): ₱150 / hr
// 5:00 PM - 11:00 PM (17:00 - 23:00): ₱200 / hr
export const calculateTieredPrice = (startTimeStr, endTimeStr) => {
  const startMins = timeToMinutes(startTimeStr);
  const endMins = timeToMinutes(endTimeStr);
  const cutoffMins = 17 * 60; // 17:00 (5:00 PM)

  const DAY_RATE = 150;
  const EVENING_RATE = 200;

  let total = 0;

  if (startMins < cutoffMins) {
    const dayEnd = Math.min(endMins, cutoffMins);
    const dayHours = (dayEnd - startMins) / 60;
    total += dayHours * DAY_RATE;
  }

  if (endMins > cutoffMins) {
    const eveningStart = Math.max(startMins, cutoffMins);
    const eveningHours = (endMins - eveningStart) / 60;
    total += eveningHours * EVENING_RATE;
  }

  return total;
};

// Check date/court availability and return time slots based on chosen duration_hours
export const checkAvailability = async (req, res) => {
  try {
    const { facility_id, court_id, date, duration_hours = 1 } = req.body;

    if (!facility_id || !court_id || !date) {
      return res.status(400).json({ success: false, message: 'Facility, Court, and Date are required.' });
    }

    const duration = Math.max(1, Math.min(18, parseInt(duration_hours, 10) || 1));

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({ success: false, message: 'Cannot check availability for past dates.' });
    }

    // Check Holiday
    const holidays = await Holiday.find({
      $or: [{ holiday_date: date }, { is_recurring: true }],
      $and: [{ $or: [{ facility_id: null }, { facility_id }] }],
    });

    const activeHoliday = holidays.find((h) => h.holiday_date === date);
    if (activeHoliday) {
      return res.json({
        success: false,
        is_closed: true,
        message: `Facility is closed on this date due to holiday: ${activeHoliday.name}`,
        slots: [],
      });
    }

    const facility = await Facility.findById(facility_id);
    const court = await Court.findById(court_id);

    if (!facility || !court) {
      return res.status(404).json({ success: false, message: 'Facility or Court not found' });
    }

    // Check Operating Hours
    const dayOfWeek = bookingDate.getDay(); // 0 (Sun) - 6 (Sat)
    const operatingHour = await OperatingHour.findOne({ facility_id, day_of_week: dayOfWeek });

    if (operatingHour && operatingHour.is_closed) {
      return res.json({
        success: false,
        is_closed: true,
        message: 'Facility is closed on this day of the week.',
        slots: [],
      });
    }

    const openTimeStr = operatingHour ? operatingHour.open_time : facility.open_time || '05:00';
    const closeTimeStr = operatingHour ? operatingHour.close_time : facility.close_time || '23:00';

    const openHour = parseInt(openTimeStr.split(':')[0], 10);
    const closeHour = parseInt(closeTimeStr.split(':')[0], 10);

    // Get existing active bookings for this court on this date
    const existingBookings = await Booking.find({
      court_id,
      booking_date: date,
      status: { $in: ['pending', 'approved', 'checked_in', 'completed'] },
    }).select('start_time end_time');

    const slots = [];
    const isToday = bookingDate.toDateString() === new Date().toDateString();
    const currentHourNow = new Date().getHours();

    const formatAmpm = (hour) => {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      return `${h12}:00 ${ampm}`;
    };

    for (let h = openHour; h <= closeHour - duration; h++) {
      const slotStartStr = `${String(h).padStart(2, '0')}:00`;
      const slotEndStr = `${String(h + duration).padStart(2, '0')}:00`;

      const slotStartMins = h * 60;
      const slotEndMins = (h + duration) * 60;

      const durationLabel = duration === 1 ? '1 Hour' : `${duration} Hours`;
      const label = `${formatAmpm(h)} - ${formatAmpm(h + duration)} (${durationLabel})`;
      const isPastSlot = isToday && h <= currentHourNow;

      // Check if any hour within this multi-hour span overlaps with existing bookings
      const isBooked = existingBookings.some((b) => {
        const bStartMins = timeToMinutes(b.start_time);
        const bEndMins = timeToMinutes(b.end_time);
        return slotStartMins < bEndMins && slotEndMins > bStartMins;
      });

      const slotPrice = calculateTieredPrice(slotStartStr, slotEndStr);
      const slotHourlyRate = slotPrice / duration;
      const rateLabel = h < 17 ? 'Day Rate (₱150/hr)' : 'Evening Rate (₱200/hr)';

      slots.push({
        start_time: slotStartStr,
        end_time: slotEndStr,
        duration_hours: duration,
        label,
        price: slotPrice,
        hourly_rate: slotHourlyRate,
        rate_label: rateLabel,
        available: !isBooked && !isPastSlot,
        reason: isBooked ? 'Booked / Overlap' : isPastSlot ? 'Past Time' : 'Available',
      });
    }

    return res.json({
      success: true,
      is_closed: false,
      hourly_rate: 150, // Base default day rate
      rates: {
        day_rate: 150,
        evening_rate: 200,
        day_period: '5:00 AM - 5:00 PM',
        evening_period: '5:00 PM - 11:00 PM',
      },
      duration_hours: duration,
      slots,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new booking (Customer)
export const createBooking = async (req, res) => {
  try {
    const { facility_id, court_id, booking_date, start_time, end_time, notes } = req.body;

    if (!facility_id || !court_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking details.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a proof of payment screenshot for GCash transfer before submitting.' });
    }

    const facility = await Facility.findById(facility_id);
    const court = await Court.findById(court_id);

    if (!facility || !court) {
      return res.status(404).json({ success: false, message: 'Selected facility or court does not exist.' });
    }

    // Double check availability against existing bookings
    const activeBookings = await Booking.find({
      court_id,
      booking_date,
      status: { $in: ['pending', 'partially_paid', 'approved', 'checked_in', 'completed'] },
    });

    const newStartMins = timeToMinutes(start_time);
    const newEndMins = timeToMinutes(end_time);

    const hasOverlap = activeBookings.some((b) => {
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      return newStartMins < bEnd && newEndMins > bStart;
    });

    if (hasOverlap) {
      return res.status(400).json({ success: false, message: 'The selected court and time slot is no longer available.' });
    }

    const duration_hours = Math.max(0.5, (newEndMins - newStartMins) / 60);

    const subtotal = calculateTieredPrice(start_time, end_time);
    const hourly_rate = duration_hours > 0 ? subtotal / duration_hours : 150;
    const tax_amount = 0;
    const total_amount = subtotal + tax_amount;

    const dateCode = booking_date.replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const booking_code = `HOA-${dateCode}-${randomStr}`;

    const booking = await Booking.create({
      booking_code,
      user_id: req.user._id,
      facility_id,
      court_id,
      booking_date,
      start_time,
      end_time,
      duration_hours,
      hourly_rate,
      subtotal,
      tax_amount,
      total_amount,
      payment_type: 'full',
      paid_amount: 0,
      status: 'pending',
      notes: notes || '',
    });

    const payment_method = 'gcash';
    const refNum = req.body.reference_number || `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const hasProofFile = true;
    let base64Image = null;
    if (req.file && req.file.buffer) {
      base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const proofFilename = `proof_${uniqueSuffix}`;
    const proofUploadedAt = new Date();
    const proofExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const payment = await Payment.create({
      booking_id: booking._id,
      user_id: req.user._id,
      amount: total_amount,
      payment_method: 'gcash',
      payment_status: 'pending_verification',
      transaction_type: 'full',
      verification_status: 'pending',
      reference_number: refNum,
      paid_at: null,
      proof_image_base64: base64Image,
      proof_filename: proofFilename,
      proof_of_payment_url: null,
      proof_uploaded_at: proofUploadedAt,
      proof_expires_at: proofExpiresAt,
      proof_status: hasProofFile ? 'uploaded' : 'none',
    });

    if (hasProofFile) {
      payment.proof_of_payment_url = `/api/payments/proof/${payment._id}`;
      await payment.save();
    }

    // Await confirmation email for Vercel Serverless environment
    await sendBookingConfirmationEmail({
      booking,
      user: req.user,
      courtName: court.name,
      facilityName: facility.name,
    }).catch((err) => console.error('Booking mailer error:', err));

    if (isPaidOnline) {
      await sendPaymentReceiptEmail({
        payment: { amount: total_amount, payment_method, reference_number: refNum },
        booking,
        user: req.user,
      }).catch((err) => console.error('Payment mailer error:', err));
    }

    // Notify Admin & Staff of new customer booking
    await Notification.create({
      user_id: req.user._id,
      booking_id: booking._id,
      title: `📌 New Booking: ${booking_code}`,
      message: `Customer ${req.user.name} reserved ${court.name} on ${booking_date} (${start_time}-${end_time}). Method: ${payment_method.toUpperCase()}.`,
      type: 'new_booking',
      for_role: 'admin',
      receipt_available: false,
    }).catch((err) => console.error('Admin notification error:', err));

    return res.status(201).json({
      success: true,
      message: 'Booking reservation submitted successfully!',
      booking_code,
      booking: { ...booking.toObject(), id: booking._id, _id: booking._id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin / Staff: Manually Create & Occupy Time Slot (Walk-ins / Custom Time Slots)
export const createManualBookingAdmin = async (req, res) => {
  try {
    const {
      facility_id,
      court_id,
      booking_date,
      start_time,
      end_time,
      customer_name,
      customer_email,
      customer_phone,
      payment_method = 'gcash',
      payment_status = 'paid',
      notes = '',
    } = req.body;

    if (!facility_id || !court_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Facility, Court, Date, Start Time, and End Time are required.' });
    }

    const facility = await Facility.findById(facility_id);
    const court = await Court.findById(court_id);

    if (!facility || !court) {
      return res.status(404).json({ success: false, message: 'Facility or Court not found.' });
    }

    // Check overlap with existing active bookings
    const activeBookings = await Booking.find({
      court_id,
      booking_date,
      status: { $in: ['pending', 'approved', 'checked_in', 'completed'] },
    });

    const newStartMins = timeToMinutes(start_time);
    const newEndMins = timeToMinutes(end_time);

    const overlapBooking = activeBookings.find((b) => {
      const bStart = timeToMinutes(b.start_time);
      const bEnd = timeToMinutes(b.end_time);
      return newStartMins < bEnd && newEndMins > bStart;
    });

    if (overlapBooking) {
      return res.status(400).json({
        success: false,
        message: `Cannot book time slot ${start_time} - ${end_time}. It overlaps with existing booking [${overlapBooking.booking_code}].`,
      });
    }

    // If customer name is provided, create or reuse user profile
    let targetUserId = req.user._id;
    if (customer_name) {
      const emailLookup = customer_email ? customer_email.toLowerCase() : `walkin_${Date.now()}@houseofas.com`;
      let existingUser = await User.findOne({ $or: [{ email: emailLookup }, { name: customer_name }] });

      if (existingUser) {
        targetUserId = existingUser._id;
      } else {
        const newUser = await User.create({
          name: customer_name,
          email: emailLookup,
          password: 'walkin123',
          phone: customer_phone || '',
          role: 'customer',
          is_verified: true,
        });
        targetUserId = newUser._id;
      }
    }

    const duration_hours = Math.max(0.5, (newEndMins - newStartMins) / 60);

    const subtotal = calculateTieredPrice(start_time, end_time);
    const hourly_rate = duration_hours > 0 ? subtotal / duration_hours : 150;
    const tax_amount = 0;
    const total_amount = subtotal + tax_amount;

    const dateCode = booking_date.replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const booking_code = `HOA-MANUAL-${dateCode}-${randomStr}`;

    const booking = await Booking.create({
      booking_code,
      user_id: targetUserId,
      facility_id,
      court_id,
      booking_date,
      start_time,
      end_time,
      duration_hours,
      hourly_rate,
      subtotal,
      tax_amount,
      total_amount,
      status: 'approved',
      notes: notes || 'Manual Admin Reservation',
    });

    const refNum = `PAY-MANUAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await Payment.create({
      booking_id: booking._id,
      user_id: targetUserId,
      amount: total_amount,
      payment_method,
      payment_status,
      reference_number: refNum,
      paid_at: payment_status === 'paid' ? new Date() : null,
    });

    return res.status(201).json({
      success: true,
      message: `Time slot ${start_time} - ${end_time} reserved for ${customer_name || 'Customer'}.`,
      booking_code,
      booking: { ...booking.toObject(), id: booking._id, _id: booking._id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Bookings (Customer)
export const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user_id: req.user._id };

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('facility_id', 'name location image_url')
      .populate('court_id', 'name court_type')
      .sort({ createdAt: -1 });

    const mapped = bookings.map((b) => ({
      ...b.toObject(),
      id: b._id,
      _id: b._id,
    }));

    return res.json({ success: true, bookings: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Submit Second / Balance Payment for a Partially Paid Booking (Customer)
export const submitBalancePayment = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { amount, reference_number } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (req.user.role === 'customer' && booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to submit payment for this booking.' });
    }

    const allPayments = await Payment.find({ booking_id: booking._id });
    const verifiedPaid = allPayments
      .filter((p) => p.verification_status === 'verified' || p.payment_status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const remainingBalance = Math.max(0, booking.total_amount - verifiedPaid);

    if (remainingBalance <= 0) {
      return res.status(400).json({ success: false, message: 'This booking is already fully paid.' });
    }

    const payAmount = parseFloat(amount) || remainingBalance;
    if (payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than ₱0.' });
    }

    if (payAmount > remainingBalance + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₱${payAmount.toFixed(2)}) cannot exceed the remaining balance of ₱${remainingBalance.toFixed(2)}.`,
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload your GCash payment screenshot for the remaining balance.' });
    }

    let base64Image = null;
    let proofFilename = null;
    let uploadedAt = null;
    let expiresAt = null;

    if (req.file && req.file.buffer) {
      base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      proofFilename = `proof_balance_${uniqueSuffix}`;
      uploadedAt = new Date();
      expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    }

    const refNum = reference_number || `PAY-BAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const newPayment = await Payment.create({
      booking_id: booking._id,
      user_id: req.user._id,
      amount: payAmount,
      payment_method: 'gcash',
      payment_status: 'pending_verification',
      transaction_type: 'partial_balance',
      verification_status: 'pending',
      reference_number: refNum,
      paid_at: null,
      proof_image_base64: base64Image,
      proof_filename: proofFilename,
      proof_uploaded_at: uploadedAt,
      proof_expires_at: expiresAt,
      proof_status: 'uploaded',
      proof_of_payment_url: `/api/payments/proof/`,
    });

    if (req.file) {
      newPayment.proof_of_payment_url = `/api/payments/proof/${newPayment._id}`;
      await newPayment.save();
    }

    // Notify Admin & Staff of balance payment / proof submission
    await Notification.create({
      user_id: req.user._id,
      booking_id: booking._id,
      title: `💳 Balance Payment Submitted: ${booking.booking_code}`,
      message: `Customer ${req.user.name} submitted GCash balance payment (₱${payAmount.toFixed(2)}) for booking ${booking.booking_code}. Proof uploaded.`,
      type: 'proof_submitted',
      for_role: 'admin',
      receipt_available: false,
    }).catch((err) => console.error('Admin balance notification error:', err));

    return res.status(201).json({
      success: true,
      message: 'Balance payment screenshot submitted successfully! Pending admin verification.',
      payment: newPayment,
      remaining_balance: Math.max(0, remainingBalance - payAmount),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Booking Details
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('facility_id', 'name location image_url')
      .populate('court_id', 'name court_type')
      .populate('user_id', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'customer' && booking.user_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const payments = await Payment.find({ booking_id: booking._id }).sort({ createdAt: -1 });

    const totalVerifiedPaid = payments
      .filter((p) => p.verification_status === 'verified' || p.payment_status === 'paid')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const remainingBalance = Math.max(0, booking.total_amount - totalVerifiedPaid);

    const mapped = {
      ...booking.toObject(),
      id: booking._id,
      _id: booking._id,
      paid_amount: totalVerifiedPaid,
      remaining_balance: remainingBalance,
    };

    return res.json({
      success: true,
      booking: mapped,
      payment: payments.length > 0 ? payments[0] : null,
      payments,
      paid_amount: totalVerifiedPaid,
      remaining_balance: remainingBalance,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Booking (Customer)
export const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'customer' && booking.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Booking cannot be cancelled when status is [${booking.status}]` });
    }

    booking.status = 'cancelled';
    booking.cancellation_reason = reason || 'Cancelled by customer';
    await booking.save();

    const payment = await Payment.findOne({ booking_id: booking._id });
    if (payment) {
      payment.payment_status = payment.payment_status === 'paid' ? 'refunded' : 'unpaid';
      await payment.save();
    }

    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Staff: Get All Bookings with Filter
export const getAllBookingsAdmin = async (req, res) => {
  try {
    const { status, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (date) query.booking_date = date;

    const bookings = await Booking.find(query)
      .populate('user_id', 'name email phone')
      .populate('facility_id', 'name')
      .populate('court_id', 'name')
      .sort({ createdAt: -1 });

    const payments = await Payment.find({ booking_id: { $in: bookings.map((b) => b._id) } }).sort({ createdAt: 1 });
    const paymentMap = {};
    const paymentsListMap = {};
    payments.forEach((p) => {
      const bId = p.booking_id.toString();
      if (!paymentsListMap[bId]) paymentsListMap[bId] = [];
      const proofUrl = p.proof_of_payment_url || `/api/payments/proof/${p._id}`;
      const pObj = { ...p.toObject(), proof_of_payment_url: proofUrl };
      paymentsListMap[bId].push(pObj);
      paymentMap[bId] = pObj;
    });

    const mapped = bookings.map((b) => ({
      ...b.toObject(),
      id: b._id,
      _id: b._id,
      user_id: b.user_id ? { _id: b.user_id._id, name: b.user_id.name, email: b.user_id.email, phone: b.user_id.phone } : { name: 'Walk-in Guest', email: '', phone: '' },
      payment: paymentMap[b._id.toString()] || null,
      payments: paymentsListMap[b._id.toString()] || [],
    }));

    return res.json({ success: true, bookings: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Staff: Calendar Events API (Includes Customer Name in Title & Details)
export const getCalendarEventsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $ne: 'cancelled' } })
      .populate('user_id', 'name email phone')
      .populate('court_id', 'name')
      .populate('facility_id', 'name');

    const events = bookings.map((b) => {
      const customerName = b.user_id?.name || 'Walk-in Customer';
      return {
        id: b._id,
        title: `${customerName} (${b.court_id?.name || 'Court'})`,
        start: `${b.booking_date}T${b.start_time}`,
        end: `${b.booking_date}T${b.end_time}`,
        status: b.status,
        booking_code: b.booking_code,
        customer_name: customerName,
        customer_email: b.user_id?.email || 'N/A',
        customer_phone: b.user_id?.phone || 'N/A',
        court_name: b.court_id?.name || 'Court',
        facility_name: b.facility_id?.name || '',
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        payment_type: b.payment_type,
        total_amount: b.total_amount,
        paid_amount: b.paid_amount,
        notes: b.notes,
      };
    });

    return res.json({ success: true, events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Staff: Update Booking Status
export const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['approved', 'rejected', 'checked_in', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const targetBooking = await Booking.findById(req.params.id);
    if (!targetBooking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (status === 'approved' || status === 'checked_in') {
      const payments = await Payment.find({ booking_id: targetBooking._id });
      for (const p of payments) {
        p.payment_status = 'paid';
        p.verification_status = 'verified';
        p.proof_status = 'verified';
        p.paid_at = p.paid_at || new Date();
        await p.save();
      }
      targetBooking.paid_amount = targetBooking.total_amount;
      targetBooking.status = status;
    } else {
      targetBooking.status = status;
    }

    await targetBooking.save();

    if (targetBooking.user_id) {
      let title = 'Booking Status Update';
      let message = `Your booking ${targetBooking.booking_code} status is now ${targetBooking.status}.`;
      let notifType = 'general';

      if (targetBooking.status === 'approved') {
        title = '🎉 Booking Approved & Ready!';
        message = `Great news! Your booking ${targetBooking.booking_code} has been approved by admin. Your official PDF receipt is good to go and ready to download!`;
        notifType = 'booking_approved';
      } else if (targetBooking.status === 'partially_paid') {
        title = '✅ Initial Deposit Verified!';
        message = `Your initial deposit for booking ${targetBooking.booking_code} was verified. Your reservation is confirmed and receipt is ready for download!`;
        notifType = 'payment_verified';
      } else if (targetBooking.status === 'rejected') {
        title = '⚠️ Booking Verification Status';
        message = `Your booking request ${targetBooking.booking_code} could not be approved by administrator.`;
        notifType = 'booking_rejected';
      }

      await Notification.create({
        user_id: targetBooking.user_id,
        booking_id: targetBooking._id,
        title,
        message,
        type: notifType,
        receipt_available: true,
      }).catch((err) => console.error('Notification creation error:', err));
    }

    return res.json({ success: true, message: `Booking status updated to ${targetBooking.status}`, booking: targetBooking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public: Calendar Events API (Includes customer name for landing page schedule viewer)
export const getPublicCalendarEvents = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $in: ['pending', 'approved', 'checked_in', 'completed'] } })
      .populate('user_id', 'name')
      .populate('court_id', 'name');

    const events = bookings.map((b) => {
      const customerName = b.user_id?.name || 'Reserved Customer';
      return {
        id: b._id,
        title: `Reserved: ${customerName}`,
        start: `${b.booking_date}T${b.start_time}`,
        end: `${b.booking_date}T${b.end_time}`,
        status: b.status,
        customer_name: customerName,
        court_name: b.court_id?.name || 'Court',
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
      };
    });

    return res.json({ success: true, events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Download PDF Receipt for a Booking (Customer owner or Admin/Staff)
export const downloadReceiptPdf = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user_id', 'name email phone')
      .populate('facility_id', 'name location')
      .populate('court_id', 'name court_type');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Authorization Check: If user is authenticated, verify ownership or Admin/Staff role
    if (req.user) {
      const isOwner = booking.user_id && booking.user_id._id.toString() === req.user._id.toString();
      const isAdminStaff = ['admin', 'staff'].includes(req.user.role);

      if (!isOwner && !isAdminStaff) {
        return res.status(403).json({ success: false, message: 'Unauthorized to download receipt for this booking.' });
      }
    }

    const payment = await Payment.findOne({ booking_id: booking._id });

    const disposition = req.query.inline === 'true' ? 'inline' : 'attachment';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename=Receipt-${booking.booking_code}.pdf`);

    generatePdfReceipt(
      {
        booking: booking.toObject(),
        payment: payment ? payment.toObject() : null,
        user: booking.user_id ? booking.user_id.toObject() : null,
        court: booking.court_id ? booking.court_id.toObject() : null,
        facility: booking.facility_id ? booking.facility_id.toObject() : null,
      },
      res
    );
  } catch (error) {
    console.error('PDF Receipt Generation Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Booking Permanently from Database
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking record not found.' });
    }

    // Authorization check: Admin, Staff, or owner of the booking
    const isOwner = booking.user_id && booking.user_id.toString() === req.user._id.toString();
    const isAdminStaff = ['admin', 'staff'].includes(req.user.role);

    if (!isOwner && !isAdminStaff) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this booking.' });
    }

    // Clean up associated proof files from filesystem
    const payments = await Payment.find({ booking_id: id });
    for (const p of payments) {
      if (p.proof_filename) {
        const filePath = path.join(process.cwd(), 'uploads', p.proof_filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error('Failed to delete proof file during booking deletion:', e.message);
          }
        }
      }
    }

    // Delete associated payments
    await Payment.deleteMany({ booking_id: id });

    // Delete associated notifications
    await Notification.deleteMany({ booking_id: id });

    // Permanently delete booking document from database
    await Booking.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Booking ${booking.booking_code} and all related records have been permanently deleted from the database.`,
    });
  } catch (error) {
    console.error('Delete Booking Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

