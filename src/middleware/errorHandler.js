const { ApiError } = require('../utils/response');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, details } = err;

  // Database errors -> friendlier messages
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with this value already exists (duplicate).';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Referenced record does not exist (foreign key violation).';
  } else if (err.message && err.message.includes('at most 3 doctors')) {
    statusCode = 400;
    message = 'A patient can have at most 3 doctors assigned.';
  }

  if (!statusCode) statusCode = 500;
  if (!message || statusCode === 500) message = 'Something went wrong on the server';

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFound, errorHandler, ApiError };
