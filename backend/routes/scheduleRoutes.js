import express from 'express';
import {
  getSchedules,
  getPublicSchedules,
  updateOperatingHours,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/scheduleController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public schedule and blackout info
router.get('/public', getPublicSchedules);

// Admin & Staff protected management routes
router.get('/', protect, requireRole('admin', 'staff'), getSchedules);
router.put('/operating-hours', protect, requireRole('admin', 'staff'), updateOperatingHours);
router.post('/holidays', protect, requireRole('admin', 'staff'), createHoliday);
router.put('/holidays/:id', protect, requireRole('admin', 'staff'), updateHoliday);
router.delete('/holidays/:id', protect, requireRole('admin', 'staff'), deleteHoliday);

export default router;
