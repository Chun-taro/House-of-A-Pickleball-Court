import db from '../config/db.js';

// Get active facilities (Public)
export const getFacilities = (req, res) => {
  try {
    const facilities = db.prepare('SELECT * FROM facilities WHERE is_active = 1').all();
    const mapped = facilities.map((f) => ({ ...f, _id: f.id }));
    return res.json({ success: true, facilities: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single facility details with its courts (Public)
export const getFacilityById = (req, res) => {
  try {
    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }
    const courts = db.prepare('SELECT * FROM courts WHERE facility_id = ? AND is_active = 1').all(facility.id);
    const mappedFacility = { ...facility, _id: facility.id };
    const mappedCourts = courts.map((c) => ({ ...c, _id: c.id, facility_id: c.facility_id }));
    return res.json({ success: true, facility: mappedFacility, courts: mappedCourts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get courts for a facility (Public / Customer Wizard)
export const getCourtsByFacility = (req, res) => {
  try {
    const { facilityId } = req.params;
    const courts = db.prepare('SELECT * FROM courts WHERE facility_id = ? AND is_active = 1').all(facilityId);
    const mapped = courts.map((c) => ({ ...c, _id: c.id, facility_id: c.facility_id }));
    return res.json({ success: true, courts: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all facilities (including inactive)
export const getAllFacilitiesAdmin = (req, res) => {
  try {
    const facilities = db.prepare('SELECT * FROM facilities ORDER BY id DESC').all();
    const mapped = facilities.map((f) => ({ ...f, _id: f.id }));
    return res.json({ success: true, facilities: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Facility
export const createFacility = (req, res) => {
  try {
    const { name, description, location, hourly_rate, image_url, open_time, close_time } = req.body;
    const info = db.prepare(
      'INSERT INTO facilities (name, description, location, hourly_rate, image_url, open_time, close_time) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      name,
      description || '',
      location || 'Linabo, Malaybalay City',
      Number(hourly_rate),
      image_url || '',
      open_time || '05:00',
      close_time || '23:00'
    );

    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Facility created successfully', facility: { ...facility, _id: facility.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Facility
export const updateFacility = (req, res) => {
  try {
    const { name, description, location, hourly_rate, image_url, open_time, close_time } = req.body;
    db.prepare(
      'UPDATE facilities SET name = ?, description = ?, location = ?, hourly_rate = ?, image_url = ?, open_time = ?, close_time = ? WHERE id = ?'
    ).run(name, description, location, Number(hourly_rate), image_url, open_time, close_time, req.params.id);

    const facility = db.prepare('SELECT * FROM facilities WHERE id = ?').get(req.params.id);
    return res.json({ success: true, message: 'Facility updated successfully', facility: { ...facility, _id: facility.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Facility
export const deleteFacility = (req, res) => {
  try {
    db.prepare('DELETE FROM facilities WHERE id = ?').run(req.params.id);
    db.prepare('DELETE FROM courts WHERE facility_id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Court
export const createCourt = (req, res) => {
  try {
    const { facility_id, name, court_type, capacity, hourly_rate_override } = req.body;
    const info = db.prepare(
      'INSERT INTO courts (facility_id, name, court_type, capacity, hourly_rate_override) VALUES (?, ?, ?, ?, ?)'
    ).run(
      facility_id,
      name,
      court_type || 'Pickleball',
      Number(capacity) || 4,
      hourly_rate_override ? Number(hourly_rate_override) : null
    );

    const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(info.lastInsertRowid);
    return res.status(201).json({ success: true, message: 'Court created successfully', court: { ...court, _id: court.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Court
export const updateCourt = (req, res) => {
  try {
    const { name, court_type, capacity, hourly_rate_override } = req.body;
    db.prepare(
      'UPDATE courts SET name = ?, court_type = ?, capacity = ?, hourly_rate_override = ? WHERE id = ?'
    ).run(name, court_type, capacity, hourly_rate_override || null, req.params.id);

    const court = db.prepare('SELECT * FROM courts WHERE id = ?').get(req.params.id);
    return res.json({ success: true, message: 'Court updated successfully', court: { ...court, _id: court.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Court
export const deleteCourt = (req, res) => {
  try {
    db.prepare('DELETE FROM courts WHERE id = ?').run(req.params.id);
    return res.json({ success: true, message: 'Court deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
