#!/usr/bin/env node

/**
 * Test MongoDB connection and DigitalAsset model
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DigitalAsset from './models/DigitalAsset.js';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_will';

console.log('🔍 MONGODB & MODEL TEST\n');
console.log(`Connecting to: ${MONGO_URI}\n`);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = await User.create({
        email: 'test@example.com',
        fullName: 'Test User',
        password_hash: 'hashedpassword'
      });
      console.log(`✅ Created test user: ${testUser._id}\n`);
    } else {
      console.log(`✅ Found test user: ${testUser._id}\n`);
    }

    // Try to create a test asset
    console.log('Creating test asset...');
    
    const testAsset = new DigitalAsset({
      user_id: testUser._id,
      asset_name: 'Test Asset',
      asset_type: 'Legal',
      description: 'Test description',
      status: 'LOCKED',
      file_path: 'test/path/map.json',
      encrypted: true,
      encryption_key_id: '0xAA'
    });

    console.log('Test asset object:', testAsset.toObject());
    console.log('\nSaving asset...');

    const savedAsset = await testAsset.save();
    console.log('✅ Asset saved successfully!\n');
    console.log('Saved asset:', savedAsset.toObject());

    // Query the asset back
    console.log('\nQuerying asset back...');
    const queriedAsset = await DigitalAsset.findById(savedAsset._id);
    console.log('✅ Asset retrieved:', queriedAsset.toObject());

    // Cleanup
    console.log('\nCleaning up test data...');
    await DigitalAsset.deleteOne({ _id: savedAsset._id });
    console.log('✅ Test asset deleted');

    console.log('\n✅ ALL TESTS PASSED\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  });
