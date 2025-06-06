const logger = require('../utils/logger');

const errorHandler = (error, req, res, next) => {
  // Log more detailed error information for debugging
  logger.error('Error occurred:', {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    code: error?.code,
    name: error?.name,
    url: req?.url,
    method: req?.method,
    body: req?.body,
    headers: req?.headers,
    errorObject: error
  });

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = null;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(error.errors).map(err => err.message);
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (error.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value';
    const field = Object.keys(error.keyValue)[0];
    details = `${field} already exists`;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.code === 'PYTHON_SERVER_ERROR') {
    statusCode = 503;
    message = 'External service unavailable';
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON payload';
  } else if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong';
    details = null;
  }

  const errorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  if (details) {
    errorResponse.details = details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;