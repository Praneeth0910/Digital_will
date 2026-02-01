#!/usr/bin/env node

/**
 * Test userid capture and conversion through exec callback
 */

import { exec } from 'child_process';
import mongoose from 'mongoose';

// Simulate what happens in the route
console.log('Testing userId capture through exec callback\n');

// Simulate req.userId from auth middleware
const req = {
  userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')
};

console.log('Initial req.userId:', req.userId);
console.log('Initial type:', typeof req.userId);
console.log();

// Simulate the route logic
const userId = req.userId;
const capturedUserId = userId ? userId.toString() : null;

console.log('After capture:');
console.log('  capturedUserId:', capturedUserId);
console.log('  type:', typeof capturedUserId);
console.log();

// Simulate exec callback
const command = `node -e "console.log('test')"`;
console.log('Before exec - capturedUserId:', capturedUserId);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('exec error:', error);
    return;
  }

  console.log('\nInside exec callback:');
  console.log('  capturedUserId:', capturedUserId);
  console.log('  type:', typeof capturedUserId);
  console.log('  isValid:', mongoose.Types.ObjectId.isValid(capturedUserId));

  // Simulate conversion back
  const validUserId = new mongoose.Types.ObjectId(capturedUserId);
  console.log('  After conversion:', validUserId);
  console.log('  instanceof check:', validUserId instanceof mongoose.Types.ObjectId);
  console.log('\n✅ Test completed successfully');
});
