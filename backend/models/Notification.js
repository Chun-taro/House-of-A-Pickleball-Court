import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    booking_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['new_booking', 'proof_submitted', 'booking_approved', 'payment_verified', 'booking_rejected', 'general'],
      default: 'general',
    },
    for_role: {
      type: String,
      enum: ['customer', 'admin', 'staff', 'all_admin'],
      default: 'customer',
      index: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_by: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    receipt_available: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Notification', notificationSchema);
