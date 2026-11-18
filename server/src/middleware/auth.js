import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

// protect: the user must send "Authorization: Bearer <token>".
export async function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authorised: no token');

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET); // checks signature AND expiry
  } catch {
    throw new ApiError(401, 'Not authorised: invalid or expired token');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'Not authorised: user no longer exists');
  req.user = user;
  next();
}

// adminOnly: must run AFTER protect.
export function adminOnly(req, _res, next) {
  if (req.user?.role !== 'admin') throw new ApiError(403, 'Admin access only');
  next();
}
