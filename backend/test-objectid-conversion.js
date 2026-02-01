#!/usr/bin/env node

/**
 * Test ObjectId conversion from JWT string to MongoDB ObjectId
 */

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './models/User.js';
import DigitalAsset from './models/DigitalAsset.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_will';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

console.log('🔍 ObjectId Conversion Test\n');

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    try {
      // Create a test user
      console.log('Step 1: Creating test user...');
      const user = await User.create({
        email: 'objectid-test@example.com',
        fullName: 'ObjectId Test',
        password_hash: 'testpass'
      });
      
      const originalUserId = user._id;
      console.log(`User ID (as stored): ${originalUserId}`);
      console.log(`User ID type: ${typeof originalUserId}`);
      console.log(`User ID instanceof ObjectId: ${originalUserId instanceof mongoose.Types.ObjectId}`);
      console.log();

      // Step 2: Simulate JWT signing/verification
      console.log('Step 2: Simulating JWT signing...');
      const token = jwt.sign(
        { userId: originalUserId, type: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log(`Token created`);
      console.log();

      // Step 3: Decode JWT
      console.log('Step 3: Decoding JWT...');
      const decoded = jwt.verify(token, JWT_SECRET);
      const jwtUserId = decoded.userId;
      console.log(`Decoded userId: ${jwtUserId}`);
      console.log(`Decoded userId type: ${typeof jwtUserId}`);
      console.log(`Decoded userId instanceof ObjectId: ${jwtUserId instanceof mongoose.Types.ObjectId}`);
      console.log();

      // Step 4: Simulate what assetRoutes does
      console.log('Step 4: Converting JWT userId back to ObjectId...');
      let validUserId = jwtUserId;
      if (typeof jwtUserId === 'string') {
        if (!mongoose.Types.ObjectId.isValid(jwtUserId)) {
          console.error(`ERROR: Invalid ObjectId: ${jwtUserId}`);
          throw new Error(`Invalid user ID: ${jwtUserId}`);
        }
        validUserId = new mongoose.Types.ObjectId(jwtUserId);
        console.log(`Converted string to ObjectId`);
      }
      console.log(`Final validUserId: ${validUserId}`);
      console.log(`Final validUserId type: ${typeof validUserId}`);
      console.log(`Final validUserId instanceof ObjectId: ${validUserId instanceof mongoose.Types.ObjectId}`);
      console.log();

      // Step 5: Try to create a DigitalAsset
      console.log('Step 5: Creating DigitalAsset with converted ObjectId...');
      const asset = new DigitalAsset({
        user_id: validUserId,
        asset_name: 'Test Asset',
        asset_type: 'Personal',
        description: 'Test',
        status: 'LOCKED',
        file_path: 'test/path.json',
        encrypted: true,
        encryption_key_id: '0xABC'
      });

      console.log(`Asset object created`);
      console.log(`Asset.user_id: ${asset.user_id}`);
      console.log(`Asset.user_id type: ${typeof asset.user_id}`);
      console.log(`Asset.user_id instanceof ObjectId: ${asset.user_id instanceof mongoose.Types.ObjectId}`);
      console.log();

      // Step 6: Save to database
      console.log('Step 6: Saving DigitalAsset to MongoDB...');
      await asset.save();
      console.log(`✅ Asset saved successfully!`);
      console.log(`Saved asset ID: ${asset._id}`);
      console.log();

      // Cleanup
      console.log('Step 7: Cleaning up...');
      await DigitalAsset.deleteOne({ _id: asset._id });
      await User.deleteOne({ _id: user._id });
      console.log('✅ Cleanup complete\n');

      console.log('✅ ALL TESTS PASSED\n');
      process.exit(0);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error(error);
      process.exit(1);
    }
  });
