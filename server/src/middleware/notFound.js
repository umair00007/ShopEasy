import { ApiError } from '../utils/ApiError.js';

// Runs when no route matched → 404 instead of Express's default HTML page.
export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}
