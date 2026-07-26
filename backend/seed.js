import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Facility from './models/Facility.js';
import Court from './models/Court.js';
import OperatingHour from './models/OperatingHour.js';
import Holiday from './models/Holiday.js';
import Booking from './models/Booking.js';
import Payment from './models/Payment.js';

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB Atlas. Seeding database (5AM - 11PM)...');

    // Clear existing collections
    await Payment.deleteMany({});
    await Booking.deleteMany({});
    await Holiday.deleteMany({});
    await OperatingHour.deleteMany({});
    await Court.deleteMany({});
    await Facility.deleteMany({});
    await User.deleteMany({});

    console.log('Cleared existing MongoDB collections.');

    // 1. Create Default Users
    const adminUser = await User.create({
      name: "House of A's Admin",
      email: 'admin@houseofas.com',
      password: 'password123',
      phone: '+63 917 123 4567',
      role: 'admin',
      is_verified: true,
    });

    const staffUser = await User.create({
      name: 'Court Staff Manager',
      email: 'staff@houseofas.com',
      password: 'password123',
      phone: '+63 917 987 6543',
      role: 'staff',
      is_verified: true,
    });

    const customerUser = await User.create({
      name: 'Pickleball Player',
      email: 'player@gmail.com',
      password: 'password123',
      phone: '+63 918 555 0199',
      role: 'customer',
      is_verified: true,
    });

    console.log('Created Users: Admin, Staff, Customer');

    // 2. Create Single Facility: House of A's Pickleball Court
    const facility = await Facility.create({
      name: "House of A's Pickleball Court",
      description: "Family-owned single court pickleball venue in Linabo, Malaybalay City. Designed for fun matches, group training, and competitive single or doubles play.",
      location: "Purok-1, Linabo, Malaybalay City, Bukidnon",
      hourly_rate: 150.00,
      image_url: "/court.jpg",
      is_active: true,
      open_time: '05:00',
      close_time: '23:00',
    });

    console.log('Created Facility ID:', facility._id);

    // 3. Create Court
    const court = await Court.create({
      facility_id: facility._id,
      name: "House of A's Main Court",
      court_type: 'Pickleball',
      capacity: 4,
      hourly_rate_override: null,
      is_active: true,
    });

    console.log('Created Court ID:', court._id);

    // 4. Operating Hours (Sun to Sat: 5:00 AM - 11:00 PM)
    for (let day = 0; day <= 6; day++) {
      await OperatingHour.create({
        facility_id: facility._id,
        day_of_week: day,
        open_time: '05:00',
        close_time: '23:00',
        is_closed: false,
      });
    }

    // 5. Sample Booking & Payment
    const todayStr = new Date().toISOString().split('T')[0];
    const bookingCode = `HOA-${todayStr.replace(/-/g, '')}-001`;

    const booking = await Booking.create({
      booking_code: bookingCode,
      user_id: customerUser._id,
      facility_id: facility._id,
      court_id: court._id,
      booking_date: todayStr,
      start_time: '16:00',
      end_time: '18:00',
      duration_hours: 2,
      hourly_rate: 150.00,
      subtotal: 300.00,
      tax_amount: 0,
      total_amount: 300.00,
      status: 'approved',
      notes: 'Doubles match session',
    });

    await Payment.create({
      booking_id: booking._id,
      user_id: customerUser._id,
      amount: 300.00,
      payment_method: 'gcash',
      payment_status: 'paid',
      reference_number: 'PAY-GCASH-HOA889',
      paid_at: new Date(),
    });

    console.log('MongoDB Atlas Seeding Completed Successfully (5AM - 11PM)!');
    console.log('\n--- Login Credentials ---');
    console.log('Admin User:    admin@houseofas.com / password123');
    console.log('Staff User:    staff@houseofas.com / password123');
    console.log('Customer User: player@gmail.com    / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
