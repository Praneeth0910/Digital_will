import assetRoutes from './routes/assetRoutes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/userRoutes.js';
import nomineeRoutes from './routes/nomineeRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use((req, res, next) => {
  console.log(`📢 HIT: ${req.method} ${req.originalUrl}`);
  next();
});
const PORT = process.env.PORT || 5000;

console.log('═══════════════════════════════════════════════════');
console.log('🚀 STARTING DIGITAL INHERITANCE PLATFORM BACKEND');
console.log('═══════════════════════════════════════════════════');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('Demo Mode:', process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED');
console.log('JWT Secret:', process.env.JWT_SECRET ? 'CONFIGURED' : 'USING DEFAULT (CHANGE IN PRODUCTION)');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'CONFIGURED' : 'USING LOCAL DB');
console.log('Time:', new Date().toISOString());
console.log('═══════════════════════════════════════════════════\n');

// Connect to MongoDB
connectDB();

// CORS Configuration - Production Grade
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      // Add your Render frontend URL here after deployment
      // Example: 'https://digital-will-frontend.onrender.com'
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
    ];
    
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware - Enhanced
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📡 ${timestamp} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.masterPassword) sanitizedBody.masterPassword = '[REDACTED]';
    console.log('   Body:', sanitizedBody);
  }
  next();
});

// Health check endpoint - Enhanced
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    success: true,
    message: 'Digital Inheritance API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    demoMode: process.env.DEMO_MODE === 'true',
    database: {
      status: mongoStatus,
      name: mongoose.connection.name || 'N/A'
    },
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/user', assetRoutes);
app.use('/api/auth', authRoutes);      // ⭐ NEW AUTH ROUTES
app.use('/api/user', userRoutes);
app.use('/api/nominee', nomineeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('==============================================');
  console.log('  Digital Inheritance Backend API');
  console.log('==============================================');
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Demo Mode: ${process.env.DEMO_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log('==============================================');
  console.log('');
  console.log('✅ AUTH ENDPOINTS (NEW):');
  console.log('  POST /api/auth/register');
  console.log('  POST /api/auth/login');
  console.log('  GET  /api/auth/verify');
  console.log('');
  console.log('📋 USER ENDPOINTS:');
  console.log('  POST /api/user/register');
  console.log('  POST /api/user/login');
  console.log('  POST /api/user/add-nominee');
  console.log('  GET  /api/user/nominees');
  console.log('  POST /api/user/trigger-continuity');
  console.log('');
  console.log('👤 NOMINEE ENDPOINTS:');
  console.log('  POST /api/nominee/validate-credentials');
  console.log('  POST /api/nominee/login');
  console.log('  POST /api/nominee/upload-death-proof');
  console.log('  GET  /api/nominee/dashboard');
  console.log('  POST /api/nominee/verify-death');
  console.log('');
  console.log('🏥 HEALTH CHECK:');
  console.log('  GET  /health');
  console.log('==============================================');
  console.log('✅ Server is ready to accept requests');
  console.log('==============================================');
  console.log('');
});

export default app;
