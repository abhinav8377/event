import multer from 'multer';
import path from 'node:path';

const ALLOWED = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(ext)) return cb(null, true);
  cb(new Error(`Only ${ALLOWED.join(', ')} images are allowed`));
};

export const uploadBanner = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).single('banner');
