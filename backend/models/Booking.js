import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    booking_code: { type: String, required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    facility_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    court_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true },
    booking_date: { type: String, required: true }, // YYYY-MM-DD
    start_time: { type: String, required: true }, // HH:mm:ss or HH:mm
    end_time: { type: String, required: true }, // HH:mm:ss or HH:mm
    duration_hours: { type: Number, required: true, min: 1 },
    hourly_rate: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    tax_amount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'checked_in', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    cancellation_reason: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
