import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Facility from '../models/Facility.js';
import User from '../models/User.js';
import Court from '../models/Court.js';

// Get Admin Dashboard Overview Metrics
export const getDashboardStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({});
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const activeFacilities = await Facility.countDocuments({ is_active: true });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const revResult = await Payment.aggregate([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revResult.length > 0 ? revResult[0].total : 0;

    const recentBookingsRaw = await Booking.find({})
      .populate('user_id', 'name email')
      .populate('facility_id', 'name')
      .populate('court_id', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBookings = recentBookingsRaw.map((b) => ({
      ...b.toObject(),
      id: b._id,
      _id: b._id,
      user_id: b.user_id ? { name: b.user_id.name, email: b.user_id.email } : { name: 'Walk-in Guest', email: '' },
      facility_id: b.facility_id ? { name: b.facility_id.name } : null,
      court_id: b.court_id ? { name: b.court_id.name } : null,
    }));

    return res.json({
      success: true,
      stats: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        completedBookings,
        activeFacilities,
        totalFacilities: activeFacilities,
        totalCustomers,
        totalRevenue,
      },
      recentBookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Full Analytics Report Data
export const getReportData = async (req, res) => {
  try {
    const bookingsRaw = await Booking.find({})
      .populate('user_id', 'name email')
      .populate('facility_id', 'name')
      .populate('court_id', 'name')
      .sort({ createdAt: -1 });

    const revResult = await Payment.aggregate([
      { $match: { payment_status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revResult.length > 0 ? revResult[0].total : 0;

    const statusCounts = {
      pending: 0,
      approved: 0,
      checked_in: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
    };

    bookingsRaw.forEach((b) => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++;
      }
    });

    const bookings = bookingsRaw.map((b) => ({
      ...b.toObject(),
      id: b._id,
      _id: b._id,
      user_id: b.user_id ? { name: b.user_id.name, email: b.user_id.email } : { name: 'Walk-in Guest', email: '' },
      facility_id: b.facility_id ? { name: b.facility_id.name } : null,
      court_id: b.court_id ? { name: b.court_id.name } : null,
    }));

    return res.json({
      success: true,
      totalRevenue,
      totalBookings: bookings.length,
      statusCounts,
      bookings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Export CSV Report
export const exportReportCsv = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('user_id', 'name email')
      .populate('facility_id', 'name')
      .populate('court_id', 'name')
      .sort({ createdAt: -1 });

    let csvContent = 'Booking Code,Customer,Email,Facility,Court,Date,Start Time,End Time,Total Amount,Status\n';

    bookings.forEach((b) => {
      const code = b.booking_code || '';
      const customer = b.user_id?.name ? `"${b.user_id.name}"` : 'Guest';
      const email = b.user_id?.email || '';
      const facility = b.facility_id?.name ? `"${b.facility_id.name}"` : '';
      const court = b.court_id?.name ? `"${b.court_id.name}"` : '';
      const date = b.booking_date || '';
      const start = b.start_time || '';
      const end = b.end_time || '';
      const amount = b.total_amount || 0;
      const status = b.status || '';

      csvContent += `${code},${customer},${email},${facility},${court},${date},${start},${end},${amount},${status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=house_of_as_report.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get Database Storage Statistics (Admin Only)
export const getDatabaseStorageStats = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not initialized' });
    }

    let stats = {};
    try {
      stats = await db.stats();
    } catch (err) {
      console.warn('Failed to retrieve db.stats(), attempting command fallback:', err.message);
      stats = await db.command({ dbStats: 1 });
    }

    // Default max storage limit in MB (MongoDB Atlas M0 free tier = 512 MB)
    const maxStorageMB = parseFloat(process.env.MAX_DB_STORAGE_MB) || 512;
    const maxStorageBytes = maxStorageMB * 1024 * 1024;

    const dataSizeBytes = stats.dataSize || 0;
    const storageSizeBytes = stats.storageSize || 0;
    const indexSizeBytes = stats.indexSize || 0;
    const totalSizeBytes = stats.totalSize || (storageSizeBytes + indexSizeBytes);

    const availableSizeBytes = Math.max(0, maxStorageBytes - totalSizeBytes);
    const usedPercentage = Math.min(100, (totalSizeBytes / maxStorageBytes) * 100);

    // Fetch collection document counts & collection stats
    let collectionsList = [];
    try {
      collectionsList = await db.listCollections().toArray();
    } catch (colErr) {
      console.warn('Error listing collections:', colErr.message);
    }

    const collections = [];
    for (const col of collectionsList) {
      // Ignore system collections
      if (col.name.startsWith('system.')) continue;

      let count = 0;
      let colSize = 0;
      let colStorage = 0;
      let colIndex = 0;

      try {
        const colStats = await db.command({ collStats: col.name });
        count = colStats.count || 0;
        colSize = colStats.size || 0;
        colStorage = colStats.storageSize || 0;
        colIndex = colStats.totalIndexSize || 0;
      } catch (err) {
        try {
          count = await db.collection(col.name).countDocuments();
        } catch (cntErr) {
          count = 0;
        }
      }

      collections.push({
        name: col.name,
        count,
        sizeBytes: colSize,
        storageSizeBytes: colStorage,
        indexSizeBytes: colIndex,
        totalSizeBytes: colStorage + colIndex || colSize,
      });
    }

    collections.sort((a, b) => b.totalSizeBytes - a.totalSizeBytes);

    return res.json({
      success: true,
      dbName: db.databaseName || 'house_of_as_db',
      stats: {
        maxStorageMB,
        maxStorageBytes,
        dataSizeBytes,
        storageSizeBytes,
        indexSizeBytes,
        totalSizeBytes,
        availableSizeBytes,
        availableStorageMB: (availableSizeBytes / (1024 * 1024)).toFixed(2),
        totalUsedMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
        dataSizeMB: (dataSizeBytes / (1024 * 1024)).toFixed(2),
        indexSizeMB: (indexSizeBytes / (1024 * 1024)).toFixed(2),
        storageSizeMB: (storageSizeBytes / (1024 * 1024)).toFixed(2),
        usedPercentage: Number(usedPercentage.toFixed(2)),
        objectsCount: stats.objects || 0,
        collectionsCount: stats.collections || collections.length,
      },
      collections,
    });
  } catch (error) {
    console.error('Error fetching database storage stats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

