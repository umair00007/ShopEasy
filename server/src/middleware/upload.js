import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

// memoryStorage keeps the file in RAM (req.files[i].buffer) so we can stream it to S3.
// Nothing is written to the server's disk. The size limit protects RAM.
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5 MB each, max 5 files
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new ApiError(400, 'Only JPG, PNG or WebP images are allowed')),
}).array('images', 5);
