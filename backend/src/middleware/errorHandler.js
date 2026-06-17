const ApiError = require('../utils/apiError');

function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, _req, res, _next) {
  const statusCode =
    err.statusCode ||
    (err.name === 'ValidationError' ? 422 : undefined) ||
    (err.name === 'MulterError' ? 400 : 500);

  const payload = {
    message: err.message || 'Something went wrong',
  };

  if (err.details) {
    payload.details = err.details;
  }

  if (err.name === 'ValidationError') {
    payload.details = Object.values(err.errors).map((item) => item.message);
  }

  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    payload.message = 'Report file must be 10MB or smaller';
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
