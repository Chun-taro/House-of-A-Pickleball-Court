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

const app = express();

// 1. CORS Middleware (Must be FIRST to handle CORS preflight & error responses)
app.use(cors());

// 2. Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Health Check Endpoint (No DB connection required)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: "House of A's Express MongoDB Atlas API Server is Running!" });
});

// 4. Ensure DB connection for API routes
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB Middleware Error:', err.message);
    res.status(500).json({ success: false, message: `Database Connection Error: ${err.message}` });
  }
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// 6. 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('Express Global Error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Start standalone server if not on Vercel
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
