import { useNavigate } from 'react-router-dom';
import '../styles/MainDashboard.css';

function MainDashboard() {
  const navigate = useNavigate();

  return (
    <div className="main-dashboard">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Digital Inheritance Platform</h1>
          <p className="hero-subtitle">
            Secure Your Digital Legacy with Blockchain-Backed Continuity Access
          </p>
          <button className="get-started-btn" onClick={() => navigate('/get-started')}>
            Get Started
          </button>
        </div>
      </section>

      {/* Features Section - Moved up */}
      <section className="features-section-intro">
        <div className="container">
          <h2 className="features-title">Platform Features</h2>
          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Encrypted Asset Vault</h3>
              <p>
                Military-grade encryption protects your digital assets with
                zero-knowledge architecture
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Continuity Access</h3>
              <p>
                Continuity Access ensures your digital assets are securely accessible
                to your chosen beneficiaries when required
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Decentralized Access Control</h3>
              <p>
                Blockchain-based verification ensures transparent and tamper-proof
                asset distribution
              </p>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon">⚖️</div>
              <h3>Legal + Digital Bridge</h3>
              <p>
                Seamlessly integrates digital asset transfer with traditional legal
                inheritance frameworks
              </p>
            </div>

            {/* Feature 5 */}
            <div className="feature-card">
              <div className="feature-icon">✓</div>
              <h3>Digital Activity Proof</h3>
              <p>
                Periodic check-ins ensure proof of life and prevent premature asset
                release
              </p>
            </div>

            {/* Feature 6 */}
            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Access & Audit Trail</h3>
              <p>
                Every access attempt and action is logged to ensure transparency and
                misuse prevention
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Register as an account owner or nominee with secure authentication</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Add Digital Assets</h3>
              <p>Securely store passwords, documents, crypto keys, and more</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Set Nominees</h3>
              <p>Designate trusted beneficiaries who will receive your assets</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Configure Triggers</h3>
              <p>Set up Continuity Access conditions for automatic release</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Badge Footer */}
      <footer className="dashboard-footer">
        <div className="container">
          <div className="security-badges">
            <span className="badge">🔒 Zero-Knowledge Encryption</span>
            <span className="badge">🔐 Multi-Factor Authentication</span>
            <span className="badge">⚡ Decentralized Architecture</span>
            <span className="badge">🛡️ GDPR Compliant</span>
          </div>
          <p className="footer-text">
            Your privacy and security are our top priorities. All data is encrypted end-to-end.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default MainDashboard;
