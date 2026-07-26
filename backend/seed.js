import bcrypt from 'bcryptjs';
import db, { initDB } from './config/db.js';

const seedData = async () => {
  try {
    initDB();
    console.log('Seeding SQLite Database for House of A\'s Pickleball Court (5AM - 11PM)...');

    // Clear existing table data
    db.exec('DELETE FROM payments;');
    db.exec('DELETE FROM bookings;');
    db.exec('DELETE FROM holidays;');
    db.exec('DELETE FROM operating_hours;');
    db.exec('DELETE FROM courts;');
    db.exec('DELETE FROM facilities;');
    db.exec('DELETE FROM users;');

    // Reset sqlite sequence counters
    db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'facilities', 'courts', 'operating_hours', 'holidays', 'bookings', 'payments');");

    console.log('Cleared existing SQLite tables.');

    // 1. Create Default Users
    const passwordHash = await bcrypt.hash('password123', 10);

    const adminStmt = db.prepare('INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)');
    const adminInfo = adminStmt.run("House of A's Admin", 'admin@houseofas.com', passwordHash, '+63 917 123 4567', 'admin');
    const staffInfo = adminStmt.run('Court Staff Manager', 'staff@houseofas.com', passwordHash, '+63 917 987 6543', 'staff');
    const customerInfo = adminStmt.run('Pickleball Player', 'player@gmail.com', passwordHash, '+63 918 555 0199', 'customer');

    const customerId = Number(customerInfo.lastInsertRowid);
    console.log("Created Users: Admin, Staff, Customer");

    // 2. Create Single Facility: House of A's Pickleball Court
    const facStmt = db.prepare(`
      INSERT INTO facilities (name, description, location, hourly_rate, image_url, is_active, open_time, close_time)
      VALUES (?, ?, ?, ?, ?, 1, '05:00', '23:00')
    `);
    const facInfo = facStmt.run(
      "House of A's Pickleball Court",
      "Family-owned single court pickleball venue in Linabo, Malaybalay City. Designed for fun matches, group training, and competitive single or doubles play.",
      "Purok-1, Linabo, Malaybalay City, Bukidnon",
      150.00,
      "/court.jpg"
    );

    const facilityId = Number(facInfo.lastInsertRowid);
    console.log("Created Facility ID:", facilityId);

    // 3. Create Court
    const courtStmt = db.prepare(`
      INSERT INTO courts (facility_id, name, court_type, capacity, hourly_rate_override, is_active)
      VALUES (?, ?, 'Pickleball', 4, NULL, 1)
    `);
    const courtInfo = courtStmt.run(facilityId, "House of A's Main Court");
    const courtId = Number(courtInfo.lastInsertRowid);

    console.log("Created Court ID:", courtId);

    // 4. Operating Hours (Sun to Sat: 5:00 AM - 11:00 PM)
    const opStmt = db.prepare(`
      INSERT INTO operating_hours (facility_id, day_of_week, open_time, close_time, is_closed)
      VALUES (?, ?, '05:00', '23:00', 0)
    `);
    for (let day = 0; day <= 6; day++) {
      opStmt.run(facilityId, day);
    }

    // 5. Sample Booking & Payment
    const todayStr = new Date().toISOString().split('T')[0];
    const bookingCode = `HOA-${todayStr.replace(/-/g, '')}-001`;

    const bookingStmt = db.prepare(`
      INSERT INTO bookings (
        booking_code, user_id, facility_id, court_id, booking_date, start_time, end_time,
        duration_hours, hourly_rate, subtotal, tax_amount, total_amount, status, notes
      ) VALUES (?, ?, ?, ?, ?, '16:00', '18:00', 2, 150.00, 300.00, 0, 300.00, 'approved', 'Doubles match session')
    `);

    const bookingInfo = bookingStmt.run(bookingCode, customerId, facilityId, courtId, todayStr);
    const bookingId = Number(bookingInfo.lastInsertRowid);

    db.prepare(`
      INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, reference_number, paid_at)
      VALUES (?, ?, 300.00, 'gcash', 'paid', 'PAY-GCASH-HOA889', ?)
    `).run(bookingId, customerId, new Date().toISOString());

    console.log('SQLite Database Seeding Completed Successfully (5AM - 11PM)!');
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
