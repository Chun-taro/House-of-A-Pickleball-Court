import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendPaymentReceiptEmail } from '../utils/mailer.js';

// Get Payments List for Staff / Admin
export const getPayments = async (req, res) => {
  try {
    const { status, method } = req.query;
    const query = {};

    if (status) query.payment_status = status;
    if (method) query.payment_method = method;

    const payments = await Payment.find(query)
      .populate('user_id', 'name email phone')
      .populate({
        path: 'booking_id',
        select: 'booking_code booking_date start_time end_time status facility_id',
        populate: { path: 'facility_id', select: 'name' },
      })
      .sort({ createdAt: -1 });

    const mapped = payments.map((p) => ({
      ...p.toObject(),
      id: p._id,
      _id: p._id,
      user_id: p.user_id ? { _id: p.user_id._id, name: p.user_id.name, email: p.user_id.email, phone: p.user_id.phone } : null,
      booking_id: p.booking_id
        ? {
            _id: p.booking_id._id,
            booking_code: p.booking_id.booking_code,
            booking_date: p.booking_id.booking_date,
            start_time: p.booking_id.start_time,
            end_time: p.booking_id.end_time,
            status: p.booking_id.status,
            facility_id: p.booking_id.facility_id ? { name: p.booking_id.facility_id.name } : null,
          }
        : null,
    }));

    return res.json({ success: true, payments: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Payment Status (Admin / Staff)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status } = req.body;
    const allowed = ['unpaid', 'paid', 'failed', 'refunded'];

    if (!allowed.includes(payment_status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const updateFields = { payment_status };
    if (payment_status === 'paid') {
      updateFields.paid_at = new Date();
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('user_id', 'name email')
      .populate('booking_id', 'booking_code');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment_status === 'paid' && payment.user_id?.email) {
      await sendPaymentReceiptEmail({
        payment: payment.toObject(),
        booking: { booking_code: payment.booking_id?.booking_code },
        user: { name: payment.user_id.name, email: payment.user_id.email },
      }).catch((err) => console.error('Payment receipt mailer error:', err));
    }

    return res.json({ success: true, message: `Payment status updated to ${payment_status}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
