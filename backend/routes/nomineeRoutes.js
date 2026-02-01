import express from 'express';
import { body, validationResult } from 'express-validator';
import Nominee from '../models/Nominee.js';
import User from '../models/User.js';
import DigitalAsset from '../models/DigitalAsset.js';
import LegacyNote from '../models/LegacyNote.js';
import AuditLog from '../models/AuditLog.js';
import { authenticateNominee, generateNomineeToken } from '../middleware/auth.js';
import { isValidBenIdFormat } from '../utils/benIdGenerator.js';

const router = express.Router();

// Helper function to extract device type from user agent
function getDeviceType(userAgent) {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return 'Tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec/i.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
}

// Helper function to log audit event
async function logAudit(nomineeId, userId, action, req, additionalData = {}) {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceType = getDeviceType(userAgent);

    await AuditLog.create({
      nominee_id: nomineeId,
      user_id: userId,
      action,
      action_details: additionalData.details || null,
      asset_id: additionalData.assetId || null,
      note_id: additionalData.noteId || null,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_type: deviceType,
      status: additionalData.status || 'SUCCESS'
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * POST /api/nominee/validate-credentials
 * Validate nominee credentials and check access eligibility
 * Does NOT issue token - only validates credentials and returns status
 */
router.post('/validate-credentials', [
  body('nominee_email').isEmail().normalizeEmail(),
  body('beneficiary_reference_id').custom(value => {
    if (!isValidBenIdFormat(value)) {
      throw new Error('Invalid BEN-ID format');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nominee_email, beneficiary_reference_id } = req.body;

    console.log('=== NOMINEE CREDENTIAL VALIDATION ===');
    console.log('Email:', nominee_email);
    console.log('BEN-ID:', beneficiary_reference_id);

    // Step 1: Find nominee by BEN-ID
    const nominee = await Nominee.findOne({
      beneficiary_reference_id: beneficiary_reference_id.toUpperCase()
    }).populate('user_id');

    if (!nominee) {
      console.log('✗ Invalid reference ID - nominee not found');
      console.log('====================================');
      return res.status(404).json({
        success: false,
        message: 'Invalid reference ID. No nominee found with this beneficiary reference ID.'
      });
    }

    // Step 2: Verify email matches
    if (nominee.nominee_email.toLowerCase() !== nominee_email.toLowerCase()) {
      console.log('✗ Email mismatch');
      console.log('====================================');
      return res.status(401).json({
        success: false,
        message: 'Email does not match the beneficiary reference ID.'
      });
    }

    console.log('✓ Credentials valid');
    console.log('Nominee:', nominee.nominee_name);
    console.log('Current Status:', nominee.status);

    // Step 3: Fetch linked user
    const user = nominee.user_id;
    
    if (!user) {
      console.log('✗ Linked user not found');
      console.log('====================================');
      return res.status(500).json({
        success: false,
        message: 'System error: Associated user account not found.'
      });
    }

    console.log('Owner:', user.fullName);
    console.log('Continuity Triggered:', user.continuity_triggered);

    // Step 4: Apply access decision logic
    let canAccess = false;
    let accessMessage = '';
    let requiresAction = null;

    if (nominee.status === 'INACTIVE' && !user.continuity_triggered) {
      accessMessage = 'Access not activated. Owner continuity access has not been triggered.';
      requiresAction = 'WAIT_FOR_CONTINUITY_TRIGGER';
      console.log('✗ Access denied: INACTIVE + continuity not triggered');
    }
    else if (nominee.status === 'INACTIVE' && user.continuity_triggered) {
      accessMessage = 'Continuity access activated. Please upload death certificate for verification.';
      requiresAction = 'UPLOAD_DEATH_CERTIFICATE';
      console.log('✓ Proceed to upload: INACTIVE + continuity triggered');
    }
    else if (nominee.status === 'PENDING_VERIFICATION') {
      accessMessage = 'Verification in progress. Your death certificate is under review. Please wait for approval.';
      requiresAction = 'WAIT_FOR_VERIFICATION';
      console.log('✗ Access denied: PENDING_VERIFICATION status');
    }
    else if (nominee.status === 'REJECTED') {
      accessMessage = `Access permanently denied. Reason: ${nominee.rejection_reason || 'Document verification failed'}. Please contact support.`;
      requiresAction = 'CONTACT_SUPPORT';
      console.log('✗ Access denied: REJECTED status');
    }
    else if (nominee.status === 'ACTIVE' && user.continuity_triggered === true) {
      canAccess = true;
      accessMessage = 'Access granted. You may proceed to login.';
      requiresAction = 'PROCEED_TO_LOGIN';
      console.log('✓ Access granted: ACTIVE + continuity triggered');
    }
    else if (nominee.status === 'ACTIVE' && user.continuity_triggered === false) {
      accessMessage = 'Nominee activated but owner continuity access has not been triggered yet.';
      requiresAction = 'WAIT_FOR_CONTINUITY_TRIGGER';
      console.log('✗ Access denied: ACTIVE but continuity not triggered');
    }
    else {
      accessMessage = 'Access denied. Invalid system state.';
      requiresAction = 'CONTACT_SUPPORT';
      console.log('✗ Access denied: Unknown state');
    }

    console.log('Decision:', canAccess ? 'ALLOW' : 'DENY');
    console.log('====================================');

    res.json({
      success: true,
      data: {
        credentials_valid: true,
        can_access: canAccess,
        message: accessMessage,
        requires_action: requiresAction,
        nominee: {
          nominee_name: nominee.nominee_name,
          status: nominee.status,
          verified_at: nominee.verified_at
        },
        owner: {
          fullName: user.fullName,
          continuity_triggered: user.continuity_triggered
        }
      }
    });
  } catch (error) {
    console.error('Credential validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Validation failed. Please try again.'
    });
  }
});

/**
 * POST /api/nominee/login
 * Nominee login with strict validation
 * 
 * SECURITY FLOW:
 * 1. Validate nominee_email + BEN-ID
 * 2. Check nominee exists
 * 3. Check nominee status is ACTIVE
 * 4. Check user continuity_triggered is true
 * 5. Only then grant access
 */
router.post('/login', [
  body('nominee_email').isEmail().normalizeEmail(),
  body('beneficiary_reference_id').custom(value => {
    if (!isValidBenIdFormat(value)) {
      throw new Error('Invalid BEN-ID format');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nominee_email, beneficiary_reference_id } = req.body;

    console.log('=== NOMINEE LOGIN ATTEMPT ===');
    console.log('Email:', nominee_email);
    console.log('BEN-ID:', beneficiary_reference_id);

    // Step 1: Find nominee by BEN-ID
    const nominee = await Nominee.findOne({
      beneficiary_reference_id: beneficiary_reference_id.toUpperCase()
    }).populate('user_id');

    if (!nominee) {
      console.log('✗ Invalid BEN-ID - nominee not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or beneficiary reference ID.'
      });
    }

    // Step 2: Validate email matches
    if (nominee.nominee_email.toLowerCase() !== nominee_email.toLowerCase()) {
      console.log('✗ Email mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or beneficiary reference ID.'
      });
    }

    console.log('✓ Nominee found:', nominee.nominee_name);
    console.log('Current status:', nominee.status);

    // Step 3: CRITICAL - Check nominee status is ACTIVE
    if (nominee.status !== 'ACTIVE') {
      let errorMessage = '';
      let reason = '';

      switch (nominee.status) {
        case 'INACTIVE':
          errorMessage = 'Reference ID not activated. Access will be granted after the account owner triggers Continuity Access and death verification is complete.';
          reason = 'Nominee status is INACTIVE. Continuity access and death verification required.';
          break;
        case 'PENDING_VERIFICATION':
          errorMessage = 'Your death certificate is currently under review. You will be notified once verification is complete.';
          reason = 'Death certificate verification pending approval.';
          break;
        case 'REJECTED':
          errorMessage = `Access denied. Reason: ${nominee.rejection_reason || 'Document verification failed'}. Please contact support.`;
          reason = nominee.rejection_reason || 'Document verification failed.';
          break;
        default:
          errorMessage = 'Access denied. Invalid nominee status.';
          reason = 'Invalid nominee status.';
      }

      console.log('✗ Access denied:', errorMessage);
      console.log('Reason:', reason);
      console.log('============================');

      return res.status(403).json({
        success: false,
        message: errorMessage,
        reason: reason,
        status: nominee.status
      });
    }

    // Step 4: Check verification status (ACTIVE = APPROVED)
    console.log('✓ Verification Status: APPROVED (status is ACTIVE)');

    // Step 5: Check if user continuity is triggered
    const user = nominee.user_id;
    
    if (!user.continuity_triggered) {
      console.log('✗ Continuity not triggered');
      console.log('============================');
      
      return res.status(403).json({
        success: false,
        message: 'Continuity access has not been triggered by the account owner. Access denied.',
        reason: 'Owner has not triggered continuity access yet.'
      });
    }

    // Step 6: All checks passed - Generate JWT token (1 hour expiry)
    const token = generateNomineeToken(nominee._id, user._id);

    console.log('✓ Authentication successful');
    console.log('✓ JWT token generated (1 hour expiry)');
    console.log('✓ Access granted to dashboard');
    console.log('Nominee ID:', nominee._id);
    console.log('User ID:', user._id);
    console.log('============================');

    // Return response in required format
    res.json({
      success: true,
      token: token,
      redirect: '/nominee-dashboard',
      nominee: {
        id: nominee._id.toString(),
        email: nominee.nominee_email,
        userId: user._id.toString(),
        name: nominee.nominee_name,
        beneficiaryReferenceId: nominee.beneficiary_reference_id,
        status: nominee.status,
        verificationStatus: 'APPROVED'
      }
    });
  } catch (error) {
    console.error('Nominee login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

/**
 * POST /api/nominee/upload-death-proof
 * Upload death certificate (file stored locally, not in MongoDB)
 */
router.post('/upload-death-proof', [
  body('nominee_email').isEmail().normalizeEmail(),
  body('beneficiary_reference_id').custom(value => {
    if (!isValidBenIdFormat(value)) {
      throw new Error('Invalid BEN-ID format');
    }
    return true;
  }),
  body('document_name').notEmpty(),
  body('file_path').notEmpty() // Local file path, not stored in MongoDB
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nominee_email, beneficiary_reference_id, document_name, file_path } = req.body;

    // Find nominee
    const nominee = await Nominee.findOne({
      beneficiary_reference_id: beneficiary_reference_id.toUpperCase(),
      nominee_email: nominee_email.toLowerCase()
    });

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found with provided credentials.'
      });
    }

    // Check current status
    if (nominee.status === 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'This nominee has already been verified and activated.'
      });
    }

    if (nominee.status === 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: 'This nominee application was rejected. Please contact support.'
      });
    }

    // Update nominee status
    await nominee.setPendingVerification(file_path, document_name);

    console.log('=== DEATH CERTIFICATE UPLOADED ===');
    console.log('Nominee:', nominee.nominee_name);
    console.log('BEN-ID:', nominee.beneficiary_reference_id);
    console.log('Document:', document_name);
    console.log('File Path:', file_path);
    console.log('Status: INACTIVE → PENDING_VERIFICATION');
    console.log('===================================');

    // In demo mode, auto-verify after delay
    if (process.env.DEMO_MODE === 'true') {
      console.log('⚠ DEMO MODE: Auto-verification will trigger in 3 seconds');
      
      setTimeout(async () => {
        try {
          await nominee.activate();
          
          // Trigger user continuity if not already triggered
          const user = await User.findById(nominee.user_id);
          if (user && !user.continuity_triggered) {
            await user.triggerContinuity();
          }
          
          console.log('✓ DEMO MODE: Nominee auto-verified and activated');
          console.log('BEN-ID:', nominee.beneficiary_reference_id);
        } catch (error) {
          console.error('Demo auto-verification error:', error);
        }
      }, 3000);
    }

    res.json({
      success: true,
      message: 'Death certificate uploaded successfully. Awaiting verification.',
      data: {
        nomineeId: nominee._id,
        status: nominee.status,
        document_name: nominee.death_document_name
      }
    });
  } catch (error) {
    console.error('Upload death proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload death certificate.'
    });
  }
});

