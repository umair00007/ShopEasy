import { isProd } from '../config/env.js';

// Central error handler. Express recognises it as an error handler because it
// takes FOUR arguments. Every error in the app ends up here, so all error
// responses have the same JSON shape: { success: false, message, details? }.
// Express 5 also forwards errors thrown inside async route handlers here
// automatically, so we don't need try/catch in every controller.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  // Mongoose: invalid ObjectId, e.g. /api/products/abc
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Mongoose: schema validation failed
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }
  // MongoDB: unique index violated (e.g. email already registered)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `${field || 'Value'} already exists`;
  }
  // Multer: file too large / too many files
  if (err.name === 'MulterError') {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Each image must be 5 MB or smaller' : err.message;
  }
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in request body';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    // Never leak internal error messages / stack traces to users in production.
    message: status >= 500 && isProd ? 'Internal server error' : message,
    ...(details && { details }),
    ...(!isProd && status >= 500 && { stack: err.stack }),
  });
}
