import express from 'express';
import { getDashboardStats, getReportData, exportReportCsv } from '../controllers/reportController.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Dashboard Metrics Endpoint
router.get('/dashboard', protect, requireRole('admin', 'staff'), getDashboardStats);
router.get('/dashboard-stats', protect, requireRole('admin', 'staff'), getDashboardStats);

// Analytics & Reports Endpoint
router.get('/analytics', protect, requireRole('admin', 'staff'), getReportData);
router.get('/full', protect, requireRole('admin', 'staff'), getReportData);

// CSV Export Endpoint
router.get('/export-csv', protect, requireRole('admin', 'staff'), exportReportCsv);
router.get('/export/csv', protect, requireRole('admin', 'staff'), exportReportCsv);

export default router;
