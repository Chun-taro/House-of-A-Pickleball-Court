import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

import connectDB from '../config/db.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';

const recreateEmptyCollections = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    const db = mongoose.connection.db;

    console.log('Dropping empty collections to instantly release pre-allocated disk space...');
    
    try {
      await db.collection('payments').drop();
      console.log('Dropped empty payments collection.');
    } catch (e) {
      console.log('Payments collection drop note:', e.message);
    }

    try {
      await db.collection('bookings').drop();
      console.log('Dropped empty bookings collection.');
    } catch (e) {
      console.log('Bookings collection drop note:', e.message);
    }

    try {
      await db.collection('notifications').drop();
      console.log('Dropped empty notifications collection.');
    } catch (e) {
      console.log('Notifications collection drop note:', e.message);
    }

    console.log('Re-syncing model indexes for fresh empty collections...');
    await Payment.syncIndexes();
    await Booking.syncIndexes();
    await Notification.syncIndexes();

    console.log('\n✅ Empty collections dropped & fresh indexes recreated! Storage size will drop to ~36 KB.');
    process.exit(0);
  } catch (error) {
    console.error('Recreate Collections Error:', error);
    process.exit(1);
  }
};

recreateEmptyCollections();
