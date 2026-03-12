const multer = require('multer');
const path = require('path');

// Use memory storage — files are held in req.file.buffer and uploaded to
// Supabase Storage instead of being written to the local filesystem.
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.pdf', '.doc', '.docx'].includes(ext)) return cb(null, true);
  cb(new Error('Only PDF and Word documents (.pdf, .doc, .docx) are allowed'), false);
}

const uploadCV = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = { uploadCV };
