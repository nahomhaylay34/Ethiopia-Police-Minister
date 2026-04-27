const AppError = require('../utils/AppError');

const sendErrorDev = (err, req, res) => {
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    error: err,
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    stack: err.stack
  });
};

const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    });
  }
  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Something went very wrong!',
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'SequelizeValidationError') error = new AppError(error.errors[0].message, 400);
    if (error.name === 'SequelizeUniqueConstraintError') error = new AppError('Duplicate field value: Please use another value!', 400);
    if (error.name === 'JsonWebTokenError') error = new AppError('Invalid token. Please log in again!', 401);
    if (error.name === 'TokenExpiredError') error = new AppError('Your token has expired! Please log in again.', 401);

    sendErrorProd(error, req, res);
  }
};
