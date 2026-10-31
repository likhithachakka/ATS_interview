'use strict';

const multer = require('multer');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * 404 handler for unmatched routes.
 */
function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist.`));
}

/**
 * Central error handler. Always responds with the same envelope:
 * { success: false, error: { code, message, details? } }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Something went wrong.';
  let details = error.details;

  if (error instanceof multer.MulterError) {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `The resume file is too large. Maximum size is ${env.maxUploadMb} MB.`
        : `Upload failed: ${error.message}`;
  } else if (error.name === 'ValidationError') {
    statusCode = 422;
    code = 'MONGOOSE_VALIDATION_ERROR';
    message = 'The analysis result failed validation.';
    details = Object.fromEntries(Object.entries(error.errors || {}).map(([key, value]) => [key, value.message]));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `"${error.value}" is not a valid ${error.path}.`;
  }

  if (statusCode >= 500) {
    console.error('[error]', error);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

module.exports = { notFoundHandler, errorHandler };
