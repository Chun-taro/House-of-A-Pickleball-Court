import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Start standalone server if not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      // Proof cleanup scheduler disabled per admin requirement (permanent image retention)
      app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('MongoDB Startup Error:', err.message);
    });
}

// 1. CORS Middleware (Must be FIRST to handle CORS preflight & error responses)
app.use(cors());

// 2. Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check Endpoint (Returns 200 OK immediately without waiting for DB)
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ success: true, message: "House of A's Express MongoDB Atlas API Server is Running!" });
});

// 4. Ensure DB connection for API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB Middleware Error:', err);
    return res.status(500).json({
      success: false,
      message: `Database Connection Error: ${err.message}`,
      details: 'Check MongoDB Atlas IP Whitelist (allow 0.0.0.0/0 on Atlas) or process.env.MONGO_URI.',
    });
  }
});

// 5. API Routes (Support both /api/ prefix and bare route paths)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/facilities', '/facilities'], facilityRoutes);
app.use(['/api/bookings', '/bookings'], bookingRoutes);
app.use(['/api/schedules', '/schedules'], scheduleRoutes);
app.use(['/api/payments', '/payments'], paymentRoutes);
app.use(['/api/reports', '/reports'], reportRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);

// 6. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Global Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

export default app;
