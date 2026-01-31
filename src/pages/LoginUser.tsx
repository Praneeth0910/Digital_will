import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/auth.api';
import { setCurrentUser } from '../utils/storage';
import '../styles/Login.css';

function LoginUser() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('🚀 Starting login...');
      
      const result = await loginUser({
        email: email,
        masterPassword: password
      });

      if (!result.success || !result.data) {
        setError(result.message || 'Invalid credentials');
        return;
      }

      console.log('✅ Login successful');

      // Store token and user data
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user_data', JSON.stringify(result.data.user));
      
      // Set current user for app state
      const user = {
        id: result.data.user.id,
        email: result.data.user.email,
        fullName: result.data.user.name,
        passwordHash: '',
        createdAt: result.data.user.createdAt || new Date().toISOString(),
        continuityTriggered: result.data.user.continuityTriggered || false
      };
      
      setCurrentUser(user);
      navigate('/user-dashboard');
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('Failed to connect to server. Please ensure the backend is running.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Account Owner Login</h1>
          <p className="login-subtitle">Secure access to your digital legacy</p>
        </div>

        <div className="login-features">
          <ul>
            <li>Manage encrypted digital assets</li>
            <li>Configure beneficiary access</li>
            <li>Monitor Continuity Access status</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Master Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your master password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small className="password-hint">
              Your master password is never stored on our servers
            </small>
          </div>

          <button type="submit" className="btn btn-primary">
            Login Securely
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
          <p>
            <Link to="/">← Back to role selection</Link>
          </p>
        </div>

        <div className="security-disclaimer">
          <p>🔒 Zero-knowledge encryption • Your data, your control</p>
          <p className="demo-hint">
            <strong>Demo:</strong> email: john@example.com | password: password123
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginUser;
