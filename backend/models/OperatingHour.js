import mongoose from 'mongoose';

const operatingHourSchema = new mongoose.Schema(
  {
    facility_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    day_of_week: { type: Number, required: true, min: 0, max: 6 }, // 0 (Sunday) to 6 (Saturday)
    open_time: { type: String, required: true, default: '08:00' },
    close_time: { type: String, required: true, default: '22:00' },
    is_closed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.OperatingHour || mongoose.model('OperatingHour', operatingHourSchema);
