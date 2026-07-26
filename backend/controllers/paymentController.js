import db from '../config/db.js';
import { sendPaymentReceiptEmail } from '../utils/mailer.js';

// Get Payments List for Staff / Admin
export const getPayments = (req, res) => {
  try {
    const { status, method } = req.query;

    let sql = `
      SELECT p.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
             b.booking_code, b.booking_date, b.start_time, b.end_time, b.status as booking_status,
             f.name as facility_name
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN facilities f ON b.facility_id = f.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND p.payment_status = ?';
      params.push(status);
    }
    if (method) {
      sql += ' AND p.payment_method = ?';
      params.push(method);
    }

    sql += ' ORDER BY p.id DESC';

    const payments = db.prepare(sql).all(...params);

    const mapped = payments.map((p) => ({
      ...p,
      _id: p.id,
      user_id: { _id: p.user_id, name: p.user_name, email: p.user_email, phone: p.user_phone },
      booking_id: {
        _id: p.booking_id,
        booking_code: p.booking_code,
        booking_date: p.booking_date,
        start_time: p.start_time,
        end_time: p.end_time,
        status: p.booking_status,
        facility_id: { name: p.facility_name }
      }
    }));

    return res.json({ success: true, payments: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Payment Status (Admin / Staff)
export const updatePaymentStatus = (req, res) => {
  try {
    const { payment_status } = req.body;
    const allowed = ['unpaid', 'paid', 'failed', 'refunded'];

    if (!allowed.includes(payment_status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const paidAt = payment_status === 'paid' ? new Date().toISOString() : null;

    db.prepare('UPDATE payments SET payment_status = ?, paid_at = COALESCE(paid_at, ?) WHERE id = ?').run(payment_status, paidAt, req.params.id);

    if (payment_status === 'paid') {
      const payment = db.prepare(`
        SELECT p.*, u.name as user_name, u.email as user_email, b.booking_code
        FROM payments p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN bookings b ON p.booking_id = b.id
        WHERE p.id = ?
      `).get(req.params.id);

      if (payment && payment.user_email) {
        sendPaymentReceiptEmail({
          payment,
          booking: { booking_code: payment.booking_code },
          user: { name: payment.user_name, email: payment.user_email }
        }).catch((err) => console.error('Payment receipt mailer error:', err));
      }
    }

    return res.json({ success: true, message: `Payment status updated to ${payment_status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
