import fs from 'fs';
import path from 'path';
import connectDB from '../config/db.js';
import Payment from '../models/Payment.js';

/**
 * Automatic deletion of proof of payment images has been DISABLED.
 * Images are retained permanently on storage.
 */
export const runProofCleanup = async () => {
  return { cleanedCount: 0 };
};

export const startCleanupScheduler = () => {
  console.log('[CleanupService] Proof deletion scheduler disabled. Permanent storage enabled.');
};
