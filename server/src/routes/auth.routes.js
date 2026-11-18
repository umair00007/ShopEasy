import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerRules, loginRules, forgotRules, resetRules } from '../validators/auth.validators.js';

const router = Router();

// Slows down password-guessing: max 20 attempts per 15 minutes per IP.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, message: { success: false, message: 'Too many attempts, try again later' } });

router.post('/register', authLimiter, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.post('/forgot-password', authLimiter, forgotRules, validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetRules, validate, resetPassword);
router.get('/me', protect, getMe);

export default router;
