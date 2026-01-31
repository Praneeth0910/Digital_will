import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCurrentNominee } from '../utils/storage';
import '../styles/Login.css';

function NomineeVerification() {
  const navigate = useNavigate();
  const [nominee, setNominee] = useState(getCurrentNominee());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!nominee) {
      navigate('/login-nominee');
      return;
    }

    // Simulate verification delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Auto-redirect if ACTIVE
      if (nominee.status === 'ACTIVE') {
        setTimeout(() => {
          navigate('/nominee-dashboard');
        }, 2000);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [nominee, navigate]);

  const getStatusMessage = () => {
    if (isLoading) {
      return {
        title: 'Verifying your credentials...',
        message: 'Please wait while we validate your access',
        icon: '⏳'
      };
    }

    switch (nominee?.status) {
      case 'ACTIVE':
        return {
          title: 'Access Granted',
          message: 'Digital assets have been released. Redirecting to dashboard...',
          icon: '✅'
        };
      case 'PENDING_VERIFICATION':
      case 'INACTIVE':
        return {
          title: 'Awaiting Verification',
          message: 'The verification process is in progress. You will be notified when access is granted.',
          icon: '⏰'
        };
      case 'REJECTED':
        return {
          title: 'Access Denied',
          message: 'Your access request has been denied. Please contact support.',
          icon: '❌'
        };
      default:
        return {
          title: 'Unknown Status',
          message: 'Unable to verify status',
          icon: '❓'
        };
    }
  };

  const status = getStatusMessage();

  return (
    <div className="login-container">
      <div className="login-card verification-card">
        <div className="verification-status">
          <div className="status-icon">{status.icon}</div>
          <h1>{status.title}</h1>
          <p className="status-message">{status.message}</p>
        </div>

        {isLoading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}

        {!isLoading && (nominee?.status === 'PENDING_VERIFICATION' || nominee?.status === 'INACTIVE') && (
          <div className="pending-info">
            <div className="info-card">
              <h3>What happens next?</h3>
              <ul>
                <li>The account owner's Continuity Access monitors their activity</li>
                <li>If the trigger conditions are met, assets will be automatically released</li>
                <li>You will receive email notification when access is granted</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Your Nominee Details</h3>
              <p><strong>Email:</strong> {nominee.email}</p>
              <p><strong>Reference ID:</strong> {nominee.ownerReferenceId}</p>
              <p><strong>Registered:</strong> {new Date(nominee.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <div className="login-footer">
          <p>
            <Link to="/login-nominee">← Back to nominee login</Link>
          </p>
          <p className="demo-hint">
            <strong>Demo Note:</strong> To approve access, login as the owner and click "Simulate Inactivity Trigger"
          </p>
        </div>
      </div>
    </div>
  );
}

export default NomineeVerification;
