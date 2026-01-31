/**
 * Nominee Verification Service
 * Simulates backend verification lifecycle for digital inheritance
 */

import { Nominee, User } from '../types';
import { getNominees, getUsers, updateNominee, updateUser } from '../utils/storage';

const DEMO_MODE = true; // Set to false for manual admin verification
const AUTO_VERIFY_DELAY = 3000; // 3 seconds delay for demo

interface UploadDeathProofResult {
  success: boolean;
  message: string;
  nominee?: Nominee;
}

interface VerifyDeathResult {
  success: boolean;
  message: string;
  nominee?: Nominee;
}

/**
 * POST /api/nominee/upload-death-proof
 * Upload death certificate and set status to PENDING_VERIFICATION
 */
export const uploadDeathProof = async (
  nomineeId: string,
  file: File
): Promise<UploadDeathProofResult> => {
  console.log('=== API: POST /api/nominee/upload-death-proof ===');
  console.log('Nominee ID:', nomineeId);
  console.log('File:', file.name, file.type, (file.size / 1024).toFixed(2) + 'KB');

  // Validate file
  const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return {
      success: false,
      message: 'Invalid file type. Only PDF, JPG, and PNG are accepted.'
    };
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      success: false,
      message: 'File size exceeds 5MB limit.'
    };
  }

  // Fetch nominee
  const nominees = getNominees();
  const nominee = nominees.find(n => n.id === nomineeId);

  if (!nominee) {
    return {
      success: false,
      message: 'Nominee not found.'
    };
  }

  // Check if already verified/rejected
  if (nominee.status === 'ACTIVE') {
    return {
      success: false,
      message: 'This nominee has already been verified and activated.'
    };
  }

  if (nominee.status === 'REJECTED') {
    return {
      success: false,
      message: 'This nominee application was rejected. Please contact support.'
    };
  }

  // Simulate secure file storage (S3/Cloud)
  const fileUrl = `storage://death-certificates/${nomineeId}/${Date.now()}-${file.name}`;

  // Update nominee record
  const updatedNominee: Nominee = {
    ...nominee,
    status: 'PENDING_VERIFICATION',
    deathDocumentUrl: fileUrl,
    deathDocumentName: file.name
  };

  updateNominee(updatedNominee);

  console.log('✓ Document uploaded successfully');
  console.log('✓ Status updated: INACTIVE → PENDING_VERIFICATION');
  console.log('✓ Document URL:', fileUrl);
  console.log('✓ Verification queue: Pending admin review');
  console.log('===============================================');

  // Notify admin/system for review (simulated)
  console.log('📧 Notification sent to admin: New death certificate awaiting verification');

  // Auto-verify in demo mode
  if (DEMO_MODE) {
    console.log('⚠️  DEMO MODE: Auto-verification will trigger in', AUTO_VERIFY_DELAY / 1000, 'seconds');
    setTimeout(() => {
      verifyDeath(nomineeId, 'APPROVE');
    }, AUTO_VERIFY_DELAY);
  }

  return {
    success: true,
    message: 'Death certificate uploaded successfully. Awaiting verification.',
    nominee: updatedNominee
  };
};

/**
 * POST /api/admin/verify-death
 * Admin/System approves or rejects death verification
 */
