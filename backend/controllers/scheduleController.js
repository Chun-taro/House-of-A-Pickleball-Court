import Facility from '../models/Facility.js';
import OperatingHour from '../models/OperatingHour.js';
import Holiday from '../models/Holiday.js';

// Get Operating Hours & Holidays for Admin / Staff
export const getSchedules = async (req, res) => {
  try {
    const facilitiesList = await Facility.find({});
    const facilities = facilitiesList.map(f => ({ ...f.toObject(), id: f._id, _id: f._id }));

    const opList = await OperatingHour.find({}).populate('facility_id', 'name');
    const operatingHours = opList.map(oh => ({
      ...oh.toObject(),
      id: oh._id,
      _id: oh._id,
      facility_id: oh.facility_id ? { _id: oh.facility_id._id, name: oh.facility_id.name } : null
    }));

    const holList = await Holiday.find({}).populate('facility_id', 'name').sort({ holiday_date: 1 });
    const holidays = holList.map(h => ({
      ...h.toObject(),
      id: h._id,
      _id: h._id,
      facility_id: h.facility_id ? { _id: h.facility_id._id, name: h.facility_id.name } : null
    }));

    return res.json({
      success: true,
      facilities,
      operatingHours,
      holidays
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

    for (const item of hours) {
      await OperatingHour.findOneAndUpdate(
        { facility_id, day_of_week: item.day_of_week },
        {
          facility_id,
          day_of_week: item.day_of_week,
          open_time: item.open_time || '06:00',
          close_time: item.close_time || '22:00',
          is_closed: !!item.is_closed,
        },
        { upsert: true, new: true }
      );
    }

    return res.json({ success: true, message: 'Operating hours updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Holiday
export const createHoliday = async (req, res) => {
  try {
    const { facility_id, name, holiday_date, is_recurring } = req.body;

    if (!name || !holiday_date) {
      return res.status(400).json({ success: false, message: 'Holiday name and date are required.' });
    }

    const holiday = await Holiday.create({
      facility_id: facility_id || null,
      name,
      holiday_date,
      is_recurring: !!is_recurring,
    });

    const mapped = { ...holiday.toObject(), id: holiday._id, _id: holiday._id };

    return res.status(201).json({ success: true, message: 'Holiday added successfully.', holiday: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Holiday
export const deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Holiday deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
