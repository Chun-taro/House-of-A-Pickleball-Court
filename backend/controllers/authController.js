import jwt from 'jsonwebtoken';
import User from '../models/User.js';
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
    const existing = await User.findOne({ email: lowerEmail });

    if (existing && existing.is_verified) {
      return res.status(400).json({ success: false, message: 'Email address is already registered and verified.' });
    }

    // Generate 6-digit random verification code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    let user;
    if (existing && !existing.is_verified) {
      existing.name = name;
      existing.password = password;
      existing.phone = phone || '';
      existing.verification_code = otpCode;
      existing.verification_expires_at = expiresAt;
      user = await existing.save();
    } else {
      user = await User.create({
        name,
        email: lowerEmail,
        password,
        phone: phone || '',
        role: 'customer',
        is_verified: false,
        verification_code: otpCode,
        verification_expires_at: expiresAt,
      });
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
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (user.is_verified) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        message: 'Account is already verified.',
        token,
        user: { id: user._id, _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
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
    user.is_verified = true;
    user.verification_code = null;
    user.verification_expires_at = null;
    await user.save();

    const token = generateToken(user._id);

    // Send Welcome Email asynchronously
    sendWelcomeEmail({ id: user._id, name: user.name, email: user.email })
      .catch((err) => console.error('Welcome Mailer error:', err));

    return res.json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: {
        id: user._id,
        _id: user._id,
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
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Account is already verified.' });
    }

    // Generate new OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.verification_code = otpCode;
    user.verification_expires_at = expiresAt;
    await user.save();

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

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.comparePassword(password))) {
      // Check if user is verified
      if (!user.is_verified) {
        // Send a fresh OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        user.verification_code = otpCode;
        user.verification_expires_at = expiresAt;
        await user.save();

        sendVerificationCodeEmail({ name: user.name, email: user.email, code: otpCode }).catch(err => console.error(err));

        return res.status(403).json({
          success: false,
          requiresVerification: true,
          email: user.email,
          message: 'Account not verified. A 6-digit verification code has been sent to your email.',
        });
      }

      const token = generateToken(user._id);
      return res.json({
        success: true,
        message: 'Logged in successfully.',
        token,
        user: {
          id: user._id,
          _id: user._id,
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

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (password) user.password = password;

    await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        _id: user._id,
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
