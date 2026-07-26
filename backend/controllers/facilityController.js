import Facility from '../models/Facility.js';
import Court from '../models/Court.js';

// Get active facilities (Public)
export const getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({ is_active: true });
    const mapped = facilities.map((f) => ({ ...f.toObject(), id: f._id, _id: f._id }));
    return res.json({ success: true, facilities: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get single facility details with its courts (Public)
export const getFacilityById = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }
    const courts = await Court.find({ facility_id: facility._id, is_active: true });
    const mappedFacility = { ...facility.toObject(), id: facility._id, _id: facility._id };
    const mappedCourts = courts.map((c) => ({ ...c.toObject(), id: c._id, _id: c._id, facility_id: c.facility_id }));
    return res.json({ success: true, facility: mappedFacility, courts: mappedCourts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get courts for a facility (Public / Customer Wizard)
export const getCourtsByFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const courts = await Court.find({ facility_id: facilityId, is_active: true });
    const mapped = courts.map((c) => ({ ...c.toObject(), id: c._id, _id: c._id, facility_id: c.facility_id }));
    return res.json({ success: true, courts: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all facilities (including inactive)
export const getAllFacilitiesAdmin = async (req, res) => {
  try {
    const facilities = await Facility.find({}).sort({ createdAt: -1 });
    const mapped = facilities.map((f) => ({ ...f.toObject(), id: f._id, _id: f._id }));
    return res.json({ success: true, facilities: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Facility
export const createFacility = async (req, res) => {
  try {
    const { name, description, location, hourly_rate, image_url, open_time, close_time } = req.body;
    const facility = await Facility.create({
      name,
      description: description || '',
      location: location || 'Linabo, Malaybalay City',
      hourly_rate: Number(hourly_rate),
      image_url: image_url || '',
      open_time: open_time || '05:00',
      close_time: close_time || '23:00',
    });

    const mapped = { ...facility.toObject(), id: facility._id, _id: facility._id };
    return res.status(201).json({ success: true, message: 'Facility created successfully', facility: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Facility
export const updateFacility = async (req, res) => {
  try {
    const { name, description, location, hourly_rate, image_url, open_time, close_time } = req.body;
    const facility = await Facility.findByIdAndUpdate(
      req.params.id,
      { name, description, location, hourly_rate: Number(hourly_rate), image_url, open_time, close_time },
      { new: true }
    );

    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }

    const mapped = { ...facility.toObject(), id: facility._id, _id: facility._id };
    return res.json({ success: true, message: 'Facility updated successfully', facility: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Facility
export const deleteFacility = async (req, res) => {
  try {
    await Facility.findByIdAndDelete(req.params.id);
    await Court.deleteMany({ facility_id: req.params.id });
    return res.json({ success: true, message: 'Facility deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Create Court
export const createCourt = async (req, res) => {
  try {
    const { facility_id, name, court_type, capacity, hourly_rate_override } = req.body;
    const court = await Court.create({
      facility_id,
      name,
      court_type: court_type || 'Pickleball',
      capacity: Number(capacity) || 4,
      hourly_rate_override: hourly_rate_override ? Number(hourly_rate_override) : null,
    });

    const mapped = { ...court.toObject(), id: court._id, _id: court._id };
    return res.status(201).json({ success: true, message: 'Court created successfully', court: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Update Court
export const updateCourt = async (req, res) => {
  try {
    const { name, court_type, capacity, hourly_rate_override } = req.body;
    const court = await Court.findByIdAndUpdate(
      req.params.id,
      { name, court_type, capacity, hourly_rate_override: hourly_rate_override ? Number(hourly_rate_override) : null },
      { new: true }
    );

    if (!court) {
      return res.status(404).json({ success: false, message: 'Court not found' });
    }

    const mapped = { ...court.toObject(), id: court._id, _id: court._id };
    return res.json({ success: true, message: 'Court updated successfully', court: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete Court
export const deleteCourt = async (req, res) => {
  try {
    await Court.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Court deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
