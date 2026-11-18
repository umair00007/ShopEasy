import { body } from 'express-validator';

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotRules = [body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail()];

export const resetRules = [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')];
