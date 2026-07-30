import path from 'path';
import fs from 'fs';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendPaymentReceiptEmail } from '../utils/mailer.js';

// Helper to recalculate total verified payments and update booking status
export const recalculateBookingPayments = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  const payments = await Payment.find({ booking_id: bookingId });

  // Sum of all verified/paid payments
  const totalVerifiedPaid = payments
    .filter((p) => p.verification_status === 'verified' || p.payment_status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  booking.paid_amount = totalVerifiedPaid;
  const remainingBalance = Math.max(0, booking.total_amount - totalVerifiedPaid);

  if (totalVerifiedPaid >= booking.total_amount) {
    if (['pending', 'partially_paid'].includes(booking.status)) {
      booking.status = 'approved';
    }
  } else if (totalVerifiedPaid > 0) {
    booking.status = 'partially_paid';
  } else {
    if (booking.status === 'partially_paid') {
      booking.status = 'pending';
    }
  }

  await booking.save();

  return {
    total_verified_paid: totalVerifiedPaid,
    remaining_balance: remainingBalance,
    booking_status: booking.status,
  };
};

// Get Payments List for Staff / Admin
export const getPayments = async (req, res) => {
  try {
    const { status, method } = req.query;
    const query = {};

    if (status) {
      if (status === 'partially_paid') {
        query.payment_status = { $in: ['partially_paid', 'pending_verification'] };
      } else {
        query.payment_status = status;
      }
    }
    if (method) query.payment_method = method;

    const payments = await Payment.find(query)
      .populate('user_id', 'name email phone')
      .populate({
        path: 'booking_id',
        select: 'booking_code booking_date start_time end_time total_amount paid_amount status facility_id',
        populate: { path: 'facility_id', select: 'name' },
      })
      .sort({ createdAt: -1 });

    const bookingIds = payments.map((p) => p.booking_id?._id).filter(Boolean);
    const allBookingPayments = await Payment.find({ booking_id: { $in: bookingIds } }).sort({ createdAt: 1 });
    const paymentsByBookingMap = {};
    allBookingPayments.forEach((bp) => {
      const bId = bp.booking_id.toString();
      if (!paymentsByBookingMap[bId]) paymentsByBookingMap[bId] = [];
      const proofUrl = bp.proof_of_payment_url || `/api/payments/proof/${bp._id}`;
      paymentsByBookingMap[bId].push({ ...bp.toObject(), proof_of_payment_url: proofUrl });
    });

    const mapped = payments.map((p) => {
      let proofUrl = p.proof_of_payment_url;
      if (proofUrl && proofUrl.endsWith('/undefined')) {
        proofUrl = `/api/payments/proof/${p._id}`;
        Payment.findByIdAndUpdate(p._id, { proof_of_payment_url: proofUrl }).catch((e) => console.error('Proof URL repair error:', e));
      }
      const bObj = p.booking_id;
      const totalAmount = bObj ? bObj.total_amount || 0 : 0;
      const paidAmount = bObj ? bObj.paid_amount || 0 : 0;
      const remainingBalance = Math.max(0, totalAmount - paidAmount);
      const bId = bObj ? bObj._id.toString() : null;

      return {
        ...p.toObject(),
        id: p._id,
        _id: p._id,
        proof_of_payment_url: proofUrl,
        all_payments: bId ? (paymentsByBookingMap[bId] || []) : [],
        user_id: p.user_id ? { _id: p.user_id._id, name: p.user_id.name, email: p.user_id.email, phone: p.user_id.phone } : null,
        booking_id: bObj
          ? {
              _id: bObj._id,
              booking_code: bObj.booking_code,
              booking_date: bObj.booking_date,
              start_time: bObj.start_time,
              end_time: bObj.end_time,
              total_amount: totalAmount,
              paid_amount: paidAmount,
              remaining_balance: remainingBalance,
              status: bObj.status,
              facility_id: bObj.facility_id ? { name: bObj.facility_id.name } : null,
            }
          : null,
      };
    });

    return res.json({ success: true, payments: mapped });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Update Payment Status (Admin / Staff Verification)
export const updatePaymentStatus = async (req, res) => {
  try {
    const { payment_status, action } = req.body;
    const allowed = ['unpaid', 'pending_verification', 'partially_paid', 'paid', 'failed', 'refunded'];

    const targetStatus = action === 'verify' ? 'paid' : action === 'reject' ? 'failed' : payment_status;

    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    payment.payment_status = targetStatus;
    if (targetStatus === 'paid') {
      payment.paid_at = new Date();
      payment.proof_status = 'verified';
      payment.verification_status = 'verified';
    } else if (targetStatus === 'failed') {
      payment.proof_status = 'rejected';
      payment.verification_status = 'rejected';
    }
    await payment.save();

    let calcResult = null;
    if (payment.booking_id) {
      calcResult = await recalculateBookingPayments(payment.booking_id);
    }

    const updatedPayment = await Payment.findById(payment._id)
      .populate('user_id', 'name email')
      .populate('booking_id', 'booking_code total_amount paid_amount status');

    if (targetStatus === 'paid' && updatedPayment?.user_id?.email) {
      sendPaymentReceiptEmail({
        payment: updatedPayment.toObject(),
        booking: { booking_code: updatedPayment.booking_id?.booking_code },
        user: { name: updatedPayment.user_id.name, email: updatedPayment.user_id.email },
      }).catch((err) => console.error('Payment receipt mailer error:', err));

      if (updatedPayment.user_id._id) {
        Notification.create({
          user_id: updatedPayment.user_id._id,
          booking_id: updatedPayment.booking_id?._id,
          title: '🎉 Payment Verified & Approved!',
          message: `Your payment proof for booking ${updatedPayment.booking_id?.booking_code || ''} has been verified. Your official PDF receipt is approved and ready to download!`,
          type: 'payment_verified',
          receipt_available: true,
        }).catch((err) => console.error('Notification create error:', err));
      }
    } else if (targetStatus === 'failed' && updatedPayment?.user_id?._id) {
      Notification.create({
        user_id: updatedPayment.user_id._id,
        booking_id: updatedPayment.booking_id?._id,
        title: '⚠️ Payment Proof Verification Failed',
        message: `Your payment proof for booking ${updatedPayment.booking_id?.booking_code || ''} could not be verified. Please re-upload a valid GCash transaction screenshot.`,
        type: 'payment_rejected',
        receipt_available: false,
      }).catch((err) => console.error('Notification create error:', err));
    }

    return res.json({
      success: true,
      message: `Payment transaction ${targetStatus === 'paid' ? 'verified & approved' : 'updated to ' + targetStatus}`,
      payment: updatedPayment,
      booking_summary: calcResult,
    });
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

        // Notify Admin & Staff of payment proof submission
        Notification.create({
          user_id: req.user._id,
          booking_id: booking._id,
          title: `💳 Payment Proof Submitted: ${booking.booking_code}`,
          message: `Customer ${req.user.name || 'User'} uploaded GCash payment proof (Ref: ${payment.reference_number || 'N/A'}) for booking ${booking.booking_code}.`,
          type: 'proof_submitted',
          for_role: 'admin',
          receipt_available: true,
        }).catch((err) => console.error('Admin notification error on proof upload:', err));
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

    if (!targetId || targetId === 'undefined') {
      return res.status(404).json({ success: false, message: 'Invalid proof image identifier.' });
    }

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

    return res.status(404).json({ success: false, message: 'Proof image file not found on server.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
