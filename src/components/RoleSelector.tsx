import { useNavigate } from 'react-router-dom';
import { ShieldCheck, BadgeCheck } from 'lucide-react';
import '../styles/RoleSelector.css';

function RoleSelector() {
  const navigate = useNavigate();

  return (
    <div className="role-selector-container">
      <div className="role-selector-content">
        <header className="role-header">
          <h1>Choose Your Role</h1>
          <p className="tagline">Select how you want to access the platform</p>
          <p className="trust-subtitle">Secure digital legacy management for you and your loved ones</p>
        </header>

        <div className="role-cards">
          <div className="role-card role-card-primary" onClick={() => navigate('/login-user')}>
            <div className="role-icon">
              <ShieldCheck size={64} strokeWidth={1.5} color="#667eea" aria-hidden="true" />
            </div>
            <h2>Account Owner Login</h2>
            <p>Take control of your digital legacy with enterprise-grade security and comprehensive asset management</p>
            <ul className="role-features">
              <li>Manage digital assets and beneficiaries</li>
              <li>Configure Continuity Access protocols</li>
              <li>Full encryption and data control</li>
            </ul>
            <button className="btn btn-primary">Login as Owner</button>
          </div>

          <div className="role-card" onClick={() => navigate('/login-nominee')}>
            <div className="role-icon">
              <BadgeCheck size={64} strokeWidth={1.5} color="#64748b" aria-hidden="true" />
            </div>
            <h2>Nominee Login</h2>
            <p>Securely access inherited digital assets entrusted to you with transparent verification</p>
            <ul className="role-features">
              <li>Verified identity authentication</li>
              <li>Access to released assets only</li>
              <li>Read-only secure permissions</li>
            </ul>
            <button className="btn btn-secondary">Login as Nominee</button>
          </div>
        </div>

        <footer className="role-footer">
          <div className="security-badges">
            <span className="badge">Zero-Knowledge Encryption</span>
            <span className="badge">Multi-Factor Authentication</span>
            <span className="badge">Decentralized Architecture</span>
            <span className="badge">Enterprise-Grade Security</span>
          </div>
          <p className="disclaimer">
            Your privacy and security are our top priorities. All data is encrypted end-to-end.
          </p>
          <p style={{ marginTop: '20px' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('/');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            >
              ← Back to Home
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default RoleSelector;
