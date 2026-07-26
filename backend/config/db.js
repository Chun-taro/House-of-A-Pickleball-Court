import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize database schema tables
export const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT CHECK(role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT DEFAULT NULL,
      verification_expires_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      location TEXT DEFAULT 'Linabo, Malaybalay City',
      hourly_rate REAL NOT NULL,
      image_url TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      open_time TEXT DEFAULT '05:00',
      close_time TEXT DEFAULT '23:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facility_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      court_type TEXT DEFAULT 'Pickleball',
      capacity INTEGER DEFAULT 4,
      hourly_rate_override REAL DEFAULT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS operating_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facility_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      open_time TEXT DEFAULT '05:00',
      close_time TEXT DEFAULT '23:00',
      is_closed INTEGER DEFAULT 0,
      FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      facility_id INTEGER DEFAULT NULL,
      name TEXT NOT NULL,
      holiday_date TEXT NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_code TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      facility_id INTEGER NOT NULL,
      court_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_hours REAL NOT NULL,
      hourly_rate REAL NOT NULL,
      subtotal REAL NOT NULL,
      tax_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'checked_in', 'completed', 'cancelled', 'rejected')) DEFAULT 'pending',
      notes TEXT DEFAULT '',
      cancellation_reason TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (facility_id) REFERENCES facilities(id),
      FOREIGN KEY (court_id) REFERENCES courts(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT CHECK(payment_status IN ('unpaid', 'paid', 'failed', 'refunded')) DEFAULT 'unpaid',
      reference_number TEXT DEFAULT NULL,
      paid_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Ensure new columns exist for existing databases
  try { db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 1"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN verification_code TEXT DEFAULT NULL"); } catch (e) {}
  try { db.exec("ALTER TABLE users ADD COLUMN verification_expires_at DATETIME DEFAULT NULL"); } catch (e) {}

  console.log('SQLite Database Initialized (node:sqlite):', dbPath);
};

export default db;
