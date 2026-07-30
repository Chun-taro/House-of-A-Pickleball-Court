import express from 'express';
import {
  getFacilities,
  getFacilityById,
  getCourtsByFacility,
  getAllFacilitiesAdmin,
  createFacility,
  updateFacility,
  deleteFacility,
  createCourt,
  updateCourt,
  deleteCourt,
} from '../controllers/facilityController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getFacilities);
router.get('/:id', getFacilityById);
router.get('/:facilityId/courts', getCourtsByFacility);

// Admin view all
router.get('/admin/all', protect, requireRole('admin'), getAllFacilitiesAdmin);

// Admin Mutation routes
router.post('/', protect, requireRole('admin'), createFacility);
router.put('/:id', protect, requireRole('admin'), updateFacility);
router.delete('/:id', protect, requireRole('admin'), deleteFacility);

router.post('/courts', protect, requireRole('admin'), createCourt);
router.put('/courts/:id', protect, requireRole('admin'), updateCourt);
router.delete('/courts/:id', protect, requireRole('admin'), deleteCourt);

export default router;
