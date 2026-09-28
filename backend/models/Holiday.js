import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    facility_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null }, // Null means applies to all facilities
    name: { type: String, required: true, trim: true },
    holiday_date: { type: String, required: true }, // YYYY-MM-DD
    end_date: { type: String, default: null }, // Optional YYYY-MM-DD for multi-day blackouts
    description: { type: String, default: '', trim: true },
    is_recurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);
