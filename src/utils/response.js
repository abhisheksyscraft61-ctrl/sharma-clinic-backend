/** Thrown anywhere in controllers/repositories; caught by errorHandler.js */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** Keeps every success response in the same { success, data } shape. */
function ok(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

module.exports = { ApiError, ok };
