'use strict';

/**
 * Application level error that carries an HTTP status code and a stable code.
 */
class ApiError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static unprocessable(message, details) {
    return new ApiError(422, 'UNPROCESSABLE_ENTITY', message, details);
  }
}

module.exports = ApiError;
