import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Put after a list of express-validator rules. Stops the request with 400 if any rule failed.
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  throw new ApiError(400, details[0].message, details);
}
