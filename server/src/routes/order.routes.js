import { Router } from 'express';
import { createCheckout, verifyPayment, getMyOrders, getOrder } from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkoutRules, verifyRules } from '../validators/order.validators.js';

const router = Router();
router.use(protect); // every order route needs login

router.post('/checkout', checkoutRules, validate, createCheckout);
router.post('/verify', verifyRules, validate, verifyPayment);
router.get('/mine', getMyOrders);
router.get('/:id', getOrder);

export default router;
