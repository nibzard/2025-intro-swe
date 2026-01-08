const logger = require('../utils/logger');

// Not Found Error
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.id
  });

  // Determine status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Response format
  const response = {
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    response.message = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json(response);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    response.message = `${field} već postoji`;
    return res.status(400).json(response);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    response.message = 'Nevažeći token';
    return res.status(401).json(response);
  }

  if (err.name === 'TokenExpiredError') {
    response.message = 'Token je istekao';
    return res.status(401).json(response);
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      response.message = 'File je prevelik';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      response.message = 'Previše fileova';
    } else {
      response.message = 'Greška pri uploadu filea';
    }
    return res.status(400).json(response);
  }

  // Default error
  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };