import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure proofs uploads directory exists safely (use /tmp on Vercel serverless environment)
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads', 'proofs')
  : path.join(process.cwd(), 'uploads', 'proofs');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Upload directory creation warning:', err.message);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `proof_${uniqueSuffix}${ext}`);
  },
});

// File filter validation: JPG, JPEG, PNG only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, and PNG image files are allowed.'));
  }
};

// Multer upload instance with 5MB file size limit
export const uploadProof = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter,
});
