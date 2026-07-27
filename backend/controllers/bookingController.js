import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Facility from '../models/Facility.js';
import Court from '../models/Court.js';
import OperatingHour from '../models/OperatingHour.js';
import Holiday from '../models/Holiday.js';
import User from '../models/User.js';
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
    const { facility_id, court_id, booking_date, start_time, end_time, payment_method, notes } = req.body;

    if (!facility_id || !court_id || !booking_date || !start_time || !end_time || !payment_method) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking details.' });
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
      status: { $in: ['pending', 'approved', 'checked_in', 'completed'] },
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
      status: 'pending',
      notes: notes || '',
    });

    const isPaidOnline = payment_method !== 'cash';
    const refNum = req.body.reference_number || (isPaidOnline ? `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null);

    const hasProofFile = !!req.file;
    const proofFilename = hasProofFile ? req.file.filename : null;
    const proofUrl = hasProofFile ? `/api/payments/proof/${req.file.filename}` : null;
    const proofUploadedAt = hasProofFile ? new Date() : null;
    const proofExpiresAt = hasProofFile ? new Date(Date.now() + 72 * 60 * 60 * 1000) : null;

    const payment = await Payment.create({
      booking_id: booking._id,
      user_id: req.user._id,
      amount: total_amount,
      payment_method,
      payment_status: payment_method === 'cash' ? 'unpaid' : (hasProofFile ? 'unpaid' : (isPaidOnline ? 'paid' : 'unpaid')),
      reference_number: refNum,
      paid_at: (isPaidOnline && !hasProofFile) ? new Date() : null,
      proof_filename: proofFilename,
      proof_of_payment_url: proofUrl,
      proof_uploaded_at: proofUploadedAt,
      proof_expires_at: proofExpiresAt,
      proof_status: hasProofFile ? 'uploaded' : 'none',
    });

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
      payment_method = 'cash',
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

    const payment = await Payment.findOne({ booking_id: booking._id });

    const mapped = {
      ...booking.toObject(),
      id: booking._id,
      _id: booking._id,
    };

    return res.json({ success: true, booking: mapped, payment });
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

    const payments = await Payment.find({ booking_id: { $in: bookings.map((b) => b._id) } });
    const paymentMap = {};
    payments.forEach((p) => {
      paymentMap[p.booking_id.toString()] = p.toObject();
    });

    const mapped = bookings.map((b) => ({
      ...b.toObject(),
      id: b._id,
      _id: b._id,
      user_id: b.user_id ? { _id: b.user_id._id, name: b.user_id.name, email: b.user_id.email, phone: b.user_id.phone } : { name: 'Walk-in Guest', email: '', phone: '' },
      payment: paymentMap[b._id.toString()] || null,
    }));

    return res.json({ success: true, bookings: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Staff: Calendar Events API (Includes Customer Name in Title)
export const getCalendarEventsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $ne: 'cancelled' } })
      .populate('user_id', 'name')
      .populate('court_id', 'name');

    const events = bookings.map((b) => {
      const customerName = b.user_id?.name || 'Walk-in Customer';
      return {
        id: b._id,
        title: `${customerName} - ${b.court_id?.name || 'Court'}`,
        start: `${b.booking_date}T${b.start_time}`,
        end: `${b.booking_date}T${b.end_time}`,
        status: b.status,
        booking_code: b.booking_code,
        customer_name: customerName,
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

    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (status === 'approved') {
      await Payment.findOneAndUpdate(
        { booking_id: booking._id, payment_method: 'cash' },
        { payment_status: 'paid', paid_at: new Date() }
      );
    }

    return res.json({ success: true, message: `Booking status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public: Calendar Events API (Anonymized for public viewing)
export const getPublicCalendarEvents = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: { $in: ['pending', 'approved', 'checked_in', 'completed'] } })
      .populate('court_id', 'name');

    const events = bookings.map((b) => ({
      id: b._id,
      title: 'Reserved',
      start: `${b.booking_date}T${b.start_time}`,
      end: `${b.booking_date}T${b.end_time}`,
      status: b.status,
      court_name: b.court_id?.name || 'Court',
    }));

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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt-${booking.booking_code}.pdf`);

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
