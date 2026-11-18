import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// The token payload holds only the user id. It is signed (not encrypted), so anyone can READ it.
// Never put secrets in it.
export const generateToken = (userId) =>
  jwt.sign({ id: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
