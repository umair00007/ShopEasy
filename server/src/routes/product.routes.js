import { Router } from 'express';
import { getProducts, getCategories, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { productRules } from '../validators/product.validators.js';

const router = Router();

router.get('/', getProducts);
router.get('/categories', getCategories); // must be BEFORE '/:id' or "categories" would be read as an id
router.get('/:id', getProduct);

// Order matters: who are you? → are you admin? → parse the files → validate the fields.
router.post('/', protect, adminOnly, uploadImages, productRules, validate, createProduct);
router.put('/:id', protect, adminOnly, uploadImages, productRules, validate, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

export default router;
