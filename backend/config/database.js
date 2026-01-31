import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital_inheritance';
    
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('URI:', mongoURI.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log('✓ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    console.warn('⚠️  Server will continue without database connection');
    console.warn('⚠️  Please install MongoDB locally or use MongoDB Atlas');
    console.warn('⚠️  To use Atlas: Update MONGODB_URI in .env file');
    // Don't exit, allow server to run without DB for development
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
