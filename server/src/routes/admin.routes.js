import { Router } from 'express';
import { body } from 'express-validator';
import { getStats, listOrders, updateOrderStatus } from '../controllers/admin.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ORDER_STATUSES } from '../models/Order.js';

const router = Router();
router.use(protect, adminOnly); // every route below is admin-only

router.get('/stats', getStats);
router.get('/orders', listOrders);
router.put('/orders/:id/status', body('status').isIn(ORDER_STATUSES).withMessage('Invalid status'), validate, updateOrderStatus);

export default router;
