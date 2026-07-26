import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { sendWelcomeEmail, sendVerificationCodeEmail } from '../utils/mailer.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_sports_center_jwt_key_2026', {
    expiresIn: '30d',
  });
};

// 1. Register User (Generates 6-Digit Verification Code)
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (name, email, password).' });
    }

    const lowerEmail = email.toLowerCase();
    const existing = db.prepare('SELECT id, is_verified FROM users WHERE email = ?').get(lowerEmail);

    if (existing && existing.is_verified) {
      return res.status(400).json({ success: false, message: 'Email address is already registered and verified.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit random verification code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    let userId;
    if (existing && !existing.is_verified) {
      // Update existing unverified account with new credentials and code
      db.prepare(`
        UPDATE users SET name = ?, password = ?, phone = ?, verification_code = ?, verification_expires_at = ?
        WHERE id = ?
      `).run(name, hashedPassword, phone || '', otpCode, expiresAt, existing.id);
      userId = existing.id;
    } else {
      // Create new user account
      const info = db.prepare(`
        INSERT INTO users (name, email, password, phone, role, is_verified, verification_code, verification_expires_at)
        VALUES (?, ?, ?, ?, 'customer', 0, ?, ?)
      `).run(name, lowerEmail, hashedPassword, phone || '', otpCode, expiresAt);
      userId = Number(info.lastInsertRowid);
    }

    // Send 6-digit verification code email
    sendVerificationCodeEmail({ name, email: lowerEmail, code: otpCode })
      .catch((err) => console.error('Verification Mailer error:', err));

    return res.status(201).json({
      success: true,
      requiresVerification: true,
      email: lowerEmail,
      message: 'Account created! Please enter the 6-digit verification code sent to your email.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Verify OTP Code
export const verifyOTP = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and 6-digit verification code are required.' });
    }

    const lowerEmail = email.toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(lowerEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (user.is_verified) {
      const token = generateToken(user.id);
      return res.json({
        success: true,
        message: 'Account is already verified.',
        token,
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      });
    }

    // Check code match
    if (user.verification_code !== code.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check your email.' });
    }

    // Check code expiry
    if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
    }

    // Mark user as verified
    db.prepare(`
      UPDATE users SET is_verified = 1, verification_code = NULL, verification_expires_at = NULL WHERE id = ?
    `).run(user.id);

    const token = generateToken(user.id);

    // Send Welcome Email asynchronously
    sendWelcomeEmail({ id: user.id, name: user.name, email: user.email })
      .catch((err) => console.error('Welcome Mailer error:', err));

    return res.json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Resend OTP Code
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const lowerEmail = email.toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(lowerEmail);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Account is already verified.' });
    }

    // Generate new OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.prepare(`
      UPDATE users SET verification_code = ?, verification_expires_at = ? WHERE id = ?
    `).run(otpCode, expiresAt, user.id);

    // Send new verification email
    sendVerificationCodeEmail({ name: user.name, email: lowerEmail, code: otpCode })
      .catch((err) => console.error('Resend Mailer error:', err));

    return res.json({
      success: true,
      message: 'A new 6-digit verification code has been sent to your email address.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4. User Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    if (user && (await bcrypt.compare(password, user.password))) {
      // Check if user is verified
      if (user.is_verified === 0) {
        // Send a fresh OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET verification_code = ?, verification_expires_at = ? WHERE id = ?').run(otpCode, expiresAt, user.id);
        
        sendVerificationCodeEmail({ name: user.name, email: user.email, code: otpCode }).catch(err => console.error(err));

        return res.status(403).json({
          success: false,
          requiresVerification: true,
          email: user.email,
          message: 'Account not verified. A 6-digit verification code has been sent to your email.',
        });
      }

      const token = generateToken(user.id);
      return res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, phone, role, is_verified FROM users WHERE id = ?').get(req.user.id);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    let sql = 'UPDATE users SET name = ?, phone = ?';
    const params = [name || req.user.name, phone !== undefined ? phone : req.user.phone];

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      sql += ', password = ?';
      params.push(hashedPassword);
    }

    sql += ' WHERE id = ?';
    params.push(req.user.id);

    db.prepare(sql).run(...params);

    const updatedUser = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(req.user.id);

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
