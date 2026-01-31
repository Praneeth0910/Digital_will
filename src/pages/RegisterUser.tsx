import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/auth.api';
import { setCurrentUser } from '../utils/storage';
import { User } from '../types';
import '../styles/Login.css';

function RegisterUser() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const getPasswordStrength = (pwd: string): string => {
    if (pwd.length === 0) return '';
    if (pwd.length < 6) return 'Weak';
    if (pwd.length < 10) return 'Medium';
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return 'Strong';
    return 'Medium';
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      console.log('🚀 Starting registration...');
      
      const result = await registerUser({
        name: fullName,
        email: email,
        masterPassword: password
      });

      if (!result.success || !result.data) {
        setError(result.message || 'Registration failed');
        return;
      }

      console.log('✅ Registration successful');

      // Store token and user data
      localStorage.setItem('auth_token', result.data.token);
      localStorage.setItem('user_data', JSON.stringify(result.data.user));
      
      // Set current user for app state
      const user: User = {
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
      console.error('❌ Registration error:', err);
      setError('Failed to connect to server. Please ensure the backend is running.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Create Your Account</h1>
          <p className="login-subtitle">Secure your digital legacy today</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

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
                placeholder="Create a strong master password"
                autoComplete="new-password"
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
            {password && (
              <small className={`password-strength strength-${passwordStrength.toLowerCase()}`}>
                Strength: {passwordStrength}
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Create Account
          </button>
        </form>

        <div className="login-footer">
          <p>
            Already have an account? <Link to="/login-user">Login here</Link>
          </p>
          <p>
            <Link to="/">← Back to role selection</Link>
          </p>
        </div>

        <div className="security-disclaimer">
          <p>🔒 Your master password is NEVER stored</p>
          <p>We use client-side encryption to protect your data</p>
        </div>
      </div>
    </div>
  );
}

export default RegisterUser;
