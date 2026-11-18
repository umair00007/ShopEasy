import { Router } from 'express';
import { previewCart, getCart, setCart, mergeCart } from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.post('/preview', previewCart);
router.get('/', protect, getCart);
router.put('/', protect, setCart);
router.post('/merge', protect, mergeCart);

export default router;
