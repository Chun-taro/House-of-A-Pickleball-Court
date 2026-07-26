import express from 'express';
import {
  getSchedules,
  updateOperatingHours,
  createHoliday,
  deleteHoliday,
} from '../controllers/scheduleController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, requireRole('admin', 'staff'), getSchedules);
router.put('/operating-hours', protect, requireRole('admin', 'staff'), updateOperatingHours);
router.post('/holidays', protect, requireRole('admin', 'staff'), createHoliday);
router.delete('/holidays/:id', protect, requireRole('admin', 'staff'), deleteHoliday);

export default router;
