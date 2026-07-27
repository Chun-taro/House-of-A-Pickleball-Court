import express from 'express';
import { getPayments, updatePaymentStatus, uploadProofImage, serveProofImage } from '../controllers/paymentController.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadProof } from '../middleware/upload.js';

const router = express.Router();

// Admin / Staff payments listing & status update
router.get('/', protect, requireRole('admin', 'staff'), getPayments);
router.put('/:id/status', protect, requireRole('admin', 'staff'), updatePaymentStatus);

// Proof image view endpoint (Serves uploaded proof image file)
router.get('/proof/:filename', serveProofImage);

// Upload / Re-upload proof image endpoint
router.post('/:id/upload-proof', protect, uploadProof.single('proof_image'), uploadProofImage);

export default router;
