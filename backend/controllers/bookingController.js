import db from '../config/db.js';
import { sendBookingConfirmationEmail, sendPaymentReceiptEmail } from '../utils/mailer.js';

// Helper to convert "HH:MM" string to total minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

// Check date/court availability and return time slots based on chosen duration_hours
export const checkAvailability = (req, res) => {
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
    const holiday = db.prepare(
      'SELECT * FROM holidays WHERE (holiday_date = ? OR is_recurring = 1) AND (facility_id IS NULL OR facility_id = ?)'
    ).get(date, facility_id);

    if (holiday && holiday.holiday_date === date) {
      return res.json({
        success: false,
        is_closed: true,
        message: `Facility is closed on this date due to holiday: ${holiday.name}`,
        slots: []
      });
    }

    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facility_id);
    const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(court_id);

    if (!facility || !court) {
      return res.status(404).json({ success: false, message: 'Facility or Court not found' });
    }

    // Check Operating Hours
    const dayOfWeek = bookingDate.getDay(); // 0 (Sun) - 6 (Sat)
    const operatingHour = db.prepare('SELECT * FROM operating_hours WHERE facility_id = ? AND day_of_week = ?').get(facility_id, dayOfWeek);

    if (operatingHour && operatingHour.is_closed) {
      return res.json({
        success: false,
        is_closed: true,
        message: 'Facility is closed on this day of the week.',
        slots: []
      });
    }

    const openTimeStr = operatingHour ? operatingHour.open_time : (facility.open_time || '05:00');
    const closeTimeStr = operatingHour ? operatingHour.close_time : (facility.close_time || '23:00');

    const openHour = parseInt(openTimeStr.split(':')[0], 10);
    const closeHour = parseInt(closeTimeStr.split(':')[0], 10);

    // Get existing active bookings for this court on this date
    const existingBookings = db.prepare(
      "SELECT start_time, end_time FROM bookings WHERE court_id = ? AND booking_date = ? AND status IN ('pending', 'approved', 'checked_in', 'completed')"
    ).all(court_id, date);

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

      slots.push({
        start_time: slotStartStr,
        end_time: slotEndStr,
        duration_hours: duration,
        label,
        available: !isBooked && !isPastSlot,
        reason: isBooked ? 'Booked / Overlap' : (isPastSlot ? 'Past Time' : 'Available')
      });
    }

    const hourlyRate = court.hourly_rate_override ?? facility.hourly_rate;

    return res.json({
      success: true,
      is_closed: false,
      hourly_rate: hourlyRate,
      duration_hours: duration,
      slots
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new booking (Customer)
export const createBooking = (req, res) => {
  try {
    const { facility_id, court_id, booking_date, start_time, end_time, payment_method, notes } = req.body;

    if (!facility_id || !court_id || !booking_date || !start_time || !end_time || !payment_method) {
      return res.status(400).json({ success: false, message: 'Please provide all required booking details.' });
    }

    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facility_id);
    const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(court_id);

    if (!facility || !court) {
      return res.status(404).json({ success: false, message: 'Selected facility or court does not exist.' });
    }

    // Double check availability against existing bookings
    const overlapBooking = db.prepare(
      "SELECT id FROM bookings WHERE court_id = ? AND booking_date = ? AND status IN ('pending', 'approved', 'checked_in', 'completed') AND (start_time < ? AND end_time > ?)"
    ).get(court_id, booking_date, end_time, start_time);

    if (overlapBooking) {
      return res.status(400).json({ success: false, message: 'The selected court and time slot is no longer available.' });
    }

    const startMins = timeToMinutes(start_time);
    const endMins = timeToMinutes(end_time);
    const duration_hours = Math.max(1, (endMins - startMins) / 60);

    const hourly_rate = court.hourly_rate_override ?? facility.hourly_rate;
    const subtotal = hourly_rate * duration_hours;
    const tax_amount = 0;
    const total_amount = subtotal + tax_amount;

    const dateCode = booking_date.replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const booking_code = `HOA-${dateCode}-${randomStr}`;

    const info = db.prepare(`
      INSERT INTO bookings (
        booking_code, user_id, facility_id, court_id, booking_date, start_time, end_time,
        duration_hours, hourly_rate, subtotal, tax_amount, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(
      booking_code,
      req.user.id,
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
      notes || ''
    );

    const bookingId = Number(info.lastInsertRowid);
    const isPaidOnline = payment_method !== 'cash';
    const refNum = isPaidOnline ? `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null;

    db.prepare(`
      INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, reference_number, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookingId,
      req.user.id,
      total_amount,
      payment_method,
      isPaidOnline ? 'paid' : 'unpaid',
      refNum,
      isPaidOnline ? new Date().toISOString() : null
    );

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

    // Send confirmation email asynchronously
    sendBookingConfirmationEmail({
      booking,
      user: req.user,
      courtName: court.name,
      facilityName: facility.name,
    }).catch((err) => console.error('Booking mailer error:', err));

    if (isPaidOnline) {
      sendPaymentReceiptEmail({
        payment: { amount: total_amount, payment_method, reference_number: refNum },
        booking,
        user: req.user,
      }).catch((err) => console.error('Payment mailer error:', err));
    }

    return res.status(201).json({
      success: true,
      message: 'Booking reservation submitted successfully!',
      booking_code,
      booking: { ...booking, _id: booking.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin / Staff: Manually Create & Occupy Time Slot (Walk-ins / Custom Time Slots)
export const createManualBookingAdmin = (req, res) => {
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
      notes = ''
    } = req.body;

    if (!facility_id || !court_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'Facility, Court, Date, Start Time, and End Time are required.' });
    }

    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facility_id);
    const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(court_id);

    if (!facility || !court) {
      return res.status(404).json({ success: false, message: 'Facility or Court not found.' });
    }

    // Check overlap with existing active bookings
    const overlapBooking = db.prepare(
      "SELECT booking_code FROM bookings WHERE court_id = ? AND booking_date = ? AND status IN ('pending', 'approved', 'checked_in', 'completed') AND (start_time < ? AND end_time > ?)"
    ).get(court_id, booking_date, end_time, start_time);

    if (overlapBooking) {
      return res.status(400).json({
        success: false,
        message: `Cannot book time slot ${start_time} - ${end_time}. It overlaps with existing booking [${overlapBooking.booking_code}].`
      });
    }

    // If customer name is provided, create or reuse user profile
    let targetUserId = req.user.id;
    if (customer_name) {
      const emailLookup = customer_email ? customer_email.toLowerCase() : `walkin_${Date.now()}@houseofas.com`;
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR name = ?').get(emailLookup, customer_name);
      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const createStmt = db.prepare('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)');
        const newUserInfo = createStmt.run(customer_name, emailLookup, 'walkin123', customer_phone || '', 'customer');
        targetUserId = Number(newUserInfo.lastInsertRowid);
      }
    }

    const startMins = timeToMinutes(start_time);
    const endMins = timeToMinutes(end_time);
    const duration_hours = Math.max(0.5, (endMins - startMins) / 60);

    const hourly_rate = court.hourly_rate_override ?? facility.hourly_rate;
    const subtotal = hourly_rate * duration_hours;
    const tax_amount = 0;
    const total_amount = subtotal + tax_amount;

    const dateCode = booking_date.replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const booking_code = `HOA-MANUAL-${dateCode}-${randomStr}`;

    const info = db.prepare(`
      INSERT INTO bookings (
        booking_code, user_id, facility_id, court_id, booking_date, start_time, end_time,
        duration_hours, hourly_rate, subtotal, tax_amount, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?)
    `).run(
      booking_code,
      targetUserId,
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
      notes || 'Manual Admin Reservation'
    );

    const bookingId = Number(info.lastInsertRowid);
    const refNum = `PAY-MANUAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    db.prepare(`
      INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, reference_number, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookingId,
      targetUserId,
      total_amount,
      payment_method,
      payment_status,
      refNum,
      payment_status === 'paid' ? new Date().toISOString() : null
    );

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);

    return res.status(201).json({
      success: true,
      message: `Time slot ${start_time} - ${end_time} reserved for ${customer_name || 'Customer'}.`,
      booking_code,
      booking: { ...booking, _id: booking.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Bookings (Customer)
export const getMyBookings = (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT b.*, f.name as facility_name, f.location as facility_location, f.image_url as facility_image,
             c.name as court_name, c.court_type
      FROM bookings b
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN courts c ON b.court_id = c.id
      WHERE b.user_id = ?
    `;
    const params = [req.user.id];

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY b.id DESC';

    const bookings = db.prepare(sql).all(...params);

    const mapped = bookings.map((b) => ({
      ...b,
      _id: b.id,
      facility_id: { _id: b.facility_id, name: b.facility_name, location: b.facility_location, image_url: b.facility_image },
      court_id: { _id: b.court_id, name: b.court_name, court_type: b.court_type },
    }));

    return res.json({ success: true, bookings: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Booking Details
export const getBookingById = (req, res) => {
  try {
    const b = db.prepare(`
      SELECT b.*, f.name as facility_name, f.location as facility_location,
             c.name as court_name, c.court_type,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM bookings b
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN courts c ON b.court_id = c.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!b) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'customer' && b.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(b.id);

    const booking = {
      ...b,
      _id: b.id,
      facility_id: { _id: b.facility_id, name: b.facility_name, location: b.facility_location },
      court_id: { _id: b.court_id, name: b.court_name, court_type: b.court_type },
      user_id: { _id: b.user_id, name: b.user_name, email: b.user_email, phone: b.user_phone },
    };

    return res.json({ success: true, booking, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel Booking (Customer)
export const cancelBooking = (req, res) => {
  try {
    const { reason } = req.body;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user.role === 'customer' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Booking cannot be cancelled when status is [${booking.status}]` });
    }

    db.prepare("UPDATE bookings SET status = 'cancelled', cancellation_reason = ? WHERE id = ?").run(reason || 'Cancelled by customer', booking.id);

    const payment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(booking.id);
    if (payment) {
      const newPaymentStatus = payment.payment_status === 'paid' ? 'refunded' : 'unpaid';
      db.prepare('UPDATE payments SET payment_status = ? WHERE id = ?').run(newPaymentStatus, payment.id);
    }

    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Staff: Get All Bookings with Filter
export const getAllBookingsAdmin = (req, res) => {
  try {
    const { status, date } = req.query;

    let sql = `
      SELECT b.*, f.name as facility_name, c.name as court_name,
             u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM bookings b
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN courts c ON b.court_id = c.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }
    if (date) {
      sql += ' AND b.booking_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY b.id DESC';

    const bookings = db.prepare(sql).all(...params);

    const mapped = bookings.map((b) => ({
      ...b,
      _id: b.id,
      user_id: { _id: b.user_id, name: b.user_name || 'Walk-in Guest', email: b.user_email || '', phone: b.user_phone || '' },
      facility_id: { _id: b.facility_id, name: b.facility_name },
      court_id: { _id: b.court_id, name: b.court_name },
    }));

    return res.json({ success: true, bookings: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Staff: Calendar Events API (Includes Customer Name in Title)
export const getCalendarEventsAdmin = (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, f.name as facility_name, c.name as court_name, u.name as user_name
      FROM bookings b
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN courts c ON b.court_id = c.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.status != 'cancelled'
    `).all();

    const events = bookings.map((b) => {
      const customerName = b.user_name || 'Walk-in Customer';
      return {
        id: b.id,
        title: `${customerName} - ${b.court_name || 'Court'}`,
        start: `${b.booking_date}T${b.start_time}`,
        end: `${b.booking_date}T${b.end_time}`,
        status: b.status,
        booking_code: b.booking_code,
        customer_name: customerName,
        notes: b.notes
      };
    });

    return res.json({ success: true, events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin/Staff: Update Booking Status
export const updateBookingStatusAdmin = (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['approved', 'rejected', 'checked_in', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);

    if (status === 'approved') {
      db.prepare("UPDATE payments SET payment_status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE booking_id = ? AND payment_method = 'cash'").run(req.params.id);
    }

    return res.json({ success: true, message: `Booking status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public: Calendar Events API (Anonymized for public viewing)
export const getPublicCalendarEvents = (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.id, b.booking_date, b.start_time, b.end_time, b.status, c.name as court_name
      FROM bookings b
      LEFT JOIN courts c ON b.court_id = c.id
      WHERE b.status IN ('pending', 'approved', 'checked_in', 'completed')
    `).all();

    const events = bookings.map((b) => ({
      id: b.id,
      title: 'Reserved',
      start: `${b.booking_date}T${b.start_time}`,
      end: `${b.booking_date}T${b.end_time}`,
      status: b.status,
      court_name: b.court_name,
    }));

    return res.json({ success: true, events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

