import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { sendEmail } from '../utils/sendEmail.js';
import { generateToken } from '../utils/generateToken.js';

const sendAuth = (res, status, user) =>
  res.status(status).json({ success: true, token: generateToken(user._id), user });

// POST /api/auth/register
// Role is NEVER taken from the request body, otherwise anyone could register as admin.
export async function register(req, res) {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');
  const user = await User.create({ name, email, password });
  sendAuth(res, 201, user);
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password'); // we need the hash to compare
  // Same message for "no such user" and "wrong password" so attackers can't discover which emails exist.
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  sendAuth(res, 200, user);
}

// GET /api/auth/me  (protected)
export async function getMe(req, res) {
  res.json({ success: true, user: req.user });
}

// POST /api/auth/forgot-password
// Always answers the same way, whether or not the email exists (no user enumeration).
export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const raw = user.createResetToken();
    await user.save({ validateBeforeSave: false });
    const link = `${env.CLIENT_URL}/reset-password/${raw}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your Shabbir Traders password',
        text: `Hi ${user.name},\n\nReset your password using this link (valid for 15 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
      });
    } catch (err) {
      // Don't leave a usable token behind if the email failed.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send failed:', err.message);
      throw new ApiError(500, 'Could not send reset email. Try again later.');
    }
  }
  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
}

// POST /api/auth/reset-password/:token
export async function resetPassword(req, res) {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashed, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  user.password = req.body.password; // the pre-save hook hashes it
  user.resetPasswordToken = undefined; // single use
  user.resetPasswordExpires = undefined;
  await user.save();
  sendAuth(res, 200, user); // log them straight in
}
