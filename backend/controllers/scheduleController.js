import Facility from '../models/Facility.js';
import OperatingHour from '../models/OperatingHour.js';
import Holiday from '../models/Holiday.js';
import Booking from '../models/Booking.js';
import Notification from '../models/Notification.js';

// Default hours for any missing day
const DEFAULT_OPEN_TIME = '05:00';
const DEFAULT_CLOSE_TIME = '23:00';

// Ensure 7 days of operating hours exist for each facility
const ensureOperatingHoursForFacilities = async (facilities) => {
  for (const fac of facilities) {
    const existing = await OperatingHour.find({ facility_id: fac._id });
    const existingDays = new Set(existing.map((h) => h.day_of_week));

    for (let day = 0; day <= 6; day++) {
      if (!existingDays.has(day)) {
        await OperatingHour.create({
          facility_id: fac._id,
          day_of_week: day,
          open_time: fac.open_time || DEFAULT_OPEN_TIME,
          close_time: fac.close_time || DEFAULT_CLOSE_TIME,
          is_closed: false,
        });
      }
    }
  }
};

// Get Operating Hours & Holidays for Admin / Staff
export const getSchedules = async (req, res) => {
  try {
    const facilitiesList = await Facility.find({});
    const facilities = facilitiesList.map((f) => ({ ...f.toObject(), id: f._id, _id: f._id }));

    // Ensure default days exist
    await ensureOperatingHoursForFacilities(facilitiesList);

    const opList = await OperatingHour.find({})
      .populate('facility_id', 'name')
      .sort({ day_of_week: 1 });

    const operatingHours = opList.map((oh) => ({
      ...oh.toObject(),
      id: oh._id,
      _id: oh._id,
      facility_id: oh.facility_id ? { _id: oh.facility_id._id, name: oh.facility_id.name } : null,
    }));

    const holList = await Holiday.find({})
      .populate('facility_id', 'name')
      .sort({ holiday_date: 1 });

    const holidays = holList.map((h) => ({
      ...h.toObject(),
      id: h._id,
      _id: h._id,
      facility_id: h.facility_id ? { _id: h.facility_id._id, name: h.facility_id.name } : null,
    }));

    return res.json({
      success: true,
      facilities,
      operatingHours,
      holidays,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public: Get Operating Hours & Holidays for Visitors & Calendar Viewers
export const getPublicSchedules = async (req, res) => {
  try {
    const facilitiesList = await Facility.find({ is_active: true });
    const facilities = facilitiesList.map((f) => ({ ...f.toObject(), id: f._id, _id: f._id }));

    const operatingHours = await OperatingHour.find({})
      .populate('facility_id', 'name')
      .sort({ day_of_week: 1 });

    const holidays = await Holiday.find({})
      .populate('facility_id', 'name')
      .sort({ holiday_date: 1 });

    return res.json({
      success: true,
      facilities,
      operatingHours,
      holidays,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Operating Hours for a Facility
export const updateOperatingHours = async (req, res) => {
  try {
    const { facility_id, hours } = req.body;

    if (!facility_id || !Array.isArray(hours)) {
      return res.status(400).json({ success: false, message: 'Facility ID and hours array are required.' });
    }

    const facility = await Facility.findById(facility_id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    const updatedList = [];
    let minOpenTime = '23:59';
    let maxCloseTime = '00:00';

    for (const item of hours) {
      const openTime = item.open_time || DEFAULT_OPEN_TIME;
      const closeTime = item.close_time || DEFAULT_CLOSE_TIME;
      const isClosed = !!item.is_closed;

      const record = await OperatingHour.findOneAndUpdate(
        { facility_id, day_of_week: item.day_of_week },
        {
          facility_id,
          day_of_week: item.day_of_week,
          open_time: openTime,
          close_time: closeTime,
          is_closed: isClosed,
        },
        { upsert: true, new: true }
      ).populate('facility_id', 'name');

      updatedList.push(record);

      if (!isClosed) {
        if (openTime < minOpenTime) minOpenTime = openTime;
        if (closeTime > maxCloseTime) maxCloseTime = closeTime;
      }
    }

    // Keep facility record open_time and close_time in sync with active operating hours
    if (minOpenTime !== '23:59' && maxCloseTime !== '00:00') {
      facility.open_time = minOpenTime;
      facility.close_time = maxCloseTime;
      await facility.save();
    }

    // Broadcast facility operating hours update alert
    await Notification.create({
      title: '⏰ Facility Operating Hours Updated',
      message: `Operating hours for ${facility.name} have been updated by admin. Please check court schedules for updated hours.`,
      type: 'facility_alert',
      for_role: 'all_users',
    }).catch((err) => console.error('Schedule notification error:', err));

    return res.json({
      success: true,
      message: 'Operating hours updated successfully.',
      operatingHours: updatedList,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Holiday Blackout
export const createHoliday = async (req, res) => {
  try {
    const { facility_id, name, holiday_date, end_date, description, is_recurring } = req.body;

    if (!name || !holiday_date) {
      return res.status(400).json({ success: false, message: 'Holiday blackout name and date are required.' });
    }

    const startDateStr = String(holiday_date).trim();
    const endDateStr = end_date ? String(end_date).trim() : null;

    if (endDateStr && endDateStr < startDateStr) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
    }

    const holiday = await Holiday.create({
      facility_id: facility_id || null,
      name: name.trim(),
      holiday_date: startDateStr,
      end_date: endDateStr,
      description: description ? description.trim() : '',
      is_recurring: !!is_recurring,
    });

    const populated = await Holiday.findById(holiday._id).populate('facility_id', 'name');

    // Broadcast holiday closure alert
    const dateRangeLabel = endDateStr && endDateStr !== startDateStr ? `${startDateStr} to ${endDateStr}` : startDateStr;
    await Notification.create({
      title: `🏖️ Holiday Blackout Closure: ${name}`,
      message: `House of A's facility will observe a special schedule / closure on ${dateRangeLabel} due to ${name}.`,
      type: 'holiday_alert',
      for_role: 'all_users',
    }).catch((err) => console.error('Holiday notification error:', err));

    // Check if there are existing active bookings on this holiday date
    const bookingQuery = {
      status: { $in: ['pending', 'partially_paid', 'approved', 'checked_in'] },
      is_archived: { $ne: true },
    };

    if (endDateStr && endDateStr > startDateStr) {
      bookingQuery.booking_date = { $gte: startDateStr, $lte: endDateStr };
    } else {
      bookingQuery.booking_date = startDateStr;
    }

    if (facility_id) {
      bookingQuery.facility_id = facility_id;
    }

    const existingBookings = await Booking.find(bookingQuery);
    let warningNote = '';
    if (existingBookings.length > 0) {
      const codes = existingBookings.map((b) => b.booking_code).join(', ');
      warningNote = ` (⚠️ Note: ${existingBookings.length} existing booking(s) exist on this date [${codes}]. Please review them in Manage Bookings.)`;
    }

    const mapped = { ...populated.toObject(), id: populated._id, _id: populated._id };

    return res.status(201).json({
      success: true,
      message: `Holiday blackout added successfully.${warningNote}`,
      holiday: mapped,
      existing_bookings_count: existingBookings.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Holiday Blackout
export const updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { facility_id, name, holiday_date, end_date, description, is_recurring } = req.body;

    const holiday = await Holiday.findById(id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday blackout not found.' });
    }

    if (name) holiday.name = name.trim();
    if (holiday_date) holiday.holiday_date = String(holiday_date).trim();
    if (end_date !== undefined) holiday.end_date = end_date ? String(end_date).trim() : null;
    if (description !== undefined) holiday.description = description ? description.trim() : '';
    if (is_recurring !== undefined) holiday.is_recurring = !!is_recurring;
    if (facility_id !== undefined) holiday.facility_id = facility_id || null;

    if (holiday.end_date && holiday.end_date < holiday.holiday_date) {
      return res.status(400).json({ success: false, message: 'End date cannot be earlier than start date.' });
    }

    await holiday.save();
    const populated = await Holiday.findById(holiday._id).populate('facility_id', 'name');

    return res.json({
      success: true,
      message: 'Holiday blackout updated successfully.',
      holiday: { ...populated.toObject(), id: populated._id, _id: populated._id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Holiday
export const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: 'Holiday blackout record not found.' });
    }
    return res.json({ success: true, message: `Holiday blackout "${holiday.name}" deleted successfully.` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
