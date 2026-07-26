import db from '../config/db.js';

// Get Admin Dashboard Overview Metrics
export const getDashboardStats = (req, res) => {
  try {
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const pendingBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'").get().count;
    const approvedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'approved'").get().count;
    const completedBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'completed'").get().count;
    const activeFacilities = db.prepare('SELECT COUNT(*) as count FROM facilities WHERE is_active = 1').get().count;
    const totalCustomers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;

    const revRow = db.prepare("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'paid'").get();
    const totalRevenue = revRow?.total || 0;

    const recentBookingsRaw = db.prepare(`
      SELECT b.*, u.name as user_name, u.email as user_email,
             f.name as facility_name, c.name as court_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN courts c ON b.court_id = c.id
      ORDER BY b.id DESC LIMIT 5
    `).all();

    const recentBookings = recentBookingsRaw.map((b) => ({
      ...b,
      _id: b.id,
      user_id: { name: b.user_name, email: b.user_email },
      facility_id: { name: b.facility_name },
      court_id: { name: b.court_name },
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
export const getReportData = (req, res) => {
  try {
    const bookingsRaw = db.prepare(`
      SELECT b.*, u.name as user_name, u.email as user_email,
             f.name as facility_name, c.name as court_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN courts c ON b.court_id = c.id
      ORDER BY b.id DESC
    `).all();

    const revRow = db.prepare("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'paid'").get();
    const totalRevenue = revRow?.total || 0;

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
      ...b,
      _id: b.id,
      user_id: { name: b.user_name, email: b.user_email },
      facility_id: { name: b.facility_name },
      court_id: { name: b.court_name },
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
export const exportReportCsv = (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT b.*, u.name as user_name, u.email as user_email,
             f.name as facility_name, c.name as court_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN facilities f ON b.facility_id = f.id
      LEFT JOIN courts c ON b.court_id = c.id
      ORDER BY b.id DESC
    `).all();

    let csvContent = 'Booking Code,Customer,Email,Facility,Court,Date,Start Time,End Time,Total Amount,Status\n';

    bookings.forEach((b) => {
      const code = b.booking_code || '';
      const customer = b.user_name ? `"${b.user_name}"` : 'Guest';
      const email = b.user_email || '';
      const facility = b.facility_name ? `"${b.facility_name}"` : '';
      const court = b.court_name ? `"${b.court_name}"` : '';
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
