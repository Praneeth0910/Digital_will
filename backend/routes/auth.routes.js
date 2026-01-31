import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Request Body:
 * {
 *   "name": "string",
 *   "email": "string", 
 *   "masterPassword": "string"
 * }
 */
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('masterPassword')
    .isLength({ min: 8 })
    .withMessage('Master password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number')
], async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('═══════════════════════════════════════');
    console.log('📝 REGISTRATION REQUEST');
    console.log('Time:', new Date().toISOString());
    console.log('IP:', req.ip || req.connection.remoteAddress);
    console.log('Body:', { email: req.body.email, name: req.body.name, passwordLength: req.body.masterPassword?.length });
    console.log('═══════════════════════════════════════');

    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { email, name, masterPassword } = req.body;

    // Check if user already exists
    console.log('🔍 Checking if user exists:', email);
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password with bcrypt (12 rounds = high security)
    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(masterPassword, 12);
    console.log('✓ Password hashed successfully');

    // Create new user
    console.log('💾 Creating user in database...');
    const user = new User({
      email,
      fullName: name,
      password_hash: passwordHash,
      continuity_triggered: false
    });

    await user.save();
    console.log('✓ User created successfully:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        type: 'user'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    console.log('✓ JWT token generated');
    console.log(`✅ Registration completed in ${Date.now() - startTime}ms`);
    console.log('═══════════════════════════════════════\n');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.fullName,
          createdAt: user.created_at || user.createdAt,
          continuityTriggered: user.continuity_triggered
        }
      }
    });

  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ REGISTRATION ERROR');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════\n');

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * 
 * Request Body:
 * {
 *   "email": "string",
 *   "masterPassword": "string"
 * }
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('masterPassword')
    .notEmpty()
    .withMessage('Master password is required')
], async (req, res) => {
  const startTime = Date.now();

  try {
    console.log('═══════════════════════════════════════');
    console.log('🔐 LOGIN REQUEST');
    console.log('Time:', new Date().toISOString());
    console.log('IP:', req.ip || req.connection.remoteAddress);
    console.log('Email:', req.body.email);
    console.log('═══════════════════════════════════════');

    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { email, masterPassword } = req.body;

    // Find user
    console.log('🔍 Looking up user:', email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found:', email);
      // Generic error message to prevent email enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✓ User found:', user._id);

    // Verify password
    console.log('🔐 Verifying password...');
    const isPasswordValid = await bcrypt.compare(masterPassword, user.password_hash);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('✓ Password verified');

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        type: 'user'
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '7d' }
    );

    console.log('✓ JWT token generated');
    console.log(`✅ Login completed in ${Date.now() - startTime}ms`);
    console.log('═══════════════════════════════════════\n');

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.fullName,
          createdAt: user.created_at || user.createdAt,
          continuityTriggered: user.continuity_triggered
        }
      }
    });

  } catch (error) {
    console.error('═══════════════════════════════════════');
    console.error('❌ LOGIN ERROR');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════\n');

    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token validity
 * Protected route - requires Authorization header
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    const user = await User.findById(decoded.userId).select('-password_hash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.fullName,
          createdAt: user.created_at || user.createdAt,
          continuityTriggered: user.continuity_triggered
        }
      }
    });

  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

export default router;
