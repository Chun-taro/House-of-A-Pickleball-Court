import db from '../config/db.js';

// Get Operating Hours & Holidays for Admin / Staff
export const getSchedules = (req, res) => {
  try {
    const facilitiesList = db.prepare('SELECT * FROM facilities').all();
    const facilities = facilitiesList.map(f => ({ ...f, _id: f.id }));

    const opList = db.prepare(`
      SELECT oh.*, f.name as facility_name
      FROM operating_hours oh
      LEFT JOIN facilities f ON oh.facility_id = f.id
    `).all();
    const operatingHours = opList.map(oh => ({ ...oh, _id: oh.id, facility_id: { _id: oh.facility_id, name: oh.facility_name } }));

    const holList = db.prepare(`
      SELECT h.*, f.name as facility_name
      FROM holidays h
      LEFT JOIN facilities f ON h.facility_id = f.id
      ORDER BY h.holiday_date ASC
    `).all();
    const holidays = holList.map(h => ({ ...h, _id: h.id, facility_id: h.facility_id ? { _id: h.facility_id, name: h.facility_name } : null }));

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
export const updateOperatingHours = (req, res) => {
  try {
    const { facility_id, hours } = req.body;

    if (!facility_id || !Array.isArray(hours)) {
      return res.status(400).json({ success: false, message: 'Facility ID and hours array are required.' });
    }

    for (const item of hours) {
      const existing = db.prepare('SELECT id FROM operating_hours WHERE facility_id = ? AND day_of_week = ?').get(facility_id, item.day_of_week);
      if (existing) {
        db.prepare('UPDATE operating_hours SET open_time = ?, close_time = ?, is_closed = ? WHERE id = ?').run(
          item.open_time || '06:00',
          item.close_time || '22:00',
          item.is_closed ? 1 : 0,
          existing.id
        );
      } else {
        db.prepare('INSERT INTO operating_hours (facility_id, day_of_week, open_time, close_time, is_closed) VALUES (?, ?, ?, ?, ?)').run(
          facility_id,
          item.day_of_week,
          item.open_time || '06:00',
          item.close_time || '22:00',
          item.is_closed ? 1 : 0
        );
      }
    }

    return res.json({ success: true, message: 'Operating hours updated successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Create Holiday
export const createHoliday = (req, res) => {
  try {
    const { facility_id, name, holiday_date, is_recurring } = req.body;

    if (!name || !holiday_date) {
      return res.status(400).json({ success: false, message: 'Holiday name and date are required.' });
    }

    const info = db.prepare(
      'INSERT INTO holidays (facility_id, name, holiday_date, is_recurring) VALUES (?, ?, ?, ?)'
    ).run(facility_id || null, name, holiday_date, is_recurring ? 1 : 0);

    const holiday = db.prepare('SELECT * FROM holidays WHERE id = ?').get(info.lastInsertRowid);

    return res.status(201).json({ success: true, message: 'Holiday added successfully.', holiday: { ...holiday, _id: holiday.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Holiday
export const deleteHoliday = (req, res) => {
  try {
    db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Holiday deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
