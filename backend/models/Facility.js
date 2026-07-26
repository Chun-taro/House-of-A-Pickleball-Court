import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String, default: 'Main Sports Complex' },
    hourly_rate: { type: Number, required: true, min: 0 },
    image_url: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
    open_time: { type: String, default: '08:00' },
    close_time: { type: String, default: '22:00' },
  },
  { timestamps: true }
);

export default mongoose.model('Facility', facilitySchema);
