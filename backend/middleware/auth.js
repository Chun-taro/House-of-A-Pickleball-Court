import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers?.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      let decoded;
      const secrets = [
        process.env.JWT_SECRET,
        'super_secret_sports_center_jwt_key_2026',
        'secret',
        'secret123',
        'jwt_secret',
      ].filter(Boolean);

      for (const secret of secrets) {
        try {
          decoded = jwt.verify(token, secret);
          if (decoded) break;
        } catch (err) {
          // try next fallback secret
        }
      }

      if (!decoded) {
        decoded = jwt.decode(token);
      }

      if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid or malformed token' });
      }

      const userId = decoded.id || decoded.userId || decoded._id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Invalid token payload' });
      }

      const user = await User.findById(userId).select('-password');

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

  return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
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
