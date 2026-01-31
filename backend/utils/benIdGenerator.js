import crypto from 'crypto';
import Nominee from '../models/Nominee.js';

/**
 * Generate cryptographically secure BEN-ID
 * Format: BEN-XXXX-XXXX
 * 
 * Requirements:
 * - Cryptographically random
 * - Globally unique
 * - Non-guessable
 */
export const generateBeneficiaryId = async () => {
  const MAX_ATTEMPTS = 10;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    // Generate 8 random characters (uppercase alphanumeric)
    const randomBytes = crypto.randomBytes(4); // 4 bytes = 8 hex chars
    const part1 = randomBytes.toString('hex').toUpperCase().substring(0, 4);
    
    const randomBytes2 = crypto.randomBytes(4);
    const part2 = randomBytes2.toString('hex').toUpperCase().substring(0, 4);
    
    const benId = `BEN-${part1}-${part2}`;

    // Check uniqueness in database
    const existing = await Nominee.findOne({ beneficiary_reference_id: benId });
    
    if (!existing) {
      console.log('✓ Generated unique BEN-ID:', benId);
      return benId;
    }

    console.log('⚠ BEN-ID collision detected, regenerating...');
    attempts++;
  }

  throw new Error('Failed to generate unique BEN-ID after maximum attempts');
};

/**
 * Validate BEN-ID format
 */
export const isValidBenIdFormat = (benId) => {
  const pattern = /^BEN-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(benId);
};

/**
 * Alternative: More secure version using full alphanumeric characters
 */
export const generateSecureBeneficiaryId = async () => {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const MAX_ATTEMPTS = 10;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    // Generate 8 random characters
    const randomValues = new Uint32Array(8);
    crypto.getRandomValues(randomValues);

    let part1 = '';
    let part2 = '';

    for (let i = 0; i < 4; i++) {
      part1 += CHARS[randomValues[i] % CHARS.length];
      part2 += CHARS[randomValues[i + 4] % CHARS.length];
    }

    const benId = `BEN-${part1}-${part2}`;

    // Check uniqueness
    const existing = await Nominee.findOne({ beneficiary_reference_id: benId });
    
    if (!existing) {
      console.log('✓ Generated secure BEN-ID:', benId);
      return benId;
    }

    attempts++;
  }

  throw new Error('Failed to generate unique secure BEN-ID');
};
