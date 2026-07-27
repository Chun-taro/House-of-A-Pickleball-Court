import fs from 'fs';
import path from 'path';
import connectDB from '../config/db.js';
import Payment from '../models/Payment.js';

/**
 * Cleanup expired proof of payment images (older than 2-3 days / proof_expires_at <= now).
 * Unlinks the file from server disk and updates DB payment record.
 */
export const runProofCleanup = async () => {
  try {
    await connectDB();
    const now = new Date();

    // Query payments where proof is uploaded and either proof_expires_at <= now OR proof_uploaded_at is older than 72 hours
    const expiredPayments = await Payment.find({
      proof_status: { $in: ['uploaded', 'verified'] },
      $or: [
        { proof_expires_at: { $lte: now } },
        { proof_uploaded_at: { $lte: new Date(Date.now() - 72 * 60 * 60 * 1000) } },
      ],
    });

    if (expiredPayments.length === 0) {
      return { cleanedCount: 0 };
    }

    let cleanedCount = 0;
    const uploadDir = path.join(process.cwd(), 'uploads', 'proofs');

    for (const payment of expiredPayments) {
      if (payment.proof_filename) {
        const filePath = path.join(uploadDir, payment.proof_filename);

        // Delete file from disk if it exists
        if (fs.existsSync(filePath)) {
          try {
            await fs.promises.unlink(filePath);
            console.log(`[CleanupService] Deleted expired proof image file: ${payment.proof_filename}`);
          } catch (unlinkErr) {
            console.error(`[CleanupService] Failed to delete file ${payment.proof_filename}:`, unlinkErr.message);
          }
        }
      }

      // Update DB record to clear image reference
      payment.proof_of_payment_url = null;
      payment.proof_filename = null;
      payment.proof_status = 'expired_deleted';
      await payment.save();
      cleanedCount++;
    }

    console.log(`[CleanupService] Proof cleanup completed. ${cleanedCount} expired proof(s) purged.`);
    return { cleanedCount };
  } catch (error) {
    console.error('[CleanupService] Error running proof of payment cleanup:', error.message);
    return { error: error.message };
  }
};

/**
 * Start background timer for automatic cleanup (runs every hour).
 */
export const startCleanupScheduler = () => {
  // Run once immediately on startup
  runProofCleanup();

  // Schedule to run every hour (3,600,000 ms)
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    runProofCleanup();
  }, ONE_HOUR);

  console.log('[CleanupService] Proof of payment 72-hour cleanup scheduler initialized.');
};
