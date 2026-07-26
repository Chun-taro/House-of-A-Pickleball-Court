import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Cached Transporter instance for connection reuse across serverless calls
let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass || pass === 'your_16_char_app_password') {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    pool: true, // Reuse TCP connection pool for instant email delivery
    maxConnections: 5,
    maxMessages: 100,
    auth: {
      user: user,
      pass: pass,
    },
  });

  return cachedTransporter;
};

// Generic Send Email Function with Error Safety
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();

    if (!transporter) {
      console.log(`[Google Mailer Warning] Gmail credentials not configured in .env. Skipping email to: ${to}`);
      return { success: false, skipped: true, message: 'Gmail credentials not configured' };
    }

    const fromAddress = process.env.EMAIL_FROM || `"House of A's Pickleball" <${process.env.GMAIL_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: text || '',
      html,
    });

    console.log(`[Google Mailer Success] Email sent to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Google Mailer Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Email Base Wrapper Template
const getEmailWrapper = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
    .header { background: linear-gradient(135deg, #022c22 0%, #0f172a 100%); padding: 24px; text-align: center; border-bottom: 1px solid #1e293b; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; color: #34d399; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; }
    .body { padding: 28px; line-height: 1.6; }
    .footer { background-color: #090d16; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
    .badge { display: inline-block; padding: 4px 10px; background: #064e3b; color: #6ee7b7; border-radius: 6px; font-weight: 700; font-size: 12px; }
    .table-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table-details td { padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
    .table-details tr:last-child td { border-bottom: none; }
    .btn { display: inline-block; background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>House of A's</h1>
      <p>Pickleball Court • Malaybalay City</p>
    </div>
    <div class="body">
      ${contentHtml}
    </div>
    <div class="footer">
      <p><strong>House of A's Pickleball Court</strong></p>
      <p>Purok-1, Linabo, Malaybalay City, Bukidnon</p>
      <p>© ${new Date().getFullYear()} House of A's. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

// 1. Welcome Email
export const sendWelcomeEmail = async (user) => {
  if (!user || !user.email) return;

  const subject = `Welcome to House of A's Pickleball Court, ${user.name}!`;
  const content = `
    <h2 style="color: #ffffff; margin-top: 0;">Welcome aboard, ${user.name}! 🎾</h2>
    <p>Thank you for creating an account with <strong>House of A's Pickleball Court</strong> in Linabo, Malaybalay City.</p>
    <p>You can now easily check court schedules, reserve slots online, and manage your court bookings directly from our website.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/booking/wizard" class="btn">Reserve Court Slot Now</a>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">If you have any questions or special group reservation requests, feel free to contact our venue team.</p>
  `;

  return sendEmail({
    to: user.email,
    subject,
    html: getEmailWrapper('Welcome to House of A\'s', content),
  });
};

// 2. Booking Confirmation Email
export const sendBookingConfirmationEmail = async ({ booking, user, courtName, facilityName }) => {
  const recipientEmail = user?.email || booking?.user_id?.email;
  const recipientName = user?.name || booking?.user_id?.name || 'Valued Player';

  if (!recipientEmail) return;

  const code = booking.booking_code || `BOOK-${booking.id || booking._id}`;
  const date = booking.booking_date;
  const startTime = booking.start_time;
  const endTime = booking.end_time;
  const amount = Number(booking.total_amount).toFixed(2);
  const status = (booking.status || 'confirmed').toUpperCase();

  const subject = `Booking Confirmation [${code}] - House of A's Pickleball Court`;
  const content = `
    <h2 style="color: #ffffff; margin-top: 0;">Court Slot Reserved! 🎉</h2>
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>Your pickleball court reservation at <strong>House of A's</strong> has been successfully processed.</p>

    <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin: 20px 0;">
      <span class="badge">${status}</span>
      <table class="table-details">
        <tr>
          <td style="color: #94a3b8;">Booking Ref:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${code}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Venue:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${facilityName || "House of A's Pickleball Court"}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Court:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${courtName || "Main Court"}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Date:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${date}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Time Slot:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${startTime} - ${endTime}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Total Rate:</td>
          <td style="color: #34d399; font-weight: bold; text-align: right;">₱${amount}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">Please arrive 10 minutes before your schedule. See you on court!</p>
    
    <div style="text-align: center; margin-top: 24px;">
      <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/my-bookings" class="btn">View My Bookings</a>
    </div>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    html: getEmailWrapper('Booking Confirmation', content),
  });
};

// 3. Payment Receipt Email
export const sendPaymentReceiptEmail = async ({ payment, booking, user }) => {
  const recipientEmail = user?.email || payment?.user_id?.email || booking?.user_id?.email;
  const recipientName = user?.name || payment?.user_id?.name || 'Valued Player';

  if (!recipientEmail) return;

  const code = booking?.booking_code || `BOOK-${booking?.id || ''}`;
  const amount = Number(payment.amount || booking?.total_amount || 0).toFixed(2);
  const method = (payment.payment_method || 'GCash / Cash').toUpperCase();
  const refNum = payment.reference_number || 'N/A';

  const subject = `Payment Receipt [₱${amount}] - House of A's Pickleball Court`;
  const content = `
    <h2 style="color: #ffffff; margin-top: 0;">Payment Confirmation 💳</h2>
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>We have received your payment for court booking <strong>${code}</strong>.</p>

    <div style="background: #1e293b; padding: 16px; border-radius: 12px; margin: 20px 0;">
      <span class="badge" style="background: #065f46; color: #a7f3d0;">PAYMENT PAID</span>
      <table class="table-details">
        <tr>
          <td style="color: #94a3b8;">Booking Code:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${code}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Amount Paid:</td>
          <td style="color: #34d399; font-weight: bold; text-align: right;">₱${amount}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Payment Method:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${method}</td>
        </tr>
        <tr>
          <td style="color: #94a3b8;">Reference No:</td>
          <td style="color: #ffffff; font-weight: bold; text-align: right;">${refNum}</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">Thank you for playing at House of A's! Have a great match.</p>
  `;

  return sendEmail({
    to: recipientEmail,
    subject,
    html: getEmailWrapper('Payment Receipt', content),
  });
};

// 4. Account OTP Verification Code Email
export const sendVerificationCodeEmail = async ({ name, email, code }) => {
  if (!email || !code) return;

  const subject = `Your Verification Code [${code}] - House of A's Pickleball Court`;
  const content = `
    <h2 style="color: #ffffff; margin-top: 0;">Verify Your Email Address 🔑</h2>
    <p>Hello <strong>${name || 'Player'}</strong>,</p>
    <p>Thank you for signing up with <strong>House of A's Pickleball Court</strong>. Please use the 6-digit verification code below to complete your registration:</p>

    <div style="background: #1e293b; border: 2px dashed #059669; padding: 20px; border-radius: 16px; text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #34d399; font-family: monospace;">${code}</span>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;">This code will expire in <strong>15 minutes</strong>.</p>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">If you did not request this verification code, please ignore this email.</p>
  `;

  return sendEmail({
    to: email,
    subject,
    html: getEmailWrapper('Email Verification', content),
  });
};