/**
 * POST /api/nominee/verify-death
 * Admin/System endpoint to approve or reject death verification
 * In production, this would require admin authentication
 */
router.post('/verify-death', [
  body('nomineeId').notEmpty(),
  body('decision').isIn(['APPROVE', 'REJECT']),
  body('rejection_reason').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nomineeId, decision, rejection_reason } = req.body;

    const nominee = await Nominee.findById(nomineeId).populate('user_id');

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found.'
      });
    }

    if (nominee.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({
        success: false,
        message: `Cannot verify nominee with status: ${nominee.status}`
      });
    }

    if (decision === 'APPROVE') {
      await nominee.activate();
      
      // Trigger user continuity
      const user = nominee.user_id;
      if (!user.continuity_triggered) {
        await user.triggerContinuity();
      }

      console.log('=== DEATH VERIFICATION APPROVED ===');
      console.log('Nominee:', nominee.nominee_name);
      console.log('BEN-ID:', nominee.beneficiary_reference_id);
      console.log('Status: PENDING_VERIFICATION → ACTIVE');
      console.log('✓ Access granted');
      console.log('===================================');

      res.json({
        success: true,
        message: 'Death verification approved. Nominee activated.',
        data: {
          nomineeId: nominee._id,
          status: nominee.status,
          verified_at: nominee.verified_at
        }
      });
    } else {
      await nominee.reject(rejection_reason);

      console.log('=== DEATH VERIFICATION REJECTED ===');
      console.log('Nominee:', nominee.nominee_name);
      console.log('BEN-ID:', nominee.beneficiary_reference_id);
      console.log('Reason:', rejection_reason || 'Not specified');
      console.log('Status: PENDING_VERIFICATION → REJECTED');
      console.log('===================================');

      res.json({
        success: true,
        message: 'Death verification rejected.',
        data: {
          nomineeId: nominee._id,
          status: nominee.status,
          rejection_reason: nominee.rejection_reason
        }
      });
    }
  } catch (error) {
    console.error('Verify death error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed.'
    });
  }
});

