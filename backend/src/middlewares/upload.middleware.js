import multer from 'multer';
import path from 'path';

// Define file types and limits
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|pdf/;
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedExtensions.test(file.mimetype);

  if (extName && mimeType) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, jpg, png) and PDF files are allowed!'), false);
  }
};

const storage = multer.memoryStorage(); // We'll store it in memory temporarily to upload to Cloudinary or similar

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB file size limit
  fileFilter,
});

export const uploadFields = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'aadhaarFront', maxCount: 1 },
  { name: 'aadhaarBack', maxCount: 1 },
  { name: 'panCard', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'selfieVerification', maxCount: 1 },
  { name: 'identityProof', maxCount: 1 }, // Legacy compatibility
]);
