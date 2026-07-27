import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    facility_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', default: null }, // Null means applies to all facilities
    name: { type: String, required: true, trim: true },
    holiday_date: { type: String, required: true }, // YYYY-MM-DD
    is_recurring: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Holiday || mongoose.model('Holiday', holidaySchema);
