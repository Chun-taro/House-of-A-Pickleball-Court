import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Facility from '../models/Facility.js';
import User from '../models/User.js';

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
