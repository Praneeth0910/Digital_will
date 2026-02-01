#!/usr/bin/env node

/**
 * Test file upload endpoint manually
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_will';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const API_URL = 'http://localhost:5000/api/user/upload-asset';

console.log('🔍 UPLOAD ENDPOINT TEST\n');

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');

    try {
      // Step 1: Create or find test user
      console.log('Step 1: Setting up test user...');
      let testUser = await User.findOne({ email: 'endpoint-test@example.com' });
      
      if (!testUser) {
        testUser = await User.create({
          email: 'endpoint-test@example.com',
          fullName: 'Endpoint Test User',
          password_hash: 'testpass'
        });
        console.log(`✅ Created test user: ${testUser._id}\n`);
      } else {
        console.log(`✅ Found test user: ${testUser._id}\n`);
      }

      // Step 2: Generate JWT token
      console.log('Step 2: Generating JWT token...');
      const token = jwt.sign(
        { userId: testUser._id.toString(), type: 'user' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      console.log(`✅ Token: ${token.substring(0, 30)}...\n`);

      // Step 3: Create test file
      console.log('Step 3: Creating test file...');
      const testFilePath = path.join(process.cwd(), 'test-file-upload.txt');
      fs.writeFileSync(testFilePath, 'This is a test file for upload endpoint testing. '.repeat(100));
      const fileSize = fs.statSync(testFilePath).size;
      console.log(`✅ Created test file: ${fileSize} bytes\n`);

      // Step 4: Create FormData and send upload request
      console.log('Step 4: Sending upload request...');
      const form = new FormData();
      form.append('file', fs.createReadStream(testFilePath));
      form.append('title', 'Test Upload Asset');
      form.append('description', 'Testing the upload endpoint');
      form.append('category', 'Personal');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...form.getHeaders()
        },
        body: form
      });

      const result = await response.json();
      
      console.log(`\nResponse Status: ${response.status}`);
      console.log('Response:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ UPLOAD SUCCESSFUL!\n`);
      } else {
        console.log(`\n❌ UPLOAD FAILED!\n`);
        console.log('Error:', result.message);
        if (result.debug) {
          console.log('Debug:', result.debug);
        }
      }

      // Cleanup
      console.log('Step 5: Cleaning up...');
      fs.unlinkSync(testFilePath);
      console.log('✅ Test file deleted\n');

      process.exit(result.success ? 0 : 1);

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error(error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  });
