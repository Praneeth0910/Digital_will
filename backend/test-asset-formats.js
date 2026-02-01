#!/usr/bin/env node

/**
 * Test DigitalAsset creation with different user_id formats
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import DigitalAsset from './models/DigitalAsset.js';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_will';

console.log('🔍 Testing DigitalAsset with Different user_id Formats\n');

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    try {
      // Create test user
      let testUser = await User.findOne({ email: 'asset-format-test@example.com' });
      if (!testUser) {
        testUser = await User.create({
          email: 'asset-format-test@example.com',
          fullName: 'Asset Format Test',
          password_hash: 'test'
        });
      }

      console.log('Test User ID:', testUser._id);
      console.log('Test User ID type:', typeof testUser._id);
      console.log('Test User ID instanceof ObjectId:', testUser._id instanceof mongoose.Types.ObjectId);

      // Test 1: Pass ObjectId directly (from req.userId)
      console.log('\n--- Test 1: Direct ObjectId from mongoose ---');
      const asset1 = new DigitalAsset({
        user_id: testUser._id,
        asset_name: 'Test Asset 1',
        asset_type: 'Personal',
        status: 'LOCKED',
        file_path: 'test/path.json',
        encrypted: true,
        encryption_key_id: '0xABC'
      });
      console.log('Asset1.user_id before save:', asset1.user_id);
      await asset1.save();
      console.log('✅ Test 1 PASSED\n');

      // Test 2: Pass ObjectId string
      console.log('--- Test 2: ObjectId as string ---');
      const userIdString = testUser._id.toString();
      const asset2 = new DigitalAsset({
        user_id: new mongoose.Types.ObjectId(userIdString),
        asset_name: 'Test Asset 2',
        asset_type: 'Personal',
        status: 'LOCKED',
        file_path: 'test/path2.json',
        encrypted: true,
        encryption_key_id: '0xDEF'
      });
      console.log('Asset2.user_id before save:', asset2.user_id);
      await asset2.save();
      console.log('✅ Test 2 PASSED\n');

      // Test 3: Direct string (no conversion)
      console.log('--- Test 3: Raw string ---');
      const asset3 = new DigitalAsset({
        user_id: userIdString,
        asset_name: 'Test Asset 3',
        asset_type: 'Personal',
        status: 'LOCKED',
        file_path: 'test/path3.json',
        encrypted: true,
        encryption_key_id: '0xGHI'
      });
      console.log('Asset3.user_id before save:', asset3.user_id);
      console.log('Asset3.user_id type:', typeof asset3.user_id);
      await asset3.save();
      console.log('✅ Test 3 PASSED\n');

      // Test 4: Undefined user_id (should fail)
      console.log('--- Test 4: Undefined user_id (should FAIL) ---');
      try {
        const asset4 = new DigitalAsset({
          user_id: undefined,
          asset_name: 'Test Asset 4',
          asset_type: 'Personal',
          status: 'LOCKED',
          file_path: 'test/path4.json',
          encrypted: true,
          encryption_key_id: '0xJKL'
        });
        await asset4.save();
        console.log('❌ Test 4 should have failed but did not!\n');
      } catch (e) {
        console.log('✅ Test 4 correctly failed with:', e.message, '\n');
      }

      // Cleanup
      await DigitalAsset.deleteMany({ email: 'asset-format-test@example.com' });
      
      console.log('✅ ALL TESTS COMPLETED\n');
      process.exit(0);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error(error);
      process.exit(1);
    }
  });
