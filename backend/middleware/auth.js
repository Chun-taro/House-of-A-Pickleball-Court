import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_sports_center_jwt_key_2026');

      const user = db.prepare('SELECT id, name, email, phone, role FROM users WHERE id = ?').get(decoded.id);

      if (!user) {
        return res.status(401).json({ success: false, message: 'User account not found.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT Auth Middleware Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role [${req.user.role}] is not authorized for this resource.`,
      });
    }

    next();
  };
};
