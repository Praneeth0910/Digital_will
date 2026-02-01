import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Nominee from '../models/Nominee.js';

/**
 * Middleware to authenticate user via JWT
 */
export const authenticateUser = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'user') {
      return res.status(403).json({
        success: false,
        message: 'Invalid token type. User authentication required.'
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Token may be invalid or expired.'
      });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

/**
 * Middleware to authenticate nominee via JWT
 */
export const authenticateNominee = (req, res, next) => {
  // 1. Get Token from Header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' });
  }

  try {
    // 2. Verify Token
    // Make sure you use the same secret key you used in the Login route!
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hackathon_secret_key_123');
    
    // 3. Attach to Request
    // We attach it to req.nominee so the route can use it
    req.nominee = decoded;
    req.nomineeId = decoded.nomineeId;
    req.userId = decoded.userId;
    req.ownerId = decoded.userId; // For compatibility with existing routes
    
    next(); // Pass control to the route
  } catch (error) {
    console.error('Nominee authentication error:', error.message);
    res.status(400).json({ success: false, message: 'Invalid Token' });
  }
};

/**
 * Generate JWT token for user
 */
export const generateUserToken = (userId) => {
  return jwt.sign(
    { userId, type: 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Generate JWT token for nominee
 * @param {string} nomineeId - The nominee's ID
 * @param {string} userId - The linked user's ID
 * @returns {string} JWT token valid for 1 hour
 */
export const generateNomineeToken = (nomineeId, userId) => {
  return jwt.sign(
    { 
      nomineeId, 
      userId,
      type: 'nominee' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};
