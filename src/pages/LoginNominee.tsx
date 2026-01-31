import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { nomineeApi } from '../api/client';
import { Upload, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import '../styles/Login.css';

type LoginStep = 'credentials' | 'upload' | 'verification' | 'success';

function LoginNominee() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [ownerReferenceId, setOwnerReferenceId] = useState('');
  const [deathCertificate, setDeathCertificate] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<LoginStep>('credentials');
  const [nomineeId, setNomineeId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, JPG, or PNG file');
      setDeathCertificate(null);
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 5 MB');
      setDeathCertificate(null);
      return;
    }

    setError('');
    setDeathCertificate(file);
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !ownerReferenceId) {
      setError('Please enter both email and reference ID');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Validate credentials using backend API
      const response = await nomineeApi.validateCredentials({
        nominee_email: email,
        beneficiary_reference_id: ownerReferenceId
      });

      if (!response.success) {
        setError(response.message || 'Invalid credentials');
        setIsProcessing(false);
        return;
      }

      // Check access eligibility
      if (response.data?.can_access) {
        // Credentials valid and access granted - proceed to login
        const loginResponse = await nomineeApi.login({
          nominee_email: email,
          beneficiary_reference_id: ownerReferenceId
        });

        if (loginResponse.success && loginResponse.token) {
          // Store token for authenticated requests (1 hour expiry)
          localStorage.setItem('nomineeToken', loginResponse.token);
          
          // Store nominee data in the new format
          const nomineeData = {
            id: loginResponse.nominee.id,
            email: loginResponse.nominee.email,
            userId: loginResponse.nominee.userId,
            name: loginResponse.nominee.name,
            beneficiaryReferenceId: loginResponse.nominee.beneficiaryReferenceId,
            status: loginResponse.nominee.status,
            verificationStatus: loginResponse.nominee.verificationStatus
          };
          
          localStorage.setItem('nominee_data', JSON.stringify(nomineeData));
          
          console.log('✅ Nominee login successful');
          console.log('Redirect:', loginResponse.redirect);
          console.log('Token expires in: 1 hour');
          
          setIsProcessing(false);
          setCurrentStep('success');
          setTimeout(() => {
            navigate(loginResponse.redirect || '/nominee-dashboard');
          }, 1500);
          return;
        }
      }

      // Handle different access scenarios based on requires_action
      const requiresAction = response.data?.requires_action;

      if (requiresAction === 'UPLOAD_DEATH_CERTIFICATE') {
        // Continuity triggered, need to upload death certificate
        setNomineeId(ownerReferenceId);
        setCurrentStep('upload');
        setIsProcessing(false);
        return;
      }

      if (requiresAction === 'WAIT_FOR_VERIFICATION') {
        // Death certificate is pending verification
        setNomineeId(response.data.nominee?.id || ownerReferenceId);
        setCurrentStep('verification');
        setIsProcessing(false);
        return;
      }

      if (requiresAction === 'WAIT_FOR_CONTINUITY_TRIGGER') {
        // Valid nominee but owner hasn't triggered continuity
        setError(response.message || 'Access not yet activated. Please wait for account owner.');
        setIsProcessing(false);
        return;
      }

      if (requiresAction === 'CONTACT_SUPPORT') {
        // Rejected or other issue
        setError(response.message || 'Access denied. Please contact support.');
        setIsProcessing(false);
        return;
      }

      // Default case: need to upload death certificate
      setNomineeId(ownerReferenceId);
      setCurrentStep('upload');
      setIsProcessing(false);

    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect to server. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleDeathCertificateUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!deathCertificate) {
      setError('Please select a death certificate to upload');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('verification');

    try {
      // Step 2: Upload death proof using backend API
      const uploadResponse = await nomineeApi.uploadDeathProof({
        nominee_email: email,
        beneficiary_reference_id: ownerReferenceId,
        document_name: deathCertificate.name,
        file_path: `/uploads/death-certificates/${Date.now()}_${deathCertificate.name}`
      });

      if (!uploadResponse.success) {
        setError(uploadResponse.message || 'Upload failed');
        setIsProcessing(false);
        setCurrentStep('upload');
        return;
      }

      setIsProcessing(false);
      // Stay on verification screen - auto-verification will handle next step
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload document. Please try again.');
      setIsProcessing(false);
      setCurrentStep('upload');
    }
  };

  const checkVerificationStatus = async () => {
    try {
      setIsProcessing(true);
      
      const response = await nomineeApi.validateCredentials({
        nominee_email: email,
        beneficiary_reference_id: ownerReferenceId
      });
      
      if (response.data?.can_access) {
        // Access granted - proceed to login and get JWT token
        console.log('✅ Verification approved - logging in...');
        
        const loginResponse = await nomineeApi.login({
          nominee_email: email,
          beneficiary_reference_id: ownerReferenceId
        });

        if (loginResponse.success && loginResponse.token) {
          // Store JWT token in localStorage
          localStorage.setItem('nomineeToken', loginResponse.token);
          localStorage.setItem('nominee_data', JSON.stringify(loginResponse.nominee));
          
          console.log('✅ Token stored successfully');
          console.log('Token expires in: 1 hour');
          console.log('Redirecting to:', loginResponse.redirect);
          
          // Update UI to success state
          setCurrentStep('success');
          setIsProcessing(false);
          
          // Redirect to nominee dashboard after brief delay
          setTimeout(() => {
            navigate(loginResponse.redirect || '/nominee-dashboard');
          }, 1500);
        } else {
          // Login failed
          setError('Login failed after verification. Please try again.');
          setIsProcessing(false);
          setCurrentStep('credentials');
        }
      } else if (response.data?.nominee?.status === 'REJECTED') {
        // Verification rejected
        console.error('❌ Verification rejected');
        setError(response.data.nominee.rejection_reason || 'Verification was rejected. Please contact support.');
        setIsProcessing(false);
        setCurrentStep('credentials');
      } else {
        // Still pending - keep polling
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Verification check error:', err);
      setError('Failed to check verification status. Please try again.');
      setIsProcessing(false);
    }
  };

  // Poll for verification status updates
  useEffect(() => {
    if (currentStep === 'verification') {
      const interval = setInterval(checkVerificationStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [currentStep, email, ownerReferenceId]);

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Nominee Access Portal</h1>
          <p className="login-subtitle">Legal verification required for inherited asset access</p>
        </div>

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${currentStep === 'credentials' || currentStep === 'upload' || currentStep === 'verification' || currentStep === 'success' ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Credentials</span>
          </div>
          <div className={`step ${currentStep === 'upload' || currentStep === 'verification' || currentStep === 'success' ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Upload Proof</span>
          </div>
          <div className={`step ${currentStep === 'verification' || currentStep === 'success' ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Verification</span>
          </div>
          <div className={`step ${currentStep === 'success' ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <span>Access Granted</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Credentials */}
        {currentStep === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Nominee Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nominee@example.com"
                autoComplete="email"
                required
                disabled={isProcessing}
              />
              <small>Email address provided by the account owner</small>
            </div>

            <div className="form-group">
              <label htmlFor="ownerRefId">Beneficiary Reference ID</label>
              <input
                type="text"
                id="ownerRefId"
                value={ownerReferenceId}
                onChange={(e) => setOwnerReferenceId(e.target.value.toUpperCase())}
                placeholder="BEN-XXXX-XXXX"
                required
                disabled={isProcessing}
                style={{ fontFamily: 'monospace', letterSpacing: '1px' }}
              />
              <small>Unique reference ID sent via email</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isProcessing}>
              {isProcessing ? 'Validating...' : 'Continue'}
            </button>
          </form>
        )}

        {/* STEP 2: Upload Death Certificate */}
        {currentStep === 'upload' && (
          <form onSubmit={handleDeathCertificateUpload} className="login-form">
            <div className="info-box">
              <AlertCircle size={20} />
              <div>
                <strong>Death Verification Required</strong>
                <p>Upload official death certificate to proceed with verification</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="deathCertificate">Death Certificate Document</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="deathCertificate"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required
                  disabled={isProcessing}
                  style={{ display: 'none' }}
                />
                <label htmlFor="deathCertificate" className={`file-upload-label ${deathCertificate ? 'has-file' : ''}`}>
                  <Upload size={20} style={{ marginRight: '8px' }} />
                  {deathCertificate ? deathCertificate.name : 'Choose Document'}
                </label>
                {deathCertificate && (
                  <div className="file-info">
                    <CheckCircle size={16} color="#10b981" />
                    <span className="file-size">{(deathCertificate.size / 1024).toFixed(2)} KB</span>
                  </div>
                )}
              </div>
              <small>Accepted: PDF, JPG, PNG • Max 5 MB</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isProcessing || !deathCertificate}>
              {isProcessing ? 'Uploading...' : 'Submit for Verification'}
            </button>
            
            <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep('credentials')} disabled={isProcessing}>
              ← Back
            </button>
          </form>
        )}

        {/* STEP 3: Verification Pending */}
        {currentStep === 'verification' && (
          <div className="verification-screen">
            <div className="verification-status-card">
              <Clock size={64} color="#f59e0b" className="rotating-icon" />
              <h2>Verification in Progress</h2>
              <p>Your death certificate is being reviewed by our verification system.</p>
              {isProcessing && (
                <div className="loader-container" style={{ margin: '20px 0' }}>
                  <div className="spinner"></div>
                  <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>
                    Checking verification status...
                  </p>
                </div>
              )}
              <div className="verification-details">
                <div className="detail-row">
                  <span>Document:</span>
                  <strong>{deathCertificate?.name}</strong>
                </div>
                <div className="detail-row">
                  <span>Status:</span>
                  <span className="status-badge pending">PENDING_VERIFICATION</span>
                </div>
                <div className="detail-row">
                  <span>Estimated Time:</span>
                  <strong>3-5 seconds (Demo Mode)</strong>
                </div>
              </div>
              <div className="security-note">
                <AlertCircle size={16} />
                <span>Access will be automatically granted upon approval</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {currentStep === 'success' && (
          <div className="verification-screen">
            <div className="verification-status-card success">
              <CheckCircle size={64} color="#10b981" />
              <h2>Verification Approved!</h2>
              <p>Death certificate validated successfully.</p>
              <div className="success-message">
                Redirecting to nominee dashboard...
              </div>
            </div>
          </div>
        )}

        <div className="login-footer">
          <p>
            <Link to="/">← Back to role selection</Link>
          </p>
        </div>

        <div className="security-disclaimer">
          <p>🔐 Legally compliant verification process</p>
          <p className="demo-hint">
            <strong>Demo Mode:</strong> Auto-verification enabled (3s delay)
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginNominee;
