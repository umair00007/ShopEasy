import { body } from 'express-validator';

export const checkoutRules = [
  body('items').isArray({ min: 1 }).withMessage('Your cart is empty'),
  body('items.*.productId').isMongoId().withMessage('Invalid product'),
  body('items.*.quantity').isInt({ min: 1, max: 10000 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.phone').trim().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  body('shippingAddress.line1').trim().notEmpty().withMessage('Address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.postalCode').trim().matches(/^\d{6}$/).withMessage('Enter a valid 6-digit PIN code'),
];

export const verifyRules = [
  body('razorpay_order_id').isString().notEmpty(),
  body('razorpay_payment_id').isString().notEmpty(),
  body('razorpay_signature').isString().notEmpty(),
];
