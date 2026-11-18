import mongoose from 'mongoose';

export const CATEGORIES = ['Sanitaryware', 'Bath Fittings', 'Pipes & Fittings', 'Water Tanks', 'Wires & Cables', 'Lighting', 'Electricals', 'Building Materials'];

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    description: { type: String, required: [true, 'Description is required'], trim: true, maxlength: 2000 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    category: { type: String, required: [true, 'Category is required'], enum: CATEGORIES },
    brand: { type: String, trim: true, default: '' },
    stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
    // S3 object keys (e.g. "products/uuid.jpg"), NOT full URLs. The API turns keys into pre-signed URLs.
    images: [{ type: String }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    numReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes make filters/sorts fast (explained properly in Phase 4).
productSchema.index({ category: 1, price: 1 });
productSchema.index({ createdAt: -1 });

export default mongoose.model('Product', productSchema);
