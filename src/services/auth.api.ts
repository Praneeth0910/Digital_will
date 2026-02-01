/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      createdAt: string;
      continuityTriggered: boolean;
    };
  };
}

interface ApiResult {
  success: boolean;
  message?: string;
  data?: AuthResponse['data'];
}

/**
 * Register a new user
 */
export const registerUser = async (userData: {
  name: string;
  email: string;
  masterPassword: string;
}): Promise<ApiResult> => {
  try {
    console.log('📤 API Call: POST /api/auth/register');
    console.log('Payload:', { name: userData.name, email: userData.email });

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        masterPassword: userData.masterPassword
      })
    });

    const data = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return {
      success: true,
      data: data.data
    };

  } catch (error) {
    console.error('❌ Registration API Error:', error);
    
    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Failed to connect to server. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      message: error.message || 'Registration failed'
    };
  }
};

/**
 * Login user
 */
export const loginUser = async (credentials: {
  email: string;
  masterPassword: string;
}): Promise<ApiResult> => {
  try {
    console.log('📤 API Call: POST /api/auth/login');
    console.log('Payload:', { email: credentials.email });

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        masterPassword: credentials.masterPassword
      })
    });

    const data = await response.json();
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return {
      success: true,
      data: data.data
    };

  } catch (error) {
    console.error('❌ Login API Error:', error);
    
    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Failed to connect to server. Please check your connection and try again.'
      };
    }

    return {
      success: false,
      message: error.message || 'Login failed'
    };
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = async (token: string): Promise<ApiResult> => {
  try {
    console.log('📤 API Call: GET /api/auth/verify');

    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      throw new Error(data.message || 'Token verification failed');
    }

    return {
      success: true,
      data: data.data
    };

  } catch (error) {
    console.error('❌ Token Verification Error:', error);
    
    return {
      success: false,
      message: error.message || 'Token verification failed'
    };
  }
};

/**
 * Check backend server health
 */
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/health`);
    const data = await response.json();
    
    console.log('🏥 Server Health:', data);
    
    return data.success === true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
};

// Example usage in React component:
/*

import { registerUser, loginUser, verifyToken, checkServerHealth } from './services/auth.api';

// Register
const handleRegister = async () => {
  const result = await registerUser({
    name: 'John Doe',
    email: 'john@example.com',
    masterPassword: 'SecurePass123'
  });

  if (result.success) {
    // Store token
    localStorage.setItem('auth_token', result.data.token);
    localStorage.setItem('user_data', JSON.stringify(result.data.user));
    
    // Navigate to dashboard
    navigate('/dashboard');
  } else {
    setError(result.message);
  }
};

// Login
const handleLogin = async () => {
  const result = await loginUser({
    email: 'john@example.com',
    masterPassword: 'SecurePass123'
  });

  if (result.success) {
    // Store token
    localStorage.setItem('auth_token', result.data.token);
    localStorage.setItem('user_data', JSON.stringify(result.data.user));
    
    // Navigate to dashboard
    navigate('/dashboard');
  } else {
    setError(result.message);
  }
};

// Verify token on app load
useEffect(() => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    verifyToken(token).then(result => {
      if (!result.success) {
        // Token invalid, logout user
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        navigate('/login');
      }
    });
  }
}, []);

// Check server health
useEffect(() => {
  checkServerHealth().then(isHealthy => {
    if (!isHealthy) {
      console.warn('Backend server is not responding');
    }
  });
}, []);

*/
