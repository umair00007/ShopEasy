import { body } from 'express-validator';
import { CATEGORIES } from '../models/Product.js';

// Fields arrive as strings (multipart/form-data), so we check them as numbers here.
export const productRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a number ≥ 0'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a whole number ≥ 0'),
  body('category').isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('brand').optional().trim().isLength({ max: 60 }),
];
