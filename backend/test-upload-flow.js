#!/usr/bin/env node

/**
 * Test complete file upload flow with authentication
 * This simulates what UserDashboard.tsx does
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import User from './models/User.js';
import DigitalAsset from './models/DigitalAsset.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_will';

console.log('🔍 COMPLETE UPLOAD FLOW TEST\n');
console.log(`Connecting to: ${MONGO_URI}\n`);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    try {
      // Step 1: Create/Find a test user
      console.log('Step 1: Setting up test user...');
      let testUser = await User.findOne({ email: 'upload-test@example.com' });
      
      if (!testUser) {
        testUser = await User.create({
          email: 'upload-test@example.com',
          fullName: 'Upload Test User',
          password_hash: 'hashedpassword123'
        });
        console.log(`✅ Created test user: ${testUser._id}\n`);
      } else {
        console.log(`✅ Found test user: ${testUser._id}\n`);
      }

      // Step 2: Generate JWT token (simulating login)
      console.log('Step 2: Generating JWT token...');
      const token = jwt.sign(
        { userId: testUser._id.toString(), type: 'user' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
      console.log(`✅ Generated token: ${token.substring(0, 20)}...\n`);

      // Step 3: Simulate auth middleware
      console.log('Step 3: Verifying token (simulating auth middleware)...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret');
      const verifiedUserId = decoded.userId;
      console.log(`✅ Token verified. User ID: ${verifiedUserId}\n`);

      // Step 4: Create a test file
      console.log('Step 4: Creating test file...');
      const testFilePath = path.join(process.cwd(), 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'Test file content for encryption');
      console.log(`✅ Created test file: ${testFilePath}\n`);

      // Step 5: Simulate asset creation (what assetRoutes.js does)
      console.log('Step 5: Creating digital asset record...');
      const newAsset = new DigitalAsset({
        user_id: verifiedUserId,  // This is what the middleware provides
        asset_name: 'Upload Test Asset',
        asset_type: 'Personal',
        description: 'Test asset from upload flow',
        status: 'LOCKED',
        file_path: 'secure_storage/map_abc123.json',
        encrypted: true,
        encryption_key_id: '0xDEADBEEF',
        version_count: 1
      });

      console.log(`[DEBUG] Asset object:`, newAsset.toObject());

      // Step 6: Save to MongoDB
      console.log('\nStep 6: Saving asset to MongoDB...');
      const savedAsset = await newAsset.save();
      console.log(`✅ Asset saved successfully!\n`);
      console.log(`Asset ID: ${savedAsset._id}`);
      console.log(`User ID: ${savedAsset.user_id}`);

      // Step 7: Query the asset back
      console.log('\nStep 7: Retrieving asset from MongoDB...');
      const queriedAsset = await DigitalAsset.findById(savedAsset._id).populate('user_id');
      console.log(`✅ Asset retrieved successfully!\n`);
      console.log(`Asset: ${queriedAsset.asset_name}`);
      console.log(`Owner: ${queriedAsset.user_id.fullName} (${queriedAsset.user_id.email})`);
      console.log(`Status: ${queriedAsset.status}`);
      console.log(`Encrypted: ${queriedAsset.encrypted}`);

      // Step 8: Query all assets for the user
      console.log('\nStep 8: Retrieving all assets for user...');
      const userAssets = await DigitalAsset.find({ user_id: testUser._id });
      console.log(`✅ Found ${userAssets.length} asset(s) for this user\n`);

      // Step 9: Cleanup
      console.log('Step 9: Cleaning up...');
      await DigitalAsset.deleteOne({ _id: savedAsset._id });
      fs.unlinkSync(testFilePath);
      console.log('✅ Cleanup complete\n');

      console.log('✅ ALL UPLOAD FLOW TESTS PASSED\n');
      process.exit(0);
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  });
