import Razorpay from 'razorpay';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';

let client;
// Created lazily so the server still starts (and the store still browses) without payment keys.
export function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, 'Payments are not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing in server/.env)');
  }
  client ??= new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return client;
}