/**
 * GET /api/nominee/dashboard
 * Get comprehensive dashboard data for authenticated nominee
 * Returns: owner info, released assets, legacy notes, verification status, audit logs
 */
router.get('/dashboard', authenticateNominee, async (req, res) => {
  try {
    console.log(`=== NOMINEE DASHBOARD REQUEST ===`);
    console.log(`Nominee ID from Token: ${req.nominee.nomineeId}`); 

    // 1. FETCH DATA FIRST
    // We cannot log the audit yet because we don't know the user_id (Owner)
    const nominee = await Nominee.findById(req.nominee.nomineeId).populate('user_id');

    if (!nominee) {
      return res.status(404).json({ success: false, message: 'Nominee not found' });
    }

    // 2. NOW WE HAVE THE IDs
    const userId = nominee.user_id._id;
    const nomineeId = nominee._id;

    console.log(`User ID (Owner): ${userId}`);

    // 3. LOG AUDIT NOW (Safe to do because variables are defined)
    try {
      await logAudit(nomineeId, userId, 'VIEWED_DASHBOARD', req);
      console.log("✅ Audit Logged Successfully");
    } catch (auditError) {
      console.error("⚠️ Audit Log Failed (Non-fatal):", auditError.message);
      // Do not crash the dashboard just because logging failed
    }

    // 4. Fetch owner (user)
    const owner = nominee.user_id;
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Account owner not found.'
      });
    }

    // Check if continuity access is triggered
    const accessGranted = owner.continuity_triggered && nominee.status === 'ACTIVE';

    // 5. Owner Information
    const ownerInfo = {
      name: owner.fullName,
      email: owner.email,
      status: owner.continuity_triggered ? 'DECEASED' : 'ACTIVE',
      continuity_triggered: owner.continuity_triggered,
      continuity_trigger_date: owner.continuity_trigger_date || null
    };

    // 6. Nominee Information
    const nomineeInfo = {
      id: nominee._id.toString(),
      name: nominee.nominee_name,
      email: nominee.nominee_email,
      relationship: nominee.relation || 'Beneficiary',
      ben_id: nominee.beneficiary_reference_id,
      status: nominee.status,
      verified_at: nominee.verified_at || null,
      access_type: accessGranted ? 'Posthumous | Read-Only' : 'No Access'
    };

    // 7. Released Digital Assets
    let releasedAssets = [];
    if (accessGranted) {
      releasedAssets = await DigitalAsset.find({
        user_id: userId,
        status: 'RELEASED'
      }).select('asset_name asset_type description status release_condition version_count last_modified released_at file_size mime_type').lean();
    }

    // 8. Legacy Notes (visible to nominee)
    let legacyNotes = [];
    if (accessGranted) {
      legacyNotes = await LegacyNote.find({
        user_id: userId,
        visibility: 'NOMINEE'
      }).select('title content category priority release_condition written_date last_modified').lean();
    }

    // 9. Verification Status
    const verificationStatus = {
      death_certificate_status: nominee.status === 'ACTIVE' ? 'Verified' : nominee.status === 'PENDING_VERIFICATION' ? 'Pending' : 'Not Submitted',
      verification_method: nominee.status === 'ACTIVE' ? 'System' : null,
      verification_timestamp: nominee.verified_at || null,
      verifying_authority: nominee.status === 'ACTIVE' ? 'Digital Inheritance System' : null,
      access_state: nominee.status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'
    };

    // 10. Recent Audit Logs (last 50 entries)
    const auditLogs = await AuditLog.find({
      nominee_id: nomineeId
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .select('action action_details ip_address device_type status timestamp')
    .lean();

    // 11. Session Info
    const sessionInfo = {
      started_at: new Date(),
      token_expires_in: 3600, // 1 hour in seconds
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip,
      device_type: getDeviceType(req.headers['user-agent'])
    };

    console.log('✓ Dashboard data compiled');
    console.log('Assets:', releasedAssets.length);
    console.log('Notes:', legacyNotes.length);
    console.log('Audit Logs:', auditLogs.length);
    console.log('================================');

    res.json({
      success: true,
      data: {
        owner: ownerInfo,
        nominee: nomineeInfo,
        assets: releasedAssets,
        notes: legacyNotes,
        verification: verificationStatus,
        auditLogs: auditLogs,
        session: sessionInfo,
        access_granted: accessGranted
      }
    });

  } catch (error) {
    console.error('❌ Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

/**
 * POST /api/nominee/log-action
 * Log nominee action for audit trail
 */
router.post('/log-action', authenticateNominee, [
  body('action').isIn(['VIEWED_ASSET', 'DOWNLOADED_ASSET', 'VIEWED_NOTE', 'DOWNLOADED_NOTE', 'SESSION_END']),
  body('asset_id').optional(),
  body('note_id').optional(),
  body('details').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const nomineeId = req.nomineeId;
    const userId = req.userId;
    const { action, asset_id, note_id, details } = req.body;

    await logAudit(nomineeId, userId, action, req, {
      assetId: asset_id,
      noteId: note_id,
      details: details
    });

    res.json({
      success: true,
      message: 'Action logged successfully.'
    });

  } catch (error) {
    console.error('Log action error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log action.'
    });
  }
});

/**
 * POST /api/nominee/admin/activate
 * Admin endpoint to activate a nominee (for testing/demo)
 * Body: { nominee_email, beneficiary_reference_id }
 */
router.post('/admin/activate', [
  body('nominee_email').isEmail().normalizeEmail(),
  body('beneficiary_reference_id').custom(value => {
    if (!isValidBenIdFormat(value)) {
      throw new Error('Invalid BEN-ID format');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nominee_email, beneficiary_reference_id } = req.body;

    console.log('=== ADMIN: NOMINEE ACTIVATION ===');
    console.log('Email:', nominee_email);
    console.log('BEN-ID:', beneficiary_reference_id);

    // Find nominee
    const nominee = await Nominee.findOne({
      beneficiary_reference_id: beneficiary_reference_id.toUpperCase(),
      nominee_email: nominee_email.toLowerCase()
    }).populate('user_id');

    if (!nominee) {
      return res.status(404).json({
        success: false,
        message: 'Nominee not found.'
      });
    }

    // Activate nominee
    await nominee.activate();

    // Ensure user has continuity triggered
    const user = nominee.user_id;
    if (user && !user.continuity_triggered) {
      user.continuity_triggered = true;
      await user.save();
      console.log('✓ User continuity also triggered');
    }

    console.log('✓ Nominee activated successfully');
    console.log('Status:', nominee.status);
    console.log('Verified At:', nominee.verified_at);
    console.log('=================================');

    res.json({
      success: true,
      message: 'Nominee activated successfully.',
      data: {
        nominee_id: nominee._id,
        nominee_name: nominee.nominee_name,
        status: nominee.status,
        verified_at: nominee.verified_at
      }
    });
  } catch (error) {
    console.error('Admin activation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate nominee.'
    });
  }
});

export default router;

