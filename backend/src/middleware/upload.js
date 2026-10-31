'use strict';

const multer = require('multer');
const path = require('node:path');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'application/octet-stream',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();

    if (ALLOWED_EXTENSIONS.has(extension) || ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(
      ApiError.badRequest(
        `Unsupported file type "${extension || file.mimetype}". Upload a .pdf, .docx, .txt or .md file.`
      )
    );
  },
});

/**
 * Accepts an optional single file under the `resume` field.
 * Non multipart requests (plain JSON) are ignored by multer and handled by express.json().
 */
const uploadResume = upload.single('resume');

module.exports = { uploadResume };
