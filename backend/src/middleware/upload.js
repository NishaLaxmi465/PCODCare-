const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ApiError = require('../utils/apiError');

const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads/reports');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const prefix = req.user?._id?.toString() || 'anonymous';
    cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const uploadReport = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      cb(new ApiError(415, 'Only PDF, JPG, and PNG reports are supported'));
      return;
    }

    cb(null, true);
  },
});

module.exports = { uploadReport, uploadDir };
