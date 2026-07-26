import express from 'express';
import { getPayments, updatePaymentStatus } from '../controllers/paymentController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, requireRole('admin', 'staff'), getPayments);
router.put('/:id/status', protect, requireRole('admin', 'staff'), updatePaymentStatus);

export default router;
