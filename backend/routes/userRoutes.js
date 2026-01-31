import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Nominee from '../models/Nominee.js';
import { authenticateUser, generateUserToken } from '../middleware/auth.js';
import { generateSecureBeneficiaryId, isValidBenIdFormat } from '../utils/benIdGenerator.js';

const router = express.Router();

/**
 * POST /api/user/register
 * Register a new user account
 */
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('fullName').trim().notEmpty(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, fullName, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      email,
      fullName,
      password_hash,
      continuity_triggered: false
    });

    await user.save();

    console.log('✓ User registered:', email);

    const token = generateUserToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

/**
 * POST /api/user/login
 * User login
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateUserToken(user._id);

    console.log('✓ User logged in:', email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        email: user.email,
        fullName: user.fullName,
        continuityTriggered: user.continuity_triggered,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/user/add-nominee
 * Create a nominee with system-generated BEN-ID
 * 
 * SECURITY:
 * - Nominee status starts as INACTIVE
 * - Nominee CANNOT login until status is ACTIVE
 * - BEN-ID alone does NOT grant access
 */
router.post('/add-nominee', authenticateUser, [
  body('nominee_email').isEmail().normalizeEmail(),
  body('nominee_name').trim().notEmpty(),
  body('relation').isIn(['Family', 'Legal Representative', 'Friend', 'Other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nominee_email, nominee_name, relation } = req.body;
    const userId = req.userId;

    // Check nominee limit (max 2 nominees per user)
    const existingNominees = await Nominee.find({ user_id: userId });
    if (existingNominees.length >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Maximum of 2 nominees allowed per account.'
      });
    }

    // Check for duplicate nominee email
    const duplicateNominee = await Nominee.findOne({
      user_id: userId,
      nominee_email
    });

    if (duplicateNominee) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered as a nominee for your account.'
      });
    }

    // Generate unique BEN-ID
    const beneficiary_reference_id = await generateSecureBeneficiaryId();

    // Create nominee
    const nominee = new Nominee({
      user_id: userId,
      nominee_email,
      nominee_name,
      relation,
      beneficiary_reference_id,
      status: 'INACTIVE' // CRITICAL: Starts as INACTIVE
    });

    await nominee.save();

    console.log('=== NOMINEE CREATED ===');
    console.log('User ID:', userId);
    console.log('Nominee Name:', nominee_name);
    console.log('Nominee Email:', nominee_email);
    console.log('BEN-ID:', beneficiary_reference_id);
    console.log('Status:', 'INACTIVE');
    console.log('⚠ Nominee CANNOT login until status is ACTIVE');
    console.log('=======================');

    res.status(201).json({
      success: true,
      message: 'Nominee added successfully',
      data: {
        nomineeId: nominee._id,
        nominee_name,
        nominee_email,
        beneficiary_reference_id,
        relation,
        status: nominee.status,
        created_at: nominee.created_at
      }
    });
  } catch (error) {
    console.error('Add nominee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add nominee. Please try again.'
    });
  }
});

/**
 * GET /api/user/nominees
 * Get all nominees for authenticated user
 */
router.get('/nominees', authenticateUser, async (req, res) => {
  try {
    const nominees = await Nominee.find({ user_id: req.userId });

    res.json({
      success: true,
      data: nominees.map(n => ({
        nomineeId: n._id,
        nominee_name: n.nominee_name,
        nominee_email: n.nominee_email,
        beneficiary_reference_id: n.beneficiary_reference_id,
        relation: n.relation,
        status: n.status,
        verified_at: n.verified_at,
        created_at: n.created_at
      }))
    });
  } catch (error) {
    console.error('Get nominees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nominees.'
    });
  }
});

/**
 * POST /api/user/trigger-continuity
 * Trigger continuity access (simulates death trigger)
 */
router.post('/trigger-continuity', authenticateUser, async (req, res) => {
  try {
    const user = req.user;

    if (user.continuity_triggered) {
      return res.status(400).json({
        success: false,
        message: 'Continuity access has already been triggered.'
      });
    }

    await user.triggerContinuity();

    console.log('=== CONTINUITY ACCESS TRIGGERED ===');
    console.log('User:', user.email);
    console.log('Date:', new Date());
    console.log('⚠ Nominees still need death verification to access');
    console.log('===================================');

    res.json({
      success: true,
      message: 'Continuity access triggered successfully',
      data: {
        continuity_triggered: true,
        date_of_death_verified_at: user.date_of_death_verified_at
      }
    });
  } catch (error) {
    console.error('Trigger continuity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger continuity access.'
    });
  }
});

export default router;
