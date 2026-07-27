import path from 'path';
import fs from 'fs';
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
      updateFields.proof_status = 'verified';
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, updateFields, { new: true })
      .populate('user_id', 'name email')
      .populate('booking_id', 'booking_code status');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Also update booking status if payment is verified paid
    if (payment_status === 'paid' && payment.booking_id) {
      await Booking.findByIdAndUpdate(payment.booking_id._id, { status: 'approved' });
    }

    if (payment_status === 'paid' && payment.user_id?.email) {
      await sendPaymentReceiptEmail({
        payment: payment.toObject(),
        booking: { booking_code: payment.booking_id?.booking_code },
        user: { name: payment.user_id.name, email: payment.user_id.email },
      }).catch((err) => console.error('Payment receipt mailer error:', err));
    }

    return res.json({ success: true, message: `Payment status updated to ${payment_status}`, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Upload or re-upload GCash Proof of Payment
export const uploadProofImage = async (req, res) => {
  try {
    const paymentId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a proof of payment image file.' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Ownership or Admin check
    if (payment.user_id.toString() !== req.user._id.toString() && !['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized to upload proof for this payment.' });
    }

    // If an existing file exists, delete old file to conserve storage
    if (payment.proof_filename) {
      const oldPath = path.join(process.cwd(), 'uploads', 'proofs', payment.proof_filename);
      if (fs.existsSync(oldPath)) {
        await fs.promises.unlink(oldPath).catch((err) => console.error('Old proof delete error:', err));
      }
    }

    const uploadedAt = new Date();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours (3 days)

    // Store image directly in Base64 string in MongoDB Atlas database
    let base64Image = null;
    if (req.file && req.file.buffer) {
      base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const filename = `proof_${uniqueSuffix}`;

    payment.proof_image_base64 = base64Image;
    payment.proof_filename = filename;
    payment.proof_of_payment_url = `/api/payments/proof/${payment._id}`;
    payment.proof_uploaded_at = uploadedAt;
    payment.proof_expires_at = expiresAt;
    payment.proof_status = 'verified';
    payment.payment_status = 'paid';
    payment.paid_at = uploadedAt;

    if (req.body.reference_number) {
      payment.reference_number = req.body.reference_number;
    }

    await payment.save();

    // Automatically update booking status to approved upon receiving payment proof
    if (payment.booking_id) {
      const booking = await Booking.findById(payment.booking_id)
        .populate('user_id', 'name email phone')
        .populate('facility_id', 'name location')
        .populate('court_id', 'name court_type');

      if (booking) {
        if (booking.status === 'pending') {
          booking.status = 'approved';
          await booking.save();
        }

        // Send payment receipt email to customer
        if (booking.user_id && booking.user_id.email) {
          sendPaymentReceiptEmail({
            booking: booking.toObject(),
            payment: payment.toObject(),
            user: booking.user_id.toObject(),
            court: booking.court_id ? booking.court_id.toObject() : null,
            facility: booking.facility_id ? booking.facility_id.toObject() : null,
          }).catch((err) => console.error('Payment receipt email error on proof upload:', err));
        }
      }
    }

    return res.json({
      success: true,
      message: 'Proof of payment uploaded and saved directly to MongoDB Atlas! Reservation is Approved.',
      proof_url: payment.proof_of_payment_url,
      proof_expires_at: expiresAt,
      payment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Serve Proof Image (Directly from MongoDB Atlas Base64 or disk fallback)
export const serveProofImage = async (req, res) => {
  try {
    const targetId = req.params.filename;

    // 1. Query Payment by Mongo ObjectId or proof_filename
    let payment = await Payment.findById(targetId).catch(() => null);
    if (!payment) {
      payment = await Payment.findOne({ proof_filename: targetId });
    }

    // 2. Serve Base64 image directly from MongoDB Atlas if present
    if (payment && payment.proof_image_base64) {
      const matches = payment.proof_image_base64.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const imageBuffer = Buffer.from(matches[2], 'base64');
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': imageBuffer.length,
          'Cache-Control': 'public, max-age=86400',
        });
        return res.end(imageBuffer);
      }
    }

    // 3. Disk fallback for local development files
    const tmpPath = path.join('/tmp', 'uploads', 'proofs', targetId);
    const cwdPath = path.join(process.cwd(), 'uploads', 'proofs', targetId);

    if (fs.existsSync(tmpPath)) return res.sendFile(tmpPath);
    if (fs.existsSync(cwdPath)) return res.sendFile(cwdPath);

    return res.status(404).json({ success: false, message: 'Proof image file has been purged or retention period expired.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
