import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema(
  {
    facility_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    name: { type: String, required: true, trim: true },
    court_type: { type: String, default: 'Standard' }, // Badminton, Futsal, Basketball, Tennis, etc.
    capacity: { type: Number, default: 4 },
    hourly_rate_override: { type: Number, default: null },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Court', courtSchema);
