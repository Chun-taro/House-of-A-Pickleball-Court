import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

import connectDB from '../config/db.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

const resetBookingsData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('Clearing Bookings collection...');
    const bookingsRes = await Booking.deleteMany({});
    console.log(`Deleted ${bookingsRes.deletedCount} booking record(s).`);

    console.log('Clearing Payments collection...');
    const paymentsRes = await Payment.deleteMany({});
    console.log(`Deleted ${paymentsRes.deletedCount} payment record(s).`);

    console.log('Clearing Notifications collection...');
    const notifsRes = await Notification.deleteMany({});
    console.log(`Deleted ${notifsRes.deletedCount} notification record(s).`);

    // Clean uploads/proofs folder
    const proofDir = path.join(process.cwd(), 'uploads', 'proofs');
    if (fs.existsSync(proofDir)) {
      const files = fs.readdirSync(proofDir);
      let deletedFiles = 0;
      for (const file of files) {
        if (file === '.gitkeep') continue;
        const filePath = path.join(proofDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          deletedFiles++;
        }
      }
      console.log(`Deleted ${deletedFiles} uploaded proof file(s) from disk.`);
    }

    console.log('\n✅ Reset completed successfully! User accounts, facilities, and courts were preserved.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
};

resetBookingsData();
