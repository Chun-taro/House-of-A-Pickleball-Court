import express from 'express';
import {
  checkAvailability,
  getPublicCalendarEvents,
  createBooking,
  createManualBookingAdmin,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookingsAdmin,
  getCalendarEventsAdmin,
  updateBookingStatusAdmin,
} from '../controllers/bookingController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public / Customer check availability
router.post('/check-availability', checkAvailability);
router.get('/public-calendar-events', getPublicCalendarEvents);


// Customer routes
router.post('/', protect, requireRole('customer'), createBooking);
router.get('/my-bookings', protect, requireRole('customer'), getMyBookings);
router.post('/:id/cancel', protect, requireRole('customer'), cancelBooking);

// Shared Admin/Staff routes
router.get('/admin/all', protect, requireRole('admin', 'staff'), getAllBookingsAdmin);
router.get('/admin/calendar-events', protect, requireRole('admin', 'staff'), getCalendarEventsAdmin);
router.post('/admin/manual-booking', protect, requireRole('admin', 'staff'), createManualBookingAdmin);
router.patch('/admin/:id/status', protect, requireRole('admin', 'staff'), updateBookingStatusAdmin);

// Single booking view (Customer or Admin)
router.get('/:id', protect, getBookingById);

export default router;