export const verifyDeath = (
  nomineeId: string,
  decision: 'APPROVE' | 'REJECT',
  rejectionReason?: string
): VerifyDeathResult => {
  console.log('=== API: POST /api/admin/verify-death ===');
  console.log('Nominee ID:', nomineeId);
  console.log('Decision:', decision);
  if (rejectionReason) console.log('Reason:', rejectionReason);

  const nominees = getNominees();
  const nominee = nominees.find(n => n.id === nomineeId);

  if (!nominee) {
    return {
      success: false,
      message: 'Nominee not found.'
    };
  }

  if (nominee.status !== 'PENDING_VERIFICATION') {
    return {
      success: false,
      message: `Cannot verify nominee with status: ${nominee.status}`
    };
  }

  if (decision === 'APPROVE') {
    // APPROVE: Activate nominee and trigger continuity access
    const updatedNominee: Nominee = {
      ...nominee,
      status: 'ACTIVE',
      verifiedAt: new Date().toISOString()
    };

    updateNominee(updatedNominee);

    // Update user continuity status
    const users = getUsers();
    const owner = users.find(u => u.id === nominee.ownerId);
    if (owner) {
      const updatedOwner: User = {
        ...owner,
        continuityTriggered: true,
        dateOfDeathVerifiedAt: new Date().toISOString()
      };
      updateUser(updatedOwner);
      console.log('✓ User continuity triggered');
    }

    console.log('✓ Verification APPROVED');
    console.log('✓ Status updated: PENDING_VERIFICATION → ACTIVE');
    console.log('✓ Verified at:', updatedNominee.verifiedAt);
    console.log('✓ Access granted to nominee');
    console.log('=========================================');

    // Send approval email (simulated)
    console.log('📧 Email sent to:', nominee.email);
    console.log('Subject: Death Verification Approved - Access Granted');
    console.log('Body: Your access to inherited digital assets has been approved.');
    console.log('You may now log in using your email and reference ID.');

    return {
      success: true,
      message: 'Death verification approved. Nominee activated.',
      nominee: updatedNominee
    };
  } else {
    // REJECT: Mark as rejected
    const updatedNominee: Nominee = {
      ...nominee,
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
      rejectionReason: rejectionReason || 'Document verification failed'
    };

    updateNominee(updatedNominee);

    console.log('✗ Verification REJECTED');
    console.log('✓ Status updated: PENDING_VERIFICATION → REJECTED');
    console.log('✓ Rejected at:', updatedNominee.rejectedAt);
    console.log('✓ Reason:', updatedNominee.rejectionReason);
    console.log('=========================================');

    // Send rejection email (simulated)
    console.log('📧 Email sent to:', nominee.email);
    console.log('Subject: Death Verification Failed');
    console.log('Body: Unable to verify the submitted document. Reason:', rejectionReason);

    return {
      success: true,
      message: 'Death verification rejected.',
      nominee: updatedNominee
    };
  }
};

/**
 * POST /api/nominee/login
 * Validate credentials and enforce ACTIVE status requirement
 */
export const nomineeLogin = (email: string, referenceId: string): {
  success: boolean;
  message: string;
  nominee?: Nominee;
} => {
  console.log('=== API: POST /api/nominee/login ===');
  console.log('Email:', email);
  console.log('Reference ID:', referenceId);

  const nominees = getNominees();
  const nominee = nominees.find(
    n => n.email.toLowerCase() === email.toLowerCase() &&
         n.ownerReferenceId.toUpperCase() === referenceId.toUpperCase()
  );

  if (!nominee) {
    console.log('✗ Authentication failed: Invalid credentials');
    console.log('====================================');
    return {
      success: false,
      message: 'Invalid email or reference ID. Please check your credentials.'
    };
  }

  console.log('✓ Nominee found:', nominee.name || nominee.email);
  console.log('Current status:', nominee.status);

  // CRITICAL: Only ACTIVE nominees can access the system
  if (nominee.status !== 'ACTIVE') {
    let errorMessage = '';
    
    switch (nominee.status) {
      case 'INACTIVE':
        errorMessage = 'Reference ID not activated. Access will be granted after the account owner triggers Continuity Access and death verification is complete.';
        break;
      case 'PENDING_VERIFICATION':
        errorMessage = 'Your death certificate is currently under review. You will be notified once verification is complete.';
        break;
      case 'REJECTED':
        errorMessage = `Access denied. Reason: ${nominee.rejectionReason || 'Document verification failed'}. Please contact support.`;
        break;
      default:
        errorMessage = 'Access denied. Invalid nominee status.';
    }

    console.log('✗ Access denied:', errorMessage);
    console.log('====================================');
    
    return {
      success: false,
      message: errorMessage,
      nominee
    };
  }

  console.log('✓ Authentication successful');
  console.log('✓ Access granted to dashboard');
  console.log('====================================');

  return {
    success: true,
    message: 'Login successful',
    nominee
  };
};
