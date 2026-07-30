import express from 'express';
import {
  checkAvailability,
  getPublicCalendarEvents,
  createBooking,
  submitBalancePayment,
  createManualBookingAdmin,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookingsAdmin,
  getCalendarEventsAdmin,
  updateBookingStatusAdmin,
  downloadReceiptPdf,
  deleteBooking,
  getArchivedBookingsAdmin,
  restoreBookingAdmin,
  permanentlyDeleteBookingAdmin,
} from '../controllers/bookingController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadProof } from '../middleware/upload.js';

const router = express.Router();

// Public / Customer check availability
router.post('/check-availability', checkAvailability);
router.get('/public-calendar-events', getPublicCalendarEvents);

// Customer & User routes (With optional proof_image upload for GCash)
router.post('/', protect, uploadProof.single('proof_image'), createBooking);
router.post('/:id/pay-balance', protect, uploadProof.single('proof_image'), submitBalancePayment);
router.get('/my-bookings', protect, getMyBookings);
router.post('/:id/cancel', protect, cancelBooking);

// Download PDF Receipt Route
router.get('/:id/receipt', downloadReceiptPdf);

// Shared Admin/Staff routes
router.get('/admin/all', protect, requireRole('admin', 'staff'), getAllBookingsAdmin);
router.get('/admin/archived', protect, requireRole('admin', 'staff'), getArchivedBookingsAdmin);
router.patch('/admin/:id/restore', protect, requireRole('admin', 'staff'), restoreBookingAdmin);
router.delete('/admin/:id/permanent', protect, requireRole('admin', 'staff'), permanentlyDeleteBookingAdmin);
router.get('/admin/calendar-events', protect, requireRole('admin', 'staff'), getCalendarEventsAdmin);
router.post('/admin/manual-booking', protect, requireRole('admin', 'staff'), createManualBookingAdmin);
router.patch('/admin/:id/status', protect, requireRole('admin', 'staff'), updateBookingStatusAdmin);
router.delete('/admin/:id', protect, requireRole('admin', 'staff'), deleteBooking);

// Soft Delete / Move to Archive Route (Admin, Staff, or Owner)
router.delete('/:id', protect, deleteBooking);

// Single booking view (Customer or Admin)
router.get('/:id', protect, getBookingById);

export default router;

