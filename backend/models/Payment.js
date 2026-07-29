import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    payment_method: {
      type: String,
      enum: ['cash', 'gcash', 'maya', 'credit_card', 'bank_transfer'],
      required: true,
    },
    payment_status: {
      type: String,
      enum: ['unpaid', 'pending_verification', 'partially_paid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    transaction_type: {
      type: String,
      enum: ['full', 'partial_initial', 'partial_balance'],
      default: 'full',
    },
    verification_status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    reference_number: { type: String, default: null },
    paid_at: { type: Date, default: null },
    proof_of_payment_url: { type: String, default: null },
    proof_image_base64: { type: String, default: null },
    proof_filename: { type: String, default: null },
    proof_uploaded_at: { type: Date, default: null },
    proof_expires_at: { type: Date, default: null },
    proof_status: {
      type: String,
      enum: ['none', 'uploaded', 'verified', 'rejected', 'expired_deleted'],
      default: 'none',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
