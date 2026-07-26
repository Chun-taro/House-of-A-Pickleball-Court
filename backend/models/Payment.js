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
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    reference_number: { type: String, default: null },
    paid_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
